import type { ForgeAssessment } from "./types.js";
import type { ExecutionPlan } from "./executionPlane.js";

export interface PlanGateDecision {
  decision: "auto_proceed" | "review_required";
  reason: string;
}

export function decidePlanGate(assessment: ForgeAssessment, plan: ExecutionPlan): PlanGateDecision {
  const consequential=plan.steps.some(s=>s.impact==="external_side_effect" || s.impact==="irreversible_high_impact");
  if (assessment.governanceRisk>=8) return {decision:"review_required",reason:"high_governance_risk"};
  if (assessment.objectiveUncertainty>=8) return {decision:"review_required",reason:"high_objective_uncertainty"};
  if (consequential) return {decision:"review_required",reason:"consequential_external_action"};
  return {decision:"auto_proceed",reason:"reversible_or_read_only_plan"};
}
