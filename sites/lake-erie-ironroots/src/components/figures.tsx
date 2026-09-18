/**
 * Bulletin figures — line work, ink on paper, captioned.
 *
 * These are the one illustrated moment the art direction allows, and they are
 * drawings rather than photographs on purpose. The farm has no photographs yet
 * and generated ones would be a picture of a room that does not exist; a
 * labelled cross-section declares itself as a diagram and claims nothing about
 * what this particular bench looks like.
 *
 * Drawn the way an agricultural extension bulletin draws: a figure number, a
 * caption, leader lines to plain labels, and no shading.
 *
 * Label geometry is load-bearing. SVG text does not wrap and does not shrink —
 * it runs straight off the edge of the viewBox and is clipped mid-word, which
 * is exactly what the first version of Fig. 2 did ("Keeps the sur", "Air is a
 * nut"). The width budget below is therefore exported and asserted in
 * figures.test.ts rather than being eyeballed.
 */

/** Plex Mono advance width is 0.6em. One character at font-size 11 is 6.6px. */
export const LABEL_CHAR_PX = 6.6;
export const LABEL_FONT_SIZE = 11;
/** Where the right-hand label column starts, and how much room it then has. */
export const LABEL_X = 236;
export const FIGURE_WIDTH = 480;
/** A label must end at least this far inside the right edge. */
export const LABEL_MARGIN = 10;

export function maxLabelChars(): number {
  return Math.floor((FIGURE_WIDTH - LABEL_X - LABEL_MARGIN) / LABEL_CHAR_PX);
}

const ink = "#1b1916";
const ink2 = "#4b4439";
const rule = "#b5aa95";
const mono = "var(--font-mono)";

