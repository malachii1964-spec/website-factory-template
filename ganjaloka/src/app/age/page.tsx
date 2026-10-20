import type { Metadata } from "next";
import Link from "next/link";
import { confirmAge } from "@/actions/auth";
import { SiteFooterLinks } from "@/components/shell/app-shell";
import { Trichome } from "@/components/trichome";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Are you 21 or older?" };

export default async function AgeGatePage({ searchParams }: { searchParams: Promise<{ next?: string; under?: string }> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/");

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Trichome ripeness="amber" liked className="size-14" />
      <p className="mt-6 font-display text-[2.1rem] font-extrabold uppercase leading-none tracking-[0.06em]">Ganjaloka</p>
      {params.under ? (
        <>
          <h1 className="mt-8 text-2xl font-semibold leading-snug">GANJALOKA is for adults 21 and over.</h1>
          <p className="mt-3 text-muted">Come back when you&apos;re 21. We&apos;ll be here.</p>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-2xl font-semibold leading-snug">Are you 21 or older?</h1>
          <p className="mt-3 leading-relaxed text-muted">
            GANJALOKA is a social network about cannabis culture. You must be 21 or older to enter.
          </p>
          <form action={confirmAge} className="mt-8 flex flex-col gap-3">
            <input type="hidden" name="next" value={next} />
            <Button type="submit" size="lg">I&apos;m 21 or older — enter</Button>
            <Link
              href="/age?under=1"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border-strong text-base font-semibold hover:border-foreground"
            >
              I&apos;m under 21
            </Link>
          </form>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            By entering you agree to the <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
            <Link href="/legal/guidelines" className="underline">Community Guidelines</Link>. We remember your answer on this
            device for 30 days.
          </p>
        </>
      )}
      <div className="mt-12">
        <SiteFooterLinks />
      </div>
    </main>
  );
}
