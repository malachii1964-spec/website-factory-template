/**
 * LEC Limited Drops — affiliate promo codes for seed genetics.
 *
 * These are real discount codes on a partner breeder's store. Two rules shape
 * this module:
 *
 * 1. A dead code is worse than no code. Every drop may carry an `endsOn`, and
 *    expired drops disappear from the site automatically rather than sending a
 *    grower to a checkout that rejects them.
 * 2. The code is the product, not the artwork. The art draws the eye; the
 *    thing that has to work flawlessly is reading and copying the code.
 *
 * Affiliate relationship is disclosed wherever these render — see DISCLOSURE.
 */

export type Drop = {
  slug: string;
  /** Position in the drop series, e.g. 1 of 5. */
  number: number;
  name: string;
  /** Small line above/below the name on the art. */
  edition: string;
  /** The flavour/effect line. */
  notes: string;
  code: string;
  percentOff: number;
  breeder: string;
  /** Portrait promo art in /public/promos. */
  image: string;
  /** Meaningful alt text — never "promo image". */
  alt: string;
  /** ISO date (YYYY-MM-DD). Omit for an open-ended code. */
  endsOn?: string;
  /** Strains already profiled on this site that share genetics. */
  relatedStrainSlugs?: string[];
};

/**
 * Where the codes are redeemed. Set NEXT_PUBLIC_SEED_AFFILIATE_URL to the
 * partner link; until it is set the cards show the code without a broken
 * outbound link, which is the honest failure mode.
 */
export const AFFILIATE_URL = process.env.NEXT_PUBLIC_SEED_AFFILIATE_URL ?? "";

export const DISCLOSURE =
  "These are affiliate links. If you buy through them, Lake Erie Cannabis may earn a commission at no extra cost to you. It never changes what we recommend or what the guides say.";

export const DROPS: Drop[] = [
  {
    slug: "z42",
    number: 1,
    name: "Z42",
    edition: "Limited Collector's F1",
    notes: "When it's gone, it's gone.",
    code: "MALACHI",
    percentOff: 15,
    breeder: "Fast Buds",
    image: "/promos/z42.webp",
    alt: "Z42 — a frosted, purple-tinged cannabis flower inside a chrome ring, surrounded by amethyst crystals over dark water.",
    relatedStrainSlugs: ["zkittlez", "runtz"],
  },
  {
    slug: "mango-frost-auto",
    number: 2,
    name: "Mango Frost Auto",
    edition: "2026 Autoflower World Cup Winner",
    notes: "Tropical sweetness. Cream. Gas.",
    code: "FROST42",
    percentOff: 15,
    breeder: "Fast Buds",
    image: "/promos/mango-frost-auto.webp",
    alt: "Mango Frost Auto — a full autoflower plant under a frosted glass cloche ringed by amber crystals.",
  },
  {
    slug: "strawberry-gorilla-auto-rf3",
    number: 3,
    name: "Strawberry Gorilla Auto RF3",
    edition: "Next-generation refinement",
    notes: "Strawberry candy. Gas. Extreme frost.",
    code: "MATTYJ",
    percentOff: 15,
    breeder: "Fast Buds",
    image: "/promos/strawberry-gorilla-auto-rf3.webp",
    alt: "Strawberry Gorilla Auto RF3 — a purple-leaved plant encased in a deep red faceted gem.",
    relatedStrainSlugs: ["gorilla-glue-4"],
  },
  {
    slug: "guava-runtz-auto",
    number: 4,
    name: "Guava Runtz Auto",
    edition: "Champions Line F1 Hybrid",
    notes: "Tropical fruit. Sweet candy. Resin.",
    code: "LEC42",
    percentOff: 15,
    breeder: "Fast Buds",
    image: "/promos/guava-runtz-auto.webp",
    alt: "Guava Runtz Auto — a flowering plant framed by a rose-gold arch on a dark marble plinth with tropical foliage.",
    relatedStrainSlugs: ["runtz"],
  },
  {
    slug: "garlic-mint-sherbet",
    number: 5,
    name: "Garlic Mint Sherbet",
    edition: "Heavy resin · evolving terps",
    notes: "Creamy sherbet. Garlic. Mint.",
    code: "DABOMB",
    percentOff: 15,
    breeder: "Fast Buds",
    image: "/promos/garlic-mint-sherbet.webp",
    alt: "Garlic Mint Sherbet — a dense frosted flower suspended inside a clear glass sphere above rippling water.",
    relatedStrainSlugs: ["mimosa"],
  },
];

/* --------------------------------------------------------------- logic --- */

/** Midnight-aligned comparison so a code stays live for all of its last day. */
function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isExpired(drop: Drop, today: Date = new Date()): boolean {
  if (!drop.endsOn) return false;
  const end = new Date(`${drop.endsOn}T12:00:00`);
  if (Number.isNaN(end.getTime())) return false; // malformed date never hides a drop
  return startOfDay(end) < startOfDay(today);
}

/** The drops to actually show, in series order. Expired ones are dropped. */
export function activeDrops(today: Date = new Date()): Drop[] {
  return DROPS.filter((d) => !isExpired(d, today)).sort(
    (a, b) => a.number - b.number,
  );
}

export function getDrop(slug: string): Drop | undefined {
  return DROPS.find((d) => d.slug === slug);
}

/** True when outbound links can be rendered at all. */
export function hasAffiliateLink(): boolean {
  return AFFILIATE_URL.trim().length > 0;
}
