import { canonicalize } from "../crypto/canonical.ts";
import { sha256Text } from "../crypto/hash.ts";
import { LedgerIntegrityError } from "../trust/errors.ts";
import type { MemoryEvent } from "./events.ts";

/**
 * Append-only hash-chained event log. This is the one component the audit was
 * right to call an invariant worth preserving: every derived answer in the
 * kernel is reproducible from this log, and any edit to history breaks the chain.
 */

export interface LedgerEntry {
  readonly seq: number;
  readonly timestamp: number;
  readonly event: MemoryEvent;
  readonly prevHash: string;
  readonly hash: string;
}

export const GENESIS_HASH = "0".repeat(64);

/**
 * Durable write hook. The ledger stays pure — it knows how to chain and verify,
 * not where bytes live — so a persistent store plugs in without the hashing
 * logic ever learning about files.
 */
export type LedgerSink = (entry: LedgerEntry) => void;

export function computeEntryHash(
  seq: number,
  timestamp: number,
  event: MemoryEvent,
  prevHash: string,
): string {
  return sha256Text(canonicalize({ seq, timestamp, event, prevHash }));
}

export class EventLedger {
  readonly #entries: LedgerEntry[] = [];

  readonly #now: () => number;
  readonly #sink: LedgerSink | null;

  constructor(now: () => number = Date.now, sink: LedgerSink | null = null) {
    this.#now = now;
    this.#sink = sink;
  }

  append(event: MemoryEvent): LedgerEntry {
    const seq = this.#entries.length;
    const prevHash = this.#entries[seq - 1]?.hash ?? GENESIS_HASH;
    const timestamp = this.#now();
    const entry: LedgerEntry = {
      seq,
      timestamp,
      event,
      prevHash,
      hash: computeEntryHash(seq, timestamp, event, prevHash),
    };
    // Persist before the entry is visible in memory: a crash between the two
    // must leave the log ahead of the projection, never behind it.
    this.#sink?.(entry);
    this.#entries.push(entry);
    return entry;
  }

  entries(): readonly LedgerEntry[] {
    return this.#entries;
  }

  /** Rehashes the whole chain. Called at startup before anything trusts state. */
  verifyIntegrity(): void {
    let prevHash = GENESIS_HASH;
    this.#entries.forEach((entry, index) => {
      if (entry.seq !== index) {
        throw new LedgerIntegrityError(`sequence gap at index ${index}`);
      }
      if (entry.prevHash !== prevHash) {
        throw new LedgerIntegrityError(`broken chain link at seq ${entry.seq}`);
      }
      const expected = computeEntryHash(entry.seq, entry.timestamp, entry.event, entry.prevHash);
      if (entry.hash !== expected) {
        throw new LedgerIntegrityError(`tampered entry at seq ${entry.seq}`);
      }
      prevHash = entry.hash;
    });
  }

  /** Serialisation for a persistent ledger; restore is the inverse. */
  export(): readonly LedgerEntry[] {
    return this.#entries.map((entry) => ({ ...entry }));
  }

  static restore(
    entries: readonly LedgerEntry[],
    now: () => number = Date.now,
    sink: LedgerSink | null = null,
  ): EventLedger {
    const ledger = new EventLedger(now, sink);
    for (const entry of entries) ledger.#entries.push(entry);
    ledger.verifyIntegrity();
    return ledger;
  }
}
