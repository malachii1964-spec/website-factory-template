#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { openBrain } from "../src/core/db.ts";
import { loadConfig } from "../src/core/config.ts";
import { defaultEmbedder } from "../src/memory/embed.ts";
import { MemoryStore } from "../src/memory/store.ts";

/**
 * LoCoMo — retrieval benchmark.
 *
 * LoCoMo is 10 long multi-session conversations (~5,900 turns) with 1,986
 * questions, each labelled with the exact dialogue turns that contain its
 * answer. That evidence labelling is what makes it usable here.
 *
 * WHAT THIS MEASURES, AND WHAT IT DOES NOT
 *
 * The published LoCoMo score is end-to-end question answering: retrieve, then
 * generate an answer, then grade the answer. That number confounds two very
 * different systems — the memory and the model answering from it. This harness
 * deliberately measures only the first: **given a question, does recall surface
 * the turns that actually contain the answer?**
 *
 * That is the honest scope, because retrieval is what this project built. It is
 * also the tighter number: an answer generator cannot use evidence that recall
 * never returned, so retrieval is the ceiling on the end-to-end score.
 *
 * Consequence: these numbers are NOT comparable to published end-to-end LoCoMo
 * scores. Do not quote them side by side.
 *
 * Categories 1-4 (multi-hop, temporal, open-domain, single-hop) are the scored
 * set — 1,540 questions, matching the standard evaluation. Category 5 is
 * adversarial: the question asks about the wrong speaker and the correct
 * behaviour is to decline, which makes it a generation test rather than a
 * retrieval one. It is reported separately and excluded from the headline.
 *
 * Get the data:
 *   curl -L -o malachii/bench/data/locomo10.json \
 *     https://raw.githubusercontent.com/snap-research/LoCoMo/main/data/locomo10.json
 */

const CATEGORY_NAMES: Record<number, string> = {
  1: "multi-hop",
  2: "temporal",
  3: "open-domain",
  4: "single-hop",
  5: "adversarial",
};

interface Turn {
  speaker: string;
  dia_id: string;
  text: string;
}

interface Question {
  question: string;
  evidence?: string[];
  category?: number;
}

interface Conversation {
  sample_id?: string;
  qa: Question[];
  conversation: Record<string, unknown>;
}

interface Bucket {
  questions: number;
  /** Any gold evidence turn retrieved, per cut-off. */
  hits: Map<number, number>;
  /** Every gold evidence turn retrieved — the honest bar for multi-hop. */
  fullHits: Map<number, number>;
  reciprocalRankSum: number;
}

function newBucket(cutoffs: number[]): Bucket {
  return {
    questions: 0,
    hits: new Map(cutoffs.map((k) => [k, 0])),
    fullHits: new Map(cutoffs.map((k) => [k, 0])),
    reciprocalRankSum: 0,
  };
}

