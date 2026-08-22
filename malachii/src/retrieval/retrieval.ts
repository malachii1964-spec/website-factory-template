import { AuthorizationError, InvalidRequestError } from "../trust/errors.ts";
import { assertNoTrustBearingFields } from "../trust/forbiddenFields.ts";
import { requireScope, type SecurityContext } from "../trust/authority.ts";
import {
  maturityRank,
  NON_RETRIEVABLE_STATUSES,
  type Maturity,
  type MemoryRecord,
} from "../memory/types.ts";

/**
 * Section 43: every security filter runs before ranking. Ranking is allowed to
 * change the order of what a caller may see; it must never be able to change
 * *what* they may see, so it is the last step and it operates on an already
 * authorised set.
 */

export const GLOBAL_SCOPE = "global";
export const SCOPE_RETRIEVE = "memory.retrieve";
export const SCOPE_LIST = "memory.list";

export interface RetrievalQuery {
  readonly query: string;
  readonly scopes?: readonly string[];
  /** Section 44: `global` is never a wildcard. It must be asked for by name. */
  readonly includeGlobal?: boolean;
  readonly minMaturity?: Maturity;
  readonly at?: number;
  readonly limit?: number;
}

export interface RetrievalResult {
  readonly record: MemoryRecord;
  readonly effectiveMaturity: Maturity;
  readonly score: number;
}

export interface RetrievalInputs {
  /**
   * A supplier, deliberately not a collection. Handing retrieval a materialised
   * snapshot lets a caller keep querying state captured before a revocation —
   * which is precisely the revoked-memory cache escape (ATK-020). Reading live
   * on every call makes that unrepresentable.
   */
  readonly records: () => readonly MemoryRecord[];
  readonly effectiveMaturity: (memoryId: string) => Maturity;
  readonly now?: () => number;
}

export function retrieve(
  context: SecurityContext,
  query: RetrievalQuery,
  inputs: RetrievalInputs,
): RetrievalResult[] {
  assertNoTrustBearingFields(query, "retrieval query");
  requireScope(context, SCOPE_RETRIEVE);

  // Section 45: a blank query is an enumeration attempt wearing a search's
  // clothes. Listing is a separate, separately authorised capability.
  if (query.query.trim().length === 0) {
    throw new InvalidRequestError(
      "blank retrieval query is not permitted; use listMemory with memory.list scope",
    );
  }

  const now = (inputs.now ?? Date.now)();
  const at = query.at ?? now;

  const requested = query.scopes;
  const authorized = new Set(context.effectiveScopes);
  if (requested) {
    const denied = requested.filter((s) => s !== GLOBAL_SCOPE && !authorized.has(s));
    if (denied.length > 0) {
      throw new AuthorizationError(`scopes not authorised: ${denied.join(", ")}`);
    }
  }

  const includeGlobal = query.includeGlobal === true;
  if (includeGlobal && !context.mayReadGlobal) {
    throw new AuthorizationError("principal may not read global scope");
  }

  const scopeAllowed = (scope: string): boolean => {
    if (scope === GLOBAL_SCOPE) return includeGlobal && context.mayReadGlobal;
    if (requested) return requested.includes(scope) && authorized.has(scope);
    return authorized.has(scope);
  };

  const minRank = query.minMaturity ? maturityRank(query.minMaturity) : -1;
  const terms = tokenize(query.query);

  const permitted: RetrievalResult[] = [];
  for (const record of inputs.records()) {
    if (NON_RETRIEVABLE_STATUSES.has(record.status)) continue;
    if (!scopeAllowed(record.scope)) continue;
    if (record.validFrom !== null && at < record.validFrom) continue;
    if (record.validUntil !== null && at > record.validUntil) continue;

    const effectiveMaturity = inputs.effectiveMaturity(record.memoryId);
    if (maturityRank(effectiveMaturity) < minRank) continue;

    const score = scoreRecord(record, terms);
    if (score <= 0) continue;
    permitted.push({ record, effectiveMaturity, score });
  }

  permitted.sort((a, b) => b.score - a.score || a.record.memoryId.localeCompare(b.record.memoryId));
  return query.limit === undefined ? permitted : permitted.slice(0, query.limit);
}

/** Enumeration, as its own capability with its own scope (section 45). */
export function listMemory(
  context: SecurityContext,
  inputs: RetrievalInputs,
): readonly MemoryRecord[] {
  requireScope(context, SCOPE_LIST);
  const authorized = new Set(context.effectiveScopes);
  return inputs.records().filter((record) => {
    if (NON_RETRIEVABLE_STATUSES.has(record.status)) return false;
    if (record.scope === GLOBAL_SCOPE) return context.mayReadGlobal;
    return authorized.has(record.scope);
  });
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
}

function scoreRecord(record: MemoryRecord, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const haystack = tokenize(record.statement);
  const present = new Set(haystack);
  const hits = terms.filter((term) => present.has(term)).length;
  return hits === 0 ? 0 : hits / terms.length;
}
