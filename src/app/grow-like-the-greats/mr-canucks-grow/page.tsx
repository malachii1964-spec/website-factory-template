import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { CanucksRamp } from "@/components/canucks-ramp";
import { CanucksCalculator } from "@/components/canucks-calculator";
import { StartGrowForm } from "@/components/start-grow-form";
import { DEBATES, INGREDIENTS, PH_RANGE } from "@/lib/canucks-method";
import { getAllGuides } from "@/lib/guides";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

const PATH = "/grow-like-the-greats/mr-canucks-grow";

const TITLE = "Grow Like Mr. Canucks Grow — the dry-amendment method, calculated";
const DESCRIPTION =
  "Matt Taylor's organic method turned into a tool: the amendment ratio ramp, the three-week top-dress clock, and a calculator that gives you exact amounts and dates for your pot size.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}${PATH}`,
    type: "article",
  },
  alternates: { canonical: `${SITE}${PATH}` },
};

/** Guides that actually put this method into practice, in the order you hit them. */
const PATH_GUIDES: { slug: string; when: string }[] = [
  { slug: "living-soil-water-only", when: "Before you mix" },
  { slug: "soil-amendments-guide", when: "Before you mix" },
  { slug: "transplanting-cannabis", when: "Week 0" },
  { slug: "ph-for-beginners", when: "Every watering" },
  { slug: "watering-ph-fundamentals", when: "Every watering" },
  { slug: "soil-food-web", when: "Why it works" },
  { slug: "organic-vs-synthetic-nutrients", when: "Why it works" },
  { slug: "nutrient-deficiency-chart", when: "If it goes wrong" },
  { slug: "coco-coir-growing", when: "If you run coco" },
  { slug: "when-to-harvest-trichomes", when: "The finish" },
  { slug: "drying-and-curing", when: "The finish" },
];

const FACTS = [
  { k: "Real name", v: "Matt Taylor" },
  { k: "Based", v: "Canada" },
  { k: "Feeds", v: "Every 3 weeks" },
  { k: "Bottles used", v: "Zero" },
];

