import { describe, it, expect } from "vitest";
import { EMPTY_RUN, setPickup, setDropoff, addStop, removeStop, tapTown, runPoints } from "./run-select";
import { townByName } from "./towns";

const westfield = townByName("Westfield")!;
const jamestown = townByName("Jamestown")!;
const mayville = townByName("Mayville")!;
const bemus = townByName("Bemus Point")!;

describe("run-select invariants", () => {
  it("tapping fills pickup, then dropoff, then stops", () => {
    let s = tapTown(EMPTY_RUN, westfield);
    expect(s.pickup).toBe(westfield);
    s = tapTown(s, jamestown);
    expect(s.dropoff).toBe(jamestown);
    s = tapTown(s, mayville);
    expect(s.stops).toEqual([mayville]);
  });

  it("a pickup cannot equal the dropoff (setPickup clears a colliding dropoff)", () => {
    let s = setDropoff(EMPTY_RUN, jamestown); // dropoff before pickup
    s = setPickup(s, jamestown); // then pick the same town
    expect(s.pickup).toBe(jamestown);
    expect(s.dropoff).toBeNull();
  });

  it("a dropoff equal to the pickup is ignored", () => {
    let s = setPickup(EMPTY_RUN, westfield);
    s = setDropoff(s, westfield);
    expect(s.dropoff).toBeNull();
  });

  it("promoting a stop to an endpoint removes it from stops (no double count)", () => {
    let s = setPickup(EMPTY_RUN, westfield);
    s = setDropoff(s, jamestown);
    s = addStop(s, mayville);
    expect(s.stops).toEqual([mayville]);
    s = setDropoff(s, mayville); // Mayville becomes the dropoff
    expect(s.dropoff).toBe(mayville);
    expect(s.stops).toEqual([]);
  });

  it("caps stops at 2 and ignores duplicates", () => {
    let s = setDropoff(setPickup(EMPTY_RUN, westfield), jamestown);
    s = addStop(s, mayville);
    s = addStop(s, mayville); // duplicate
    s = addStop(s, bemus);
    s = addStop(s, townByName("Dunkirk")!); // over the cap
    expect(s.stops).toEqual([mayville, bemus]);
  });

  it("removeStop drops the town", () => {
    let s = addStop(setDropoff(setPickup(EMPTY_RUN, westfield), jamestown), mayville);
    s = removeStop(s, mayville);
    expect(s.stops).toEqual([]);
  });

  it("runPoints is empty until both endpoints are set", () => {
    expect(runPoints(setPickup(EMPTY_RUN, westfield))).toEqual([]);
    const s = setDropoff(setPickup(EMPTY_RUN, westfield), jamestown);
    expect(runPoints(s)).toEqual([westfield, jamestown]);
  });
});
