/**
 * The growing season on the Lake Erie plain, as data.
 *
 * This module is pure: no React, no database, no clock of its own — every
 * function takes the date it should reason about. That is what makes the
 * Season Rule testable, and it is why "what is ready today" can be computed on
 * the server and shipped as static HTML instead of as client JavaScript.
 *
 * The two frost dates are the spine of the whole thing. Lake Erie acts as a
 * thermal battery: slow to warm, slow to cool. It holds spring back past the
 * killing frosts and holds autumn open, which is why first frost on this plain
 * lands in early October rather than mid-September as it does inland.
 */

export type MonthDay = { month: number; day: number };

export type Crop = {
  id: string;
  name: string;
  /** "fruit" | "vegetable" — drives nothing but the produce list grouping. */
  kind: "fruit" | "vegetable";
  from: MonthDay;
  to: MonthDay;
  /** One honest line. Shown in the produce list. */
  note: string;
};

/**
 * Chautauqua County frost dates, lake plain. NEEDS OWNER confirmation against
 * the farm's own records — a farm two miles inland runs a different calendar.
 */
export const LAST_SPRING_FROST: MonthDay = { month: 5, day: 15 };
export const FIRST_FALL_FROST: MonthDay = { month: 10, day: 7 };

/**
 * Harvest windows. NEEDS OWNER — these are normal windows for this county and
 * are here so the Season Rule is real and testable, not so they are correct
 * for this farm's particular beds.
 */
export const CROPS: Crop[] = [
  { id: "asparagus", name: "Asparagus", kind: "vegetable", from: { month: 5, day: 1 }, to: { month: 6, day: 10 }, note: "Cut every morning while the spears run." },
  { id: "rhubarb", name: "Rhubarb", kind: "fruit", from: { month: 5, day: 1 }, to: { month: 6, day: 15 }, note: "Pulled, never cut, so the crown keeps going." },
  { id: "strawberries", name: "Strawberries", kind: "fruit", from: { month: 6, day: 10 }, to: { month: 7, day: 5 }, note: "Three weeks, and then they are gone until next June." },
  { id: "peas", name: "Sugar snap peas", kind: "vegetable", from: { month: 6, day: 15 }, to: { month: 7, day: 15 }, note: "Picked cool, in the early morning." },
  { id: "kale", name: "Kale", kind: "vegetable", from: { month: 6, day: 1 }, to: { month: 11, day: 15 }, note: "Better after the first frost, not worse." },
  { id: "beets", name: "Beets", kind: "vegetable", from: { month: 7, day: 1 }, to: { month: 10, day: 15 }, note: "Greens on, the way they should be sold." },
  { id: "squash-summer", name: "Summer squash", kind: "vegetable", from: { month: 7, day: 1 }, to: { month: 9, day: 20 }, note: "Cut small. Large ones go to the pigs." },
  { id: "beans", name: "Green beans", kind: "vegetable", from: { month: 7, day: 5 }, to: { month: 9, day: 10 }, note: "Hand-picked, so the plants keep setting." },
  { id: "cucumbers", name: "Cucumbers", kind: "vegetable", from: { month: 7, day: 5 }, to: { month: 9, day: 5 }, note: "Slicers and picklers, kept separate." },
  { id: "blueberries", name: "Blueberries", kind: "fruit", from: { month: 7, day: 10 }, to: { month: 8, day: 20 }, note: "Picked over every four days." },
  { id: "garlic", name: "Garlic", kind: "vegetable", from: { month: 7, day: 15 }, to: { month: 8, day: 15 }, note: "Hardneck, cured three weeks before it is sold." },
  { id: "carrots", name: "Carrots", kind: "vegetable", from: { month: 7, day: 15 }, to: { month: 11, day: 1 }, note: "Sweetest once the nights turn cold." },
  { id: "tomatoes", name: "Tomatoes", kind: "fruit", from: { month: 7, day: 20 }, to: { month: 10, day: 1 }, note: "Picked ripe. They do not travel, so they do not have to." },
  { id: "corn", name: "Sweet corn", kind: "vegetable", from: { month: 7, day: 25 }, to: { month: 9, day: 15 }, note: "Picked the morning you buy it." },
  { id: "potatoes", name: "Potatoes", kind: "vegetable", from: { month: 8, day: 1 }, to: { month: 10, day: 10 }, note: "Dug and cured, not washed." },
  { id: "peppers", name: "Peppers", kind: "vegetable", from: { month: 8, day: 1 }, to: { month: 10, day: 1 }, note: "Sweet and hot, left on the plant to color." },
  { id: "apples", name: "Apples", kind: "fruit", from: { month: 9, day: 1 }, to: { month: 11, day: 1 }, note: "Early varieties first, keepers last." },
  { id: "grapes", name: "Concord grapes", kind: "fruit", from: { month: 9, day: 5 }, to: { month: 10, day: 15 }, note: "The crop this belt has grown longer than anywhere on earth." },
  { id: "squash-winter", name: "Winter squash", kind: "vegetable", from: { month: 9, day: 10 }, to: { month: 11, day: 1 }, note: "Cured in the sun, stores until February." },
  { id: "pumpkins", name: "Pumpkins", kind: "fruit", from: { month: 9, day: 15 }, to: { month: 10, day: 31 }, note: "Field-run, stems on." },
];