export default function MrCanucksGrowPage() {
  const all = getAllGuides();
  const guides = PATH_GUIDES.map((p) => {
    const g = all.find((x) => x.slug === p.slug);
    return g ? { ...g, when: p.when } : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        about: { "@type": "Person", name: "Matt Taylor", alternateName: "Mr. Canucks Grow" },
        mainEntityOfPage: `${SITE}${PATH}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Grow Like the Greats", item: `${SITE}/grow-like-the-greats` },
          { "@type": "ListItem", position: 2, name: "Mr. Canucks Grow", item: `${SITE}${PATH}` },
        ],
      },
    ],
  };

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OsHeader />

      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
          <Link href="/grow-like-the-greats" className="hover:text-frost">
            Grow Like the Greats
          </Link>{" "}
          / <span className="text-gold">YouTube cultivator · Canada</span>
        </nav>

        {/* ------------------------------------------------------- hero -- */}
        <h1 className="display-xl mt-4">Grow like Mr. Canucks Grow</h1>
        <p className="mt-5 text-lg leading-relaxed text-frost-dim sm:text-xl">
          Dry amendments, plain water, a calendar. Matt Taylor built one of the
          largest home-grow channels on YouTube by removing things from the
          process instead of adding them — no bottle lineup, no feed chart with
          nine columns, no daily measuring.{" "}
          <strong className="font-semibold text-frost">
            Two bags of dry fertilizer and a three-week clock.
          </strong>
        </p>

        <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FACTS.map((f) => (
            <div
              key={f.k}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                {f.k}
              </dt>
              <dd className="mt-1 font-display text-lg font-semibold">{f.v}</dd>
            </div>
          ))}
        </dl>

        {/* -------------------------------------------------- signature -- */}
        <div className="mt-10">
          <CanucksRamp />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-frost-dim">
          That is the entire method in one picture. The amount barely
          changes — one tablespoon per gallon of pot, every three weeks. What
          changes is the{" "}
          <strong className="font-semibold text-frost">ratio</strong>: nitrogen
          early to build the frame, phosphorus and potassium late to fill the
          flower. Everything below is detail on that one idea.
        </p>

        <a
          href="#calculator"
          className="btn-iris mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          Calculate my amounts →
        </a>

        {/* ------------------------------------------------ ingredients -- */}
        <section className="mt-14">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
            Five things go in the pot
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-frost-dim">
            Not six. The discipline is the point — every ingredient has one job,
            and if you cannot say what a product is for, it does not go in.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {INGREDIENTS.map((ing, i) => (
              <div key={ing.name} className="glass rounded-2xl p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-frost-dim">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {ing.name}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-frost-dim">
                  {ing.detail}
                </p>
                <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-lime/90">
                  {ing.why}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- calculator -- */}
        <div className="mt-14">
          <CanucksCalculator />
        </div>

        {/* ------------------------------------------------ start a grow -- */}
        <div id="start" className="mt-14 scroll-mt-24">
          <StartGrowForm
            methodSlug="mr-canucks-grow"
            methodName="Mr. Canucks Grow"
            returnTo={PATH}
          />
        </div>

        {/* ------------------------------------------------ the watering -- */}
        <section className="glass mt-14 rounded-3xl p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
            What you do on all the other days
          </h2>
          <p className="mt-3 leading-relaxed text-frost-dim">
            Nothing. That is the hard part. Between top-dresses the job is plain
            water at pH {PH_RANGE[0]}–{PH_RANGE[1]}, a proper soak with a small
            amount of runoff, then wait for the pot to dry back before you water
            again. Lifting the pot tells you more than any meter — learn what
            heavy and light feel like in the first two weeks and you will never
            overwater again.
          </p>
          <p className="mt-3 leading-relaxed text-frost-dim">
            The failure mode for beginners on this method is not underfeeding.
            It is watering a pot that was still wet, three days in a row, and
            drowning the biology that was supposed to be breaking down the
            amendment.
          </p>
        </section>

        {/* ---------------------------------------------------- debates -- */}
        <section className="mt-14">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            What growers argue about
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-frost-dim">
            This method has genuine critics on the grower forums. Here is the
            case against it, fairly stated — you should know it before you
            commit a whole run.
          </p>
          <div className="mt-5 space-y-3">
            {DEBATES.map((d) => (
              <details
                key={d.q}
                className="glass group rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-display text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan">
                  {d.q}
                  <span className="iris-text mt-0.5 shrink-0 font-mono text-sm transition group-open:rotate-90">
                    →
                  </span>
                </summary>
                <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-frost-dim">
                  {d.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- guides -- */}
        <section className="mt-14">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
            The reading, in the order you need it
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="glass group flex min-w-0 items-center justify-between gap-3 rounded-2xl p-4 transition hover:brightness-125"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cyan">
                    {g.when}
                  </p>
                  <h3 className="mt-1 truncate font-display text-base font-semibold">
                    {g.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                    {g.readMinutes} min{g.membersOnly ? " · members" : ""}
                  </p>
                </div>
                <span className="iris-text shrink-0 font-mono text-sm">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- outro -- */}
        <section className="glass iris-border mt-14 rounded-3xl p-6">
          <h2 className="font-display text-2xl font-semibold">
            Watch the man himself
          </h2>
          <p className="mt-3 leading-relaxed text-frost-dim">
            This page is a study of a public method, not a replacement for it.
            His channel is where the method actually lives — full grows start to
            finish, with the mistakes left in.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://www.youtube.com/c/MrCanucksGrowGuide"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-iris inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Mr. Canucks Grow on YouTube
            </a>
            <a
              href="https://www.instagram.com/mr_canucks_grow/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-frost transition hover:brightness-125"
            >
              @mr_canucks_grow
            </a>
          </div>
        </section>

        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[12px] leading-relaxed text-frost-dim">
          Educational profile of a publicly shared method. Lake Erie Cannabis is
          not affiliated with, sponsored by, or endorsed by Matt Taylor or Mr.
          Canucks Grow, and we earn nothing from the products named here. Rates
          are the figures most consistently documented from his public videos;
          he refines the mix across seasons, so treat this as a faithful
          starting point and follow his current content for changes. Gaia Green
          and all other trademarks belong to their owners.{" "}
          <Link
            href="/grow-like-the-greats"
            className="underline underline-offset-2"
          >
            All growers
          </Link>
        </p>
      </main>

      <OsFooter />
    </div>
  );
}
