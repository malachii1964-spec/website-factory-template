import test from "node:test";
import assert from "node:assert/strict";
import {
  ControlPlaneRegistry, routeControlTask, evaluateControlPolicy, runControlPlane, reconcileState, desiredStateFor,
  executePlan, EventLedger,
  type ControlObjectiveSpec, type ControlResourceDescriptor, type ControlTask, type ExecutionAdapter, type RuntimeManifest
} from "../src/index.js";

const now=new Date("2026-08-15T23:00:00Z");
const q=(n:number)=>({accuracy:n,verification:n,completeness:n,intentAlignment:n,executionReadiness:n,structure:n,edgeCases:n});
const criteria=()=>({"artifact verified":true});

function objective(overrides:Partial<ControlObjectiveSpec>={}):ControlObjectiveSpec {
  return {
    id:"obj-1",requestedOutcome:"Produce verified artifact",successCriteria:["artifact verified"],constraints:[],riskTier:"T2",qualityFloor:9,
    requiredCapabilities:["web.search"],allowedDataScopes:["public"],budget:{maxCostIndexPerTask:5,maxLatencyMsPerTask:5000},
    releasePolicy:{externalPublish:false,requiredHardGates:["tests","truth"]},verification:{minEvidenceReceipts:1,requireIndependentVerification:false},
    createdAt:now.toISOString(),...overrides
  };
}

function resource(id:string, overrides:Partial<ControlResourceDescriptor>={}):ControlResourceDescriptor {
  return {
    id,kind:"agent",provider:"test",capabilities:["web.search"],scopes:["public"],allowedDataScopes:["public"],tags:["independent"],available:true,
    assurance:"A3_OBSERVED",trustDomain:"AGENT_MESSAGE",measurements:{quality:9,latencyMs:100,costIndex:1,successRate:.95,sampleSize:20},
    executionAdapterId:`adapter-${id}`,...overrides
  };
}

function task(overrides:Partial<ControlTask>={}):ControlTask {
  return {id:"research",actionId:"act-research",title:"research",capability:"web.search",scope:"public",dataScopes:["public"],impact:"read_only",dependsOn:[],required:true,...overrides};
}

function manifest():RuntimeManifest {
  return {host:{id:"test"},capabilities:[{name:"web.search",evidence:[{id:"cap-web",kind:"observation",source:"probe",authenticity:"verified",directness:"direct",capability:"web.search",scope:["public"],observedSuccess:true,verifiedAt:now.toISOString()}]}]};
}

function adapter(id:string, fail=false):ExecutionAdapter {
  return {id,capabilities:["web.search"],async execute(step){ if (fail) throw new Error("simulated_failure"); return {output:{task:step.id},evidenceIds:[`evidence-${step.id}`]}; }};
}

test("control router hard-excludes unavailable and insufficient-assurance resources",()=>{
  const r=new ControlPlaneRegistry();
  r.register(resource("off",{available:false}));
  r.register(resource("hint",{assurance:"A1_HINTED"}));
  r.register(resource("good"));
  const d=routeControlTask(objective(),task(),r,now);
  assert.equal(d.selectedResourceId,"good");
  assert.ok(d.excluded.some(x=>x.resourceId==="off" && x.reasons.includes("unavailable")));
  assert.ok(d.excluded.some(x=>x.resourceId==="hint" && x.reasons.includes("insufficient_capability_assurance")));
});

test("control router hard-excludes data and budget violations",()=>{
  const r=new ControlPlaneRegistry();
  r.register(resource("private-only",{allowedDataScopes:["private.internal"]}));
  r.register(resource("expensive",{measurements:{quality:10,latencyMs:100,costIndex:9,successRate:1,sampleSize:50}}));
  const d=routeControlTask(objective(),task(),r,now);
  assert.equal(d.selectedResourceId,undefined);
  assert.ok(d.excluded.some(x=>x.resourceId==="private-only" && x.reasons.includes("data_scope_not_allowed")));
  assert.ok(d.excluded.some(x=>x.resourceId==="expensive" && x.reasons.includes("cost_budget_exceeded")));
});

test("control router chooses best eligible resource rather than biggest raw capability list",()=>{
  const r=new ControlPlaneRegistry();
  r.register(resource("weak",{capabilities:["web.search","code.execute","filesystem.write"],measurements:{quality:6,latencyMs:800,costIndex:2,successRate:.7,sampleSize:40}}));
  r.register(resource("strong",{measurements:{quality:9.7,latencyMs:150,costIndex:1,successRate:.98,sampleSize:40}}));
  const d=routeControlTask(objective(),task(),r,now);
  assert.equal(d.selectedResourceId,"strong");
});

