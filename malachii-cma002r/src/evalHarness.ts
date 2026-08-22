import type { QualityScores } from "./types.js";
import { qualityFloor } from "./quality.js";

export interface EvalRun { label:string; scores:QualityScores; latencyMs:number; tokenCost?:number; repairRounds:number; }
export function compareRuns(runs:EvalRun[]) {
  return runs.map(r=>({label:r.label,floor:qualityFloor(r.scores),latencyMs:r.latencyMs,tokenCost:r.tokenCost ?? null,repairRounds:r.repairRounds}))
    .sort((a,b)=>b.floor-a.floor || a.latencyMs-b.latencyMs);
}
