import { describe, expect, it } from "vitest";
import { GrowTablesMissingError, isMissingGrowTable } from "@/lib/grow-errors";

describe("isMissingGrowTable", () => {
  it("recognises the Postgres undefined-table code", () => {
    expect(isMissingGrowTable({ code: "42P01" })).toBe(true);
  });

  it("recognises the message form for both grow tables", () => {
    expect(
      isMissingGrowTable(new Error('relation "grow" does not exist')),
    ).toBe(true);
    expect(
      isMissingGrowTable(new Error('relation "grow_event_done" does not exist')),
    ).toBe(true);
  });

  it("does NOT swallow other database failures", () => {
    // The whole point: only a missing schema gets the friendly screen.
    // Connection refused, auth failure, and constraint violations must surface.
    expect(isMissingGrowTable({ code: "ECONNREFUSED" })).toBe(false);
    expect(isMissingGrowTable({ code: "28P01" })).toBe(false); // bad password
    expect(isMissingGrowTable({ code: "23505" })).toBe(false); // unique violation
    expect(isMissingGrowTable(new Error("timeout"))).toBe(false);
  });

  it("does not mistake another table's absence for ours", () => {
    expect(
      isMissingGrowTable(new Error('relation "bookmark" does not exist')),
    ).toBe(false);
  });

  it("survives junk without throwing", () => {
    for (const junk of [null, undefined, 0, "", [], {}]) {
      expect(isMissingGrowTable(junk)).toBe(false);
    }
  });
});

describe("GrowTablesMissingError", () => {
  it("is catchable by instanceof and names itself", () => {
    const e = new GrowTablesMissingError();
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(GrowTablesMissingError);
    expect(e.name).toBe("GrowTablesMissingError");
  });
});
