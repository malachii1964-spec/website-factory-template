import type { RuntimeManifest } from "./types.js";
import { redeemAuthorization, type Impact } from "./authorization.js";
import { EventLedger } from "./eventLedger.js";

export type ExecutionStepStatus = "pending" | "running" | "succeeded" | "failed" | "blocked";

export interface ExecutionStep {
  id: string;
  actionId: string;
  title: string;
  capability: string;
  scope: string;
  impact: Impact;
  dependsOn: string[];
  required: boolean;
  input?: unknown;
  preferredAdapterId?: string;
}

export interface ExecutionPlan {
  id: string;
  objectiveId: string;
  sourceOfTruth: "objective_forge" | "approved_plan";
  steps: ExecutionStep[];
  createdAt: string;
}

export interface ExecutionAdapterResult {
  output?: unknown;
  evidenceIds?: string[];
  rollbackToken?: string;
}

export interface ExecutionAdapter {
  id: string;
  capabilities: string[];
  execute(step: ExecutionStep): Promise<ExecutionAdapterResult>;
}

export interface ExecutionRecord {
  stepId: string;
  actionId: string;
  status: ExecutionStepStatus;
  adapterId?: string;
  reason: string;
  output?: unknown;
  evidenceIds: string[];
  startedAt?: string;
  endedAt: string;
}

export interface ExecutionReport {
  planId: string;
  status: "succeeded" | "failed" | "blocked";
  records: ExecutionRecord[];
  ledgerRoot: string;
}

export interface ExecutionEnvironment {
  getFreshManifest(): RuntimeManifest;
  adapters: ExecutionAdapter[];
  approvals?: Record<string,string>;
  ledger?: EventLedger;
  now?: () => Date;
  redemptionLedger?: ActionRedemptionLedger;
}

export class ActionRedemptionLedger {
  private redeemed = new Set<string>();
  redeem(actionId: string): boolean {
    if (this.redeemed.has(actionId)) return false;
    this.redeemed.add(actionId);
    return true;
  }
  has(actionId: string): boolean { return this.redeemed.has(actionId); }
}

function adapterFor(step: ExecutionStep, adapters: ExecutionAdapter[]): ExecutionAdapter | undefined {
  if (step.preferredAdapterId) return adapters.find(a => a.id===step.preferredAdapterId && a.capabilities.includes(step.capability));
  return adapters.find(a => a.capabilities.includes(step.capability));
}

async function executeOne(step: ExecutionStep, env: ExecutionEnvironment, ledger: EventLedger, redemption: ActionRedemptionLedger): Promise<ExecutionRecord> {
  const now = env.now ?? (()=>new Date());
  const ended = () => now().toISOString();

  if (!redemption.redeem(step.actionId)) {
    ledger.append("execution.step.blocked", {stepId:step.id, actionId:step.actionId, reason:"action_replay_detected"}, now());
    return {stepId:step.id,actionId:step.actionId,status:"blocked",reason:"action_replay_detected",evidenceIds:[],endedAt:ended()};
  }

  const manifest = env.getFreshManifest();
  const approvalId = env.approvals?.[step.id];
  const req = approvalId ? {capability:step.capability,scope:step.scope,impact:step.impact,approvalId} : {capability:step.capability,scope:step.scope,impact:step.impact};
  const auth = redeemAuthorization(manifest,req,now());
  if (auth.decision !== "permit") {
    const reason = auth.decision === "require_approval" ? "approval_required" : auth.reason;
    ledger.append("execution.step.blocked", {stepId:step.id, actionId:step.actionId, reason}, now());
    return {stepId:step.id,actionId:step.actionId,status:"blocked",reason,evidenceIds:[],endedAt:ended()};
  }

  const adapter = adapterFor(step, env.adapters);
  if (!adapter) {
    ledger.append("execution.step.failed", {stepId:step.id, actionId:step.actionId, reason:"no_compatible_adapter"}, now());
    return {stepId:step.id,actionId:step.actionId,status:"failed",reason:"no_compatible_adapter",evidenceIds:[],endedAt:ended()};
  }

  const startedAt=now().toISOString();
  ledger.append("execution.step.started", {stepId:step.id,actionId:step.actionId,adapterId:adapter.id}, now());
  try {
    const result=await adapter.execute(step);
    ledger.append("execution.step.succeeded", {stepId:step.id,actionId:step.actionId,adapterId:adapter.id,evidenceIds:result.evidenceIds??[]}, now());
    return {stepId:step.id,actionId:step.actionId,status:"succeeded",adapterId:adapter.id,reason:"executed",output:result.output,evidenceIds:result.evidenceIds??[],startedAt,endedAt:ended()};
  } catch (error) {
    const reason=error instanceof Error ? error.message : "adapter_execution_failed";
    ledger.append("execution.step.failed", {stepId:step.id,actionId:step.actionId,adapterId:adapter.id,reason}, now());
    return {stepId:step.id,actionId:step.actionId,status:"failed",adapterId:adapter.id,reason,evidenceIds:[],startedAt,endedAt:ended()};
  }
}

