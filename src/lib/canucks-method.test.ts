import { describe, expect, it } from "vitest";
import {
  addDays,
  BASE_MIX_TBSP_PER_GAL,
  CASTINGS_TBSP_PER_GAL,
  doseSchedule,
  METHOD_EVENTS,
  PH_RANGE,
  runTotals,
  tbspLabel,
  TOP_DRESS_TBSP_PER_GAL,
  waterPerWatering,
} from "@/lib/canucks-method";

describe("the ramp", () => {
  it("runs strictly downhill from all-nitrogen to all-bloom", () => {
    const pcts = METHOD_EVENTS.map((e) => e.apPct);
    expect(pcts[0]).toBe(100);
    expect(pcts[pcts.length - 1]).toBe(0);
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeLessThanOrEqual(pcts[i - 1]);
    }
  });

  it("keeps events in chronological order with unique ids", () => {
    const weeks = METHOD_EVENTS.map((e) => e.week);
    expect([...weeks].sort((a, b) => a - b)).toEqual(weeks);
    expect(new Set(METHOD_EVENTS.map((e) => e.id)).size).toBe(
      METHOD_EVENTS.length,
    );
  });

  it("feeds on a three-week cadence", () => {
    const feeds = METHOD_EVENTS.filter((e) => e.tbspPerGal > 0);
    for (let i = 1; i < feeds.length; i++) {
      expect(feeds[i].week - feeds[i - 1].week).toBe(3);
    }
  });

  it("only the pot-up event uses the heavier mix-in rate", () => {
    for (const e of METHOD_EVENTS) {
      if (e.kind === "mix") expect(e.tbspPerGal).toBe(BASE_MIX_TBSP_PER_GAL);
      else if (e.tbspPerGal > 0)
        expect(e.tbspPerGal).toBe(TOP_DRESS_TBSP_PER_GAL);
    }
  });
});

describe("doseSchedule", () => {
  it("gives a 5 gallon pot one tablespoon per gallon per top-dress", () => {
    const bulk = doseSchedule(5, 1).find((d) => d.event.id === "bulk")!;
    // Bulk is 100% Power Bloom.
    expect(bulk.allPurposeTbsp).toBe(0);
    expect(bulk.powerBloomTbsp).toBe(5);
    expect(bulk.castingsTbsp).toBe(5 * CASTINGS_TBSP_PER_GAL);
  });

  it("splits the pre-flip dose evenly", () => {
    const preFlip = doseSchedule(5, 1).find((d) => d.event.id === "pre-flip")!;
    expect(preFlip.allPurposeTbsp).toBe(preFlip.powerBloomTbsp);
    expect(preFlip.allPurposeTbsp + preFlip.powerBloomTbsp).toBe(5);
  });

  it("scales linearly with plant count", () => {
    const one = doseSchedule(5, 1);
    const four = doseSchedule(5, 4);
    one.forEach((d, i) => {
      expect(four[i].allPurposeTbsp).toBeCloseTo(d.allPurposeTbsp * 4, 5);
      expect(four[i].powerBloomTbsp).toBeCloseTo(d.powerBloomTbsp * 4, 5);
    });
  });

  it("adds nothing on flip and finish weeks", () => {
    for (const id of ["flip", "finish"]) {
      const d = doseSchedule(5, 2).find((x) => x.event.id === id)!;
      expect(d.allPurposeTbsp).toBe(0);
      expect(d.powerBloomTbsp).toBe(0);
      expect(d.castingsTbsp).toBe(0);
    }
  });

  it("clamps absurd input instead of returning nonsense", () => {
    const huge = doseSchedule(9999, 9999);
    const clamped = doseSchedule(30, 24);
    expect(huge).toEqual(clamped);

    const tiny = doseSchedule(-4, 0);
    expect(tiny).toEqual(doseSchedule(1, 1));
    for (const d of tiny) {
      expect(d.allPurposeTbsp).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(d.powerBloomTbsp)).toBe(true);
    }
  });

  it("puts every event on a whole number of days from pot-up", () => {
    for (const d of doseSchedule(5, 1)) {
      expect(d.dayOffset).toBe(d.event.week * 7);
      expect(Number.isInteger(d.dayOffset)).toBe(true);
    }
  });
});

describe("runTotals", () => {
  it("equals the sum of every dose in the schedule", () => {
    const totals = runTotals(7, 3);
    const manual = doseSchedule(7, 3).reduce(
      (a, d) => ({
        ap: a.ap + d.allPurposeTbsp,
        pb: a.pb + d.powerBloomTbsp,
        wc: a.wc + d.castingsTbsp,
      }),
      { ap: 0, pb: 0, wc: 0 },
    );
    expect(totals.allPurposeTbsp).toBeCloseTo(manual.ap, 1);
    expect(totals.powerBloomTbsp).toBeCloseTo(manual.pb, 1);
    expect(totals.castingsTbsp).toBeCloseTo(manual.wc, 1);
  });

  it("needs more bloom than all-purpose over a full run", () => {
    // The ramp spends most of its feeding events in flower.
    const t = runTotals(5, 1);
    expect(t.powerBloomTbsp).toBeGreaterThan(0);
    expect(t.allPurposeTbsp).toBeGreaterThan(0);
  });
});

describe("helpers", () => {
  it("promotes tablespoons to cups past 16", () => {
    expect(tbspLabel(0)).toBe("—");
    expect(tbspLabel(5)).toBe("5 tbsp");
    expect(tbspLabel(16)).toBe("1 cup");
    expect(tbspLabel(32)).toBe("2 cups");
  });

  it("waters a fifth to a quarter of pot volume", () => {
    const [lo, hi] = waterPerWatering(5);
    expect(lo).toBe(1);
    expect(hi).toBe(1.25);
    expect(lo).toBeLessThan(hi);
  });

  it("addDays does not mutate the input date", () => {
    const start = new Date("2026-03-01T12:00:00Z");
    const before = start.getTime();
    const later = addDays(start, 21);
    expect(start.getTime()).toBe(before);
    expect(later.getTime()).toBeGreaterThan(before);
  });

  it("keeps pH inside the organic-soil band", () => {
    expect(PH_RANGE[0]).toBeLessThan(PH_RANGE[1]);
    expect(PH_RANGE[0]).toBeGreaterThanOrEqual(6);
    expect(PH_RANGE[1]).toBeLessThanOrEqual(7);
  });
});
