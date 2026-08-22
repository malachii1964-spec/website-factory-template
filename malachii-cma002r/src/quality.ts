import type { QualityScores } from "./types.js";

export function qualityFloor(s:QualityScores):number { return Math.min(s.accuracy,s.verification,s.completeness,s.intentAlignment,s.executionReadiness,s.structure,s.edgeCases); }
export function polish(s:QualityScores):number { const v=Object.values(s); return v.reduce((a,b)=>a+b,0)/v.length; }
export function shipDecision(s:QualityScores,threshold=7,hardGates:Record<string,boolean>={}):{ship:boolean;floor:number;failedGates:string[]} {
  const failedGates=Object.entries(hardGates).filter(([,ok])=>!ok).map(([k])=>k); const floor=qualityFloor(s);
  return {ship:floor>=threshold && failedGates.length===0,floor,failedGates};
}
