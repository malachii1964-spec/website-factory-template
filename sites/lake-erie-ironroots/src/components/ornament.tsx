/**
 * The plate's own ornament language, redrawn as SVG.
 *
 * The artwork carries a consistent set of marks — a hairline rule broken by a
 * small diamond, a compass rose between ESTD and 2024, and five line glyphs
 * under the pillars. They are what make the plate feel made rather than
 * assembled, and repeating them through the site is what ties a page of crop
 * rows back to the front door.
 *
 * Everything here is stroke-only, in the plate's gold, at the same weight.
 * Nothing is filled except the diamonds, which are filled in the original.
 */

/** A rule broken by a diamond, as under the wordmark. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-stone/60" />
      <svg width="9" height="9" viewBox="0 0 9 9" className="shrink-0">
        <path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5 Z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-stone/60" />
    </div>
  );
}

/** The compass rose that sits between ESTD and the year. */
export function Compass({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="13" />
      <circle cx="20" cy="20" r="6.5" />
      <path d="M20 1 L22.6 17.4 L20 20 L17.4 17.4 Z" />
      <path d="M20 39 L17.4 22.6 L20 20 L22.6 22.6 Z" />
      <path d="M1 20 L17.4 17.4 L20 20 L17.4 22.6 Z" />
      <path d="M39 20 L22.6 22.6 L20 20 L22.6 17.4 Z" />
    </svg>
  );
}

/* ------------------------------------------------------- pillar glyphs --- */

const glyph = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Built on Purpose — the ridge line. */
function Mountains() {
  return (
    <>
      <path d="M2 26 L14 8 L22 19 L27 13 L38 26" {...glyph} />
      <path d="M9.5 17 L14 13.5 L18 18" {...glyph} strokeWidth={0.8} />
      <path d="M24.5 16 L27 17.5 L30 14.5" {...glyph} strokeWidth={0.8} />
    </>
  );
}

/** Rooted in Strength — the root system from the emblem. */
function Roots() {
  return (
    <>
      <path d="M20 4 V16" {...glyph} />
      <path d="M20 16 C 14 19 10 23 8 29" {...glyph} />
      <path d="M20 16 C 26 19 30 23 32 29" {...glyph} />
      <path d="M20 16 V30" {...glyph} />
      <path d="M13.5 22 C 11 25 10 27 9.5 30" {...glyph} strokeWidth={0.8} />
      <path d="M26.5 22 C 29 25 30 27 30.5 30" {...glyph} strokeWidth={0.8} />
      <path d="M20 23 C 17.5 26 16.5 28 16 30.5" {...glyph} strokeWidth={0.8} />
      <path d="M20 23 C 22.5 26 23.5 28 24 30.5" {...glyph} strokeWidth={0.8} />
    </>
  );
}

/** Guided by Integrity — the breakwall light. */
function Lighthouse() {
  return (
    <>
      <path d="M15.5 30 L17 13 H23 L24.5 30 Z" {...glyph} />
      <path d="M16.6 20 H23.4" {...glyph} strokeWidth={0.8} />
      <path d="M16.2 25 H23.8" {...glyph} strokeWidth={0.8} />
      <path d="M16.8 13 L17.6 9 H22.4 L23.2 13 Z" {...glyph} />
      <path d="M20 9 V5.5" {...glyph} strokeWidth={0.8} />
      <path d="M11 30 H29" {...glyph} />
      <path d="M13 8.5 L9 6.5 M27 8.5 L31 6.5" {...glyph} strokeWidth={0.8} />
    </>
  );
}

/** Inspired by Nature — the lake. */
function Waves() {
  return (
    <>
      <path d="M3 13 C 8 9 12 17 17 13 C 22 9 26 17 31 13 C 34 10.5 35.5 12 37 13.5" {...glyph} />
      <path d="M3 20 C 8 16 12 24 17 20 C 22 16 26 24 31 20 C 34 17.5 35.5 19 37 20.5" {...glyph} />
      <path d="M3 27 C 8 23 12 31 17 27 C 22 23 26 31 31 27 C 34 24.5 35.5 26 37 27.5" {...glyph} />
    </>
  );
}

/** Cultivating Legacy — the leaf pair. */
function Leaves() {
  return (
    <>
      <path d="M20 31 V14" {...glyph} />
      <path d="M20 20 C 13 20 9.5 16 9 10 C 15.5 10 19.5 14 20 20 Z" {...glyph} />
      <path d="M20 24 C 27 24 30.5 20 31 14 C 24.5 14 20.5 18 20 24 Z" {...glyph} />
      <path d="M13 12.5 L18 17.5 M27 16.5 L22 21.5" {...glyph} strokeWidth={0.7} />
    </>
  );
}

const GLYPHS: Record<string, () => React.JSX.Element> = {
  purpose: Mountains,
  strength: Roots,
  integrity: Lighthouse,
  nature: Waves,
  legacy: Leaves,
};

/**
 * The glyph for one pillar id. Decorative: every pillar renders its title as
 * real text beside this, so nothing is carried by the drawing alone.
 */
export function PillarGlyph({ id, size = 40 }: { id: string; size?: number }) {
  const Shape = GLYPHS[id];
  if (!Shape) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 40 36" aria-hidden="true" className="shrink-0">
      <Shape />
    </svg>
  );
}
