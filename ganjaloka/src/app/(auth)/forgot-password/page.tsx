import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">Reset your password</h1>
      <p className="mt-3 text-muted">Enter your account email and we&apos;ll send you a link to choose a new password.</p>
      <div className="mt-8"><ForgotForm /></div>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-accent hover:underline">Back to log in</Link></p>
    </>
  );
}
