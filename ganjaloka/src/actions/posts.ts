"use server";

import { refresh } from "next/cache";
import { type ActionResult, fail, fromDbError, ok } from "@/lib/errors";
import { checkContent } from "@/lib/moderation";
import { getViewer } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPostSchema, fieldErrors, uuid } from "@/lib/validation";

export async function createPost(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return fail("VALIDATION", Object.values(fields)[0], fields);
  }
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");
  if (viewer.suspended) return fail("GL_SUSPENDED");

  const { body, media, replyToId } = parsed.data;
  if (media.some((m) => !m.path.startsWith(`${viewer.id}/`))) return fail("GL_INVALID_MEDIA");

  const verdict = checkContent(body, ...media.map((m) => m.alt));
  if (!verdict.ok) return fail("CONTENT_BLOCKED", verdict.message);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: viewer.id, body, media, reply_to_id: replyToId ?? null })
    .select("id")
    .single();
  if (error) return fromDbError(error);

  refresh();
  return ok({ id: data.id });
}

export async function deletePost(postId: string): Promise<ActionResult> {
  if (!uuid.safeParse(postId).success) return fail("GL_NOT_FOUND");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, media, author_id")
    .eq("id", postId)
    .eq("author_id", viewer.id)
    .maybeSingle();
  if (!post) return fail("GL_NOT_FOUND");

  // Photos under an open report stay in storage as evidence (docs/06 §3).
  const admin = createAdminClient();
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("status", "open");

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return fromDbError(error);

  const paths = (Array.isArray(post.media) ? post.media : [])
    .map((m) => (m as { path?: unknown }).path)
    .filter((p): p is string => typeof p === "string" && p.startsWith(`${viewer.id}/`));
  if (paths.length > 0 && !count) await supabase.storage.from("post-media").remove(paths);

  refresh();
  return ok();
}

export async function setLike(postId: string, like: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(postId).success) return fail("GL_NOT_FOUND");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { error } = like
    ? await supabase.from("likes").insert({ member_id: viewer.id, post_id: postId })
    : await supabase.from("likes").delete().eq("member_id", viewer.id).eq("post_id", postId);
  if (error && error.code !== "23505") return fromDbError(error);
  return ok();
}

export async function setRepost(postId: string, repost: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(postId).success) return fail("GL_NOT_FOUND");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { error } = repost
    ? await supabase.from("posts").insert({ author_id: viewer.id, repost_of_id: postId })
    : await supabase
        .from("posts")
        .delete()
        .eq("author_id", viewer.id)
        .eq("kind", "repost")
        .eq("repost_of_id", postId);
  if (error && error.code !== "23505") return fromDbError(error);
  return ok();
}
