/**
 * The Mr. Canucks Grow method, expressed as data.
 *
 * Matt Taylor ("Mr. Canucks Grow") is a Canadian YouTube cultivator whose
 * approach is deliberately boring: a base soil amended with dry organic
 * fertilizer, mycorrhizae on the rootball, and then nothing but plain pH'd
 * water plus a top-dress every three weeks. The only thing that changes over
 * the grow is the RATIO of the two amendments — nitrogen-forward All Purpose
 * 4-4-4 early, phosphorus/potassium-forward Power Bloom 2-8-4 late.
 *
 * That ramp is the whole method, so it is modelled here as data and the UI is
 * a thin shell over it (same contract as grow-tools.ts). Everything is a pure
 * function so the numbers are unit-tested rather than hand-typed into JSX.
 *
 * SOURCING: figures below are the rates most consistently documented from his
 * public videos and the grower forums that reproduce them (1 tbsp per gallon
 * of pot per top-dress, on a 3-week cadence, pH 6.2-6.8). He has tweaked the
 * mix across seasons — this is a faithful starting point, not scripture, and
 * the page says so. Lake Erie Cannabis is not affiliated with him.
 */

/** The two dry amendments the whole method rides on. */
export type Amendment = "allPurpose" | "powerBloom";

export const AMENDMENT: Record<
  Amendment,
  { label: string; npk: string; role: string; token: string }
> = {
  allPurpose: {
    label: "All Purpose 4-4-4",
    npk: "4-4-4",
    role: "Nitrogen-forward. Builds frame, leaf and root through veg.",
    token: "gold",
  },
  powerBloom: {
    label: "Power Bloom 2-8-4",
    npk: "2-8-4",
    role: "Phosphorus and potassium forward. Fills and ripens flower.",
    token: "magenta",
  },
};

/** Tablespoons of dry amendment per gallon of pot, per top-dress event. */
export const TOP_DRESS_TBSP_PER_GAL = 1;

/** Tablespoons per gallon mixed into the base soil when you pot up. */
export const BASE_MIX_TBSP_PER_GAL = 3;

/** Tablespoons of worm castings per gallon on the late bulk top-dress. */
export const CASTINGS_TBSP_PER_GAL = 4;

/** He runs plain water in this band — no bottled pH-up/down games beyond it. */
export const PH_RANGE: [number, number] = [6.2, 6.8];

/**
 * Water volume per watering as a fraction of pot volume. Reported as roughly
 * 1 to 1.25 gallons into a 5-gallon pot: a real soak with a little runoff.
 */
export const WATER_FRACTION: [number, number] = [0.2, 0.25];

export type EventKind = "mix" | "topDress" | "flip" | "waterOnly";

export type MethodEvent = {
  id: string;
  /** Weeks after potting up into the final container. */
  week: number;
  kind: EventKind;
  title: string;
  detail: string;
  /** Percentage of the dry amendment that is All Purpose 4-4-4 (0-100). */
  apPct: number;
  /** Tablespoons per gallon of pot for this event, if it feeds. */
  tbspPerGal: number;
  /** Worm castings tbsp per gallon, if this event includes them. */
  castingsPerGal?: number;
};

/**
 * The ramp: 100 -> 70 -> 50 -> 30 -> 0 percent All Purpose across the grow.
 * Every feeding event is three weeks after the last one, which is the part
 * beginners actually get wrong — they feed when the plant "looks hungry"
 * instead of on the clock.
 */
export const METHOD_EVENTS: MethodEvent[] = [
  {
    id: "pot-up",
    week: 0,
    kind: "mix",
    title: "Pot up into amended soil",
    detail:
      "Mix the dry amendment through the base soil, dust the rootball with mycorrhizae, and transplant. This charge feeds the first three weeks.",
    apPct: 100,
    tbspPerGal: BASE_MIX_TBSP_PER_GAL,
  },
  {
    id: "veg-1",
    week: 3,
    kind: "topDress",
    title: "Veg top-dress",
    detail:
      "First top-dress. Still nitrogen-forward — you are buying frame and node count before the stretch.",
    apPct: 70,
    tbspPerGal: TOP_DRESS_TBSP_PER_GAL,
  },
  {
    id: "pre-flip",
    week: 6,
    kind: "topDress",
    title: "Pre-flip top-dress",
    detail:
      "Even split, laid down about a week before you flip. The bloom half is in the pot breaking down before the plant needs it.",
    apPct: 50,
    tbspPerGal: TOP_DRESS_TBSP_PER_GAL,
  },
  {
    id: "flip",
    week: 7,
    kind: "flip",
    title: "Flip to 12/12",
    detail:
      "Lights to twelve on, twelve off. Nothing is added — the pre-flip charge is already working.",
    apPct: 50,
    tbspPerGal: 0,
  },
  {
    id: "stretch",
    week: 9,
    kind: "topDress",
    title: "Stretch top-dress",
    detail:
      "Stretch is done and sites are set. Bloom takes over as the dominant amendment.",
    apPct: 30,
    tbspPerGal: TOP_DRESS_TBSP_PER_GAL,
  },
  {
    id: "bulk",
    week: 12,
    kind: "topDress",
    title: "Bulk top-dress",
    detail:
      "Straight bloom, plus a layer of worm castings to keep the biology fed while the plant is packing on weight.",
    apPct: 0,
    tbspPerGal: TOP_DRESS_TBSP_PER_GAL,
    castingsPerGal: CASTINGS_TBSP_PER_GAL,
  },
  {
    id: "finish",
    week: 15,
    kind: "waterOnly",
    title: "Plain water to finish",
    detail:
      "No more amendment. Plain pH'd water only from here until you chop on trichomes.",
    apPct: 0,
    tbspPerGal: 0,
  },
];