/* ------------------------------------------------------------- helpers --- */

/** Local midnight, so comparisons are by calendar day and never by clock. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** A MonthDay resolved into a real Date in the given year. */
export function resolve(md: MonthDay, year: number): Date {
  return new Date(year, md.month - 1, md.day);
}

export const DAY_MS = 86_400_000;

/** Whole calendar days from a to b. Negative when b is before a. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/* -------------------------------------------------------------- season --- */

/**
 * True when `date` falls inside the crop's window, inclusive of both ends.
 *
 * Windows are compared within a single calendar year. No crop here wraps past
 * New Year, and pretending to support that would be untested code.
 */
export function isReady(crop: Crop, date: Date): boolean {
  const year = date.getFullYear();
  const day = startOfDay(date).getTime();
  return (
    day >= resolve(crop.from, year).getTime() &&
    day <= resolve(crop.to, year).getTime()
  );
}

/** Everything ready on the given day, in the order the season brings it on. */
export function readyOn(date: Date): Crop[] {
  return CROPS.filter((c) => isReady(c, date)).sort(
    (a, b) =>
      resolve(a.from, date.getFullYear()).getTime() -
      resolve(b.from, date.getFullYear()).getTime(),
  );
}

/** Not ready yet, but starting within `withinDays`. Soonest first. */
export function comingSoon(date: Date, withinDays = 21): Crop[] {
  const year = date.getFullYear();
  return CROPS.filter((c) => {
    if (isReady(c, date)) return false;
    const days = daysBetween(date, resolve(c.from, year));
    return days > 0 && days <= withinDays;
  }).sort(
    (a, b) => resolve(a.from, year).getTime() - resolve(b.from, year).getTime(),
  );
}

/** Just finished, so the stand can say so instead of staying silent. */
export function justFinished(date: Date, withinDays = 21): Crop[] {
  const year = date.getFullYear();
  return CROPS.filter((c) => {
    if (isReady(c, date)) return false;
    const days = daysBetween(resolve(c.to, year), date);
    return days > 0 && days <= withinDays;
  }).sort(
    (a, b) => resolve(b.to, year).getTime() - resolve(a.to, year).getTime(),
  );
}

/**
 * Where a date sits on the frost-to-frost rule, 0 to 1.
 *
 * Clamped at both ends on purpose: in February the marker parks at the start
 * of the rule rather than flying off the left edge of the drawing.
 */
