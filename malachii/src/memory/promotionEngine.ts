import type { Constitution } from "../trust/constitution";
import { InvalidRequestError } from "../trust/errors";
import { assertNoTrustBearingFields } from "../trust/forbiddenFields";
import {
  countIndependentRoots,
  independentRootIds,
  type EvidenceResolver,
  type VerifiedEvidenceRef,
} from "./evidence";
import {
  type ApprovalVerifier,
  type OutcomeVerifier,
  type SignedApprovalReceipt,
  type SignedOutcomeReceipt,
} from "./receipts";
import { MATURITY_ORDER, maturityRank, type Maturity, type MemoryRecord } from "./types";

/**
 * The promotion engine is where the spec's central claim has to be true or false:
 * a caller supplies *references*, and the engine — not the caller — reaches the
 * verdict. Nothing on `PromotionRequest` is a trust value.
 */

export interface PromotionRequest {
  readonly memoryId: string;
  readonly targetMaturity: Maturity;
  readonly evidenceRefIds?: readonly string[];
  readonly outcomeReceipts?: readonly SignedOutcomeReceipt[];
  readonly regressionReceipts?: readonly SignedOutcomeReceipt[];
  readonly reviewReceipts?: readonly SignedOutcomeReceipt[];
  readonly approvalReceipts?: readonly SignedApprovalReceipt[];
  readonly procedureArtifactId?: string;
  readonly rollbackPlanId?: string;
  readonly authorityAnalysisId?: string;
  readonly reason: string;
}

export type Disposition = "PROMOTED" | "DENIED";

export interface PromotionDecision {
  readonly disposition: Disposition;
  readonly memoryId: string;
  readonly currentMaturity: Maturity;
  readonly requestedMaturity: Maturity;
  readonly verifiedEvidenceCount: number;
  readonly independentRootCount: number;
  readonly independentRoots: readonly string[];
  readonly unresolvedContradictions: number;
  readonly verifiedOutcomeCount: number;
  readonly verifiedRegressionCount: number;
  readonly independentReviewCount: number;
  readonly validApprovalCount: number;
  readonly reasons: readonly string[];
}

export class PromotionEngine {
  constructor(
    private readonly constitution: Constitution,
    private readonly evidence: EvidenceResolver,
    private readonly approvals: ApprovalVerifier,
    private readonly outcomes: OutcomeVerifier,
  ) {}

