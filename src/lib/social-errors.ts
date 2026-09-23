/**
 * Error types for the community feature (posts, profiles, follows).
 *
 * Lives outside social-posts.ts on purpose: that file carries the "use
 * server" directive, and such a module may only export async functions.
 */

/**
 * Thrown when the community tables are not present in the database — i.e.
 * the schema has not been pushed yet. Callers render a designed "not
 * switched on" state instead of surfacing a 500.
 */
export class SocialTablesMissingError extends Error {
  constructor() {
    super("Community tables have not been created in this database.");
    this.name = "SocialTablesMissingError";
  }
}

/** Postgres SQLSTATE for "undefined_table". */
const UNDEFINED_TABLE = "42P01";

const MENTIONS_SOCIAL_TABLE =
  /relation "(social_profile|follow|post|post_media|post_report)" does not exist/i;

/**
 * True only for "relation does not exist" on the community tables. Walks
 * the full cause chain — Drizzle wraps the real Postgres error under
 * `cause`, so checking only the top-level object misses it (this exact
 * mistake was already made once for the grow tables; see grow-errors.ts).
 */
export function isMissingSocialTable(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; current && depth < 10; depth++) {
    const e = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (e.code === UNDEFINED_TABLE) return true;
    if (
      typeof e.message === "string" &&
      MENTIONS_SOCIAL_TABLE.test(e.message)
    ) {
      return true;
    }
    current = e.cause;
  }
  return false;
}
