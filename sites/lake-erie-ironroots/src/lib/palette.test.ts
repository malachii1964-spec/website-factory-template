import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The palette, checked against the stylesheet rather than a copy kept here. If
 * a token is edited in globals.css this reads the new value and fails there,
 * instead of passing against a stale duplicate.
 *
 * Every colour is sampled from the owner's brand plate. These tests exist for
 * one reason: the sampled mid-tones all landed at about 4.0:1 on the base —
 * close enough to look fine on a good monitor and to fail a customer reading on
 * a phone in daylight. They were lifted until they cleared AA, and this is what
 * stops them drifting back down toward the artwork's literal values.
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

/** Both grounds the site ever puts text on. */
const GROUNDS = ["void", "rock"] as const;

describe("text on the plate's ground", () => {
  it("clears AA at body size in every colour used for running text", () => {
    // brass is the body colour, so it is the one that matters most here.
    for (const bg of GROUNDS) {
      for (const fg of ["gild", "gold", "brass", "ember"]) {
        const ratio = contrast(token(fg), token(bg));
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("clears AAA for the two colours headings are set in", () => {
    for (const bg of GROUNDS) {
      for (const fg of ["gild", "gold"]) {
        const ratio = contrast(token(fg), token(bg));
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("keeps stone below the text threshold, because it is a rule colour", () => {
    // stone is deliberately dim. This test is here so nobody promotes it to
    // body text by eye — it is for hairlines and nothing else.
    expect(contrast(token("stone"), token("void"))).toBeLessThan(4.5);
  });
});

describe("the palette stays the plate's palette", () => {
  it("defines exactly the sampled set, and nothing invented", () => {
    const defined = [...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]);
    expect(new Set(defined)).toEqual(
      new Set(["void", "rock", "forge", "stone", "brass", "ember", "gold", "gild", "glow"]),
    );
  });

  it("keeps the grounds genuinely dark, as the plate is", () => {
    for (const name of GROUNDS) {
      expect(relativeLuminance(token(name))).toBeLessThan(0.02);
    }
  });

  it("orders the golds from dim to lit", () => {
    const l = (n: string) => relativeLuminance(token(n));
    expect(l("stone")).toBeLessThan(l("brass"));
    expect(l("brass")).toBeLessThan(l("gold"));
    expect(l("gold")).toBeLessThan(l("gild"));
    expect(l("gild")).toBeLessThan(l("glow"));
  });
});

describe("the stylesheet honours the direction's anti-patterns", () => {
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
    These read the declared VALUE rather than pattern-matching the property.

    An earlier version tested `/border-radius:\s*(?!0)/` and failed against
    `border-radius: 0`, because `\s*` is free to match zero characters: the
    engine backtracks to the position right after the colon, where the next
    character is a space rather than "0", and the lookahead passes. A negative
    lookahead behind a variable-width match does not mean what it looks like it
    means.
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

  it("honours prefers-reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
