import type { AssuranceLabel, QualityScores, RuntimeManifest, TrustDomain } from "./types.js";
import type { Impact, AuthorizationDecision } from "./authorization.js";
import { EventLedger } from "./eventLedger.js";
import { executePlan, type ExecutionAdapter, type ExecutionPlan, type ExecutionReport, type ExecutionStep, type ActionRedemptionLedger } from "./executionPlane.js";
import { releaseDecision, type ReleaseDecision } from "./releaseGate.js";
import { qualityFloor } from "./quality.js";

export type ControlRiskTier = "T0" | "T1" | "T2" | "T3";
export type ControlResourceKind = "model" | "agent" | "tool" | "execution_plane" | "skill" | "data_source";

export interface WorkloadIdentity {
  subject: string;
  issuer: string;
  proof: "declared" | "observed" | "attested";
  issuedAt: string;
  expiresAt?: string;
}

export interface ResourceMeasurements {
  quality?: number;
  latencyMs?: number;
  costIndex?: number;
  successRate?: number;
  sampleSize: number;
}

export interface ControlResourceDescriptor {
  id: string;
  kind: ControlResourceKind;
  provider: string;
  capabilities: string[];
  scopes: string[];
  allowedDataScopes: string[];
  tags: string[];
  available: boolean;
  assurance: AssuranceLabel;
  trustDomain: TrustDomain;
  measurements: ResourceMeasurements;
  executionAdapterId?: string;
  identity?: WorkloadIdentity;
}

export interface ObjectiveBudget {
  maxCostIndexPerTask?: number;
  maxLatencyMsPerTask?: number;
}

export interface ObjectiveReleasePolicy {
  externalPublish: boolean;
  publishGrantId?: string;
  requiredHardGates: string[];
}

export interface ObjectiveVerificationPolicy {
  minEvidenceReceipts: number;
  requireIndependentVerification: boolean;
  minIndependentEvidenceSources?: number;
}

export interface ControlObjectiveSpec {
  id: string;
  requestedOutcome: string;
  successCriteria: string[];
  constraints: string[];
  riskTier: ControlRiskTier;
  qualityFloor: number;
  requiredCapabilities: string[];
  allowedDataScopes: string[];
  budget: ObjectiveBudget;
  releasePolicy: ObjectiveReleasePolicy;
  verification: ObjectiveVerificationPolicy;
  createdAt: string;
}

export interface ControlTask {
  id: string;
  actionId: string;
  title: string;
  capability: string;
  scope: string;
  dataScopes: string[];
  impact: Impact;
  dependsOn: string[];
  required: boolean;
  input?: unknown;
  independenceGroup?: string;
}

export interface RouteExclusion { resourceId: string; reasons: string[]; }
export interface ControlRouteDecision {
  taskId: string;
  selectedResourceId?: string;
  selectedAdapterId?: string;
  score?: number;
  alternatives: {resourceId:string;score:number}[];
  excluded: RouteExclusion[];
  reason: string;
}

export interface ControlPolicyDecision extends AuthorizationDecision {
  taskId: string;
  resourceId: string;
  policyIds: string[];
}

export interface EvidenceReceipt {
  id: string;
  objectiveId: string;
  taskId: string;
  sourceResourceId: string;
  sourceAdapterId?: string;
  sourceEvidenceId: string;
  trustDomain: TrustDomain;
  independent: boolean;
  independenceGroup?: string;
  observedAt: string;
}

export interface DesiredState {
  objectiveId: string;
  requiredExecutionSuccess: boolean;
  minimumEvidenceReceipts: number;
  minimumIndependentEvidenceSources: number;
  minimumQualityFloor: number;
  releaseQualified: boolean;
  requiredHardGates: string[];
  requiredCapabilities: string[];
  successCriteria: string[];
}

export interface ObservedState {
  objectiveId: string;
  executionStatus: ExecutionReport["status"] | "not_executed";
  succeededTaskIds: string[];
  failedOrBlockedTaskIds: string[];
  evidenceReceipts: EvidenceReceipt[];
  executedCapabilities: string[];
  successCriteria: Record<string,boolean>;
  quality?: QualityScores;
  qualityFloor?: number;
  hardGates: Record<string,boolean>;
  releaseDecision?: ReleaseDecision;
}

export interface ReconciliationGap { code:string; detail:string; }
export interface ReconciliationResult { converged:boolean; gaps:ReconciliationGap[]; }

