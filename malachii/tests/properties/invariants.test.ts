import { describe, expect, it } from "vitest";
import { makeHarness, type Harness } from "../harness.ts";
import { AuthorizationError, TrustBoundaryViolation } from "../../src/trust/errors.ts";
import { FORBIDDEN_TRUST_FIELDS } from "../../src/trust/forbiddenFields.ts";
import { deriveSecurityContext, PrincipalRegistry } from "../../src/trust/authority.ts";
import { replayMemoryState } from "../../src/ledger/replay.ts";
import { retrieve, GLOBAL_SCOPE } from "../../src/retrieval/retrieval.ts";
import { countIndependentRoots } from "../../src/memory/evidence.ts";
import { maturityRank, type CreateMemoryInput, type Maturity } from "../../src/memory/types.ts";
import type { PromotionRequest } from "../../src/memory/promotionEngine.ts";

/**
 * Spec section 56. These are stated as universally quantified claims, so each is
 * exercised over generated input rather than a single hand-picked example.
 */

/** Deterministic PRNG — a failing property must reproduce on the next run. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const SCOPES = ["project.alpha", "project.beta", GLOBAL_SCOPE] as const;

function randomInput(next: () => number, i: number): CreateMemoryInput {
  const scope = SCOPES[Math.floor(next() * SCOPES.length)] ?? "project.alpha";
  return {
    layer: next() > 0.5 ? "semantic" : "episodic",
    statement: `generated statement ${i} token${Math.floor(next() * 5)}`,
    scope,
    reportedConfidence: next(),
    importance: next(),
  };
}

function seedLadder(h: Harness): void {
  h.registerSource("source.a");
  h.registerSource("source.b");
  h.putEvidence("e1", "source.a");
  h.putEvidence("e2", "source.b");
  h.putEvidence("e_proc", "source.a");
  h.putEvidence("e_rb", "source.a");
  h.putEvidence("e_auth", "source.b");
}

function fullRequest(h: Harness, memoryId: string, target: Maturity): PromotionRequest {
  const record = h.fabric.record(memoryId)!;
  return {
    memoryId,
    targetMaturity: target,
    evidenceRefIds: ["e1", "e2"],
    outcomeReceipts: [h.outcome("outcome", h.workerA)],
    regressionReceipts: [h.outcome("regression", h.workerA)],
    reviewReceipts: [h.outcome("review", h.workerB)],
    approvalReceipts:
      target === "M5_CONSTITUTIONAL"
        ? [h.approval(memoryId, record.contentHash, target)]
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

describe("P-001 M5 implies a valid root approval on the ledger", () => {
  it("records a constitutional approval event for every M5 memory", () => {
    const h = makeHarness();
    seedLadder(h);
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "constitutional rule",
      scope: "project.alpha",
    });
    for (const level of LADDER) {
      expect(h.fabric.promote(h.root, fullRequest(h, record.memoryId, level)).disposition).toBe(
        "PROMOTED",
      );
    }
    expect(h.fabric.effectiveMaturity(record.memoryId)).toBe("M5_CONSTITUTIONAL");

    const derived = replayMemoryState(h.ledger);
    for (const [memoryId, state] of derived) {
      if (state.effectiveMaturity !== "M5_CONSTITUTIONAL") continue;
      const approved = h.ledger
        .entries()
        .some(
          (e) =>
            e.event.type === "memory.constitutional_approval" && e.event.memoryId === memoryId,
        );
      expect(approved, `${memoryId} reached M5 without an approval event`).toBe(true);
    }
  });
});

describe("P-002 an untrusted caller cannot mint verified state", () => {
  it("ignores a hand-rolled object shaped like a verified evidence ref", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "claim",
      scope: "project.alpha",
    });
    // The API accepts ids only. A forged "ref" is just a string that does not
    // resolve, so it can never become a counted piece of evidence.
    expect(() =>
      h.fabric.promote(h.root, {
        memoryId: record.memoryId,
        targetMaturity: "M1_CANDIDATE",
        evidenceRefIds: [JSON.stringify({ verified: true, lineageRootId: "fake" })],
        reason: "forged ref",
      }),
    ).toThrow(TrustBoundaryViolation);
  });
});

describe("P-003 retrieval never increases maturity or assurance", () => {
  it("holds across a generated sequence of reads", () => {
    const h = makeHarness();
    const next = rng(20260822);
    const ids: string[] = [];
    for (let i = 0; i < 25; i += 1) {
      ids.push(h.fabric.createMemory(h.root, randomInput(next, i)).memoryId);
    }
    const before = new Map(ids.map((id) => [id, h.fabric.effectiveMaturity(id)]));

    for (let i = 0; i < 400; i += 1) {
      const id = ids[Math.floor(next() * ids.length)]!;
      h.fabric.recordRetrievalUse(id);
      retrieve(
        h.root,
        { query: "generated statement", includeGlobal: true },
        h.fabric.retrievalInputs(),
      );
    }

    for (const id of ids) {
      expect(h.fabric.effectiveMaturity(id)).toBe(before.get(id));
    }
  });
});

describe("P-004 effective retrieval scope is a subset of authorised scope", () => {
  it("never returns a record outside the principal's scopes", () => {
    const h = makeHarness();
    const next = rng(7);
    for (let i = 0; i < 40; i += 1) {
      h.fabric.createMemory(h.root, randomInput(next, i));
    }
    const authorized = new Set(h.agent.effectiveScopes);
    const results = retrieve(
      h.agent,
      { query: "generated statement token0 token1 token2 token3 token4" },
      h.fabric.retrievalInputs(),
    );
    expect(results.length).toBeGreaterThan(0);
    for (const { record } of results) {
      expect(authorized.has(record.scope), `leaked scope ${record.scope}`).toBe(true);
      expect(record.scope).not.toBe(GLOBAL_SCOPE);
    }
  });
});

describe("P-005 one lineage root counts once", () => {
  it("holds for any fan-out of derived sources", () => {
    const h = makeHarness();
    const next = rng(99);
    h.registerSource("root.one");
    h.registerSource("root.two");
    const ids: string[] = [];
    for (let i = 0; i < 30; i += 1) {
      const parent = next() > 0.5 ? "root.one" : "root.two";
      const sourceId = `derived.${i}`;
      h.registerSource(sourceId, parent);
      h.putEvidence(`ev${i}`, sourceId);
      ids.push(`ev${i}`);
    }
    const refs = h.resolver.resolveAll(ids);
    expect(refs).toHaveLength(30);
    expect(countIndependentRoots(refs)).toBeLessThanOrEqual(2);
  });
});

describe("P-006 revoked memory never appears in active context", () => {
  it("holds no matter what maturity the memory reached", () => {
    const h = makeHarness();
    seedLadder(h);
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "revocable rule about deployments",
      scope: "project.alpha",
    });
    for (const level of LADDER.slice(0, 3)) {
      h.fabric.promote(h.root, fullRequest(h, record.memoryId, level));
    }
    expect(maturityRank(h.fabric.effectiveMaturity(record.memoryId))).toBeGreaterThan(0);

    h.fabric.transition(h.root, record.memoryId, "revoked", "source retracted");
    const results = retrieve(
      h.root,
      { query: "revocable rule about deployments", includeGlobal: true },
      h.fabric.retrievalInputs(),
    );
    expect(results).toHaveLength(0);
  });
});

describe("P-007 projection equals ledger replay", () => {
  it("holds after a generated sequence of legal operations", () => {
    const h = makeHarness();
    seedLadder(h);
    const next = rng(31337);
    const ids: string[] = [];

    for (let i = 0; i < 20; i += 1) {
      ids.push(
        h.fabric.createMemory(h.root, { ...randomInput(next, i), scope: "project.alpha" }).memoryId,
      );
    }
    for (let i = 0; i < 60; i += 1) {
      const id = ids[Math.floor(next() * ids.length)]!;
      const roll = next();
      if (roll < 0.5) {
        const current = h.fabric.effectiveMaturity(id);
        const target = LADDER[maturityRank(current)];
        if (target) h.fabric.promote(h.root, fullRequest(h, id, target));
      } else if (roll < 0.7) {
        const record = h.fabric.record(id)!;
        if (record.status === "active") h.fabric.transition(h.root, id, "cooled", "idle");
      } else if (roll < 0.85) {
        const record = h.fabric.record(id)!;
        if (record.status === "cooled") h.fabric.transition(h.root, id, "active", "back in use");
      } else {
        h.fabric.recordRetrievalUse(id);
      }
    }

    h.ledger.verifyIntegrity();
    const derived = replayMemoryState(h.ledger);
    for (const record of h.fabric.records()) {
      const truth = derived.get(record.memoryId)!;
      expect(record.storedMaturity).toBe(truth.effectiveMaturity);
      expect(record.status).toBe(truth.status);
    }
    expect(h.fabric.reconcile().ok).toBe(true);
  });
});

describe("P-008 normal creation always yields M0", () => {
  it("holds for every generated input", () => {
    const h = makeHarness();
    const next = rng(4242);
    for (let i = 0; i < 200; i += 1) {
      const record = h.fabric.createMemory(h.root, randomInput(next, i));
      expect(record.storedMaturity).toBe("M0_OBSERVATION");
      expect(h.fabric.effectiveMaturity(record.memoryId)).toBe("M0_OBSERVATION");
    }
  });

  it("holds for imports, which keep history but withhold trust", () => {
    const h = makeHarness();
    const record = h.fabric.importMemory(
      h.root,
      { layer: "semantic", statement: "legacy rule", scope: "project.alpha" },
      "M4_PROCEDURALIZED",
    );
    expect(h.fabric.effectiveMaturity(record.memoryId)).toBe("M0_OBSERVATION");
    expect(record.historicalStoredMaturity).toBe("M4_PROCEDURALIZED");
    expect(record.legacyTrustState).toBe("LEGACY_UNVERIFIED");
  });
});

describe("P-009 requester metadata cannot expand authenticated authority", () => {
  it("holds for every subset of scopes a principal might ask for", () => {
    const registry = new PrincipalRegistry();
    const granted = ["memory.retrieve", "project.alpha"];
    registry.register({
      principalId: "p",
      role: "agent",
      credential: "p-credential-00001",
      grantedScopes: granted,
    });
    const principal = registry.authenticate("p-credential-00001");

    for (const extra of ["memory.promote", "memory.lifecycle", "project.beta", GLOBAL_SCOPE]) {
      expect(() =>
        deriveSecurityContext(principal, { requestedScopes: [...granted, extra] }),
      ).toThrow(AuthorizationError);
    }
    // Narrowing is always allowed.
    expect(
      deriveSecurityContext(principal, { requestedScopes: ["memory.retrieve"] }).effectiveScopes,
    ).toEqual(["memory.retrieve"]);
    expect(deriveSecurityContext(principal).mayReadGlobal).toBe(false);
  });
});

describe("P-010 promotion never depends on caller-supplied trust values", () => {
  it("rejects every field in the forbidden set, on create and on promote", () => {
    for (const field of FORBIDDEN_TRUST_FIELDS) {
      const h = makeHarness();
      seedLadder(h);

      const create = {
        layer: "semantic",
        statement: "probe",
        scope: "project.alpha",
        [field]: true,
      } as unknown as CreateMemoryInput;
      expect(() => h.fabric.createMemory(h.root, create), `create/${field}`).toThrow(
        TrustBoundaryViolation,
      );

      const record = h.fabric.createMemory(h.root, {
        layer: "semantic",
        statement: "probe",
        scope: "project.alpha",
      });
      const promote = {
        ...fullRequest(h, record.memoryId, "M1_CANDIDATE"),
        [field]: true,
      } as unknown as PromotionRequest;
      expect(() => h.fabric.promote(h.root, promote), `promote/${field}`).toThrow(
        TrustBoundaryViolation,
      );
    }
  });
});
