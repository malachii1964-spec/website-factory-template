/**
 * The vocabulary of the brain. Every other module speaks in these terms.
 *
 * Five kinds of memory, borrowed from cognitive science because the taxonomy
 * earns its keep — each kind decays differently, is retrieved differently, and
 * is written by a different part of the system.
 */

/** What a memory *is*, which determines how it ages and how it is recalled. */
export const MEMORY_KINDS = [
  /** Durable truth about Malachi himself: preferences, constraints, goals. Never decays. */
  "identity",
  /** A fact about the world or a project. Decays slowly; can be superseded. */
  "semantic",
  /** Something that happened, timestamped. Decays fast; consolidated into semantic memory. */
  "episodic",
  /** A learned rule: "when X, do Y". Earns or loses confidence from outcomes. */
  "procedural",
  /** Raw ingested material (a page, a doc, a file chunk) kept for citation. */
  "source",
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** Where a memory came from. Provenance is never optional — it drives trust. */
export const ORIGINS = ["user", "self", "web", "file", "session"] as const;
export type Origin = (typeof ORIGINS)[number];

export type MemoryStatus = "active" | "retired" | "superseded";

export interface Memory {
  id: string;
  kind: MemoryKind;
  title: string;
  body: string;
  /** Procedural only: the trigger condition that makes this lesson relevant. */
  appliesWhen: string | null;
  tags: string[];
  /** Scope. `null` means it applies everywhere. */
  project: string | null;
  origin: Origin;
  originRef: string | null;
  /** How much this matters, 0..1. Set at write time, decayed by consolidation. */
  importance: number;
  /** How much this is believed, 0..1. Moved by outcomes, never by assertion. */
  confidence: number;
  uses: number;
  wins: number;
  losses: number;
  pinned: boolean;
  status: MemoryStatus;
  supersededBy: string | null;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  contentHash: string;
}

/** A memory plus the scoring that surfaced it. */
export interface ScoredMemory {
  memory: Memory;
  score: number;
  parts: {
    similarity: number;
    lexical: number;
    recency: number;
    importance: number;
    confidence: number;
  };
}

export interface RecallOptions {
  query: string;
  limit?: number;
  kinds?: MemoryKind[];
  project?: string | null;
  /** Include memories scoped to other projects. Defaults to true for global ones only. */
  includeGlobal?: boolean;
  /** Skip near-duplicates of already-selected results. 0..1, higher = more permissive. */
  diversityThreshold?: number;
  minScore?: number;
  /**
   * Whether retrieval counts as a use. Defaults to true. Set false for
   * read-only recall — previewing, auditing, or benchmarking — where marking
   * memories as freshly used would feed recency back into later queries and
   * quietly contaminate the result.
   */
  markUsed?: boolean;
  /**
   * A pre-computed vector for `query`, skipping the embedding call. With a
   * hosted embedder, embedding one query per recall means one network round
   * trip per recall; a caller running many queries can embed them all in a few
   * batched calls and pass the vectors in.
   */
  queryVector?: Float32Array | null;
  /**
   * Second-hop expansion. A multi-hop question needs several memories, but only
   * the first is reachable from the question's own wording — the rest are
   * reachable from *it*. When enabled, the best first-hop results are used as
   * queries in their own right, and explicit links are followed.
   */
  expand?: boolean;
  /** How many first-hop results to expand from. Default 3. */
  expandSeeds?: number;
  /** Discount on an associative hit, so direct answers still outrank them. Default 0.65. */
  expandWeight?: number;
}

/** An entry in the append-only life log. Never edited, never deleted. */
export interface BrainEvent {
  id: number;
  ts: number;
  kind: string;
  actor: string | null;
  project: string | null;
  summary: string;
  payload: unknown;
}

export interface BrainStats {
  total: number;
  byKind: Record<string, number>;
  lessons: { active: number; retired: number; meanConfidence: number };
  events: number;
  oldest: number | null;
  newest: number | null;
  embedded: number;
}
