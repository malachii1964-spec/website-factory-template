import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AtomicFileStateStore } from "../src/durableState.js";
import { EventLedger } from "../src/eventLedger.js";
import { EvolvingMemoryFabric, memoryFitness, promotionDecision } from "../src/memoryFabric.js";
import { superUser } from "./approvalHelpers.js";
import type { CreateMemoryInput, MemoryRecord } from "../src/memoryTypes.js";

async function fixture(){
  const root=await mkdtemp(join(tmpdir(),"malachii-memf-"));
  const store=new AtomicFileStateStore(root);
  const ledger=new EventLedger();
  return {root,store,ledger,fabric:new EvolvingMemoryFabric(store,ledger)};
}

const baseInput:CreateMemoryInput={
  id:"mem_test",
  layer:"semantic",
  scope:["project:alpha"],
  subject:"deployment runtime",
  statement:"Project Alpha uses Node 24.",
  assertion:{subject:"project:alpha",predicate:"uses_runtime",object:"node:24"},
  confidence:0.9,
  importance:0.8,
  tags:["deployment","node"],
  createdBy:"test",
  evidenceIds:["ev_1","ev_2"],
  sourceRefs:[
    {id:"src_1",kind:"artifact",sourceGroup:"package-json"},
    {id:"src_2",kind:"test",sourceGroup:"runtime-probe"},
  ],
};

