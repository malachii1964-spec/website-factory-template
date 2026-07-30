import type { MemoryStore } from "../memory/store.ts";
import type { Memory, Origin } from "../core/types.ts";
import { tokenize } from "../memory/embed.ts";

/**
 * The standards shelf — the brain's answer to "what does good look like?"
 *
 * Everything else in memory is about Malachi or about a project. A standard is
 * about the world: the current bar for some class of work, sourced and dated.
 * It exists because comparing the work only against its own previous version
 * measures motion, not quality — the brain can improve steadily and still be
 * nowhere near what the field already considers table stakes.
 *
 * Two properties keep it honest:
 *
 *   Expiry, not decay. A version number or a platform requirement is right
 *   until it is wrong; it does not gently become less true. So a standard
 *   carries a deadline and is refused once past it, rather than quietly losing
 *   score like an old episodic memory.
 *
 *   Quarantine before trust. A standard found by search is a claim, not an
 *   authority. It arrives quarantined and is not allowed to gate any work until
 *   something confirms it — the same rule that already stops a mis-extracted
 *   lesson from gaining confidence merely by being repeated.
 */

/** How long a standard stays current, by how fast its subject actually moves. */
export const VOLATILITY_DAYS = {
  /** Framework versions, model names, pricing, API surfaces. */
  fast: 30,
  /** Platform requirements, tooling conventions, library ecosystems. */
  medium: 120,
  /** Accessibility rules, protocol specs, security fundamentals. */
  slow: 365,
} as const;

export type Volatility = keyof typeof VOLATILITY_DAYS;

/** Marks a standard as claimed-but-unconfirmed. Quarantined standards never gate work. */
export const QUARANTINE_TAG = "quarantined";

const DAY_MS = 86_400_000;

export interface RecordStandardInput {
  /** What the current bar actually is. */
  claim: string;
  /** The class of work this governs, e.g. "building a public marketing site". */
  scope: string;
  /** Where the claim came from — a URL, a spec name, a doc title. Required: an unsourced standard is an opinion. */
  source: string;
  /** How fast this subject moves. Decides the expiry date. */
  volatility?: Volatility;
  origin?: Origin;
  project?: string | null;
  tags?: string[];
  /**
   * Skip quarantine. Only for a standard Malachi states himself — his ruling is
   * the authority, so there is nothing left to confirm it against.
   */
  trusted?: boolean;
  now?: number;
}

export async function recordStandard(
  store: MemoryStore,
  input: RecordStandardInput,
): Promise<Memory> {
  const now = input.now ?? Date.now();
  const volatility = input.volatility ?? "medium";
  const trusted = input.trusted ?? false;

  return store.remember({
    kind: "standard",
    title: `Standard — ${input.scope}`,
    body: input.claim,
    // Reuses the procedural trigger field: a standard, like a lesson, is only
    // useful when something makes it relevant, and this keeps it retrievable by
    // the scope wording as well as the claim's.
    appliesWhen: input.scope,
    originRef: input.source,
    origin: input.origin ?? (trusted ? "user" : "web"),
    project: input.project ?? null,
    tags: [...(input.tags ?? []), volatility, ...(trusted ? [] : [QUARANTINE_TAG])],
    staleAfter: now + VOLATILITY_DAYS[volatility] * DAY_MS,
  });
}

export function isStale(standard: Memory, now = Date.now()): boolean {
  return standard.staleAfter !== null && standard.staleAfter <= now;
}

export function isQuarantined(standard: Memory): boolean {
  return standard.tags.includes(QUARANTINE_TAG);
}

/** A standard may gate work only if it is confirmed and still current. */
export function isUsable(standard: Memory, now = Date.now()): boolean {
  return !isStale(standard, now) && !isQuarantined(standard);
}

/**
 * Whether a standard is about the thing being asked about at all.
 *
 * Ranked recall alone is not safe enough here. The scorer is additive, so an
 * entirely irrelevant memory still lands near 0.4 on priors alone, and the
 * candidate pool always includes recent rows whether or not they matched — so
 * "what is the standard for X?" on an unresearched X returned whatever standard
 * happened to be newest. For advice that is merely wrong-ish, that's a bad
 * suggestion; for the shelf that decides whether work passes, it means gating a
 * build against a rule from an unrelated subject.
 *
 * So relevance is confirmed deterministically instead of trusted from a score:
 * at least one meaningful stemmed term must be shared with the standard's own
 * scope or claim. Unigrams only — bigrams from `tokenize` would make a single
 * shared word count twice.
 */
