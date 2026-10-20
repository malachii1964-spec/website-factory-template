export const MINIMUM_AGE = 21;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a strict YYYY-MM-DD calendar date (UTC). Returns null if invalid. */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? date : null;
}

/**
 * The latest birth date that is at least `years` old on `today` (UTC).
 * Mirrors Postgres `current_date - interval 'N years'`: Feb 29 clamps to Feb 28.
 */
export function cutoffBirthDate(years: number, today: Date = new Date()): Date {
  const y = today.getUTCFullYear() - years;
  const m = today.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(today.getUTCDate(), lastDay)));
}

/** True when the member is at least `years` old today — same rule as the DB trigger. */
export function isOldEnough(
  birthDate: string,
  years: number = MINIMUM_AGE,
  today: Date = new Date(),
): boolean {
  const born = parseIsoDate(birthDate);
  if (!born) return false;
  if (born.getTime() > today.getTime()) return false;
  return born.getTime() <= cutoffBirthDate(years, today).getTime();
}
