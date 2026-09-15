import { describe, expect, it } from "vitest";
import {
  comingSoon,
  CROPS,
  type Crop,
  cropSegment,
  daysBetween,
  daysUntilFirstFrost,
  daysUntilLastSpringFrost,
  FIRST_FALL_FROST,
  formatWindow,
  frostLine,
  isReady,
  justFinished,
  LAST_SPRING_FROST,
  monthTicks,
  readyOn,
  resolve,
  seasonPosition,
} from "@/lib/season";

/** Local-midnight date, matching how the module reasons about days. */
const on = (m: number, d: number, y = 2026) => new Date(y, m - 1, d);

const sample: Crop = {
  id: "test",
  name: "Test crop",
  kind: "vegetable",
  from: { month: 7, day: 1 },
  to: { month: 8, day: 1 },
  note: "Test note.",
};

describe("crop data", () => {
  it("has unique ids", () => {
    expect(new Set(CROPS.map((c) => c.id)).size).toBe(CROPS.length);
  });

  it("never ends a window before it starts", () => {
    for (const c of CROPS) {
      const start = resolve(c.from, 2026).getTime();
      const end = resolve(c.to, 2026).getTime();
      expect(end, `${c.id} ends before it starts`).toBeGreaterThan(start);
    }
  });

  it("gives every crop a real note rather than a placeholder", () => {
    for (const c of CROPS) {
      expect(c.note.length).toBeGreaterThan(15);
      expect(c.note.trim().endsWith(".")).toBe(true);
    }
  });

  it("uses calendar dates that actually exist", () => {
    for (const c of CROPS) {
      for (const md of [c.from, c.to]) {
        const d = resolve(md, 2026);
        // A 31st in a 30-day month silently rolls into the next month.
        expect(d.getMonth(), `${c.id} has an impossible date`).toBe(md.month - 1);
        expect(d.getDate()).toBe(md.day);
      }
    }
  });
});

describe("isReady", () => {
  it("includes both the first and the last day of the window", () => {
    expect(isReady(sample, on(7, 1))).toBe(true);
    expect(isReady(sample, on(8, 1))).toBe(true);
  });

  it("excludes the day either side", () => {
    expect(isReady(sample, on(6, 30))).toBe(false);
    expect(isReady(sample, on(8, 2))).toBe(false);
  });

  it("ignores the time of day", () => {
    const lateOnLastDay = new Date(2026, 7, 1, 23, 59, 59);
    expect(isReady(sample, lateOnLastDay)).toBe(true);
  });

  it("works the same in a leap year", () => {
    expect(isReady(sample, on(7, 15, 2028))).toBe(true);
  });
});

