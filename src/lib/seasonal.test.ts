import { describe, it, expect } from "vitest";
import { seasonForMonth, currentSeason, currentSeasonalContent } from "./seasonal";

describe("seasonForMonth", () => {
  it("maps months to the nursery's growing seasons", () => {
    expect(seasonForMonth(0)).toBe("winter"); // Jan
    expect(seasonForMonth(2)).toBe("spring"); // Mar
    expect(seasonForMonth(4)).toBe("spring"); // May
    expect(seasonForMonth(5)).toBe("summer"); // Jun
    expect(seasonForMonth(7)).toBe("summer"); // Aug
    expect(seasonForMonth(8)).toBe("fall"); // Sep
    expect(seasonForMonth(10)).toBe("fall"); // Nov
    expect(seasonForMonth(11)).toBe("winter"); // Dec
  });
});

describe("currentSeason", () => {
  it("uses the business timezone month", () => {
    // Mid-July → summer
    expect(currentSeason(new Date("2026-07-13T12:00:00Z"))).toBe("summer");
    // Mid-January → winter
    expect(currentSeason(new Date("2026-01-15T12:00:00Z"))).toBe("winter");
  });
});

describe("currentSeasonalContent", () => {
  it("returns non-empty copy and picks for the season", () => {
    const c = currentSeasonalContent(new Date("2026-07-13T12:00:00Z"));
    expect(c.season).toBe("summer");
    expect(c.heading.length).toBeGreaterThan(0);
    expect(c.picks.length).toBeGreaterThanOrEqual(3);
  });
});
