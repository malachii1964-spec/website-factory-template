import { describe, expect, it } from "vitest";
import { targetSize } from "./image";

describe("targetSize", () => {
  it("keeps small photos as-is", () => {
    expect(targetSize(1200, 900)).toEqual({ w: 1200, h: 900 });
  });
  it("scales the long edge down to the max, keeping aspect ratio", () => {
    expect(targetSize(4032, 3024)).toEqual({ w: 2048, h: 1536 });
    expect(targetSize(3024, 4032)).toEqual({ w: 1536, h: 2048 });
  });
  it("never produces a zero dimension", () => {
    expect(targetSize(10_000, 1)).toEqual({ w: 2048, h: 1 });
  });
});
