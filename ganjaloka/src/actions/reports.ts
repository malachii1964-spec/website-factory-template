"use server";

import { refresh } from "next/cache";
import { type ActionResult, fail, fromDbError, ok } from "@/lib/errors";
import { getViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, moderationSchema, reportSchema } from "@/lib/validation";

export async function fileReport(input: unknown): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return fail("VALIDATION", Object.values(fields)[0], fields);
  }
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");

  const { targetType, targetId, reason, details } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    target_type: targetType,
    post_id: targetType === "post" ? targetId : null,
    profile_id: targetType === "profile" ? targetId : null,
    reason,
    details,
  });
  if (error) {
    if (error.code === "23505") {
      return fail("ALREADY_DONE", "You already reported this. Moderators will review it.");
    }
    return fromDbError(error);
  }
  return ok();
}

export async function moderate(input: unknown): Promise<ActionResult> {
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION");
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_report", {
    p_report_id: parsed.data.reportId,
    p_action: parsed.data.action,
    p_note: parsed.data.note,
  });
  if (error) return fromDbError(error);
  refresh();
  return ok();
}
