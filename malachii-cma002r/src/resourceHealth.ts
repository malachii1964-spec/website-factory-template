import type { ControlResourceDescriptor } from "./controlPlane.js";

export type CircuitState="closed"|"open"|"half_open";
export interface ResourceRuntimeState {
  resourceId:string;
  heartbeatAt:string;
  leaseUntil?:string;
  leaseOwner?:string;
  consecutiveFailures:number;
  circuit:CircuitState;
  circuitOpenedAt?:string;
  lastError?:string;
}

export interface HealthPolicy {
  staleAfterMs:number;
  openCircuitAfterFailures:number;
  circuitResetAfterMs:number;
}

export class ResourceHealthTable {
  private states=new Map<string,ResourceRuntimeState>();
  constructor(readonly policy:HealthPolicy={staleAfterMs:60_000,openCircuitAfterFailures:3,circuitResetAfterMs:30_000}){}
  heartbeat(resourceId:string,now=new Date()):ResourceRuntimeState{
    const prev=this.states.get(resourceId);
    const state:ResourceRuntimeState={resourceId,heartbeatAt:now.toISOString(),consecutiveFailures:prev?.consecutiveFailures??0,circuit:prev?.circuit??"closed",...(prev?.leaseUntil?{leaseUntil:prev.leaseUntil}:{}),...(prev?.leaseOwner?{leaseOwner:prev.leaseOwner}:{}),...(prev?.circuitOpenedAt?{circuitOpenedAt:prev.circuitOpenedAt}:{}),...(prev?.lastError?{lastError:prev.lastError}:{})};
    this.states.set(resourceId,state); return {...state};
  }
  acquireLease(resourceId:string,owner:string,ttlMs:number,now=new Date()):boolean{
    const s=this.states.get(resourceId)??this.heartbeat(resourceId,now);
    if(s.leaseUntil && new Date(s.leaseUntil).getTime()>now.getTime() && s.leaseOwner!==owner) return false;
    s.leaseOwner=owner; s.leaseUntil=new Date(now.getTime()+ttlMs).toISOString(); this.states.set(resourceId,s); return true;
  }
  releaseLease(resourceId:string,owner:string):void{const s=this.states.get(resourceId); if(s?.leaseOwner===owner){delete s.leaseOwner;delete s.leaseUntil;}}
  recordSuccess(resourceId:string,now=new Date()):void{const s=this.states.get(resourceId)??this.heartbeat(resourceId,now);s.consecutiveFailures=0;s.circuit="closed";delete s.circuitOpenedAt;delete s.lastError;s.heartbeatAt=now.toISOString();this.states.set(resourceId,s);}
  recordFailure(resourceId:string,error:string,now=new Date()):void{const s=this.states.get(resourceId)??this.heartbeat(resourceId,now);s.consecutiveFailures++;s.lastError=error;s.heartbeatAt=now.toISOString();if(s.consecutiveFailures>=this.policy.openCircuitAfterFailures){s.circuit="open";s.circuitOpenedAt=now.toISOString();}this.states.set(resourceId,s);}
  get(resourceId:string,now=new Date()):ResourceRuntimeState|undefined{
    const s=this.states.get(resourceId); if(!s)return undefined;
    if(s.circuit==="open" && s.circuitOpenedAt && now.getTime()-new Date(s.circuitOpenedAt).getTime()>=this.policy.circuitResetAfterMs) s.circuit="half_open";
    return {...s};
  }
  isHealthy(resourceId:string,now=new Date()):boolean{
    const s=this.get(resourceId,now); if(!s)return false;
    if(now.getTime()-new Date(s.heartbeatAt).getTime()>this.policy.staleAfterMs)return false;
    return s.circuit!=="open";
  }
  apply(resource:ControlResourceDescriptor,now=new Date()):ControlResourceDescriptor{
    return {...resource,available:resource.available && this.isHealthy(resource.id,now)};
  }
}
