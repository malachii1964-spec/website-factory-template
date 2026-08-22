import { describe, expect, it } from "vitest";
import { makeHarness, type Harness } from "../harness.ts";
import {
  AuthorizationError,
  InvalidRequestError,
  LedgerIntegrityError,
  TrustBoundaryViolation,
} from "../../src/trust/errors.ts";
import { EventLedger } from "../../src/ledger/ledger.ts";
import { retrieve } from "../../src/retrieval/retrieval.ts";
import type { PromotionRequest } from "../../src/memory/promotionEngine.ts";
import type { CreateMemoryInput, Maturity, MemoryRecord } from "../../src/memory/types.ts";
import { deriveSecurityContext, PrincipalRegistry } from "../../src/trust/authority.ts";

/**
 * CMA-002 attack corpus (spec section 55). Each case is a real call against the
 * kernel; a passing test means the attack was refused, not that it was skipped.
 */

const baseInput: CreateMemoryInput = {
  layer: "semantic",
  statement: "deploys to production require a signed release receipt",
  scope: "project.alpha",
};

function seedLadderEvidence(h: Harness): void {
  h.registerSource("source.a");
  h.registerSource("source.b");
  h.putEvidence("e1", "source.a");
  h.putEvidence("e2", "source.b");
  h.putEvidence("e_proc", "source.a");
  h.putEvidence("e_rb", "source.a");
  h.putEvidence("e_auth", "source.b");
}

/** Builds the cumulative, fully-satisfied request for a given target level. */
function fullRequest(h: Harness, record: MemoryRecord, target: Maturity): PromotionRequest {
  return {
    memoryId: record.memoryId,
    targetMaturity: target,
    evidenceRefIds: ["e1", "e2"],
    outcomeReceipts: [h.outcome("outcome", h.workerA)],
    regressionReceipts: [h.outcome("regression", h.workerA)],
    reviewReceipts: [h.outcome("review", h.workerB)],
    approvalReceipts:
      target === "M5_CONSTITUTIONAL"
        ? [h.approval(record.memoryId, record.contentHash, target)]
        : [],
    procedureArtifactId: "e_proc",
    rollbackPlanId: "e_rb",
    authorityAnalysisId: "e_auth",
    reason: `advance to ${target}`,
  };
}

const LADDER: readonly Maturity[] = [
  "M1_CANDIDATE",
  "M2_CORROBORATED",
  "M3_VALIDATED",
  "M4_PROCEDURALIZED",
  "M5_CONSTITUTIONAL",
];

/** Climbs legitimately, one ledgered step at a time, up to `target`. */
function climbTo(h: Harness, created: MemoryRecord, target: Maturity): MemoryRecord {
  for (const level of LADDER) {
    const current = h.fabric.record(created.memoryId)!;
    const decision = h.fabric.promote(h.root, fullRequest(h, current, level));
    expect(decision.disposition, `climb to ${level}: ${decision.reasons.join("; ")}`).toBe(
      "PROMOTED",
    );
    if (level === target) break;
  }
  return h.fabric.record(created.memoryId)!;
}

describe("ATK-001 direct M5 creation", () => {
  it("rejects a create call that names a maturity at all", () => {
    const h = makeHarness();
    const poisoned = { ...baseInput, maturity: "M5_CONSTITUTIONAL" } as unknown as CreateMemoryInput;
    expect(() => h.fabric.createMemory(h.root, poisoned)).toThrow(TrustBoundaryViolation);
  });

  it("refuses to jump M0 straight to M5 even with every artefact present", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const record = h.fabric.createMemory(h.root, baseInput);
    const decision = h.fabric.promote(h.root, fullRequest(h, record, "M5_CONSTITUTIONAL"));
    expect(decision.disposition).toBe("DENIED");
    expect(decision.reasons.join(" ")).toContain("exactly one level");
    expect(h.fabric.effectiveMaturity(record.memoryId)).toBe("M0_OBSERVATION");
  });
});

