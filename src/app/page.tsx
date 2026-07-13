import Link from "next/link";
import { ArrowRight, Phone, MapPin, Sprout, Sun, Leaf, Check } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { ButtonLink } from "@/components/Button";
import { Container, SectionHeading, Eyebrow } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CategoryCard } from "@/components/CategoryCard";
import { PlantCard } from "@/components/PlantCard";
import { MapEmbed } from "@/components/MapEmbed";
import { OpenStatus } from "@/components/OpenStatus";
import { categories, featuredPlants, type CategoryId } from "@/lib/plants";
import { currentSeasonalContent } from "@/lib/seasonal";
import { weeklyHoursRows } from "@/lib/hours";
import { site, addressOneLine } from "@/lib/site";

const categoryHue: Record<CategoryId, number> = {
  annuals: 320,
  perennials: 265,
  "trees-shrubs": 140,
  vegetables: 12,
  "hanging-baskets": 300,
  houseplants: 155,
  hydroponics: 40,
};

const trust = [
  { icon: Leaf, label: "3 greenhouses", sub: "Grown on-site" },
  { icon: Sun, label: "Open 7 days", sub: "All season long" },
  { icon: Sprout, label: `Since ${site.founded}`, sub: "Family-owned" },
];

export default function HomePage() {
  const seasonal = currentSeasonalContent();
  const rows = weeklyHoursRows();
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden text-paper">
        <HeroBackdrop />
        <Container className="relative flex min-h-[88svh] flex-col justify-center py-24 sm:py-28">
          <div className="max-w-3xl">
            <p className="hero-rise eyebrow text-grow" style={{ animationDelay: "0.05s" }}>
              <span aria-hidden className="h-px w-8 bg-grow" />
              Lakewood, New York · Est. {site.founded}
            </p>
            <h1
              className="hero-rise mt-6 font-display text-[2.75rem] font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl"
              style={{ animationDelay: "0.18s" }}
            >
              Everything grows
              <br />
              <span className="text-grow">a little better here.</span>
            </h1>
            <p
              className="hero-rise mt-6 max-w-xl text-lg leading-relaxed text-paper/80 sm:text-xl"
              style={{ animationDelay: "0.32s" }}
            >
              Western New York&rsquo;s largest nursery &amp; hydroponics shop — three
              greenhouses of flowers, trees, and vegetable starts, plus the grow-room
              gear serious growers drive across the state for.
            </p>
            <div
              className="hero-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "0.46s" }}
            >
              <ButtonLink href="/plants" variant="primary" size="lg">
                Browse the plants
                <ArrowRight size={18} aria-hidden />
              </ButtonLink>
              <ButtonLink
                href={site.phoneHref}
                variant="outline"
                size="lg"
                className="border-paper/30 text-paper hover:bg-paper hover:text-fir"
              >
                <Phone size={17} aria-hidden />
                {site.phone}
              </ButtonLink>
            </div>
            <div
              className="hero-rise mt-10 flex flex-wrap items-center gap-3 text-sm text-paper/70"
              style={{ animationDelay: "0.6s" }}
            >
              <OpenStatus className="text-paper/90" />
              <span aria-hidden className="h-4 w-px bg-paper/20" />
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-grow"
              >
                <MapPin size={15} aria-hidden />
                {addressOneLine}
              </a>
            </div>
          </div>

          {/* Trust bar */}
          <ul
            className="hero-rise mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-paper/15 pt-6"
            style={{ animationDelay: "0.72s" }}
          >
            {trust.map((t) => (
              <li key={t.label} className="flex items-center gap-3">
                <t.icon size={22} className="shrink-0 text-grow" aria-hidden />
                <span className="leading-tight">
                  <span className="block font-display text-lg text-paper">{t.label}</span>
                  <span className="text-xs text-paper/60">{t.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What we grow"
              title="Aisles worth wandering"
              intro="From the first pansies of spring to full-spectrum grow lights in January, seven departments cover every gardener — beginner to master grower."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 80}>
                <CategoryCard id={c.id} label={c.label} blurb={c.blurb} hue={categoryHue[c.id]} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ WHAT'S THRIVING NOW (signature, dark) ============ */}
      <section className="relative overflow-hidden bg-fir py-20 text-paper sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 glow-grow opacity-60 blur-2xl" />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div>
                <Eyebrow className="text-grow">{seasonal.eyebrow}</Eyebrow>
                <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl md:text-[2.75rem]">
                  {seasonal.heading}
                </h2>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-paper/75">{seasonal.blurb}</p>
                <ButtonLink href="/plants" variant="primary" size="lg" className="mt-8">
                  See what&rsquo;s ready
                  <ArrowRight size={18} aria-hidden />
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {seasonal.picks.map((pick) => (
                  <li
                    key={pick}
                    className="flex items-center gap-3 rounded-xl border border-paper/12 bg-paper/[0.04] px-4 py-4 backdrop-blur-sm"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grow/15 text-grow">
                      <Check size={16} aria-hidden />
                    </span>
                    <span className="font-medium">{pick}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ FEATURED PLANTS ============ */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Fresh picks" title="Customer favorites" />
              <Link
                href="/plants"
                className="inline-flex items-center gap-1.5 font-semibold text-leaf hover:text-canopy"
              >
                View all plants
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPlants.slice(0, 8).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <PlantCard plant={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ HYDROPONICS CRED (dark) ============ */}
      <section className="relative overflow-hidden bg-canopy py-20 text-paper sm:py-28">
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-grow/15 blur-3xl" />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="max-w-lg">
                <Eyebrow className="text-grow">The grow room</Eyebrow>
                <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl md:text-[2.75rem]">
                  Not just a garden center — a grower&rsquo;s headquarters.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-paper/80">
                  Full-spectrum LED lighting, complete nutrient lineups, media, and
                  hydroponic systems our staff actually run. If you&rsquo;re growing
                  indoors, we&rsquo;ll dial in your setup — no guesswork.
                </p>
                <ButtonLink href="/hydroponics" variant="primary" size="lg" className="mt-8">
                  Explore hydroponics
                  <ArrowRight size={18} aria-hidden />
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Full-spectrum LED grow lights",
                  "Deep-water & drip systems",
                  "Complete nutrient programs",
                  "Coco, rockwool & premium media",
                  "Seed-starting & propagation",
                  "Staff who grow, too",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-xl bg-fir/40 px-4 py-4">
                    <Sprout size={18} className="mt-0.5 shrink-0 text-grow" aria-hidden />
                    <span className="text-sm font-medium leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="From the community" title="Neighbors who keep coming back" align="center" />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 80}>
                <figure className="flex h-full flex-col rounded-2xl border border-mist bg-white/50 p-6">
                  <div className="flex gap-0.5 text-grow" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-loam">
                    <p className="leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-5 border-t border-mist pt-4 text-sm">
                    <span className="font-semibold text-canopy">{t.name}</span>
                    <span className="block text-loam-soft">{t.detail}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-loam-soft/70">
            {/* TODO(mike): swap in real Google/Yelp reviews with permission. */}
            Representative of reviews left for Mike&rsquo;s Nursery.
          </p>
        </Container>
      </section>

      {/* ============ VISIT / HOURS + MAP ============ */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <div>
                <SectionHeading eyebrow="Come see us" title="Plan your visit" />
                <p className="mt-4 max-w-md text-lg leading-relaxed text-loam-soft">
                  Just off Route 394 in Lakewood, minutes from Jamestown and the lake.
                  Walk the greenhouses, talk to a grower, and bring something home.
                </p>

                <dl className="mt-8 space-y-1.5">
                  {rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-mist py-2 text-sm">
                      <dt className="text-loam-soft">{r.label}</dt>
                      <dd className="font-medium tabular-nums text-loam">{r.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex items-center gap-3">
                  <OpenStatus className="text-loam" />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={site.phoneHref} variant="ground" size="lg">
                    <Phone size={17} aria-hidden />
                    Call {site.phone}
                  </ButtonLink>
                  <ButtonLink href={mapHref} variant="outline" size="lg">
                    <MapPin size={17} aria-hidden />
                    Get directions
                  </ButtonLink>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="h-full min-h-[340px] overflow-hidden rounded-2xl border border-mist shadow-sm">
                <MapEmbed className="min-h-[340px]" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}

function Star() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.6 1-5.8L1.5 7.7l5.9-.9z" />
    </svg>
  );
}

const testimonials = [
  {
    name: "Sarah M.",
    detail: "Lakewood, NY",
    quote:
      "Hands down the best selection around, and the staff actually know their stuff. My hanging baskets were the envy of the block all summer.",
  },
  {
    name: "Dave R.",
    detail: "Indoor grower",
    quote:
      "They walked me through my entire hydro setup and saved me from buying the wrong light. This is the only place I trust for grow supplies.",
  },
  {
    name: "The Coleman Family",
    detail: "Jamestown, NY",
    quote:
      "We drive past two other garden centers to get here. Healthy plants, fair prices, and it just feels like a real family greenhouse.",
  },
];
