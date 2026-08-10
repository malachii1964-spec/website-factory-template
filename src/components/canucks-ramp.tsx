import { METHOD_EVENTS } from "@/lib/canucks-method";

/**
 * THE RAMP — the signature element of this page.
 *
 * Seven columns, one per event in the method. Each column is a vertical split
 * bar: gold on top for All Purpose 4-4-4, magenta below for Power Bloom 2-8-4,
 * sized to the real ratio at that point in the grow. Read left to right the
 * gold drains away and the magenta rises. That descending staircase IS the
 * method — everything else on this page is a footnote to it.
 *
 * Pure CSS, no JS, no layout animation: the only motion is a transform-based
 * rise on load, disabled under prefers-reduced-motion.
 */
export function CanucksRamp() {
  return (
    <figure className="glass iris-border rounded-3xl p-5 sm:p-7">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          The ramp
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
          Amendment ratio, week 0 → harvest
        </p>
      </figcaption>

      <div className="mt-5 flex items-end gap-1.5 sm:gap-2.5">
        {METHOD_EVENTS.map((e, i) => (
          <div key={e.id} className="flex min-w-0 flex-1 flex-col">
            {/* The bar. Height is fixed; the SPLIT is the data. */}
            {/* A milestone with no feeding is drawn as a low hollow marker,
                so the eye only counts the five events that actually feed. */}
            <div className="ramp-col flex h-28 w-full flex-col justify-end sm:h-40">
              {e.tbspPerGal === 0 ? (
                <div
                  className="h-3 w-full rounded-md border border-dashed border-white/25"
                  style={{ animationDelay: `${i * 70}ms` }}
                />
              ) : (
                <div
                  className="h-full w-full overflow-hidden rounded-md"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div
                    className="w-full bg-gold/85"
                    style={{ height: `${e.apPct}%` }}
                  />
                  <div
                    className="w-full bg-magenta/85"
                    style={{ height: `${100 - e.apPct}%` }}
                  />
                </div>
              )}
            </div>

            <span className="mt-2 truncate text-center font-mono text-[9px] uppercase tracking-[0.1em] text-frost-dim sm:text-[10px]">
              wk {e.week}
            </span>
            <span className="text-center font-mono text-[10px] font-semibold text-frost sm:text-xs">
              {e.tbspPerGal === 0 ? "—" : `${e.apPct}/${100 - e.apPct}`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-gold/85" />
          All Purpose 4-4-4
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-magenta/85" />
          Power Bloom 2-8-4
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-white/30" />
          Milestone, no feed
        </span>
      </div>
    </figure>
  );
}
