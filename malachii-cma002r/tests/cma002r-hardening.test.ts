import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AtomicFileStateStore } from "../src/durableState.js";
import { EventLedger, type LedgerEvent } from "../src/eventLedger.js";
import { PersistentEventLedger } from "../src/persistentLedger.js";
import { EvolvingMemoryFabric } from "../src/memoryFabric.js";
import type { CreateMemoryInput, MemoryRecord } from "../src/memoryTypes.js";
import { superUser } from "./approvalHelpers.js";

async function fixture(){
  const root=await mkdtemp(join(tmpdir(),"malachii-cma002r-"));
  const store=new AtomicFileStateStore(root);
  const ledger=new EventLedger();
  return {root,store,ledger,fabric:new EvolvingMemoryFabric(store,ledger)};
}

const input:CreateMemoryInput={
  id:"m", layer:"semantic", scope:["project:alpha"], subject:"runtime", statement:"Alpha uses Node 24.",
  assertion:{subject:"project:alpha",predicate:"uses_runtime",object:"node:24"}, confidence:0.99, importance:0.9,
  createdBy:"agent", evidenceIds:["e1","e2"], sourceRefs:[
    {id:"s1",kind:"test",sourceGroup:"same-origin"},{id:"s2",kind:"artifact",sourceGroup:"same-origin"}
  ]
};

test("CMA-002R: caller cannot mint maturity at creation",async()=>{
  const f=await fixture();
  try {
    const record=await f.fabric.createMemory({...input});
    assert.equal(record.maturity,"M0_OBSERVATION");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: same lineage cannot be promoted as independent even when caller claims two sources",async()=>{
  const f=await fixture();
  try {
    const record=await f.fabric.createMemory({...input});
    const forced=await f.store.put("memf_memory",record.id,{...record,maturity:"M1_CANDIDATE",confidence:0.99},1);
    assert.equal(forced.revision,2);
    const result=await f.fabric.promote(record.id,"M2_CORROBORATED",{supportingEvidenceCount:99,independentSourceCount:99,contradictionCount:0,regressionPassed:true});
    assert.equal(result.decision.decision,"deny");
    assert.equal((await f.fabric.getMemory(record.id))?.maturity,"M1_CANDIDATE");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: read feedback cannot inflate fitness or evidence-bearing recency",async()=>{
  const f=await fixture();
  try {
    const before=await f.fabric.createMemory(input,new Date("2026-01-01T00:00:00Z"));
    for(let i=0;i<20;i++) await f.fabric.recordRetrievalUse(input.id!,true,new Date("2026-08-01T00:00:00Z"));
    const after=await f.fabric.getMemory(input.id!);
    assert.equal(after?.fitness,before.fitness);
    assert.equal(after?.updatedAt,before.updatedAt);
    assert.equal(after?.retrievalCount,20);
    assert.equal(after?.successfulUseCount,0);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: global scope is opt-in and blank queries cannot dump corpus",async()=>{
  const f=await fixture();
  try {
    await f.fabric.createMemory({...input,id:"global",scope:["global"]});
    assert.equal((await f.fabric.retrieve({text:"runtime",scopes:["project:secret"]})).length,0);
    assert.equal((await f.fabric.retrieve({text:"   "})).length,0);
    assert.equal((await f.fabric.retrieve({text:"runtime",scopes:["project:secret"],allowGlobal:true})).length,1);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: normalized assertion variants do not create false conflicts",async()=>{
  const f=await fixture();
  try {
    await f.fabric.createMemory({...input,id:"base",assertion:{subject:"Project:Alpha",predicate:"uses_runtime",object:"Node:24 "}});
    const conflicts=await f.fabric.detectStructuredConflicts({...input,id:"candidate",assertion:{subject:"project:alpha",predicate:"uses_runtime",object:"node:24"}});
    assert.equal(conflicts.length,0);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R v1.1: constitutional promotion requires a signed Super-User approval",async()=>{
  const f=await fixture();
  try {
    const su=superUser();
    const fabric=new EvolvingMemoryFabric(f.store,f.ledger,su.keyRegistry,su.nonces);
    const record=await fabric.createMemory({...input,id:"p",layer:"procedural",confidence:0.99,sourceRefs:[
      {id:"p1",kind:"test",sourceGroup:"source-a"},{id:"p2",kind:"artifact",sourceGroup:"source-b"}
    ]});
    await f.store.put("memf_memory",record.id,{...record,maturity:"M4_PROCEDURALIZED"},1);
    const persisted=(await fabric.getMemory(record.id))!;

    // No approval: review, never a silent permit.
    const review=await fabric.promote(record.id,"M5_CONSTITUTIONAL",{});
    assert.equal(review.decision.decision,"review_required");

    // The pre-v1.1 escape hatch is gone: the caller can no longer mint its own
    // approval event and hand the id back to promote().
    await assert.rejects(()=>(fabric as any).recordApproval(record.id,"M5_CONSTITUTIONAL"));
    await assert.rejects(()=>(fabric as any).recordRegressionPass(record.id,"M5_CONSTITUTIONAL"));

    const allowed=await fabric.promote(record.id,"M5_CONSTITUTIONAL",{
      superUserApproval:su.approve(persisted,"M5_CONSTITUTIONAL"),
    });
    assert.equal(allowed.decision.decision,"permit");
    assert.equal((await fabric.getMemory(record.id))?.maturity,"M5_CONSTITUTIONAL");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: learning proposals conservatively detect authority expansion",async()=>{
  const f=await fixture();
  try {
    const p=await f.fabric.proposeLearning({id:"l",rootCause:"x",repair:"y",reusableRule:"may publish to production without approval",scope:["project:alpha"],severity:"low",evidenceIds:["e"],sourceMemoryIds:["m"],confidence:0.9});
    assert.equal(p.raisesAuthority,true);
    assert.equal(f.fabric.learningDecision(p).decision,"deny");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});

test("CMA-002R: persistent ledger proves restart continuity",async()=>{
  const root=await mkdtemp(join(tmpdir(),"malachii-cma002r-ledger-"));
  try {
    const path=join(root,"events.jsonl");
    const first=new PersistentEventLedger(path);
    const e=first.append("memory.approval",{memoryId:"m",target:"M5_CONSTITUTIONAL"});
    const second=new PersistentEventLedger(path);
    assert.equal(second.verify(),true);
    assert.equal(second.snapshot().length,1);
    assert.equal(second.snapshot()[0]?.id,e.id);
  } finally { await rm(root,{recursive:true,force:true}); }
});