export interface ControlPlaneRound {
  round: number;
  routes: ControlRouteDecision[];
  policy: ControlPolicyDecision[];
  execution?: ExecutionReport;
  observed: ObservedState;
  reconciliation: ReconciliationResult;
}

export interface ControlPlaneReport {
  objectiveId: string;
  status: "completed" | "held" | "needs_reconciliation";
  desired: DesiredState;
  rounds: ControlPlaneRound[];
  finalObserved: ObservedState;
  finalReconciliation: ReconciliationResult;
  ledgerRoot: string;
}

export class ControlPlaneRegistry {
  private resources = new Map<string,ControlResourceDescriptor>();

  register(resource:ControlResourceDescriptor):void {
    this.resources.set(resource.id, cloneResource(resource));
  }

  get(id:string):ControlResourceDescriptor|undefined {
    const value=this.resources.get(id); return value ? cloneResource(value) : undefined;
  }

  list():ControlResourceDescriptor[] { return [...this.resources.values()].map(cloneResource); }

  candidates(capability:string, scope:string):ControlResourceDescriptor[] {
    return this.list().filter(r => r.available && r.capabilities.includes(capability) && scopeCovered(r.scopes,scope));
  }
}

function cloneResource(r:ControlResourceDescriptor):ControlResourceDescriptor {
  return {
    ...r,
    capabilities:[...r.capabilities], scopes:[...r.scopes], allowedDataScopes:[...r.allowedDataScopes], tags:[...r.tags],
    measurements:{...r.measurements},
    ...(r.identity ? {identity:{...r.identity}} : {})
  };
}

function scopeCovered(scopes:string[], requested:string):boolean {
  return scopes.some(s => requested===s || requested.startsWith(`${s}.`) || s==="*");
}

function dataAllowed(resource:ControlResourceDescriptor, requested:string[]):boolean {
  return requested.every(ds => resource.allowedDataScopes.some(a => a==="*" || ds===a || ds.startsWith(`${a}.`)));
}

function executableAssurance(a:AssuranceLabel):boolean { return a==="A3_OBSERVED" || a==="A4_ATTESTED"; }

function identityUsable(identity:WorkloadIdentity|undefined, now:Date):boolean {
  if (!identity) return true; // Local/test resources may rely on runtime-manifest assurance instead of workload identity.
  if (identity.proof!=="observed" && identity.proof!=="attested") return false;
  return !identity.expiresAt || new Date(identity.expiresAt).getTime()>now.getTime();
}

function resourceScore(resource:ControlResourceDescriptor, objective:ControlObjectiveSpec):number {
  const m=resource.measurements;
  const quality=(m.quality ?? 5)*4;
  const reliability=(m.successRate ?? .5)*20;
  const evidenceBonus=resource.assurance==="A4_ATTESTED" ? 8 : 4;
  const samples=Math.min(5,Math.log10(Math.max(1,m.sampleSize)+1)*2);
  const latencyPenalty=(m.latencyMs ?? 0)/1000;
  const costPenalty=(m.costIndex ?? 0)*2;
  const diversityBonus=resource.tags.includes("independent") && objective.verification.requireIndependentVerification ? 2 : 0;
  return Math.round((quality+reliability+evidenceBonus+samples+diversityBonus-latencyPenalty-costPenalty)*1000)/1000;
}

