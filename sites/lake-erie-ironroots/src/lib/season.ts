/**
 * The outdoor season on the Lake Erie plain, as date arithmetic.
 *
 * This module is pure: no React, no database, no clock of its own — every
 * function takes the date it should reason about. That is what makes it
 * testable, and it is why "what the ground is carrying" can be computed on the
 * server and shipped as static HTML instead of as client JavaScript.
 *
 * The two frost dates are the spine. Lake Erie acts as a thermal battery: slow
 * to warm, slow to cool. It holds spring back past the killing frosts and holds
 * autumn open, which is why first frost on this plain lands in early October
 * rather than mid-September as it does inland.
 *
 * Scope note: this file used to own the crop list as well. It does not any
 * more. The farm runs an indoor bench with no season at all, so crops live in
 * crops.ts and only the outdoor register consults the frost dates. Nothing here
 * knows what a crop is.
 */

export type MonthDay = { month: number; day: number };

/**
 * Chautauqua County frost dates, lake plain. NEEDS OWNER confirmation against
 * the farm's own records — a farm two miles inland runs a different calendar.
 */
export const LAST_SPRING_FROST: MonthDay = { month: 5, day: 15 };
export const FIRST_FALL_FROST: MonthDay = { month: 10, day: 7 };

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

/**
 * True when `date` falls inside the window, inclusive of both ends.
 *
 * Windows are compared within a single calendar year. No outdoor window here
 * wraps past New Year, and pretending to support that would be untested code.
 */
export function isWithin(
  window: { from: MonthDay; to: MonthDay },
  date: Date,
): boolean {
  const year = date.getFullYear();
  const day = startOfDay(date).getTime();
  return (
    day >= resolve(window.from, year).getTime() &&
    day <= resolve(window.to, year).getTime()
  );
}

/* --------------------------------------------------------------- frost --- */

/**
 * Days until first frost. Negative once it has passed, which the page reads as
 * "the outdoor season is closing" rather than treating as an error.
 */
export function daysUntilFirstFrost(date: Date): number {
  return daysBetween(date, resolve(FIRST_FALL_FROST, date.getFullYear()));
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
 * The one line the outdoor register carries.
 *
 * It has a winter. The first version counted in both directions forever, so
 * from October to May the site's single live reading was "85 days past first
 * frost" — noise, rendered in the colour reserved for "ready now", beside copy
 * saying the stand was shut. Out of season it says something a person actually
 * wants: when the ground comes back.
 */
export function frostLine(date: Date): string {
  // Before this year's last spring frost — January through mid-May. The season
  // has not opened, so counting down to a frost seven months out is noise; the
  // question being asked is when the ground comes back.
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
