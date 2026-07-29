import { z } from "zod";
import { all as sqlAll, rowToMemory, type MemoryRow } from "../core/db.ts";
import type { Memory } from "../core/types.ts";
import { cosine, fromBlob } from "./embed.ts";
import type { MemoryStore } from "./store.ts";
import { hasClaude, structured } from "../llm/claude.ts";

/**
 * Consolidation — the brain's sleep cycle.
 *
 * Written memory accumulates duplicates, stale detail, and beliefs that stopped
 * being true. Left alone it degrades: recall gets noisier and every brief costs
 * more for less. This pass runs offline and does four things — fade what went
 * unused, merge what says the same thing twice, retire what keeps being wrong,
 * and roll clusters of episodes up into one durable fact.
 */

const WEEK_MS = 604_800_000;

export interface ConsolidationReport {
  decayed: number;
  merged: number;
  retired: number;
  promoted: number;
  usedModel: boolean;
  notes: string[];
}

interface Candidate {
  memory: Memory;
  vector: Float32Array | null;
}

function loadWithVectors(store: MemoryStore, kinds: string[]): Candidate[] {
  const placeholders = kinds.map(() => "?").join(",");
  const rows = sqlAll<MemoryRow & { vec: Uint8Array | null }>(
    store.db,
    `SELECT m.*, e.vec AS vec
       FROM memories m
       LEFT JOIN embeddings e ON e.memory_id = m.id AND e.model = ?
      WHERE m.status = 'active' AND m.kind IN (${placeholders})
      ORDER BY m.created_at DESC
      LIMIT 5000`,
    store.embedder.id,
    ...kinds,
  );

  return rows.map(({ vec, ...row }) => ({
    // The selected columns are `memories.*`, exactly what rowToMemory expects.
    memory: rowToMemory(row),
    vector: vec ? fromBlob(vec) : null,
  }));
}

/** Score used to decide which of two duplicates survives. */
function survivalScore(memory: Memory): number {
  return memory.confidence * memory.importance + memory.uses * 0.01 + (memory.pinned ? 1 : 0);
}

const SummarySchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(900),
});

const SUMMARY_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["title", "body"],
  properties: {
    title: { type: "string", description: "A specific noun phrase naming what these episodes share." },
    body: { type: "string", description: "The durable takeaway, in prose, without narrating the episodes." },
  },
};

export interface ConsolidateOptions {
  /** Episodes idle longer than this begin to fade. */
  idleWeeksBeforeDecay?: number;
  /** How much importance an idle memory loses per idle week. */
  decayPerWeek?: number;
  /** Minimum cluster size before episodes are rolled into a semantic memory. */
  promoteAt?: number;
  /** Report what would change without writing anything. */
  dryRun?: boolean;
}

