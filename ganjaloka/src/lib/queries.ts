import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { decodeCursor, encodeCursor, type FeedCursor } from "@/lib/cursor";

export const PAGE_SIZE = 20;

export type Author = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};

export type MediaItem = { path: string; w: number; h: number; alt: string };

export type PostView = {
  id: string;
  kind: "post" | "reply";
  author: Author;
  body: string;
  media: MediaItem[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
  createdAt: string;
  removed: boolean;
  /** For replies: the parent's author, or "unavailable" when deleted/hidden. */
  replyingTo: { postId: string; username: string } | "unavailable" | null;
  viewerLiked: boolean;
  viewerReposted: boolean;
};

export type FeedItem = {
  key: string;
  repostedBy: Author | null;
  /** null when a repost's original is no longer visible. */
  post: PostView | null;
};

export type FeedPage = { items: FeedItem[]; nextCursor: string | null };

export type Viewer = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  role: "member" | "moderator" | "admin";
  suspended: boolean;
};

type RawPost = {
  id: string;
  kind: string;
  body: string;
  media: unknown;
  like_count: number;
  reply_count: number;
  repost_count: number;
  created_at: string;
  removed_at: string | null;
  reply_to_id: string | null;
  repost_of_id: string | null;
  author: Author | null;
  reply_to: { id: string; author: { username: string } | null } | null;
  repost_of?: RawPost | null;
};

const AUTHOR = "id, username, display_name, avatar_path";
const POST_FIELDS = `id, kind, body, media, like_count, reply_count, repost_count, created_at, removed_at, reply_to_id, repost_of_id, author:profiles!posts_author_id_fkey(${AUTHOR}), reply_to:posts!posts_reply_to_id_fkey(id, author:profiles!posts_author_id_fkey(username))`;
const FEED_SELECT = `${POST_FIELDS}, repost_of:posts!posts_repost_of_id_fkey(${POST_FIELDS})`;

function toMedia(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const m = item as Partial<MediaItem>;
    return typeof m.path === "string" && typeof m.w === "number" && typeof m.h === "number"
      ? [{ path: m.path, w: m.w, h: m.h, alt: typeof m.alt === "string" ? m.alt : "" }]
      : [];
  });
}

function toPostView(raw: RawPost, liked: Set<string>, reposted: Set<string>): PostView | null {
  if (!raw.author) return null;
  const isReply = raw.kind === "reply";
  return {
    id: raw.id,
    kind: isReply ? "reply" : "post",
    author: raw.author,
    body: raw.body,
    media: toMedia(raw.media),
    likeCount: raw.like_count,
    replyCount: raw.reply_count,
    repostCount: raw.repost_count,
    createdAt: raw.created_at,
    removed: raw.removed_at !== null,
    replyingTo: !isReply
      ? null
      : raw.reply_to?.author
        ? { postId: raw.reply_to.id, username: raw.reply_to.author.username }
        : "unavailable",
    viewerLiked: liked.has(raw.id),
    viewerReposted: reposted.has(raw.id),
  };
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, role, suspended_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarPath: profile.avatar_path,
    role: profile.role as Viewer["role"],
    suspended: profile.suspended_at !== null,
  };
});

/** Turn raw rows (posts and reposts) into feed items with the viewer's state. */
async function hydrate(rows: RawPost[]): Promise<FeedItem[]> {
  const viewer = await getViewer();
  const subjects = rows.map((r) => (r.kind === "repost" ? r.repost_of?.id : r.id)).filter(Boolean) as string[];
  const liked = new Set<string>();
  const reposted = new Set<string>();

  if (viewer && subjects.length > 0) {
    const supabase = await createClient();
    const [likes, reposts] = await Promise.all([
      supabase.from("likes").select("post_id").eq("member_id", viewer.id).in("post_id", subjects),
      supabase
        .from("posts")
        .select("repost_of_id")
        .eq("author_id", viewer.id)
        .eq("kind", "repost")
        .in("repost_of_id", subjects),
    ]);
    likes.data?.forEach((l) => liked.add(l.post_id));
    reposts.data?.forEach((r) => r.repost_of_id && reposted.add(r.repost_of_id));
  }

  return rows.map((row) => {
    if (row.kind === "repost") {
      return {
        key: row.id,
        repostedBy: row.author,
        post: row.repost_of ? toPostView(row.repost_of, liked, reposted) : null,
      };
    }
    return { key: row.id, repostedBy: null, post: toPostView(row, liked, reposted) };
  });
}

function nextCursorFrom(rows: RawPost[], limit: number): string | null {
  const last = rows.at(-1);
  return rows.length >= limit && last ? encodeCursor({ at: last.created_at, id: last.id }) : null;
}

export type FeedKind = { type: "home" } | { type: "explore" } | { type: "profile"; profileId: string };

