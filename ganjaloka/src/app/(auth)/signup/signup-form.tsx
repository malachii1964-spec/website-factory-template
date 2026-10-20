"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, signUp } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, Input, describedBy } from "@/components/ui/field";
import { LIMITS } from "@/lib/validation";

export function SignUpForm({ maxBirthDate }: { maxBirthDate: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});
  const f = state.fields ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.error} />
      <Field id="email" label="Email" error={f.email}>
        <Input {...describedBy("email", f.email)} name="email" type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field id="password" label="Password" hint="10+ characters with letters and numbers." error={f.password}>
        <Input {...describedBy("password", f.password, true)} name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field id="username" label="Username" hint="3–20 lowercase letters, numbers or underscores. This is your @handle." error={f.username}>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
          <Input
            {...describedBy("username", f.username, true)}
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            defaultValue={v.username}
            className="pl-8"
            required
          />
        </div>
      </Field>
      <Field id="displayName" label="Display name" hint="How your name appears on posts." error={f.displayName}>
        <Input {...describedBy("displayName", f.displayName, true)} name="displayName" autoComplete="nickname" maxLength={LIMITS.displayName} defaultValue={v.displayName} required />
      </Field>
      <Field id="birthDate" label="Date of birth" hint="You must be 21 or older. We keep this private." error={f.birthDate}>
        <Input {...describedBy("birthDate", f.birthDate, true)} name="birthDate" type="date" max={maxBirthDate} defaultValue={v.birthDate} required />
      </Field>
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="acceptTerms"
            aria-invalid={f.acceptTerms ? true : undefined}
            aria-describedby={f.acceptTerms ? "acceptTerms-error" : undefined}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span>
            I&apos;m 21 or older and I accept the{" "}
            <Link href="/legal/terms" target="_blank" className="text-accent underline">Terms</Link>,{" "}
            <Link href="/legal/guidelines" target="_blank" className="text-accent underline">Community Guidelines</Link> and{" "}
            <Link href="/legal/privacy" target="_blank" className="text-accent underline">Privacy Policy</Link>. No buying or selling.
          </span>
        </label>
        {f.acceptTerms ? (
          <p id="acceptTerms-error" role="alert" className="text-sm text-danger">{f.acceptTerms}</p>
        ) : null}
      </div>
      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
    </form>
  );
}
