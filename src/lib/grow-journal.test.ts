import { describe, expect, it } from "vitest";
import {
  buildTasks,
  dayOfGrow,
  defaultGrowName,
  getMethod,
  METHODS,
  nextAction,
  normalisePlants,
  normalisePotGallons,
  progress,
} from "@/lib/grow-journal";

const canucks = getMethod("mr-canucks-grow")!;
const START = new Date("2026-03-01T12:00:00");

function tasks(doneIds: string[] = [], today = new Date("2026-03-01T12:00:00")) {
  return buildTasks(canucks, {
    potGallons: 5,
    plants: 2,
    startedOn: START,
    doneEventIds: doneIds,
    today,
  });
}

describe("method registry", () => {
  it("exposes methods with unique slugs and a real schedule", () => {
    expect(METHODS.length).toBeGreaterThan(0);
    expect(new Set(METHODS.map((m) => m.slug)).size).toBe(METHODS.length);
    for (const m of METHODS) {
      expect(m.schedule(5, 1).length).toBeGreaterThan(0);
      expect(m.totalWeeks).toBeGreaterThan(0);
    }
  });

  it("returns undefined for an unknown slug rather than throwing", () => {
    expect(getMethod("not-a-real-method")).toBeUndefined();
  });
});

describe("buildTasks", () => {
  it("dates every event from the day the grower potted up", () => {
    const t = tasks();
    expect(t[0].date.toDateString()).toBe(START.toDateString());
    // Week 3 event lands 21 days later.
    const wk3 = t.find((x) => x.event.id === "veg-1")!;
    expect(Math.round((wk3.date.getTime() - START.getTime()) / 86400000)).toBe(21);
  });

  it("marks day-zero work due and everything later upcoming", () => {
    const t = tasks();
    expect(t[0].state).toBe("due");
    expect(t.slice(1).every((x) => x.state === "upcoming")).toBe(true);
  });

  it("keeps an overdue task due rather than quietly hiding it", () => {
    // 40 days in, nothing ticked: pot-up and the week-3 feed are both overdue.
    const t = tasks([], new Date("2026-04-10T12:00:00"));
    const overdue = t.filter((x) => x.state === "due").map((x) => x.event.id);
    expect(overdue).toContain("pot-up");
    expect(overdue).toContain("veg-1");
  });

  it("respects completions", () => {
    const t = tasks(["pot-up"]);
    expect(t.find((x) => x.event.id === "pot-up")!.state).toBe("done");
    expect(t.find((x) => x.event.id === "pot-up")!.done).toBe(true);
  });

  it("treats a task dated today as due from midnight, not from the clock", () => {
    // Journal started at noon; it is now 1am on the same calendar day.
    const t = buildTasks(canucks, {
      potGallons: 5,
      plants: 1,
      startedOn: new Date("2026-03-01T12:00:00"),
      doneEventIds: [],
      today: new Date("2026-03-01T01:00:00"),
    });
    expect(t[0].state).toBe("due");
  });

  it("carries the dose amounts through unchanged", () => {
    const t = tasks();
    const bulk = t.find((x) => x.event.id === "bulk")!;
    expect(bulk.powerBloomTbsp).toBe(10); // 1 tbsp/gal * 5 gal * 2 plants
    expect(bulk.allPurposeTbsp).toBe(0);
  });
});

describe("nextAction", () => {
  it("returns the first due task", () => {
    expect(nextAction(tasks())!.event.id).toBe("pot-up");
  });

  it("skips completed work", () => {
    expect(nextAction(tasks(["pot-up"]))!.event.id).toBe("veg-1");
  });

  it("falls back to the next unfinished task when nothing is due yet", () => {
    // Journal starts in the future: nothing is due, but there is still a next.
    const t = buildTasks(canucks, {
      potGallons: 5,
      plants: 1,
      startedOn: new Date("2026-06-01T12:00:00"),
      doneEventIds: [],
      today: new Date("2026-03-01T12:00:00"),
    });
    expect(t.every((x) => x.state === "upcoming")).toBe(true);
    expect(nextAction(t)!.event.id).toBe("pot-up");
  });

  it("returns null once everything is ticked", () => {
    const all = tasks().map((t) => t.event.id);
    expect(nextAction(tasks(all))).toBeNull();
  });
});

describe("progress", () => {
  it("counts completions", () => {
    expect(progress(tasks())).toMatchObject({ done: 0, pct: 0 });
    const all = tasks().map((t) => t.event.id);
    expect(progress(tasks(all)).pct).toBe(100);
  });
});

describe("dayOfGrow", () => {
  it("counts whole days from pot-up", () => {
    expect(dayOfGrow(START, new Date("2026-03-01T23:00:00"))).toBe(0);
    expect(dayOfGrow(START, new Date("2026-03-22T06:00:00"))).toBe(21);
  });

  it("never goes negative for a future start", () => {
    expect(dayOfGrow(new Date("2026-09-01"), new Date("2026-03-01"))).toBe(0);
  });
});

describe("input normalisation", () => {
  it("falls back to a 5 gallon pot for anything off the menu", () => {
    expect(normalisePotGallons(7)).toBe(7);
    expect(normalisePotGallons(4)).toBe(5);
    expect(normalisePotGallons(-1)).toBe(5);
    expect(normalisePotGallons(NaN)).toBe(5);
  });

  it("clamps plant count into range", () => {
    expect(normalisePlants(3)).toBe(3);
    expect(normalisePlants(0)).toBe(1);
    expect(normalisePlants(-5)).toBe(1);
    expect(normalisePlants(9999)).toBe(24);
    expect(normalisePlants(NaN)).toBe(1);
    expect(normalisePlants(2.6)).toBe(3);
  });
});

describe("defaultGrowName", () => {
  it("reads like a person wrote it", () => {
    expect(defaultGrowName(canucks, START)).toBe(
      "March grow — Mr. Canucks Grow method",
    );
  });
});
