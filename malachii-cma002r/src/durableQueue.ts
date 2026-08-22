import { randomUUID } from "node:crypto";
import type { StateStore } from "./durableState.js";

export type JobStatus="queued"|"leased"|"succeeded"|"failed";
export interface DurableJob<T=unknown,R=unknown>{id:string;queue:string;payload:T;status:JobStatus;createdAt:string;attempts:number;leaseOwner?:string;leaseUntil?:string;result?:R;error?:string;}

export class DurableWorkQueue<T=unknown,R=unknown>{
  constructor(readonly store:StateStore,readonly queue:string){}
  private ns(){return `queue-${this.queue}`;}
  async enqueue(payload:T,now=new Date()):Promise<DurableJob<T,R>>{const job:DurableJob<T,R>={id:randomUUID(),queue:this.queue,payload,status:"queued",createdAt:now.toISOString(),attempts:0};await this.store.put(this.ns(),job.id,job);return job;}
  async claim(worker:string,leaseMs:number,now=new Date()):Promise<DurableJob<T,R>|undefined>{
    const all=await this.store.list<DurableJob<T,R>>(this.ns());
    const eligible=all.map(x=>x.value).filter(j=>j.status==="queued" || (j.status==="leased" && !!j.leaseUntil && new Date(j.leaseUntil).getTime()<=now.getTime())).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    for(const j of eligible){
      const env=await this.store.get<DurableJob<T,R>>(this.ns(),j.id); if(!env)continue;
      const next:DurableJob<T,R>={...env.value,status:"leased",attempts:env.value.attempts+1,leaseOwner:worker,leaseUntil:new Date(now.getTime()+leaseMs).toISOString()};
      try{await this.store.put(this.ns(),j.id,next,env.revision);return next;}catch(e){if((e as Error).message!=="state_revision_conflict")throw e;}
    }
    return undefined;
  }
  async complete(id:string,worker:string,result:R):Promise<void>{const env=await this.store.get<DurableJob<T,R>>(this.ns(),id);if(!env)throw new Error("job_not_found");if(env.value.leaseOwner!==worker)throw new Error("job_lease_owner_mismatch");const next:DurableJob<T,R>={...env.value,status:"succeeded",result};delete next.leaseOwner;delete next.leaseUntil;await this.store.put(this.ns(),id,next,env.revision);}
  async fail(id:string,worker:string,error:string,requeue=false):Promise<void>{const env=await this.store.get<DurableJob<T,R>>(this.ns(),id);if(!env)throw new Error("job_not_found");if(env.value.leaseOwner!==worker)throw new Error("job_lease_owner_mismatch");const next:DurableJob<T,R>={...env.value,status:requeue?"queued":"failed",error};delete next.leaseOwner;delete next.leaseUntil;await this.store.put(this.ns(),id,next,env.revision);}
}
