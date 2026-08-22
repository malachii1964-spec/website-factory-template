export type LearningKind = "working_memory" | "project_instruction" | "project_file" | "skill" | "policy" | "constitution";
export interface LearningCandidate { id:string; kind:LearningKind; content:string; raisesAuthority?:boolean; reversible?:boolean; }
export interface LearningDecision { decision:"auto_apply"|"review_required"|"deny"; reason:string; }

export function learningDisposition(c:LearningCandidate):LearningDecision {
  if (c.raisesAuthority) return {decision:"deny",reason:"learning_cannot_expand_authority"};
  if (c.kind==="policy" || c.kind==="constitution") return {decision:"review_required",reason:"governance_change_requires_review"};
  if (c.kind==="skill") return {decision:"review_required",reason:"executable_skill_change_requires_review"};
  if (c.kind==="project_instruction" || c.kind==="project_file") return {decision:"review_required",reason:"durable_project_context_change_requires_review"};
  if (c.kind==="working_memory" && c.reversible!==false) return {decision:"auto_apply",reason:"reversible_non_authoritative_memory"};
  return {decision:"review_required",reason:"insufficient_reversibility"};
}
