import Image from "next/image";
import Link from "next/link";
import { FarmJsonLd } from "@/components/json-ld";
import { ReadyNow } from "@/components/ready-now";
import { RootSpread, RootTrunk, Section } from "@/components/root";
import { SeasonRule } from "@/components/season-rule";
import { Wordmark } from "@/components/wordmark";
import { humanTime } from "@/components/site-footer";
import {
  establishedLine,
  FARM,
  formatDays,
  hasRealAddress,
  openDaysLine,
  PILLARS,
  SOIL_HORIZONS,
} from "@/lib/farm";
import { heroImage } from "@/lib/brand";
import { farmToday } from "@/lib/clock";
import { frostLine } from "@/lib/season";

/**
 * Revalidated every five minutes.
 *
 * The page states what is ready *today*, so it cannot be baked once at build
 * time. It must not be request-time dynamic either, or every visitor pays for
 * a render of a page that changes at most once a day.
 *
 * What ISR actually does, stated honestly rather than optimistically:
 * regeneration is triggered BY a request and serves the NEXT one. On a farm
 * stand with no overnight traffic, the first visitor after midnight is served
 * the previous render and their request kicks off the refresh. Five minutes
 * narrows that window to one stale view rather than a stale morning; it does
 * not eliminate it. A daily cron hitting the page at 5am would — see README.
 */
export const revalidate = 300;

/** One shared container, so the left gutter for the Root Line never drifts. */
const SHELL = "mx-auto w-full max-w-6xl pr-5 pl-9 md:pr-8 md:pl-28";

