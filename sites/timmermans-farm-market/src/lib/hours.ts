import { hours } from "@/lib/business";

export type StandStatus =
  | { status: "open"; closesAt: string }
  | { status: "closed-today"; opensAt: string }
  | { status: "closed-all-day"; opensAt: string }
  | { status: "out-of-season"; opensInMonth: string };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const STAND_TIME_ZONE = "America/New_York";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function formatClock(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${h12} ${period}` : `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * The stand is in Westfield, NY (America/New_York) regardless of where a
 * visitor's browser clock is set — a visitor browsing from another time
 * zone must see status computed against Eastern time, not their own.
 */
function toStandLocalParts(now: Date): { month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STAND_TIME_ZONE,
    month: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    month: Number(get("month")),
    day: WEEKDAY_INDEX[get("weekday")] ?? 0,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/**
 * Pure function so it's testable without mocking the clock in a component.
 * Pass `now` explicitly in tests; defaults to the real current time at call sites.
 */
export function getStandStatus(now: Date): StandStatus {
  const { month, day, hour, minute } = toStandLocalParts(now);
  const inSeason = month >= hours.seasonStartMonth && month <= hours.seasonEndMonth;

  if (!inSeason) {
    return {
      status: "out-of-season",
      opensInMonth: MONTH_NAMES[hours.seasonStartMonth - 1],
    };
  }

  const opensToday = (hours.daysOpen as readonly number[]).includes(day);
  const openTime = formatClock(hours.open.hour, hours.open.minute);

  if (!opensToday) {
    return { status: "closed-all-day", opensAt: openTime };
  }

  const minutesNow = hour * 60 + minute;
  const openMinutes = hours.open.hour * 60 + hours.open.minute;
  const closeMinutes = hours.close.hour * 60 + hours.close.minute;

  if (minutesNow >= openMinutes && minutesNow < closeMinutes) {
    return { status: "open", closesAt: formatClock(hours.close.hour, hours.close.minute) };
  }

  return { status: "closed-today", opensAt: openTime };
}