test("control policy requires approval for consequential action",()=>{
  const o=objective({riskTier:"T3"});
  const t=task({impact:"external_side_effect"});
  const r=resource("x");
  assert.equal(evaluateControlPolicy(o,t,r,undefined,now).decision,"require_approval");
  assert.equal(evaluateControlPolicy(o,t,r,"grant-1",now).decision,"permit");
});

test("execution plane honors a control-plane preferred adapter binding",async()=>{
  const plan={id:"p",objectiveId:"o",sourceOfTruth:"objective_forge" as const,createdAt:now.toISOString(),steps:[{id:"s",actionId:"a",title:"s",capability:"web.search",scope:"public",impact:"read_only" as const,dependsOn:[],required:true,preferredAdapterId:"chosen"}]};
  const wrong:ExecutionAdapter={id:"wrong",capabilities:["web.search"],async execute(){throw new Error("wrong_adapter_used");}};
  const chosen:ExecutionAdapter={id:"chosen",capabilities:["web.search"],async execute(){return {evidenceIds:["ok"]};}};
  const report=await executePlan(plan,{getFreshManifest:manifest,adapters:[wrong,chosen],now:()=>now});
  assert.equal(report.status,"succeeded"); assert.equal(report.records[0]!.adapterId,"chosen");
});

test("control plane completes only after execution evidence quality and gates converge",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  const ledger=new EventLedger();
  const report=await runControlPlane(objective(),[task()],{
    registry,getFreshManifest:manifest,adapters:[adapter("adapter-researcher")],ledger,now:()=>now,
    evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(9.4),evaluateHardGates:()=>({tests:true,truth:true})
  });
  assert.equal(report.status,"completed");
  assert.equal(report.finalReconciliation.converged,true);
  assert.equal(report.finalObserved.evidenceReceipts.length,1);
  assert.equal(ledger.verify(),true);
  assert.ok(ledger.snapshot().some(e=>e.type==="control.objective.completed"));
});

test("successful execution does not equal completion when quality is below floor",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  const report=await runControlPlane(objective(),[task()],{
    registry,getFreshManifest:manifest,adapters:[adapter("adapter-researcher")],now:()=>now,
    evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(8.8),evaluateHardGates:()=>({tests:true,truth:true})
  });
  assert.equal(report.status,"needs_reconciliation");
  assert.ok(report.finalReconciliation.gaps.some(g=>g.code==="quality_floor_below_threshold"));
});

test("successful execution does not equal completion when required evidence is absent",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  const noEvidence:ExecutionAdapter={id:"adapter-researcher",capabilities:["web.search"],async execute(){return {output:"done",evidenceIds:[]};}};
  const report=await runControlPlane(objective(),[task()],{
    registry,getFreshManifest:manifest,adapters:[noEvidence],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(9.5),evaluateHardGates:()=>({tests:true,truth:true})
  });
  assert.equal(report.status,"needs_reconciliation");
  assert.ok(report.finalReconciliation.gaps.some(g=>g.code==="evidence_incomplete"));
});

test("missing hard gate holds release even with excellent quality",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  const report=await runControlPlane(objective(),[task()],{
    registry,getFreshManifest:manifest,adapters:[adapter("adapter-researcher")],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true})
  });
  assert.equal(report.status,"needs_reconciliation");
  assert.ok(report.finalReconciliation.gaps.some(g=>g.code==="hard_gate_failed" && g.detail==="truth"));
});

test("no governed route fails closed before execution",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("hint",{assurance:"A2_AUTHENTICATED_DECLARATION"}));
  let called=false; const a:ExecutionAdapter={id:"adapter-hint",capabilities:["web.search"],async execute(){called=true; return {evidenceIds:["x"]};}};
  const report=await runControlPlane(objective(),[task()],{registry,getFreshManifest:manifest,adapters:[a],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"held"); assert.equal(called,false);
});

