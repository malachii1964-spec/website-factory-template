"use server";

/**
 * Grow journal persistence. Every function here re-checks the session and
 * scopes its query by userId — a grow id in a URL is not authorisation, so
 * ownership is proved on the server for every read and every write.
 *
 * The schedule is never stored; see grow-journal.ts for why.
 */

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { grow, growEventDone } from "@/db/schema";
import { METHOD_EVENTS } from "@/lib/canucks-method";
import {
  defaultGrowName,
  getMethod,
  MAX_PLANTS,
  normalisePlants,
  normalisePotGallons,
  POT_SIZES,
} from "@/lib/grow-journal";
import { getSessionUser } from "@/lib/session";

const idSchema = z.string().uuid();

const startSchema = z.object({
  methodSlug: z.string().regex(/^[a-z0-9-]+$/),
  potGallons: z.coerce.number().refine((n) => (POT_SIZES as readonly number[]).includes(n)),
  plants: z.coerce.number().int().min(1).max(MAX_PLANTS),
  // <input type="date"> value; empty means "today".
  startedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  name: z.string().trim().max(80).optional(),
});

export type GrowRecord = {
  id: string;
  methodSlug: string;
  name: string;
  potGallons: number;
  plants: number;
  startedOn: Date;
};

export type GrowDetail = GrowRecord & { doneEventIds: string[] };

export async function listGrows(): Promise<GrowRecord[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return db
    .select({
      id: grow.id,
      methodSlug: grow.methodSlug,
      name: grow.name,
      potGallons: grow.potGallons,
      plants: grow.plants,
      startedOn: grow.startedOn,
    })
    .from(grow)
    .where(eq(grow.userId, user.id))
    .orderBy(desc(grow.createdAt));
}

export async function getGrow(rawId: string): Promise<GrowDetail | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) return null;

  const rows = await db
    .select({
      id: grow.id,
      methodSlug: grow.methodSlug,
      name: grow.name,
      potGallons: grow.potGallons,
      plants: grow.plants,
      startedOn: grow.startedOn,
    })
    .from(grow)
    // Scoped by userId, so another member's id simply does not exist here.
    .where(and(eq(grow.id, parsed.data), eq(grow.userId, user.id)));

  const found = rows[0];
  if (!found) return null;

  const done = await db
    .select({ eventId: growEventDone.eventId })
    .from(growEventDone)
    .where(eq(growEventDone.growId, found.id));

  return { ...found, doneEventIds: done.map((d) => d.eventId) };
}

/** Creates a journal and returns its id, or null if the caller is signed out. */
export async function startGrow(input: unknown): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return null;

  const method = getMethod(parsed.data.methodSlug);
  if (!method) return null;

  // Parse at local noon so a timezone offset cannot shift the calendar day.
  const startedOn = parsed.data.startedOn
    ? new Date(`${parsed.data.startedOn}T12:00:00`)
    : new Date();
  if (Number.isNaN(startedOn.getTime())) return null;

  const id = randomUUID();
  await db.insert(grow).values({
    id,
    userId: user.id,
    methodSlug: method.slug,
    name: parsed.data.name?.trim() || defaultGrowName(method, startedOn),
    potGallons: normalisePotGallons(parsed.data.potGallons),
    plants: normalisePlants(parsed.data.plants),
    startedOn,
  });

  revalidatePath("/grows");
  revalidatePath("/account");
  return id;
}

/**
 * Form-action wrapper for startGrow. Always redirects: to the new journal on
 * success, or to /grows on a rejected submission — /grows enforces its own
 * auth redirect, so a signed-out post lands on the login page rather than
 * failing silently on the form.
 */
export async function startGrowFromForm(formData: FormData): Promise<never> {
  const id = await startGrow({
    methodSlug: formData.get("methodSlug"),
    potGallons: formData.get("potGallons"),
    plants: formData.get("plants"),
    startedOn: formData.get("startedOn") ?? "",
  });
  redirect(id ? `/grows/${id}` : "/grows");
}

export async function toggleGrowEvent(
  rawGrowId: string,
  rawEventId: string,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const growId = idSchema.safeParse(rawGrowId);
  if (!growId.success) return;
  // Only ids the method actually defines — never trust the posted value.
  if (!METHOD_EVENTS.some((e) => e.id === rawEventId)) return;

  const owned = await db
    .select({ id: grow.id })
    .from(grow)
    .where(and(eq(grow.id, growId.data), eq(grow.userId, user.id)));
  if (owned.length === 0) return;

  const existing = await db
    .select({ eventId: growEventDone.eventId })
    .from(growEventDone)
    .where(
      and(
        eq(growEventDone.growId, growId.data),
        eq(growEventDone.eventId, rawEventId),
      ),
    );

  if (existing.length > 0) {
    await db
      .delete(growEventDone)
      .where(
        and(
          eq(growEventDone.growId, growId.data),
          eq(growEventDone.eventId, rawEventId),
        ),
      );
  } else {
    // Two tabs can both reach the insert; the PK conflict is a no-op, not a 500.
    await db
      .insert(growEventDone)
      .values({ growId: growId.data, eventId: rawEventId })
      .onConflictDoNothing();
  }

  revalidatePath(`/grows/${growId.data}`);
  revalidatePath("/grows");
}

export async function deleteGrow(rawId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) return;

  // Completions cascade via the foreign key.
  await db
    .delete(grow)
    .where(and(eq(grow.id, parsed.data), eq(grow.userId, user.id)));

  revalidatePath("/grows");
  revalidatePath("/account");
}
