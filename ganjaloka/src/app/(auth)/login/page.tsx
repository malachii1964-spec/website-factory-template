import type { Metadata } from "next";
import Link from "next/link";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">Welcome back</h1>
      <p className="mt-3 text-muted">Log in to see what your people are growing.</p>
      <div className="mt-8">
        <LoginForm next={safeNextPath(params.next)} linkError={params.error === "link"} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link href="/signup" className="text-accent hover:underline">Join GANJALOKA</Link>
      </p>
    </>
  );
}
