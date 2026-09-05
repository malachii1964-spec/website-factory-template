import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { Reveal } from "@/components/reveal";
import { GuideCard } from "@/components/guide-card";
import { WeatherChip, SystemStatus, PlantDoctorCard } from "@/components/hud";
import {
  GalaxySpiral,
  MiniSprout,
  LotusFigure,
  SoilStrata,
  GemCluster,
  GearGlyph,
  LaurelGlyph,
  BlueprintGlyph,
  NYMap,
  TerpeneGlyph,
  SeedGlyph,
  RecipeGlyph,
} from "@/components/os-visuals";
import { STRAINS } from "@/lib/strains";
import { getAllGuides } from "@/lib/guides";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  openGraph: {
    title: "Lake Erie Cannabis — Grow Frosty Buds the Easy Way",
    description:
      "Premium grower-first cannabis knowledge for indoor and outdoor home growers — rooted in Western New York.",
    url: SITE,
    type: "website",
  },
  alternates: { canonical: SITE },
};

const MODULES = [
  {
    name: "Knowledge OS",
    body: "Explore the cannabis knowledge universe — topics, guides, and research in one map.",
    cta: "Explore now",
    href: "/guides",
    visual: GalaxySpiral,
  },
  {
    name: "Grow Intelligence",
    body: "Stage-by-stage grow insights, plant-health diagnostics, and cultivation guidance.",
    cta: "Optimize your grow",
    href: "/guides?stage=vegetative",
    visual: MiniSprout,
  },
  {
    name: "Build My Grow",
    body: "Answer six quick questions and get a personalized plan — setup, roadmap, gear, and exactly what to do next.",
    cta: "Build my plan",
    href: "/build-my-grow",
    visual: BlueprintGlyph,
  },
  {
    name: "Strain & Terpene Database",
    body: "Grow-focused profiles — lineage, flower time, yield, terpenes, and effects. Filter by how you want to grow and feel.",
    cta: "Explore strains",
    href: "/strains",
    visual: GemCluster,
  },
  {
    name: "Grow Like the Greats",
    body: "How the legends grow — Canucks, Kushman, Rosenthal, Bugbee and more, turned into simple grow paths you can follow.",
    cta: "Meet the greats",
    href: "/grow-like-the-greats",
    visual: LaurelGlyph,
  },
  {
    name: "Wellness Guidance",
    body: "Cannabis wellness education for body, mind, and lifestyle balance.",
    cta: "Wellness paths",
    href: "/guides?stage=troubleshooting",
    visual: LotusFigure,
  },
  {
    name: "FrostyBuds Soil Lab",
    body: "Grow like your favorite grower — pick a style and get the exact soil recipe and feeding rhythm.",
    cta: "Build your soil",
    href: "/frostybuds-soil",
    visual: SoilStrata,
  },
  {
    name: "Terpene Hub",
    body: "The 7 dominant cannabis terpenes — what they smell like, how they feel, and which strains feature each.",
    cta: "Explore terpenes",
    href: "/terpenes",
    visual: TerpeneGlyph,
  },
  {
    name: "Seeds & Breeders",
    body: "Where to buy seeds you can trust — community-vetted seed banks, top breeders, red flags to avoid, and the discount codes running right now.",
    cta: "Find seeds & codes",
    href: "/seeds",
    visual: SeedGlyph,
  },
  {
    name: "Recipes & Preparations",
    body: "Turn your harvest into edibles, tinctures, topicals, and concentrates — with real dosing math.",
    cta: "View recipes",
    href: "/recipes",
    visual: RecipeGlyph,
  },
  {
    name: "The Gear Index",
    body: "The staple products of home growing — indoor and outdoor, budget to premium, filterable to your setup.",
    cta: "Shop the setup",
    href: "/gear",
    visual: GearGlyph,
  },
  {
    name: "Local NY Hub",
    body: "Buffalo to Niagara: laws, licensed dispensaries, and community resources.",
    cta: "View local resources",
    href: "/local-ny",
    visual: NYMap,
  },
];

