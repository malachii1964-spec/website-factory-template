import { describe, expect, it } from "vitest";
import {
  daysBetween,
  daysUntilFirstFrost,
  daysUntilLastSpringFrost,
  FIRST_FALL_FROST,
  frostLine,
  isWithin,
  LAST_SPRING_FROST,
  resolve,
  startOfDay,
} from "@/lib/season";

const on = (month: number, day: number) => new Date(2026, month - 1, day);

describe("frost constants", () => {
  it("open before they close, in the same year", () => {
    expect(resolve(LAST_SPRING_FROST, 2026).getTime()).toBeLessThan(
      resolve(FIRST_FALL_FROST, 2026).getTime(),
    );
  });
});

describe("startOfDay", () => {
  it("strips the clock so comparisons are by calendar day", () => {
    const evening = new Date(2026, 8, 12, 23, 59, 59);
    const morning = new Date(2026, 8, 12, 0, 0, 1);
    expect(startOfDay(evening).getTime()).toBe(startOfDay(morning).getTime());
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days and signs them", () => {
    expect(daysBetween(on(9, 1), on(9, 12))).toBe(11);
    expect(daysBetween(on(9, 12), on(9, 1))).toBe(-11);
    expect(daysBetween(on(9, 1), on(9, 1))).toBe(0);
  });

  it("is unaffected by the time of day on either side", () => {
    const a = new Date(2026, 8, 1, 23, 30);
    const b = new Date(2026, 8, 2, 0, 30);
    expect(daysBetween(a, b)).toBe(1);
  });
});

describe("isWithin", () => {
  const window = { from: { month: 6, day: 10 }, to: { month: 7, day: 5 } };

  it("includes both ends", () => {
    expect(isWithin(window, on(6, 10))).toBe(true);
    expect(isWithin(window, on(7, 5))).toBe(true);
  });

  it("excludes the days either side", () => {
    expect(isWithin(window, on(6, 9))).toBe(false);
    expect(isWithin(window, on(7, 6))).toBe(false);
  });

  it("is false in deep winter", () => {
    expect(isWithin(window, on(1, 15))).toBe(false);
  });

  it("resolves the window into whatever year it is asked about", () => {
    expect(isWithin(window, new Date(2031, 5, 20))).toBe(true);
  });
});

describe("daysUntilFirstFrost", () => {
  it("counts down to the frost date", () => {
    expect(daysUntilFirstFrost(on(10, 1))).toBe(6);
    expect(daysUntilFirstFrost(resolve(FIRST_FALL_FROST, 2026))).toBe(0);
  });

  it("goes negative afterwards rather than clamping", () => {
    expect(daysUntilFirstFrost(on(10, 17))).toBe(-10);
  });
});

describe("daysUntilLastSpringFrost", () => {
  it("points at this year's frost while it is still ahead", () => {
    expect(daysUntilLastSpringFrost(on(5, 1))).toBe(14);
  });

  it("rolls into next year once this year's has passed", () => {
    // Rather than going negative, which is what made the winter line read as
    // a count upward from an event nobody was waiting for.
    expect(daysUntilLastSpringFrost(on(10, 12))).toBeGreaterThan(200);
  });
});

describe("frostLine", () => {
  /*
    This line is the outdoor register's single live reading, so it is checked
    at every branch including the one it originally did not have. Before the
    winter branch existed, October through May rendered "85 days past first
    frost" — an upward count from an event nobody is waiting for, in the colour
    reserved for "cutting now", beside copy saying the ground was shut.
  */
  it("counts toward spring while the season has not opened", () => {
    expect(frostLine(on(2, 1))).toMatch(/^\d+ days to last frost$/);
    expect(frostLine(on(5, 14))).toBe("Last frost expected tomorrow");
    expect(frostLine(on(5, 15))).toBe("Last frost expected today");
  });

  it("counts toward first frost through the season", () => {
    expect(frostLine(on(9, 12))).toBe("25 days to first frost");
    expect(frostLine(on(10, 6))).toBe("First frost expected tomorrow");
    expect(frostLine(on(10, 7))).toBe("First frost expected today");
  });

  it("turns back toward spring once first frost has passed", () => {
    expect(frostLine(on(10, 12))).toMatch(/^\d+ days to last frost$/);
    expect(frostLine(on(12, 31))).toMatch(/^\d+ days to last frost$/);
  });

  it("never counts upward from an event that has already happened", () => {
    // Walk a whole year a day at a time. No reading may ever say "past".
    for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
      const line = frostLine(new Date(d));
      expect(line, `${d.toDateString()} → ${line}`).not.toMatch(/past|ago|since/i);
      expect(line).toMatch(/^(-?\d+ days to (last|first) frost|(Last|First) frost expected (today|tomorrow))$/);
    }
  });

  it("never reports a negative number of days", () => {
    for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
      const line = frostLine(new Date(d));
      expect(line, `${d.toDateString()} → ${line}`).not.toMatch(/-\d/);
    }
  });
});
