/**
 * THE SIGNATURE — the Root Line.
 *
 * One gold root descends the left edge of the page and branches once per
 * section, ending in the root spread from the brand mark. It is drawn by a
 * native CSS scroll timeline (see globals.css): the growth runs on the
 * compositor, off the main thread, and this component ships no JavaScript at
 * all — it is a Server Component rendering static SVG.
 *
 * Degradation is deliberate:
 *   - no `animation-timeline` support  -> the root renders fully drawn
 *   - prefers-reduced-motion           -> the root renders fully drawn
 *   - narrow screens                   -> a second, narrower viewBox framed
 *                                        on the trunk; branches hide
 * In every case it is a finished drawing, never an empty rail.
 */
export function RootLine() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 z-30 w-6 select-none md:w-28"
    >
      {/*
        A phone gets its own viewBox, framed on the trunk.

        The desktop drawing is `viewBox="0 0 96 800"` with `xMinYMid slice`, and
        `slice` scales to COVER: in a 20px-wide box at 812px tall the scale is
        driven by height (1.015), which puts the trunk's user-space x of 30-44
        at 30-42 device pixels — entirely outside a 20px overflow-hidden box.
        The result was zero visible paths below 768px: the site's whole visual
        identity, absent on the device most of this farm's customers use.
        Shifting the viewBox window over the trunk fixes it without touching
        the path data, which stays shared between the two.
      */}
      <svg
        className="root-line h-full w-full stroke-gold md:hidden"
        viewBox="26 0 22 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        strokeLinecap="round"
      >
        <path
          data-branch="trunk"
          pathLength={1}
          d="M30 -20 C30 90 44 150 38 240 C32 330 46 420 40 520 C34 620 44 700 38 820"
          strokeWidth={2.4}
          opacity={0.8}
        />
      </svg>

      {/*
        Stroke colours come from Tailwind classes, not from a `stroke="var(...)"`
        presentation attribute: Chromium does not substitute custom properties
        in SVG presentation attributes, so that renders nothing at all.
      */}
      <svg
        className="root-line hidden h-full w-full stroke-gold md:block"
        viewBox="0 0 96 800"
        preserveAspectRatio="xMinYMid slice"
        fill="none"
        strokeLinecap="round"
      >
        {/* The trunk. Runs the whole scroll. */}
        <path
          data-branch="trunk"
          pathLength={1}
          d="M30 -20 C30 90 44 150 38 240 C32 330 46 420 40 520 C34 620 44 700 38 820"
          strokeWidth={2}
          opacity={0.8}
        />

        {/* Five branches — one per pillar, in the brand's own order. */}
        <g className="hidden md:block" strokeWidth={1.3} opacity={0.9}>
          <path data-branch="1" pathLength={1} d="M34 120 C52 128 64 138 80 148" />
          <path data-branch="2" pathLength={1} d="M40 252 C56 260 70 270 84 284" />
          <path data-branch="3" pathLength={1} d="M36 392 C54 400 66 410 80 420" />
          <path data-branch="4" pathLength={1} d="M40 530 C58 540 68 552 86 562" />
          <path data-branch="5" pathLength={1} d="M36 668 C54 676 68 688 80 700" />
        </g>

        {/* The spread, from the mark: fine rootlets where the trunk ends. */}
        <g
          className="hidden stroke-gold-lit md:block"
          strokeWidth={0.9}
          opacity={0.75}
        >
          <path data-branch="5" pathLength={1} d="M38 720 C30 744 20 760 10 786" />
          <path data-branch="5" pathLength={1} d="M38 726 C46 752 58 768 68 792" />
          <path data-branch="5" pathLength={1} d="M38 734 C38 758 36 774 34 798" />
        </g>
      </svg>
    </div>
  );
}
