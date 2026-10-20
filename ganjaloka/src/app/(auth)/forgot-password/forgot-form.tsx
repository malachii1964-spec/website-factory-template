"use client";

import { useActionState } from "react";
import { type FormState, requestPasswordReset } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, Input, describedBy } from "@/components/ui/field";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const f = state.fields ?? {};
  if (state.notice) {
    return <p role="status" className="rounded-xl border border-border bg-surface px-4 py-3 leading-relaxed">{state.notice}</p>;
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="email" label="Email" error={f.email}>
        <Input {...describedBy("email", f.email)} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      </Field>
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
