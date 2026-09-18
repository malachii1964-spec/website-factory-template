import { describe, expect, it } from "vitest";
import {
  AUTOPOT_LABELS,
  FIGURE_WIDTH,
  LABEL_CHAR_PX,
  LABEL_MARGIN,
  LABEL_X,
  LEADER_MAX_X,
  maxLabelChars,
  SOIL_BANDS,
} from "@/components/figures";

/**
 * SVG text neither wraps nor shrinks. A label one character too long runs
 * straight off the edge of the viewBox and is clipped mid-word, silently — the
 * first version of Fig. 2 shipped "Keeps the sur" and "Air is a nut" and looked
 * fine in source. These measure the real strings against the real width budget.
 *
 * Plex Mono is monospaced, so character count times advance width is exact
 * rather than an estimate, which is the only reason this can be a unit test
 * instead of a rendering check.
 */

function rightEdge(text: string): number {
  return LABEL_X + text.length * LABEL_CHAR_PX;
}

const limit = FIGURE_WIDTH - LABEL_MARGIN;

describe("label width budget", () => {
  it("leaves room for a useful number of characters", () => {
    // If this ever drops low the figure needs a wider viewBox, not shorter
    // words — a two-word label is not a label.
    expect(maxLabelChars()).toBeGreaterThanOrEqual(30);
  });
});

describe("Fig. 1 — AutoPot", () => {
  it.each(AUTOPOT_LABELS)("%s fits inside the drawing", (label) => {
    expect(rightEdge(label), `"${label}" ends at ${rightEdge(label)}px`).toBeLessThanOrEqual(limit);
  });
});

describe("leader lines", () => {
  it("stop short of the label column", () => {
    // "Shallow reserve" shipped with its own leader struck through the S. The
    // component now clamps the elbow, so this pins the clamp rather than each
    // individual target.
    expect(LEADER_MAX_X).toBeLessThan(LABEL_X);
    expect(LABEL_X - LEADER_MAX_X).toBeGreaterThanOrEqual(8);
  });
});

describe("Fig. 2 — soil column", () => {
  it.each(SOIL_BANDS.map((b) => b.name))("band name %s fits", (name) => {
    // Band names are set at 13px, not 11px.
    const edge = LABEL_X + name.length * (LABEL_CHAR_PX * (13 / 11));
    expect(edge, `"${name}" ends at ${edge.toFixed(0)}px`).toBeLessThanOrEqual(limit);
  });

  it.each(SOIL_BANDS.map((b) => b.note))("band note %s fits", (note) => {
    expect(rightEdge(note), `"${note}" ends at ${rightEdge(note)}px`).toBeLessThanOrEqual(limit);
  });

  it("carries no truncation ellipsis", () => {
    // Truncating in code and overflowing the viewBox are two different bugs and
    // the first version had both. Notes are written to fit instead.
    for (const b of SOIL_BANDS) expect(b.note).not.toContain("…");
  });

  it("stacks its bands without gaps or overlaps", () => {
    for (let i = 1; i < SOIL_BANDS.length; i++) {
      const prev = SOIL_BANDS[i - 1];
      expect(SOIL_BANDS[i].y, `band ${SOIL_BANDS[i].name} does not sit on the one above`).toBe(
        prev.y + prev.h,
      );
    }
  });

  it("keeps the whole column inside the drawing", () => {
    const last = SOIL_BANDS[SOIL_BANDS.length - 1];
    expect(last.y + last.h).toBeLessThanOrEqual(320);
  });
});
