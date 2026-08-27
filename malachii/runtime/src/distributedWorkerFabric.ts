import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { ExecutionAdapter, ExecutionAdapterResult, ExecutionStep } from "./executionPlane.js";
import type { ControlResourceDescriptor } from "./controlPlane.js";
import { DurableWorkQueue } from "./durableQueue.js";
import type { StateStore } from "./durableState.js";
import type { LiveControlFabric } from "./liveControlFabric.js";
import { governedFetch, type NetworkPolicy } from "./networkPolicy.js";

function canonical(value:unknown):string{
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  const obj=value as Record<string,unknown>;
  return `{${Object.keys(obj).sort().map(k=>`${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}
function sha(value:string):string{return createHash("sha256").update(value).digest("hex");}
function sign(secret:string,payload:unknown):string{return createHmac("sha256",secret).update(canonical(payload)).digest("hex");}
function signatureOk(secret:string,payload:unknown,signature:string):boolean{
  const expected=sign(secret,payload);
  try{return timingSafeEqual(new TextEncoder().encode(expected),new TextEncoder().encode(signature));}catch{return false;}
}
async function readJson(req:any,maxBytes=1_000_000):Promise<any>{
  let raw="",bytes=0;
  for await(const chunk of req){const text=String(chunk);bytes+=new TextEncoder().encode(text).byteLength;if(bytes>maxBytes)throw new Error("worker_request_too_large");raw+=text;}
  return raw?JSON.parse(raw):{};
}
function json(res:any,status:number,value:unknown){const body=JSON.stringify(value);res.writeHead(status,{"content-type":"application/json","content-length":String(new TextEncoder().encode(body).byteLength)});res.end(body);}

export interface WorkerDescriptor {
  schema:"malachii.worker.descriptor.v1";
  workerId:string;
  endpoint:string;
  capabilities:string[];
  scopes:string[];
  allowedDataScopes:string[];
  tags:string[];
  startedAt:string;
  protocolVersion:"1.0";
}
export interface SignedWorkerMessage<T>{payload:T;signature:string;}
export interface WorkerChallenge {workerId:string;nonce:string;capabilities:string[];issuedAt:string;expiresAt:string;}
export interface WorkerHealth {workerId:string;status:"healthy"|"degraded";heartbeatAt:string;inFlight:number;completed:number;failed:number;revokedCapabilities:string[];}
export interface WorkerExecutionRequest {workerId:string;requestId:string;issuedAt:string;expiresAt:string;nonce:string;step:ExecutionStep;}
export interface WorkerExecutionReceipt {
  schema:"malachii.worker.receipt.v1";
  workerId:string;
  requestId:string;
  stepId:string;
  actionId:string;
  capability:string;
  status:"succeeded"|"failed";
  startedAt:string;
  completedAt:string;
  sequence:number;
  output?:unknown;
  evidenceIds:string[];
  error?:string;
  receiptHash:string;
}

export interface WorkerServerOptions {
  workerId:string;
  secret:string;
  adapters:ExecutionAdapter[];
  scopes?:string[];
  allowedDataScopes?:string[];
  tags?:string[];
  host?:string;
  port?:number;
  challengeTtlMs?:number;
  requestTtlMs?:number;
  maxClockSkewMs?:number;
  now?:()=>Date;
}

/**
 * Portable remote-worker daemon used by RC1.6. Authentication is HMAC-based
 * to keep the artifact dependency-free. This is an observed-identity bootstrap
 * mechanism, NOT a replacement for production mTLS/SPIFFE workload attestation.
 */
export class WorkerDaemonServer {
  private server:any; private endpointValue=""; private startedAt=""; private revoked=new Set<string>(); private seenNonces=new Map<string,number>();
  private inFlight=0; private completed=0; private failed=0; private sequence=0; private now:()=>Date;
  readonly capabilities:string[];
  constructor(readonly options:WorkerServerOptions){
    this.now=options.now??(()=>new Date());
    this.capabilities=[...new Set(options.adapters.flatMap(a=>a.capabilities))].sort();
  }
  get endpoint(){if(!this.endpointValue)throw new Error("worker_not_started");return this.endpointValue;}
  revokeCapability(capability:string){this.revoked.add(capability);}
  restoreCapability(capability:string){this.revoked.delete(capability);}
  descriptor():WorkerDescriptor{return {schema:"malachii.worker.descriptor.v1",workerId:this.options.workerId,endpoint:this.endpoint,capabilities:this.capabilities.filter(c=>!this.revoked.has(c)),scopes:[...(this.options.scopes??["*"])],allowedDataScopes:[...(this.options.allowedDataScopes??["*"])],tags:[...(this.options.tags??[])],startedAt:this.startedAt,protocolVersion:"1.0"};}
  async start():Promise<string>{
    if(this.server)return this.endpoint;
    this.startedAt=this.now().toISOString();
    this.server=createServer(async(req:any,res:any)=>{try{await this.handle(req,res);}catch(e){json(res,500,{error:e instanceof Error?e.message:"worker_internal_error"});}});
    await new Promise<void>((resolve,reject)=>{this.server.once?.("error",reject);this.server.listen(this.options.port??0,this.options.host??"127.0.0.1",()=>resolve());});
    const addr=this.server.address(); const host=typeof addr==="object"&&addr?addr.address:"127.0.0.1"; const port=typeof addr==="object"&&addr?addr.port:this.options.port;
    const normalized=host==="::"?"127.0.0.1":host; this.endpointValue=`http://${normalized}:${port}`; return this.endpoint;
  }
  async close():Promise<void>{if(!this.server)return;const s=this.server;this.server=undefined;await new Promise<void>(resolve=>s.close(()=>resolve()));}
  private purgeNonces(now:number){for(const [nonce,expiry] of this.seenNonces)if(expiry<=now)this.seenNonces.delete(nonce);}
  private signed<T>(payload:T):SignedWorkerMessage<T>{return {payload,signature:sign(this.options.secret,payload)};}
  private health():WorkerHealth{return {workerId:this.options.workerId,status:"healthy",heartbeatAt:this.now().toISOString(),inFlight:this.inFlight,completed:this.completed,failed:this.failed,revokedCapabilities:[...this.revoked].sort()};}
  private async handle(req:any,res:any):Promise<void>{
    const method=String(req.method??"GET").toUpperCase(); const url=String(req.url??"");
    if(method==="GET"&&url==="/v1/descriptor"){const payload=this.descriptor();json(res,200,this.signed(payload));return;}
    if(method==="GET"&&url==="/v1/health"){json(res,200,this.signed(this.health()));return;}
    if(method==="POST"&&url==="/v1/challenge"){
      const body=await readJson(req);const nonce=String(body.nonce??"");if(!nonce)throw new Error("worker_challenge_nonce_required");const now=this.now();
      const payload:WorkerChallenge={workerId:this.options.workerId,nonce,capabilities:this.descriptor().capabilities,issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+(this.options.challengeTtlMs??60_000)).toISOString()};json(res,200,this.signed(payload));return;
    }
    if(method==="POST"&&url==="/v1/execute"){
      const message=await readJson(req) as SignedWorkerMessage<WorkerExecutionRequest>;const payload=message.payload;if(!payload||!signatureOk(this.options.secret,payload,String(message.signature??"")))throw new Error("worker_request_signature_invalid");
      const now=this.now();const nowMs=now.getTime();const issued=new Date(payload.issuedAt).getTime();const expires=new Date(payload.expiresAt).getTime();const skew=this.options.maxClockSkewMs??30_000;
      if(payload.workerId!==this.options.workerId)throw new Error("worker_request_wrong_recipient");if(!Number.isFinite(issued)||!Number.isFinite(expires)||issued-nowMs>skew||expires<=nowMs)throw new Error("worker_request_expired_or_clock_invalid");
      this.purgeNonces(nowMs);if(this.seenNonces.has(payload.nonce))throw new Error("worker_request_replay");this.seenNonces.set(payload.nonce,expires);
      const step=payload.step;if(this.revoked.has(step.capability))throw new Error("worker_capability_revoked");const adapter=this.options.adapters.find(a=>a.capabilities.includes(step.capability));if(!adapter)throw new Error("worker_capability_not_supported");
      this.inFlight++;const startedAt=now.toISOString();let receipt:WorkerExecutionReceipt;
      try{const result=await adapter.execute(step);this.completed++;const completedAt=this.now().toISOString();const partial={schema:"malachii.worker.receipt.v1" as const,workerId:this.options.workerId,requestId:payload.requestId,stepId:step.id,actionId:step.actionId,capability:step.capability,status:"succeeded" as const,startedAt,completedAt,sequence:++this.sequence,...(result.output!==undefined?{output:result.output}:{}),evidenceIds:[...(result.evidenceIds??[])]};receipt={...partial,receiptHash:sha(canonical(partial))};}
      catch(e){this.failed++;const completedAt=this.now().toISOString();const partial={schema:"malachii.worker.receipt.v1" as const,workerId:this.options.workerId,requestId:payload.requestId,stepId:step.id,actionId:step.actionId,capability:step.capability,status:"failed" as const,startedAt,completedAt,sequence:++this.sequence,evidenceIds:[],error:e instanceof Error?e.message:"worker_execution_failed"};receipt={...partial,receiptHash:sha(canonical(partial))};}
      finally{this.inFlight--;}
      json(res,200,this.signed(receipt));return;
    }
    json(res,404,{error:"worker_endpoint_not_found"});
  }
}

