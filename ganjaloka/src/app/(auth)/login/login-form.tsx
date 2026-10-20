"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, signIn } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, Input, describedBy } from "@/components/ui/field";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  const f = state.fields ?? {};
  const error =
    state.error ?? (linkError ? "That link has expired or was already used. Log in, or request a new reset link." : undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError message={error} />
      <Field id="email" label="Email" error={f.email}>
        <Input {...describedBy("email", f.email)} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      </Field>
      <Field id="password" label="Password" error={f.password}>
        <Input {...describedBy("password", f.password)} name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">Forgot your password?</Link>
      </p>
    </form>
  );
}
