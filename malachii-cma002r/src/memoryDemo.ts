import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AtomicFileStateStore } from "./durableState.js";
import { EventLedger } from "./eventLedger.js";
import { EvolvingMemoryFabric } from "./memoryFabric.js";

const root=await mkdtemp(join(tmpdir(),"malachii-memf-demo-"));
try {
  const ledger=new EventLedger();
  const fabric=new EvolvingMemoryFabric(new AtomicFileStateStore(root),ledger);
  const observed=await fabric.createMemory({
    id:"mem_runtime_observation",
    layer:"semantic",
    scope:["project:demo"],
    subject:"runtime",
    statement:"Project Demo uses Node 24.",
    assertion:{subject:"project:demo",predicate:"uses_runtime",object:"node:24"},
    confidence:0.92,
    importance:0.8,
    tags:["node","runtime","deployment"],
    createdBy:"memory-demo",
    evidenceIds:["package_json","runtime_probe"],
    sourceRefs:[
      {id:"package_json",kind:"artifact",sourceGroup:"repository"},
      {id:"runtime_probe",kind:"test",sourceGroup:"independent-runtime-probe"}
    ]
  },new Date("2026-08-18T12:00:00Z"));

  const candidate=await fabric.promote(observed.id,"M1_CANDIDATE",{
    supportingEvidenceCount:2,independentSourceCount:2,contradictionCount:0,regressionPassed:false
  },new Date("2026-08-18T12:01:00Z"));

  const corroborated=await fabric.promote(observed.id,"M2_CORROBORATED",{
    supportingEvidenceCount:2,independentSourceCount:2,contradictionCount:0,regressionPassed:false
  },new Date("2026-08-18T12:02:00Z"));

  const retrieved=await fabric.retrieve({text:"Node deployment runtime",scopes:["project:demo"],limit:3},new Date("2026-08-18T12:03:00Z"));
  const learning=await fabric.proposeLearning({
    id:"learn_predeploy_env",
    rootCause:"A required runtime environment variable was absent during deployment.",
    repair:"Added the variable and repeated deployment successfully.",
    reusableRule:"Before production deployment, verify required runtime environment variables against the target environment.",
    scope:["web.deploy"],
    severity:"medium",
    evidenceIds:["failure_log","repair_success"],
    sourceMemoryIds:[observed.id],
    regressionTestIds:["env_contract_test"],
    targetKind:"skill",
    confidence:0.95
  },new Date("2026-08-18T12:04:00Z"));

  console.log(JSON.stringify({
    schema:"malachii.memf.demo.v1",
    memoryId:observed.id,
    candidatePromotion:candidate.decision,
    corroboratedPromotion:corroborated.decision,
    retrieved:retrieved.map(x=>({id:x.memory.id,score:x.score,reasons:x.reasons})),
    learning:{id:learning.id,decision:fabric.learningDecision(learning)},
    ledgerVerified:ledger.verify(),
    ledgerEvents:ledger.snapshot().length
  },null,2));
} finally {
  await rm(root,{recursive:true,force:true});
}
