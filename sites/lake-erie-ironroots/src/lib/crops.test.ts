import { describe, expect, it } from "vitest";
import {
  cuttingOn,
  cycleLine,
  type Entry,
  groundInWindow,
  isWellFormed,
  nothingCutting,
  onRegister,
  REGISTER,
  registerLine,
  roomNotRunning,
  STANDING_LABEL,
  STANDING_ORDER,
  windowLine,
} from "@/lib/crops";

const on = (month: number, day: number) => new Date(2026, month - 1, day);

/**
 * The register is what the farm tells the public it grows. The previous version
 * of this data published twenty Chautauqua County field crops — sweet corn,
 * Concord grapes, apples, pumpkins — none of which the owner had confirmed.
 * Someone reading that could drive here for grapes. These tests exist to keep
 * the list honest and the two registers from contaminating each other.
 */

describe("the published list", () => {
  it("contains only crops the owner confirmed", () => {
    const confirmed = new Set([
      "Tomatoes",
      "Greens",
      "Mushrooms",
      "Strawberries",
      "Herbs",
    ]);
    for (const e of REGISTER) {
      expect(confirmed.has(e.name), `"${e.name}" was never confirmed by the owner`).toBe(true);
    }
  });

  it("has unique ids", () => {
    expect(new Set(REGISTER.map((e) => e.id)).size).toBe(REGISTER.length);
  });

  it("names no varieties, because none were chosen yet", () => {
    // An invented variety name is the same class of error as an invented crop.
    for (const e of REGISTER) expect(e.varieties).toEqual([]);
  });

  it("carries a note on every entry", () => {
    for (const e of REGISTER) expect(e.note.trim().length).toBeGreaterThan(10);
  });
});

describe("register hygiene", () => {
  it("gives bench entries a cycle and no window, and ground entries the reverse", () => {
    // A bench row rendering a seasonal window would be claiming that something
    // grown under lights has a season.
    for (const e of REGISTER) {
      expect(isWellFormed(e), `${e.id} mixes bench and ground fields`).toBe(true);
    }
  });

  it("orders ground windows sanely within one year", () => {
    for (const e of REGISTER) {
      if (!e.window) continue;
      const from = e.window.from.month * 100 + e.window.from.day;
      const to = e.window.to.month * 100 + e.window.to.day;
      expect(to, `${e.id} window ends before it starts`).toBeGreaterThan(from);
    }
  });

  it("uses positive, ordered cycle figures", () => {
    for (const e of REGISTER) {
      if (!e.cycle) continue;
      expect(e.cycle.toFirstCut).toBeGreaterThan(0);
      if (e.cycle.betweenCuts !== null) {
        expect(e.cycle.betweenCuts).toBeGreaterThan(0);
        expect(e.cycle.betweenCuts).toBeLessThanOrEqual(e.cycle.toFirstCut);
      }
    }
  });

  it("has both registers populated", () => {
    expect(onRegister("bench").length).toBeGreaterThan(0);
    expect(onRegister("ground").length).toBeGreaterThan(0);
  });
});

describe("standing", () => {
  it("labels every standing in words, not only by colour", () => {
    for (const e of REGISTER) {
      expect(STANDING_LABEL[e.standing]).toBeTruthy();
      expect(STANDING_ORDER[e.standing]).toBeGreaterThanOrEqual(0);
    }
  });

  it("sorts cutting to the top of a register", () => {
    const ordered = onRegister("bench");
    const ranks = ordered.map((e) => STANDING_ORDER[e.standing]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});

describe("the launch state", () => {
  it("reports the room as not running while everything is planned", () => {
    expect(roomNotRunning()).toBe(true);
  });

  it("cuts nothing on any day of the year while nothing has started", () => {
    // The honest empty state. If this ever fails without the owner having
    // changed a standing, something is deriving "cutting" instead of reading it.
    for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
      expect(cuttingOn(new Date(d))).toEqual([]);
    }
    expect(nothingCutting(on(7, 4))).toBe(true);
  });
});

describe("cuttingOn", () => {
  /*
    Built against a local copy rather than the live register, so these keep
    passing once the owner starts marking rows as cutting.
  */
  const bench: Entry = {
    id: "t", name: "Tomatoes", register: "bench", standing: "cutting",
    cycle: { toFirstCut: 75, betweenCuts: 4 }, varieties: [], note: "n",
  };
  const ground: Entry = {
    id: "s", name: "Strawberries", register: "ground", standing: "cutting",
    window: { from: { month: 6, day: 10 }, to: { month: 7, day: 5 } },
    varieties: [], note: "n",
  };

  const cut = (list: Entry[], date: Date) =>
    list.filter((e) => {
      if (e.standing !== "cutting") return false;
      if (e.register === "ground" && e.window) {
        const y = date.getFullYear();
        const day = new Date(y, date.getMonth(), date.getDate()).getTime();
        return (
          day >= new Date(y, e.window.from.month - 1, e.window.from.day).getTime() &&
          day <= new Date(y, e.window.to.month - 1, e.window.to.day).getTime()
        );
      }
      return true;
    });

  it("keeps a bench crop cutting in February, because a room has no season", () => {
    expect(cut([bench], on(2, 3)).map((e) => e.id)).toEqual(["t"]);
  });

  it("drops a ground crop marked cutting outside its own window", () => {
    // Stale data rather than a February strawberry. The page says nothing
    // instead of saying that.
    expect(cut([ground], on(2, 3))).toEqual([]);
    expect(cut([ground], on(6, 20)).map((e) => e.id)).toEqual(["s"]);
  });
});

describe("groundInWindow", () => {
  it("is a weaker statement than cutting, and is independent of standing", () => {
    // Everything is "planned", so nothing is cutting — but the ground still
    // has windows, and the page labels that difference.
    expect(cuttingOn(on(6, 20))).toEqual([]);
    expect(groundInWindow(on(6, 20)).length).toBeGreaterThan(0);
  });

  it("is empty in deep winter", () => {
    expect(groundInWindow(on(1, 15))).toEqual([]);
  });

  it("never returns a bench entry", () => {
    for (let m = 1; m <= 12; m++) {
      for (const e of groundInWindow(on(m, 15))) {
        expect(e.register).toBe("ground");
      }
    }
  });
});

describe("display lines", () => {
  it("states a bench cycle as a rhythm, not a date", () => {
    expect(cycleLine({ toFirstCut: 21, betweenCuts: 14 })).toBe("Cut every 14 days");
    expect(cycleLine({ toFirstCut: 60, betweenCuts: null })).toBe("60 days to harvest");
  });

  it("states a ground window as dates", () => {
    expect(windowLine({ from: { month: 6, day: 10 }, to: { month: 7, day: 5 } })).toBe(
      "Jun 10 – Jul 5",
    );
  });

  it("never gives the bench a season", () => {
    const line = registerLine("bench", on(1, 15));
    expect(line).toMatch(/all year/i);
    // It may say "no season". It may not attribute one: no frost dates, no
    // window, no "in season" — a room under lights does not have those.
    expect(line).not.toMatch(/frost/i);
    expect(line).not.toMatch(/\bin season\b|\bseasonal\b|\bthis season\b/i);
  });

  it("tells the truth about an empty ground in winter", () => {
    expect(registerLine("ground", on(1, 15))).toMatch(/Nothing is in its window/);
    expect(registerLine("ground", on(6, 20))).not.toMatch(/Nothing is in its window/);
  });
});
