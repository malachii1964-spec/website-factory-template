/**
 * The register — what the farm grows, where, and what it is doing right now.
 *
 * This replaced a list of twenty field crops (sweet corn, Concord grapes,
 * apples, pumpkins, garlic, asparagus…) that were written as plausible
 * Chautauqua County produce and were never confirmed by the owner. A farm
 * publishing crops it does not grow is making a false claim to a customer who
 * may drive here for one, so the list below contains only what the owner
 * actually named.
 *
 * Two registers, because this farm runs two operations with different physics:
 *
 *   BENCH  — indoors, living soil in AutoPots, year round. There is no season.
 *            The honest statement is a cycle ("cut every N days"), not a window.
 *   GROUND — outdoors, bound by the frost dates in season.ts.
 *
 * `standing` is set by the owner and never derived. The site cannot know
 * whether the tomatoes have set fruit this week, and guessing would put the
 * farm's name behind a guess. Everything starts at "planned" because the room
 * is not running yet, and that is what the page will say.
 */

import {
  type MonthDay,
  isWithin,
  resolve,
  startOfDay,
} from "@/lib/season";

export type Register = "bench" | "ground";

/**
 * Owner-set. The order here is the order of the growing year, and the record
 * sorts by it so the cuttable rows rise to the top on their own.
 */
export type Standing = "cutting" | "growing" | "resting" | "planned";

export const STANDING_ORDER: Record<Standing, number> = {
  cutting: 0,
  growing: 1,
  planned: 2,
  resting: 3,
};

/** How the record describes each standing, in words rather than by colour. */
export const STANDING_LABEL: Record<Standing, string> = {
  cutting: "Cutting now",
  growing: "Growing on",
  resting: "Resting",
  planned: "Planned",
};

export type Cycle = {
  /** Days from starting to the first cut. */
  toFirstCut: number;
  /** Days between cuts once it is in production, or null for a single harvest. */
  betweenCuts: number | null;
};

export type Entry = {
  id: string;
  name: string;
  register: Register;
  standing: Standing;
  /** Indoor only. Undefined for ground crops. */
  cycle?: Cycle;
  /** Outdoor only. Undefined for bench crops. */
  window?: { from: MonthDay; to: MonthDay };
  /**
   * Named varieties, once the owner has chosen them. Empty is normal and the
   * record simply omits the column — it does not draw an empty placeholder.
   */
  varieties: readonly string[];
  note: string;
};

/**
 * Confirmed by the owner 2026-09-17: tomatoes, a variety of greens, mushrooms,
 * strawberries, herbs. Indoors and outdoors, all year round.
 *
 * Varieties, exact cycle days for this room, and the outdoor windows this farm
 * actually hits are all still OWNER INPUT. The cycle figures below are ordinary
 * published ranges for the crop, which is why they are round numbers; they will
 * be wrong for this room by some margin until it has run a season.
 */
export const REGISTER: readonly Entry[] = [
  {
    id: "mushrooms",
    name: "Mushrooms",
    register: "bench",
    standing: "planned",
    cycle: { toFirstCut: 21, betweenCuts: 14 },
    varieties: [],
    note: "Fruited in flushes rather than picked over. The fastest thing on the bench.",
  },
  {
    id: "greens",
    name: "Greens",
    register: "bench",
    standing: "planned",
    cycle: { toFirstCut: 30, betweenCuts: 21 },
    varieties: [],
    note: "Cut and come again, so one sowing carries several cuts. The mix changes through the year.",
  },
  {
    id: "herbs",
    name: "Herbs",
    register: "bench",
    standing: "planned",
    cycle: { toFirstCut: 45, betweenCuts: 14 },
    varieties: [],
    note: "Cut to keep them bushy. Picked to order rather than held.",
  },
  {
    id: "tomatoes-bench",
    name: "Tomatoes",
    register: "bench",
    standing: "planned",
    cycle: { toFirstCut: 75, betweenCuts: 4 },
    varieties: [],
    note: "Indoors they carry through the winter, which is the whole reason for the room.",
  },
  {
    id: "strawberries-bench",
    name: "Strawberries",
    register: "bench",
    standing: "planned",
    cycle: { toFirstCut: 90, betweenCuts: 3 },
    varieties: [],
    note: "Day-neutral plants fruit on their own clock instead of on the calendar.",
  },
  {
    id: "tomatoes-ground",
    name: "Tomatoes",
    register: "ground",
    standing: "planned",
    window: { from: { month: 7, day: 20 }, to: { month: 10, day: 1 } },
    varieties: [],
    note: "Picked ripe. They do not travel, so they do not have to.",
  },
  {
    id: "strawberries-ground",
    name: "Strawberries",
    register: "ground",
    standing: "planned",
    window: { from: { month: 6, day: 10 }, to: { month: 7, day: 5 } },
    varieties: [],
    note: "Three weeks outdoors, and then they are gone until next June.",
  },
  {
    id: "greens-ground",
    name: "Greens",
    register: "ground",
    standing: "planned",
    window: { from: { month: 5, day: 20 }, to: { month: 11, day: 15 } },
    varieties: [],
    note: "Better after the first frost, not worse.",
  },
  {
    id: "herbs-ground",
    name: "Herbs",
    register: "ground",
    standing: "planned",
    window: { from: { month: 6, day: 1 }, to: { month: 10, day: 1 } },
    varieties: [],
    note: "Cut through the summer and dried for the winter.",
  },
];

