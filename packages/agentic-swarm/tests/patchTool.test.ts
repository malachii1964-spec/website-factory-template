import { describe, expect, it } from "vitest";
import { parsePatchToolInput } from "../src/tools/patchTool.js";

describe("parsePatchToolInput", () => {
  it("accepts a well-formed tool_use.input", () => {
    const parsed = parsePatchToolInput({
      diagnosis: "button overlaps footer",
      root_cause_selector: "#checkout-btn",
      edits: [{ file: "src/checkout.css", find: "top: -20px;", replace: "top: 10px;", rationale: "clears the footer" }],
      assertion: "await page.locator('#checkout-btn').boundingBox().then(b => b.y >= 80)",
    });
    expect(parsed.rootCauseSelector).toBe("#checkout-btn");
    expect(parsed.edits).toHaveLength(1);
  });

  it("rejects input missing the mandatory assertion field", () => {
    expect(() =>
      parsePatchToolInput({
        diagnosis: "x",
        root_cause_selector: "#y",
        edits: [{ file: "a", find: "b", replace: "c", rationale: "d" }],
      }),
    ).toThrow();
  });

  it("rejects an empty edits array", () => {
    expect(() =>
      parsePatchToolInput({
        diagnosis: "x",
        root_cause_selector: "#y",
        edits: [],
        assertion: "true",
      }),
    ).toThrow();
  });
});
