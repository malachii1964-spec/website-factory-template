import { canonicalize } from "../crypto/canonical";
import { sha256Text } from "../crypto/hash";
import { LedgerIntegrityError } from "../trust/errors";
import type { MemoryEvent } from "./events";

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

  constructor(private readonly now: () => number = Date.now) {}

  append(event: MemoryEvent): LedgerEntry {
    const seq = this.#entries.length;
    const prevHash = this.#entries[seq - 1]?.hash ?? GENESIS_HASH;
    const timestamp = this.now();
    const entry: LedgerEntry = {
      seq,
      timestamp,
      event,
      prevHash,
      hash: computeEntryHash(seq, timestamp, event, prevHash),
    };
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

  static restore(entries: readonly LedgerEntry[], now: () => number = Date.now): EventLedger {
    const ledger = new EventLedger(now);
    for (const entry of entries) ledger.#entries.push(entry);
    ledger.verifyIntegrity();
    return ledger;
  }
}
