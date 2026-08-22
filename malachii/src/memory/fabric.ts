import { canonicalize } from "../crypto/canonical.ts";
import { sha256Object } from "../crypto/hash.ts";
import type { FileProjectionStore } from "../ledger/persistence.ts";
import { EventLedger } from "../ledger/ledger.ts";
import { replayMemoryState } from "../ledger/replay.ts";
import { requireScope, type SecurityContext } from "../trust/authority.ts";
import { InvalidRequestError } from "../trust/errors.ts";
import { assertNoTrustBearingFields } from "../trust/forbiddenFields.ts";
import type { RetrievalInputs } from "../retrieval/retrieval.ts";
import type { PromotionDecision, PromotionEngine, PromotionRequest } from "./promotionEngine.ts";
import {
  MATURITY_ORDER,
  maturityRank,
  type CreateMemoryInput,
  type Maturity,
  type MemoryCreationPayload,
  type MemoryRecord,
  type MemoryStatus,
  type MemoryTelemetry,
} from "./types.ts";

export const SCOPE_CREATE = "memory.create";
export const SCOPE_PROMOTE = "memory.promote";
export const SCOPE_LIFECYCLE = "memory.lifecycle";
export const SCOPE_IMPORT = "memory.import";

const ALLOWED_TRANSITIONS: Readonly<Record<MemoryStatus, readonly MemoryStatus[]>> = {
  active: ["cooled", "quarantined", "deprecated", "archived", "revoked"],
  cooled: ["active", "quarantined", "deprecated", "archived", "revoked"],
  quarantined: ["active", "archived", "revoked"],
  deprecated: ["active", "archived", "revoked"],
  archived: ["active", "revoked"],
  revoked: ["active"],
};

/** Transitions only the Super-User may perform. */
const ROOT_ONLY_TARGETS: ReadonlySet<MemoryStatus> = new Set<MemoryStatus>(["revoked"]);
const ROOT_ONLY_SOURCES: ReadonlySet<MemoryStatus> = new Set<MemoryStatus>(["revoked"]);

export interface ReconciliationReport {
  /** In both the log and the cache, but the cache disagreed. Rebuilt from the log. */
  readonly divergent: readonly string[];
  /** In the log but absent from the cache. Restored from the log. */
  readonly missing: readonly string[];
  /** In the cache but unknown to the log. Discarded — it was never created. */
  readonly orphaned: readonly string[];
  /** Everything the repair touched, all of it quarantined pending review. */
  readonly quarantined: readonly string[];
  readonly ok: boolean;
}

export class MemoryFabric {
  readonly #records = new Map<string, MemoryRecord>();
  readonly #telemetry = new Map<string, MemoryTelemetry>();
  #counter = 0;

  readonly #ledger: EventLedger;
  readonly #promotion: PromotionEngine;
  readonly #now: () => number;
  readonly #store: FileProjectionStore | null;

  constructor(
    ledger: EventLedger,
    promotion: PromotionEngine,
    now: () => number = Date.now,
    store: FileProjectionStore | null = null,
  ) {
    this.#ledger = ledger;
    this.#promotion = promotion;
    this.#now = now;
    this.#store = store;
  }

  createMemory(context: SecurityContext, input: CreateMemoryInput): MemoryRecord {
    requireScope(context, SCOPE_CREATE);
    // Runtime half of the trust boundary. The type system already rejects these
    // fields; this catches anything arriving as `any`, JSON, or over a wire.
    assertNoTrustBearingFields(input, "createMemory input");

    if (input.statement.trim().length === 0) {
      throw new InvalidRequestError("memory statement may not be empty");
    }
    if (input.scope.trim().length === 0) {
      throw new InvalidRequestError("memory scope may not be empty");
    }

    const memoryId = `mem_${++this.#counter}_${sha256Object(input).slice(0, 12)}`;
    const contentHash = sha256Object({ statement: input.statement, scope: input.scope });

    const payload: MemoryCreationPayload = {
      memoryId,
      layer: input.layer,
      statement: input.statement,
      scope: input.scope,
      contentHash,
      createdAt: this.#now(),
      evidenceIds: Object.freeze([...(input.evidenceIds ?? [])]),
      sourceRefs: Object.freeze([...(input.sourceRefs ?? [])]),
      relations: Object.freeze([...(input.relations ?? [])]),
      reportedConfidence: input.reportedConfidence ?? null,
      importance: input.importance ?? null,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    };

    const record: MemoryRecord = {
      ...payload,
      // Section 33: unconditional. There is no argument that changes this.
      storedMaturity: "M0_OBSERVATION",
      status: "active",
    };

    // Ledger first: the log may lead the projection, never trail it.
    this.#ledger.append({ type: "memory.created", memoryId, record: payload });
    this.#records.set(memoryId, record);
    this.#telemetry.set(memoryId, { retrievalCount: 0, lastRetrievedAt: null });
    this.#save();
    return record;
  }

