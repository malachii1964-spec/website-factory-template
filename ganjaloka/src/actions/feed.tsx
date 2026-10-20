"use server";

import type { ReactNode } from "react";
import { z } from "zod";
import { FeedItemCard, PostCard } from "@/components/post/post-card";
import { getFeed, getReplies, getViewer } from "@/lib/queries";

const feedKind = z.discriminatedUnion("type", [
  z.object({ type: z.literal("home") }),
  z.object({ type: z.literal("explore") }),
  z.object({ type: z.literal("profile"), profileId: z.uuid() }),
  z.object({ type: z.literal("thread"), postId: z.uuid() }),
]);

export type LoadableFeed = z.infer<typeof feedKind>;

/** Next page of a feed, rendered on the server (no post-card JS shipped). */
export async function loadFeedPage(
  kind: LoadableFeed,
  cursor: string,
): Promise<{ node: ReactNode; nextCursor: string | null }> {
  const parsed = feedKind.safeParse(kind);
  if (!parsed.success) return { node: null, nextCursor: null };
  const viewer = await getViewer();

  if (parsed.data.type === "thread") {
    const { replies, nextCursor } = await getReplies(parsed.data.postId, cursor);
    return {
      node: replies.map((post) => <PostCard key={post.id} post={post} viewer={viewer} />),
      nextCursor,
    };
  }

  const page = await getFeed(parsed.data, cursor);
  return {
    node: page.items.map((item) => <FeedItemCard key={item.key} item={item} viewer={viewer} />),
    nextCursor: page.nextCursor,
  };
}
