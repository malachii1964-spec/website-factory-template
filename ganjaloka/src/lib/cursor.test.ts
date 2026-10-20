import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

const cursor = { at: "2026-10-19T22:14:02.161661+00:00", id: "8292a1f8-8c80-47ca-8036-bbc2ea5df396" };

describe("feed cursor", () => {
  it("round-trips", () => {
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("is URL-safe", () => {
    expect(encodeCursor(cursor)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([null, undefined, "", "not-base64!!", Buffer.from("x|y").toString("base64url"),
    Buffer.from(`bad-date|${cursor.id}`).toString("base64url"),
    Buffer.from(`${cursor.at}|${cursor.id}|extra`).toString("base64url"),
    "a".repeat(500)])("rejects malformed input %#", (value) => {
    expect(decodeCursor(value)).toBeNull();
  });
});
