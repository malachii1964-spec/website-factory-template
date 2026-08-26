import { describe, expect, it } from "vitest";
import { EventLedger, signCheckpoint, verifyCheckpoint } from "../src/governance/eventLedger.js";

describe("EventLedger", () => {
  it("chains hashes and verifies clean", () => {
    const ledger = new EventLedger();
    ledger.append("A", { x: 1 });
    ledger.append("B", { y: 2 });
    expect(ledger.verify()).toBe(true);
  });

  it("detects a tampered payload", () => {
    const ledger = new EventLedger();
    ledger.append("A", { x: 1 });
    ledger.append("B", { y: 2 });
    const tampered = ledger.snapshot().map((e) => (e.sequence === 0 ? { ...e, payload: { x: 999 } } : e));
    expect(ledger.verify(tampered)).toBe(false);
  });

  it("detects a reordered chain", () => {
    const ledger = new EventLedger();
    ledger.append("A", {});
    ledger.append("B", {});
    const snap = ledger.snapshot();
    expect(ledger.verify([snap[1]!, snap[0]!])).toBe(false);
  });

  it("checkpoint signature round-trips and rejects a wrong secret", () => {
    const ledger = new EventLedger();
    ledger.append("A", {});
    const cp = signCheckpoint(0, ledger.rootHash(), "secret-1");
    expect(verifyCheckpoint(cp, "secret-1")).toBe(true);
    expect(verifyCheckpoint(cp, "wrong-secret")).toBe(false);
  });
});