function Figure({
  number,
  caption,
  description,
  height,
  children,
}: {
  number: string;
  caption: string;
  /** Read instead of the drawing by anyone who cannot see it. */
  description: string;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${FIGURE_WIDTH} ${height}`}
        role="img"
        aria-label={description}
        className="block w-full"
      >
        {children}
      </svg>
      <figcaption className="fig mt-4 text-ink-2">
        <span className="text-ink">{number}</span> {caption}
      </figcaption>
    </figure>
  );
}

/**
 * The furthest right a leader line may reach.
 *
 * A leader that runs past this collides with the first character of its own
 * label — "Shallow reserve" shipped with the rule struck through the S, because
 * its target sat 8px from the label column and the elbow was drawn 10px to the
 * right of the target. Anything a leader points at must be left of this.
 */
export const LEADER_MAX_X = LABEL_X - 12;

/** A right-column label with a leader line back to the thing it names. */
function Label({
  y,
  toX,
  toY,
  children,
}: {
  y: number;
  toX: number;
  toY: number;
  children: string;
}) {
  // Clamped rather than trusted: the elbow can never cross into the text.
  const elbow = Math.min(toX + 10, LEADER_MAX_X);
  return (
    <>
      <polyline
        points={`${LEADER_MAX_X},${y - 4} ${elbow},${y - 4} ${toX},${toY}`}
        fill="none"
        stroke={rule}
        strokeWidth="0.75"
      />
      <text x={LABEL_X} y={y} fill={ink2} fontSize={LABEL_FONT_SIZE} fontFamily={mono}>
        {children}
      </text>
    </>
  );
}

/* --------------------------------------------------------------- Fig. 1 --- */

/** Labels are exported so the test can measure the real strings. */
export const AUTOPOT_LABELS = [
  "Living soil",
  "Feeder roots",
  "Shallow reserve",
  "Float valve — refills",
  "once the pot runs dry",
] as const;

export function AutoPotFigure() {
  return (
    <Figure
      number="Fig. 1"
      caption="An AutoPot in section. The tray holds a shallow reserve, and the float valve refills it only once the plant has drunk it dry — so the soil runs through a real wet-and-dry cycle instead of sitting saturated. That cycle is what keeps the biology in the pot alive."
      description="Cross-section of an AutoPot: a plant growing in a pot of living soil that stands in a shallow tray of water, with a float valve at one side which refills the tray only after the plant has emptied it."
      height={320}
    >
      {/* stem */}
      <path d="M150 116 V52" fill="none" stroke={ink} strokeWidth="1.8" />
      {/* leaves — simple bulletin silhouettes, one pair and a tip */}
      <path
        d="M150 74 C 128 62 108 66 98 80 C 120 92 142 88 150 74 Z"
        fill="none"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path
        d="M150 96 C 172 84 192 88 202 102 C 180 114 158 110 150 96 Z"
        fill="none"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path
        d="M150 60 C 142 50 142 44 148 38 C 156 44 156 52 150 60 Z"
        fill="none"
        stroke={ink}
        strokeWidth="1.2"
      />

      {/* pot wall, tapered */}
      <path d="M92 116 L208 116 L196 244 L104 244 Z" fill="none" stroke={ink} strokeWidth="1.8" />

      {/* living soil — crumb structure */}
      <g fill={ink2} opacity="0.5">
        {[
          [110, 134], [132, 128], [154, 138], [176, 130], [196, 138],
          [104, 156], [128, 150], [150, 160], [172, 152], [192, 160],
          [110, 178], [134, 174], [158, 184], [182, 176],
          [116, 200], [140, 196], [164, 206], [186, 198],
          [120, 224], [144, 220], [168, 228], [188, 220],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.1 : 1.3} />
        ))}
      </g>

      {/* feeder roots */}
      <g fill="none" stroke={ink} strokeWidth="0.9" opacity="0.85">
        <path d="M150 116 V230" />
        <path d="M150 146 C 134 158 126 178 124 204" />
        <path d="M150 146 C 166 158 174 178 176 204" />
        <path d="M150 178 C 140 190 136 208 136 230" />
        <path d="M150 178 C 160 190 164 208 164 230" />
        <path d="M124 204 C 118 214 116 222 116 234" />
        <path d="M176 204 C 182 214 184 222 184 234" />
      </g>

      {/* tray */}
      <path d="M72 244 L228 244 L228 284 L72 284 Z" fill="none" stroke={ink} strokeWidth="1.8" />
      {/* water, hatched, with its surface line */}
      <g stroke={rule} strokeWidth="0.75">
        {Array.from({ length: 19 }, (_, i) => (
          <line key={i} x1={76 + i * 8} y1="282" x2={84 + i * 8} y2="264" />
        ))}
      </g>
      <line x1="72" y1="264" x2="228" y2="264" stroke={ink} strokeWidth="1.1" />

      {/* float valve, outboard of the tray */}
      <path d="M40 248 L72 248 L72 284 L40 284 Z" fill="none" stroke={ink} strokeWidth="1.4" />
      <circle cx="56" cy="268" r="6.5" fill="none" stroke={ink} strokeWidth="1.2" />
      <path d="M56 261.5 V250" fill="none" stroke={ink} strokeWidth="1" />
      <path d="M40 256 H 22" fill="none" stroke={ink} strokeWidth="1.4" />

      <Label y={140} toX={208} toY={150}>{AUTOPOT_LABELS[0]}</Label>
      <Label y={196} toX={184} toY={206}>{AUTOPOT_LABELS[1]}</Label>
      <Label y={262} toX={200} toY={270}>{AUTOPOT_LABELS[2]}</Label>
      <Label y={300} toX={56} toY={288}>{AUTOPOT_LABELS[3]}</Label>
      <text x={LABEL_X} y={314} fill={ink2} fontSize={LABEL_FONT_SIZE} fontFamily={mono}>
        {AUTOPOT_LABELS[4]}
      </text>
    </Figure>
  );
}

/* --------------------------------------------------------------- Fig. 2 --- */

/**
 * Notes are short by contract, not by truncation.
 *
 * The first version sliced them to 33 characters with an ellipsis and still
 * overran the viewBox, so the reader got a clipped half-word and no ellipsis.
 * These are written to fit and the test proves they do.
 */
export const SOIL_BANDS = [
  { y: 36, h: 44, name: "Mulch", note: "Straw and leaf" },
  { y: 80, h: 70, name: "Amendment", note: "Kelp, crab, neem, basalt" },
  { y: 150, h: 84, name: "Root zone", note: "Fungal network, feeders" },
  { y: 234, h: 56, name: "Aeration", note: "Pumice and bark" },
] as const;

export function SoilColumnFigure() {
  return (
    <Figure
      number="Fig. 2"
      caption="The column, top to bottom. Nothing is fed to the plant directly — amendments feed the soil biology, and the biology releases it to the roots on its own schedule. That is the whole difference between living soil and a bottle of nutrients."
      description="A living soil column in four layers from the surface down: mulch, amendment, root zone and aeration. Amendments feed soil organisms rather than the plant, and those organisms release nutrients upward to the roots."
      height={320}
    >
      {SOIL_BANDS.map((b, i) => (
        <g key={b.name}>
          <rect
            x="56"
            y={b.y}
            width="156"
            height={b.h}
            fill="none"
            stroke={ink}
            strokeWidth={i === 0 ? 1.8 : 1}
          />
          <line x1="212" y1={b.y + 14} x2={LABEL_X - 10} y2={b.y + 14} stroke={rule} strokeWidth="0.75" />
          <text x={LABEL_X} y={b.y + 18} fill={ink} fontSize="13" fontFamily={mono}>
            {b.name}
          </text>
          <text x={LABEL_X} y={b.y + 34} fill={ink2} fontSize={LABEL_FONT_SIZE} fontFamily={mono}>
            {b.note}
          </text>
        </g>
      ))}

      {/* crumb texture through the working bands */}
      <g fill={ink2} opacity="0.5">
        {[
          [74, 98], [98, 106], [124, 94], [150, 110], [178, 100], [200, 108],
          [68, 126], [94, 134], [122, 122], [152, 136], [184, 128],
          [76, 170], [104, 180], [132, 166], [162, 182], [192, 172],
          [70, 206], [100, 214], [130, 200], [160, 216], [190, 204],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2 : 1.3} />
        ))}
      </g>

      {/* fungal threads through the root zone */}
      <g fill="none" stroke={ink} strokeWidth="0.7" opacity="0.7">
        <path d="M60 162 C 86 176 110 154 138 172 C 160 186 182 166 208 178" />
        <path d="M60 196 C 88 208 108 188 136 202 C 162 214 184 196 208 208" />
      </g>

      {/* the release arrow: biology hands nutrients upward to the roots */}
      <path d="M36 248 V 112" fill="none" stroke={ink} strokeWidth="1.1" />
      <path d="M36 112 l -4.5 9 M36 112 l 4.5 9" fill="none" stroke={ink} strokeWidth="1.1" />
      <text
        x="20"
        y="268"
        fill={ink2}
        fontSize={LABEL_FONT_SIZE}
        fontFamily={mono}
        transform="rotate(-90 20 268)"
      >
        released upward
      </text>
    </Figure>
  );
}