/* ------------------------------------------------------------ selectors --- */

export function onRegister(register: Register): Entry[] {
  return REGISTER.filter((e) => e.register === register).sort(
    (a, b) =>
      STANDING_ORDER[a.standing] - STANDING_ORDER[b.standing] ||
      a.name.localeCompare(b.name),
  );
}

/**
 * Everything the owner has marked as cutting.
 *
 * A ground crop is additionally gated on its own window: if the record says a
 * field crop is cutting in February, that is stale data rather than a February
 * strawberry, and the page would rather say nothing than say that. Bench crops
 * have no such gate, because a room in February is the point.
 */
export function cuttingOn(date: Date): Entry[] {
  return REGISTER.filter((e) => {
    if (e.standing !== "cutting") return false;
    if (e.register === "ground" && e.window) return isWithin(e.window, date);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** True while nothing at all is cutting — the launch state, and an honest one. */
export function nothingCutting(date: Date): boolean {
  return cuttingOn(date).length === 0;
}

/** True until the owner marks anything as started. Drives the launch copy. */
export function roomNotRunning(): boolean {
  return REGISTER.every((e) => e.standing === "planned");
}

/**
 * Ground crops whose window contains the date, whatever their standing.
 *
 * This is what the outdoor ground *would* be carrying now, which is a different
 * and weaker statement than "we are cutting it", and the page labels it as such.
 */
export function groundInWindow(date: Date): Entry[] {
  return REGISTER.filter(
    (e) => e.register === "ground" && e.window && isWithin(e.window, date),
  ).sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------- display --- */

/** "Every 14 days" / "21 days to first cut" — the bench's version of a window. */
export function cycleLine(cycle: Cycle): string {
  if (cycle.betweenCuts === null) return `${cycle.toFirstCut} days to harvest`;
  return `Cut every ${cycle.betweenCuts} days`;
}

export function windowLine(window: { from: MonthDay; to: MonthDay }): string {
  const f = (md: MonthDay) =>
    new Date(2000, md.month - 1, md.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return `${f(window.from)} – ${f(window.to)}`;
}

/** The one-line summary each register carries under its heading. */
export function registerLine(register: Register, date: Date): string {
  if (register === "bench") {
    return "Indoors, living soil in AutoPots. No season — the bench runs all year.";
  }
  const inWindow = groundInWindow(date).length;
  return inWindow > 0
    ? "Outdoors, bound by the frost dates."
    : "Outdoors, bound by the frost dates. Nothing is in its window today.";
}

/**
 * Sanity guard used by the tests: a bench entry must carry a cycle and no
 * window, and a ground entry the reverse. Mixing them produces a row that
 * renders a season for something grown under lights.
 */
export function isWellFormed(e: Entry): boolean {
  if (e.register === "bench") return Boolean(e.cycle) && !e.window;
  return Boolean(e.window) && !e.cycle;
}

/** Resolved start of a ground crop's window this year — used for ordering. */
export function windowStart(e: Entry, year: number): number {
  return e.window ? resolve(e.window.from, year).getTime() : Number.MAX_SAFE_INTEGER;
}

export { startOfDay };
