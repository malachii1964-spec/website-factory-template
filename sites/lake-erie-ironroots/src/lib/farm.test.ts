import { describe, expect, it } from "vitest";
import {
  establishedLine,
  FARM,
  formattedPhone,
  fullAddress,
  hasRealAddress,
  hasRealContactDetails,
  hasRealEmail,
  hasRealPhone,
  isRealEmail,
  isRealPhone,
  isRealStreet,
} from "@/lib/farm";

/**
 * These guards decide what the site publishes about a real business — to
 * customers and, through the structured data, to Google. They started as a
 * single all-or-nothing flag honoured on one page, which shipped a fictitious
 * street address on every route. They are load-bearing, so they are tested
 * against placeholders AND real values rather than only against whatever
 * happens to be in the file today.
 */

describe("isRealStreet", () => {
  it("rejects the placeholder shape", () => {
    expect(isRealStreet("0000 Route 20")).toBe(false);
    expect(isRealStreet("   0000 Some Road ")).toBe(false);
    expect(isRealStreet("")).toBe(false);
  });

  it("accepts a real street, including one that starts with a zero-ish number", () => {
    expect(isRealStreet("154 North Portage St")).toBe(true);
    // Guard against an over-eager rule: "00" is not the placeholder sentinel.
    expect(isRealStreet("00 Lakeshore Dr")).toBe(true);
  });
});

describe("isRealPhone", () => {
  it("rejects the placeholder and anything not ten digits", () => {
    expect(isRealPhone("+1-716-000-0000")).toBe(false);
    expect(isRealPhone("716-555-123")).toBe(false);
    expect(isRealPhone("")).toBe(false);
  });

  it("accepts a real number in any of the ways a human writes one", () => {
    for (const written of [
      "+1-716-753-0404",
      "716.753.0404",
      "(716) 753-0404",
      "7167530404",
    ]) {
      expect(isRealPhone(written), written).toBe(true);
    }
  });
});

describe("isRealEmail", () => {
  it("rejects the placeholder and malformed addresses", () => {
    expect(isRealEmail("hello@lakeerieironroots.com")).toBe(false);
    expect(isRealEmail("not-an-email")).toBe(false);
    expect(isRealEmail("two@at@signs.com")).toBe(false);
  });

  it("accepts a real address", () => {
    expect(isRealEmail("malachii1964@gmail.com")).toBe(true);
    expect(isRealEmail("stand@lakeerieironroots.com")).toBe(true);
  });
});

describe("what the site currently publishes", () => {
  it("has the owner's confirmed address, phone and email", () => {
    expect(hasRealAddress()).toBe(true);
    expect(hasRealPhone()).toBe(true);
    expect(hasRealEmail()).toBe(true);
    expect(hasRealContactDetails()).toBe(true);
  });

  it("stores the phone in E.164, so a tel: link dials from anywhere", () => {
    expect(FARM.phone).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/);
  });

  it("displays the phone the way a person reads it", () => {
    expect(formattedPhone()).toBe("(716) 753-0404");
  });
});

describe("fullAddress", () => {
  it("reads as a single line a map can resolve", () => {
    expect(fullAddress()).toBe("154 North Portage St, Westfield, NY 14787");
  });
});

describe("establishedLine", () => {
  it("states the year the owner confirmed, and only the year", () => {
    expect(establishedLine()).toBe("Established 2024");
    // A founding day was never supplied. If one appears here it was invented.
    expect(establishedLine()).not.toMatch(/\d{1,2},/);
  });
});

describe("geo", () => {
  it("is absent until somebody takes a reading at the stand", () => {
    // A guessed lat/long for a real street address is the "pin on a
    // stranger's driveway" failure, and it overrides the correct address.
    expect(FARM.geo).toBeNull();
  });
});

describe("hours", () => {
  it("uses schema.org day names, so the markup and the table cannot drift", () => {
    const valid = new Set([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    for (const h of FARM.hours) {
      for (const d of h.days) expect(valid.has(d)).toBe(true);
      expect(h.opens).toMatch(/^\d{2}:\d{2}$/);
      expect(h.closes).toMatch(/^\d{2}:\d{2}$/);
      expect(h.closes > h.opens).toBe(true);
    }
  });
});
