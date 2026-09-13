import {
  CROPS,
  cropSegment,
  FIRST_FALL_FROST,
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
 * Server Component: the whole thing is static HTML and CSS percentages. No
 * chart library, no canvas, no client JavaScript.
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

      {/* Horizontal scroll is the honest answer on a phone: the axis is a
          real measurement and squashing it would make the drawing lie. */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[34rem]">
          {/* Month axis */}
          <div className="relative mb-2 ml-[7.5rem] h-4">
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
            {/* Today. Drawn behind the rows so it never hides a segment. */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-0 ml-[7.5rem] w-px bg-ember"
              style={{ left: pct(marker) }}
              aria-hidden="true"
            />

            <ul className="relative z-10 m-0 list-none p-0">
              {rows.map(({ crop, seg, live }) => (
                <li key={crop.id} className="flex items-center gap-0 py-[3px]">
                  <span
                    className={`w-[7.5rem] shrink-0 pr-3 text-right text-xs ${
                      live ? "text-parchment" : "text-iron"
                    }`}
                  >
                    {crop.name}
                  </span>
                  <span className="relative h-[6px] grow">
                    <span
                      className="absolute inset-y-0 block"
                      style={{
                        left: pct(seg.start),
                        width: pct(Math.max(seg.end - seg.start, 0.004)),
                        background: live
                          ? "var(--color-ember)"
                          : "color-mix(in srgb, var(--color-gold) 45%, transparent)",
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
          </div>
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-iron">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[6px] w-6 bg-ember" aria-hidden="true" />
          Ready today
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-[6px] w-6"
            style={{
              background: "color-mix(in srgb, var(--color-gold) 45%, transparent)",
            }}
            aria-hidden="true"
          />
          Its window, elsewhere in the year
        </span>
      </p>
    </figure>
  );
}
