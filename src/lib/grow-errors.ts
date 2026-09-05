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

/**
 * True only for "relation does not exist" on the grow tables. Postgres reports
 * that as SQLSTATE 42P01. Any other failure is a real fault and must surface.
 */
export function isMissingGrowTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "42P01" ||
    /relation "(grow|grow_event_done)" does not exist/i.test(e?.message ?? "")
  );
}
