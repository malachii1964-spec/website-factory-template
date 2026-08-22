import type { KeyObject } from "node:crypto";
import { EventLedger } from "./ledger/ledger.ts";
import {
  openStores,
  type FileEventLedgerStore,
  type FileProjectionStore,
} from "./ledger/persistence.ts";
import { EvidenceResolver, EvidenceStore, SourceRegistry } from "./memory/evidence.ts";
import { MemoryFabric, type ReconciliationReport } from "./memory/fabric.ts";
import { PromotionEngine } from "./memory/promotionEngine.ts";
import {
  ApprovalVerifier,
  NonceLedger,
  OutcomeVerifier,
  WorkerKeyRegistry,
} from "./memory/receipts.ts";
import { defineConstitution, type Constitution } from "./trust/constitution.ts";

/**
 * Section 53's startup sequence, as one callable thing:
 *
 *   load ledger -> verify hash chain -> replay -> compare projection
 *     -> match: continue
 *     -> mismatch: rebuild from the log, quarantine, record an incident
 *
 * `startup()` must be called before the fabric is used. It is separate from
 * construction on purpose: booting a kernel and deciding whether its cached
 * state may be believed are different questions, and conflating them is how a
 * poisoned projection gets silently trusted.
 */

export interface KernelOptions {
  readonly directory: string;
  readonly rootPublicKeys: readonly KeyObject[];
  readonly workerPublicKeys?: readonly KeyObject[];
  readonly now?: () => number;
  readonly corroborationThreshold?: number;
}

export interface StartupReport {
  readonly reconciliation: ReconciliationReport;
  /** A half-written final ledger record was dropped — i.e. the last run crashed. */
  readonly truncatedTail: boolean;
  readonly ledgerEntries: number;
  readonly projectionLoaded: boolean;
}

export interface Kernel {
  readonly constitution: Constitution;
  readonly ledger: EventLedger;
  readonly fabric: MemoryFabric;
  readonly evidence: EvidenceStore;
  readonly sources: SourceRegistry;
  readonly resolver: EvidenceResolver;
  readonly workers: WorkerKeyRegistry;
  readonly nonces: NonceLedger;
  readonly ledgerStore: FileEventLedgerStore;
  readonly projectionStore: FileProjectionStore;
  startup(): StartupReport;
  close(): void;
}

export function openPersistentKernel(options: KernelOptions): Kernel {
  const now = options.now ?? Date.now;
  const { ledgerStore, projectionStore } = openStores(options.directory);

  const constitution = defineConstitution({
    rootPublicKeys: options.rootPublicKeys,
    ...(options.corroborationThreshold === undefined
      ? {}
      : { corroborationThreshold: options.corroborationThreshold }),
  });

  const workers = new WorkerKeyRegistry();
  for (const key of options.workerPublicKeys ?? []) workers.register(key);

  const nonces = new NonceLedger();
  const evidence = new EvidenceStore();
  const sources = new SourceRegistry();
  const resolver = new EvidenceResolver(evidence, sources);

  const engine = new PromotionEngine(
    constitution,
    resolver,
    new ApprovalVerifier(constitution, nonces, now),
    new OutcomeVerifier(workers),
  );

  // Restoring the ledger verifies the whole hash chain before anything reads it.
  const { ledger, load } = ledgerStore.open(now);
  const fabric = new MemoryFabric(ledger, engine, now, projectionStore);

  return {
    constitution,
    ledger,
    fabric,
    evidence,
    sources,
    resolver,
    workers,
    nonces,
    ledgerStore,
    projectionStore,
    startup(): StartupReport {
      const projectionLoaded = fabric.loadProjection();
      return {
        reconciliation: fabric.reconcile(),
        truncatedTail: load.truncatedTail,
        ledgerEntries: ledger.entries().length,
        projectionLoaded,
      };
    },
    close(): void {
      ledgerStore.close();
    },
  };
}
