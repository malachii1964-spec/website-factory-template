import { hours, type DayHours } from "./site";

export const BUSINESS_TZ = "America/New_York";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type OpenStatus = {
  isOpen: boolean;
  /** Day index 0-6 in business timezone */
  day: number;
  /** Minutes since midnight in business timezone */
  minutesNow: number;
  /** Short human sentence, e.g. "Open until 7:00 PM" or "Opens Sat at 9:00 AM" */
  message: string;
};

/** Resolve the weekday (0-6) and minutes-since-midnight in the business timezone. */
export function localParts(now: Date, timeZone: string = BUSINESS_TZ) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[get("weekday")] ?? now.getDay();
  // Intl can emit "24" for midnight in hour12:false; normalize to 0.
  const hh = Number(get("hour")) % 24;
  const mm = Number(get("minute"));
  return { day, minutesNow: hh * 60 + mm };
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function fmt12(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}:00 ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Find the next day (searching forward up to 7 days) that has open hours. */
function nextOpenDay(fromDay: number): { day: number; hours: NonNullable<DayHours> } | null {
  for (let i = 1; i <= 7; i++) {
    const d = (fromDay + i) % 7;
    const h = hours[d];
    if (h) return { day: d, hours: h };
  }
  return null;
}

export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const { day, minutesNow } = localParts(now);
  const today = hours[day];

  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (minutesNow >= open && minutesNow < close) {
      return {
        isOpen: true,
        day,
        minutesNow,
        message: `Open now · until ${fmt12(today.close)}`,
      };
    }
    if (minutesNow < open) {
      return {
        isOpen: false,
        day,
        minutesNow,
        message: `Closed · opens today at ${fmt12(today.open)}`,
      };
    }
  }

  // Closed for the rest of today (or closed all day) — find the next open day.
  const next = nextOpenDay(day);
  if (!next) {
    return { isOpen: false, day, minutesNow, message: "Closed" };
  }
  const label = DAY_LABELS[next.day];
  return {
    isOpen: false,
    day,
    minutesNow,
    message: `Closed · opens ${label} at ${fmt12(next.hours.open)}`,
  };
}

/** Rows for a weekly-hours table, Monday-first for readability. */
export function weeklyHoursRows(): { label: string; value: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((d) => {
    const h = hours[d];
    return {
      label: DAY_LABELS[d],
      value: h ? `${fmt12(h.open)} – ${fmt12(h.close)}` : "Closed",
    };
  });
}
