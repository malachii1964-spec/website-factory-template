import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrast is a design decision that rots silently. Somebody nudges a grey a
 * shade darker because it "looks better" and small text quietly drops under
 * AA for everyone who is not looking at it on a calibrated monitor in a dark
 * room.
 *
 * These tests read the real tokens out of globals.css rather than repeating
 * the hex values here, so there is exactly one source of truth and the test
 * cannot drift away from what the site actually ships.
 */

const CSS = readFileSync(
  resolve(import.meta.dirname, "../app/globals.css"),
  "utf8",
);

function token(name: string): string {
  const m = CSS.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`--color-${name} is not defined in globals.css`);
  return m[1];
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/** Composite `fg` at `alpha` over `bg`, the way the browser does. */
function mix(fg: string, bg: string, alpha: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [fr, fg_, fb] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  const c = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha));
  return `#${[c(fr, br), c(fg_, bg_), c(fb, bb)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;
const AA_LARGE = 3;

describe("contrast math", () => {
  it("matches the known reference values", () => {
    expect(contrast("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });
});

describe("dark ground — every text colour used on --pier", () => {
  const pier = () => token("pier");

  it("passes AA for body text", () => {
    expect(contrast(token("iron"), pier())).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("passes AA for the gold labels", () => {
    expect(contrast(token("gold"), pier())).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("passes AA for parchment headings", () => {
    expect(contrast(token("parchment"), pier())).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
  });

  it("passes AA for the ember accent", () => {
    // --ember carries meaning ("ready now"), so it has to be readable as text
    // and not only as a decorative fill.
    expect(contrast(token("ember"), pier())).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("passes AA for lit gold on the raised shale surface", () => {
    expect(contrast(token("gold-lit"), token("shale"))).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
  });
});

describe("the ember button", () => {
  it("keeps its label readable against the ember fill", () => {
    expect(contrast(token("pier"), token("ember"))).toBeGreaterThanOrEqual(
      AA_LARGE,
    );
  });
});

describe("parchment band — the one inverted section", () => {
  const parchment = () => token("parchment");

  it("passes AA for its body text", () => {
    expect(contrast("#4A3B29", parchment())).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("passes AA for its headings", () => {
    expect(contrast("#2A2118", parchment())).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("passes AA for its gold labels", () => {
    // Plain --gold is too light on parchment, which is why the band uses a
    // darker burnished tone. This test is what stops someone "simplifying" it
    // back to the shared token.
    expect(contrast("#8A5F18", parchment())).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrast(token("gold"), parchment())).toBeLessThan(AA_NORMAL);
  });
});

describe("token hygiene", () => {
  it("defines every colour the design plan names", () => {
    for (const name of [
      "pier",
      "shale",
      "iron",
      "gold",
      "gold-lit",
      "ember",
      "ironroot",
      "parchment",
    ]) {
      expect(() => token(name)).not.toThrow();
    }
  });

  it("keeps a ready bar clearly separated from an off-season bar", () => {
    /*
      The pair that matters on the Season Rule is not --ember against --gold.
      It is --ember against what an off-season bar actually renders as: gold
      mixed 34% into --pier. Comparing the raw tokens says 1.23 and looks
      alarming; comparing what is actually on screen is the real test.

      The drawing must not rely on colour alone either. It does not: each row
      carries visually-hidden text naming the crop's window and whether it is
      ready today. An earlier version of this comment claimed an "ember dot"
      in the chart that was never there — a comment justifying a weak
      assertion by describing a mitigation that did not exist.
    */
    const ready = token("ember");
    const offSeason = mix(token("gold"), token("pier"), 0.34);
    expect(contrast(ready, offSeason)).toBeGreaterThan(2);
  });
});
