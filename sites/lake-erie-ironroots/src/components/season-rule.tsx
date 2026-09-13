import {
  CROPS,
  cropSegment,
  FIRST_FALL_FROST,
  formatWindow,
  frostLine,
  isReady,
  LAST_SPRING_FROST,
  monthTicks,
  resolve,
  seasonPosition,
} from "@/lib/season";

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * The Season Rule — the quiet instrument.
 *
 * Every crop's harvest window drawn against the real frost-to-frost span for
 * this county, with today marked. Whatever the marker crosses is what is in
 * the truck this morning; that is the entire argument, made without a
 * sentence of marketing copy.
 *
 * Server Component: static HTML and CSS percentages. No chart library, no
 * canvas, no client JavaScript.
 *
 * GEOMETRY, and why it is written this way. Every row is [label | track], and
 * a bar's `left`/`width` are percentages of the TRACK. Anything else drawn on
 * the chart must therefore be positioned inside a box that spans the track and
 * nothing else — which is what `.season-overlay` below is for.
 *
 * The first version of this component put the marker directly in the row
 * wrapper with a `ml-[7.5rem]` label offset. On an absolutely positioned
 * element that margin is ADDED to the used `left`, and the percentage resolved
 * against the full row rather than the track, so the marker landed a full
 * label-width too far right — 16 days late, sitting past the end of bars the
 * same component had lit as "ready today". There is a test pinning this now.
 */
export function SeasonRule({ today }: { today: Date }) {
  const year = today.getFullYear();
  const marker = seasonPosition(today);
  const ticks = monthTicks(year);
  const rows = CROPS.map((crop) => ({
    crop,
    seg: cropSegment(crop, year),
    live: isReady(crop, today),
  }));
  const readyCount = rows.filter((r) => r.live).length;

  const todayLabel = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="label">The season, drawn to scale</h3>
        <p className="text-sm text-iron">
          Last frost {shortDate(resolve(LAST_SPRING_FROST, year))} · First frost{" "}
          {shortDate(resolve(FIRST_FALL_FROST, year))} ·{" "}
          <span className="text-ember">{frostLine(today)}</span>
        </p>
      </figcaption>

      {/*
        The label column is one variable so the track overlay and the rows can
        never drift apart. It narrows on a phone so the whole five-month axis
        fits on screen: a chart that needs sideways scrolling hides bars, and a
        hidden bar reads as "we do not have that", which is the exact opposite
        of what this drawing exists to say.
      */}
      <div
        className="mt-6 overflow-x-auto [--label-w:5.5rem] md:[--label-w:7.5rem]"
      >
        <div className="min-w-[19rem]">
          {/* Month axis. Statically positioned, so the margin shrinks the box
              rather than offsetting it, and the percentages are track-relative. */}
          <div className="relative mb-2 ml-[var(--label-w)] h-4">
            {ticks.map((t) => (
              <span
                key={t.label}
                className="label absolute top-0 -translate-x-1/2 text-[0.5625rem] text-iron"
                style={{ left: pct(t.at) }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="relative">
            {/* Spans exactly the track, so everything inside is measured
                against the same box the bars are. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 left-[var(--label-w)] z-0"
            >
              {/* First frost: the one date the whole chart is organised
                  around, and it was named in the caption but never drawn. */}
              <div
                className="absolute inset-y-0 right-0 w-0 border-r border-dashed border-iron/70"
                title="First frost"
              />
              {/* Today. */}
              <div
                className="absolute inset-y-0 w-[2px] bg-ember"
                style={{ left: pct(marker) }}
              />
            </div>

            <ul className="relative z-10 m-0 list-none p-0">
              {rows.map(({ crop, seg, live }) => (
                <li key={crop.id} className="flex items-center py-[3px]">
                  <span
                    className={`w-[var(--label-w)] shrink-0 pr-3 text-right text-[0.6875rem] md:text-xs ${
                      live ? "text-parchment" : "text-iron"
                    }`}
                  >
                    {crop.name}
                    {/*
                      The bars carry "ready" in colour alone, which is a WCAG
                      1.4.1 failure and leaves a screen reader with a bare list
                      of twenty crop names that reads identically in January and
                      August. This says it in words instead.
                    */}
                    <span className="sr-only">
                      {" — "}
                      {formatWindow(crop)}
                      {live ? ", ready today" : ", not ready today"}
                    </span>
                  </span>
                  <span className="relative h-[6px] grow">
                    <span
                      className="absolute inset-y-0 block"
                      style={{
                        left: pct(seg.start),
                        width: pct(Math.max(seg.end - seg.start, 0.006)),
                        // An opaque mix against the ground, not alpha: 45%
                        // gold over near-black desaturates to a murky olive
                        // that reads as "disabled" rather than as gold.
                        background: live
                          ? "var(--color-ember)"
                          : "color-mix(in srgb, var(--color-gold) 34%, var(--color-pier))",
                        // A window that runs past first frost fades out rather
                        // than stopping dead, because the crop does not stop.
                        maskImage: seg.overrunsFrost
                          ? "linear-gradient(90deg, #000 78%, transparent)"
                          : undefined,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>

            {/* The marker's label sits under the chart so it cannot collide
                with a bar, and it names the date rather than implying it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 left-[var(--label-w)] -bottom-5"
            >
              <span
                className="label absolute -translate-x-1/2 text-[0.5625rem] whitespace-nowrap text-ember"
                style={{ left: pct(marker) }}
              >
                Today · {todayLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-iron">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[6px] w-6 bg-ember" aria-hidden="true" />
          Ready today ({readyCount})
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-[6px] w-6"
            style={{
              background:
                "color-mix(in srgb, var(--color-gold) 34%, var(--color-pier))",
            }}
            aria-hidden="true"
          />
          Its window, elsewhere in the year
        </span>
      </p>
    </figure>
  );
}
