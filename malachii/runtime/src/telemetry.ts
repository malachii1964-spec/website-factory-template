export interface MalachiiTelemetryAttributes {
  "malachii.assurance.level"?: string;
  "malachii.assurance.capability"?: string;
  "malachii.assurance.evidence_id"?: string;
  "malachii.confidence.derived"?: number;
  "malachii.confidence.evidence_id"?: string;
  "malachii.confidence.override_present"?: boolean;
  "malachii.policy.decision"?: string;
  "malachii.policy.policy_id"?: string;
  "malachii.quality.floor"?: number;
  "malachii.quality.ship_decision"?: "ship"|"dont_ship";
  "malachii.quality.critical_vulnerability_code"?: string;
  "malachii.ledger.event_id"?: string;
  "malachii.ledger.sequence"?: number;
  "malachii.objective.id"?: string;
  "malachii.objective.mode"?: string;
  "malachii.runtime.host"?: string;
  "malachii.runtime.authority_tier"?: string;
}

export interface TelemetrySink { emit(name:string,attrs:MalachiiTelemetryAttributes):void; }
export class NoopTelemetrySink implements TelemetrySink { emit():void{} }

export interface MalachiiExecutionTelemetryAttributes {
  "malachii.execution.plan_id"?: string;
  "malachii.execution.step_id"?: string;
  "malachii.execution.action_id"?: string;
  "malachii.execution.adapter_id"?: string;
  "malachii.execution.status"?: string;
  "malachii.execution.impact"?: string;
  "malachii.execution.branch_id"?: string;
  "malachii.release.decision"?: string;
}

export interface MalachiiControlPlaneTelemetryAttributes {
  "malachii.control.objective_id"?: string;
  "malachii.control.round"?: number;
  "malachii.control.resource_id"?: string;
  "malachii.control.route_score"?: number;
  "malachii.control.policy_decision"?: string;
  "malachii.control.reconciliation_converged"?: boolean;
  "malachii.control.reconciliation_gap"?: string;
  "malachii.control.evidence_receipts"?: number;
  "malachii.control.release_decision"?: string;
}