/* ------------------------------------------------------------- maths ---- */

export type Dose = {
  event: MethodEvent;
  /** Tablespoons of All Purpose 4-4-4, total across all plants. */
  allPurposeTbsp: number;
  /** Tablespoons of Power Bloom 2-8-4, total across all plants. */
  powerBloomTbsp: number;
  /** Tablespoons of worm castings, total across all plants. */
  castingsTbsp: number;
  /** Days after pot-up this lands on. */
  dayOffset: number;
};

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Turn pot size and plant count into the exact amounts for every event.
 * Clamped to sane home-grow bounds so a stray input cannot produce nonsense.
 */
export function doseSchedule(potGallons: number, plants: number): Dose[] {
  const gal = Math.min(30, Math.max(1, potGallons));
  const n = Math.min(24, Math.max(1, Math.round(plants)));

  return METHOD_EVENTS.map((event) => {
    const total = event.tbspPerGal * gal * n;
    return {
      event,
      allPurposeTbsp: round((total * event.apPct) / 100),
      powerBloomTbsp: round((total * (100 - event.apPct)) / 100),
      castingsTbsp: round((event.castingsPerGal ?? 0) * gal * n),
      dayOffset: event.week * 7,
    };
  });
}

/** Tablespoons to a human string, promoting to cups once it gets silly. */
export function tbspLabel(tbsp: number): string {
  if (tbsp <= 0) return "—";
  if (tbsp < 16) return `${round(tbsp)} tbsp`;
  const cups = round(tbsp / 16, 2);
  return `${cups} ${cups === 1 ? "cup" : "cups"}`;
}

/** Total amendment you need to buy for one full run, in tablespoons. */
export function runTotals(
  potGallons: number,
  plants: number,
): { allPurposeTbsp: number; powerBloomTbsp: number; castingsTbsp: number } {
  return doseSchedule(potGallons, plants).reduce(
    (acc, d) => ({
      allPurposeTbsp: round(acc.allPurposeTbsp + d.allPurposeTbsp),
      powerBloomTbsp: round(acc.powerBloomTbsp + d.powerBloomTbsp),
      castingsTbsp: round(acc.castingsTbsp + d.castingsTbsp),
    }),
    { allPurposeTbsp: 0, powerBloomTbsp: 0, castingsTbsp: 0 },
  );
}

/** Water per watering for a pot, in gallons — a real soak, small runoff. */
export function waterPerWatering(potGallons: number): [number, number] {
  const gal = Math.min(30, Math.max(1, potGallons));
  return [round(gal * WATER_FRACTION[0], 2), round(gal * WATER_FRACTION[1], 2)];
}

/**
 * Add days to a date without mutating it, and without dragging in a date lib
 * for what is genuinely one line of arithmetic.
 */
export function addDays(start: Date, days: number): Date {
  const d = new Date(start.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** The five ingredients he actually uses. Nothing else goes in the pot. */
export const INGREDIENTS = [
  {
    name: "Base soil",
    detail:
      "A peat or coco-based living soil. He runs the Gaia Green living soil; ProMix HP amended the same way is the common substitute.",
    why: "The container. Holds water and air, and hosts the biology that does the actual feeding.",
  },
  {
    name: "All Purpose 4-4-4",
    detail: "Dry organic amendment, nitrogen-forward.",
    why: "Veg fuel. Frame, leaves, roots.",
  },
  {
    name: "Power Bloom 2-8-4",
    detail: "Dry organic amendment, phosphorus and potassium forward.",
    why: "Flower fuel. Fills and ripens bud.",
  },
  {
    name: "Worm castings",
    detail: "Roughly 10-20% of the mix, plus a late top-dress layer.",
    why: "Starts the engine — the microbes that break dry amendment into plant food.",
  },
  {
    name: "Mycorrhizae",
    detail: "Dusted directly on the rootball at transplant.",
    why: "Extends the root system's reach so the plant mines the pot properly.",
  },
] as const;

/** The honest section. A profile that only flatters is not worth reading. */
export const DEBATES = [
  {
    q: "Can dry amendments really feed a heavy flowering plant?",
    a: "This is the most common objection on the grower forums, and it is a fair question — a pot of dry fertilizer has to be broken down by biology before the plant can use any of it. In practice it works because the amendment is laid down three weeks before the plant needs it and the castings keep the microbial population up. It is slower to correct than a bottle, though: if you fall behind, you cannot fix it in a day.",
  },
  {
    q: "Is it actually cheaper than bottled nutrients?",
    a: "Per run, usually yes — dry amendments are sold by weight and a bag lasts several cycles. The honest catch is the up-front cost. Buying the base soil, both amendments, castings and mycorrhizae at once is a real spend before your first plant goes in.",
  },
  {
    q: "Does the calendar override the plant?",
    a: "No, and this is where beginners get burned. Three weeks is the default cadence, not a command. A small plant in a big pot in cool conditions eats slower. Read the plant first — the schedule is a starting rhythm you adjust, and pale lower leaves or clawing tips are the plant telling you the ratio is off.",
  },
  {
    q: "Soil or coco?",
    a: "He has run both, and the method transfers. Coco dries faster and wants more frequent watering, which can wash amendments through quicker, so growers running his schedule in coco often water a little lighter and more often rather than flooding it every time.",
  },
] as const;
