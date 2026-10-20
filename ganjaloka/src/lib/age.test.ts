import { describe, expect, it } from "vitest";
import { cutoffBirthDate, isOldEnough, parseIsoDate } from "./age";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("parseIsoDate", () => {
  it("accepts real calendar dates", () => {
    expect(parseIsoDate("1990-04-20")?.toISOString()).toBe("1990-04-20T00:00:00.000Z");
  });
  it("rejects impossible dates and loose formats", () => {
    expect(parseIsoDate("2001-02-29")).toBeNull();
    expect(parseIsoDate("1990-4-20")).toBeNull();
    expect(parseIsoDate("04/20/1990")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });
});

describe("isOldEnough (21+)", () => {
  const today = day("2026-10-19");

  it("allows someone whose 21st birthday is today", () => {
    expect(isOldEnough("2005-10-19", 21, today)).toBe(true);
  });
  it("rejects someone who turns 21 tomorrow", () => {
    expect(isOldEnough("2005-10-20", 21, today)).toBe(false);
  });
  it("allows clearly older members", () => {
    expect(isOldEnough("1971-04-20", 21, today)).toBe(true);
  });
  it("rejects future and malformed birth dates", () => {
    expect(isOldEnough("2030-01-01", 21, today)).toBe(false);
    expect(isOldEnough("not-a-date", 21, today)).toBe(false);
  });
  it("clamps Feb 29 like Postgres (leap-day birthdays turn 21 on Mar 1 in common years)", () => {
    expect(cutoffBirthDate(21, day("2025-02-28")).toISOString().slice(0, 10)).toBe("2004-02-28");
    expect(isOldEnough("2004-02-29", 21, day("2025-02-28"))).toBe(false);
    expect(isOldEnough("2004-02-29", 21, day("2025-03-01"))).toBe(true);
  });
});
