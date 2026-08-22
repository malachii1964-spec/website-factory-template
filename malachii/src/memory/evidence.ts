import { sha256Text } from "../crypto/hash.ts";
import { InvalidRequestError, TrustBoundaryViolation } from "../trust/errors.ts";

/**
 * Evidence plane. `VerifiedEvidenceRef` carries a private brand, so it cannot be
 * constructed by a caller — only `EvidenceResolver.resolve` mints one, and only
 * after re-hashing the stored artefact. A T0 caller can therefore hand the
 * promotion engine evidence *ids*, never evidence *verdicts* (section 36).
 */

/**
 * Compile-time brand. It is `declare`d, so it has no runtime key an attacker
 * could copy onto a plain object; the matching runtime guarantee is the
 * `MINTED` registry below.
 */
declare const VERIFIED_BRAND: unique symbol;

/** Every ref the resolver has ever minted. Nothing else can add to it. */
const MINTED = new WeakSet<object>();

/** Runtime counterpart to the brand, for callers crossing a trust boundary. */
export function isVerifiedEvidenceRef(value: unknown): value is VerifiedEvidenceRef {
  return typeof value === "object" && value !== null && MINTED.has(value);
}

export type EvidenceKind =
  | "artifact"
  | "execution_receipt"
  | "test_receipt"
  | "regression_receipt"
  | "observation"
  | "document";

export interface EvidenceArtifact {
  readonly evidenceId: string;
  readonly kind: EvidenceKind;
  readonly content: string;
  readonly sourceId: string;
  readonly createdAt: number;
}

export interface VerifiedEvidenceRef {
  readonly [VERIFIED_BRAND]: true;
  readonly evidenceId: string;
  readonly kind: EvidenceKind;
  readonly objectHash: string;
  readonly lineageRootId: string;
  readonly sourceId: string;
  readonly createdAt: number;
  readonly verified: true;
}

export interface SourceRegistration {
  readonly sourceId: string;
  /**
   * The source this one is derived from, if any. Two mirrors of one wire story
   * should both declare the wire service here — otherwise they will be counted
   * as two independent roots. See `deriveLineageRoot`.
   */
  readonly derivedFrom?: string;
}

export class SourceRegistry {
  readonly #parents = new Map<string, string | null>();

  register(registration: SourceRegistration): void {
    this.#parents.set(registration.sourceId, registration.derivedFrom ?? null);
  }

  has(sourceId: string): boolean {
    return this.#parents.has(sourceId);
  }

  /**
   * Walks to the root of the derivation chain. An unregistered source is its own
   * root — the permissive direction, and the single biggest place a real
   * deployment must invest: unregistered provenance inflates independence.
   */
  deriveLineageRoot(sourceId: string): string {
    const seen = new Set<string>();
    let current = sourceId;
    for (;;) {
      if (seen.has(current)) {
        throw new InvalidRequestError(`cycle in source lineage at "${current}"`);
      }
      seen.add(current);
      const parent = this.#parents.get(current);
      if (parent === undefined || parent === null) return current;
      current = parent;
    }
  }
}

export class EvidenceStore {
  readonly #artifacts = new Map<string, EvidenceArtifact>();

  put(artifact: EvidenceArtifact): void {
    this.#artifacts.set(artifact.evidenceId, artifact);
  }

  get(evidenceId: string): EvidenceArtifact | undefined {
    return this.#artifacts.get(evidenceId);
  }
}

export class EvidenceResolver {
  readonly #store: EvidenceStore;
  readonly #sources: SourceRegistry;

  constructor(store: EvidenceStore, sources: SourceRegistry) {
    this.#store = store;
    this.#sources = sources;
  }

  /**
   * Returns a verified ref, or throws. Never returns a partially trusted result:
   * a phantom evidence id is an error, not an empty list, so a promotion request
   * cannot quietly proceed on fewer refs than it claimed (ATK-007).
   */
  resolve(evidenceId: string): VerifiedEvidenceRef {
    const artifact = this.#store.get(evidenceId);
    if (!artifact) {
      throw new TrustBoundaryViolation(`evidence not found: ${evidenceId}`, [evidenceId]);
    }
    const objectHash = sha256Text(artifact.content);
    const lineageRootId = this.#sources.deriveLineageRoot(artifact.sourceId);
    const ref = {
      evidenceId: artifact.evidenceId,
      kind: artifact.kind,
      objectHash,
      lineageRootId,
      sourceId: artifact.sourceId,
      createdAt: artifact.createdAt,
      verified: true,
    } as unknown as VerifiedEvidenceRef;
    MINTED.add(ref);
    return ref;
  }

  resolveAll(evidenceIds: readonly string[]): VerifiedEvidenceRef[] {
    return evidenceIds.map((id) => this.resolve(id));
  }
}

/**
 * Section 37: independence is counted over distinct lineage roots, not over
 * refs and not over reviewers. Three agents quoting one source is one root.
 */
export function countIndependentRoots(refs: readonly VerifiedEvidenceRef[]): number {
  return new Set(refs.map((r) => r.lineageRootId)).size;
}

export function independentRootIds(refs: readonly VerifiedEvidenceRef[]): string[] {
  return [...new Set(refs.map((r) => r.lineageRootId))].sort();
}