export async function executePlan(plan: ExecutionPlan, env: ExecutionEnvironment): Promise<ExecutionReport> {
  const ledger=env.ledger ?? new EventLedger();
  const redemption=env.redemptionLedger ?? new ActionRedemptionLedger();
  const now=env.now ?? (()=>new Date());
  const records=new Map<string,ExecutionRecord>();
  const pending=new Map(plan.steps.map(s=>[s.id,s]));

  ledger.append("execution.plan.started", {planId:plan.id,objectiveId:plan.objectiveId,stepCount:plan.steps.length}, now());

  while (pending.size) {
    // Hard-block steps whose dependencies have already failed/blocked.
    let changed=false;
    for (const [id,step] of [...pending.entries()]) {
      const bad=step.dependsOn.find(dep => {
        const r=records.get(dep); return r && r.status!=="succeeded";
      });
      if (bad) {
        const r:ExecutionRecord={stepId:id,actionId:step.actionId,status:"blocked",reason:`dependency_not_satisfied:${bad}`,evidenceIds:[],endedAt:now().toISOString()};
        records.set(id,r); pending.delete(id); changed=true;
        ledger.append("execution.step.blocked", {stepId:id,actionId:step.actionId,reason:r.reason}, now());
      }
    }

    const ready=[...pending.values()].filter(step=>step.dependsOn.every(dep=>records.get(dep)?.status==="succeeded"));
    if (!ready.length) {
      if (changed) continue;
      // Missing/cyclic dependencies fail closed.
      for (const [id,step] of pending) {
        const r:ExecutionRecord={stepId:id,actionId:step.actionId,status:"blocked",reason:"unresolved_or_cyclic_dependency",evidenceIds:[],endedAt:now().toISOString()};
        records.set(id,r);
        ledger.append("execution.step.blocked", {stepId:id,actionId:step.actionId,reason:r.reason}, now());
      }
      pending.clear();
      break;
    }

    // Independent ready steps execute as a wave, enabling Wide-Research-like parallelism.
    const wave=await Promise.all(ready.map(step=>executeOne(step,env,ledger,redemption)));
    for (const r of wave) { records.set(r.stepId,r); pending.delete(r.stepId); }
  }

  const ordered=plan.steps.map(s=>records.get(s.id)!).filter(Boolean);
  const requiredFailure=plan.steps.some(s=>s.required && records.get(s.id)?.status!=="succeeded");
  const anyBlocked=ordered.some(r=>r.status==="blocked");
  const status:ExecutionReport["status"]=requiredFailure ? (anyBlocked?"blocked":"failed") : "succeeded";
  ledger.append("execution.plan.completed", {planId:plan.id,status}, now());
  return {planId:plan.id,status,records:ordered,ledgerRoot:ledger.rootHash()};
}