export default function Home() {
  const today = farmToday();
  const hero = heroImage();

  return (
    <>
      <FarmJsonLd />

      {/* ---------------------------------------------------------- hero -- */}
      <Section className="overflow-hidden" branchTop="top-[9.5rem]">
        {/*
          The horizon.

          With the owner's photograph on disk this is the real breakwall at
          sunset — the scene the entire palette was derived from, and the thing
          that turns "dark because it was decided to be dark" into "dark
          because that is what the place looks like".

          Without it, a single gradient standing in for the same light. No
          stock photograph of somebody else's farm will ever be substituted
          here; the fallback is honestly synthetic rather than dishonestly
          photographic.
        */}
        {hero.present ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <Image
              src={hero.src}
              alt=""
              fill
              // The LCP element on the site's most important page.
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/*
              A scrim, not a filter. The hero carries 72px display type and a
              CTA over this, and unreadable text on a beautiful photograph is
              still unreadable text. Weighted to the left, where the copy is,
              so the sunset stays visible on the right.
            */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-pier) 0%, color-mix(in srgb, var(--color-pier) 88%, transparent) 38%, color-mix(in srgb, var(--color-pier) 45%, transparent) 72%, color-mix(in srgb, var(--color-pier) 25%, transparent) 100%)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-32"
              style={{
                background:
                  "linear-gradient(180deg, transparent, var(--color-pier))",
              }}
            />
            {/*
              The photograph is opaque and painted over the trunk that <main>
              draws behind every section, so the root vanished for the whole
              height of the hero. The hero carries its own segment on top of
              the image, the same way the parchment bands do. Only when the
              image is present — otherwise it would double-draw over itself and
              the trunk would come out darker here than everywhere else.
            */}
            <div className="absolute inset-y-0 inset-x-0">
              <div className="relative mx-auto h-full w-full max-w-6xl">
                <RootTrunk />
              </div>
            </div>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 70% at 78% 92%, color-mix(in srgb, var(--color-ember) 26%, transparent) 0%, transparent 58%)",
            }}
          />
        )}

        <div className={`${SHELL} relative py-20 md:py-36`}>
          <p className="label rise">
            {FARM.county}, {FARM.state}
          </p>

          <div className="rise rise-2 mt-6">
            <Wordmark size="lg" as="h1" />
          </div>

          <p className="display rise rise-2 mt-8 text-2xl text-gold-lit md:text-4xl">
            {FARM.tagline}
          </p>

          <p className="prose-farm rise rise-3 mt-7 text-base md:text-lg">
            Organic fruit and vegetables grown on the Lake Erie plain — the
            narrow shelf of gravelly loam between the lake and the escarpment.
            The lake holds spring back past the killing frosts and holds autumn
            open weeks longer than inland ground. It sets the calendar here, and
            we plant to it.
          </p>

          <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="#ready"
              className="bg-ember px-6 py-4 text-sm font-medium tracking-wide text-pier uppercase transition-opacity hover:opacity-90"
            >
              See what&rsquo;s ready
            </Link>
            <Link
              href="/visit"
              className="edge-lit px-6 py-4 text-sm font-medium tracking-wide text-parchment uppercase transition-colors hover:text-gold-lit"
            >
              Hours &amp; directions
            </Link>
          </div>
        </div>

        {/* The one live reading in the hero: a fact, not a slogan. */}
        <div className="relative border-y border-[var(--hairline)]">
          <div
            className={`${SHELL} flex flex-wrap items-center gap-x-8 gap-y-2 py-4`}
          >
            <p className="label text-ember">{frostLine(today)}</p>
            <p className="text-xs text-iron">
              {/* Derived from the hours themselves. This used to splice the
                  first and last day out of the array by index, which printed a
                  wrong range the moment the rows were reordered and had no
                  test behind it. */}
              Stand open {FARM.openSeason.from}&ndash;{FARM.openSeason.to} ·{" "}
              {openDaysLine()}
            </p>
            <p className="ml-auto hidden text-xs text-iron sm:block">
              {establishedLine()}
            </p>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- ready -- */}
      <Section id="ready" className="py-14 md:py-20" side="up">
        <div className={SHELL}>
          <ReadyNow today={today} />
          <div className="mt-14 border-t border-[var(--hairline)] pt-10">
            <SeasonRule today={today} />
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- farm -- */}
      <Section id="farm" className="py-14 md:py-20">
        <div className={SHELL}>
          <h2 className="display h-sub">What we stand on</h2>
          <p className="prose-farm mt-5">
            Five lines came with the name. They are not a mission statement; they
            are the things we check a decision against.
          </p>

          {/*
            Five full-width rows, not a two-column grid. The grid left the
            fifth pillar orphaned in the left cell with half a page of void
            beside it and a hairline that stopped halfway across. Stacked, the
            five rules read as five strata and rhyme with the soil section
            below instead of fighting it.
          */}
          <ul className="mt-14 list-none p-0">
            {PILLARS.map((p) => (
              <li
                key={p.id}
                className="grid gap-x-10 gap-y-2 border-t border-[var(--hairline)] py-7 md:grid-cols-[18rem_1fr]"
              >
                <h3 className="display min-w-0 text-2xl text-gold-lit">
                  {p.title}
                </h3>
                <p className="prose-farm min-w-0 text-sm">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------------------------------------------------- the ground -- */}
      <Section className="py-14 md:py-20" side="up">
        {/* The trunk reaches the soil and fans out. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0">
          <div className="relative mx-auto h-full w-full max-w-6xl">
            <RootSpread />
          </div>
        </div>
        <div className={SHELL}>
          <h2 className="display h-sub">The ground itself</h2>
          <p className="prose-farm mt-5">
            The county and the soil share a name. The Chautauqua series is a
            gravelly silt loam laid down by a glacier and the old beaches of a
            bigger lake, and its lower horizons are published in Munsell
            notation as <strong className="text-parchment">10YR 4/4</strong> —
            dark yellowish brown. That colour is iron oxide. The farm is called
            IronRoots because the name is the colour of the dirt.
          </p>

          {/*
            Drawn to depth. Four equal bands would have been a swatch chip on a
            page that says "drawn to scale" two sections above — the O horizon
            is two inches and the C is thirty-two, and the column should show
            that. Each band's height is its real thickness; the text sits
            beside it at its own natural height.
          */}
          <div className="mt-12 flex max-w-3xl gap-4 md:gap-6">
            <div className="flex w-16 shrink-0 flex-col md:w-24">
              {SOIL_HORIZONS.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start justify-end gap-2 pr-2"
                  style={{ flexGrow: h.to - h.from, flexBasis: 0 }}
                >
                  <span className="label pt-1 text-[0.5625rem] text-iron">
                    {h.id}
                  </span>
                  <div
                    className="h-full w-6 shrink-0 md:w-10"
                    style={{ background: h.hex }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            <ul className="m-0 min-w-0 grow list-none p-0">
              {SOIL_HORIZONS.map((h) => (
                <li
                  key={h.id}
                  className="border-t border-[var(--hairline)] py-3"
                >
                  <p className="text-sm text-parchment/85">{h.label}</p>
                  <p className="text-xs text-iron tabular-nums">
                    {h.from}&ndash;{h.to} inches
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- visit -- */}
      {/* Daylight. The one inverted band on the site: this is the section a
          person reads standing in a parking lot, so it gets the readable
          palette rather than the atmospheric one. */}
      <section className="relative z-40 bg-parchment text-[#3A2E20]">
        {/* The root continues through the daylight band. */}
        <div className="pointer-events-none absolute inset-y-0 inset-x-0">
          <div className="relative mx-auto h-full w-full max-w-6xl">
            <RootTrunk tone="light" />
          </div>
        </div>
        <div className={`${SHELL} py-20 md:py-28`}>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="min-w-0">
              <p className="label text-[#8A5F18]">Come and get it</p>
              <h2 className="display mt-4 text-3xl text-[#2A2118] md:text-5xl">
                The stand is at the end of the drive
              </h2>
              <p className="prose-farm mt-5 text-[#4A3B29]">
                Pull in, park on the grass, and take what you want. Cash or card.
                If nobody is at the table we are in the field — ring the bell and
                somebody will come up.
              </p>
              <Link
                href="/visit"
                className="mt-8 inline-block border border-[#8A5F18] px-6 py-4 text-sm font-medium tracking-wide text-[#2A2118] uppercase transition-colors hover:bg-[#2A2118] hover:text-parchment"
              >
                Hours, map &amp; directions
              </Link>
            </div>

            <div className="min-w-0">
              <h3 className="label text-[#8A5F18]">This week</h3>
              <dl className="mt-5">
                {FARM.hours.map((h) => (
                  <div
                    key={h.days.join()}
                    className="flex justify-between gap-6 border-b border-[#2A2118]/15 py-3"
                  >
                    <dt className="text-[#2A2118]">{formatDays(h.days)}</dt>
                    <dd className="tabular-nums text-[#4A3B29]">
                      {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                    </dd>
                  </div>
                ))}
              </dl>
              {/* Same rule as the header, the footer and the structured
                  data: a placeholder street is not published. */}
              {hasRealAddress() ? (
                <p className="mt-5 text-sm text-[#4A3B29]">
                  {FARM.address.street}, {FARM.address.locality},{" "}
                  {FARM.address.region} {FARM.address.postalCode}
                </p>
              ) : (
                <p className="mt-5 text-sm text-[#4A3B29]">
                  {FARM.address.locality} area, {FARM.county}. The exact address
                  goes up before opening day.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
