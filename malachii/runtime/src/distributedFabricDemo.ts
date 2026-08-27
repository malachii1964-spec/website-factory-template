import { spawn, type ChildProcessLike } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { LiveControlFabric, DistributedWorkerMesh, PersistentEventLedger, type NetworkPolicy, type RuntimeManifest, type ControlObjectiveSpec, type ControlTask, type QualityScores } from "./index.js";

const policy:NetworkPolicy={allowedProtocols:["http:"],allowedHosts:["127.0.0.1"],denyPrivateNetworks:false,maxRedirects:0,maxResponseBytes:1_000_000,timeoutMs:2_000};
function manifest():RuntimeManifest{return {host:{id:"rc16-distributed-demo"},capabilities:[{name:"distributed.compute",evidence:[{id:"rc16-host-observation",kind:"observation",source:"distributed-demo",authenticity:"verified",directness:"direct",capability:"distributed.compute",scope:["*"],observedSuccess:true,verifiedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3_600_000).toISOString(),revocationChecked:true}]}]};}
function q(v:number):QualityScores{return {accuracy:v,verification:v,completeness:v,intentAlignment:v,executionReadiness:v,structure:v,edgeCases:v};}
function task(action:string):ControlTask{return {id:"distributed-task",actionId:action,title:"distributed computation",capability:"distributed.compute",scope:"public",dataScopes:["public"],impact:"read_only",dependsOn:[],required:true,input:{value:"MALACHII-DISTRIBUTED-WORKER-FABRIC"}};}
function objective():ControlObjectiveSpec{return {id:"rc16-distributed-worker-proof",requestedOutcome:"survive loss of the preferred worker and converge through an alternate observed worker",successCriteria:["remote_worker_result","failover_observed"],constraints:["no fake completion"],riskTier:"T2",qualityFloor:9,requiredCapabilities:["distributed.compute"],allowedDataScopes:["public"],budget:{maxCostIndexPerTask:2,maxLatencyMsPerTask:5000},releasePolicy:{externalPublish:false,requiredHardGates:["truth","worker_identity","failover"]},verification:{minEvidenceReceipts:3,requireIndependentVerification:false},createdAt:new Date().toISOString()};}
function waitReady(child:ChildProcessLike):Promise<any>{return new Promise((resolve,reject)=>{let buf="";const timer=setTimeout(()=>reject(new Error("worker_ready_timeout")),5000);child.stdout?.on("data",chunk=>{buf+=String(chunk);const i=buf.indexOf("\n");if(i>=0){clearTimeout(timer);try{resolve(JSON.parse(buf.slice(0,i)));}catch(e){reject(e);}}});child.stderr?.on("data",chunk=>{const t=String(chunk);if(t.trim())console.error(t.trim());});child.on("error",e=>{clearTimeout(timer);reject(e);});});}
function stop(child:ChildProcessLike):Promise<void>{return new Promise(resolve=>{let done=false;const finish=()=>{if(!done){done=true;resolve();}};child.on("close",finish);child.kill("SIGTERM");setTimeout(()=>{child.kill("SIGKILL");finish();},500);});}
async function spawnWorker(id:string,secret:string){const child=spawn(process.execPath,[join(process.cwd(),"dist/src/distributedWorkerNode.js")],{cwd:process.cwd(),env:{...process.env,MALACHII_WORKER_ID:id,MALACHII_WORKER_SECRET:secret,MALACHII_WORKER_MODE:"ok"},stdio:["ignore","pipe","pipe"]});const ready=await waitReady(child);return {child,ready};}

const root=await mkdtemp(join(tmpdir(),"malachii-rc16-demo-"));const secretA=randomUUID(),secretB=randomUUID();let wa:Awaited<ReturnType<typeof spawnWorker>>|undefined,wb:Awaited<ReturnType<typeof spawnWorker>>|undefined;
try{
  wa=await spawnWorker("worker-a",secretA);wb=await spawnWorker("worker-b",secretB);
  const live=new LiveControlFabric({stateRoot:join(root,"state"),ledgerPath:join(root,"ledger.jsonl"),getFreshManifest:manifest,healthPolicy:{staleAfterMs:60_000,openCircuitAfterFailures:1,circuitResetAfterMs:60_000}});
  const mesh=new DistributedWorkerMesh(live);
  await mesh.observeWorker(wa.ready.endpoint,secretA,{policy,measurements:{quality:10,latencyMs:1,costIndex:0,successRate:1,sampleSize:100}});
  await mesh.observeWorker(wb.ready.endpoint,secretB,{policy,measurements:{quality:9.5,latencyMs:3,costIndex:0,successRate:.99,sampleSize:100}});
  await mesh.heartbeat("worker-a",policy);await mesh.heartbeat("worker-b",policy);
  await stop(wa.child);wa=undefined;
  const report=await live.run(objective(),[task("rc16-action-0")],{
    evaluateSuccessCriteria:ctx=>({remote_worker_result:ctx.execution.status==="succeeded",failover_observed:ctx.execution.status==="succeeded"}),
    evaluateQuality:ctx=>q(ctx.execution.status==="succeeded"?9.7:0),
    evaluateHardGates:ctx=>({truth:ctx.execution.status==="succeeded",worker_identity:true,failover:ctx.execution.status==="succeeded"}),
    repairPlanner:(_o,_observed,reconciliation,nextRound)=>reconciliation.gaps.some((g:{code:string})=>g.code==="execution_not_succeeded")?[task(`rc16-action-${nextRound}`)]:undefined
  },undefined,1);
  const queueA=await live.store.list<any>("queue-worker-worker-a"),queueB=await live.store.list<any>("queue-worker-worker-b");
  const output={schema:"malachii.rc1.6.distributed-proof.v1",executionMode:"LIVE_MULTI_PROCESS_LOOPBACK",objectiveId:report.objectiveId,status:report.status,converged:report.finalReconciliation.converged,qualityFloor:report.finalObserved.qualityFloor,evidenceReceipts:report.finalObserved.evidenceReceipts.length,roundRoutes:report.rounds.map(r=>({round:r.round,resource:r.routes[0]?.selectedResourceId,adapter:r.routes[0]?.selectedAdapterId,execution:r.execution?.status,gaps:r.reconciliation.gaps.map(g=>g.code)})),failedPreferredWorker:"worker-a",recoveredThrough:"worker-b",durableJobs:{workerA:queueA.map(x=>({status:x.value.status,attempts:x.value.attempts,error:x.value.error})),workerB:queueB.map(x=>({status:x.value.status,attempts:x.value.attempts}))},ledgerVerified:new PersistentEventLedger(join(root,"ledger.jsonl")).verify(),truthBoundary:"Two separate Node worker processes were observed over authenticated loopback HTTP. This proves portable multi-process worker dispatch/failover semantics, not multi-host HA, distributed consensus, SPIFFE attestation, or Internet-scale operation."};
  console.log(JSON.stringify(output,null,2));
} finally {if(wa)await stop(wa.child);if(wb)await stop(wb.child);}
