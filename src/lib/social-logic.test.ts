import { describe, expect, it } from "vitest";
import {
  buildStrainPassport,
  isValidHandle,
  isValidStageId,
  REPORT_HIDE_THRESHOLD,
  shouldAutoHide,
  slugifyHandle,
} from "@/lib/social-logic";

describe("isValidHandle", () => {
  it("accepts lowercase letters, digits, underscore, 3-20 chars", () => {
    expect(isValidHandle("frosty_grower")).toBe(true);
    expect(isValidHandle("abc")).toBe(true);
    expect(isValidHandle("a".repeat(20))).toBe(true);
  });

  it("rejects too short, too long, and disallowed characters", () => {
    expect(isValidHandle("ab")).toBe(false);
    expect(isValidHandle("a".repeat(21))).toBe(false);
    expect(isValidHandle("Bad Handle")).toBe(false);
    expect(isValidHandle("has-dash")).toBe(false);
    expect(isValidHandle("")).toBe(false);
  });
});

describe("slugifyHandle", () => {
  it("lowercases and strips an email domain", () => {
    expect(slugifyHandle("Frosty.Grower@example.com")).toBe("frosty_grower");
  });

  it("collapses non-alphanumerics and trims underscores", () => {
    expect(slugifyHandle("  Mr. Canuck's Grow!!  ")).toBe("mr_canuck_s_grow");
  });

  it("pads short input up to the minimum length", () => {
    const result = slugifyHandle("hi");
    expect(isValidHandle(result)).toBe(true);
  });

  it("always returns a valid handle even for degenerate input", () => {
    expect(isValidHandle(slugifyHandle("@@@"))).toBe(true);
    expect(isValidHandle(slugifyHandle(""))).toBe(true);
  });
});

describe("isValidStageId", () => {
  it("accepts real stage ids", () => {
    expect(isValidStageId("flowering")).toBe(true);
    expect(isValidStageId("troubleshooting")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isValidStageId("mid-life-crisis")).toBe(false);
    expect(isValidStageId("")).toBe(false);
  });
});

describe("shouldAutoHide", () => {
  it("stays visible below the threshold", () => {
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD - 1)).toBe(false);
    expect(shouldAutoHide(0)).toBe(false);
  });

  it("hides at and above the threshold", () => {
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD)).toBe(true);
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD + 5)).toBe(true);
  });
});

describe("buildStrainPassport", () => {
  const day = (n: number) => new Date(2026, 0, n);

  it("returns nothing for untagged posts", () => {
    const result = buildStrainPassport([
      {
        strainSlug: null,
        strainName: null,
        createdAt: day(1),
        coverMediaUrl: null,
      },
    ]);
    expect(result).toEqual([]);
  });

  it("groups by strainSlug when present", () => {
    const result = buildStrainPassport([
      {
        strainSlug: "wedding-cake",
        strainName: "Wedding Cake",
        createdAt: day(1),
        coverMediaUrl: "a.jpg",
      },
      {
        strainSlug: "wedding-cake",
        strainName: "Wedding Cake",
        createdAt: day(5),
        coverMediaUrl: "b.jpg",
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].postCount).toBe(2);
    expect(result[0].firstPostedAt).toEqual(day(1));
    expect(result[0].lastPostedAt).toEqual(day(5));
    // Most recent post's photo wins as the cover.
    expect(result[0].coverMediaUrl).toBe("b.jpg");
  });

  it("groups free-text strains case-insensitively by name when there's no slug", () => {
    const result = buildStrainPassport([
      {
        strainSlug: null,
        strainName: "Some Rare Cut",
        createdAt: day(1),
        coverMediaUrl: null,
      },
      {
        strainSlug: null,
        strainName: "some rare cut",
        createdAt: day(2),
        coverMediaUrl: null,
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].postCount).toBe(2);
  });

  it("keeps different strains separate and sorts most-recently-posted first", () => {
    const result = buildStrainPassport([
      {
        strainSlug: "og-kush",
        strainName: "OG Kush",
        createdAt: day(1),
        coverMediaUrl: null,
      },
      {
        strainSlug: "runtz",
        strainName: "Runtz",
        createdAt: day(10),
        coverMediaUrl: null,
      },
    ]);
    expect(result.map((e) => e.strainSlug)).toEqual(["runtz", "og-kush"]);
  });
});