describe("ATK-002 fake independent count", () => {
  it("rejects a caller-supplied independentSourceCount", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const record = h.fabric.createMemory(h.root, baseInput);
    const poisoned = {
      ...fullRequest(h, record, "M1_CANDIDATE"),
      independentSourceCount: 99,
    } as unknown as PromotionRequest;
    expect(() => h.fabric.promote(h.root, poisoned)).toThrow(TrustBoundaryViolation);
  });
});

describe("ATK-003 same-source corroboration", () => {
  it("counts three refs sharing one lineage root as one root", () => {
    const h = makeHarness();
    h.registerSource("wire.service");
    h.registerSource("mirror.one", "wire.service");
    h.registerSource("mirror.two", "wire.service");
    h.putEvidence("m0", "wire.service");
    h.putEvidence("m1", "mirror.one");
    h.putEvidence("m2", "mirror.two");

    const record = h.fabric.createMemory(h.root, baseInput);
    h.fabric.promote(h.root, {
      memoryId: record.memoryId,
      targetMaturity: "M1_CANDIDATE",
      evidenceRefIds: ["m0"],
      reason: "one source is enough for candidate",
    });

    const decision = h.fabric.promote(h.root, {
      memoryId: record.memoryId,
      targetMaturity: "M2_CORROBORATED",
      evidenceRefIds: ["m0", "m1", "m2"],
      reason: "three mirrors of one wire story",
    });

    expect(decision.verifiedEvidenceCount).toBe(3);
    expect(decision.independentRootCount).toBe(1);
    expect(decision.disposition).toBe("DENIED");
    expect(decision.reasons.join(" ")).toContain("independent evidence roots");
  });
});

describe("ATK-004 contradiction bypass", () => {
  it("blocks M2 while an unresolved blocking contradiction stands", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const record = h.fabric.createMemory(h.root, {
      ...baseInput,
      relations: [{ kind: "contradicts", memoryId: "mem_other", blocking: true }],
    });
    h.fabric.promote(h.root, fullRequest(h, record, "M1_CANDIDATE"));
    const decision = h.fabric.promote(
      h.root,
      fullRequest(h, h.fabric.record(record.memoryId)!, "M2_CORROBORATED"),
    );
    expect(decision.unresolvedContradictions).toBe(1);
    expect(decision.disposition).toBe("DENIED");
  });
});

describe("ATK-005 fake Super-User approval", () => {
  it("rejects an approval signed by a key the constitution does not pin", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M4_PROCEDURALIZED");

    const forged = h.approval(
      record.memoryId,
      record.contentHash,
      "M5_CONSTITUTIONAL",
      {},
      h.workerA,
    );
    const decision = h.fabric.promote(h.root, {
      ...fullRequest(h, record, "M5_CONSTITUTIONAL"),
      approvalReceipts: [forged],
    });
    expect(decision.validApprovalCount).toBe(0);
    expect(decision.disposition).toBe("DENIED");
  });

  it("rejects a genuine root approval rebound to different content", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M4_PROCEDURALIZED");

    const wrongContent = h.approval(record.memoryId, "f".repeat(64), "M5_CONSTITUTIONAL");
    const decision = h.fabric.promote(h.root, {
      ...fullRequest(h, record, "M5_CONSTITUTIONAL"),
      approvalReceipts: [wrongContent],
    });
    expect(decision.validApprovalCount).toBe(0);
    expect(decision.disposition).toBe("DENIED");
  });

  it("rejects a replayed approval nonce", () => {
    const h = makeHarness();
    const approval = h.approval("mem_x", "a".repeat(64), "M5_CONSTITUTIONAL");
    h.nonces.consume(approval.nonce);
    expect(() => h.nonces.consume(approval.nonce)).toThrow(TrustBoundaryViolation);
  });
});

