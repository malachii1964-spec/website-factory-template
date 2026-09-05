import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import {
  TERP_ORDER,
  TERP_DETAIL,
  TERPENES,
  strainsWithTerpene,
  terpeneCounts,
} from "@/lib/terpenes";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  title: "Terpene Hub — Aromas, Effects & Strain Cross-Reference",
  description:
    "The 7 dominant cannabis terpenes explained — what they smell like, how they feel, and which strains feature each. A grower's aroma guide.",
  openGraph: {
    title: "Terpene Hub — Aromas, Effects & Strain Cross-Reference",
    description:
      "The 7 dominant cannabis terpenes explained — what they smell like, how they feel, and which strains feature each. A grower's aroma guide.",
    url: `${SITE}/terpenes`,
  },
  alternates: { canonical: `${SITE}/terpenes` },
};

const TYPE_COLOR: Record<string, string> = {
  Indica: "var(--violet)",
  Sativa: "var(--lime)",
  Hybrid: "var(--cyan)",
};

export default function TerpenesPage() {
  const counts = terpeneCounts();

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />

      <main>
        {/* hero */}
        <section className="grain relative overflow-hidden">
          <div className="starfield pointer-events-none absolute inset-0 opacity-60" />
          <div
            aria-hidden
            className="aurora pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[44rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, var(--cyan) 0%, var(--violet) 50%, transparent 72%)",
              opacity: 0.22,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-28 text-center sm:px-6 lg:pt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan">
              Terpene Hub
            </p>
            <h1 className="display-xl mt-4">
              The aroma molecules that{" "}
              <span className="iris-text">define the high.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-frost-dim">
              Terpenes give each strain its smell, flavor, and much of its
              character. Learn the seven you will meet most — and find the
              strains that feature them.
            </p>
          </div>
        </section>

        {/* overview grid */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {TERP_ORDER.map((t) => {
                const base = TERPENES[t];
                const detail = TERP_DETAIL[t];
                return (
                  <a
                    key={t}
                    href={`#${t}`}
                    className="glass group rounded-2xl p-4 text-center transition hover:brightness-125"
                  >
                    <span
                      className="block font-display text-2xl font-bold"
                      style={{ color: detail.accent }}
                    >
                      {counts[t]}
                    </span>
                    <span className="mt-1 block font-display text-sm font-semibold text-frost">
                      {base.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-frost-dim">
                      {base.aroma.split(",")[0]}
                    </span>
                  </a>
                );
              })}
            </div>
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
              Click any terpene to jump to its profile & strains ↓
            </p>
          </div>
        </section>

        {/* deep profiles */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="space-y-16">
              {TERP_ORDER.map((t) => {
                const base = TERPENES[t];
                const detail = TERP_DETAIL[t];
                const strains = strainsWithTerpene(t);

                return (
                  <article key={t} id={t} className="scroll-mt-28">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2
                        className="font-display text-3xl font-bold sm:text-4xl"
                        style={{ color: detail.accent }}
                      >
                        {base.name}
                      </h2>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
                        {base.aroma}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-6 lg:grid-cols-2">
                      {/* left: info */}
                      <div className="space-y-4">
                        <div className="glass rounded-2xl p-5">
                          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-dim">
                            Effects
                          </h3>
                          <p className="mt-2 text-lg leading-relaxed text-frost">
                            {detail.effects}
                          </p>
                        </div>
                        <div className="glass rounded-2xl p-5">
                          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-dim">
                            Why it matters
                          </h3>
                          <p className="mt-2 leading-relaxed text-frost-dim">
                            {detail.benefit}
                          </p>
                        </div>
                        <div className="glass rounded-2xl p-5">
                          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-dim">
                            Also found in
                          </h3>
                          <p className="mt-2 text-frost-dim">{base.alsoIn}</p>
                        </div>
                      </div>

                      {/* right: cross-linked strains */}
                      <div>
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-dim">
                          Strains featuring {base.name.toLowerCase()} ({strains.length})
                        </h3>
                        <div className="mt-3 grid gap-2">
                          {strains.slice(0, 12).map((s) => (
                            <Link
                              key={s.slug}
                              href={`/strains/${s.slug}`}
                              className="glass group flex min-w-0 items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:brightness-125"
                            >
                              <div className="min-w-0">
                                <span className="block truncate font-display text-base font-semibold">
                                  {s.name}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-frost-dim">
                                  <span style={{ color: TYPE_COLOR[s.type] }}>
                                    {s.type}
                                  </span>
                                  {" · "}
                                  {s.thc} THC
                                </span>
                              </div>
                              <span className="iris-text shrink-0 font-mono text-sm">
                                →
                              </span>
                            </Link>
                          ))}
                          {strains.length > 12 && (
                            <p className="pl-4 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                              +{strains.length - 12} more in the{" "}
                              <Link
                                href="/strains"
                                className="underline underline-offset-2"
                              >
                                strain database
                              </Link>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* cross-links */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Ready to grow a terpene-rich harvest?
            </h2>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/strains"
                className="btn-iris rounded-full px-7 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
              >
                Browse all strains
              </Link>
              <Link
                href="/strain-finder"
                className="glass-hi rounded-full px-7 py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
              >
                Take the strain quiz
              </Link>
            </div>
          </div>
        </section>
      </main>

      <OsFooter />
    </div>
  );
}
