"use client";

import { useActionState } from "react";
import { type FormState, updatePassword } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, Input, describedBy } from "@/components/ui/field";

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <Field id="password" label="New password" hint="10+ characters with letters and numbers." error={f.password}>
        <Input {...describedBy("password", f.password, true)} name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
