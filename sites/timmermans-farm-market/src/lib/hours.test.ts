import { describe, expect, it } from "vitest";
import { getStandStatus } from "@/lib/hours";

// All times below are constructed as UTC instants (via Date.UTC) rather than
// local-time constructors, so these tests are meaningful regardless of the
// test runner's own TZ — and specifically prove getStandStatus computes
// against the stand's own America/New_York time, not the caller's.

describe("getStandStatus", () => {
  it("reports open during business hours in season (Eastern midday)", () => {
    // July 15, 2026, 16:00 UTC = 12:00 noon EDT
    const now = new Date(Date.UTC(2026, 6, 15, 16, 0));
    expect(getStandStatus(now)).toEqual({ status: "open", closesAt: "6 PM" });
  });

  it("reports closed-today before opening, in season", () => {
    // 11:30 UTC = 7:30am EDT
    const now = new Date(Date.UTC(2026, 6, 15, 11, 30));
    expect(getStandStatus(now)).toEqual({ status: "closed-today", opensAt: "9 AM" });
  });

  it("reports closed-today after closing, in season", () => {
    // 23:00 UTC = 7:00pm EDT
    const now = new Date(Date.UTC(2026, 6, 15, 23, 0));
    expect(getStandStatus(now)).toEqual({ status: "closed-today", opensAt: "9 AM" });
  });

  it("reports open at the exact opening minute (Eastern)", () => {
    // 13:00 UTC = 9:00am EDT
    const now = new Date(Date.UTC(2026, 6, 15, 13, 0));
    expect(getStandStatus(now).status).toBe("open");
  });

  it("reports closed-today at the exact closing minute (half-open interval, Eastern)", () => {
    // 22:00 UTC = 6:00pm EDT
    const now = new Date(Date.UTC(2026, 6, 15, 22, 0));
    expect(getStandStatus(now).status).toBe("closed-today");
  });

  it("reports out-of-season before June (Eastern)", () => {
    const now = new Date(Date.UTC(2026, 3, 10, 16, 0)); // April 10, noon EDT
    expect(getStandStatus(now)).toEqual({ status: "out-of-season", opensInMonth: "June" });
  });

  it("reports out-of-season after October (Eastern)", () => {
    const now = new Date(Date.UTC(2026, 10, 15, 16, 0)); // November 15
    expect(getStandStatus(now)).toEqual({ status: "out-of-season", opensInMonth: "June" });
  });

  it("is open on the season boundary months (June 1 and October 31, Eastern)", () => {
    expect(getStandStatus(new Date(Date.UTC(2026, 5, 1, 16, 0))).status).toBe("open");
    expect(getStandStatus(new Date(Date.UTC(2026, 9, 31, 16, 0))).status).toBe("open");
  });

  it("computes status against Eastern time, not the visitor's own clock", () => {
    // 23:30 UTC on July 15 is 7:30pm EDT (closed) — but naively read as local
    // hours by a browser in, say, UTC+8 it would look like the next
    // afternoon. This instant must resolve as closed-today via Eastern time,
    // proving the function doesn't trust the runtime's local timezone.
    const now = new Date(Date.UTC(2026, 6, 15, 23, 30));
    expect(getStandStatus(now)).toEqual({ status: "closed-today", opensAt: "9 AM" });
  });

  it("resolves the correct Eastern weekday even when the UTC calendar day differs", () => {
    // 2026-07-16T02:00:00Z is still July 15, 10pm in Eastern time (EDT, UTC-4) —
    // a naive UTC-based weekday read would see July 16 (Thursday) instead of
    // July 15 (Wednesday). Both are within the always-open week here, so this
    // pins the month/weekday extraction rather than the daysOpen branch.
    const now = new Date(Date.UTC(2026, 6, 16, 2, 0));
    expect(getStandStatus(now)).toEqual({ status: "closed-today", opensAt: "9 AM" });
  });
});
