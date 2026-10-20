import { describe, expect, it } from "vitest";
import { checkContent } from "./index";

describe("checkContent", () => {
  it("allows adult language that isn't a slur", () => {
    expect(checkContent("holy shit this harvest is fucking frosty")).toEqual({ ok: true });
  });

  it("blocks identity-based slurs, including obfuscated spellings", () => {
    const verdict = checkContent("you're a f4ggot");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe("hate");
  });

  it("blocks sale solicitation", () => {
    const verdict = checkContent("Great day", "menu in bio, cashapp only");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe("sale");
  });

  it("treats empty input as fine", () => {
    expect(checkContent("", null, undefined, "   ")).toEqual({ ok: true });
  });
});
