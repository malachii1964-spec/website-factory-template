"use server";

/**
 * Community profile + follow persistence. Every function re-checks the
 * session and scopes writes by the session's own userId — a handle or user
 * id in a URL is not authorisation.
 */

import { and, eq, ne, sql, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { follow, socialProfile, user } from "@/db/schema";
import { isValidHandle, slugifyHandle } from "@/lib/social-logic";
import { getSessionUser } from "@/lib/session";
import {
  isMissingSocialTable,
  SocialTablesMissingError,
} from "@/lib/social-errors";

export type PublicProfile = {
  userId: string;
  handle: string;
  name: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  bannerUrl: string | null;
  followerCount: number;
  followingCount: number;
};

async function generateUniqueHandle(seed: string): Promise<string> {
  const base = slugifyHandle(seed);
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`.slice(0, 20);
    const existing = await db
      .select({ userId: socialProfile.userId })
      .from(socialProfile)
      .where(eq(socialProfile.handle, candidate));
    if (existing.length === 0) return candidate;
  }
  // Astronomically unlikely fallback: base is 3-20 chars, so this still fits.
  return `${base.slice(0, 12)}${Date.now().toString(36).slice(-8)}`;
}

/**
 * Ensures the signed-in user has a community profile, creating one with an
 * auto-generated handle on first visit. Returns null when signed out.
 */
export async function getOrCreateOwnProfile(): Promise<PublicProfile | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  try {
    const existing = await loadProfile(
      eq(socialProfile.userId, sessionUser.id),
    );
    if (existing) return existing;

    const handle = await generateUniqueHandle(
      sessionUser.name || sessionUser.email,
    );
    await db
      .insert(socialProfile)
      .values({ userId: sessionUser.id, handle })
      .onConflictDoNothing();

    const created = await loadProfile(eq(socialProfile.userId, sessionUser.id));
    if (!created)
      throw new Error("Profile creation raced and produced no row.");
    return created;
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}

export async function getProfileByHandle(
  rawHandle: string,
): Promise<PublicProfile | null> {
  const handle = rawHandle.toLowerCase();
  if (!isValidHandle(handle)) return null;
  try {
    return await loadProfile(eq(socialProfile.handle, handle));
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}

async function loadProfile(where: SQL): Promise<PublicProfile | null> {
  const rows = await db
    .select({
      userId: socialProfile.userId,
      handle: socialProfile.handle,
      bio: socialProfile.bio,
      location: socialProfile.location,
      bannerUrl: socialProfile.bannerUrl,
      name: user.name,
      image: user.image,
    })
    .from(socialProfile)
    .innerJoin(user, eq(user.id, socialProfile.userId))
    .where(where);
  const found = rows[0];
  if (!found) return null;

  const [{ count: followerCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follow)
    .where(eq(follow.followingId, found.userId));
  const [{ count: followingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follow)
    .where(eq(follow.followerId, found.userId));

  return { ...found, followerCount, followingCount };
}

const updateSchema = z.object({
  handle: z.string().toLowerCase().refine(isValidHandle),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
});

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateOwnProfile(
  input: unknown,
): Promise<UpdateProfileResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { ok: false, error: "Sign in required." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Handle must be 3-20 lowercase letters, digits, or underscores.",
    };
  }

  const { handle, bio, location } = parsed.data;
  const clash = await db
    .select({ userId: socialProfile.userId })
    .from(socialProfile)
    .where(
      and(
        eq(socialProfile.handle, handle),
        ne(socialProfile.userId, sessionUser.id),
      ),
    );
  if (clash.length > 0) {
    return { ok: false, error: "That handle is already taken." };
  }

  await db
    .update(socialProfile)
    .set({
      handle,
      bio: bio || null,
      location: location || null,
      updatedAt: new Date(),
    })
    .where(eq(socialProfile.userId, sessionUser.id));

  revalidatePath(`/community/u/${handle}`);
  revalidatePath("/community/settings");
  return { ok: true };
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.id === targetUserId) return false;
  const rows = await db
    .select({ followerId: follow.followerId })
    .from(follow)
    .where(
      and(
        eq(follow.followerId, sessionUser.id),
        eq(follow.followingId, targetUserId),
      ),
    );
  return rows.length > 0;
}

/** Toggles the follow relationship. No-op if signed out or targeting self. */
export async function toggleFollow(targetUserId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.id === targetUserId) return;

  const existing = await db
    .select({ followerId: follow.followerId })
    .from(follow)
    .where(
      and(
        eq(follow.followerId, sessionUser.id),
        eq(follow.followingId, targetUserId),
      ),
    );

  if (existing.length > 0) {
    await db
      .delete(follow)
      .where(
        and(
          eq(follow.followerId, sessionUser.id),
          eq(follow.followingId, targetUserId),
        ),
      );
  } else {
    await db
      .insert(follow)
      .values({ followerId: sessionUser.id, followingId: targetUserId })
      .onConflictDoNothing();
  }

  const target = await db
    .select({ handle: socialProfile.handle })
    .from(socialProfile)
    .where(eq(socialProfile.userId, targetUserId));
  if (target[0]) revalidatePath(`/community/u/${target[0].handle}`);
  revalidatePath("/community/feed");
}

/** Following-set for feed filtering. Empty for signed-out visitors. */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ followingId: follow.followingId })
    .from(follow)
    .where(eq(follow.followerId, userId));
  return rows.map((r) => r.followingId);
}
