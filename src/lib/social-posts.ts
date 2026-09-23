"use server";

/**
 * Community post persistence: create, feed queries, reporting. Reads never
 * trust a caller-supplied userId for anything but public display; writes
 * always re-check the session.
 */

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { post, postMedia, postReport, socialProfile, user } from "@/db/schema";
import { getStrain } from "@/lib/strains";
import {
  isValidStageId,
  shouldAutoHide,
  type PassportSourcePost,
} from "@/lib/social-logic";
import { getOrCreateOwnProfile, getFollowingIds } from "@/lib/social-profiles";
import { getSessionUser } from "@/lib/session";
import {
  isMissingSocialTable,
  SocialTablesMissingError,
} from "@/lib/social-errors";

const MAX_MEDIA_PER_POST = 10;

const mediaInputSchema = z.object({
  kind: z.enum(["photo", "video"]),
  url: z.string().url(),
});

const createPostSchema = z.object({
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  stage: z.string().optional().or(z.literal("")),
  strainName: z.string().trim().max(80).optional().or(z.literal("")),
  media: z.array(mediaInputSchema).max(MAX_MEDIA_PER_POST).optional(),
});

export type FeedPost = {
  id: string;
  body: string | null;
  stage: string | null;
  strainName: string | null;
  strainSlug: string | null;
  createdAt: Date;
  authorUserId: string;
  authorHandle: string;
  authorName: string;
  authorImage: string | null;
  media: { id: string; kind: string; url: string }[];
};

export type CreatePostResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** A post needs at least a caption or one piece of media — never neither. */
export async function createPost(input: unknown): Promise<CreatePostResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { ok: false, error: "Sign in required." };

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid post." };

  const body = parsed.data.body?.trim() || null;
  const media = parsed.data.media ?? [];
  if (!body && media.length === 0) {
    return { ok: false, error: "Add a caption or at least one photo/video." };
  }

  const stage =
    parsed.data.stage && isValidStageId(parsed.data.stage)
      ? parsed.data.stage
      : null;

  const rawStrainName = parsed.data.strainName?.trim() || null;
  const matched = rawStrainName
    ? getStrain(rawStrainName.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    : undefined;
  const strainSlug = matched?.slug ?? null;
  const strainName = matched?.name ?? rawStrainName;

  await getOrCreateOwnProfile(); // ensure a handle exists before the first post

  const id = randomUUID();
  try {
    await db.insert(post).values({
      id,
      userId: sessionUser.id,
      body,
      stage,
      strainName,
      strainSlug,
    });

    if (media.length > 0) {
      await db.insert(postMedia).values(
        media.map((m, i) => ({
          id: randomUUID(),
          postId: id,
          kind: m.kind,
          url: m.url,
          position: i,
        })),
      );
    }
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }

  revalidatePath("/community/feed");
  return { ok: true, id };
}

const authorSelect = {
  id: post.id,
  body: post.body,
  stage: post.stage,
  strainName: post.strainName,
  strainSlug: post.strainSlug,
  createdAt: post.createdAt,
  authorUserId: user.id,
  authorHandle: socialProfile.handle,
  authorName: user.name,
  authorImage: user.image,
} as const;

async function attachMedia(
  posts: Omit<FeedPost, "media">[],
): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const mediaRows = await db
    .select({
      id: postMedia.id,
      postId: postMedia.postId,
      kind: postMedia.kind,
      url: postMedia.url,
    })
    .from(postMedia)
    .where(
      inArray(
        postMedia.postId,
        posts.map((p) => p.id),
      ),
    )
    .orderBy(postMedia.position);

  const byPost = new Map<string, FeedPost["media"]>();
  for (const m of mediaRows) {
    const list = byPost.get(m.postId) ?? [];
    list.push({ id: m.id, kind: m.kind, url: m.url });
    byPost.set(m.postId, list);
  }
  return posts.map((p) => ({ ...p, media: byPost.get(p.id) ?? [] }));
}

const PAGE_SIZE = 20;

/**
 * The public "Latest" firehose — every visible post, newest first. Signed
 * out or brand-new users see this by default since a following-only feed
 * would otherwise start empty.
 */
export async function getLatestFeed(cursor = 0): Promise<FeedPost[]> {
  try {
    const rows = await db
      .select(authorSelect)
      .from(post)
      .innerJoin(user, eq(user.id, post.userId))
      .innerJoin(socialProfile, eq(socialProfile.userId, post.userId))
      .where(eq(post.moderationStatus, "visible"))
      .orderBy(desc(post.createdAt))
      .limit(PAGE_SIZE)
      .offset(cursor);
    return attachMedia(rows);
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}

/** Posts from accounts the signed-in user follows. Empty when signed out. */
export async function getFollowingFeed(cursor = 0): Promise<FeedPost[]> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];
  const followingIds = await getFollowingIds(sessionUser.id);
  if (followingIds.length === 0) return [];

  try {
    const rows = await db
      .select(authorSelect)
      .from(post)
      .innerJoin(user, eq(user.id, post.userId))
      .innerJoin(socialProfile, eq(socialProfile.userId, post.userId))
      .where(
        and(
          eq(post.moderationStatus, "visible"),
          inArray(post.userId, followingIds),
        ),
      )
      .orderBy(desc(post.createdAt))
      .limit(PAGE_SIZE)
      .offset(cursor);
    return attachMedia(rows);
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}

export async function getUserFeed(userId: string): Promise<FeedPost[]> {
  try {
    const rows = await db
      .select(authorSelect)
      .from(post)
      .innerJoin(user, eq(user.id, post.userId))
      .innerJoin(socialProfile, eq(socialProfile.userId, post.userId))
      .where(and(eq(post.moderationStatus, "visible"), eq(post.userId, userId)))
      .orderBy(desc(post.createdAt));
    return attachMedia(rows);
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}

/** Source rows for buildStrainPassport() — a user's visible strain-tagged posts. */
export async function getPassportSourcePosts(
  userId: string,
): Promise<PassportSourcePost[]> {
  const posts = await getUserFeed(userId);
  return posts.map((p) => ({
    strainSlug: p.strainSlug,
    strainName: p.strainName,
    createdAt: p.createdAt,
    coverMediaUrl: p.media.find((m) => m.kind === "photo")?.url ?? null,
  }));
}

export type ReportResult =
  | { ok: true; autoHidden: boolean }
  | { ok: false; error: string };

const reasonSchema = z.string().trim().min(1).max(200);

export async function reportPost(
  postId: string,
  rawReason: string,
): Promise<ReportResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { ok: false, error: "Sign in required." };

  const reason = reasonSchema.safeParse(rawReason);
  if (!reason.success) return { ok: false, error: "Tell us what's wrong." };

  const idParsed = z.string().uuid().safeParse(postId);
  if (!idParsed.success) return { ok: false, error: "Invalid post." };

  try {
    await db
      .insert(postReport)
      .values({
        postId: idParsed.data,
        reporterId: sessionUser.id,
        reason: reason.data,
      })
      .onConflictDoNothing();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postReport)
      .where(eq(postReport.postId, idParsed.data));

    const autoHidden = shouldAutoHide(count);
    if (autoHidden) {
      await db
        .update(post)
        .set({ moderationStatus: "hidden_pending_review" })
        .where(eq(post.id, idParsed.data));
    }

    revalidatePath("/community/feed");
    return { ok: true, autoHidden };
  } catch (err) {
    if (isMissingSocialTable(err)) throw new SocialTablesMissingError();
    throw err;
  }
}
