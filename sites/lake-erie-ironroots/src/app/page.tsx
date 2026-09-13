import Link from "next/link";
import { FarmJsonLd } from "@/components/json-ld";
import { ReadyNow } from "@/components/ready-now";
import { RootLine } from "@/components/root-line";
import { SeasonRule } from "@/components/season-rule";
import { Wordmark } from "@/components/wordmark";
import { humanTime } from "@/components/site-footer";
import { establishedLine, FARM, PILLARS, SOIL_HORIZONS } from "@/lib/farm";
import { farmToday } from "@/lib/clock";
import { frostLine } from "@/lib/season";

/**
 * Re-rendered hourly. The page states what is ready *today*, so it cannot be
 * baked once at build time — and it must not be request-time dynamic either,
 * or every visitor pays for a render of a page that changes at most once a
 * day. An hour is the honest middle: always right, always CDN-cacheable.
 */
export const revalidate = 3600;

/** One shared container, so the left gutter for the Root Line never drifts. */
const SHELL = "mx-auto w-full max-w-6xl px-5 md:pr-8 md:pl-32";

export default function Home() {
  const today = farmToday();

  return (
    <>
      <FarmJsonLd />
      <RootLine />

      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden">
        {/* The horizon from the brand artwork: one light source, low and
            warm, behind everything. A single gradient — no image request. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 70% at 78% 92%, color-mix(in srgb, var(--color-ember) 26%, transparent) 0%, transparent 58%)",
          }}
        />

        <div className={`${SHELL} relative py-20 md:py-32`}>
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
              Stand open {FARM.openSeason.from}&ndash;{FARM.openSeason.to} ·{" "}
              {FARM.hours[0].days[0]}&ndash;
              {FARM.hours[FARM.hours.length - 1].days[0]}
            </p>
            <p className="ml-auto hidden text-xs text-iron sm:block">
              {establishedLine()}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- ready -- */}
      <section id="ready" className="scroll-mt-20 py-20 md:py-28">
        <div className={SHELL}>
          <ReadyNow today={today} />
          <div className="mt-20 border-t border-[var(--hairline)] pt-12">
            <SeasonRule today={today} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- farm -- */}
      <section id="farm" className="scroll-mt-20 py-20 md:py-28">
        <div className={SHELL}>
          <h2 className="display text-3xl md:text-5xl">What we stand on</h2>
          <p className="prose-farm mt-5">
            Five lines came with the name. They are not a mission statement; they
            are the things we check a decision against.
          </p>

          <ul className="mt-14 grid list-none gap-px p-0 md:grid-cols-2">
            {PILLARS.map((p) => (
              <li
                key={p.id}
                className="min-w-0 border-t border-[var(--hairline)] py-8 md:pr-10"
              >
                <h3 className="display text-2xl text-gold-lit">{p.title}</h3>
                <p className="prose-farm mt-3 text-sm">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------- the ground -- */}
      <section className="relative py-20 md:py-28">
        <div className={SHELL}>
          <h2 className="display text-3xl md:text-5xl">The ground itself</h2>
          <p className="prose-farm mt-5">
            The county and the soil share a name. The Chautauqua series is a
            gravelly silt loam laid down by a glacier and the old beaches of a
            bigger lake, and its lower horizons are published in Munsell
            notation as <strong className="text-parchment">10YR 4/4</strong> —
            dark yellowish brown. That colour is iron oxide. The farm is called
            IronRoots because the name is the colour of the dirt.
          </p>

          <div className="mt-12 max-w-3xl">
            {SOIL_HORIZONS.map((h) => (
              <div key={h.id} className="flex items-stretch gap-4 md:gap-6">
                <div className="w-10 shrink-0 pt-3 text-right">
                  <span className="label text-[0.5625rem] text-iron">
                    {h.id}
                  </span>
                </div>
                <div
                  className="w-6 shrink-0 md:w-10"
                  style={{ background: h.hex }}
                  aria-hidden="true"
                />
                <div className="min-w-0 grow border-t border-[var(--hairline)] py-3">
                  <p className="text-sm text-parchment/85">{h.label}</p>
                  <p className="text-xs text-iron tabular-nums">
                    {h.from}&ndash;{h.to} inches
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- visit -- */}
      {/* Daylight. The one inverted band on the site: this is the section a
          person reads standing in a parking lot, so it gets the readable
          palette rather than the atmospheric one. */}
      <section className="relative z-40 bg-parchment text-[#3A2E20]">
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
                    <dt className="text-[#2A2118]">{h.days.join(" & ")}</dt>
                    <dd className="tabular-nums text-[#4A3B29]">
                      {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm text-[#4A3B29]">
                {FARM.address.street}, {FARM.address.locality},{" "}
                {FARM.address.region} {FARM.address.postalCode}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
