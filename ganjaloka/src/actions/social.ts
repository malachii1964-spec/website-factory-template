"use server";

import { refresh } from "next/cache";
import { type ActionResult, fail, fromDbError, ok } from "@/lib/errors";
import { getViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation";

export async function setFollow(profileId: string, follow: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(profileId).success) return fail("GL_PROFILE_UNAVAILABLE");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");
  if (viewer.id === profileId) return fail("GL_INVALID_ACTION");

  const supabase = await createClient();
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: viewer.id, followee_id: profileId })
    : await supabase.from("follows").delete().eq("follower_id", viewer.id).eq("followee_id", profileId);
  if (error && error.code !== "23505") return fromDbError(error);
  refresh();
  return ok();
}

export async function setBlock(profileId: string, block: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(profileId).success) return fail("GL_PROFILE_UNAVAILABLE");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");
  if (viewer.id === profileId) return fail("GL_INVALID_ACTION");

  const supabase = await createClient();
  const { error } = block
    ? await supabase.from("blocks").insert({ blocker_id: viewer.id, blocked_id: profileId })
    : await supabase.from("blocks").delete().eq("blocker_id", viewer.id).eq("blocked_id", profileId);
  if (error && error.code !== "23505") return fromDbError(error);
  refresh();
  return ok();
}
