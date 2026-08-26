// Regression test for the exact defect found in MALACHII v3.3-RC1's
// `authorize()`: it accepted an injected `now`, but the call chain down to
// `effectiveAssurance` silently dropped it and fell back to wall-clock time,
// so evidence-freshness checks passed or failed depending on when the test
// happened to run rather than on the clock the caller supplied. Two of
// MALACHII's own 20 regression tests were failing for exactly this reason at
// the time this package was built (audit dated 2026-08-15; run 2026-08-26).
// This pins the clock explicitly so the assertion can never rot the same way.
import { describe, expect, it } from "vitest";
import { authorize, redeemAuthorization } from "../src/governance/authorization.js";
import { effectiveAssurance } from "../src/governance/runtimeManifest.js";
import type { RuntimeManifest } from "../src/governance/runtimeManifest.js";

const now = new Date("2026-08-15T08:00:00Z");
const observed: RuntimeManifest = {
  host: { id: "test" },
  capabilities: [
    {
      name: "filesystem.write",
      evidence: [
        {
          id: "e1",
          kind: "observation",
          source: "probe",
          authenticity: "verified",
          directness: "direct",
          capability: "filesystem.write",
          scope: ["project"],
          observedSuccess: true,
          verifiedAt: now.toISOString(),
          expiresAt: "2026-08-15T09:00:00Z",
        },
      ],
    },
  ],
};

describe("authorize() — clock threading regression", () => {
  it("an observed side effect still requires approval, evaluated at the pinned clock", () => {
    const decision = authorize(observed, { capability: "filesystem.write", scope: "project", impact: "external_side_effect" }, now);
    expect(decision.decision).toBe("require_approval");
  });

  it("an observed side effect WITH an approvalId permits, at the pinned clock", () => {
    const decision = authorize(observed, { capability: "filesystem.write", scope: "project", impact: "external_side_effect", approvalId: "ok" }, now);
    expect(decision.decision).toBe("permit");
  });

  it("evidence that has expired relative to the pinned clock fails closed (deny), not open", () => {
    const later = new Date("2026-08-15T10:00:00Z"); // 1h after expiresAt
    expect(effectiveAssurance(observed.capabilities[0]!, "project", later)).toBe("A0_UNKNOWN");
    const decision = authorize(observed, { capability: "filesystem.write", scope: "project", impact: "reversible_local" }, later);
    expect(decision.decision).toBe("deny");
  });

  it("TOCTOU redemption re-checks a FRESH manifest, not the one used to plan", () => {
    const fresh: RuntimeManifest = { host: { id: "test" }, capabilities: [] };
    const decision = redeemAuthorization(fresh, { capability: "filesystem.write", scope: "project", impact: "external_side_effect", approvalId: "ok" }, now);
    expect(decision.decision).toBe("deny");
  });
});
