"use client";

import { useActionState, useState } from "react";
import { type FormState, updatePassword } from "@/actions/auth";
import { deleteAccount, updateProfile } from "@/actions/profile";
import { Avatar } from "@/components/avatar";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, Input, Textarea, describedBy } from "@/components/ui/field";
import { prepareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { LIMITS } from "@/lib/validation";

function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="status" className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">{message}</p>;
}

export function ProfileForm({
  viewer,
}: {
  viewer: { id: string; displayName: string; bio: string; avatarPath: string | null };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const [avatarPath, setAvatarPath] = useState(viewer.avatarPath);
  const [avatarStatus, setAvatarStatus] = useState<string>();
  const [bio, setBio] = useState(state.values?.bio ?? viewer.bio);
  const f = state.fields ?? {};

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarStatus("Removing metadata and uploading…");
    try {
      const prepared = await prepareImage(file, 512);
      const path = `${viewer.id}/avatar-${Date.now()}.webp`;
      const { error } = await createClient()
        .storage.from("avatars")
        .upload(path, prepared.blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error("Upload failed. Check your connection and try again.");
      setAvatarPath(path);
      setAvatarStatus("New photo ready — save to apply it.");
    } catch (e) {
      setAvatarStatus((e as Error).message);
    }
  }

  return (
    <form action={action} className="space-y-5">
      <Notice message={state.notice} />
      <FormError message={state.error} />
      <input type="hidden" name="avatarPath" value={avatarPath ?? ""} />
      <div className="flex items-center gap-4">
        <Avatar path={avatarPath} name={viewer.displayName} size="lg" />
        <div className="space-y-2">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border-strong px-4 text-sm font-semibold hover:border-foreground focus-within:outline-2 focus-within:outline-accent">
            Change photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void pickAvatar(e.target.files?.[0])} />
          </label>
          {avatarPath ? (
            <button type="button" className="ml-3 text-sm text-muted underline" onClick={() => setAvatarPath(null)}>
              Remove
            </button>
          ) : null}
          {avatarStatus ? <p className="text-sm text-muted" aria-live="polite">{avatarStatus}</p> : null}
        </div>
      </div>
      <Field id="displayName" label="Display name" error={f.displayName}>
        <Input {...describedBy("displayName", f.displayName)} name="displayName" maxLength={LIMITS.displayName} defaultValue={state.values?.displayName ?? viewer.displayName} required />
      </Field>
      <Field id="bio" label="Bio" hint={`${LIMITS.bio - bio.length} characters left`} error={f.bio}>
        <Textarea {...describedBy("bio", f.bio, true)} name="bio" maxLength={LIMITS.bio} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <div className="max-w-48"><SubmitButton pendingText="Saving…">Save profile</SubmitButton></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="stay" value="1" />
      <Notice message={state.notice} />
      <FormError message={state.error} />
      <Field id="newPassword" label="New password" hint="10+ characters with letters and numbers." error={f.password}>
        <Input {...describedBy("newPassword", f.password, true)} name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <div className="max-w-56"><SubmitButton pendingText="Saving…">Change password</SubmitButton></div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormError message={state.error} />
      <Field id="confirm" label='Type "DELETE" to confirm' error={f.confirm}>
        <Input {...describedBy("confirm", f.confirm)} name="confirm" autoComplete="off" autoCapitalize="characters" spellCheck={false} required />
      </Field>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-full bg-danger px-5 font-semibold text-accent-foreground hover:brightness-110"
      >
        Delete my account
      </button>
    </form>
  );
}
