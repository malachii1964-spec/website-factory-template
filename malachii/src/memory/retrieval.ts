import type { BrainConfig } from "../core/config.ts";
import { cosine, tokenize } from "./embed.ts";
import type { Memory, ScoredMemory } from "../core/types.ts";

const DAY_MS = 86_400_000;

/**
 * FTS5's query language treats plenty of ordinary punctuation as syntax, so a
 * raw user question like `why did the build fail? (again)` is a parse error.
 * Reduce the query to bare terms and OR them together with prefix matching.
 */
export function toFtsQuery(query: string): string | null {
  const terms = tokenize(query)
    .filter((t) => !t.includes("~"))
    .slice(0, 24)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((t) => t.length > 1);
  const unique = [...new Set(terms)];
  if (unique.length === 0) return null;
  return unique.map((t) => `"${t}"*`).join(" OR ");
}

/** 1.0 at write time, halving every `halfLifeDays`. Identity memories never fade. */
export function recencyScore(ageMs: number, halfLifeDays: number): number {
  if (!Number.isFinite(halfLifeDays)) return 1;
  if (halfLifeDays <= 0) return 0;
  const ageDays = Math.max(0, ageMs) / DAY_MS;
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/**
 * bm25() returns negative numbers where more negative is a better match. Map
 * the candidate set onto 0..1 so the lexical term is commensurate with cosine.
 */
export function normaliseLexical(rawScores: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  if (rawScores.size === 0) return out;
  const values = [...rawScores.values()].map((v) => -v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  for (const [id, raw] of rawScores) {
    out.set(id, span < 1e-9 ? 1 : (-raw - min) / span);
  }
  return out;
}

export interface ScoringInput {
  candidates: Memory[];
  queryVector: Float32Array | null;
  vectors: Map<string, Float32Array>;
  lexical: Map<string, number>;
  config: BrainConfig;
  now: number;
}

export function scoreCandidates(input: ScoringInput): ScoredMemory[] {
  const { candidates, queryVector, vectors, lexical, config, now } = input;
  const w = config.weights;

  const relevanceFirst = config.scoring === "relevance-first";

  return candidates
    .map((memory): ScoredMemory => {
      const vec = vectors.get(memory.id);
      // Cosine lands in -1..1 and how it is mapped depends on the scoring mode.
      //
      // Additive folds to 0..1, because clamping there measured worse: with a
      // weak embedder the signal is noisy and widening its range amplifies the
      // noise. Relevance-first clamps instead, because "unrelated" must mean
      // zero — half marks for irrelevance is exactly the noise floor this mode
      // exists to remove.
      const raw = queryVector && vec ? cosine(queryVector, vec) : 0;
      const similarity = queryVector && vec ? (relevanceFirst ? Math.max(0, raw) : Math.max(0, (raw + 1) / 2)) : 0;

      const halfLife = config.halfLifeDays[memory.kind] ?? 180;
      const recency = recencyScore(now - (memory.lastUsedAt ?? memory.createdAt), halfLife);
      const parts = {
        similarity,
        lexical: lexical.get(memory.id) ?? 0,
        recency,
        importance: memory.importance,
        confidence: memory.confidence,
      };

      let base: number;
      if (relevanceFirst) {
        // Relevance decides the score outright, renormalised so the two
        // relevance terms span the full 0..1 range on their own.
        const relevanceWeight = w.similarity + w.lexical;
        const relevance =
          relevanceWeight > 0
            ? (w.similarity * parts.similarity + w.lexical * parts.lexical) / relevanceWeight
            : 0;
        // Priors swing that relevance up or down around 1×. They can promote a
        // trusted, fresh memory over a stale doubtful one — but they can never
        // manufacture relevance a memory does not have.
        const k = config.priorInfluence;
        const prior =
          1 +
          k.importance * (parts.importance - 0.5) +
          k.confidence * (parts.confidence - 0.5) +
          k.recency * (parts.recency - 0.5);
        base = relevance * Math.max(0, prior);
      } else {
        base =
          w.similarity * parts.similarity +
          w.lexical * parts.lexical +
          w.recency * parts.recency +
          w.importance * parts.importance +
          w.confidence * parts.confidence;
      }

      const score = Math.min(1, base + (memory.pinned ? config.pinBonus : 0));
      return { memory, score, parts };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Greedy selection that refuses to spend budget on the same idea twice.
 * Without this, five near-identical notes crowd out five distinct ones.
 */
export function selectDiverse(
  scored: ScoredMemory[],
  vectors: Map<string, Float32Array>,
  limit: number,
  threshold: number,
): ScoredMemory[] {
  const chosen: ScoredMemory[] = [];
  for (const candidate of scored) {
    if (chosen.length >= limit) break;
    const vec = vectors.get(candidate.memory.id);
    if (vec) {
      const duplicate = chosen.some((picked) => {
        const other = vectors.get(picked.memory.id);
        return other ? cosine(vec, other) >= threshold : false;
      });
      if (duplicate) continue;
    }
    chosen.push(candidate);
  }
  return chosen;
}
