import type { DatabaseSync, StatementSync } from "node:sqlite";
import { loadConfig, type BrainConfig } from "../core/config.ts";
import { all as sqlAll, one as sqlOne, openBrain, rowToMemory, type MemoryRow } from "../core/db.ts";
import { contentHash, newId } from "../core/ids.ts";
import type {
  BrainEvent,
  BrainStats,
  Memory,
  MemoryKind,
  Origin,
  RecallOptions,
  ScoredMemory,
} from "../core/types.ts";
import { defaultEmbedder, fromBlob, toBlob, type Embedder } from "./embed.ts";
import { normaliseLexical, scoreCandidates, selectDiverse, toFtsQuery } from "./retrieval.ts";

export interface RememberInput {
  kind: MemoryKind;
  title: string;
  body: string;
  appliesWhen?: string | null;
  tags?: string[];
  project?: string | null;
  origin?: Origin;
  originRef?: string | null;
  importance?: number;
  confidence?: number;
  pinned?: boolean;
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * The brain's only writer and reader. Everything that touches memory goes
 * through here so that provenance, embeddings, and the event log can never
 * drift out of sync with the memories themselves.
 */
export class MemoryStore {
  readonly db: DatabaseSync;
  readonly config: BrainConfig;
  readonly embedder: Embedder;
  #insert: StatementSync | null = null;

  constructor(db: DatabaseSync, embedder: Embedder, config: BrainConfig) {
    this.db = db;
    this.embedder = embedder;
    this.config = config;
  }

  static open(config: BrainConfig = loadConfig(), embedder: Embedder = defaultEmbedder()): MemoryStore {
    return new MemoryStore(openBrain(config.dbPath), embedder, config);
  }

  close(): void {
    this.db.close();
  }

  /** What counts as "the same thing" in the active embedding space. */
  get duplicateThreshold(): number {
    return this.config.duplicateThreshold ?? this.embedder.nearDuplicate;
  }

  // ---------------------------------------------------------------- writing

