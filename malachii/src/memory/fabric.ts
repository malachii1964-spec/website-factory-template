import { sha256Object } from "../crypto/hash";
import { EventLedger } from "../ledger/ledger";
import { replayMemoryState } from "../ledger/replay";
import { requireScope, type SecurityContext } from "../trust/authority";
import { InvalidRequestError } from "../trust/errors";
import { assertNoTrustBearingFields } from "../trust/forbiddenFields";
import type { RetrievalInputs } from "../retrieval/retrieval";
import type { PromotionDecision, PromotionEngine, PromotionRequest } from "./promotionEngine";
import {
  MATURITY_ORDER,
  maturityRank,
  type CreateMemoryInput,
  type Maturity,
  type MemoryRecord,
  type MemoryStatus,
  type MemoryTelemetry,
} from "./types";

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
  readonly divergent: readonly string[];
  readonly quarantined: readonly string[];
  readonly ok: boolean;
}

export class MemoryFabric {
  readonly #records = new Map<string, MemoryRecord>();
  readonly #telemetry = new Map<string, MemoryTelemetry>();
  #counter = 0;

  constructor(
    private readonly ledger: EventLedger,
    private readonly promotion: PromotionEngine,
    private readonly now: () => number = Date.now,
  ) {}

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

    const record: MemoryRecord = {
      memoryId,
      layer: input.layer,
      statement: input.statement,
      scope: input.scope,
      contentHash,
      createdAt: this.now(),
      evidenceIds: Object.freeze([...(input.evidenceIds ?? [])]),
      sourceRefs: Object.freeze([...(input.sourceRefs ?? [])]),
      relations: Object.freeze([...(input.relations ?? [])]),
      reportedConfidence: input.reportedConfidence ?? null,
      importance: input.importance ?? null,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      // Section 33: unconditional. There is no argument that changes this.
      storedMaturity: "M0_OBSERVATION",
      status: "active",
    };

    this.#records.set(memoryId, record);
    this.#telemetry.set(memoryId, { retrievalCount: 0, lastRetrievedAt: null });
    this.ledger.append({
      type: "memory.created",
      memoryId,
      contentHash,
      scope: record.scope,
      layer: record.layer,
    });
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
    this.#records.set(record.memoryId, record);
    this.ledger.append({
      type: "memory.imported",
      memoryId: record.memoryId,
      contentHash: record.contentHash,
      scope: record.scope,
      layer: record.layer,
      historicalStoredMaturity,
    });
    return record;
  }

  promote(context: SecurityContext, request: PromotionRequest): PromotionDecision {
    requireScope(context, SCOPE_PROMOTE);
    const record = this.#require(request.memoryId);
    const current = this.effectiveMaturity(record.memoryId);

    const decision = this.promotion.evaluate(record, current, request);
    if (decision.disposition !== "PROMOTED") return decision;

    this.#records.set(record.memoryId, { ...record, storedMaturity: request.targetMaturity });
    this.ledger.append({
      type: "memory.promoted",
      memoryId: record.memoryId,
      from: current,
      to: request.targetMaturity,
      reasons: decision.reasons,
    });

    if (request.targetMaturity === "M5_CONSTITUTIONAL") {
      const approval = request.approvalReceipts?.[0];
      if (approval) {
        this.ledger.append({
          type: "memory.constitutional_approval",
          memoryId: record.memoryId,
          approvalId: approval.approvalId,
          signerFingerprint: approval.signerFingerprint,
        });
      }
    }
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
    this.ledger.append({ type: "memory.demoted", memoryId, from, to, reason });
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
    this.ledger.append({ type: "memory.status_changed", memoryId, from, to, reason });
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
      lastRetrievedAt: this.now(),
    };
    this.#telemetry.set(memoryId, next);
    return next;
  }

  telemetry(memoryId: string): MemoryTelemetry | undefined {
    return this.#telemetry.get(memoryId);
  }

  /** Canonical maturity: derived from the ledger, never read off the record. */
  effectiveMaturity(memoryId: string): Maturity {
    return replayMemoryState(this.ledger).get(memoryId)?.effectiveMaturity ?? "M0_OBSERVATION";
  }

  /** Pre-wired inputs for retrieval, so callers cannot supply a stale snapshot. */
  retrievalInputs(): RetrievalInputs {
    return {
      records: () => this.records(),
      effectiveMaturity: (memoryId) => this.effectiveMaturity(memoryId),
      now: this.now,
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
   * The ledger wins; anything that disagreed is quarantined and reported rather
   * than silently corrected, because a divergence means something wrote state
   * without going through the kernel.
   */
  reconcile(): ReconciliationReport {
    this.ledger.verifyIntegrity();
    const derived = replayMemoryState(this.ledger);
    const divergent: string[] = [];

    for (const [memoryId, record] of this.#records) {
      const truth = derived.get(memoryId);
      if (!truth) {
        divergent.push(memoryId);
        continue;
      }
      if (
        truth.effectiveMaturity !== record.storedMaturity ||
        truth.status !== record.status
      ) {
        divergent.push(memoryId);
      }
    }

    if (divergent.length === 0) return { divergent: [], quarantined: [], ok: true };

    const quarantined: string[] = [];
    for (const memoryId of divergent) {
      const record = this.#records.get(memoryId);
      if (!record) continue;
      const truth = derived.get(memoryId);
      this.#records.set(memoryId, {
        ...record,
        storedMaturity: truth?.effectiveMaturity ?? "M0_OBSERVATION",
        status: "quarantined",
      });
      quarantined.push(memoryId);
    }

    this.ledger.append({
      type: "reconciliation.divergence",
      memoryIds: divergent,
      detail: "projection disagreed with ledger replay; ledger state applied and record quarantined",
    });
    return { divergent, quarantined, ok: false };
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