function StatIcon({ kind }: { kind: "leaf" | "path" | "gem" | "ny" }) {
  const stroke = "url(#statG)";
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <defs>
        <linearGradient id="statG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      {kind === "leaf" && (
        <path
          d="M12 21 C11 15 11 9 12 3 C13 9 13 15 12 21 Z M12 18 C7.5 16 5 12.5 4 8 C8.5 10 11 13.5 12 18 Z M12 18 C16.5 16 19 12.5 20 8 C15.5 10 13 13.5 12 18 Z"
          fill={stroke}
        />
      )}
      {kind === "path" && (
        <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
          <circle cx="5" cy="19" r="2.2" />
          <circle cx="12" cy="8" r="2.2" />
          <circle cx="19" cy="16" r="2.2" />
          <path d="M6.5 17.2 L10.5 10 M13.8 9.4 L17.4 14.5" />
        </g>
      )}
      {kind === "gem" && (
        <path
          d="M12 3 L18 9 L12 21 L6 9 Z M6 9 L18 9"
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
      {kind === "ny" && (
        <path
          d="M3 8 L10 6.5 L13 7 L14.5 5 L16.5 5.5 L17 8 L21 8.8 L21 12 L19 14 L19.6 16 L17 15.4 L20 18 L22 17.6 L22.4 19 L18.6 20 L14 18.4 L12 16 L8 15 L3 12.5 L4.4 10 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function HomePage() {
  const guides = getAllGuides();
  const featured = guides.filter((g) => !g.membersOnly).slice(0, 3);
  const memberCount = guides.filter((g) => g.membersOnly).length;
  const doctorOnline = Boolean(process.env.ANTHROPIC_API_KEY);

  const stats = [
    { icon: "leaf" as const, n: `${guides.length}`, l: "Field guides", s: "Growing weekly" },
    { icon: "gem" as const, n: `${STRAINS.length}`, l: "Strain profiles", s: "Deep grow data" },
    { icon: "path" as const, n: `${memberCount}`, l: "Member deep-dives", s: "Free to unlock" },
    { icon: "ny" as const, n: "WNY", l: "Focused", s: "Buffalo → Niagara" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lake Erie Cannabis",
    url: SITE,
    description:
      "Premium grower-first cannabis knowledge for indoor and outdoor home growers — rooted in Western New York.",
    publisher: {
      "@type": "Organization",
      name: "Lake Erie Cannabis",
      url: SITE,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/guides?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OsHeader />

      <main>
        {/* ─────────────────────────── HERO ─────────────────────────── */}
        <section className="relative min-h-[92vh] overflow-hidden bg-void">
          {/* living banner — the real Lake Erie Cannabis art, slowly drifting */}
          <div className="hero-drift pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src="/lake-erie-hero.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          {/* drifting smoke over the water */}
          <div className="smoke smoke-a pointer-events-none absolute inset-0" aria-hidden />
          <div className="smoke smoke-b pointer-events-none absolute inset-0" aria-hidden />
          {/* rippling shimmer along the water line */}
          <div className="water-shimmer pointer-events-none absolute inset-x-0 bottom-0 h-2/5" aria-hidden />
          {/* legibility scrims (top nav + bottom CTAs) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,7,12,0.72) 0%, transparent 18%, transparent 50%, rgba(5,7,12,0.88) 100%)",
            }}
          />

          <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-end px-4 pb-14 pt-24 text-center sm:px-6">
            <h1 className="sr-only">
              Lake Erie Cannabis — Grow Frosty Buds the Easy Way
            </h1>

            {/* grower-first hook */}
            <p
              className="rise mx-auto max-w-xl text-base font-medium leading-relaxed text-frost sm:text-lg"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}
            >
              Grow frosty, high-quality buds the easy way — indoor or outdoor.
              Simple, step-by-step cannabis growing, backed by an AI plant
              doctor and rooted in Western New York.
            </p>

            {/* three-button front door */}
            <div className="rise mx-auto mt-8 flex max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row">
              <Link
                href="/start"
                className="btn-iris rounded-full px-6 py-3.5 text-center font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
              >
                Start My First Grow →
              </Link>
              <Link
                href="/plant-doctor"
                className="glass-hi rounded-full px-6 py-3.5 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
              >
                Fix My Plant
              </Link>
              <Link
                href="/strains"
                className="glass-hi rounded-full px-6 py-3.5 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
              >
                Find Better Genetics
              </Link>
            </div>

            <div className="rise mt-7 flex justify-center">
              <WeatherChip />
            </div>
          </div>
        </section>

        {/* live status HUD + stats — on the void, below the hero */}
        <section className="relative bg-void">
          {/* live status HUD */}
          <div className="relative mx-auto max-w-4xl px-4 pb-4 pt-12 sm:px-6">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <SystemStatus doctorOnline={doctorOnline} />
              <PlantDoctorCard online={doctorOnline} />
            </div>
          </div>

          {/* stats bar */}
          <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6">
            <dl className="glass iris-border grid grid-cols-2 divide-white/5 overflow-hidden rounded-2xl lg:grid-cols-4 lg:divide-x">
              {stats.map((s) => (
                <div key={s.l} className="flex items-center gap-4 px-5 py-5">
                  <StatIcon kind={s.icon} />
                  <div>
                    <dt className="font-display text-2xl font-semibold leading-none text-frost">
                      {s.n}{" "}
                      <span className="font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-frost-dim">
                        {s.l}
                      </span>
                    </dt>
                    <dd className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan">
                      {s.s}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

        </section>

        {/* ──────────────────── MODULE CARDS ──────────────────── */}
        <section className="relative border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((m) => {
                const V = m.visual;
                return (
                  <Link
                    key={m.name}
                    href={m.href}
                    className="group glass relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-1 hover:brightness-110"
                  >
                    <V className="h-24 w-full" />
                    <h3 className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">
                      {m.name}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-frost-dim">
                      {m.body}
                    </p>
                    <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-frost transition group-hover:translate-x-1">
                      {m.cta} →
                    </span>
                  </Link>
                );
              })}
            </Reveal>
          </div>
        </section>

        {/* ──────────────────── FEATURED GUIDES ──────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">
                  Open to everyone
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                  Start reading — free, no account.
                </h2>
              </div>
              <Link
                href="/guides"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan underline-offset-4 hover:underline"
              >
                All guides →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </div>
        </section>

        {/* ──────────────────── MEMBERSHIP ──────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="glass iris-border grain relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
              <div
                aria-hidden
                className="aurora pointer-events-none absolute -bottom-28 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(ellipse at center, var(--magenta) 0%, var(--violet) 55%, transparent 75%)",
                  opacity: 0.35,
                }}
              />
              <p className="relative font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
                Free membership
              </p>
              <h2 className="relative mx-auto mt-4 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Unlock the full <span className="iris-text">Sanctuary.</span>
              </h2>
              <p className="relative mx-auto mt-4 max-w-lg text-frost-dim">
                Training techniques, week-by-week flowering, living-soil
                recipes, and pest rescue — {memberCount} advanced deep-dives
                open the moment you create a free account. No card, no spam.
              </p>
              <Link
                href="/join"
                className="btn-iris relative mt-8 inline-block rounded-full px-8 py-3.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
              >
                Create your free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <OsFooter />
    </div>
  );
}
