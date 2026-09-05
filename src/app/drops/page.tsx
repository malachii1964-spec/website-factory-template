import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { DropCard } from "@/components/drop-card";
import { activeDrops, DISCLOSURE } from "@/lib/promos";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

const TITLE = "Limited Drops — Seed Discount Codes";
const DESCRIPTION =
  "Current discount codes on limited seed drops, with the genetics explained. Copy a code, grow it with the guides on this site.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE}/drops` },
  alternates: { canonical: `${SITE}/drops` },
};

export default function DropsPage() {
  const drops = activeDrops();

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          LEC Limited Drops
        </p>
        <h1 className="display-xl mt-3">Codes worth using</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-frost-dim">
          A short list of genetics worth growing, each with a working discount
          code. Tap a code to copy it. Then come back and grow it properly —
          every one of these links to the guides that apply.
        </p>

        {drops.length === 0 ? (
          <div className="glass iris-border mt-10 rounded-3xl p-10 text-center">
            <h2 className="font-display text-2xl font-semibold">
              No live drops right now
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-frost-dim">
              Codes here expire, and we take them down rather than leave you
              typing a dead one at checkout. New drops land regularly.
            </p>
            <Link
              href="/seeds"
              className="btn-iris mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Browse seed banks and breeders →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((d, i) => (
              <DropCard key={d.slug} drop={d} priority={i === 0} />
            ))}
          </div>
        )}

        <section className="glass mt-12 rounded-2xl p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
            How this works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-frost-dim">{DISCLOSURE}</p>
          <p className="mt-3 text-sm leading-relaxed text-frost-dim">
            Seeds are sold as collectible genetics by the breeder, not by us.
            Cultivation law varies by state and country —{" "}
            <Link href="/local-ny" className="text-cyan underline underline-offset-2">
              check what applies where you live
            </Link>{" "}
            before you plant anything. 21+ only.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
            Got the seeds? Start here
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/guides/germinate-cannabis-seeds", t: "Germinate them properly" },
              { href: "/guides/autoflower-complete-guide", t: "Growing autoflowers" },
              { href: "/start", t: "The full first-grow roadmap" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="glass flex min-w-0 items-center justify-between gap-3 rounded-2xl p-4 transition hover:brightness-125"
              >
                <span className="min-w-0 font-display text-base font-semibold">
                  {l.t}
                </span>
                <span className="iris-text shrink-0 font-mono text-sm">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <OsFooter />
    </div>
  );
}
