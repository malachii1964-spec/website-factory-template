import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Memory, MemoryKind, MemoryStatus, Origin } from "./types.ts";

/** Bumped whenever `MIGRATIONS` grows. Stored in `meta` so upgrades are one-way and idempotent. */
export const SCHEMA_VERSION = 2;

const MIGRATIONS: string[] = [
  /* v1 — the founding schema */ `
  CREATE TABLE memories (
    id            TEXT PRIMARY KEY,
    kind          TEXT NOT NULL,
    title         TEXT NOT NULL,
    body          TEXT NOT NULL,
    applies_when  TEXT,
    tags          TEXT NOT NULL DEFAULT '[]',
    project       TEXT,
    origin        TEXT NOT NULL,
    origin_ref    TEXT,
    importance    REAL NOT NULL DEFAULT 0.5,
    confidence    REAL NOT NULL DEFAULT 0.6,
    uses          INTEGER NOT NULL DEFAULT 0,
    wins          INTEGER NOT NULL DEFAULT 0,
    losses        INTEGER NOT NULL DEFAULT 0,
    pinned        INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'active',
    superseded_by TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    last_used_at  INTEGER,
    content_hash  TEXT NOT NULL
  );

  CREATE UNIQUE INDEX memories_hash_active ON memories(content_hash) WHERE status = 'active';
  CREATE INDEX memories_kind    ON memories(kind, status);
  CREATE INDEX memories_project ON memories(project, status);
  CREATE INDEX memories_recent  ON memories(status, created_at DESC);

  CREATE VIRTUAL TABLE memories_fts USING fts5(
    title, body, applies_when, tags,
    content = 'memories',
    content_rowid = 'rowid',
    tokenize = 'porter unicode61'
  );

  CREATE TRIGGER memories_fts_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, title, body, applies_when, tags)
    VALUES (new.rowid, new.title, new.body, COALESCE(new.applies_when, ''), new.tags);
  END;

  CREATE TRIGGER memories_fts_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, body, applies_when, tags)
    VALUES ('delete', old.rowid, old.title, old.body, COALESCE(old.applies_when, ''), old.tags);
  END;

  -- Scoped to the indexed columns so that reinforcement (which only touches
  -- counters) doesn't pay for a full FTS rewrite on every recall.
  CREATE TRIGGER memories_fts_au AFTER UPDATE OF title, body, applies_when, tags ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, body, applies_when, tags)
    VALUES ('delete', old.rowid, old.title, old.body, COALESCE(old.applies_when, ''), old.tags);
    INSERT INTO memories_fts(rowid, title, body, applies_when, tags)
    VALUES (new.rowid, new.title, new.body, COALESCE(new.applies_when, ''), new.tags);
  END;

  CREATE TABLE embeddings (
    memory_id TEXT PRIMARY KEY REFERENCES memories(id) ON DELETE CASCADE,
    model     TEXT NOT NULL,
    dim       INTEGER NOT NULL,
    vec       BLOB NOT NULL
  );
  CREATE INDEX embeddings_model ON embeddings(model);

  CREATE TABLE links (
    src        TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    dst        TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    rel        TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (src, dst, rel)
  );

  CREATE TABLE events (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ts      INTEGER NOT NULL,
    kind    TEXT NOT NULL,
    actor   TEXT,
    project TEXT,
    summary TEXT NOT NULL,
    payload TEXT
  );
  CREATE INDEX events_ts ON events(ts DESC);
  CREATE INDEX events_kind ON events(kind, ts DESC);
  `,
  /* v2 — standards expire on a clock, so they carry their own deadline */ `
  ALTER TABLE memories ADD COLUMN stale_after INTEGER;
  CREATE INDEX memories_stale ON memories(kind, stale_after) WHERE stale_after IS NOT NULL;
  `,
];

export function openBrain(dbPath: string): DatabaseSync {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");

  const row = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get() as
    | { value: string }
    | undefined;
  const current = row ? Number(row.value) : 0;

  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]!);
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)").run(
        String(v + 1),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return db;
}

/**
 * `node:sqlite` types every column as `SQLOutputValue`, so reading a row into a
 * known shape needs a cast. These two helpers keep that cast in one audited
 * place rather than scattering it across every query in the codebase.
 */
export function all<T>(db: DatabaseSync, sql: string, ...params: SQLInputValue[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

export function one<T>(db: DatabaseSync, sql: string, ...params: SQLInputValue[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

/** Shape of a `memories` row as SQLite hands it back. */
export interface MemoryRow {
  id: string;
  kind: string;
  title: string;
  body: string;
  applies_when: string | null;
  tags: string;
  project: string | null;
  origin: string;
  origin_ref: string | null;
  importance: number;
  confidence: number;
  uses: number;
  wins: number;
  losses: number;
  pinned: number;
  status: string;
  superseded_by: string | null;
  created_at: number;
  updated_at: number;
  last_used_at: number | null;
  content_hash: string;
  stale_after: number | null;
}

export function rowToMemory(row: MemoryRow): Memory {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    // A malformed tags blob is not worth losing the memory over.
  }
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    title: row.title,
    body: row.body,
    appliesWhen: row.applies_when,
    tags,
    project: row.project,
    origin: row.origin as Origin,
    originRef: row.origin_ref,
    importance: row.importance,
    confidence: row.confidence,
    uses: row.uses,
    wins: row.wins,
    losses: row.losses,
    pinned: row.pinned === 1,
    status: row.status as MemoryStatus,
    supersededBy: row.superseded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    contentHash: row.content_hash,
    staleAfter: row.stale_after ?? null,
  };
}
