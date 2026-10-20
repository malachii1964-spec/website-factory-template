import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">New password</h1>
      <p className="mt-3 text-muted">Choose a new password for your account.</p>
      <div className="mt-8"><ResetForm /></div>
    </>
  );
}