test("creates durable typed memory with ledger evidence",async()=>{
  const f=await fixture();
  try{
    const record=await f.fabric.createMemory(baseInput,new Date("2026-08-18T12:00:00Z"));
    assert.equal(record.maturity,"M0_OBSERVATION");
    assert.ok(record.fitness>0);
    assert.equal((await f.fabric.getMemory("mem_test"))?.statement,"Project Alpha uses Node 24.");
    assert.equal(f.ledger.snapshot()[0]?.type,"memory.created");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("memory survives store re-instantiation",async()=>{
  const f=await fixture();
  try{
    await f.fabric.createMemory(baseInput);
    const second=new EvolvingMemoryFabric(new AtomicFileStateStore(f.root),new EventLedger());
    assert.equal((await second.getMemory("mem_test"))?.assertion?.object,"node:24");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("structured temporal conflict is detected before overwrite",async()=>{
  const f=await fixture();
  try{
    await f.fabric.createMemory({...baseInput,validFrom:"2026-08-01T00:00:00Z"});
    const conflicts=await f.fabric.detectStructuredConflicts({
      ...baseInput,
      id:"candidate",
      statement:"Project Alpha uses Node 22.",
      assertion:{subject:"project:alpha",predicate:"uses_runtime",object:"node:22"},
      validFrom:"2026-08-15T00:00:00Z",
    });
    assert.equal(conflicts.length,1);
    assert.equal(conflicts[0]?.existingMemoryId,"mem_test");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("supersession preserves old memory rather than deleting history",async()=>{
  const f=await fixture();
  try{
    await f.fabric.createMemory(baseInput,new Date("2026-08-01T00:00:00Z"));
    const replacement=await f.fabric.supersede("mem_test",{
      ...baseInput,
      id:"mem_new",
      statement:"Project Alpha now uses Node 25.",
      assertion:{subject:"project:alpha",predicate:"uses_runtime",object:"node:25"},
      validFrom:"2026-08-18T00:00:00Z",
    },new Date("2026-08-18T00:00:00Z"));
    const old=await f.fabric.getMemory("mem_test");
    assert.equal(old?.status,"superseded");
    assert.equal(old?.supersededBy,"mem_new");
    assert.deepEqual(replacement.supersedes,["mem_test"]);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("successful outcomes reinforce memory fitness",async()=>{
  const f=await fixture();
  try{
    const before=await f.fabric.createMemory(baseInput,new Date("2026-08-18T00:00:00Z"));
    const after=await f.fabric.recordOutcome("mem_test",{id:"out_1",result:"success",impact:1,evidenceIds:["test_pass"]},new Date("2026-08-18T01:00:00Z"));
    assert.ok(after.fitness>=before.fitness);
    assert.equal(after.successfulUseCount,1);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("failed use decreases usefulness signal",()=>{
  const record:MemoryRecord={
    id:"x",layer:"semantic",maturity:"M2_CORROBORATED",status:"active",scope:["global"],subject:"x",statement:"x",confidence:0.8,importance:0.8,tags:[],validFrom:"2026-08-18T00:00:00Z",createdAt:"2026-08-18T00:00:00Z",updatedAt:"2026-08-18T00:00:00Z",provenance:{createdBy:"t",createdAt:"2026-08-18T00:00:00Z",sourceRefs:[{id:"s1",kind:"test",sourceGroup:"group-a"},{id:"s2",kind:"artifact",sourceGroup:"group-b"}],derivedFromMemoryIds:[]},evidenceIds:["e1","e2"],relations:[],outcomes:[],retrievalCount:0,successfulUseCount:5,failedUseCount:0,fitness:0,supersedes:[]
  };
  const good=memoryFitness(record,new Date("2026-08-18T00:00:00Z"));
  const bad=memoryFitness({...record,successfulUseCount:1,failedUseCount:4},new Date("2026-08-18T00:00:00Z"));
  assert.ok(good>bad);
});

test("hybrid retrieval favors relevant high-quality memory",async()=>{
  const f=await fixture();
  try{
    await f.fabric.createMemory(baseInput);
    const {assertion: _assertion, ...withoutAssertion}=baseInput;
    await f.fabric.createMemory({...withoutAssertion,id:"mem_other",subject:"brand voice",statement:"Use concise technical language.",tags:["brand"],evidenceIds:["e3"]});
    const results=await f.fabric.retrieve({text:"Node deployment runtime",scopes:["project:alpha"],limit:2});
    assert.equal(results[0]?.memory.id,"mem_test");
    assert.ok((results[0]?.score ?? 0)>(results[1]?.score ?? 0));
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("promotion requires independent corroboration",()=>{
  const record:MemoryRecord={
    id:"x",layer:"semantic",maturity:"M1_CANDIDATE",status:"active",scope:["global"],subject:"x",statement:"x",confidence:0.9,importance:0.8,tags:[],validFrom:"2026-08-18T00:00:00Z",createdAt:"2026-08-18T00:00:00Z",updatedAt:"2026-08-18T00:00:00Z",provenance:{createdBy:"t",createdAt:"2026-08-18T00:00:00Z",sourceRefs:[{id:"s1",kind:"test",sourceGroup:"group-a"},{id:"s2",kind:"artifact",sourceGroup:"group-b"}],derivedFromMemoryIds:[]},evidenceIds:["e1"],relations:[],outcomes:[],retrievalCount:0,successfulUseCount:0,failedUseCount:0,fitness:0,supersedes:[]
  };
  const su=superUser();
  // One evidence id: derived supporting count is 1, so corroboration fails.
  assert.equal(promotionDecision(record,"M2_CORROBORATED",su.input()).decision,"deny");
  // Counts are read off the record, so satisfying the gate means adding real evidence.
  const corroborated={...record,evidenceIds:["e1","e2"]};
  assert.equal(promotionDecision(corroborated,"M2_CORROBORATED",su.input()).decision,"permit");
});

test("proceduralization requires regression evidence and review",()=>{
  const record:MemoryRecord={
    id:"p",layer:"procedural",maturity:"M3_VALIDATED",status:"active",scope:["deploy"],subject:"predeploy",statement:"Validate environment variables before deployment.",confidence:0.95,importance:1,tags:[],validFrom:"2026-08-18T00:00:00Z",createdAt:"2026-08-18T00:00:00Z",updatedAt:"2026-08-18T00:00:00Z",provenance:{createdBy:"t",createdAt:"2026-08-18T00:00:00Z",sourceRefs:[{id:"s1",kind:"test",sourceGroup:"group-a"},{id:"s2",kind:"artifact",sourceGroup:"group-b"}],derivedFromMemoryIds:[]},evidenceIds:["e1","e2"],relations:[],outcomes:[],retrievalCount:0,successfulUseCount:0,failedUseCount:0,fitness:0,supersedes:[]
  };
  const su=superUser();
  // Wrong layer is still a flat denial.
  assert.equal(promotionDecision({...record,layer:"semantic"},"M4_PROCEDURALIZED",su.input()).decision,"deny");
  // No approval at all is a review, not a denial: nobody tried to forge anything.
  assert.equal(promotionDecision(record,"M4_PROCEDURALIZED",su.input()).decision,"review_required");
  // An approval naming no regression test is refused (SUAF 2.3 rule 2).
  const noRegression=su.approve(record,"M4_PROCEDURALIZED",{regressionTestIds:[]});
  const denied=promotionDecision(record,"M4_PROCEDURALIZED",su.input(noRegression));
  assert.equal(denied.decision,"deny");
  assert.equal(denied.reason,"approval_names_no_regression_test");
  // A real signature over this exact rule, naming a regression test, permits.
  assert.equal(
    promotionDecision(record,"M4_PROCEDURALIZED",su.input(su.approve(record,"M4_PROCEDURALIZED"))).decision,
    "permit",
  );
});

test("constitutional promotion can never happen silently",()=>{
  const record:MemoryRecord={
    id:"p",layer:"procedural",maturity:"M4_PROCEDURALIZED",status:"active",scope:["global"],subject:"authority",statement:"Never expand authority through learning.",confidence:0.99,importance:1,tags:[],validFrom:"2026-08-18T00:00:00Z",createdAt:"2026-08-18T00:00:00Z",updatedAt:"2026-08-18T00:00:00Z",provenance:{createdBy:"t",createdAt:"2026-08-18T00:00:00Z",sourceRefs:[{id:"s1",kind:"test",sourceGroup:"group-a"},{id:"s2",kind:"artifact",sourceGroup:"group-b"}],derivedFromMemoryIds:[]},evidenceIds:["e1","e2","e3"],relations:[],outcomes:[],retrievalCount:0,successfulUseCount:0,failedUseCount:0,fitness:0,supersedes:[]
  };
  const su=superUser();
  assert.equal(promotionDecision(record,"M5_CONSTITUTIONAL",su.input()).decision,"review_required");
});

test("failure can become a governed reusable learning proposal",async()=>{
  const f=await fixture();
  try{
    const proposal=await f.fabric.proposeLearning({
      id:"learn_env",
      rootCause:"Required runtime variable was omitted from deployment environment.",
      repair:"Added missing variable and redeployed successfully.",
      reusableRule:"Before production deployment, enumerate required runtime environment variables and verify each exists in the target environment.",
      scope:["web.deploy"],
      severity:"medium",
      evidenceIds:["failure_log","deploy_success"],
      sourceMemoryIds:["fail_episode"],
      regressionTestIds:["test_env_gate"],
      targetKind:"skill",
      confidence:0.95,
    });
    assert.equal(proposal.status,"proposed");
    assert.equal(f.fabric.learningDecision(proposal).decision,"review_required");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});