export function seasonPosition(date: Date): number {
  const year = date.getFullYear();
  const start = resolve(LAST_SPRING_FROST, year).getTime();
  const end = resolve(FIRST_FALL_FROST, year).getTime();
  const now = startOfDay(date).getTime();
  if (end <= start) return 0; // guards a mis-edit of the frost constants
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/**
 * A crop's window as a fraction of the frost-to-frost rule.
 *
 * Crops legitimately run past first frost — kale and carrots are better for
 * it — so the segment is clamped to the rule while `overrunsFrost` records
 * that the real window continues past the end of the drawing.
 */
export function cropSegment(
  crop: Crop,
  year: number,
): { start: number; end: number; overrunsFrost: boolean } {
  const first = resolve(LAST_SPRING_FROST, year).getTime();
  const last = resolve(FIRST_FALL_FROST, year).getTime();
  const span = last - first;
  if (span <= 0) return { start: 0, end: 0, overrunsFrost: false };

  const rawStart = (resolve(crop.from, year).getTime() - first) / span;
  const rawEnd = (resolve(crop.to, year).getTime() - first) / span;
  return {
    start: Math.min(1, Math.max(0, rawStart)),
    end: Math.min(1, Math.max(0, rawEnd)),
    overrunsFrost: rawEnd > 1,
  };
}

/**
 * Days until first frost. Negative once it has passed, which the page reads
 * as "the season is closing" rather than treating as an error.
 */
export function daysUntilFirstFrost(date: Date): number {
  return daysBetween(date, resolve(FIRST_FALL_FROST, date.getFullYear()));
}

/**
 * The one line the season instrument exists to say.
 *
 * It has a winter. The first version counted in both directions forever, so
 * from October to May the site's single live reading was "85 days past first
 * frost" — noise, rendered in the colour reserved for "ready now", beside copy
 * saying the stand is shut. Out of season it says something a person actually
 * wants: when the ground comes back.
 */
export function frostLine(date: Date): string {
  // Before this year's last spring frost — January through mid-May. The
  // season has not opened, so counting down to a frost seven months out is
  // noise; the question being asked is when the ground comes back.
  const toSpring = daysBetween(date, resolve(LAST_SPRING_FROST, date.getFullYear()));
  if (toSpring > 1) return `${toSpring} days to last frost`;
  if (toSpring === 1) return "Last frost expected tomorrow";
  if (toSpring === 0) return "Last frost expected today";

  // In season.
  const toFall = daysUntilFirstFrost(date);
  if (toFall > 1) return `${toFall} days to first frost`;
  if (toFall === 1) return "First frost expected tomorrow";
  if (toFall === 0) return "First frost expected today";

  // Past first frost — point at next spring rather than counting up forever.
  return `${daysUntilLastSpringFrost(date)} days to last frost`;
}

/**
 * Days to the next last-spring-frost. After the fall frost the relevant one is
 * next year's, so the year rolls over rather than going negative.
 */
export function daysUntilLastSpringFrost(date: Date): number {
  const thisYear = resolve(LAST_SPRING_FROST, date.getFullYear());
  const target =
    startOfDay(date).getTime() <= thisYear.getTime()
      ? thisYear
      : resolve(LAST_SPRING_FROST, date.getFullYear() + 1);
  return daysBetween(date, target);
}

/**
 * Month markers along the frost-to-frost rule.
 *
 * Only months that actually fall inside the season are returned, so the
 * drawing never carries a label sitting off the end of its own axis.
 */
export function monthTicks(year: number): { label: string; at: number }[] {
  const first = resolve(LAST_SPRING_FROST, year).getTime();
  const last = resolve(FIRST_FALL_FROST, year).getTime();
  const span = last - first;
  if (span <= 0) return [];

  const ticks: { label: string; at: number }[] = [];

  // The season opens mid-May, so the first of May sits before the axis and was
  // skipped — leaving the drawing starting at JUN while the caption beside it
  // said the season starts on 15 May. The opening month is labelled at the
  // origin instead of being dropped.
  ticks.push({
    label: new Date(year, LAST_SPRING_FROST.month - 1, 1).toLocaleDateString(
      "en-US",
      { month: "short" },
    ),
    at: 0,
  });

  for (let m = 0; m < 12; m++) {
    const t = new Date(year, m, 1).getTime();
    if (t <= first || t > last) continue;
    ticks.push({
      label: new Date(year, m, 1).toLocaleDateString("en-US", { month: "short" }),
      at: (t - first) / span,
    });
  }
  return ticks;
}

export function formatWindow(crop: Crop): string {
  const f = (md: MonthDay) =>
    new Date(2000, md.month - 1, md.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return `${f(crop.from)} – ${f(crop.to)}`;
}
