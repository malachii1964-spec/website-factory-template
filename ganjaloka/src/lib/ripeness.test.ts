import { describe, expect, it } from "vitest";
import { ripenessFor } from "./ripeness";

describe("ripenessFor", () => {
  it("starts clear", () => expect(ripenessFor(0)).toBe("clear"));
  it("goes milky with the first like", () => {
    expect(ripenessFor(1)).toBe("milky");
    expect(ripenessFor(24)).toBe("milky");
  });
  it("turns amber at 25 likes", () => {
    expect(ripenessFor(25)).toBe("amber");
    expect(ripenessFor(10_000)).toBe("amber");
  });
});