export function routeControlTask(objective:ControlObjectiveSpec, task:ControlTask, registry:ControlPlaneRegistry, now=new Date(), avoidResourceIds:ReadonlySet<string>=new Set()):ControlRouteDecision {
  const excluded:RouteExclusion[]=[];
  const eligible:{resource:ControlResourceDescriptor;score:number}[]=[];

  for (const resource of registry.list()) {
    const reasons:string[]=[];
    if (!resource.available) reasons.push("unavailable");
    if (avoidResourceIds.has(resource.id)) reasons.push("independence_diversity_collision");
    if (!resource.capabilities.includes(task.capability)) reasons.push("capability_mismatch");
    if (!scopeCovered(resource.scopes,task.scope)) reasons.push("scope_mismatch");
    if (!executableAssurance(resource.assurance)) reasons.push("insufficient_capability_assurance");
    if (!identityUsable(resource.identity,now)) reasons.push("identity_not_observed_attested_or_fresh");
    if (!dataAllowed(resource,task.dataScopes)) reasons.push("data_scope_not_allowed");
    if (objective.budget.maxCostIndexPerTask!==undefined && (resource.measurements.costIndex ?? 0)>objective.budget.maxCostIndexPerTask) reasons.push("cost_budget_exceeded");
    if (objective.budget.maxLatencyMsPerTask!==undefined && (resource.measurements.latencyMs ?? 0)>objective.budget.maxLatencyMsPerTask) reasons.push("latency_budget_exceeded");
    if (!resource.executionAdapterId) reasons.push("no_execution_adapter_binding");
    if (reasons.length) excluded.push({resourceId:resource.id,reasons});
    else eligible.push({resource,score:resourceScore(resource,objective)});
  }

  eligible.sort((a,b)=>b.score-a.score || a.resource.id.localeCompare(b.resource.id));
  const selected=eligible[0];
  return {
    taskId:task.id,
    ...(selected ? {selectedResourceId:selected.resource.id,selectedAdapterId:selected.resource.executionAdapterId!,score:selected.score} : {}),
    alternatives:eligible.slice(1,4).map(x=>({resourceId:x.resource.id,score:x.score})),
    excluded,
    reason:selected ? "highest_eligible_governed_route" : "no_eligible_governed_resource"
  };
}

export function evaluateControlPolicy(objective:ControlObjectiveSpec, task:ControlTask, resource:ControlResourceDescriptor, approvalId:string|undefined, now=new Date()):ControlPolicyDecision {
  const ids=["malachii.control.capability_authorization.v1","malachii.control.consequence_gate.v1"];
  if (!resource.available || !resource.capabilities.includes(task.capability) || !scopeCovered(resource.scopes,task.scope))
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"deny",reason:"resource_not_eligible",decidedAt:now.toISOString()};
  if (!task.dataScopes.every(ds=>objective.allowedDataScopes.some(a=>a==="*" || ds===a || ds.startsWith(`${a}.`))))
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"deny",reason:"objective_data_scope_violation",decidedAt:now.toISOString()};
  if (!executableAssurance(resource.assurance))
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"deny",reason:"capability_not_observed_or_attested",decidedAt:now.toISOString()};
  if (!identityUsable(resource.identity,now))
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"deny",reason:"workload_identity_not_usable",decidedAt:now.toISOString()};
  if (!dataAllowed(resource,task.dataScopes))
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"deny",reason:"data_scope_not_allowed",decidedAt:now.toISOString()};
  const consequential=task.impact==="external_side_effect" || task.impact==="irreversible_high_impact" || objective.riskTier==="T3";
  if (consequential && !approvalId)
    return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"require_approval",reason:"consequential_action_requires_approval",decidedAt:now.toISOString()};
  return {taskId:task.id,resourceId:resource.id,policyIds:ids,decision:"permit",reason:"control_plane_policy_satisfied",decidedAt:now.toISOString()};
}

export function desiredStateFor(objective:ControlObjectiveSpec):DesiredState {
  return {
    objectiveId:objective.id,
    requiredExecutionSuccess:true,
    minimumEvidenceReceipts:objective.verification.minEvidenceReceipts,
    minimumIndependentEvidenceSources:objective.verification.requireIndependentVerification ? (objective.verification.minIndependentEvidenceSources ?? 2) : 0,
    minimumQualityFloor:objective.qualityFloor,
    releaseQualified:true,
    requiredHardGates:[...objective.releasePolicy.requiredHardGates],
    requiredCapabilities:[...objective.requiredCapabilities],
    successCriteria:[...objective.successCriteria]
  };
}