  async remember(input: RememberInput): Promise<Memory> {
    const now = Date.now();
    const project = input.project ?? null;
    const hash = contentHash({
      kind: input.kind,
      title: input.title,
      body: input.body,
      project,
    });

    // Re-learning something already known is not a new memory — it's evidence
    // for the one that exists. Reinforce instead of duplicating.
    const existing = this.#findByHash(hash);
    if (existing) {
      this.reinforce(existing.id, 0.05);
      return this.get(existing.id) ?? existing;
    }

    const id = newId(input.kind.slice(0, 3), now);
    const memory: Memory = {
      id,
      kind: input.kind,
      title: input.title.trim(),
      body: input.body.trim(),
      appliesWhen: input.appliesWhen?.trim() || null,
      tags: input.tags ?? [],
      project,
      origin: input.origin ?? "user",
      originRef: input.originRef ?? null,
      importance: clamp01(input.importance ?? defaultImportance(input.kind)),
      confidence: clamp01(input.confidence ?? defaultConfidence(input.origin ?? "user")),
      uses: 0,
      wins: 0,
      losses: 0,
      pinned: input.pinned ?? input.kind === "identity",
      status: "active",
      supersededBy: null,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      contentHash: hash,
    };

    this.#insert ??= this.db.prepare(`
      INSERT INTO memories (
        id, kind, title, body, applies_when, tags, project, origin, origin_ref,
        importance, confidence, uses, wins, losses, pinned, status, superseded_by,
        created_at, updated_at, last_used_at, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'active', NULL, ?, ?, NULL, ?)
    `);
    this.#insert.run(
      memory.id,
      memory.kind,
      memory.title,
      memory.body,
      memory.appliesWhen,
      JSON.stringify(memory.tags),
      memory.project,
      memory.origin,
      memory.originRef,
      memory.importance,
      memory.confidence,
      memory.pinned ? 1 : 0,
      memory.createdAt,
      memory.updatedAt,
      memory.contentHash,
    );

    await this.#embedMemory(memory);
    this.logEvent({
      kind: "memory.written",
      project,
      summary: `Learned (${memory.kind}): ${memory.title}`,
      payload: { id: memory.id, origin: memory.origin },
    });
    return memory;
  }

  /** Batch write, sharing a single embedding round trip. Used by ingestion. */
  async rememberMany(inputs: RememberInput[]): Promise<Memory[]> {
    const written: Memory[] = [];
    for (const input of inputs) written.push(await this.remember(input));
    return written;
  }

  async #embedMemory(memory: Memory): Promise<void> {
    const text = [memory.title, memory.appliesWhen ?? "", memory.body].join("\n").trim();
    let vec: Float32Array;
    try {
      const [first] = await this.embedder.embed([text]);
      if (!first) return;
      vec = first;
    } catch (error) {
      // A missing vector degrades recall to lexical-only. It must never lose the memory.
      this.logEvent({
        kind: "embedding.failed",
        summary: `Could not embed ${memory.id}`,
        payload: { error: String(error) },
      });
      return;
    }
    this.db
      .prepare(
        "INSERT OR REPLACE INTO embeddings (memory_id, model, dim, vec) VALUES (?, ?, ?, ?)",
      )
      .run(memory.id, this.embedder.id, vec.length, toBlob(vec));
  }

  // ---------------------------------------------------------------- reading

  get(id: string): Memory | null {
    const row = sqlOne<MemoryRow>(this.db, "SELECT * FROM memories WHERE id = ?", id);
    return row ? rowToMemory(row) : null;
  }

  #findByHash(hash: string): Memory | null {
    const row = sqlOne<MemoryRow>(
      this.db,
      "SELECT * FROM memories WHERE content_hash = ? AND status = 'active'",
      hash,
    );
    return row ? rowToMemory(row) : null;
  }

  /**
   * Two cheap passes (full-text, plus a floor of pinned/identity/recent rows)
   * produce a bounded candidate set; only that set pays for vector scoring.
   * This is what keeps recall cheap as the brain grows.
   */
  async recall(options: RecallOptions): Promise<ScoredMemory[]> {
    const limit = options.limit ?? 8;
    const now = Date.now();
    const candidates = new Map<string, Memory>();
    const rawLexical = new Map<string, number>();

    const ftsQuery = toFtsQuery(options.query);
    if (ftsQuery) {
      const rows = sqlAll<MemoryRow & { rank: number }>(
        this.db,
        `SELECT m.*, bm25(memories_fts) AS rank
           FROM memories_fts
           JOIN memories m ON m.rowid = memories_fts.rowid
          WHERE memories_fts MATCH ? AND m.status = 'active'
          ORDER BY rank
          LIMIT ?`,
        ftsQuery,
        this.config.candidateLimit,
      );
      for (const row of rows) {
        const memory = rowToMemory(row);
        candidates.set(memory.id, memory);
        rawLexical.set(memory.id, row.rank);
      }
    }

    // Identity and pinned memories are always in the running: they are what
    // makes the brain recognisably *his*, not just topically relevant.
    const floor = sqlAll<MemoryRow>(
      this.db,
      `SELECT * FROM memories
        WHERE status = 'active' AND (pinned = 1 OR kind = 'identity')
        LIMIT ?`,
      this.config.candidateLimit,
    );
    const recent = sqlAll<MemoryRow>(
      this.db,
      `SELECT * FROM memories
        WHERE status = 'active'
        ORDER BY created_at DESC
        LIMIT ?`,
      Math.min(60, this.config.candidateLimit),
    );
    for (const row of [...floor, ...recent]) {
      const memory = rowToMemory(row);
      if (!candidates.has(memory.id)) candidates.set(memory.id, memory);
    }

    let pool = [...candidates.values()];
    if (options.kinds?.length) {
      const allowed = new Set(options.kinds);
      pool = pool.filter((m) => allowed.has(m.kind));
    }
    if (options.project !== undefined) {
      const includeGlobal = options.includeGlobal ?? true;
      pool = pool.filter(
        (m) => m.project === options.project || (includeGlobal && m.project === null),
      );
    }
    // A refuted lesson stays on disk for the audit trail but stops being advice.
    pool = pool.filter(
      (m) => m.kind !== "procedural" || m.confidence >= this.config.retireBelowConfidence,
    );
    if (pool.length === 0) return [];

    const vectors = this.#loadVectors(pool.map((m) => m.id));
    let queryVector: Float32Array | null = null;
    try {
      const [vec] = await this.embedder.embed([options.query]);
      queryVector = vec ?? null;
    } catch {
      queryVector = null; // Lexical-only recall is degraded, not broken.
    }

    const scored = scoreCandidates({
      candidates: pool,
      queryVector,
      vectors,
      lexical: normaliseLexical(rawLexical),
      config: this.config,
      now,
    });

    const minScore = options.minScore ?? 0;
    const selected = selectDiverse(
      scored.filter((s) => s.score >= minScore),
      vectors,
      limit,
      options.diversityThreshold ?? this.duplicateThreshold,
    );

    this.#markUsed(selected.map((s) => s.memory.id), now);
    return selected;
  }

  #loadVectors(ids: string[]): Map<string, Float32Array> {
    const vectors = new Map<string, Float32Array>();
    if (ids.length === 0) return vectors;
    // Chunked so a large candidate set can't blow past SQLite's variable limit.
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const placeholders = chunk.map(() => "?").join(",");
      const rows = sqlAll<{ memory_id: string; vec: Uint8Array }>(
        this.db,
        `SELECT memory_id, vec FROM embeddings
          WHERE model = ? AND memory_id IN (${placeholders})`,
        this.embedder.id,
        ...chunk,
      );
      for (const row of rows) vectors.set(row.memory_id, fromBlob(row.vec));
    }
    return vectors;
  }

  #markUsed(ids: string[], now: number): void {
    if (ids.length === 0) return;
    const stmt = this.db.prepare(
      "UPDATE memories SET uses = uses + 1, last_used_at = ? WHERE id = ?",
    );
    for (const id of ids) stmt.run(now, id);
  }

  list(filter: {
    kind?: MemoryKind;
    project?: string | null;
    status?: string;
    limit?: number;
  } = {}): Memory[] {
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    clauses.push("status = ?");
    params.push(filter.status ?? "active");
    if (filter.kind) {
      clauses.push("kind = ?");
      params.push(filter.kind);
    }
    if (filter.project !== undefined) {
      if (filter.project === null) clauses.push("project IS NULL");
      else {
        clauses.push("project = ?");
        params.push(filter.project);
      }
    }
    const rows = sqlAll<MemoryRow>(
      this.db,
      `SELECT * FROM memories WHERE ${clauses.join(" AND ")}
        ORDER BY pinned DESC, importance DESC, created_at DESC LIMIT ?`,
      ...params,
      filter.limit ?? 50,
    );
    return rows.map(rowToMemory);
  }

  // --------------------------------------------------------------- learning

  /**
   * Something the brain believed turned out to help. Confidence moves toward 1
   * asymptotically — repeated success compounds but never reaches certainty.
   */
  reinforce(id: string, rate = this.config.learningRate.confirm): Memory | null {
    const memory = this.get(id);
    if (!memory) return null;
    const confidence = clamp01(memory.confidence + (1 - memory.confidence) * rate);
    this.db
      .prepare(
        "UPDATE memories SET confidence = ?, wins = wins + 1, updated_at = ? WHERE id = ?",
      )
      .run(confidence, Date.now(), id);
    this.logEvent({
      kind: "memory.reinforced",
      project: memory.project,
      summary: `Confirmed: ${memory.title}`,
      payload: { id, from: memory.confidence, to: confidence },
    });
    return this.get(id);
  }

  /**
   * Something the brain believed turned out to be wrong. Confidence decays
   * multiplicatively, and a belief that keeps being wrong retires itself.
   */
  refute(id: string, reason: string, rate = this.config.learningRate.refute): Memory | null {
    const memory = this.get(id);
    if (!memory) return null;
    const confidence = clamp01(memory.confidence * (1 - rate));
    const retiring = confidence < this.config.retireBelowConfidence;
    this.db
      .prepare(
        `UPDATE memories SET confidence = ?, losses = losses + 1, status = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(confidence, retiring ? "retired" : memory.status, Date.now(), id);
    this.logEvent({
      kind: retiring ? "memory.retired" : "memory.refuted",
      project: memory.project,
      summary: `${retiring ? "Retired" : "Doubted"}: ${memory.title} — ${reason}`,
      payload: { id, from: memory.confidence, to: confidence, reason },
    });
    return this.get(id);
  }

