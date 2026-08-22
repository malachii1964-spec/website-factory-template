import type { ModelDescriptor, ObjectiveForge } from "./types.js";
import { IntelligenceRegistry } from "./registry.js";

export interface RoutePlan { mode: ObjectiveForge["execution"]["mode"]; assigned: {role:string; modelId:string}[]; reason:string; }

export function route(forge:ObjectiveForge, registry:IntelligenceRegistry):RoutePlan {
  const ranked=registry.rank(forge.execution.requiredCapabilities); if (!ranked.length) return {mode:forge.execution.mode,assigned:[],reason:"no_available_models"};
  const count=forge.execution.mode==="direct"?1:forge.execution.mode==="collaborative"?Math.min(3,ranked.length):Math.min(6,ranked.length);
  const selected=ranked.slice(0,count);
  const roles=forge.execution.specialists;
  return {mode:forge.execution.mode,assigned:selected.map((m,i)=>({role:roles[i%roles.length]!,modelId:m.id})),reason:"minimum_sufficient_available_models"};
}