export function reconcileState(desired:DesiredState, observed:ObservedState):ReconciliationResult {
  const gaps:ReconciliationGap[]=[];
  if (desired.requiredExecutionSuccess && observed.executionStatus!=="succeeded") gaps.push({code:"execution_not_succeeded",detail:`execution=${observed.executionStatus}`});
  if (observed.evidenceReceipts.length<desired.minimumEvidenceReceipts) gaps.push({code:"evidence_incomplete",detail:`have=${observed.evidenceReceipts.length},need=${desired.minimumEvidenceReceipts}`});
  const independentSources=new Set(observed.evidenceReceipts.filter(e=>e.independent).map(e=>e.sourceResourceId)).size;
  if (independentSources<desired.minimumIndependentEvidenceSources) gaps.push({code:"independent_verification_incomplete",detail:`have=${independentSources},need=${desired.minimumIndependentEvidenceSources}`});
  const executedCaps=new Set(observed.executedCapabilities);
  for (const cap of desired.requiredCapabilities) if (!executedCaps.has(cap)) gaps.push({code:"required_capability_not_executed",detail:cap});
  for (const criterion of desired.successCriteria) if (observed.successCriteria[criterion]!==true) gaps.push({code:"success_criterion_not_verified",detail:criterion});
  if (observed.qualityFloor===undefined) gaps.push({code:"quality_not_measured",detail:"quality evaluator did not produce scores"});
  else if (observed.qualityFloor<desired.minimumQualityFloor) gaps.push({code:"quality_floor_below_threshold",detail:`have=${observed.qualityFloor},need=${desired.minimumQualityFloor}`});
  for (const gate of desired.requiredHardGates) if (observed.hardGates[gate]!==true) gaps.push({code:"hard_gate_failed",detail:gate});
  if (desired.releaseQualified && observed.releaseDecision?.decision!=="release") gaps.push({code:"release_not_qualified",detail:observed.releaseDecision?.reason ?? "release_not_evaluated"});
  return {converged:gaps.length===0,gaps};
}

export interface QualityEvaluationContext {
  objective:ControlObjectiveSpec;
  tasks:ControlTask[];
  execution:ExecutionReport;
  evidenceReceipts:EvidenceReceipt[];
}

export interface ControlPlaneEnvironment {
  registry:ControlPlaneRegistry;
  refreshRegistry?:()=>Promise<ControlPlaneRegistry>|ControlPlaneRegistry;
  getFreshManifest():RuntimeManifest;
  adapters:ExecutionAdapter[];
  approvals?:Record<string,string>;
  ledger?:EventLedger;
  redemptionLedger?:ActionRedemptionLedger;
  now?:()=>Date;
  evaluateSuccessCriteria?:(ctx:QualityEvaluationContext)=>Record<string,boolean>;
  evaluateQuality?:(ctx:QualityEvaluationContext)=>QualityScores|undefined;
  evaluateHardGates?:(ctx:QualityEvaluationContext)=>Record<string,boolean>;
  repairPlanner?:(objective:ControlObjectiveSpec, observed:ObservedState, reconciliation:ReconciliationResult, nextRound:number)=>ControlTask[]|undefined;
  maxReconcileRounds?:number;
}

function validateObjective(o:ControlObjectiveSpec):string[] {
  const errors:string[]=[];
  if (!o.id.trim()) errors.push("objective_id_required");
  if (!o.requestedOutcome.trim()) errors.push("requested_outcome_required");
  if (!o.successCriteria.length) errors.push("success_criteria_required");
  if (o.qualityFloor<0 || o.qualityFloor>10) errors.push("quality_floor_out_of_range");
  if (o.verification.minEvidenceReceipts<0) errors.push("min_evidence_receipts_negative");
  return errors;
}

function makeExecutionPlan(objective:ControlObjectiveSpec, tasks:ControlTask[], routes:ControlRouteDecision[], now:Date):ExecutionPlan {
  const routeByTask=new Map(routes.map(r=>[r.taskId,r]));
  const steps:ExecutionStep[]=tasks.map(task=>{
    const route=routeByTask.get(task.id)!;
    return {
      id:task.id, actionId:task.actionId, title:task.title, capability:task.capability, scope:task.scope, impact:task.impact,
      dependsOn:[...task.dependsOn], required:task.required,
      ...(task.input!==undefined?{input:task.input}:{}),
      preferredAdapterId:route.selectedAdapterId!
    };
  });
  return {id:`cp_${objective.id}_${now.getTime()}`,objectiveId:objective.id,sourceOfTruth:"objective_forge",steps,createdAt:now.toISOString()};
}

function evidenceFromExecution(objective:ControlObjectiveSpec, execution:ExecutionReport, routes:ControlRouteDecision[], registry:ControlPlaneRegistry, tasks:ControlTask[], now:Date):EvidenceReceipt[] {
  const routeByTask=new Map(routes.map(r=>[r.taskId,r]));
  const tasksById=new Map(tasks.map(t=>[t.id,t]));
  const out:EvidenceReceipt[]=[];
  for (const record of execution.records) {
    const route=routeByTask.get(record.stepId); if (!route?.selectedResourceId) continue;
    const resource=registry.get(route.selectedResourceId); if (!resource) continue;
    for (const sourceEvidenceId of record.evidenceIds) out.push({
      id:`receipt_${objective.id}_${record.stepId}_${sourceEvidenceId}`,
      objectiveId:objective.id,taskId:record.stepId,sourceResourceId:resource.id,
      ...(record.adapterId?{sourceAdapterId:record.adapterId}:{}),sourceEvidenceId,trustDomain:resource.trustDomain,independent:resource.tags.includes("independent"),
      ...(tasksById.get(record.stepId)?.independenceGroup?{independenceGroup:tasksById.get(record.stepId)!.independenceGroup}:{}),observedAt:now.toISOString()
    });
  }
  return out;
}

