import { describe, it, expect } from "vitest";
import { products, getProductBySlug, getProductsByCategory, isInSeason } from "./products";

describe("getProductBySlug", () => {
  it("finds a known product", () => {
    expect(getProductBySlug(products[0].slug)).toEqual(products[0]);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getProductsByCategory", () => {
  it("returns only products in the given category", () => {
    const leafyGreens = getProductsByCategory("leafy-greens");
    expect(leafyGreens.length).toBeGreaterThan(0);
    for (const p of leafyGreens) {
      expect(p.category).toBe("leafy-greens");
    }
  });
});

describe("isInSeason", () => {
  it("treats a year-round crop as in season every month", () => {
    const yearRound = products.find((p) => p.inSeasonMonths.length === 12)!;
    for (let month = 1; month <= 12; month++) {
      expect(isInSeason(yearRound, month)).toBe(true);
    }
  });

  it("treats a seasonal crop as out of season outside its window", () => {
    const seasonal = products.find((p) => p.inSeasonMonths.length < 12)!;
    const outOfSeasonMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
      (m) => !seasonal.inSeasonMonths.includes(m),
    )!;
    expect(isInSeason(seasonal, outOfSeasonMonth)).toBe(false);
  });

  it("every catalog price and unit is a sane, positive value", () => {
    for (const p of products) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.unit.length).toBeGreaterThan(0);
      expect(p.inSeasonMonths.length).toBeGreaterThan(0);
      expect(p.inSeasonMonths.every((m) => m >= 1 && m <= 12)).toBe(true);
    }
  });
});
