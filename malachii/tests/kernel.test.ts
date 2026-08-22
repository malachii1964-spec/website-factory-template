import { describe, expect, it } from "vitest";
import { canonicalize, CanonicalizationError } from "../src/crypto/canonical";
import { sha256Object } from "../src/crypto/hash";
import { generateSigningKeyPair, signBytes, verifyBytes } from "../src/crypto/signing";
import { EventLedger, GENESIS_HASH } from "../src/ledger/ledger";
import { SourceRegistry } from "../src/memory/evidence";
import { InvalidRequestError } from "../src/trust/errors";
import { makeHarness } from "./harness";
import { listMemory, retrieve } from "../src/retrieval/retrieval";

describe("canonical serialisation", () => {
  it("is independent of key order", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
    expect(sha256Object({ b: [1, { d: 4, c: 3 }] })).toBe(sha256Object({ b: [1, { c: 3, d: 4 }] }));
  });

  it("refuses values with no stable encoding", () => {
    expect(() => canonicalize({ x: Number.NaN })).toThrow(CanonicalizationError);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => canonicalize(cyclic)).toThrow(CanonicalizationError);
  });

  it("distinguishes a key from a value that looks like one", () => {
    expect(canonicalize({ "a:1": 2 })).not.toBe(canonicalize({ a: "1:2" }));
  });
});

describe("signing", () => {
  it("verifies a genuine signature and rejects a mutated message", () => {
    const key = generateSigningKeyPair();
    const signature = signBytes("payload", key.privateKey);
    expect(verifyBytes("payload", signature, key.publicKey)).toBe(true);
    expect(verifyBytes("payload!", signature, key.publicKey)).toBe(false);
    expect(verifyBytes("payload", "", key.publicKey)).toBe(false);
  });

  it("rejects a signature from a different key", () => {
    const a = generateSigningKeyPair();
    const b = generateSigningKeyPair();
    expect(verifyBytes("payload", signBytes("payload", a.privateKey), b.publicKey)).toBe(false);
  });
});

describe("ledger", () => {
  it("chains from genesis and verifies", () => {
    const ledger = new EventLedger(() => 1000);
    const first = ledger.append({
      type: "memory.created",
      memoryId: "m1",
      contentHash: "h",
      scope: "s",
      layer: "l",
    });
    expect(first.prevHash).toBe(GENESIS_HASH);
    ledger.append({ type: "memory.status_changed", memoryId: "m1", from: "active", to: "cooled", reason: "r" });
    expect(() => ledger.verifyIntegrity()).not.toThrow();
    expect(ledger.entries()[1]?.prevHash).toBe(first.hash);
  });
});

describe("source lineage", () => {
  it("detects a cycle instead of looping forever", () => {
    const sources = new SourceRegistry();
    sources.register({ sourceId: "a", derivedFrom: "b" });
    sources.register({ sourceId: "b", derivedFrom: "a" });
    expect(() => sources.deriveLineageRoot("a")).toThrow(InvalidRequestError);
  });

  it("treats an unregistered source as its own root", () => {
    const sources = new SourceRegistry();
    expect(sources.deriveLineageRoot("unknown")).toBe("unknown");
  });
});

describe("lifecycle", () => {
  it("refuses an illegal transition", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "rule",
      scope: "project.alpha",
    });
    h.fabric.transition(h.root, record.memoryId, "archived", "done");
    expect(() => h.fabric.transition(h.root, record.memoryId, "cooled", "nope")).toThrow(
      InvalidRequestError,
    );
  });

  it("restores a revoked memory only with root authority", () => {
    const h = makeHarness();
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "rule about retries",
      scope: "project.alpha",
    });
    h.fabric.transition(h.root, record.memoryId, "revoked", "poisoned");
    expect(() => h.fabric.transition(h.operator, record.memoryId, "active", "oops")).toThrow(
      InvalidRequestError,
    );
    expect(h.fabric.transition(h.root, record.memoryId, "active", "cleared").status).toBe("active");
  });

  it("demotes only downward", () => {
    const h = makeHarness();
    h.registerSource("s.a");
    h.putEvidence("ev", "s.a");
    const record = h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "rule",
      scope: "project.alpha",
    });
    h.fabric.promote(h.root, {
      memoryId: record.memoryId,
      targetMaturity: "M1_CANDIDATE",
      evidenceRefIds: ["ev"],
      reason: "one source",
    });
    expect(h.fabric.demote(h.root, record.memoryId, "M0_OBSERVATION", "source retracted").storedMaturity).toBe(
      "M0_OBSERVATION",
    );
    expect(() =>
      h.fabric.demote(h.root, record.memoryId, "M2_CORROBORATED", "not a demotion"),
    ).toThrow(InvalidRequestError);
  });
});

describe("temporal and listing filters", () => {
  it("excludes a memory outside its validity window", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "seasonal pricing rule",
      scope: "project.alpha",
      validFrom: 2_000,
      validUntil: 3_000,
    });
    const inputs = h.fabric.retrievalInputs();
    expect(retrieve(h.root, { query: "seasonal pricing rule", at: 2_500 }, inputs)).toHaveLength(1);
    expect(retrieve(h.root, { query: "seasonal pricing rule", at: 9_000 }, inputs)).toHaveLength(0);
  });

  it("requires the list scope for enumeration", () => {
    const h = makeHarness();
    h.fabric.createMemory(h.root, {
      layer: "semantic",
      statement: "rule",
      scope: "project.alpha",
    });
    const inputs = h.fabric.retrievalInputs();
    expect(listMemory(h.root, inputs).length).toBe(1);
    expect(() => listMemory(h.agent, inputs)).toThrow();
  });
});
