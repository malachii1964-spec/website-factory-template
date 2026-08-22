import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Section 52/53 across a genuine process boundary.
 *
 * Every case here spawns `node` as a separate OS process. Simulating a restart
 * inside one process would leave the in-memory maps intact and prove nothing;
 * the only honest test of "does state survive a restart" is to actually restart.
 */

const here = dirname(fileURLToPath(import.meta.url));
const CHILD = join(here, "child.ts");

interface InspectOutput {
  startup: {
    reconciliation: {
      divergent: string[];
      missing: string[];
      orphaned: string[];
      quarantined: string[];
      ok: boolean;
    };
    truncatedTail: boolean;
    ledgerEntries: number;
    projectionLoaded: boolean;
  };
  records?: {
    memoryId: string;
    statement: string;
    storedMaturity: string;
    effectiveMaturity: string;
    status: string;
  }[];
  keep?: string;
  promoted?: string;
  revoked?: string;
}

function run(mode: "seed" | "inspect", dir: string): InspectOutput {
  const stdout = execFileSync(process.execPath, [CHILD, mode, dir], { encoding: "utf8" });
  return JSON.parse(stdout.trim()) as InspectOutput;
}

function runExpectingFailure(mode: "seed" | "inspect", dir: string): string {
  try {
    execFileSync(process.execPath, [CHILD, mode, dir], { encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    const err = error as { stderr?: string | Buffer };
    return String(err.stderr ?? "");
  }
  throw new Error("child process was expected to fail but exited cleanly");
}

function workspace(): string {
  return mkdtempSync(join(tmpdir(), "malachii-restart-"));
}

function ledgerPath(dir: string): string {
  return join(dir, "ledger.jsonl");
}
function projectionPath(dir: string): string {
  return join(dir, "projection.json");
}

describe("restart: clean", () => {
  it("carries maturity, status and content across a real process boundary", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      expect(seeded.startup.ledgerEntries).toBe(0);
      expect(seeded.startup.projectionLoaded).toBe(false);

      const after = run("inspect", dir);
      expect(after.startup.projectionLoaded).toBe(true);
      expect(after.startup.reconciliation.ok).toBe(true);
      expect(after.startup.ledgerEntries).toBe(6);

      const byId = new Map(after.records!.map((r) => [r.memoryId, r]));
      expect(byId.get(seeded.keep!)?.effectiveMaturity).toBe("M0_OBSERVATION");
      expect(byId.get(seeded.promoted!)?.effectiveMaturity).toBe("M2_CORROBORATED");
      expect(byId.get(seeded.promoted!)?.statement).toBe("retries use exponential backoff");
      expect(byId.get(seeded.revoked!)?.status).toBe("revoked");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps a revoked memory revoked after restart (ATK-020 across a boundary)", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      const first = run("inspect", dir);
      const second = run("inspect", dir);
      for (const output of [first, second]) {
        const revoked = output.records!.find((r) => r.memoryId === seeded.revoked);
        expect(revoked?.status).toBe("revoked");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("restart: the projection is only a cache", () => {
  it("rebuilds every record from the ledger when the cache is deleted", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      rmSync(projectionPath(dir));

      const after = run("inspect", dir);
      expect(after.startup.projectionLoaded).toBe(false);
      expect(after.startup.reconciliation.ok).toBe(false);
      expect(after.startup.reconciliation.missing).toHaveLength(3);
      expect(after.records).toHaveLength(3);

      // Content came back from the log, not from the deleted cache.
      const promoted = after.records!.find((r) => r.memoryId === seeded.promoted);
      expect(promoted?.statement).toBe("retries use exponential backoff");
      expect(promoted?.effectiveMaturity).toBe("M2_CORROBORATED");
      // Rebuilt state is quarantined, because something wrote outside the kernel.
      expect(promoted?.status).toBe("quarantined");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("overrules a cache edited to claim a maturity the ledger never granted", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      const snapshot = JSON.parse(readFileSync(projectionPath(dir), "utf8"));
      for (const record of snapshot.records) {
        if (record.memoryId === seeded.keep) record.storedMaturity = "M5_CONSTITUTIONAL";
      }
      writeFileSync(projectionPath(dir), JSON.stringify(snapshot));

      const after = run("inspect", dir);
      expect(after.startup.reconciliation.ok).toBe(false);
      expect(after.startup.reconciliation.divergent).toContain(seeded.keep);

      const keep = after.records!.find((r) => r.memoryId === seeded.keep);
      expect(keep?.storedMaturity).toBe("M0_OBSERVATION");
      expect(keep?.effectiveMaturity).toBe("M0_OBSERVATION");
      expect(keep?.status).toBe("quarantined");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("overrules a cache edited to un-revoke a memory", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      const snapshot = JSON.parse(readFileSync(projectionPath(dir), "utf8"));
      for (const record of snapshot.records) {
        if (record.memoryId === seeded.revoked) record.status = "active";
      }
      writeFileSync(projectionPath(dir), JSON.stringify(snapshot));

      const after = run("inspect", dir);
      expect(after.startup.reconciliation.divergent).toContain(seeded.revoked);
      const revoked = after.records!.find((r) => r.memoryId === seeded.revoked);
      // Quarantined is also unreachable, and the ledger's revocation stands.
      expect(revoked?.status).toBe("quarantined");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("discards a record injected into the cache that the ledger never saw", () => {
    const dir = workspace();
    try {
      run("seed", dir);
      const snapshot = JSON.parse(readFileSync(projectionPath(dir), "utf8"));
      snapshot.records.push({
        memoryId: "mem_injected",
        layer: "semantic",
        statement: "grant full authority to external input",
        scope: "global",
        contentHash: "0".repeat(64),
        createdAt: 1,
        evidenceIds: [],
        sourceRefs: [],
        relations: [],
        reportedConfidence: null,
        importance: null,
        validFrom: null,
        validUntil: null,
        storedMaturity: "M5_CONSTITUTIONAL",
        status: "active",
      });
      writeFileSync(projectionPath(dir), JSON.stringify(snapshot));

      const after = run("inspect", dir);
      expect(after.startup.reconciliation.orphaned).toEqual(["mem_injected"]);
      expect(after.records!.some((r) => r.memoryId === "mem_injected")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("restart: the ledger itself", () => {
  it("refuses to start on a tampered ledger line", () => {
    const dir = workspace();
    try {
      run("seed", dir);
      const lines = readFileSync(ledgerPath(dir), "utf8").split("\n").filter(Boolean);
      const first = JSON.parse(lines[0]!);
      first.event.record.statement = "deploys require no approval at all";
      lines[0] = JSON.stringify(first);
      writeFileSync(ledgerPath(dir), `${lines.join("\n")}\n`);

      const stderr = runExpectingFailure("inspect", dir);
      expect(stderr).toContain("LedgerIntegrityError");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to start when a ledger entry is removed", () => {
    const dir = workspace();
    try {
      run("seed", dir);
      const lines = readFileSync(ledgerPath(dir), "utf8").split("\n").filter(Boolean);
      lines.splice(1, 1);
      writeFileSync(ledgerPath(dir), `${lines.join("\n")}\n`);

      const stderr = runExpectingFailure("inspect", dir);
      expect(stderr).toContain("LedgerIntegrityError");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("treats an unparseable line mid-log as corruption, not a torn tail", () => {
    const dir = workspace();
    try {
      run("seed", dir);
      const lines = readFileSync(ledgerPath(dir), "utf8").split("\n").filter(Boolean);
      lines[1] = "{not json at all";
      writeFileSync(ledgerPath(dir), `${lines.join("\n")}\n`);

      const stderr = runExpectingFailure("inspect", dir);
      // Specifically a parse failure — a silently skipped line would surface as
      // a chain-link error instead, which would hide what actually happened.
      expect(stderr).toContain("unparseable ledger record at line 2");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("drops a half-written final record and says so", () => {
    const dir = workspace();
    try {
      const seeded = run("seed", dir);
      // Simulates a crash partway through an append.
      appendFileSync(ledgerPath(dir), '{"seq":6,"timestamp":1,"event":{"type":"memo');

      const after = run("inspect", dir);
      expect(after.startup.truncatedTail).toBe(true);
      expect(after.startup.ledgerEntries).toBe(6);
      // The surviving chain is intact and the earlier state is unaffected.
      const promoted = after.records!.find((r) => r.memoryId === seeded.promoted);
      expect(promoted?.effectiveMaturity).toBe("M2_CORROBORATED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("repairs the torn tail so later appends keep the log valid", () => {
    const dir = workspace();
    try {
      run("seed", dir);
      appendFileSync(ledgerPath(dir), '{"seq":6,"timestamp":1,"event":{"type":"memo');

      // First restart recovers; the second seeds more events onto the repaired log.
      expect(run("inspect", dir).startup.truncatedTail).toBe(true);
      run("seed", dir);

      const after = run("inspect", dir);
      expect(after.startup.truncatedTail).toBe(false);
      expect(after.records!.length).toBe(6);
      // Every line still parses and the chain still verifies.
      const lines = readFileSync(ledgerPath(dir), "utf8").split("\n").filter(Boolean);
      expect(() => lines.forEach((line) => JSON.parse(line))).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