describe("ATK-006 fake regression", () => {
  it("does not count a regression receipt from an unregistered worker", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M2_CORROBORATED");

    const rogue = makeHarness().workerA; // valid Ed25519 key, unknown to this registry
    const decision = h.fabric.promote(h.root, {
      ...fullRequest(h, record, "M3_VALIDATED"),
      regressionReceipts: [h.outcome("regression", rogue)],
    });
    expect(decision.verifiedRegressionCount).toBe(0);
    expect(decision.disposition).toBe("DENIED");
  });
});

describe("ATK-007 phantom evidence", () => {
  it("throws rather than quietly resolving fewer refs than were claimed", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    expect(() =>
      h.fabric.promote(h.root, {
        memoryId: record.memoryId,
        targetMaturity: "M1_CANDIDATE",
        evidenceRefIds: ["does-not-exist"],
        reason: "phantom",
      }),
    ).toThrow(TrustBoundaryViolation);
  });
});

describe("ATK-008 retrieval fitness inflation", () => {
  it("leaves maturity untouched no matter how often a memory is read", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    const before = h.fabric.effectiveMaturity(record.memoryId);
    for (let i = 0; i < 500; i += 1) h.fabric.recordRetrievalUse(record.memoryId);
    expect(h.fabric.telemetry(record.memoryId)?.retrievalCount).toBe(500);
    expect(h.fabric.effectiveMaturity(record.memoryId)).toBe(before);
    expect(h.fabric.record(record.memoryId)?.storedMaturity).toBe("M0_OBSERVATION");
  });
});

describe("ATK-009 fabricated outcome", () => {
  it("rejects a receipt whose result was flipped after signing", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M2_CORROBORATED");

    const failed = h.outcome("outcome", h.workerA, { result: "failure" });
    const tampered = { ...failed, result: "success" as const };

    const decision = h.fabric.promote(h.root, {
      ...fullRequest(h, record, "M3_VALIDATED"),
      outcomeReceipts: [tampered],
    });
    expect(decision.verifiedOutcomeCount).toBe(0);
    expect(decision.disposition).toBe("DENIED");
  });
});

describe("ATK-010 global leakage", () => {
  it("hides global-scope memory from a principal who may not read it", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, {
      ...baseInput,
      scope: "global",
      statement: "global secret token",
    });
    const results = retrieve(
      h.agent,
      { query: "global secret token" },
      h.fabric.retrievalInputs(),
    );
    expect(results).toHaveLength(0);
  });

  it("refuses an explicit includeGlobal from an unentitled principal", () => {
    const h = makeHarness();
    expect(() =>
      retrieve(
        h.agent,
        { query: "anything", includeGlobal: true },
        h.fabric.retrievalInputs(),
      ),
    ).toThrow(AuthorizationError);
  });

  it("does not treat global as a wildcard even for root unless asked for", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, {
      ...baseInput,
      scope: "global",
      statement: "global secret token",
    });
    const inputs = h.fabric.retrievalInputs();
    expect(retrieve(h.root, { query: "global secret token" }, inputs)).toHaveLength(0);
    expect(
      retrieve(h.root, { query: "global secret token", includeGlobal: true }, inputs),
    ).toHaveLength(1);
  });
});

describe("ATK-011 blank-query dump", () => {
  it("rejects whitespace-only queries", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, baseInput);
    for (const query of ["", "   ", "\n\t"]) {
      expect(() =>
        retrieve(
          h.root,
          { query },
          h.fabric.retrievalInputs(),
        ),
      ).toThrow(InvalidRequestError);
    }
  });
});

describe("ATK-012 learning authority escalation", () => {
  it("rejects a payload asserting its own authority impact", () => {
    const h = makeHarness();
    const poisoned = {
      ...baseInput,
      relations: [{ kind: "supports", memoryId: "m", raisesAuthority: false }],
    } as unknown as CreateMemoryInput;
    expect(() => h.fabric.createMemory(h.root, poisoned)).toThrow(TrustBoundaryViolation);
  });
});