export async function getFeed(kind: FeedKind, cursorParam?: string | null): Promise<FeedPage> {
  const supabase = await createClient();
  const cursor: FeedCursor | null = decodeCursor(cursorParam);
  const page = { p_before_at: cursor?.at, p_before_id: cursor?.id, p_limit: PAGE_SIZE };

  const query =
    kind.type === "home"
      ? supabase.rpc("home_feed", page)
      : kind.type === "explore"
        ? supabase.rpc("explore_feed", page)
        : supabase.rpc("profile_feed", { ...page, p_profile_id: kind.profileId });

  const { data, error } = await query.select(FEED_SELECT);
  if (error) throw error;
  const rows = (data ?? []) as unknown as RawPost[];
  return { items: await hydrate(rows), nextCursor: nextCursorFrom(rows, PAGE_SIZE) };
}

export async function getPost(id: string): Promise<PostView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(FEED_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const raw = data as unknown as RawPost;
  if (raw.kind === "repost") return null;
  const [item] = await hydrate([raw]);
  return item?.post ?? null;
}

export async function getReplies(postId: string, afterParam?: string | null): Promise<{ replies: PostView[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const cursor = decodeCursor(afterParam);
  const { data, error } = await supabase
    .rpc("thread_replies", { p_post_id: postId, p_after_at: cursor?.at, p_after_id: cursor?.id, p_limit: 30 })
    .select(FEED_SELECT);
  if (error) throw error;
  const rows = (data ?? []) as unknown as RawPost[];
  const items = await hydrate(rows);
  return {
    replies: items.flatMap((i) => (i.post ? [i.post] : [])),
    nextCursor: nextCursorFrom(rows, 30),
  };
}

export type ProfilePage = {
  profile: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    avatarPath: string | null;
    followers: number;
    following: number;
    posts: number;
    joinedAt: string;
    suspended: boolean;
  };
  relationship: { following: boolean; followedBy: boolean; blocked: boolean; blockedBy: boolean };
};

export async function getProfile(username: string): Promise<ProfilePage | null> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path, followers_count, following_count, posts_count, created_at, suspended_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!p) return null;

  const viewer = await getViewer();
  let relationship = { following: false, followedBy: false, blocked: false, blockedBy: false };
  if (viewer && viewer.id !== p.id) {
    const { data: rel } = await supabase.rpc("viewer_relationship", { p_profile_id: p.id }).maybeSingle();
    if (rel) {
      relationship = {
        following: rel.following,
        followedBy: rel.followed_by,
        blocked: rel.blocked,
        blockedBy: rel.blocked_by,
      };
    }
  }

  return {
    profile: {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      bio: p.bio,
      avatarPath: p.avatar_path,
      followers: p.followers_count,
      following: p.following_count,
      posts: p.posts_count,
      joinedAt: p.created_at,
      suspended: p.suspended_at !== null,
    },
    relationship,
  };
}

export async function getNewestMembers(limit = 5): Promise<Author[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(AUTHOR)
    .is("suspended_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getBlockedProfiles(): Promise<Author[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select(`created_at, blocked:profiles!blocks_blocked_id_fkey(${AUTHOR})`)
    .eq("blocker_id", viewer.id)
    .order("created_at", { ascending: false });
  return (data ?? []).flatMap((row) => (row.blocked ? [row.blocked as Author] : []));
}

export type QueueReport = {
  id: string;
  reason: string;
  details: string;
  createdAt: string;
  targetType: "post" | "profile";
  postId: string | null;
  profileId: string | null;
  snapshot: Record<string, unknown>;
  reporter: string;
  targetAuthor: Author | null;
};

export async function getModerationQueue(): Promise<QueueReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      `id, reason, details, created_at, target_type, post_id, profile_id, target_snapshot,
       reporter:profiles!reports_reporter_id_fkey(username),
       profile:profiles!reports_profile_id_fkey(${AUTHOR}),
       post:posts!reports_post_id_fkey(author:profiles!posts_author_id_fkey(${AUTHOR}))`,
    )
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;

  const reports = (data ?? []).map((r) => {
    const post = r.post as { author: Author | null } | null;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      createdAt: r.created_at,
      targetType: r.target_type as "post" | "profile",
      postId: r.post_id,
      profileId: r.profile_id,
      snapshot: (r.target_snapshot ?? {}) as Record<string, unknown>,
      reporter: (r.reporter as { username: string } | null)?.username ?? "deleted member",
      targetAuthor: (r.profile as Author | null) ?? post?.author ?? null,
    };
  });
  // Child-safety reports always go first; then oldest first.
  return reports.sort(
    (a, b) => Number(b.reason === "minor_safety") - Number(a.reason === "minor_safety"),
  );
}
