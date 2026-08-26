import { describe, expect, it } from "vitest";
import { findOverlaps, rectsIntersect } from "../src/vision/geometry.js";
import type { GeometryEntry, Rect } from "../src/vision/geometry.js";

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height };
}

describe("rectsIntersect", () => {
  it("detects the exact reference bug: a button pulled up into a footer", () => {
    const footer = rect(0, 0, 400, 80);
    const button = rect(20, -20, 200, 48); // top: -20px
    expect(rectsIntersect(footer, button)).toBe(true);
  });

  it("does not flag adjacent, non-overlapping elements", () => {
    const footer = rect(0, 0, 400, 80);
    const button = rect(20, 90, 200, 48); // top: 90px — clear of the footer
    expect(rectsIntersect(footer, button)).toBe(false);
  });

  it("touching edges do not count as overlap", () => {
    const a = rect(0, 0, 100, 100);
    const b = rect(100, 0, 100, 100);
    expect(rectsIntersect(a, b)).toBe(false);
  });
});

describe("findOverlaps", () => {
  it("excludes parent/child containment from the overlap set", () => {
    const parent: GeometryEntry = { selector: "main", rect: rect(0, 0, 400, 600), computed: {}, ancestors: [] };
    const child: GeometryEntry = { selector: "button", rect: rect(20, 20, 100, 40), computed: {}, ancestors: ["main"] };
    expect(findOverlaps([parent, child])).toEqual([]);
  });

  it("flags two unrelated siblings that occupy the same space", () => {
    const footer: GeometryEntry = { selector: "footer", rect: rect(0, 0, 400, 80), computed: {}, ancestors: ["main"] };
    const button: GeometryEntry = { selector: "#checkout-btn", rect: rect(20, -20, 200, 48), computed: {}, ancestors: ["main"] };
    expect(findOverlaps([footer, button])).toEqual([["footer", "#checkout-btn"]]);
  });
});