  /**
   * Section 54: importing preserves the claimed history and withholds the trust.
   * Kept deliberately separate from createMemory so a legacy tier can never be
   * reached through the normal creation path.
   */
  importMemory(
    context: SecurityContext,
    input: CreateMemoryInput,
    historicalStoredMaturity: Maturity,
  ): MemoryRecord {
    requireScope(context, SCOPE_IMPORT);
    assertNoTrustBearingFields(input, "importMemory input");
    if (!MATURITY_ORDER.includes(historicalStoredMaturity)) {
      throw new InvalidRequestError(`unknown historical maturity: ${historicalStoredMaturity}`);
    }

    const created = this.createMemory(context, input);
    const record: MemoryRecord = {
      ...created,
      legacyTrustState: "LEGACY_UNVERIFIED",
      historicalStoredMaturity,
    };
    const { storedMaturity: _m, status: _s, ...payload } = created;
    void _m;
    void _s;
    this.#ledger.append({
      type: "memory.imported",
      memoryId: record.memoryId,
      record: payload,
      historicalStoredMaturity,
    });
    this.#records.set(record.memoryId, record);
    this.#save();
    return record;
  }

  promote(context: SecurityContext, request: PromotionRequest): PromotionDecision {
    requireScope(context, SCOPE_PROMOTE);
    const record = this.#require(request.memoryId);
    const current = this.effectiveMaturity(record.memoryId);

    const decision = this.#promotion.evaluate(record, current, request);
    if (decision.disposition !== "PROMOTED") return decision;

    this.#records.set(record.memoryId, { ...record, storedMaturity: request.targetMaturity });
    this.#ledger.append({
      type: "memory.promoted",
      memoryId: record.memoryId,
      from: current,
      to: request.targetMaturity,
      reasons: decision.reasons,
    });

    if (request.targetMaturity === "M5_CONSTITUTIONAL") {
      const approval = request.approvalReceipts?.[0];
      if (approval) {
        this.#ledger.append({
          type: "memory.constitutional_approval",
          memoryId: record.memoryId,
          approvalId: approval.approvalId,
          signerFingerprint: approval.signerFingerprint,
        });
      }
    }
    this.#save();
    return decision;
  }

  demote(context: SecurityContext, memoryId: string, to: Maturity, reason: string): MemoryRecord {
    requireScope(context, SCOPE_LIFECYCLE);
    const record = this.#require(memoryId);
    const from = this.effectiveMaturity(memoryId);
    if (maturityRank(to) >= maturityRank(from)) {
      throw new InvalidRequestError(`demote must lower maturity (${from} -> ${to})`);
    }
    const next: MemoryRecord = { ...record, storedMaturity: to };
    this.#records.set(memoryId, next);
    this.#ledger.append({ type: "memory.demoted", memoryId, from, to, reason });
    this.#save();
    return next;
  }

  transition(
    context: SecurityContext,
    memoryId: string,
    to: MemoryStatus,
    reason: string,
  ): MemoryRecord {
    requireScope(context, SCOPE_LIFECYCLE);
    const record = this.#require(memoryId);
    const from = record.status;

    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new InvalidRequestError(`illegal lifecycle transition ${from} -> ${to}`);
    }
    if ((ROOT_ONLY_TARGETS.has(to) || ROOT_ONLY_SOURCES.has(from)) && !context.isRoot) {
      throw new InvalidRequestError(`transition ${from} -> ${to} requires root authority`);
    }

    const next: MemoryRecord = { ...record, status: to };
    this.#records.set(memoryId, next);
    this.#ledger.append({ type: "memory.status_changed", memoryId, from, to, reason });
    this.#save();
    return next;
  }

  /**
   * Section 46: reading is not evidence. This writes to a telemetry map that has
   * no reference to any maturity field, so the invariant holds structurally
   * rather than by reviewer vigilance.
   */
  recordRetrievalUse(memoryId: string): MemoryTelemetry {
    const current = this.#telemetry.get(memoryId) ?? { retrievalCount: 0, lastRetrievedAt: null };
    const next: MemoryTelemetry = {
      retrievalCount: current.retrievalCount + 1,
      lastRetrievedAt: this.#now(),
    };
    this.#telemetry.set(memoryId, next);
    this.#save();
    return next;
  }

  telemetry(memoryId: string): MemoryTelemetry | undefined {
    return this.#telemetry.get(memoryId);
  }

  /** Canonical maturity: derived from the ledger, never read off the record. */
  effectiveMaturity(memoryId: string): Maturity {
    return replayMemoryState(this.#ledger).get(memoryId)?.effectiveMaturity ?? "M0_OBSERVATION";
  }

  /** Pre-wired inputs for retrieval, so callers cannot supply a stale snapshot. */
  retrievalInputs(): RetrievalInputs {
    return {
      records: () => this.records(),
      effectiveMaturity: (memoryId) => this.effectiveMaturity(memoryId),
      now: this.#now,
    };
  }

  record(memoryId: string): MemoryRecord | undefined {
    return this.#records.get(memoryId);
  }

  /**
   * Returns a snapshot array, not the live map iterator: an iterator is consumed
   * by the first reader, so a second query over the same handle would silently
   * see an empty store.
   */
  records(): readonly MemoryRecord[] {
    return [...this.#records.values()];
  }

  /**
   * Section 53: at startup the ledger is replayed and compared to the projection.
   * The ledger wins.
   *
   * Because creation events carry the full record, a divergent entry is rebuilt
   * from the log rather than patched in place — and a record the log knows about
   * but the cache has lost is restored rather than forgotten. Everything touched
   * is quarantined and reported: a divergence means something wrote state without
   * going through the kernel, and that fact outlives the repair.
   */
  reconcile(): ReconciliationReport {
    this.#ledger.verifyIntegrity();
    const derived = replayMemoryState(this.#ledger);

    const divergent: string[] = [];
    const missing: string[] = [];
    const orphaned: string[] = [];

    for (const [memoryId, record] of this.#records) {
      const truth = derived.get(memoryId);
      if (!truth) {
        // In the cache, unknown to the log: it was never legitimately created.
        orphaned.push(memoryId);
        continue;
      }
      if (canonicalize(truth.record) !== canonicalize(record)) divergent.push(memoryId);
    }
    for (const memoryId of derived.keys()) {
      if (!this.#records.has(memoryId)) missing.push(memoryId);
    }

    const touched = [...divergent, ...missing, ...orphaned];
    if (touched.length === 0) return { divergent: [], missing: [], orphaned: [], quarantined: [], ok: true };

    const quarantined: string[] = [];
    for (const memoryId of [...divergent, ...missing]) {
      const truth = derived.get(memoryId);
      if (!truth) continue;
      this.#records.set(memoryId, { ...truth.record, status: "quarantined" });
      quarantined.push(memoryId);
    }
    for (const memoryId of orphaned) {
      this.#records.delete(memoryId);
      this.#telemetry.delete(memoryId);
    }

    this.#ledger.append({
      type: "reconciliation.divergence",
      memoryIds: touched,
      detail:
        `projection disagreed with ledger replay; ${divergent.length} rebuilt, ` +
        `${missing.length} restored, ${orphaned.length} discarded as unledgered`,
    });
    this.#save();
    return { divergent, missing, orphaned, quarantined, ok: false };
  }

  /** Writes the projection cache, if this fabric was opened with a store. */
  #save(): void {
    this.#store?.write({
      version: 1,
      savedAt: this.#now(),
      counter: this.#counter,
      records: [...this.#records.values()],
      telemetry: [...this.#telemetry.entries()],
    });
  }

  /**
   * Loads a previously saved projection cache. Deliberately does not validate it
   * — `reconcile()` is what decides whether the cache may be believed, and it
   * must be called before the fabric is used.
   */
  loadProjection(): boolean {
    const snapshot = this.#store?.read();
    if (!snapshot) return false;
    this.#records.clear();
    this.#telemetry.clear();
    for (const record of snapshot.records as readonly MemoryRecord[]) {
      this.#records.set(record.memoryId, record);
    }
    for (const [memoryId, telemetry] of snapshot.telemetry as readonly (readonly [
      string,
      MemoryTelemetry,
    ])[]) {
      this.#telemetry.set(memoryId, telemetry);
    }
    this.#counter = snapshot.counter;
    return true;
  }

  /** Test/forensics hook: simulate an out-of-band write to the projection. */
  unsafeOverwriteProjection(memoryId: string, patch: Partial<MemoryRecord>): void {
    const record = this.#require(memoryId);
    this.#records.set(memoryId, { ...record, ...patch });
  }

  #require(memoryId: string): MemoryRecord {
    const record = this.#records.get(memoryId);
    if (!record) throw new InvalidRequestError(`unknown memory: ${memoryId}`);
    return record;
  }
}