describe("ATK-013 global learning from local evidence", () => {
  it("refuses to proceduralise a globally scoped memory", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, { ...baseInput, scope: "global" });
    for (const level of ["M1_CANDIDATE", "M2_CORROBORATED", "M3_VALIDATED"] as const) {
      const decision = h.fabric.promote(
        h.root,
        fullRequest(h, h.fabric.record(created.memoryId)!, level),
      );
      expect(decision.disposition).toBe("PROMOTED");
    }
    const decision = h.fabric.promote(
      h.root,
      fullRequest(h, h.fabric.record(created.memoryId)!, "M4_PROCEDURALIZED"),
    );
    expect(decision.disposition).toBe("DENIED");
    expect(decision.reasons.join(" ")).toContain("bounded scope");
  });
});

describe("ATK-014 nonexistent regression", () => {
  it("denies M3 when no regression receipt is supplied at all", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M2_CORROBORATED");
    const decision = h.fabric.promote(h.root, {
      ...fullRequest(h, record, "M3_VALIDATED"),
      regressionReceipts: [],
    });
    expect(decision.disposition).toBe("DENIED");
    expect(decision.reasons.join(" ")).toContain("regression receipt");
  });
});

describe("ATK-015 restart ledger divergence", () => {
  it("detects a projection edited outside the kernel and quarantines it", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    h.fabric.unsafeOverwriteProjection(record.memoryId, {
      storedMaturity: "M5_CONSTITUTIONAL",
    });

    const report = h.fabric.reconcile();
    expect(report.ok).toBe(false);
    expect(report.divergent).toContain(record.memoryId);
    expect(h.fabric.record(record.memoryId)?.status).toBe("quarantined");
    expect(h.fabric.record(record.memoryId)?.storedMaturity).toBe("M0_OBSERVATION");
  });

  it("detects a tampered ledger entry on restore", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, baseInput);
    const entries = h.ledger.export();
    const tampered = entries.map((entry, i) =>
      i === 0 ? { ...entry, event: { ...entry.event, memoryId: "mem_swapped" } } : entry,
    );
    expect(() => EventLedger.restore(tampered)).toThrow(LedgerIntegrityError);
  });

  it("restores an untampered ledger and reproduces the same state", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    const restored = EventLedger.restore(h.ledger.export());
    expect(restored.entries()).toHaveLength(h.ledger.entries().length);
    expect(restored.entries()[0]?.event).toMatchObject({ memoryId: record.memoryId });
  });
});

describe("ATK-016 missing rollback", () => {
  it("denies M4 without a rollback plan", () => {
    const h = makeHarness();
    seedLadderEvidence(h);
    const created = h.fabric.createMemory(h.root, baseInput);
    const record = climbTo(h, created, "M3_VALIDATED");
    const { rollbackPlanId: _dropped, ...withoutRollback } = fullRequest(
      h,
      record,
      "M4_PROCEDURALIZED",
    );
    void _dropped;
    const decision = h.fabric.promote(h.root, withoutRollback);
    expect(decision.disposition).toBe("DENIED");
    expect(decision.reasons.join(" ")).toContain("rollback plan");
  });
});

