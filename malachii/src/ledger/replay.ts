import type { Maturity, MemoryStatus } from "../memory/types";
import type { EventLedger } from "./ledger";

/**
 * Section 35: stored maturity is a cache. This replay is the canonical answer.
 * If the two disagree at startup, the ledger wins and the projection is
 * quarantined (section 53).
 */

export interface DerivedMemoryState {
  readonly effectiveMaturity: Maturity;
  readonly status: MemoryStatus;
  readonly historicalStoredMaturity: Maturity | null;
  readonly legacy: boolean;
}

export type DerivedState = ReadonlyMap<string, DerivedMemoryState>;

export function replayMemoryState(ledger: EventLedger): DerivedState {
  const state = new Map<string, DerivedMemoryState>();

  const patch = (id: string, next: Partial<DerivedMemoryState>): void => {
    const current = state.get(id);
    if (!current) return;
    state.set(id, { ...current, ...next });
  };

  for (const { event } of ledger.entries()) {
    switch (event.type) {
      case "memory.created":
        // Section 33: every normal creation path lands on M0, without exception.
        state.set(event.memoryId, {
          effectiveMaturity: "M0_OBSERVATION",
          status: "active",
          historicalStoredMaturity: null,
          legacy: false,
        });
        break;

      case "memory.imported":
        // History is preserved; trust is withheld until re-earned (section 54).
        state.set(event.memoryId, {
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
