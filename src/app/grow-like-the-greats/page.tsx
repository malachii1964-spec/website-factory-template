import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { GROWERS } from "@/lib/growers";

/** Growers with a hand-built page carrying tools, not just a summary. */
const DEEP_DIVES = new Set(["mr-canucks-grow"]);

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  title: "Grow Like the Greats — Methods of Legendary Cultivators",
  description:
    "Learn how iconic growers, YouTube creators, breeders, and cannabis scientists actually grow — turned into simple, step-by-step Lake Erie Cannabis grow paths.",
  openGraph: {
    title: "Grow Like the Greats — Methods of Legendary Cultivators",
    description:
      "Learn how iconic growers, YouTube creators, breeders, and cannabis scientists actually grow — turned into simple, step-by-step Lake Erie Cannabis grow paths.",
    url: `${SITE}/grow-like-the-greats`,
  },
  alternates: { canonical: `${SITE}/grow-like-the-greats` },
};

export default function GrowLikeTheGreatsPage() {
  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />

      <main>
        <section className="grain relative overflow-hidden">
          <div className="starfield pointer-events-none absolute inset-0 opacity-60" />
          <div
            aria-hidden
            className="aurora pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, var(--gold) 0%, var(--violet) 52%, transparent 72%)",
              opacity: 0.24,
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 pb-6 pt-28 text-center sm:px-6 lg:pt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold">
              Grow Knowledge Hub
            </p>
            <h1 className="display-xl mt-4">
              Grow Like the <span className="iris-text">Greats.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-frost-dim">
              How the legends actually grow — the YouTubers, authors, breeders,
              and scientists who shaped modern cultivation — translated into
              simple grow paths you can follow tonight.
            </p>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {GROWERS.map((g) => (
                <Link
                  key={g.slug}
                  href={`/grow-like-the-greats/${g.slug}`}
                  className="group glass iris-border rounded-2xl p-6 transition hover:-translate-y-1 hover:brightness-110"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                      {g.role}
                    </p>
                    {DEEP_DIVES.has(g.slug) ? (
                      <span className="rounded-full bg-gradient-to-r from-gold/20 to-magenta/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-frost">
                        Deep dive · calculator
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold transition group-hover:text-cyan">
                    {g.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-frost-dim">
                    {g.tagline}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {g.knownFor.slice(0, 3).map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-frost-dim"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <span className="mt-4 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                    Grow like {g.name.split(" ")[0]} →
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[13px] leading-relaxed text-frost-dim">
              These are educational profiles of publicly shared methods, written
              to help you learn. Lake Erie Cannabis is not affiliated with,
              sponsored by, or endorsed by any grower, author, company, or
              institution named here. All trademarks belong to their owners.
            </p>
          </div>
        </section>
      </main>
      <OsFooter />
    </div>
  );
}
