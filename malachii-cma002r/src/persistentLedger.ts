import { existsSync, readFileSync, appendFileSync, mkdirSync, truncateSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { EventLedger, type LedgerEvent } from "./eventLedger.js";

export interface JournalLoad {
  events: LedgerEvent[];
  /**
   * True when the final line was a partial write -- the ordinary signature of a
   * crash mid-append. The record is dropped (it was never acknowledged) and the
   * file is truncated to the last complete line.
   */
  truncatedTail: boolean;
}

/**
 * Reads a JSONL journal, tolerating a torn final record but not corruption.
 *
 * The distinction matters. A half-written last line is a crash and is
 * recoverable. A malformed line anywhere earlier is tampering or disk damage,
 * and must stop the process rather than be skipped -- skipping it would leave a
 * sequence gap that surfaces later as a confusing chain error instead of the
 * truth.
 */
export function readJournal(path: string): JournalLoad {
  if (!existsSync(path)) return { events: [], truncatedTail: false };
  const raw = readFileSync(path, "utf8");
  if (!raw) return { events: [], truncatedTail: false };

  const lines = raw.split(/\r?\n/);
  const trailing = lines.pop();
  const truncatedTail = trailing !== undefined && trailing !== "";

  const events: LedgerEvent[] = [];
  lines.forEach((line, index) => {
    if (!line) return;
    try {
      events.push(JSON.parse(line) as LedgerEvent);
    } catch {
      throw new Error(`persistent_ledger_unparseable_record_at_line_${index + 1}`);
    }
  });
  return { events, truncatedTail };
}

/**
 * Durable append-only journal around EventLedger. The hash chain remains the
 * integrity mechanism; the JSONL journal provides restart durability.
 */
export class PersistentEventLedger extends EventLedger {
  readonly journalPath: string;
  /** Whether this instance recovered a torn record when it opened. */
  readonly recoveredTornTail: boolean;

  constructor(journalPath: string) {
    const path = resolve(journalPath);
    const load = readJournal(path);
    super(load.events);
    if (!this.verify()) throw new Error("persistent_ledger_integrity_failure");

    mkdirSync(dirname(path), { recursive: true });
    // Physically remove the torn bytes. Leaving them in place would put the next
    // append behind a partial record and turn a recoverable crash into a
    // permanently unreadable journal.
    if (load.truncatedTail) {
      const raw = readFileSync(path, "utf8");
      const lastNewline = raw.lastIndexOf("\n");
      truncateSync(path, lastNewline === -1 ? 0 : Buffer.byteLength(raw.slice(0, lastNewline + 1), "utf8"));
    }
    this.journalPath = path;
    this.recoveredTornTail = load.truncatedTail;
  }

  override append(type: string, payload: unknown, now = new Date()): LedgerEvent {
    const event = super.append(type, payload, now);
    appendFileSync(this.journalPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
    return event;
  }
}
