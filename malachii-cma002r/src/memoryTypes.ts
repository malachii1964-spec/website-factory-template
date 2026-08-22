import type {
  ApprovalNonceLedger,
  SuperUserApproval,
  SuperUserKeyRegistry,
} from "./superUserApproval.js";
import type { SourceLineageRegistry } from "./sourceLineage.js";

export type MemoryLayer =
  | "evidence"
  | "working"
  | "identity"
  | "episodic"
  | "semantic"
  | "procedural"
  | "meta";

export type MemoryMaturity =
  | "M0_OBSERVATION"
  | "M1_CANDIDATE"
  | "M2_CORROBORATED"
  | "M3_VALIDATED"
  | "M4_PROCEDURALIZED"
  | "M5_CONSTITUTIONAL";

export type MemoryStatus = "active" | "cool" | "archived" | "deprecated" | "superseded" | "quarantined";
export type OutcomeResult = "success" | "partial" | "failure";

export interface MemoryAssertion {
  subject: string;
  predicate: string;
  object: string;
}

export interface MemorySourceRef {
  id: string;
  kind: "event" | "artifact" | "tool_output" | "user_instruction" | "external_source" | "memory" | "test";
  sourceGroup: string;
  uri?: string;
  hash?: string;
}

export interface MemoryProvenance {
  createdBy: string;
  createdAt: string;
  observedAt?: string;
  sourceRefs: MemorySourceRef[];
  derivedFromMemoryIds: string[];
}

export interface MemoryOutcomeLink {
  id: string;
  result: OutcomeResult;
  impact: number;
  timestamp: string;
  evidenceIds: string[];
  /**
   * Who attested this outcome. SUAF F-003: an actor reporting that its own
   * memory succeeded is not validation. Defaults to the record's creator --
   * the conservative reading, where an unattributed outcome is self-reported.
   */
  attestedBy: string;
}

export interface MemoryRelation {
  type: "supports" | "contradicts" | "derived_from" | "related_to" | "implements" | "supersedes";
  targetMemoryId: string;
  confidence: number;
}

export interface MemoryRecord {
  id: string;
  layer: MemoryLayer;
  maturity: MemoryMaturity;
  status: MemoryStatus;
  scope: string[];
  subject: string;
  statement: string;
  assertion?: MemoryAssertion;
  confidence: number;
  importance: number;
  tags: string[];
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  provenance: MemoryProvenance;
  evidenceIds: string[];
  relations: MemoryRelation[];
  outcomes: MemoryOutcomeLink[];
  retrievalCount: number;
  successfulUseCount: number;
  failedUseCount: number;
  fitness: number;
  supersedes: string[];
  supersededBy?: string;
}

export interface CreateMemoryInput {
  id?: string;
  layer: MemoryLayer;
  status?: MemoryStatus;
  scope: string[];
  subject: string;
  statement: string;
  assertion?: MemoryAssertion;
  confidence: number;
  importance: number;
  tags?: string[];
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
  observedAt?: string;
  sourceRefs?: MemorySourceRef[];
  derivedFromMemoryIds?: string[];
  evidenceIds?: string[];
  relations?: MemoryRelation[];
  supersedes?: string[];
}

export interface MemoryQuery {
  text: string;
  layers?: MemoryLayer[];
  scopes?: string[];
  atTime?: string;
  tags?: string[];
  includeArchived?: boolean;
  allowGlobal?: boolean;
  limit?: number;
}

export interface RetrievedMemory {
  memory: MemoryRecord;
  score: number;
  reasons: string[];
}

export interface MemoryConflict {
  existingMemoryId: string;
  candidateSubject: string;
  candidatePredicate: string;
  existingObject: string;
  candidateObject: string;
  reason: "structured_assertion_conflict" | "free_text_polarity_conflict";
}

/**
 * SUAF §2.1: every count is derived from the persisted record. These fields are
 * still accepted so existing callers compile, and are then ignored --
 * `promotionDecision` reads none of them. `approvedBySuperUser` is typed
 * `never` (§2.3): there is no longer any boolean that grants Super-User
 * authority, and a stale caller setting it now fails to compile rather than
 * silently doing nothing.
 */
export interface PromotionEvidence {
  /** @deprecated Ignored. Derived from `record.evidenceIds`. */
  supportingEvidenceCount?: number;
  /** @deprecated Ignored. Derived from distinct `sourceGroup` values. */
  independentSourceCount?: number;
  /** @deprecated Ignored. Derived from relations plus live structured conflicts. */
  contradictionCount?: number;
  /** @deprecated Ignored. Regression ids now live inside the signed approval. */
  regressionPassed?: boolean;
  /** @deprecated Removed in v1.1. A boolean cannot carry Super-User authority. */
  approvedBySuperUser?: never;
  /** @deprecated Ignored. A ledger id any caller may append is not an approval. */
  approvalEventId?: string;
  /** @deprecated Ignored. */
  regressionEventId?: string;
}

/**
 * What `promotionDecision` actually consumes. There is deliberately no field
 * here a caller can set to assert a verdict: the approval is a signature the
 * function verifies itself, against a registry the caller does not control.
 */
export interface PromotionInput {
  superUserApproval?: SuperUserApproval;
  keyRegistry: SuperUserKeyRegistry;
  nonces: ApprovalNonceLedger;
  /** Deployment-configured source lineage. Defaults to permissive. */
  lineage?: SourceLineageRegistry;
  /** Live structured conflicts found by the fabric at promotion time. */
  liveConflictCount?: number;
  now?: Date;
}

export interface DerivedPromotionFacts {
  supportingEvidenceCount: number;
  independentSourceCount: number;
  contradictionCount: number;
  independentOutcomeCount: number;
}

export interface PromotionDecision {
  decision: "permit" | "review_required" | "deny";
  reason: string;
}

export interface LearningProposal {
  id: string;
  trigger: "failure" | "success_pattern" | "correction" | "benchmark" | "explicit_instruction";
  rootCause: string;
  proposedRule: string;
  scope: string[];
  confidence: number;
  evidenceIds: string[];
  sourceMemoryIds: string[];
  regressionTestIds: string[];
  targetKind: "working_memory" | "project_instruction" | "project_file" | "skill" | "policy" | "constitution";
  raisesAuthority: boolean;
  reversible: boolean;
  status: "proposed" | "approved" | "rejected" | "applied";
  createdAt: string;
}

export interface FailureLearningInput {
  id?: string;
  rootCause: string;
  repair: string;
  reusableRule: string;
  scope: string[];
  severity: "low" | "medium" | "high" | "critical";
  evidenceIds: string[];
  sourceMemoryIds: string[];
  regressionTestIds?: string[];
  targetKind?: LearningProposal["targetKind"];
  confidence: number;
}