  /** Replace a belief with a better one, keeping the old one linked and readable. */
  async supersede(oldId: string, replacement: RememberInput, reason: string): Promise<Memory> {
    const old = this.get(oldId);
    const next = await this.remember(replacement);
    if (old) {
      this.db
        .prepare(
          "UPDATE memories SET status = 'superseded', superseded_by = ?, updated_at = ? WHERE id = ?",
        )
        .run(next.id, Date.now(), oldId);
      this.link(next.id, oldId, "supersedes");
      this.logEvent({
        kind: "memory.superseded",
        project: old.project,
        summary: `Replaced "${old.title}" with "${next.title}" — ${reason}`,
        payload: { oldId, newId: next.id, reason },
      });
    }
    return next;
  }

  retire(id: string, reason: string): void {
    const memory = this.get(id);
    if (!memory) return;
    this.db
      .prepare("UPDATE memories SET status = 'retired', updated_at = ? WHERE id = ?")
      .run(Date.now(), id);
    this.logEvent({
      kind: "memory.retired",
      project: memory.project,
      summary: `Retired: ${memory.title} — ${reason}`,
      payload: { id, reason },
    });
  }

  setPinned(id: string, pinned: boolean): void {
    this.db
      .prepare("UPDATE memories SET pinned = ?, updated_at = ? WHERE id = ?")
      .run(pinned ? 1 : 0, Date.now(), id);
  }