function overlapsScope(standard: Memory, query: string): boolean {
  const unigrams = (text: string) => new Set(tokenize(text).filter((t) => !t.includes("~")));
  const asked = unigrams(query);
  if (asked.size === 0) return false;
  const covered = unigrams(`${standard.appliesWhen ?? ""} ${standard.title} ${standard.body}`);
  for (const term of asked) if (covered.has(term)) return true;
  return false;
}

export interface StandardsLookup {
  /** Confirmed and current — safe to measure work against. */
  usable: Memory[];
  /** Matched the scope but cannot gate work yet, and why. */
  unusable: { standard: Memory; reason: "stale" | "quarantined" }[];
}

/**
 * What the shelf holds for a piece of work about to start.
 *
 * Returns the unusable matches too, rather than hiding them: "we have a
 * standard for this but it expired in March" is the signal that a refresh is
 * needed, and silently returning nothing would look identical to never having
 * researched the subject at all.
 */
export async function lookupStandards(
  store: MemoryStore,
  scope: string,
  options: { project?: string | null; limit?: number; now?: number } = {},
): Promise<StandardsLookup> {
  const now = options.now ?? Date.now();
  const results = await store.recall({
    query: scope,
    kinds: ["standard"],
    limit: options.limit ?? 5,
    markUsed: false,
    ...(options.project !== undefined ? { project: options.project } : {}),
  });

  const usable: Memory[] = [];
  const unusable: StandardsLookup["unusable"] = [];
  for (const { memory } of results) {
    if (!overlapsScope(memory, scope)) continue;
    if (isStale(memory, now)) unusable.push({ standard: memory, reason: "stale" });
    else if (isQuarantined(memory)) unusable.push({ standard: memory, reason: "quarantined" });
    else usable.push(memory);
  }
  return { usable, unusable };
}

/** Everything past its expiry date — the refresh queue. */
export function staleStandards(store: MemoryStore, now = Date.now()): Memory[] {
  return store
    .list({ kind: "standard", limit: 1000 })
    .filter((standard) => isStale(standard, now));
}

/**
 * Promote a quarantined standard to one that may gate work.
 *
 * Separate from `store.reinforce` on purpose: confidence and quarantine answer
 * different questions. Confidence is how strongly the claim is believed;
 * quarantine is whether anything other than a search result has vouched for it.
 * A claim can be believed at 0.9 and still be unvouched.
 */
export function trustStandard(store: MemoryStore, id: string): Memory | null {
  const standard = store.get(id);
  if (!standard) return null;
  if (!isQuarantined(standard)) return standard;

  const tags = standard.tags.filter((tag) => tag !== QUARANTINE_TAG);
  store.db
    .prepare("UPDATE memories SET tags = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(tags), Date.now(), id);
  store.logEvent({
    kind: "standard.trusted",
    project: standard.project,
    summary: `Standard vouched for: ${standard.title}`,
    payload: { id, source: standard.originRef },
  });
  return store.get(id);
}

/**
 * Re-verify a standard whose deadline passed.
 *
 * If the claim still holds, the deadline moves and the standard keeps its
 * confidence history. If it changed, the old one is superseded rather than
 * edited, so what the brain used to believe stays readable.
 */
export async function refreshStandard(
  store: MemoryStore,
  id: string,
  next: { claim: string; source: string; volatility?: Volatility; now?: number },
): Promise<Memory | null> {
  const current = store.get(id);
  if (!current) return null;
  const now = next.now ?? Date.now();
  const volatility = next.volatility ?? inferVolatility(current);
  const staleAfter = now + VOLATILITY_DAYS[volatility] * DAY_MS;

  if (next.claim.trim() === current.body.trim()) {
    store.db
      .prepare("UPDATE memories SET stale_after = ?, origin_ref = ?, updated_at = ? WHERE id = ?")
      .run(staleAfter, next.source, now, id);
    store.logEvent({
      kind: "standard.reverified",
      project: current.project,
      summary: `Standard still current: ${current.title}`,
      payload: { id, source: next.source, until: staleAfter },
    });
    return store.get(id);
  }

  return store.supersede(
    id,
    {
      kind: "standard",
      title: current.title,
      body: next.claim,
      appliesWhen: current.appliesWhen,
      originRef: next.source,
      origin: "web",
      project: current.project,
      // A changed claim is a fresh claim: back into quarantine regardless of how
      // trusted the one it replaces had become.
      tags: [...current.tags.filter((t) => !isVolatility(t) && t !== QUARANTINE_TAG), volatility, QUARANTINE_TAG],
      staleAfter,
    },
    "the standard changed on re-verification",
  );
}

function isVolatility(tag: string): tag is Volatility {
  return tag in VOLATILITY_DAYS;
}

function inferVolatility(standard: Memory): Volatility {
  return standard.tags.find(isVolatility) ?? "medium";
}
