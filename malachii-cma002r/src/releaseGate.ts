import type { QualityScores } from "./types.js";
import { shipDecision } from "./quality.js";

export interface ReleaseRequest {
  quality: QualityScores;
  hardGates: Record<string,boolean>;
  buildSucceeded: boolean;
  externalPublish: boolean;
  publishGrantId?: string;
  threshold?: number;
}
export interface ReleaseDecision { decision:"release"|"hold"; floor:number; failedGates:string[]; reason:string; }

export function releaseDecision(r:ReleaseRequest):ReleaseDecision {
  const gates:Record<string,boolean>={...r.hardGates,build_succeeded:r.buildSucceeded};
  if (r.externalPublish) gates.explicit_publish_grant=Boolean(r.publishGrantId);
  const s=shipDecision(r.quality,r.threshold??9,gates);
  return {decision:s.ship?"release":"hold",floor:s.floor,failedGates:s.failedGates,reason:s.ship?"quality_floor_and_gates_satisfied":"release_gate_failed"};
}
