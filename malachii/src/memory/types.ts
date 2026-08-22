/** Section 34: the six maturity levels, ordered. Ordinals are load-bearing. */
export const MATURITY_ORDER = [
  "M0_OBSERVATION",
  "M1_CANDIDATE",
  "M2_CORROBORATED",
  "M3_VALIDATED",
  "M4_PROCEDURALIZED",
  "M5_CONSTITUTIONAL",
] as const;

export type Maturity = (typeof MATURITY_ORDER)[number];

export function maturityRank(m: Maturity): number {
  return MATURITY_ORDER.indexOf(m);
}

export function nextMaturity(m: Maturity): Maturity | null {
  return MATURITY_ORDER[maturityRank(m) + 1] ?? null;
}

export type MemoryStatus =
  | "active"
  | "cooled"
  | "quarantined"
  | "deprecated"
  | "archived"
  | "revoked";

/** Statuses whose members never appear in retrieval or any context packet. */
export const NON_RETRIEVABLE_STATUSES: ReadonlySet<MemoryStatus> = new Set([
  "quarantined",
  "archived",
  "revoked",
]);

export interface SourceRef {
  readonly sourceId: string;
  readonly locator?: string;
}

export interface MemoryRelation {
  readonly kind: "supports" | "contradicts" | "supersedes" | "refines";
  readonly memoryId: string;
  /** A contradiction blocks promotion to M2 until explicitly resolved. */
  readonly blocking?: boolean;
  readonly resolved?: boolean;
}

/**
 * Compile-time half of the trust boundary. Any of these keys on a create call is
 * a type error; the runtime guard in `assertNoTrustBearingFields` catches callers
 * who reach the API through `any`, JSON, or another language.
 */
interface TrustFieldsForbidden {
  readonly maturity?: never;
  readonly effectiveMaturity?: never;
  readonly trusted?: never;
  readonly verified?: never;
  readonly attested?: never;
  readonly assurance?: never;
  readonly trustTier?: never;
  readonly trust_override?: never;
  readonly trustOverride?: never;
  readonly authorityTier?: never;
  readonly independentSourceCount?: never;
  readonly supportingEvidenceCount?: never;
  readonly contradictionCount?: never;
  readonly regressionPassed?: never;
  readonly approvedBySuperUser?: never;
  readonly raisesAuthority?: never;
  readonly successfulUseCount?: never;
  readonly failedUseCount?: never;
}

export interface CreateMemoryFields {
  readonly layer: string;
  readonly statement: string;
  readonly scope: string;
  /** Raw ids only. They are resolved to verified refs by the Evidence Resolver. */
  readonly evidenceIds?: readonly string[];
  readonly sourceRefs?: readonly SourceRef[];
  readonly validFrom?: number;
  readonly validUntil?: number;
  readonly relations?: readonly MemoryRelation[];
  /** What the author *claims* to believe. Never influences maturity. */
  readonly reportedConfidence?: number;
  readonly importance?: number;
}

export type CreateMemoryInput = CreateMemoryFields & TrustFieldsForbidden;

export interface MemoryRecord {
  readonly memoryId: string;
  readonly layer: string;
  readonly statement: string;
  readonly scope: string;
  readonly contentHash: string;
  readonly createdAt: number;
  readonly evidenceIds: readonly string[];
  readonly sourceRefs: readonly SourceRef[];
  readonly relations: readonly MemoryRelation[];
  readonly reportedConfidence: number | null;
  readonly importance: number | null;
  readonly validFrom: number | null;
  readonly validUntil: number | null;
  /**
   * Projection only (section 35). Canonical maturity is derived by ledger replay;
   * this field is a cache and is reconciled against the ledger at startup.
   */
  readonly storedMaturity: Maturity;
  readonly status: MemoryStatus;
  /** Set for imported records whose historical maturity has no replayable proof. */
  readonly legacyTrustState?: "LEGACY_UNVERIFIED";
  readonly historicalStoredMaturity?: Maturity;
}

/**
 * The immutable half of a record — everything fixed at creation. The ledger
 * carries this in full, which is what makes the projection a true cache: it can
 * be deleted and rebuilt from the log alone.
 */
export type MemoryCreationPayload = Omit<
  MemoryRecord,
  "storedMaturity" | "status" | "legacyTrustState" | "historicalStoredMaturity"
>;

/** Telemetry lives in its own record so it has no path to maturity (section 46). */
export interface MemoryTelemetry {
  readonly retrievalCount: number;
  readonly lastRetrievedAt: number | null;
}
