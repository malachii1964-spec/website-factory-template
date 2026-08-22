import type { MemoryRecord, MemorySourceRef } from "./memoryTypes.js";

/**
 * Lineage roots, replacing declared `sourceGroup` as the unit of independence.
 *
 * Both the CMA-001 audit and the v0.1 build report named the same weakness: a
 * `sourceGroup` is a string the writer chooses, so two mirrors of one origin
 * that declare different groups count as two independent sources. Counting
 * distinct declared groups measures how many labels someone typed, not how many
 * places the claim actually came from.
 *
 * This registry is configured out of band -- it is deployment configuration,
 * not memory. Nothing inside MEMF may add to it at runtime, which is what keeps
 * SUAF §0 law 1 ("memory never creates authority") true for independence too.
 */

export class SourceLineageCycle extends Error {
  constructor(group: string) {
    super(`source_lineage_cycle_at_${group}`);
  }
}

export interface SourceGroupRegistration {
  group: string;
  /**
   * The group this one derives from. Two mirrors of one wire service both
   * declare the wire service here; that is what collapses them to one root.
   */
  derivedFrom?: string;
}

export class SourceLineageRegistry {
  readonly #parents = new Map<string, string | null>();
  readonly #strict: boolean;

  /**
   * `strict` decides what an *unregistered* group means.
   *
   * Non-strict (default, matches prior behaviour): it is its own root. Permissive
   * -- unregistered provenance still buys independence, which is the hole.
   *
   * Strict: it contributes nothing. Independence then requires provenance that
   * somebody registered on purpose, which is the whole point. New deployments
   * should run strict; the default stays permissive so turning it on is a
   * deliberate, visible change rather than a silent behaviour shift.
   */
  constructor(options: { strict?: boolean } = {}) {
    this.#strict = options.strict ?? false;
  }

  get strict(): boolean {
    return this.#strict;
  }

  register(registration: SourceGroupRegistration): void {
    this.#parents.set(registration.group, registration.derivedFrom ?? null);
    if (registration.derivedFrom && !this.#parents.has(registration.derivedFrom)) {
      // Declaring a parent implicitly registers it as a root, so callers do not
      // have to register origins in dependency order.
      this.#parents.set(registration.derivedFrom, null);
    }
  }

  has(group: string): boolean {
    return this.#parents.has(group);
  }

  /** Walks to the origin. Returns null when the group cannot contribute independence. */
  rootOf(group: string): string | null {
    const trimmed = group.trim();
    if (!trimmed) return null;
    if (!this.#parents.has(trimmed)) return this.#strict ? null : trimmed;

    const seen = new Set<string>();
    let current = trimmed;
    for (;;) {
      if (seen.has(current)) throw new SourceLineageCycle(current);
      seen.add(current);
      const parent = this.#parents.get(current);
      if (parent === undefined || parent === null) return current;
      current = parent;
    }
  }

  /**
   * The independence count. Distinct *roots*, not distinct declared groups and
   * not the number of refs.
   */
  independentRoots(refs: readonly MemorySourceRef[]): Set<string> {
    const roots = new Set<string>();
    for (const ref of refs ?? []) {
      if (typeof ref?.sourceGroup !== "string") continue;
      const root = this.rootOf(ref.sourceGroup);
      if (root) roots.add(root);
    }
    return roots;
  }
}

/** A registry that registers nothing and rejects nothing: prior behaviour, made explicit. */
export const PERMISSIVE_LINEAGE = new SourceLineageRegistry({ strict: false });

export function independentRootCount(
  record: MemoryRecord,
  registry: SourceLineageRegistry = PERMISSIVE_LINEAGE,
): number {
  return registry.independentRoots(record.provenance?.sourceRefs ?? []).size;
}
