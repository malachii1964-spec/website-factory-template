import type { ControlObjectiveSpec, ControlPlaneReport, ControlResourceDescriptor, ControlTask, QualityEvaluationContext } from "./controlPlane.js";
import { ControlPlaneRegistry, runControlPlane } from "./controlPlane.js";
import type { QualityScores, RuntimeManifest } from "./types.js";
import type { ExecutionAdapter, ExecutionStep, ExecutionAdapterResult } from "./executionPlane.js";
import { AtomicFileStateStore, type StateStore } from "./durableState.js";
import { ResourceHealthTable, type HealthPolicy } from "./resourceHealth.js";
import { PersistentEventLedger } from "./persistentLedger.js";

export interface LiveFabricOptions {
  stateRoot:string;
  ledgerPath:string;
  getFreshManifest():RuntimeManifest;
  healthPolicy?:HealthPolicy;
  now?:()=>Date;
}

export interface LiveObjectiveEvaluators {
  evaluateSuccessCriteria?(ctx:QualityEvaluationContext):Record<string,boolean>;
  evaluateQuality?(ctx:QualityEvaluationContext):QualityScores|undefined;
  evaluateHardGates?(ctx:QualityEvaluationContext):Record<string,boolean>;
  repairPlanner?(objective:ControlObjectiveSpec, observed:any, reconciliation:any, nextRound:number):ControlTask[]|undefined;
}

/**
 * Single-node live control fabric. It adds durable control state, persistent
 * ledgering, health/circuit tracking, guarded adapters and restart recovery.
 * It deliberately does NOT claim distributed consensus or HA.
 */
export class LiveControlFabric {
  readonly store:StateStore;
  readonly health:ResourceHealthTable;
  readonly ledger:PersistentEventLedger;
  private adapters=new Map<string,ExecutionAdapter>();
  private now:()=>Date;
  constructor(readonly options:LiveFabricOptions){
    this.store=new AtomicFileStateStore(options.stateRoot);
    this.health=new ResourceHealthTable(options.healthPolicy);
    this.ledger=new PersistentEventLedger(options.ledgerPath);
    this.now=options.now??(()=>new Date());
  }

  async registerResource(resource:ControlResourceDescriptor,adapter:ExecutionAdapter):Promise<void>{
    if(resource.executionAdapterId!==adapter.id)throw new Error("resource_adapter_binding_mismatch");
    const existing=[...this.adapters.values()].find(a=>a.id===adapter.id);
    if(existing&&existing!==adapter)throw new Error("duplicate_live_adapter_id");
    this.adapters.set(adapter.id,new HealthAwareAdapter(resource.id,adapter,this.health,this.now));
    this.health.heartbeat(resource.id,this.now());
    await this.store.put("resources",resource.id,resource);
    await this.store.put("resource-health",resource.id,this.health.get(resource.id,this.now()));
    this.ledger.append("fabric.resource.registered",{resourceId:resource.id,adapterId:adapter.id,capabilities:resource.capabilities},this.now());
  }

  async heartbeat(resourceId:string):Promise<void>{this.health.heartbeat(resourceId,this.now());await this.store.put("resource-health",resourceId,this.health.get(resourceId,this.now()));this.ledger.append("fabric.resource.heartbeat",{resourceId},this.now());}

  async resources():Promise<ControlResourceDescriptor[]>{return (await this.store.list<ControlResourceDescriptor>("resources")).map(x=>this.health.apply(x.value,this.now()));}

  private async registry():Promise<ControlPlaneRegistry>{const registry=new ControlPlaneRegistry();for(const r of await this.resources())registry.register(r);return registry;}

  async run(objective:ControlObjectiveSpec,tasks:ControlTask[],evaluators:LiveObjectiveEvaluators={},approvals?:Record<string,string>,maxReconcileRounds=0):Promise<ControlPlaneReport>{
    await this.store.put("objectives",objective.id,objective);
    this.ledger.append("fabric.objective.persisted",{objectiveId:objective.id,taskCount:tasks.length},this.now());
    const registry=await this.registry();
    const report=await runControlPlane(objective,tasks,{
      registry,
      refreshRegistry:()=>this.registry(),
      getFreshManifest:this.options.getFreshManifest,
      adapters:[...this.adapters.values()],
      ledger:this.ledger,
      now:this.now,
      ...(approvals?{approvals}:{}),
      ...(evaluators.evaluateSuccessCriteria?{evaluateSuccessCriteria:evaluators.evaluateSuccessCriteria}:{}),
      ...(evaluators.evaluateQuality?{evaluateQuality:evaluators.evaluateQuality}:{}),
      ...(evaluators.evaluateHardGates?{evaluateHardGates:evaluators.evaluateHardGates}:{}),
      ...(evaluators.repairPlanner?{repairPlanner:evaluators.repairPlanner}:{}),
      maxReconcileRounds
    });
    await this.store.put("reports",objective.id,report);
    await this.store.put("observed",objective.id,report.finalObserved);
    this.ledger.append("fabric.objective.checkpointed",{objectiveId:objective.id,status:report.status,converged:report.finalReconciliation.converged},this.now());
    return report;
  }
}

class HealthAwareAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities:string[];
  constructor(private resourceId:string,private inner:ExecutionAdapter,private health:ResourceHealthTable,private now:()=>Date){this.id=inner.id;this.capabilities=[...inner.capabilities];}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    if(!this.health.isHealthy(this.resourceId,this.now()))throw new Error("resource_unhealthy_or_circuit_open");
    try{const result=await this.inner.execute(step);this.health.recordSuccess(this.resourceId,this.now());return result;}catch(e){this.health.recordFailure(this.resourceId,e instanceof Error?e.message:"adapter_failure",this.now());throw e;}
  }
}

export interface ResilienceOptions{retries:number;retryDelayMs:number;timeoutMs:number;retryImpacts?:Array<ExecutionStep["impact"]>;}
export class ResilientAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities:string[];
  constructor(private inner:ExecutionAdapter,private opts:ResilienceOptions={retries:2,retryDelayMs:50,timeoutMs:15_000,retryImpacts:["read_only"]}){this.id=inner.id;this.capabilities=[...inner.capabilities];}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    const allowed=new Set(this.opts.retryImpacts??["read_only"]);let last:unknown;
    const attempts=1+(allowed.has(step.impact)?Math.max(0,this.opts.retries):0);
    for(let i=0;i<attempts;i++){
      try{return await withTimeout(this.inner.execute(step),this.opts.timeoutMs);}catch(e){last=e;if(i+1<attempts)await new Promise(r=>setTimeout(r,this.opts.retryDelayMs));}
    }
    throw last instanceof Error?last:new Error("resilient_adapter_failed");
  }
}
async function withTimeout<T>(p:Promise<T>,ms:number):Promise<T>{let timer:any;const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("adapter_timeout")),ms);});try{return await Promise.race([p,timeout]);}finally{clearTimeout(timer);}}

export class FaultInjectionAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities:string[];private calls=0;
  constructor(private inner:ExecutionAdapter,private failEvery:number,private latencyMs=0){this.id=inner.id;this.capabilities=[...inner.capabilities];}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{this.calls++;if(this.latencyMs)await new Promise(r=>setTimeout(r,this.latencyMs));if(this.failEvery>0&&this.calls%this.failEvery===0)throw new Error("fault_injected");return this.inner.execute(step);}
}
