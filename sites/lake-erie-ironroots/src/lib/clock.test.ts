import { describe, expect, it } from "vitest";
import { farmToday } from "@/lib/clock";

/**
 * These tests exist because of one specific failure: a UTC server rolling the
 * farm's produce list over five hours early. Each case below is a real clock
 * moment where the server's date and the farm's date disagree.
 */
describe("farmToday", () => {
  it("returns the previous day when UTC has already rolled over", () => {
    // 30 Sep 2026, 8pm in Westfield = 1 Oct 2026, 00:00 UTC.
    const d = farmToday(new Date("2026-10-01T00:00:00Z"));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // September
    expect(d.getDate()).toBe(30);
  });

  it("agrees with UTC during the farm's working day", () => {
    // 12 Sep 2026, 2pm UTC = 10am in Westfield. Same calendar day.
    const d = farmToday(new Date("2026-09-12T14:00:00Z"));
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(12);
  });

  it("handles the switch out of daylight saving", () => {
    // 1 Nov 2026 is the DST change; at 06:00 UTC the farm is on EST (-5),
    // so it is still 1 Nov, 1am locally.
    const d = farmToday(new Date("2026-11-01T06:00:00Z"));
    expect(d.getMonth()).toBe(10); // November
    expect(d.getDate()).toBe(1);
  });

  it("does not roll the year over early on New Year's Eve", () => {
    // 31 Dec 2026, 7pm EST = 1 Jan 2027, 00:00 UTC. The farm is still in 2026.
    const d = farmToday(new Date("2027-01-01T00:00:00Z"));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it("returns a Date at local midnight, so day comparisons are clean", () => {
    const d = farmToday(new Date("2026-09-12T14:00:00Z"));
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()])
      .toEqual([0, 0, 0, 0]);
  });

  it("defaults to the real clock without throwing", () => {
    expect(() => farmToday()).not.toThrow();
  });
});