  setImportance(id: string, importance: number): void {
    this.db
      .prepare("UPDATE memories SET importance = ?, updated_at = ? WHERE id = ?")
      .run(clamp01(importance), Date.now(), id);
  }

  link(src: string, dst: string, rel: string): void {
    this.db
      .prepare("INSERT OR IGNORE INTO links (src, dst, rel, created_at) VALUES (?, ?, ?, ?)")
      .run(src, dst, rel, Date.now());
  }

  // ------------------------------------------------------------------ journal

  logEvent(event: {
    kind: string;
    summary: string;
    actor?: string | null;
    project?: string | null;
    payload?: unknown;
  }): void {
    this.db
      .prepare(
        "INSERT INTO events (ts, kind, actor, project, summary, payload) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        Date.now(),
        event.kind,
        event.actor ?? null,
        event.project ?? null,
        event.summary,
        event.payload === undefined ? null : JSON.stringify(event.payload),
      );
  }

  recentEvents(limit = 20, kind?: string): BrainEvent[] {
    interface EventRow {
      id: number;
      ts: number;
      kind: string;
      actor: string | null;
      project: string | null;
      summary: string;
      payload: string | null;
    }
    const rows = kind
      ? sqlAll<EventRow>(
          this.db,
          "SELECT * FROM events WHERE kind = ? ORDER BY ts DESC LIMIT ?",
          kind,
          limit,
        )
      : sqlAll<EventRow>(this.db, "SELECT * FROM events ORDER BY ts DESC LIMIT ?", limit);
    return rows.map((row) => ({
      ...row,
      payload: row.payload ? safeParse(row.payload) : null,
    }));
  }

  stats(): BrainStats {
    const byKind: Record<string, number> = {};
    const kindRows = sqlAll<{ kind: string; n: number }>(
      this.db,
      "SELECT kind, COUNT(*) AS n FROM memories WHERE status = 'active' GROUP BY kind",
    );
    for (const row of kindRows) byKind[row.kind] = row.n;

    const lessonRow = sqlOne<{ active: number | null; retired: number | null; mean: number | null }>(
      this.db,
      `SELECT
         SUM(CASE WHEN status = 'active'  THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) AS retired,
         AVG(CASE WHEN status = 'active'  THEN confidence END) AS mean
       FROM memories WHERE kind = 'procedural'`,
    );

    const span = sqlOne<{ oldest: number | null; newest: number | null }>(
      this.db,
      "SELECT MIN(created_at) AS oldest, MAX(created_at) AS newest FROM memories WHERE status = 'active'",
    );

    const count = (sql: string): number => sqlOne<{ n: number }>(this.db, sql)?.n ?? 0;

    return {
      total: Object.values(byKind).reduce((a, b) => a + b, 0),
      byKind,
      lessons: {
        active: lessonRow?.active ?? 0,
        retired: lessonRow?.retired ?? 0,
        meanConfidence: lessonRow?.mean ?? 0,
      },
      events: count("SELECT COUNT(*) AS n FROM events"),
      oldest: span?.oldest ?? null,
      newest: span?.newest ?? null,
      embedded: count("SELECT COUNT(*) AS n FROM embeddings"),
    };
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function defaultImportance(kind: MemoryKind): number {
  switch (kind) {
    case "identity":
      return 0.95;
    case "procedural":
      return 0.75;
    case "semantic":
      return 0.6;
    case "episodic":
      return 0.4;
    case "source":
      return 0.35;
  }
}

/** Trust starts where the claim came from. The brain believes Malachi more than it believes itself. */
function defaultConfidence(origin: Origin): number {
  switch (origin) {
    case "user":
      return 0.9;
    case "file":
      return 0.75;
    case "web":
      return 0.55;
    case "session":
      return 0.5;
    case "self":
      return 0.4;
  }
}
