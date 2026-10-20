"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { ERROR_MESSAGES } from "@/lib/errors";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE, AGE_COOKIE_VALUE } from "@/lib/gate";
import { checkContent } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import {
  TERMS_VERSION,
  fieldErrors,
  newPasswordSchema,
  passwordResetSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

export type FormState = {
  error?: string;
  notice?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function confirmAge(formData: FormData) {
  const next = safeNextPath(formData.get("next"), "/");
  (await cookies()).set(AGE_COOKIE, AGE_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AGE_COOKIE_MAX_AGE,
    path: "/",
  });
  redirect(next);
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    email: text(formData, "email"),
    username: text(formData, "username"),
    displayName: text(formData, "displayName"),
    birthDate: text(formData, "birthDate"),
  };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.VALIDATION, fields: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const verdict = checkContent(input.username, input.displayName);
  if (!verdict.ok) return { fields: { displayName: verdict.message }, values };

  const supabase = await createClient();
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .maybeSingle();
  if (taken) return { fields: { username: ERROR_MESSAGES.GL_USERNAME_TAKEN }, values };

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/auth/confirm`,
      data: {
        username: input.username,
        display_name: input.displayName,
        birth_date: input.birthDate,
        terms_version: TERMS_VERSION,
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fields: { password: "Choose a stronger password: 10+ characters with letters and numbers." }, values };
    }
    if (error.status === 429) {
      return { error: "Too many sign-up attempts. Wait a few minutes and try again.", values };
    }
    // The DB trigger re-checks age and username; the likely cause here is a
    // username taken a moment ago.
    return {
      error: "We couldn't create your account. Check your details — that username may have just been taken.",
      values,
    };
  }

  // Already-registered emails get the same response (no account enumeration).
  redirect("/check-email");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first — open the link we sent to your inbox.", values };
    }
    if (error.status === 429) return { error: "Too many attempts. Wait a few minutes and try again.", values };
    return { error: "That email and password don't match. Try again or reset your password.", values };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = passwordResetSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/auth/confirm`,
  });
  // Same message whether or not the account exists.
  return { notice: "If an account uses that email, a reset link is on its way. It works once and expires in an hour." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: text(formData, "password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fields: { password: "Choose a password you haven't used here before." } };
    return { error: "Your reset link has expired. Request a new one from the log-in page." };
  }
  if (formData.get("stay") === "1") return { notice: "Password changed." };
  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