function observedWithoutExecution(objective:ControlObjectiveSpec):ObservedState {
  return {objectiveId:objective.id,executionStatus:"not_executed",succeededTaskIds:[],failedOrBlockedTaskIds:[],evidenceReceipts:[],executedCapabilities:[],successCriteria:Object.fromEntries(objective.successCriteria.map(c=>[c,false])),hardGates:{}};
}

export async function runControlPlane(objective:ControlObjectiveSpec, initialTasks:ControlTask[], env:ControlPlaneEnvironment):Promise<ControlPlaneReport> {
  const errors=validateObjective(objective);
  if (errors.length) throw new Error(`invalid_control_objective:${errors.join(",")}`);
  const ledger=env.ledger ?? new EventLedger();
  const now=env.now ?? (()=>new Date());
  const desired=desiredStateFor(objective);
  const rounds:ControlPlaneRound[]=[];
  let tasks=initialTasks.map(t=>({...t,dependsOn:[...t.dependsOn],dataScopes:[...t.dataScopes]}));
  const maxRounds=Math.max(0,env.maxReconcileRounds ?? 0);

  ledger.append("control.objective.accepted",{objectiveId:objective.id,riskTier:objective.riskTier,qualityFloor:objective.qualityFloor},now());

  for (let round=0; round<=maxRounds; round++) {
    ledger.append("control.round.started",{objectiveId:objective.id,round,taskCount:tasks.length},now());
    const roundRegistry=env.refreshRegistry ? await env.refreshRegistry() : env.registry;
    const routes:ControlRouteDecision[]=[];
    const selectedByGroup=new Map<string,Set<string>>();
    for (const t of tasks) {
      const avoid=t.independenceGroup ? (selectedByGroup.get(t.independenceGroup) ?? new Set<string>()) : new Set<string>();
      const r=routeControlTask(objective,t,roundRegistry,now(),avoid); routes.push(r);
      if (t.independenceGroup && r.selectedResourceId) { const set=selectedByGroup.get(t.independenceGroup) ?? new Set<string>(); set.add(r.selectedResourceId); selectedByGroup.set(t.independenceGroup,set); }
    }
    for (const r of routes) ledger.append("control.route.decided",{objectiveId:objective.id,round,...r},now());
    const routeFailure=routes.find(r=>!r.selectedResourceId || !r.selectedAdapterId);
    if (routeFailure) {
      const observed=observedWithoutExecution(objective);
      const reconciliation=reconcileState(desired,observed);
      rounds.push({round,routes,policy:[],observed,reconciliation});
      ledger.append("control.objective.held",{objectiveId:objective.id,reason:"no_eligible_governed_route",taskId:routeFailure.taskId},now());
      return {objectiveId:objective.id,status:"held",desired,rounds,finalObserved:observed,finalReconciliation:reconciliation,ledgerRoot:ledger.rootHash()};
    }

    const policy:ControlPolicyDecision[]=[];
    for (const task of tasks) {
      const route=routes.find(r=>r.taskId===task.id)!;
      const resource=roundRegistry.get(route.selectedResourceId!)!;
      const decision=evaluateControlPolicy(objective,task,resource,env.approvals?.[task.id],now());
      policy.push(decision);
      ledger.append("control.policy.decided",{objectiveId:objective.id,round,...decision},now());
    }
    const policyStop=policy.find(p=>p.decision!=="permit");
    if (policyStop) {
      const observed=observedWithoutExecution(objective);
      const reconciliation=reconcileState(desired,observed);
      rounds.push({round,routes,policy,observed,reconciliation});
      ledger.append("control.objective.held",{objectiveId:objective.id,reason:policyStop.reason,taskId:policyStop.taskId,decision:policyStop.decision},now());
      return {objectiveId:objective.id,status:"held",desired,rounds,finalObserved:observed,finalReconciliation:reconciliation,ledgerRoot:ledger.rootHash()};
    }

    const plan=makeExecutionPlan(objective,tasks,routes,now());
    const execution=await executePlan(plan,{getFreshManifest:env.getFreshManifest,adapters:env.adapters,...(env.approvals?{approvals:env.approvals}:{}),ledger, ...(env.redemptionLedger?{redemptionLedger:env.redemptionLedger}:{}), now});
    const evidenceReceipts=evidenceFromExecution(objective,execution,routes,roundRegistry,tasks,now());
    const ctx:QualityEvaluationContext={objective,tasks,execution,evidenceReceipts};
    const successCriteria=env.evaluateSuccessCriteria?.(ctx) ?? Object.fromEntries(objective.successCriteria.map(c=>[c,false]));
    const quality=env.evaluateQuality?.(ctx);
    const hardGates=env.evaluateHardGates?.(ctx) ?? {};
    const completeHardGates:Record<string,boolean>={};
    for (const gate of objective.releasePolicy.requiredHardGates) completeHardGates[gate]=hardGates[gate]===true;
    for (const [k,v] of Object.entries(hardGates)) completeHardGates[k]=v;
    const release=quality ? releaseDecision({quality,hardGates:completeHardGates,buildSucceeded:execution.status==="succeeded",externalPublish:objective.releasePolicy.externalPublish,...(objective.releasePolicy.publishGrantId?{publishGrantId:objective.releasePolicy.publishGrantId}:{}),threshold:objective.qualityFloor}) : undefined;
    const observed:ObservedState={
      objectiveId:objective.id,executionStatus:execution.status,
      succeededTaskIds:execution.records.filter(r=>r.status==="succeeded").map(r=>r.stepId),
      failedOrBlockedTaskIds:execution.records.filter(r=>r.status!=="succeeded").map(r=>r.stepId),
      evidenceReceipts,
      executedCapabilities:[...new Set(execution.records.filter(r=>r.status==="succeeded").map(r=>tasks.find(t=>t.id===r.stepId)?.capability).filter((x):x is string=>Boolean(x)))],
      successCriteria,
      ...(quality?{quality,qualityFloor:qualityFloor(quality)}:{}),
      hardGates:completeHardGates,
      ...(release?{releaseDecision:release}:{})
    };
    const reconciliation=reconcileState(desired,observed);
    rounds.push({round,routes,policy,execution,observed,reconciliation});
    ledger.append("control.state.observed",{objectiveId:objective.id,round,executionStatus:execution.status,evidenceCount:evidenceReceipts.length,qualityFloor:observed.qualityFloor,release:release?.decision},now());
    ledger.append("control.reconciliation.completed",{objectiveId:objective.id,round,converged:reconciliation.converged,gaps:reconciliation.gaps},now());

    if (reconciliation.converged) {
      ledger.append("control.objective.completed",{objectiveId:objective.id,round},now());
      return {objectiveId:objective.id,status:"completed",desired,rounds,finalObserved:observed,finalReconciliation:reconciliation,ledgerRoot:ledger.rootHash()};
    }

    if (round<maxRounds && env.repairPlanner) {
      const repair=env.repairPlanner(objective,observed,reconciliation,round+1);
      if (repair?.length) {
        tasks=repair.map(t=>({...t,dependsOn:[...t.dependsOn],dataScopes:[...t.dataScopes]}));
        ledger.append("control.repair.planned",{objectiveId:objective.id,nextRound:round+1,taskCount:tasks.length,gaps:reconciliation.gaps.map(g=>g.code)},now());
        continue;
      }
    }

    ledger.append("control.objective.needs_reconciliation",{objectiveId:objective.id,round,gaps:reconciliation.gaps},now());
    return {objectiveId:objective.id,status:"needs_reconciliation",desired,rounds,finalObserved:observed,finalReconciliation:reconciliation,ledgerRoot:ledger.rootHash()};
  }

  throw new Error("control_plane_unreachable");
}

export interface A2AAgentAdapterContract {
  protocol:"A2A";
  discover():Promise<ControlResourceDescriptor[]>;
  delegate(resourceId:string,task:ControlTask):Promise<{output?:unknown;evidenceIds:string[]}>;
}

export interface MCPToolAdapterContract {
  protocol:"MCP";
  discover():Promise<ControlResourceDescriptor[]>;
  invoke(resourceId:string,task:ControlTask):Promise<{output?:unknown;evidenceIds:string[]}>;
}
