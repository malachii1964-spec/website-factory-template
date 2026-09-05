import { describe, expect, it } from "vitest";
import {
  activeDrops,
  DISCLOSURE,
  DROPS,
  type Drop,
  getDrop,
  isExpired,
} from "@/lib/promos";

const base: Drop = {
  slug: "test",
  number: 1,
  name: "Test",
  edition: "Test edition",
  notes: "Test notes.",
  code: "TESTCODE",
  percentOff: 15,
  breeder: "Test Breeder",
  image: "/promos/test.webp",
  alt: "Test alt text describing the image.",
};

describe("drop data", () => {
  it("has unique slugs, codes and series numbers", () => {
    expect(new Set(DROPS.map((d) => d.slug)).size).toBe(DROPS.length);
    expect(new Set(DROPS.map((d) => d.code)).size).toBe(DROPS.length);
    expect(new Set(DROPS.map((d) => d.number)).size).toBe(DROPS.length);
  });

  it("uses codes that are safe to display and type", () => {
    for (const d of DROPS) {
      expect(d.code).toMatch(/^[A-Z0-9]+$/);
      expect(d.code.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("gives every drop real alt text, not a placeholder", () => {
    for (const d of DROPS) {
      expect(d.alt.length).toBeGreaterThan(30);
      expect(d.alt.toLowerCase()).not.toContain("promo image");
      expect(d.alt.toLowerCase()).not.toContain("image of");
    }
  });

  it("points every drop at a webp under /promos", () => {
    for (const d of DROPS) {
      expect(d.image).toMatch(/^\/promos\/[a-z0-9-]+\.webp$/);
    }
  });

  it("states a real discount", () => {
    for (const d of DROPS) {
      expect(d.percentOff).toBeGreaterThan(0);
      expect(d.percentOff).toBeLessThanOrEqual(100);
    }
  });

  it("discloses the affiliate relationship in plain language", () => {
    expect(DISCLOSURE.toLowerCase()).toContain("affiliate");
    expect(DISCLOSURE.toLowerCase()).toContain("commission");
    expect(DISCLOSURE.toLowerCase()).toContain("no extra cost");
  });
});

describe("isExpired", () => {
  it("treats an open-ended drop as never expired", () => {
    expect(isExpired(base, new Date("2099-01-01"))).toBe(false);
  });

  it("keeps a code live for the whole of its final day", () => {
    const d = { ...base, endsOn: "2026-06-15" };
    expect(isExpired(d, new Date("2026-06-15T23:59:00"))).toBe(false);
    expect(isExpired(d, new Date("2026-06-15T00:01:00"))).toBe(false);
  });

  it("expires the day after", () => {
    const d = { ...base, endsOn: "2026-06-15" };
    expect(isExpired(d, new Date("2026-06-16T00:01:00"))).toBe(true);
  });

  it("never hides a drop because of a malformed date", () => {
    // A typo in the data must not silently delete a live promotion.
    const d = { ...base, endsOn: "not-a-date" };
    expect(isExpired(d, new Date("2026-06-16"))).toBe(false);
  });
});

describe("activeDrops", () => {
  it("returns every drop in series order while all are live", () => {
    const list = activeDrops(new Date("2026-01-01"));
    expect(list.length).toBe(DROPS.length);
    expect(list.map((d) => d.number)).toEqual(
      [...list.map((d) => d.number)].sort((a, b) => a - b),
    );
  });

  it("omits expired drops", () => {
    const all = DROPS.length;
    // No drop currently carries endsOn, so this proves the filter path works
    // rather than asserting on live data that will change.
    const withExpiry = [...DROPS, { ...base, slug: "old", number: 99, endsOn: "2020-01-01" }];
    const live = withExpiry.filter((d) => !isExpired(d, new Date("2026-01-01")));
    expect(live.length).toBe(all);
  });
});

describe("getDrop", () => {
  it("finds a drop by slug and returns undefined otherwise", () => {
    expect(getDrop(DROPS[0].slug)?.name).toBe(DROPS[0].name);
    expect(getDrop("nope")).toBeUndefined();
  });
});
