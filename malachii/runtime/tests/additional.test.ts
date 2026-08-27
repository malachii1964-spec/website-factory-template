import test from "node:test";
import assert from "node:assert/strict";
import { authorize, compareRuns, effectiveAssurance, forgeObjective, modeFromAssessment, runCouncil, scoreObjective, type RuntimeManifest, type Worker } from "../src/index.js";

const now=new Date("2026-08-15T08:00:00Z");

test("authenticated declaration is A2 but not executable",()=>{
  const m:RuntimeManifest={host:{id:"x"},capabilities:[{name:"github.read",evidence:[{id:"d",kind:"authenticated_declaration",source:"provider",authenticity:"verified",directness:"direct",capability:"github.read",scope:["repo:a"],verifiedAt:now.toISOString()}]}]};
  assert.equal(effectiveAssurance(m.capabilities[0]!,"repo:a",now),"A2_AUTHENTICATED_DECLARATION");
  assert.equal(authorize(m,{capability:"github.read",scope:"repo:a",impact:"read_only"},now).decision,"deny");
});

test("observed scope mismatch fails closed",()=>{
  const m:RuntimeManifest={host:{id:"x"},capabilities:[{name:"github.read",evidence:[{id:"o",kind:"observation",source:"probe",authenticity:"verified",directness:"direct",capability:"github.read",scope:["repo:a"],observedSuccess:true,verifiedAt:now.toISOString()}]}]};
  assert.equal(authorize(m,{capability:"github.read",scope:"repo:b",impact:"read_only"},now).decision,"deny");
});

test("high uncertainty forces sovereign escalated",()=>{
  const a=scoreObjective("best");
  const forced={...a,objectiveUncertainty:9};
  assert.equal(modeFromAssessment(forced),"sovereign_escalated");
});

test("forge never routes high risk to direct",()=>{
  const a=scoreObjective("delete production database permanently");
  const f=forgeObjective("risk","delete production database permanently",a);
  assert.ok(f.execution.mode!=="direct");
});

test("eval harness ranks higher floor first",()=>{
  const q=(n:number)=>({accuracy:n,verification:n,completeness:n,intentAlignment:n,executionReadiness:n,structure:n,edgeCases:n});
  const ranked=compareRuns([{label:"direct",scores:q(7),latencyMs:10,repairRounds:0},{label:"council",scores:q(9),latencyMs:100,repairRounds:1}]);
  assert.equal(ranked[0]!.label,"council");
});

test("minimal council runs workers before synthesis",async()=>{
  const mk=(id:string):Worker=>({id,role:"worker",async run(objective){return {workerId:id,role:"worker",output:`${id}:${objective}`,evidenceIds:[]};}});
  const result=await runCouncil("collaborative","objective",[mk("a"),mk("b")],
    {async critique(_o,c){return `critique:${c.length}`;}},
    {async verify(){return "verified";}},
    {async synthesize(_o,c,cr,v){return `${c.length}|${cr}|${v}`;}});
  assert.equal(result.candidates.length,2);
  assert.equal(result.final,"2|critique:2|verified");
});
