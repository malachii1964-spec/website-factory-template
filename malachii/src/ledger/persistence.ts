import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  truncateSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { canonicalize } from "../crypto/canonical.ts";
import { LedgerIntegrityError } from "../trust/errors.ts";
import { EventLedger, type LedgerEntry, type LedgerSink } from "./ledger.ts";

/**
 * Section 52: production requires a persistent ledger. The volatile one is for
 * tests.
 *
 * The log is append-only JSON Lines, fsync'd per entry. Nothing rewrites a line
 * that has been written — compaction, if it is ever needed, has to be a new file
 * plus a migration event, never an edit in place.
 */

export interface LedgerLoad {
  readonly entries: readonly LedgerEntry[];
  /**
   * True when the final line was a partial write — the normal signature of a
   * crash mid-append. The record is dropped (it was never acknowledged) and the
   * caller is told, because silently trimming a log is how audit trails rot.
   */
  readonly truncatedTail: boolean;
  /** Byte length of the complete, newline-terminated prefix of the log. */
  readonly completeBytes: number;
}

export class FileEventLedgerStore {
  readonly #path: string;
  #fd: number | null = null;

  constructor(path: string) {
    this.#path = path;
    mkdirSync(dirname(path), { recursive: true });
  }

  get path(): string {
    return this.#path;
  }

  /** Durable append. Returns only once the bytes are on disk. */
  sink: LedgerSink = (entry: LedgerEntry): void => {
    if (this.#fd === null) this.#fd = openSync(this.#path, "a");
    writeSync(this.#fd, `${canonicalize(entry)}\n`);
    fsyncSync(this.#fd);
  };

  close(): void {
    if (this.#fd !== null) {
      closeSync(this.#fd);
      this.#fd = null;
    }
  }

  load(): LedgerLoad {
    if (!existsSync(this.#path)) return { entries: [], truncatedTail: false, completeBytes: 0 };
    const raw = readFileSync(this.#path, "utf8");
    if (raw.length === 0) return { entries: [], truncatedTail: false, completeBytes: 0 };

    const lines = raw.split("\n");
    const trailing = lines.pop();
    // A well-formed log ends with a newline, so the split leaves "" last.
    // Anything else is a half-written record from a crash.
    const truncatedTail = trailing !== "" && trailing !== undefined;

    const entries: LedgerEntry[] = [];
    lines.forEach((line, index) => {
      if (line.length === 0) return;
      try {
        entries.push(JSON.parse(line) as LedgerEntry);
      } catch {
        // A complete line that will not parse is corruption, not a torn tail.
        throw new LedgerIntegrityError(`unparseable ledger record at line ${index + 1}`);
      }
    });

    const lastNewline = raw.lastIndexOf("\n");
    const completeBytes =
      lastNewline === -1 ? 0 : Buffer.byteLength(raw.slice(0, lastNewline + 1), "utf8");

    return { entries, truncatedTail, completeBytes };
  }

  /**
   * Loads, verifies the hash chain, and returns a ledger wired to keep writing.
   *
   * A torn final record is physically removed here, not just skipped: leaving
   * the partial bytes in place would put the next append behind them and turn a
   * recoverable crash into a permanently unparseable log.
   */
  open(now: () => number = Date.now): { ledger: EventLedger; load: LedgerLoad } {
    const load = this.load();
    if (load.truncatedTail) {
      this.close();
      truncateSync(this.#path, load.completeBytes);
    }
    const ledger = EventLedger.restore(load.entries, now, this.sink);
    return { ledger, load };
  }
}

export interface ProjectionSnapshot {
  readonly version: 1;
  readonly savedAt: number;
  readonly counter: number;
  readonly records: readonly unknown[];
  readonly telemetry: readonly (readonly [string, unknown])[];
}

/**
 * The projection is a cache, so it is written whole via a temp file and rename.
 * A half-written cache is indistinguishable from a tampered one, and both must
 * lose to the ledger — the atomic swap keeps that comparison meaningful.
 */
export class FileProjectionStore {
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
    mkdirSync(dirname(path), { recursive: true });
  }

  get path(): string {
    return this.#path;
  }

  read(): ProjectionSnapshot | null {
    if (!existsSync(this.#path)) return null;
    const raw = readFileSync(this.#path, "utf8");
    if (raw.trim().length === 0) return null;
    try {
      return JSON.parse(raw) as ProjectionSnapshot;
    } catch {
      // Unreadable cache is not fatal: the ledger can rebuild it.
      return null;
    }
  }

  write(snapshot: ProjectionSnapshot): void {
    const temp = `${this.#path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    const fd = openSync(temp, "r+");
    fsyncSync(fd);
    closeSync(fd);
    renameSync(temp, this.#path);
  }
}

/** Convenience: the pair of files a persisted kernel keeps in one directory. */
export function openStores(directory: string): {
  ledgerStore: FileEventLedgerStore;
  projectionStore: FileProjectionStore;
} {
  return {
    ledgerStore: new FileEventLedgerStore(join(directory, "ledger.jsonl")),
    projectionStore: new FileProjectionStore(join(directory, "projection.json")),
  };
}
