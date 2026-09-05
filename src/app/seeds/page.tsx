import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { DropStrip } from "@/components/drop-strip";
import { SEED_BANKS, seedBanksByType } from "@/lib/seed-banks";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  title: "Seed Banks & Breeders — Where to Buy Cannabis Seeds",
  description:
    "Reputable seed banks and breeders for home growers — where to buy seeds, which breeders to trust, and what to look for. Community-vetted sources.",
  openGraph: {
    title: "Seed Banks & Breeders — Where to Buy Cannabis Seeds",
    description:
      "Reputable seed banks and breeders for home growers — where to buy seeds, which breeders to trust, and what to look for. Community-vetted sources.",
    url: `${SITE}/seeds`,
  },
  alternates: { canonical: `${SITE}/seeds` },
};

export default function SeedsPage() {
  const banks = seedBanksByType("seed-bank");
  const breeders = seedBanksByType("breeder");

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
                "radial-gradient(ellipse at center, var(--lime) 0%, var(--cyan) 50%, transparent 72%)",
              opacity: 0.2,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-28 text-center sm:px-6 lg:pt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-lime">
              Genetics Sourcing Guide
            </p>
            <h1 className="display-xl mt-4">
              Where to buy seeds{" "}
              <span className="iris-text">you can trust.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-frost-dim">
              {SEED_BANKS.length} community-vetted seed banks and breeders.
              No scam sites, no mystery genetics — just the sources home
              growers actually use and trust.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-[12px] leading-relaxed text-frost-dim">
              Community-consensus picks. Always verify current availability,
              shipping policies, and local laws before ordering.
            </p>
          </div>
        </section>

        {/* buying guide */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Seed buying <span className="iris-text">101.</span>
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Feminized",
                  desc: "All-female seeds — no males to cull. The default for almost every home grower.",
                  color: "var(--violet)",
                },
                {
                  title: "Autoflower",
                  desc: "Flower on their own timer, not light schedule. Fastest seed-to-harvest (8–10 weeks total).",
                  color: "var(--lime)",
                },
                {
                  title: "Regular",
                  desc: "Male + female mix. For breeders making crosses, or growers who want to select mothers.",
                  color: "var(--gold)",
                },
                {
                  title: "F1 Hybrids",
                  desc: "True first-generation crosses — maximum vigor and uniformity. Premium price, premium consistency.",
                  color: "var(--cyan)",
                },
              ].map((card) => (
                <div key={card.title} className="glass rounded-2xl p-5">
                  <h3
                    className="font-display text-lg font-semibold"
                    style={{ color: card.color }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-frost-dim">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* live codes — placed here because a visitor on this page is already
            deciding where to buy, which is the only moment a code is useful */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <DropStrip />
          </div>
        </section>

        {/* seed banks (retailers) */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan">
              Seed banks · Retailers
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Where to <span className="iris-text">buy.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-frost-dim">
              These retailers carry seeds from dozens of breeders and ship
              reliably. Order from any of these and your genetics are legit.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {banks.map((b) => (
                <div
                  key={b.slug}
                  className="glass iris-border rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-frost">
                      {b.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-cyan/15 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-cyan">
                      {b.region}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-frost-dim">
                    {b.note}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.knownFor.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-frost-dim"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                    Ships: {b.ships}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* breeders */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">
              Breeders · The genetics makers
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Who to <span className="iris-text">grow.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-frost-dim">
              These breeders create the genetics. You can buy their seeds
              directly or through any of the seed banks above.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {breeders.map((b) => (
                <div key={b.slug} className="glass rounded-2xl p-5">
                  <h3 className="font-display text-lg font-semibold text-frost">
                    {b.name}
                  </h3>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-lime">
                    {b.region}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-frost-dim">
                    {b.note}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {b.knownFor.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-frost-dim"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* tips */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Red flags to <span className="iris-text">avoid.</span>
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  flag: "No breeder names listed",
                  why: "Legit seed banks tell you exactly which breeder made the seed. 'House genetics' with no provenance is a gamble.",
                },
                {
                  flag: "No germination guarantee",
                  why: "Reputable banks replace duds. If they won't stand behind germination, the seeds may be old or stored badly.",
                },
                {
                  flag: "Too-good prices on premium strains",
                  why: "If Mephisto seeds are $15 for a 10-pack, they're not Mephisto seeds. Premium breeders price accordingly.",
                },
                {
                  flag: "No community presence",
                  why: "Search the seed bank name on Reddit and Growdiaries. If nobody talks about them, nobody trusts them.",
                },
                {
                  flag: "Only crypto payment",
                  why: "Legit US seed banks accept cards. Crypto-only can mean they can't get a merchant account (red flag).",
                },
                {
                  flag: "No physical address",
                  why: "Real businesses have real addresses. Anonymous seed banks disappear with your money more often.",
                },
              ].map((r) => (
                <div key={r.flag} className="glass rounded-2xl p-5">
                  <h3 className="font-display text-base font-semibold text-gold">
                    {r.flag}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-frost-dim">
                    {r.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cross-links */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Got seeds? Now grow them right.
            </h2>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/strains"
                className="btn-iris rounded-full px-7 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
              >
                Find your strain
              </Link>
              <Link
                href="/start"
                className="glass-hi rounded-full px-7 py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
              >
                Start the grow roadmap
              </Link>
              <Link
                href="/gear"
                className="glass-hi rounded-full px-7 py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
              >
                Get the gear
              </Link>
            </div>
          </div>
        </section>
      </main>

      <OsFooter />
    </div>
  );
}