export async function consolidate(
  store: MemoryStore,
  options: ConsolidateOptions = {},
): Promise<ConsolidationReport> {
  const idleWeeks = options.idleWeeksBeforeDecay ?? 2;
  const decayPerWeek = options.decayPerWeek ?? 0.12;
  const promoteAt = options.promoteAt ?? 3;
  const dryRun = options.dryRun ?? false;
  const now = Date.now();
  const report: ConsolidationReport = {
    decayed: 0,
    merged: 0,
    retired: 0,
    promoted: 0,
    usedModel: false,
    notes: [],
  };

  // --- 1. Fade what nobody has needed. Identity and pinned memories are exempt. ---
  const fadeable = store.db
    .prepare(
      `SELECT id, importance, uses, created_at, last_used_at
         FROM memories
        WHERE status = 'active' AND pinned = 0 AND kind IN ('episodic', 'source')`,
    )
    .all() as { id: string; importance: number; uses: number; created_at: number; last_used_at: number | null }[];

  for (const row of fadeable) {
    const idle = (now - (row.last_used_at ?? row.created_at)) / WEEK_MS;
    if (idle < idleWeeks) continue;
    const next = row.importance * Math.pow(1 - decayPerWeek, idle - idleWeeks + 1);
    if (next >= row.importance - 1e-6) continue;
    report.decayed++;
    if (dryRun) continue;
    if (next < 0.08 && row.uses === 0) {
      store.retire(row.id, "faded — never recalled, no longer relevant");
      report.retired++;
    } else {
      store.setImportance(row.id, next);
    }
  }

  // --- 2. Merge memories that say the same thing. ---
  const buckets = new Map<string, Candidate[]>();
  for (const candidate of loadWithVectors(store, ["semantic", "procedural", "source"])) {
    if (!candidate.vector) continue;
    const key = `${candidate.memory.kind}::${candidate.memory.project ?? ""}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(candidate);
    else buckets.set(key, [candidate]);
  }

  const absorbed = new Set<string>();
  for (const bucket of buckets.values()) {
    // Comparison is quadratic, so it is deliberately confined inside a bucket.
    for (let i = 0; i < bucket.length; i++) {
      const a = bucket[i]!;
      if (absorbed.has(a.memory.id)) continue;
      for (let j = i + 1; j < bucket.length; j++) {
        const b = bucket[j]!;
        if (absorbed.has(b.memory.id)) continue;
        if (cosine(a.vector!, b.vector!) < store.duplicateThreshold) continue;

        const [keep, drop] =
          survivalScore(a.memory) >= survivalScore(b.memory)
            ? [a.memory, b.memory]
            : [b.memory, a.memory];
        absorbed.add(drop.id);
        report.merged++;
        if (dryRun) continue;
        store.db
          .prepare(
            "UPDATE memories SET status = 'superseded', superseded_by = ?, updated_at = ? WHERE id = ?",
          )
          .run(keep.id, now, drop.id);
        store.link(keep.id, drop.id, "absorbed");
        // The survivor inherits the evidence that backed the duplicate.
        store.db
          .prepare("UPDATE memories SET wins = wins + ?, uses = uses + ? WHERE id = ?")
          .run(drop.wins, drop.uses, keep.id);
      }
    }
  }

  // --- 3. Retire beliefs that kept being wrong. ---
  const failing = store.db
    .prepare(
      `SELECT id, title FROM memories
        WHERE status = 'active' AND kind = 'procedural' AND confidence < ?`,
    )
    .all(store.config.retireBelowConfidence) as { id: string; title: string }[];
  for (const row of failing) {
    report.retired++;
    if (dryRun) continue;
    store.retire(row.id, "confidence collapsed after repeated refutation");
  }

  // --- 4. Roll clusters of episodes up into one durable fact. ---
  const episodes = loadWithVectors(store, ["episodic"]).filter(
    (c) => c.vector && !absorbed.has(c.memory.id),
  );
  const clustered = new Set<string>();
  for (const seed of episodes) {
    if (clustered.has(seed.memory.id)) continue;
    const cluster = episodes.filter(
      (other) =>
        !clustered.has(other.memory.id) &&
        other.memory.project === seed.memory.project &&
        cosine(seed.vector!, other.vector!) >= 0.72,
    );
    if (cluster.length < promoteAt) continue;
    for (const member of cluster) clustered.add(member.memory.id);
    report.promoted++;
    if (dryRun) continue;

    const bullets = cluster.map((c) => `- ${c.memory.title}: ${c.memory.body}`).join("\n");
    let title = `Recurring pattern: ${seed.memory.title}`;
    let body = `Observed across ${cluster.length} sessions:\n${bullets}`;

    if (hasClaude()) {
      const summary = await structured<z.infer<typeof SummarySchema>>({
        model: store.config.model,
        system:
          "You compress related episodes into one durable fact. State what is reliably true, not what happened. No narration, no dates, no session references.",
        prompt: `These ${cluster.length} episodes recur in the same project:\n\n${bullets}`,
        jsonSchema: SUMMARY_JSON_SCHEMA,
        schema: SummarySchema,
        effort: "low",
      });
      if (summary) {
        report.usedModel = true;
        title = summary.title;
        body = summary.body;
      }
    }

    const promoted = await store.remember({
      kind: "semantic",
      title,
      body,
      project: seed.memory.project,
      origin: "self",
      originRef: `consolidation:${new Date(now).toISOString().slice(0, 10)}`,
      importance: 0.7,
      confidence: 0.5,
      tags: ["consolidated"],
    });
    for (const member of cluster) {
      store.link(promoted.id, member.memory.id, "summarises");
      store.setImportance(member.memory.id, member.memory.importance * 0.5);
    }
  }

  if (report.decayed + report.merged + report.retired + report.promoted === 0) {
    report.notes.push("Nothing to consolidate — memory is already tidy.");
  }
  if (!dryRun) {
    store.logEvent({
      kind: "brain.consolidated",
      summary: `Sleep cycle: ${report.decayed} faded, ${report.merged} merged, ${report.retired} retired, ${report.promoted} promoted`,
      payload: report,
    });
    store.db.exec("PRAGMA optimize");
  }
  return report;
}
