import { homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Every tunable in one place. Retrieval weights and decay half-lives are the
 * knobs that change how the brain *feels*, so they are data, not constants
 * buried in the scorer.
 */
export interface BrainConfig {
  home: string;
  dbPath: string;
  /** Retrieval weights. Must sum to 1 for scores to stay in 0..1. */
  weights: {
    similarity: number;
    lexical: number;
    recency: number;
    importance: number;
    confidence: number;
  };
  /** Days for a memory's recency score to halve, per kind. */
  halfLifeDays: Record<string, number>;
  /** Bonus added to a pinned memory's score, before clamping. */
  pinBonus: number;
  /**
   * Override for the embedder's own near-duplicate cosine. Leave `null` to let
   * each embedding model declare its own scale — see `Embedder.nearDuplicate`.
   */
  duplicateThreshold: number | null;
  /** How many rows the cheap lexical/recency pass may hand to the vector pass. */
  candidateLimit: number;
  /** Confidence movement per confirmation / refutation. */
  learningRate: { confirm: number; refute: number };
  /** Below this confidence a lesson stops being recalled. */
  retireBelowConfidence: number;
  /** Default token budget for an injected brief. */
  briefTokenBudget: number;
  /** Model used for distillation and consolidation when a key is present. */
  model: string;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(): BrainConfig {
  const home = resolve(process.env["MALACHII_HOME"] ?? join(homedir(), ".malachii"));
  return {
    home,
    dbPath: process.env["MALACHII_DB"] ?? join(home, "brain.db"),
    weights: {
      similarity: 0.34,
      lexical: 0.26,
      recency: 0.14,
      importance: 0.14,
      confidence: 0.12,
    },
    halfLifeDays: {
      identity: Number.POSITIVE_INFINITY,
      semantic: 365,
      episodic: 21,
      procedural: 180,
      source: 120,
    },
    pinBonus: 0.25,
    duplicateThreshold: process.env["MALACHII_DUPLICATE_THRESHOLD"]
      ? num("MALACHII_DUPLICATE_THRESHOLD", 0.9)
      : null,
    candidateLimit: num("MALACHII_CANDIDATES", 300),
    learningRate: { confirm: 0.25, refute: 0.45 },
    retireBelowConfidence: 0.15,
    briefTokenBudget: num("MALACHII_BRIEF_BUDGET", 1200),
    model: process.env["MALACHII_MODEL"] ?? "claude-opus-5",
  };
}
