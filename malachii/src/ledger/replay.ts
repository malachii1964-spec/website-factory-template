import type { Maturity, MemoryRecord, MemoryStatus } from "../memory/types.ts";
import type { EventLedger } from "./ledger.ts";

/**
 * Section 35: stored maturity is a cache. This replay is the canonical answer.
 *
 * Because creation events carry the full immutable record, replay rebuilds
 * complete `MemoryRecord`s rather than only their maturity — so the projection
 * is a genuine cache that can be deleted and reconstructed, and a divergence
 * can be repaired from the log instead of merely reported.
 */

export interface DerivedMemoryState {
  readonly record: MemoryRecord;
  readonly effectiveMaturity: Maturity;
  readonly status: MemoryStatus;
  readonly historicalStoredMaturity: Maturity | null;
  readonly legacy: boolean;
}

export type DerivedState = ReadonlyMap<string, DerivedMemoryState>;

export function replayMemoryState(ledger: EventLedger): DerivedState {
  const state = new Map<string, DerivedMemoryState>();

  const patch = (
    id: string,
    next: { effectiveMaturity?: Maturity; status?: MemoryStatus },
  ): void => {
    const current = state.get(id);
    if (!current) return;
    const effectiveMaturity = next.effectiveMaturity ?? current.effectiveMaturity;
    const status = next.status ?? current.status;
    state.set(id, {
      ...current,
      effectiveMaturity,
      status,
      record: { ...current.record, storedMaturity: effectiveMaturity, status },
    });
  };

  for (const { event } of ledger.entries()) {
    switch (event.type) {
      case "memory.created":
        // Section 33: every normal creation path lands on M0, without exception.
        state.set(event.memoryId, {
          record: { ...event.record, storedMaturity: "M0_OBSERVATION", status: "active" },
          effectiveMaturity: "M0_OBSERVATION",
          status: "active",
          historicalStoredMaturity: null,
          legacy: false,
        });
        break;

      case "memory.imported":
        // History is preserved; trust is withheld until re-earned (section 54).
        state.set(event.memoryId, {
          record: {
            ...event.record,
            storedMaturity: "M0_OBSERVATION",
            status: "active",
            legacyTrustState: "LEGACY_UNVERIFIED",
            historicalStoredMaturity: event.historicalStoredMaturity,
          },
          effectiveMaturity: "M0_OBSERVATION",
          status: "active",
          historicalStoredMaturity: event.historicalStoredMaturity,
          legacy: true,
        });
        break;

      case "memory.promoted":
        patch(event.memoryId, { effectiveMaturity: event.to });
        break;

      case "memory.demoted":
        patch(event.memoryId, { effectiveMaturity: event.to });
        break;

      case "memory.status_changed":
        patch(event.memoryId, { status: event.to });
        break;

      case "memory.constitutional_approval":
      case "reconciliation.divergence":
        break;
    }
  }

  return state;
}
