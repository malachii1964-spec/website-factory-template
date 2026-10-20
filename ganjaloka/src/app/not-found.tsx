import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Wordmark className="text-3xl" />
      <h1 className="mt-10 font-display text-5xl font-extrabold uppercase leading-none tracking-wide">Not found</h1>
      <p className="mt-4 text-muted">That page doesn&apos;t exist, or the account was renamed or deleted.</p>
      <Link href="/explore" className={buttonVariants({ className: "mt-8 self-start" })}>Go to Explore</Link>
    </main>
  );
}
