import type { EventLedger } from "./eventLedger.js";
import type { MemoryMaturity, MemoryRecord, MemoryStatus } from "./memoryTypes.js";

/**
 * Derives canonical memory state by replaying the journal.
 *
 * The state store is a projection. The journal is the record of what actually
 * happened, and it is hash-chained, so it is the thing an attacker cannot edit
 * quietly. Anywhere the two disagree, the journal wins.
 *
 * Because `memory.created` carries the whole record, replay reconstructs full
 * records rather than just their maturity -- so a divergence can be *repaired*
 * from the journal, not merely detected.
 */

export interface DerivedMemoryState {
  record: MemoryRecord;
  maturity: MemoryMaturity;
  status: MemoryStatus;
}

export type DerivedState = ReadonlyMap<string, DerivedMemoryState>;

function payloadOf(event: { payload: unknown }): Record<string, unknown> | null {
  return typeof event.payload === "object" && event.payload !== null
    ? (event.payload as Record<string, unknown>)
    : null;
}

export function replayMemoryState(ledger: EventLedger): DerivedState {
  const state = new Map<string, DerivedMemoryState>();

  const patch = (id: string, next: Partial<Pick<DerivedMemoryState, "maturity" | "status">>): void => {
    const current = state.get(id);
    if (!current) return;
    const maturity = next.maturity ?? current.maturity;
    const status = next.status ?? current.status;
    state.set(id, { maturity, status, record: { ...current.record, maturity, status } });
  };

  for (const event of ledger.snapshot()) {
    const p = payloadOf(event);
    if (!p) continue;

    switch (event.type) {
      case "memory.created": {
        const record = p["record"] as MemoryRecord | undefined;
        if (!record?.id) break;
        // SUAF §2.2: creation always lands at M0, whatever the record claims.
        state.set(record.id, {
          record: { ...record, maturity: "M0_OBSERVATION" },
          maturity: "M0_OBSERVATION",
          status: record.status,
        });
        break;
      }
      case "memory.promoted": {
        const id = p["id"] as string | undefined;
        const to = p["to"] as MemoryMaturity | undefined;
        if (id && to) patch(id, { maturity: to });
        break;
      }
      case "memory.superseded": {
        const oldId = p["oldId"] as string | undefined;
        if (oldId) patch(oldId, { status: "superseded" });
        break;
      }
      default:
        break;
    }
  }

  return state;
}

export interface ReconciliationReport {
  /** Present in both, but the projection disagreed. Rebuilt from the journal. */
  divergent: string[];
  /** In the journal, missing from the projection. Restored. */
  missing: string[];
  /** In the projection, unknown to the journal. Discarded -- never legitimately created. */
  orphaned: string[];
  /** Everything the repair touched, all of it quarantined pending review. */
  quarantined: string[];
  ok: boolean;
}

/** Fields whose divergence indicates tampering rather than ordinary drift. */
export function authorityFieldsOf(record: MemoryRecord): string {
  return JSON.stringify({
    maturity: record.maturity,
    status: record.status,
    statement: record.statement,
    scope: [...record.scope].sort(),
    layer: record.layer,
    evidenceIds: [...record.evidenceIds].sort(),
    sourceGroups: [...(record.provenance?.sourceRefs ?? []).map(r => r.sourceGroup)].sort(),
  });
}
