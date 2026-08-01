import { describe, it, expect } from "vitest";
import { estimateRun, routeMiles } from "./estimate";
import { townByName } from "./towns";

const westfield = townByName("Westfield")!;
const jamestown = townByName("Jamestown")!;
const mayville = townByName("Mayville")!;

describe("estimateRun", () => {
  it("returns the four price parts and a low<high range", () => {
    const e = estimateRun(westfield, jamestown);
    expect(e.parts).toHaveLength(4);
    expect(e.miles).toBeGreaterThan(0);
    expect(e.low).toBeLessThan(e.high);
    expect(e.subtotal).toBeGreaterThan(e.parts[0].amount); // more than dispatch min alone
  });

  it("costs more for a farther run", () => {
    const near = estimateRun(westfield, mayville).subtotal;
    const far = estimateRun(westfield, jamestown).subtotal;
    expect(far).toBeGreaterThan(near);
  });

  it("adds cost for extra stops", () => {
    const direct = estimateRun(westfield, jamestown).subtotal;
    const withStop = estimateRun(westfield, jamestown, [mayville]).subtotal;
    expect(withStop).toBeGreaterThan(direct);
  });
});

describe("routeMiles", () => {
  it("is zero for a single point and grows with distance", () => {
    expect(routeMiles([westfield])).toBe(0);
    expect(routeMiles([westfield, jamestown])).toBeGreaterThan(0);
  });
});