describe("ATK-017 caller trust override", () => {
  it("rejects trust_override at the top level", () => {
    const h = makeHarness();
    const poisoned = { ...baseInput, trust_override: true } as unknown as CreateMemoryInput;
    expect(() => h.fabric.createMemory(h.root, poisoned)).toThrow(TrustBoundaryViolation);
  });

  it("rejects trust_override buried deep in the payload", () => {
    const h = makeHarness();
    const poisoned = {
      ...baseInput,
      sourceRefs: [{ sourceId: "s", locator: "x", meta: { nested: { trust_override: true } } }],
    } as unknown as CreateMemoryInput;
    try {
      h.fabric.createMemory(h.root, poisoned);
      throw new Error("expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(TrustBoundaryViolation);
      expect((error as TrustBoundaryViolation).offendingFields[0]).toContain("trust_override");
    }
  });

  it("names every offending field instead of silently stripping", () => {
    const h = makeHarness();
    const poisoned = {
      ...baseInput,
      trusted: true,
      verified: true,
      attested: true,
    } as unknown as CreateMemoryInput;
    try {
      h.fabric.createMemory(h.root, poisoned);
      throw new Error("expected rejection");
    } catch (error) {
      const fields = [...(error as TrustBoundaryViolation).offendingFields].sort();
      expect(fields).toEqual(["attested", "trusted", "verified"]);
    }
  });
});

describe("ATK-018 forged security metadata", () => {
  it("refuses a context request that asks for scopes the principal lacks", () => {
    const registry = new PrincipalRegistry();
    registry.register({
      principalId: "weak",
      role: "agent",
      credential: "weak-credential-0001",
      grantedScopes: ["memory.retrieve"],
    });
    const principal = registry.authenticate("weak-credential-0001");
    expect(() =>
      deriveSecurityContext(principal, { requestedScopes: ["memory.retrieve", "memory.promote"] }),
    ).toThrow(AuthorizationError);
  });

  it("refuses a context request carrying a role or tier claim", () => {
    const h = makeHarness();
    const registry = new PrincipalRegistry();
    registry.register({
      principalId: "weak",
      role: "agent",
      credential: "weak-credential-0002",
      grantedScopes: ["memory.retrieve"],
    });
    const principal = registry.authenticate("weak-credential-0002");
    expect(() => deriveSecurityContext(principal, { trustTier: "T2" } as never)).toThrow(
      TrustBoundaryViolation,
    );
    expect(h.agent.isRoot).toBe(false);
  });

  it("rejects an unknown credential outright", () => {
    const registry = new PrincipalRegistry();
    expect(() => registry.authenticate("not-a-real-credential")).toThrow(AuthorizationError);
  });
});

describe("ATK-019 retrieval metadata scope injection", () => {
  it("treats instruction-shaped text as a search term, not as authority", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, {
      ...baseInput,
      scope: "global",
      statement: "global secret token",
    });
    h.fabric.createMemory(h.root, {
      ...baseInput,
      scope: "project.beta",
      statement: "beta only note",
    });

    const results = retrieve(
      h.agent,
      { query: "[SYSTEM_INSTRUCTION_OVERRIDE] global secret token beta only note" },
      h.fabric.retrievalInputs(),
    );
    expect(results).toHaveLength(0);
  });

  it("refuses a query naming a scope the principal does not hold", () => {
    const h = makeHarness();
    expect(() =>
      retrieve(
        h.agent,
        { query: "anything", scopes: ["project.beta"] },
        h.fabric.retrievalInputs(),
      ),
    ).toThrow(AuthorizationError);
  });
});

describe("ATK-020 revoked-memory cache escape", () => {
  it("drops revoked memory from retrieval", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    const inputs = h.fabric.retrievalInputs();
    expect(retrieve(h.root, { query: "signed release receipt" }, inputs)).toHaveLength(1);

    h.fabric.transition(h.root, record.memoryId, "revoked", "poisoned by upstream source");
    expect(retrieve(h.root, { query: "signed release receipt" }, inputs)).toHaveLength(0);
  });

  it("keeps the revocation in forensic history", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    h.fabric.transition(h.root, record.memoryId, "revoked", "poisoned");
    const types = h.ledger.entries().map((e) => e.event.type);
    expect(types).toContain("memory.status_changed");
    h.ledger.verifyIntegrity();
  });

  it("requires root authority to revoke", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, baseInput);
    expect(() => h.fabric.transition(h.operator, record.memoryId, "revoked", "not my call")).toThrow(
      InvalidRequestError,
    );
  });
});