function sessionTurns(conversation: Record<string, unknown>): Turn[] {
  const turns: Turn[] = [];
  // session_1, session_2, … in order; anything else (dates, summaries) ignored.
  const keys = Object.keys(conversation)
    .filter((k) => /^session_\d+$/.test(k))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));
  for (const key of keys) {
    const value = conversation[key];
    if (!Array.isArray(value)) continue;
    for (const raw of value) {
      if (typeof raw !== "object" || raw === null) continue;
      const turn = raw as Partial<Turn>;
      if (typeof turn.dia_id === "string" && typeof turn.text === "string") {
        turns.push({ speaker: turn.speaker ?? "unknown", dia_id: turn.dia_id, text: turn.text });
      }
    }
  }
  return turns;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      data: { type: "string", default: "malachii/bench/data/locomo10.json" },
      conversations: { type: "string" },
      k: { type: "string", default: "20" },
      json: { type: "boolean", default: false },
      expand: { type: "boolean", default: false },
      ablate: { type: "string" },
    },
  });

  const maxK = Number(values.k);
  const cutoffs = [5, 10, maxK].filter((k, i, a) => a.indexOf(k) === i && k <= maxK).sort((a, b) => a - b);

  let dataset: Conversation[];
  try {
    dataset = JSON.parse(readFileSync(values.data, "utf8")) as Conversation[];
  } catch {
    process.stderr.write(
      `Could not read ${values.data}.\n\n` +
        `  mkdir -p malachii/bench/data && curl -L -o malachii/bench/data/locomo10.json \\\n` +
        `    https://raw.githubusercontent.com/snap-research/LoCoMo/main/data/locomo10.json\n`,
    );
    process.exit(1);
  }
  if (values.conversations) dataset = dataset.slice(0, Number(values.conversations));

  // Ablations answer "which signal is actually carrying retrieval?" by zeroing
  // one term and redistributing its weight across the rest, so scores stay on
  // the same 0..1 scale and remain comparable to the baseline.
  const baseConfig = loadConfig();
  const weights = { ...baseConfig.weights };
  if (values.ablate === "no-vector" || values.ablate === "no-lexical") {
    const drop = values.ablate === "no-vector" ? "similarity" : "lexical";
    const freed = weights[drop];
    weights[drop] = 0;
    const rest = (Object.keys(weights) as (keyof typeof weights)[]).filter((k) => weights[k] > 0);
    const total = rest.reduce((sum, k) => sum + weights[k], 0);
    for (const k of rest) weights[k] += (freed * weights[k]) / total;
  } else if (values.ablate) {
    process.stderr.write(`unknown --ablate ${values.ablate} (use no-vector | no-lexical)\n`);
    process.exit(1);
  }

  const embedder = defaultEmbedder();
  const overall = newBucket(cutoffs);
  const byCategory = new Map<number, Bucket>();
  const adversarial = newBucket(cutoffs);

  let totalTurns = 0;
  let ingestMs = 0;
  let queryMs = 0;
  let queries = 0;
  let skipped = 0;

  for (const [index, conversation] of dataset.entries()) {
    const turns = sessionTurns(conversation.conversation);
    if (turns.length === 0) continue;
    totalTurns += turns.length;

    const store = new MemoryStore(
      openBrain(":memory:"),
      embedder,
      { ...baseConfig, weights, dbPath: ":memory:" },
    );

    const ingestStart = performance.now();
    // Bulk write so a hosted embedder sees a few dozen batched requests rather
    // than one round trip per turn.
    await store.rememberMany(
      turns.map((turn) => ({
        kind: "episodic" as const,
        title: turn.speaker,
        body: turn.text,
        origin: "session" as const,
        originRef: turn.dia_id,
        // Identical utterances at different points are distinct events here.
        dedupe: false,
      })),
    );
    ingestMs += performance.now() - ingestStart;

    // Same reasoning for the questions: embed them all up front, then hand the
    // vectors to recall so no query pays for its own network call.
    const scorable = conversation.qa.filter((qa) => (qa.evidence ?? []).length > 0);
    const questionVectors = new Map<string, Float32Array>();
    for (let i = 0; i < scorable.length; i += 128) {
      const chunk = scorable.slice(i, i + 128);
      try {
        const vecs = await embedder.embed(chunk.map((qa) => qa.question));
        for (const [j, qa] of chunk.entries()) {
          const vec = vecs[j];
          if (vec) questionVectors.set(qa.question, vec);
        }
      } catch {
        // Fall through: recall embeds the query itself when no vector is given.
      }
    }

    for (const qa of conversation.qa) {
      const gold = new Set(qa.evidence ?? []);
      if (gold.size === 0) {
        skipped++;
        continue;
      }

      const queryStart = performance.now();
      const results = await store.recall({
        query: qa.question,
        limit: maxK,
        // Read-only: marking these used would leak recency into later questions.
        markUsed: false,
        expand: values.expand,
        queryVector: questionVectors.get(qa.question) ?? null,
      });
      queryMs += performance.now() - queryStart;
      queries++;

      const ranked = results.map((r) => r.memory.originRef ?? "");
      const category = qa.category ?? 0;
      const bucket =
        category === 5
          ? adversarial
          : (byCategory.get(category) ?? newBucket(cutoffs));
      if (category !== 5) byCategory.set(category, bucket);

      bucket.questions++;
      if (category !== 5) overall.questions++;

      const firstHit = ranked.findIndex((id) => gold.has(id));
      if (firstHit >= 0) {
        const rr = 1 / (firstHit + 1);
        bucket.reciprocalRankSum += rr;
        if (category !== 5) overall.reciprocalRankSum += rr;
      }

      for (const k of cutoffs) {
        const top = ranked.slice(0, k);
        const any = top.some((id) => gold.has(id));
        const all = [...gold].every((id) => top.includes(id));
        if (any) {
          bucket.hits.set(k, bucket.hits.get(k)! + 1);
          if (category !== 5) overall.hits.set(k, overall.hits.get(k)! + 1);
        }
        if (all) {
          bucket.fullHits.set(k, bucket.fullHits.get(k)! + 1);
          if (category !== 5) overall.fullHits.set(k, overall.fullHits.get(k)! + 1);
        }
      }
    }

    store.close();
    process.stderr.write(`  conversation ${index + 1}/${dataset.length} (${turns.length} turns)\r`);
  }
  process.stderr.write("\n");

  const pct = (n: number, d: number): string => (d === 0 ? "—" : `${((n / d) * 100).toFixed(1)}%`);
  const row = (label: string, b: Bucket): string =>
    `${label.padEnd(14)}${String(b.questions).padStart(6)}  ` +
    cutoffs.map((k) => pct(b.hits.get(k)!, b.questions).padStart(8)).join("") +
    "  " +
    cutoffs.map((k) => pct(b.fullHits.get(k)!, b.questions).padStart(9)).join("") +
    `  ${(b.reciprocalRankSum / Math.max(1, b.questions)).toFixed(3).padStart(6)}`;

  if (values.json) {
    const serialise = (b: Bucket) => ({
      questions: b.questions,
      recallAt: Object.fromEntries(cutoffs.map((k) => [k, b.hits.get(k)! / Math.max(1, b.questions)])),
      fullEvidenceAt: Object.fromEntries(
        cutoffs.map((k) => [k, b.fullHits.get(k)! / Math.max(1, b.questions)]),
      ),
      mrr: b.reciprocalRankSum / Math.max(1, b.questions),
    });
    process.stdout.write(
      `${JSON.stringify(
        {
          embedder: embedder.id,
          conversations: dataset.length,
          turns: totalTurns,
          overall: serialise(overall),
          byCategory: Object.fromEntries(
            [...byCategory.entries()].map(([c, b]) => [CATEGORY_NAMES[c] ?? String(c), serialise(b)]),
          ),
          adversarial: serialise(adversarial),
          msPerQuery: queryMs / Math.max(1, queries),
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(
    `\nLoCoMo — retrieval only (not comparable to end-to-end LoCoMo scores)\n` +
      `embedder ${embedder.id}${values.expand ? " · second-hop expansion ON" : ""}${values.ablate ? ` · ABLATION: ${values.ablate}` : ""}\n` +
      `${dataset.length} conversations, ${totalTurns} turns ingested, ${overall.questions} scored questions` +
      `${skipped > 0 ? `, ${skipped} skipped (no evidence label)` : ""}\n\n` +
      `${"".padEnd(20)}${cutoffs.map((k) => `any@${k}`.padStart(8)).join("")}` +
      `  ${cutoffs.map((k) => `all@${k}`.padStart(9)).join("")}     MRR\n` +
      `${"".padEnd(20)}${"".padEnd(cutoffs.length * 8, "─")}  ${"".padEnd(cutoffs.length * 9, "─")}  ──────\n` +
      `${row("OVERALL", overall)}\n\n`,
  );
  for (const [category, bucket] of [...byCategory.entries()].sort((a, b) => a[0] - b[0])) {
    process.stdout.write(`${row(CATEGORY_NAMES[category] ?? String(category), bucket)}\n`);
  }
  process.stdout.write(
    `\n${row("adversarial*", adversarial)}\n` +
      `  * excluded from OVERALL — the correct behaviour is to decline, which is a\n` +
      `    generation test, not a retrieval one.\n\n` +
      `any@k  — at least one gold evidence turn retrieved\n` +
      `all@k  — every gold evidence turn retrieved (the real bar for multi-hop)\n` +
      `ingest ${(ingestMs / Math.max(1, totalTurns)).toFixed(2)} ms/turn · ` +
      `query ${(queryMs / Math.max(1, queries)).toFixed(1)} ms\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`bench: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
