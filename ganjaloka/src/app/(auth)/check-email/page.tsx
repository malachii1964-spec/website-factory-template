import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">Check your email</h1>
      <p className="mt-4 leading-relaxed text-muted">
        We sent a confirmation link to the address you entered. Open it on any device to finish creating your account.
      </p>
      <p className="mt-4 leading-relaxed text-muted">
        Nothing after a few minutes? Check spam, or <Link href="/signup" className="text-accent hover:underline">sign up again</Link> with the
        right address.
      </p>
    </>
  );
}
