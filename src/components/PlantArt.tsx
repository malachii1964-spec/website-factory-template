import type { CategoryId } from "@/lib/plants";
import { cn } from "@/lib/cn";

/**
 * Designed placeholder art. Renders a lightweight, deterministic botanical
 * illustration (pure inline SVG — zero network, zero JS) tinted by `hue` and
 * shaped by `category`, so cards look intentional until Mike's real photos drop
 * in. Swap <PlantArt> for <Image> per item when photography is ready.
 */

type Motif = "bloom" | "leaf" | "tree" | "sprout" | "basket" | "house" | "light";

const categoryMotif: Record<CategoryId, Motif> = {
  annuals: "bloom",
  perennials: "leaf",
  "trees-shrubs": "tree",
  vegetables: "sprout",
  "hanging-baskets": "basket",
  houseplants: "house",
  hydroponics: "light",
};

function Bloom({ c }: { c: string }) {
  return (
    <g fill={c}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="100" cy="70" rx="15" ry="30" transform={`rotate(${a} 100 100)`} opacity="0.92" />
      ))}
      <circle cx="100" cy="100" r="15" fill="var(--color-grow)" />
    </g>
  );
}

function Leaf({ c }: { c: string }) {
  return (
    <g fill={c}>
      <path d="M100 30 C60 60 60 130 100 165 C140 130 140 60 100 30 Z" />
      <path d="M100 40 L100 158" stroke="var(--color-paper)" strokeOpacity="0.5" strokeWidth="3" fill="none" />
    </g>
  );
}

function Tree({ c }: { c: string }) {
  return (
    <g>
      <rect x="94" y="120" width="12" height="45" rx="4" fill="var(--color-loam)" opacity="0.55" />
      <circle cx="100" cy="90" r="42" fill={c} />
      <circle cx="72" cy="102" r="26" fill={c} opacity="0.85" />
      <circle cx="128" cy="102" r="26" fill={c} opacity="0.85" />
    </g>
  );
}

function Sprout({ c }: { c: string }) {
  return (
    <g>
      <path d="M100 160 L100 95" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M100 110 C70 110 60 80 60 78 C92 78 100 100 100 110 Z" fill={c} />
      <path d="M100 100 C130 100 140 70 140 68 C108 68 100 90 100 100 Z" fill={c} opacity="0.85" />
      <path d="M78 160 h44" stroke="var(--color-grow)" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

function Basket({ c }: { c: string }) {
  return (
    <g>
      <path d="M100 24 L100 44" stroke="var(--color-loam)" strokeWidth="3" opacity="0.4" />
      <path d="M64 44 h72 l-8 26 h-56 z" fill="var(--color-loam)" opacity="0.5" />
      {[70, 90, 110, 130].map((x, i) => (
        <path key={x} d={`M${x} 70 C${x - 12} 110 ${x - 8} 150 ${x} 168`} stroke={c} strokeWidth="9" strokeLinecap="round" fill="none" opacity={i % 2 ? 0.8 : 1} />
      ))}
      <circle cx="82" cy="150" r="8" fill="var(--color-grow)" />
      <circle cx="118" cy="140" r="7" fill="var(--color-grow)" opacity="0.8" />
    </g>
  );
}

function House({ c }: { c: string }) {
  return (
    <g>
      <path d="M74 165 L80 96 h40 l6 69 z" fill="var(--color-loam)" opacity="0.5" />
      <path d="M100 96 C100 96 66 84 66 52 C98 52 100 84 100 96 Z" fill={c} />
      <path d="M100 96 C100 96 134 78 134 44 C102 46 100 84 100 96 Z" fill={c} opacity="0.85" />
      <path d="M100 96 L100 40" stroke={c} strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}

function GrowLight({ c }: { c: string }) {
  return (
    <g>
      <rect x="58" y="42" width="84" height="14" rx="5" fill="var(--color-loam)" opacity="0.6" />
      <path d="M70 56 L60 150 M100 56 L100 150 M130 56 L140 150" stroke="var(--color-grow)" strokeWidth="3" opacity="0.35" />
      <path d="M62 150 h76 l-6 -70 h-64 z" fill={c} opacity="0.18" />
      <path d="M100 150 C82 150 76 120 76 118 C102 118 100 140 100 150 Z" fill={c} />
      <path d="M100 140 C118 140 124 112 124 110 C100 110 100 130 100 140 Z" fill={c} opacity="0.85" />
    </g>
  );
}

const motifs: Record<Motif, (p: { c: string }) => React.ReactElement> = {
  bloom: Bloom,
  leaf: Leaf,
  tree: Tree,
  sprout: Sprout,
  basket: Basket,
  house: House,
  light: GrowLight,
};

export function PlantArt({
  category,
  hue,
  className,
  label,
}: {
  category: CategoryId;
  hue: number;
  className?: string;
  label?: string;
}) {
  const motif = categoryMotif[category];
  const Motif = motifs[motif];
  const c = `hsl(${hue} 45% 42%)`;
  const bgA = `hsl(${hue} 30% 92%)`;
  const bgB = `hsl(${(hue + 30) % 360} 28% 84%)`;
  const gid = `pa-${category}-${hue}`;

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={label ? `Illustration of ${label}` : "Botanical illustration"}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      <Motif c={c} />
    </svg>
  );
}
