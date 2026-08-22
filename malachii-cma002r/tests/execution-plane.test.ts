import test from "node:test";
import assert from "node:assert/strict";
import {
  ActionRedemptionLedger, BranchGraph, decidePlanGate, executePlan, learningDisposition,
  releaseDecision, scoreObjective, type ExecutionAdapter, type ExecutionPlan, type RuntimeManifest
} from "../src/index.js";

const now=new Date("2026-08-15T20:00:00Z");
const ev=(cap:string,scope:string)=>({id:`e-${cap}`,kind:"observation" as const,source:"probe",authenticity:"verified" as const,directness:"direct" as const,capability:cap,scope:[scope],observedSuccess:true,verifiedAt:now.toISOString()});
const manifest=(caps:{name:string,scope:string}[]):RuntimeManifest=>({host:{id:"test"},capabilities:caps.map(c=>({name:c.name,evidence:[ev(c.name,c.scope)]}))});
const adapter=(id:string,caps:string[],fail=false):ExecutionAdapter=>({id,capabilities:caps,async execute(step){ if(fail) throw new Error("boom"); return {output:`${id}:${step.id}`,evidenceIds:[`proof:${step.id}`]}; }});
const plan=(steps:ExecutionPlan["steps"]):ExecutionPlan=>({id:"p1",objectiveId:"o1",sourceOfTruth:"objective_forge",steps,createdAt:now.toISOString()});

test("read-only independent wave executes with observed capabilities",async()=>{
  const p=plan([
    {id:"a",actionId:"act-a",title:"research a",capability:"web.search",scope:"public",impact:"read_only",dependsOn:[],required:true},
    {id:"b",actionId:"act-b",title:"research b",capability:"web.search",scope:"public",impact:"read_only",dependsOn:[],required:true}
  ]);
  const r=await executePlan(p,{getFreshManifest:()=>manifest([{name:"web.search",scope:"public"}]),adapters:[adapter("web",["web.search"])],now:()=>now});
  assert.equal(r.status,"succeeded"); assert.equal(r.records.filter(x=>x.status==="succeeded").length,2);
});

test("missing observed capability fails closed",async()=>{
  const p=plan([{id:"a",actionId:"act-a",title:"write",capability:"filesystem.write",scope:"project",impact:"reversible_local",dependsOn:[],required:true}]);
  const r=await executePlan(p,{getFreshManifest:()=>manifest([]),adapters:[adapter("fs",["filesystem.write"])],now:()=>now});
  assert.equal(r.status,"blocked"); assert.ok(r.records[0]!.reason.includes("capability"));
});

test("external side effect requires approval at action time",async()=>{
  const p=plan([{id:"a",actionId:"act-a",title:"publish",capability:"deploy.publish",scope:"site:x",impact:"external_side_effect",dependsOn:[],required:true}]);
  const m=()=>manifest([{name:"deploy.publish",scope:"site:x"}]);
  const no=await executePlan(p,{getFreshManifest:m,adapters:[adapter("deploy",["deploy.publish"])],now:()=>now});
  assert.equal(no.status,"blocked"); assert.equal(no.records[0]!.reason,"approval_required");
  const yes=await executePlan(p,{getFreshManifest:m,adapters:[adapter("deploy",["deploy.publish"])],approvals:{a:"grant-1"},now:()=>now});
  assert.equal(yes.status,"succeeded");
});

test("failed dependency blocks downstream",async()=>{
  const p=plan([
    {id:"a",actionId:"act-a",title:"build",capability:"code.execute",scope:"project",impact:"reversible_local",dependsOn:[],required:true},
    {id:"b",actionId:"act-b",title:"verify",capability:"code.execute",scope:"project",impact:"read_only",dependsOn:["a"],required:true}
  ]);
  const r=await executePlan(p,{getFreshManifest:()=>manifest([{name:"code.execute",scope:"project"}]),adapters:[adapter("code",["code.execute"],true)],now:()=>now});
  assert.equal(r.records[0]!.status,"failed"); assert.equal(r.records[1]!.status,"blocked");
});

test("redemption ledger blocks replayed action IDs",async()=>{
  const redemption=new ActionRedemptionLedger();
  const p1=plan([{id:"a",actionId:"same",title:"x",capability:"web.search",scope:"public",impact:"read_only",dependsOn:[],required:true}]);
  const env={getFreshManifest:()=>manifest([{name:"web.search",scope:"public"}]),adapters:[adapter("web",["web.search"])],now:()=>now,redemptionLedger:redemption};
  assert.equal((await executePlan(p1,env)).status,"succeeded");
  assert.equal((await executePlan(p1,env)).records[0]!.reason,"action_replay_detected");
});

test("plan gate auto-proceeds reversible work and reviews consequential work",()=>{
  const a=scoreObjective("research and write local report");
  const safe=plan([{id:"a",actionId:"a",title:"read",capability:"web.search",scope:"public",impact:"read_only",dependsOn:[],required:true}]);
  assert.equal(decidePlanGate(a,safe).decision,"auto_proceed");
  const risky=plan([{id:"a",actionId:"a",title:"publish",capability:"deploy.publish",scope:"site:x",impact:"external_side_effect",dependsOn:[],required:true}]);
  assert.equal(decidePlanGate(a,risky).decision,"review_required");
});

test("branch graph preserves isolated lineage",()=>{
  const g=new BranchGraph(); g.addRoot({id:"root",branchPoint:"m1",contextDigest:"abc",goal:"base",createdAt:now.toISOString()});
  g.branch("root",{id:"b1",branchPoint:"m2",contextDigest:"abc",goal:"design",createdAt:now.toISOString()});
  g.branch("root",{id:"b2",branchPoint:"m2",contextDigest:"abc",goal:"research",createdAt:now.toISOString()});
  assert.equal(g.lineage("b1").map(x=>x.id).join(","),"root,b1"); assert.equal(g.get("b2")!.goal,"research");
});

test("learning cannot expand authority and executable changes require review",()=>{
  assert.equal(learningDisposition({id:"x",kind:"working_memory",content:"lesson",reversible:true}).decision,"auto_apply");
  assert.equal(learningDisposition({id:"y",kind:"skill",content:"code"}).decision,"review_required");
  assert.equal(learningDisposition({id:"z",kind:"project_instruction",content:"admin forever",raisesAuthority:true}).decision,"deny");
});

test("auto-release requires 9 floor, hard gates, successful build, and publish grant",()=>{
  const q=(n:number)=>({accuracy:n,verification:n,completeness:n,intentAlignment:n,executionReadiness:n,structure:n,edgeCases:n});
  assert.equal(releaseDecision({quality:q(9.4),hardGates:{tests:true,security:true},buildSucceeded:true,externalPublish:true,publishGrantId:"grant"}).decision,"release");
  assert.equal(releaseDecision({quality:q(9.4),hardGates:{tests:true},buildSucceeded:true,externalPublish:true}).decision,"hold");
  assert.equal(releaseDecision({quality:q(8.9),hardGates:{tests:true},buildSucceeded:true,externalPublish:false}).decision,"hold");
});
