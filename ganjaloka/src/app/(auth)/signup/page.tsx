import type { Metadata } from "next";
import Link from "next/link";
import { cutoffBirthDate } from "@/lib/age";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Join" };

export default function SignUpPage() {
  const maxBirthDate = cutoffBirthDate(21).toISOString().slice(0, 10);
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">Join Ganjaloka</h1>
      <p className="mt-3 text-muted">The 21+ social world for cannabis culture. It takes a minute.</p>
      <div className="mt-8">
        <SignUpForm maxBirthDate={maxBirthDate} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already a member? <Link href="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </>
  );
}
