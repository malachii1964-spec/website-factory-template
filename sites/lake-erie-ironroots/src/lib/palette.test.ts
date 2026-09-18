import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Contrast, checked against the stylesheet rather than against a copy of the
 * palette kept in the test. If a token is edited in globals.css this reads the
 * new value and fails there, instead of passing against a stale duplicate.
 *
 * The art direction puts two inks on paper and allows exactly one accent. These
 * tests exist so that "one accent" cannot quietly become "an accent that is
 * unreadable at body size", which is the usual way a warm brand red ends up
 * failing AA on a warm background.
 */

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`--color-${name} is not defined in globals.css`);
  return m[1];
}

function relativeLuminance(hex: string): number {
  const v = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function contrast(a: string, b: string): number {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const PAPER = ["paper", "paper-2"] as const;

describe("text on paper", () => {
  it("clears AAA for body text in both inks, on both paper tones", () => {
    for (const bg of PAPER) {
      for (const fg of ["ink", "ink-2"]) {
        const ratio = contrast(token(fg), token(bg));
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("clears AA for the one accent, which is used at body size in the record", () => {
    for (const bg of PAPER) {
      const ratio = contrast(token("iron"), token(bg));
      expect(ratio, `iron on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the palette stays two inks and one accent", () => {
  it("defines no colour outside the agreed set", () => {
    const defined = [...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]);
    expect(new Set(defined)).toEqual(
      new Set(["paper", "paper-2", "ink", "ink-2", "iron", "rule", "rule-hair"]),
    );
  });

  it("has no dark background token", () => {
    // The direction forbids a dark surface anywhere. A near-black background
    // token is how that decision would get quietly reversed.
    for (const name of ["paper", "paper-2"]) {
      expect(relativeLuminance(token(name))).toBeGreaterThan(0.6);
    }
  });
});

describe("the stylesheet honours the direction's anti-patterns", () => {
  /*
    These are cheap string checks, not a rendering test, and they only catch the
    obvious reintroduction. That is worth having: every one of them names
    something that was on the build the owner rejected.
  */
  const forbidden: [string, RegExp][] = [
    ["a backdrop blur", /backdrop-filter/],
    ["a gradient fill on text", /(?:-webkit-)?background-clip:\s*text/],
    ["scroll-driven animation", /animation-timeline/],
    ["smooth scrolling", /scroll-behavior:\s*smooth/],
  ];

  for (const [what, pattern] of forbidden) {
    it(`does not reintroduce ${what}`, () => {
      expect(css).not.toMatch(pattern);
    });
  }

  /*
    These two read the declared VALUE rather than pattern-matching the property.

    The first version tested `/border-radius:\s*(?!0)/` and failed against
    `border-radius: 0`, because `\s*` is free to match zero characters: the
    engine backtracks to the position right after the colon, where the next
    character is a space rather than "0", and the lookahead passes. A negative
    lookahead behind a variable-width match does not mean what it looks like it
    means. Reading the value avoids the whole class of mistake.
  */
  function values(property: string): string[] {
    return [...css.matchAll(new RegExp(`(?:^|[;{\\s])${property}:([^;}]*)`, "g"))].map(
      (m) => m[1].trim(),
    );
  }

  it("declares no non-zero corner radius", () => {
    for (const v of values("border-radius")) {
      expect(v, `border-radius: ${v}`).toMatch(/^0[a-z%]*$/);
    }
  });

  it("declares no drop shadow", () => {
    for (const v of values("box-shadow")) {
      expect(v, `box-shadow: ${v}`).toBe("none");
    }
  });
});
