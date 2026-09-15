import { describe, expect, it } from "vitest";
import {
  establishedLine,
  FARM,
  formattedPhone,
  fullAddress,
  hasRealAddress,
  hasRealEmail,
  hasRealPhone,
} from "@/lib/farm";

/**
 * These guards decide what the site publishes about a real business — to
 * customers and, through the structured data, to Google. They started as a
 * single all-or-nothing flag that was honoured on one page, which shipped a
 * fictitious street address on every route. They are load-bearing now, so
 * they are tested.
 */

describe("the publish guards", () => {
  it("recognises the owner's confirmed address as real", () => {
    expect(hasRealAddress()).toBe(true);
    expect(FARM.address.street).toBe("154 North Portage St");
  });

  it("still withholds the placeholder phone and email", () => {
    // If either of these starts passing, the real value went in — update the
    // test with the real value rather than deleting the assertion.
    expect(hasRealPhone()).toBe(false);
    expect(hasRealEmail()).toBe(false);
  });

  it("is per-field, so one real fact is not blocked by a missing one", () => {
    // The bug this pins: a combined flag meant supplying the street address
    // did nothing, because the phone number was not in yet.
    expect(hasRealAddress()).not.toBe(hasRealPhone());
  });
});

describe("fullAddress", () => {
  it("reads as a single line a map can resolve", () => {
    expect(fullAddress()).toBe("154 North Portage St, Westfield, NY 14787");
  });

  it("contains every part of the postal address", () => {
    const line = fullAddress();
    for (const part of [
      FARM.address.street,
      FARM.address.locality,
      FARM.address.region,
      FARM.address.postalCode,
    ]) {
      expect(line).toContain(part);
    }
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

describe("formattedPhone", () => {
  it("formats a ten-digit US number", () => {
    expect(formattedPhone()).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
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
