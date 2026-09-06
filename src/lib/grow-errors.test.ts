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

  it("sees through the driver's wrapper error", () => {
    // The shape actually observed in the browser: Drizzle throws its own error
    // and hangs the Postgres error off `cause`. Checking only the top level
    // missed every real occurrence, so this is the case that matters most.
    const wrapped = Object.assign(
      new Error('Failed query: select "id" from "grow" where "user_id" = $1'),
      { cause: Object.assign(new Error("relation \"grow\" does not exist"), { code: "42P01" }) },
    );
    expect(isMissingGrowTable(wrapped)).toBe(true);
  });

  it("walks more than one level of wrapping", () => {
    const deep = { cause: { cause: { code: "42P01" } } };
    expect(isMissingGrowTable(deep)).toBe(true);
  });

  it("terminates on a self-referencing cause chain", () => {
    const loop: Record<string, unknown> = { message: "boom" };
    loop.cause = loop;
    expect(isMissingGrowTable(loop)).toBe(false);
  });

  it("does NOT swallow a wrapped error of a different kind", () => {
    const wrapped = Object.assign(new Error("Failed query: insert into grow"), {
      cause: Object.assign(new Error("duplicate key"), { code: "23505" }),
    });
    expect(isMissingGrowTable(wrapped)).toBe(false);
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
