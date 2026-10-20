"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/actions/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { checkContent } from "@/lib/moderation";
import { getViewer } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: ERROR_MESSAGES.UNAUTHENTICATED };

  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  };
  const avatarRaw = String(formData.get("avatarPath") ?? "");
  const parsed = profileSchema.safeParse({ ...values, avatarPath: avatarRaw || null });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const { displayName, bio, avatarPath } = parsed.data;
  if (avatarPath && !avatarPath.startsWith(`${viewer.id}/`)) {
    return { error: ERROR_MESSAGES.GL_INVALID_MEDIA, values };
  }
  const verdict = checkContent(displayName, bio);
  if (!verdict.ok) return { error: verdict.message, values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, bio, avatar_path: avatarPath ?? null })
    .eq("id", viewer.id);
  if (error) return { error: ERROR_MESSAGES.UNKNOWN, values };

  // Remove the previous avatar file once the new one is saved.
  if (viewer.avatarPath && viewer.avatarPath !== avatarPath) {
    await supabase.storage.from("avatars").remove([viewer.avatarPath]);
  }

  refresh();
  return { notice: "Profile saved.", values };
}

async function listFolder(bucket: "avatars" | "post-media", folder: string): Promise<string[]> {
  const admin = createAdminClient();
  const paths: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data } = await admin.storage.from(bucket).list(folder, { limit: 100, offset });
    if (!data || data.length === 0) break;
    paths.push(...data.map((f) => `${folder}/${f.name}`));
    if (data.length < 100) break;
  }
  return paths;
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { fields: { confirm: "Type DELETE in capital letters to confirm." } };
  }
  const viewer = await getViewer();
  if (!viewer) return { error: ERROR_MESSAGES.UNAUTHENTICATED };

  const admin = createAdminClient();

  // Keep photos that are evidence in open reports (docs/06 §3); remove the rest.
  const { data: openReports } = await admin
    .from("reports")
    .select("target_snapshot")
    .eq("status", "open")
    .eq("target_snapshot->>author_id", viewer.id);
  const evidence = new Set(
    (openReports ?? []).flatMap((r) => {
      const media = (r.target_snapshot as { media?: Array<{ path?: string }> } | null)?.media ?? [];
      return media.map((m) => m.path).filter((p): p is string => typeof p === "string");
    }),
  );

  const [avatars, photos] = await Promise.all([
    listFolder("avatars", viewer.id),
    listFolder("post-media", viewer.id),
  ]);
  if (avatars.length) await admin.storage.from("avatars").remove(avatars);
  const removable = photos.filter((p) => !evidence.has(p));
  if (removable.length) await admin.storage.from("post-media").remove(removable);

  const { error } = await admin.auth.admin.deleteUser(viewer.id);
  if (error) return { error: "We couldn't delete your account just now. Try again, or contact us and we'll do it for you." };

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?account=deleted");
}
