import type { ModelDescriptor } from "./types.js";

export class IntelligenceRegistry {
  private models = new Map<string,ModelDescriptor>();
  register(model:ModelDescriptor):void { this.models.set(model.id,{...model,capabilities:[...model.capabilities],tags:[...model.tags],measured:{...model.measured}}); }
  available():ModelDescriptor[] { return [...this.models.values()].filter(m=>m.available); }
  rank(required:string[]):ModelDescriptor[] {
    return this.available().sort((a,b)=>score(b,required)-score(a,required));
  }
}
function score(m:ModelDescriptor,required:string[]):number {
  const fit=required.filter(r=>m.capabilities.includes(r)).length*10;
  const quality=m.measured.quality ?? 0;
  const latencyPenalty=(m.measured.latencyMs ?? 0)/10000;
  const costPenalty=m.measured.costIndex ?? 0;
  return fit+quality-latencyPenalty-costPenalty;
}
