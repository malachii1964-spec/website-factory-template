import type { Maturity, MemoryStatus } from "../memory/types";

export type MemoryEvent =
  | { readonly type: "memory.created"; readonly memoryId: string; readonly contentHash: string; readonly scope: string; readonly layer: string }
  | { readonly type: "memory.imported"; readonly memoryId: string; readonly contentHash: string; readonly scope: string; readonly layer: string; readonly historicalStoredMaturity: Maturity }
  | { readonly type: "memory.promoted"; readonly memoryId: string; readonly from: Maturity; readonly to: Maturity; readonly reasons: readonly string[] }
  | { readonly type: "memory.demoted"; readonly memoryId: string; readonly from: Maturity; readonly to: Maturity; readonly reason: string }
  | { readonly type: "memory.status_changed"; readonly memoryId: string; readonly from: MemoryStatus; readonly to: MemoryStatus; readonly reason: string }
  | { readonly type: "memory.constitutional_approval"; readonly memoryId: string; readonly approvalId: string; readonly signerFingerprint: string }
  | { readonly type: "reconciliation.divergence"; readonly memoryIds: readonly string[]; readonly detail: string };

export type MemoryEventType = MemoryEvent["type"];