export interface RemoteWorkerAdapterOptions {workerId:string;endpoint:string;secret:string;capabilities:string[];policy:NetworkPolicy;requestTtlMs?:number;now?:()=>Date;}
export class RemoteWorkerAdapter implements ExecutionAdapter {
  readonly id:string; readonly capabilities:string[]; private now:()=>Date;
  constructor(readonly options:RemoteWorkerAdapterOptions){this.id=`remote.worker.${options.workerId}`;this.capabilities=[...options.capabilities];this.now=options.now??(()=>new Date());}
  private async signedPost<T>(path:string,payload:unknown):Promise<SignedWorkerMessage<T>>{const body=JSON.stringify({payload,signature:sign(this.options.secret,payload)});const r=await governedFetch(`${this.options.endpoint}${path}`,{method:"POST",headers:{"content-type":"application/json"},body},this.options.policy);if(r.status<200||r.status>=300)throw new Error(`remote_worker_http_${r.status}:${r.body.slice(0,300)}`);return JSON.parse(r.body) as SignedWorkerMessage<T>;}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    const now=this.now();const payload:WorkerExecutionRequest={workerId:this.options.workerId,requestId:randomUUID(),issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+(this.options.requestTtlMs??30_000)).toISOString(),nonce:randomUUID(),step};
    const message=await this.signedPost<WorkerExecutionReceipt>("/v1/execute",payload);if(!message.payload||!signatureOk(this.options.secret,message.payload,message.signature))throw new Error("remote_worker_receipt_signature_invalid");const receipt=message.payload;
    const check={...receipt} as any;delete check.receiptHash;if(receipt.receiptHash!==sha(canonical(check)))throw new Error("remote_worker_receipt_hash_invalid");if(receipt.workerId!==this.options.workerId||receipt.requestId!==payload.requestId||receipt.stepId!==step.id||receipt.actionId!==step.actionId)throw new Error("remote_worker_receipt_binding_invalid");
    if(receipt.status!=="succeeded")throw new Error(`remote_worker_failed:${receipt.error??"unknown"}`);
    return {output:{workerId:receipt.workerId,receiptHash:receipt.receiptHash,remoteOutput:receipt.output},evidenceIds:[...receipt.evidenceIds,`worker-receipt:${receipt.receiptHash}`]};
  }
}

