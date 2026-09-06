/**
 * Error types for grow journals.
 *
 * These live outside grow-journals.ts on purpose: that file carries the
 * "use server" directive, and such a module may only export async functions.
 * A class or a plain predicate there breaks the whole module's exports.
 */

/**
 * Thrown when the grow tables are not present in the database — i.e. the
 * schema has not been pushed yet. Callers render a designed "not switched on"
 * state instead of surfacing a 500.
 */
export class GrowTablesMissingError extends Error {
  constructor() {
    super("Grow journal tables have not been created in this database.");
    this.name = "GrowTablesMissingError";
  }
}

/** Postgres SQLSTATE for "undefined_table". */
const UNDEFINED_TABLE = "42P01";

const MENTIONS_GROW_TABLE =
  /relation "(grow|grow_event_done)" does not exist/i;

/**
 * True only for "relation does not exist" on the grow tables.
 *
 * The driver error is wrapped: Drizzle throws its own error whose message is
 * "Failed query: select ..." and hangs the real Postgres error off `cause`.
 * Checking only the top-level object silently misses every real occurrence —
 * which is exactly what happened the first time this shipped, so the whole
 * cause chain is walked here.
 */
export function isMissingGrowTable(err: unknown): boolean {
  let current: unknown = err;
  // Bounded so a self-referencing cause cannot spin forever.
  for (let depth = 0; current && depth < 10; depth++) {
    const e = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (e.code === UNDEFINED_TABLE) return true;
    if (typeof e.message === "string" && MENTIONS_GROW_TABLE.test(e.message)) {
      return true;
    }
    current = e.cause;
  }
  return false;
}