  evaluate(
    record: MemoryRecord,
    currentMaturity: Maturity,
    request: PromotionRequest,
  ): PromotionDecision {
    assertNoTrustBearingFields(request, "promotion request");

    if (!MATURITY_ORDER.includes(request.targetMaturity)) {
      throw new InvalidRequestError(`unknown maturity: ${request.targetMaturity}`);
    }
    if (request.reason.trim().length === 0) {
      throw new InvalidRequestError("promotion request must state a reason");
    }

    const denials: string[] = [];
    const target = request.targetMaturity;
    const targetRank = maturityRank(target);
    const currentRank = maturityRank(currentMaturity);

    // Section 34: no direct M5, and no level skipping in general. Each step has
    // to be earned and ledgered separately, which also keeps the audit readable.
    if (targetRank !== currentRank + 1) {
      denials.push(
        targetRank <= currentRank
          ? `target ${target} does not advance beyond current ${currentMaturity}`
          : `promotion must advance exactly one level (from ${currentMaturity})`,
      );
    }

    if (record.status !== "active") {
      denials.push(`memory status is "${record.status}"; only active memory may be promoted`);
    }

    // Every ref is resolved by the resolver. A phantom id throws rather than
    // silently shrinking the count (ATK-007).
    const refs: VerifiedEvidenceRef[] = this.evidence.resolveAll(request.evidenceRefIds ?? []);
    const independentRoots = independentRootIds(refs);
    const rootCount = countIndependentRoots(refs);
    const unresolvedContradictions = record.relations.filter(
      (r) => r.kind === "contradicts" && r.blocking === true && r.resolved !== true,
    ).length;

    const verifiedOutcomes = this.#verifiedSuccesses(request.outcomeReceipts, "outcome");
    const verifiedRegressions = this.#verifiedSuccesses(request.regressionReceipts, "regression");
    const verifiedReviews = this.#verifiedSuccesses(request.reviewReceipts, "review");

    // "Independent" review means a different signer from every outcome signer.
    // Same worker re-running itself is repetition, not corroboration (section 100).
    const outcomeSigners = new Set(verifiedOutcomes.map((r) => r.signerFingerprint));
    const independentReviews = verifiedReviews.filter(
      (r) => !outcomeSigners.has(r.signerFingerprint),
    );

    const validApprovals = this.#validApprovals(record, target, request.approvalReceipts);

    // Requirements are cumulative: reaching M3 re-proves M1 and M2 rather than
    // trusting that they held when they were first granted.
    if (targetRank >= maturityRank("M1_CANDIDATE") && refs.length < 1) {
      denials.push("M1_CANDIDATE requires at least one verified evidence reference");
    }
    if (targetRank >= maturityRank("M2_CORROBORATED")) {
      if (rootCount < this.constitution.corroborationThreshold) {
        denials.push(
          `M2_CORROBORATED requires ${this.constitution.corroborationThreshold} independent evidence roots; found ${rootCount}`,
        );
      }
      if (unresolvedContradictions > 0) {
        denials.push(
          `M2_CORROBORATED blocked by ${unresolvedContradictions} unresolved contradiction(s)`,
        );
      }
    }
    if (targetRank >= maturityRank("M3_VALIDATED")) {
      if (verifiedOutcomes.length < 1) {
        denials.push("M3_VALIDATED requires a verified successful outcome receipt");
      }
      if (verifiedRegressions.length < 1) {
        denials.push("M3_VALIDATED requires a verified successful regression receipt");
      }
    }
    if (targetRank >= maturityRank("M4_PROCEDURALIZED")) {
      if (!request.procedureArtifactId) {
        denials.push("M4_PROCEDURALIZED requires a reusable procedure artifact");
      } else {
        this.evidence.resolve(request.procedureArtifactId);
      }
      if (!request.rollbackPlanId) {
        denials.push("M4_PROCEDURALIZED requires a rollback plan");
      } else {
        this.evidence.resolve(request.rollbackPlanId);
      }
      if (record.scope === "global") {
        denials.push("M4_PROCEDURALIZED requires bounded scope; \"global\" is not bounded");
      }
    }
    if (targetRank >= maturityRank("M5_CONSTITUTIONAL")) {
      if (validApprovals.length < 1) {
        denials.push("M5_CONSTITUTIONAL requires a valid Super-User approval receipt");
      }
      if (independentReviews.length < 1) {
        denials.push("M5_CONSTITUTIONAL requires an independent review receipt");
      }
      if (!request.authorityAnalysisId) {
        denials.push("M5_CONSTITUTIONAL requires an authority-impact analysis");
      } else {
        this.evidence.resolve(request.authorityAnalysisId);
      }
      if (!request.rollbackPlanId) {
        denials.push("M5_CONSTITUTIONAL requires a rollback plan");
      }
    }

    const promoted = denials.length === 0;
    return {
      disposition: promoted ? "PROMOTED" : "DENIED",
      memoryId: record.memoryId,
      currentMaturity,
      requestedMaturity: target,
      verifiedEvidenceCount: refs.length,
      independentRootCount: rootCount,
      independentRoots,
      unresolvedContradictions,
      verifiedOutcomeCount: verifiedOutcomes.length,
      verifiedRegressionCount: verifiedRegressions.length,
      independentReviewCount: independentReviews.length,
      validApprovalCount: validApprovals.length,
      reasons: promoted ? [`granted: ${request.reason}`] : denials,
    };
  }

  #verifiedSuccesses(
    receipts: readonly SignedOutcomeReceipt[] | undefined,
    kind: SignedOutcomeReceipt["kind"],
  ): SignedOutcomeReceipt[] {
    const verified: SignedOutcomeReceipt[] = [];
    for (const receipt of receipts ?? []) {
      if (receipt.kind !== kind) continue;
      try {
        this.outcomes.verify(receipt);
      } catch {
        continue; // An unverifiable receipt is simply not counted.
      }
      if (receipt.result === "success") verified.push(receipt);
    }
    return verified;
  }

  #validApprovals(
    record: MemoryRecord,
    target: Maturity,
    receipts: readonly SignedApprovalReceipt[] | undefined,
  ): SignedApprovalReceipt[] {
    const valid: SignedApprovalReceipt[] = [];
    for (const receipt of receipts ?? []) {
      try {
        this.approvals.verify(receipt, {
          action: "memory.promote",
          resourceId: record.memoryId,
          targetState: target,
          objectHash: record.contentHash,
        });
        valid.push(receipt);
      } catch {
        continue;
      }
    }
    return valid;
  }
}
