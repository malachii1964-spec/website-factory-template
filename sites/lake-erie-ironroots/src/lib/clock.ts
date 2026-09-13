/**
 * What day it is *at the farm*.
 *
 * The site's central claim is "this is what is ready today". The server that
 * renders it does not run in Chautauqua County — on Vercel it runs in UTC. At
 * 8pm on 30 September in Westfield the server's own clock already says 1
 * October, so a naive `new Date()` would roll the stand's produce list over
 * about five hours early, every single day, and would take a day off the
 * frost countdown every evening.
 *
 * So the date is resolved in the farm's timezone and handed back as a local
 * midnight Date. Everything downstream compares by calendar day, so once the
 * right calendar day is established the rest of the arithmetic is correct
 * regardless of where the server sits or whether daylight saving is on.
 */

export const FARM_TIMEZONE = "America/New_York";

/**
 * The current calendar day at the farm, as a Date at local midnight.
 *
 * `now` is injectable so this is testable without mocking global time.
 */
export function farmToday(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FARM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) {
      // Intl is required to supply every requested field; if it somehow does
      // not, failing loudly beats silently rendering the wrong day's produce.
      throw new Error(`Intl did not return "${type}" for ${FARM_TIMEZONE}`);
    }
    return Number(part.value);
  };

  return new Date(get("year"), get("month") - 1, get("day"));
}
