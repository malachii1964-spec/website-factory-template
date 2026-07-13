import { describe, it, expect } from "vitest";
import { getOpenStatus, localParts, weeklyHoursRows } from "./hours";

/**
 * Fixed instants chosen so their America/New_York (EDT, UTC-4 in July) wall
 * clock is unambiguous.
 *   2026-07-13 is a Monday.
 */
const monday = (hhmmUtc: string) => new Date(`2026-07-13T${hhmmUtc}:00Z`);

describe("localParts", () => {
  it("converts a UTC instant to Eastern weekday + minutes", () => {
    // 14:00 UTC on Mon = 10:00 EDT
    const { day, minutesNow } = localParts(monday("14:00"));
    expect(day).toBe(1); // Monday
    expect(minutesNow).toBe(10 * 60);
  });

  it("handles the day rolling backward across the UTC boundary", () => {
    // 01:00 UTC Mon = 21:00 EDT Sunday
    const { day, minutesNow } = localParts(monday("01:00"));
    expect(day).toBe(0); // Sunday
    expect(minutesNow).toBe(21 * 60);
  });
});

describe("getOpenStatus", () => {
  it("is open during Monday business hours (09:00–19:00)", () => {
    const s = getOpenStatus(monday("14:00")); // 10:00 EDT
    expect(s.isOpen).toBe(true);
    expect(s.message).toMatch(/Open now/);
    expect(s.message).toMatch(/7:00 PM/);
  });

  it("is closed before opening and reports today's opening time", () => {
    const s = getOpenStatus(monday("12:00")); // 08:00 EDT, before 9
    expect(s.isOpen).toBe(false);
    expect(s.message).toMatch(/opens today at 9:00 AM/);
  });

  it("is closed after closing and points to the next day", () => {
    const s = getOpenStatus(monday("23:30")); // 19:30 EDT, after 7pm
    expect(s.isOpen).toBe(false);
    expect(s.message).toMatch(/opens Tuesday at 9:00 AM/);
  });

  it("is closed exactly at closing time (exclusive)", () => {
    const s = getOpenStatus(monday("23:00")); // 19:00 EDT sharp
    expect(s.isOpen).toBe(false);
  });

  it("is open exactly at opening time (inclusive)", () => {
    const s = getOpenStatus(monday("13:00")); // 09:00 EDT sharp
    expect(s.isOpen).toBe(true);
  });
});

describe("weeklyHoursRows", () => {
  it("lists all seven days Monday-first", () => {
    const rows = weeklyHoursRows();
    expect(rows).toHaveLength(7);
    expect(rows[0].label).toBe("Monday");
    expect(rows[6].label).toBe("Sunday");
    // Every day currently has hours, so none should read "Closed".
    expect(rows.every((r) => r.value.includes("–"))).toBe(true);
  });
});