test("control plane reconciliation can route a repair round",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  let calls=0;
  const a:ExecutionAdapter={id:"adapter-researcher",capabilities:["web.search"],async execute(step){calls++; if(calls===1) throw new Error("transient"); return {output:"repaired",evidenceIds:[`evidence-${step.id}`]};}};
  const report=await runControlPlane(objective(),[task()],{
    registry,getFreshManifest:manifest,adapters:[a],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(9.5),evaluateHardGates:()=>({tests:true,truth:true}),maxReconcileRounds:1,
    repairPlanner:(_o,_obs,_g,round)=>[task({id:`repair-${round}`,actionId:`act-repair-${round}`})]
  });
  assert.equal(report.status,"completed"); assert.equal(report.rounds.length,2); assert.equal(calls,2);
});

test("external publish remains held without an explicit publish grant",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("researcher"));
  const o=objective({releasePolicy:{externalPublish:true,requiredHardGates:["tests","truth"]}});
  const report=await runControlPlane(o,[task()],{registry,getFreshManifest:manifest,adapters:[adapter("adapter-researcher")],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"needs_reconciliation"); assert.equal(report.finalObserved.releaseDecision?.decision,"hold");
});

test("workload identity expiration hard-excludes a resource",()=>{
  const r=new ControlPlaneRegistry();
  r.register(resource("expired",{identity:{subject:"spiffe://malachii.test/agent/1",issuer:"test",proof:"attested",issuedAt:"2026-08-14T00:00:00Z",expiresAt:"2026-08-15T22:00:00Z"}}));
  const d=routeControlTask(objective(),task(),r,now);
  assert.equal(d.selectedResourceId,undefined);
  assert.ok(d.excluded[0]!.reasons.includes("identity_not_observed_attested_or_fresh"));
});

test("reconciliation reports desired-vs-observed gaps deterministically",()=>{
  const d=desiredStateFor(objective());
  const r=reconcileState(d,{objectiveId:"obj-1",executionStatus:"not_executed",succeededTaskIds:[],failedOrBlockedTaskIds:[],evidenceReceipts:[],executedCapabilities:[],successCriteria:{"artifact verified":false},hardGates:{tests:false,truth:false}});
  assert.equal(r.converged,false); assert.ok(r.gaps.length>=5);
});


test("independent verification routes same-group tasks to distinct resources and enforces two sources",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("a")); registry.register(resource("b",{measurements:{quality:8.9,latencyMs:120,costIndex:1,successRate:.94,sampleSize:18}}));
  const o=objective({verification:{minEvidenceReceipts:2,requireIndependentVerification:true,minIndependentEvidenceSources:2}});
  const tasks=[task({id:"r1",actionId:"ar1",independenceGroup:"verify"}),task({id:"r2",actionId:"ar2",independenceGroup:"verify"})];
  const report=await runControlPlane(o,tasks,{registry,getFreshManifest:manifest,adapters:[adapter("adapter-a"),adapter("adapter-b")],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(9.4),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"completed");
  assert.ok(report.rounds[0]!.routes[0]!.selectedResourceId!==report.rounds[0]!.routes[1]!.selectedResourceId);
});

test("objective data scope is an authority boundary",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("a",{allowedDataScopes:["public","private.secret"]}));
  const t=task({dataScopes:["private.secret"]});
  const report=await runControlPlane(objective(),[t],{registry,getFreshManifest:manifest,adapters:[adapter("adapter-a")],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"held"); assert.equal(report.rounds[0]!.policy[0]!.reason,"objective_data_scope_violation");
});

test("objective cannot converge when a declared required capability was never executed",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("a"));
  const o=objective({requiredCapabilities:["web.search","code.execute"]});
  const report=await runControlPlane(o,[task()],{registry,getFreshManifest:manifest,adapters:[adapter("adapter-a")],now:()=>now,evaluateSuccessCriteria:criteria,evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"needs_reconciliation"); assert.ok(report.finalReconciliation.gaps.some(g=>g.code==="required_capability_not_executed" && g.detail==="code.execute"));
});


test("unverified objective success criterion prevents convergence",async()=>{
  const registry=new ControlPlaneRegistry(); registry.register(resource("a"));
  const report=await runControlPlane(objective(),[task()],{registry,getFreshManifest:manifest,adapters:[adapter("adapter-a")],now:()=>now,evaluateSuccessCriteria:()=>({"artifact verified":false}),evaluateQuality:()=>q(10),evaluateHardGates:()=>({tests:true,truth:true})});
  assert.equal(report.status,"needs_reconciliation"); assert.ok(report.finalReconciliation.gaps.some(g=>g.code==="success_criterion_not_verified"));
});
