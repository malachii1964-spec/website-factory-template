import { describe, expect, it } from "vitest";
import { compactCount, relativeTime, segmentBody } from "./format";

const now = new Date("2026-10-19T12:00:00Z");

describe("relativeTime", () => {
  it.each([
    ["2026-10-19T11:59:40Z", "now"],
    ["2026-10-19T11:55:00Z", "5m"],
    ["2026-10-19T09:00:00Z", "3h"],
    ["2026-10-16T12:00:00Z", "3d"],
    ["2026-10-03T12:00:00Z", "Oct 3"],
    ["2024-10-03T12:00:00Z", "Oct 3, 2024"],
  ])("%s → %s", (iso, expected) => {
    expect(relativeTime(iso, now)).toBe(expected);
  });
});

describe("compactCount", () => {
  it("compacts large numbers", () => {
    expect(compactCount(999)).toBe("999");
    expect(compactCount(1200)).toBe("1.2K");
  });
});

describe("segmentBody", () => {
  it("finds links and mentions without swallowing punctuation", () => {
    expect(segmentBody("Read https://example.com/grow. Thanks @Night_Grower!")).toEqual([
      { type: "text", value: "Read " },
      { type: "link", value: "https://example.com/grow", href: "https://example.com/grow" },
      { type: "text", value: ". Thanks " },
      { type: "mention", value: "@Night_Grower", username: "night_grower" },
      { type: "text", value: "!" },
    ]);
  });

  it("leaves markup as plain text (rendered escaped by React)", () => {
    expect(segmentBody("<script>alert(1)</script>")).toEqual([
      { type: "text", value: "<script>alert(1)</script>" },
    ]);
  });

  it("ignores javascript: pseudo-links", () => {
    expect(segmentBody("javascript:alert(1)").every((s) => s.type === "text")).toBe(true);
  });
});
