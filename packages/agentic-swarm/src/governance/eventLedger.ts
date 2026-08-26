// Minimal port of MALACHII's hash-chained event ledger (Kernel v3.3-RC1 §12).
// Every swarm node appends here instead of just logging — the ledger is the audit trail
// a human reviews at the HITL checkpoint, not console output.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface LedgerEvent {
  id: string;
  sequence: number;
  type: string;
  timestamp: string;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export interface SignedCheckpoint {
  sequence: number;
  rootHash: string;
  signature: string;
  algorithm: "HMAC-SHA256";
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(",")}}`;
}

function calc(input: Omit<LedgerEvent, "hash">): string {
  return createHash("sha256").update(canonical(input)).digest("hex");
}

export class EventLedger {
  private events: LedgerEvent[] = [];

  append(type: string, payload: unknown, now = new Date()): LedgerEvent {
    const sequence = this.events.length;
    const prevHash = sequence === 0 ? "GENESIS" : this.events[sequence - 1]!.hash;
    const base = { id: `evt_${sequence}_${now.getTime()}`, sequence, type, timestamp: now.toISOString(), payload, prevHash };
    const event = { ...base, hash: calc(base) };
    this.events.push(event);
    return event;
  }

  snapshot(): readonly LedgerEvent[] {
    return this.events.map((e) => ({ ...e }));
  }

  verify(events: readonly LedgerEvent[] = this.events): boolean {
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      const expectedPrev = i === 0 ? "GENESIS" : events[i - 1]!.hash;
      if (e.sequence !== i || e.prevHash !== expectedPrev) return false;
      const { hash, ...base } = e;
      if (calc(base) !== hash) return false;
    }
    return true;
  }

  rootHash(): string {
    return this.events.length ? this.events[this.events.length - 1]!.hash : "GENESIS";
  }
}

export function signCheckpoint(sequence: number, rootHash: string, secret: string): SignedCheckpoint {
  const signature = createHmac("sha256", secret).update(`${sequence}:${rootHash}`).digest("hex");
  return { sequence, rootHash, signature, algorithm: "HMAC-SHA256" };
}

export function verifyCheckpoint(c: SignedCheckpoint, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(`${c.sequence}:${c.rootHash}`).digest("hex");
  return expected.length === c.signature.length && timingSafeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(c.signature));
}