describe("readyOn", () => {
  it("returns crops in the order the season brings them on", () => {
    const list = readyOn(on(9, 12));
    const starts = list.map((c) => resolve(c.from, 2026).getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("has something to sell in the middle of September", () => {
    // The stand's whole promise is that the page is never empty in season.
    expect(readyOn(on(9, 12)).length).toBeGreaterThan(5);
  });

  it("is empty in deep winter rather than throwing", () => {
    expect(readyOn(on(1, 15))).toEqual([]);
  });

  it("never lists the same crop twice", () => {
    const list = readyOn(on(8, 10));
    expect(new Set(list.map((c) => c.id)).size).toBe(list.length);
  });
});

describe("comingSoon", () => {
  it("excludes anything already ready", () => {
    const date = on(9, 12);
    const readyIds = new Set(readyOn(date).map((c) => c.id));
    for (const c of comingSoon(date)) {
      expect(readyIds.has(c.id)).toBe(false);
    }
  });

  it("respects the window it is given", () => {
    const date = on(5, 25);
    for (const c of comingSoon(date, 20)) {
      expect(daysBetween(date, resolve(c.from, 2026))).toBeLessThanOrEqual(20);
    }
  });

  it("does not report a crop as coming when it starts today", () => {
    // Starting today means ready, not coming. Both lists would be wrong.
    const start = resolve(CROPS[0].from, 2026);
    expect(comingSoon(start).map((c) => c.id)).not.toContain(CROPS[0].id);
  });
});

describe("justFinished", () => {
  it("reports a crop the day after its window closes", () => {
    const dayAfterStrawberries = on(7, 6);
    expect(justFinished(dayAfterStrawberries, 7).map((c) => c.id)).toContain(
      "strawberries",
    );
  });

  it("stops reporting it once the window has passed", () => {
    expect(justFinished(on(9, 1), 7).map((c) => c.id)).not.toContain(
      "strawberries",
    );
  });
});

describe("seasonPosition", () => {
  it("is 0 at last spring frost and 1 at first fall frost", () => {
    expect(seasonPosition(resolve(LAST_SPRING_FROST, 2026))).toBe(0);
    expect(seasonPosition(resolve(FIRST_FALL_FROST, 2026))).toBe(1);
  });

  it("clamps outside the season instead of running off the rule", () => {
    expect(seasonPosition(on(2, 1))).toBe(0);
    expect(seasonPosition(on(12, 20))).toBe(1);
  });

  it("advances monotonically through the season", () => {
    const a = seasonPosition(on(6, 1));
    const b = seasonPosition(on(7, 1));
    const c = seasonPosition(on(9, 1));
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe("cropSegment", () => {
  it("keeps every segment inside the rule", () => {
    for (const c of CROPS) {
      const s = cropSegment(c, 2026);
      expect(s.start).toBeGreaterThanOrEqual(0);
      expect(s.end).toBeLessThanOrEqual(1);
      expect(s.end).toBeGreaterThanOrEqual(s.start);
    }
  });

  it("flags a crop that genuinely runs past first frost", () => {
    const kale = CROPS.find((c) => c.id === "kale")!;
    const s = cropSegment(kale, 2026);
    expect(s.overrunsFrost).toBe(true);
    expect(s.end).toBe(1);
  });

  it("does not flag a crop that finishes inside the season", () => {
    const strawberries = CROPS.find((c) => c.id === "strawberries")!;
    expect(cropSegment(strawberries, 2026).overrunsFrost).toBe(false);
  });
});

describe("daysUntilFirstFrost and frostLine", () => {
  it("counts down to the frost date", () => {
    expect(daysUntilFirstFrost(on(10, 1))).toBe(6);
    expect(daysUntilFirstFrost(resolve(FIRST_FALL_FROST, 2026))).toBe(0);
  });

  it("goes negative afterwards rather than clamping", () => {
    expect(daysUntilFirstFrost(on(10, 17))).toBe(-10);
  });

  it("reads as a sentence at every boundary", () => {
    expect(frostLine(on(9, 12))).toBe("25 days to first frost");
    expect(frostLine(on(10, 6))).toBe("First frost expected tomorrow");
    expect(frostLine(on(10, 7))).toBe("First frost expected today");
    // Past first frost the line points at next spring, not up from autumn.
    expect(frostLine(on(10, 12))).toMatch(/^\d+ days to last frost$/);
  });
});

describe("marker and bars share one coordinate space", () => {
  /*
    The bug this pins: the Season Rule drew today's marker from
    seasonPosition() but drew each bar from cropSegment(), and a layout mistake
    put the marker a full label-width to the right — sixteen days late, sitting
    past the end of bars the same component had lit as "ready today".

    The arithmetic invariant that makes that class of error impossible: on any
    day, the marker MUST fall inside the segment of every crop that is ready,
    and outside the segment of every crop that is not. If these two functions
    ever stop agreeing, this fails.
  */
  const days = [
    on(5, 15), on(6, 1), on(7, 4), on(8, 20), on(9, 12), on(9, 13), on(10, 6),
  ];

  it("puts the marker inside every ready crop's segment", () => {
    for (const day of days) {
      const marker = seasonPosition(day);
      for (const crop of readyOn(day)) {
        const seg = cropSegment(crop, 2026);
        expect(
          marker,
          `${crop.id} is ready on ${day.toDateString()} but the marker sits outside its bar`,
        ).toBeGreaterThanOrEqual(seg.start - 1e-9);
        expect(marker).toBeLessThanOrEqual(seg.end + 1e-9);
      }
    }
  });

  it("puts the marker outside the segment of anything not yet started", () => {
    for (const day of days) {
      const marker = seasonPosition(day);
      for (const crop of comingSoon(day, 60)) {
        expect(marker).toBeLessThan(cropSegment(crop, 2026).start + 1e-9);
      }
    }
  });
});

describe("monthTicks", () => {
  it("only returns months inside the season", () => {
    const ticks = monthTicks(2026);
    // May is labelled at the origin: the season opens on 15 May, so 1 May is
    // off the axis, but an axis that starts at JUN contradicts the caption.
    expect(ticks.map((t) => t.label)).toEqual(["May", "Jun", "Jul", "Aug", "Sep", "Oct"]);
    expect(ticks[0].at).toBe(0);
  });

  it("places every tick on the rule, in order", () => {
    const ticks = monthTicks(2026);
    for (const t of ticks) {
      expect(t.at).toBeGreaterThanOrEqual(0);
      expect(t.at).toBeLessThanOrEqual(1);
    }
    const positions = ticks.map((t) => t.at);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe("frostLine out of season", () => {
  it("counts toward spring once the fall frost has passed", () => {
    // It used to count up forever: "85 days past first frost" on New Year's
    // Eve, in the colour reserved for "ready now", beside copy saying the
    // stand is shut.
    expect(frostLine(on(10, 12))).toBe(`${daysUntilLastSpringFrost(on(10, 12))} days to last frost`);
    expect(frostLine(on(12, 31))).toMatch(/days to last frost$/);
    expect(frostLine(on(2, 1))).toMatch(/days to last frost$/);
  });

  it("never reports a negative or absurd number of days", () => {
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 15, 28]) {
        const line = frostLine(on(m, d));
        const n = Number(line.match(/^(\d+) days/)?.[1] ?? 0);
        expect(n, `${m}/${d} -> ${line}`).toBeLessThanOrEqual(366);
        expect(line).not.toContain("past first frost");
        expect(line).not.toContain("-");
      }
    }
  });

  it("rolls to next year's spring frost after the fall frost", () => {
    expect(daysUntilLastSpringFrost(on(10, 12))).toBeGreaterThan(180);
    expect(daysUntilLastSpringFrost(on(3, 1))).toBeLessThan(90);
  });
});

describe("formatWindow", () => {
  it("reads as a human date range", () => {
    expect(formatWindow(sample)).toBe("Jul 1 – Aug 1");
  });
});
