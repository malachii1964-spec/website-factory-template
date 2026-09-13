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
 *   - narrow screens                   -> branches hide, the trunk stays
 * In every case it is a finished drawing, never an empty rail.
 */
export function RootLine() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 z-30 w-5 select-none md:w-28"
    >
      {/*
        Stroke colours come from Tailwind classes, not from a `stroke="var(...)"`
        presentation attribute: Chromium does not substitute custom properties
        in SVG presentation attributes, so that renders nothing at all.
      */}
      <svg
        className="root-line h-full w-full stroke-gold"
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