export class DurableQueuedRemoteAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities:string[];private queue:DurableWorkQueue<ExecutionStep,unknown>;
  constructor(private inner:RemoteWorkerAdapter,store:StateStore,queueName="distributed-workers",private leaseMs=60_000){this.id=inner.id;this.capabilities=[...inner.capabilities];this.queue=new DurableWorkQueue(store,queueName);}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    const job=await this.queue.enqueue(step);const lease=await this.queue.claim(this.inner.options.workerId,this.leaseMs);if(!lease||lease.id!==job.id)throw new Error("distributed_job_lease_failed");
    try{const result=await this.inner.execute(step);await this.queue.complete(job.id,this.inner.options.workerId,{workerId:this.inner.options.workerId,evidenceIds:result.evidenceIds??[]});return {...result,evidenceIds:[...(result.evidenceIds??[]),`durable-job:${job.id}`]};}
    catch(e){await this.queue.fail(job.id,this.inner.options.workerId,e instanceof Error?e.message:"remote_worker_failed",false);throw e;}
  }
}

export interface WorkerObservationOptions {policy:NetworkPolicy;identityTtlMs?:number;measurements?:ControlResourceDescriptor["measurements"];}
export class DistributedWorkerMesh {
  private workers=new Map<string,{endpoint:string;secret:string;adapter:DurableQueuedRemoteAdapter;descriptor:WorkerDescriptor;identityTtlMs:number}>();
  private now:()=>Date;
  constructor(readonly live:LiveControlFabric,now:()=>Date=()=>new Date()){this.now=now;}
  private async getSigned<T>(endpoint:string,path:string,policy:NetworkPolicy):Promise<SignedWorkerMessage<T>>{const r=await governedFetch(`${endpoint}${path}`,{method:"GET"},policy);if(r.status<200||r.status>=300)throw new Error(`worker_discovery_http_${r.status}`);return JSON.parse(r.body) as SignedWorkerMessage<T>;}
  private async challenge(endpoint:string,secret:string,policy:NetworkPolicy):Promise<WorkerChallenge>{const nonce=randomUUID();const body=JSON.stringify({nonce});const r=await governedFetch(`${endpoint}/v1/challenge`,{method:"POST",headers:{"content-type":"application/json"},body},policy);if(r.status<200||r.status>=300)throw new Error(`worker_challenge_http_${r.status}`);const msg=JSON.parse(r.body) as SignedWorkerMessage<WorkerChallenge>;if(!msg.payload||!signatureOk(secret,msg.payload,msg.signature)||msg.payload.nonce!==nonce)throw new Error("worker_challenge_verification_failed");if(new Date(msg.payload.expiresAt).getTime()<=this.now().getTime())throw new Error("worker_challenge_expired");return msg.payload;}
  async observeWorker(endpoint:string,secret:string,opts:WorkerObservationOptions):Promise<ControlResourceDescriptor>{
    const msg=await this.getSigned<WorkerDescriptor>(endpoint,"/v1/descriptor",opts.policy);if(!msg.payload||!signatureOk(secret,msg.payload,msg.signature))throw new Error("worker_descriptor_signature_invalid");const descriptor=msg.payload;if(descriptor.endpoint!==endpoint)throw new Error("worker_descriptor_endpoint_mismatch");
    const challenge=await this.challenge(endpoint,secret,opts.policy);if(challenge.workerId!==descriptor.workerId)throw new Error("worker_identity_mismatch");const capabilities=descriptor.capabilities.filter(c=>challenge.capabilities.includes(c));if(!capabilities.length)throw new Error("worker_has_no_observed_capabilities");
    const remote=new RemoteWorkerAdapter({workerId:descriptor.workerId,endpoint,secret,capabilities,policy:opts.policy,now:this.now});const queued=new DurableQueuedRemoteAdapter(remote,this.live.store,`worker-${descriptor.workerId}`);
    const now=this.now();const resource:ControlResourceDescriptor={id:`worker-${descriptor.workerId}`,kind:"execution_plane",provider:"malachii-worker-daemon",capabilities,scopes:[...descriptor.scopes],allowedDataScopes:[...descriptor.allowedDataScopes],tags:[...new Set([...descriptor.tags,"distributed","independent"])],available:true,assurance:"A3_OBSERVED",trustDomain:"MALACHII_POLICY",measurements:opts.measurements??{quality:8,latencyMs:10,costIndex:0,successRate:1,sampleSize:1},executionAdapterId:queued.id,identity:{subject:`urn:malachii:worker:${descriptor.workerId}`,issuer:"malachii-portable-worker-observation",proof:"observed",issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+(opts.identityTtlMs??300_000)).toISOString()}};
    await this.live.registerResource(resource,queued);this.workers.set(descriptor.workerId,{endpoint,secret,adapter:queued,descriptor,identityTtlMs:opts.identityTtlMs??300_000});await this.live.store.put("worker-observations",descriptor.workerId,{descriptor,observedAt:now.toISOString(),identityExpiresAt:resource.identity?.expiresAt});this.live.ledger.append("worker.observed",{workerId:descriptor.workerId,endpoint,capabilities},now);return resource;
  }
  async heartbeat(workerId:string,policy:NetworkPolicy):Promise<WorkerHealth>{const known=this.workers.get(workerId);if(!known)throw new Error("worker_not_observed");const msg=await this.getSigned<WorkerHealth>(known.endpoint,"/v1/health",policy);if(!msg.payload||!signatureOk(known.secret,msg.payload,msg.signature)||msg.payload.workerId!==workerId)throw new Error("worker_health_signature_invalid");const resourceId=`worker-${workerId}`;await this.live.heartbeat(resourceId);const env=await this.live.store.get<ControlResourceDescriptor>("resources",resourceId);if(env){const now=this.now();const revoked=new Set(msg.payload.revokedCapabilities);const next:ControlResourceDescriptor={...env.value,capabilities:known.descriptor.capabilities.filter(c=>!revoked.has(c)),available:msg.payload.status==="healthy",identity:{subject:`urn:malachii:worker:${workerId}`,issuer:"malachii-portable-worker-observation",proof:"observed",issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+known.identityTtlMs).toISOString()}};await this.live.store.put("resources",resourceId,next,env.revision);}await this.live.store.put("worker-runtime",workerId,msg.payload);this.live.ledger.append("worker.health.observed",msg.payload,this.now());return msg.payload;}
  workerIds():string[]{return [...this.workers.keys()].sort();}
}
