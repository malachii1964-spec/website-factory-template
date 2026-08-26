import { describe, expect, it } from "vitest";
import { qualityFloor, shipDecision } from "../src/governance/quality.js";
import type { QualityScores } from "../src/governance/quality.js";

const strongExceptOneDimension: QualityScores = {
  accuracy: 9,
  verification: 2, // one weak dimension
  completeness: 9,
  intentAlignment: 9,
  executionReadiness: 9,
  structure: 9,
  edgeCases: 9,
};

describe("qualityFloor", () => {
  it("is the MINIMUM dimension, not the average — a single weak score sinks the floor", () => {
    expect(qualityFloor(strongExceptOneDimension)).toBe(2);
  });
});

describe("shipDecision", () => {
  it("refuses to ship when the floor is below threshold even if hard gates pass", () => {
    const decision = shipDecision(strongExceptOneDimension, 7, { build_passed: true });
    expect(decision.ship).toBe(false);
    expect(decision.floor).toBe(2);
  });

  it("refuses to ship on a failed hard gate even when every score is high", () => {
    const allNines: QualityScores = { accuracy: 9, verification: 9, completeness: 9, intentAlignment: 9, executionReadiness: 9, structure: 9, edgeCases: 9 };
    const decision = shipDecision(allNines, 7, { assertion_passed: false });
    expect(decision.ship).toBe(false);
    expect(decision.failedGates).toEqual(["assertion_passed"]);
  });

  it("ships when the floor clears threshold and all hard gates pass", () => {
    const allEights: QualityScores = { accuracy: 8, verification: 8, completeness: 8, intentAlignment: 8, executionReadiness: 8, structure: 8, edgeCases: 8 };
    const decision = shipDecision(allEights, 7, { assertion_passed: true });
    expect(decision.ship).toBe(true);
  });
});
