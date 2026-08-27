import type { ForgeAssessment, ObjectiveForge } from "./types.js";

export function clamp10(n:number):number { return Math.max(0,Math.min(10,Math.round(n*10)/10)); }

export function modeFromAssessment(a: ForgeAssessment): ObjectiveForge["execution"]["mode"] {
  if (a.governanceRisk >= 8 || a.objectiveUncertainty >= 8) return "sovereign_escalated";
  if (a.cognitiveComplexity >= 7 || a.coordinationComplexity >= 7) return "sovereign";
  if (a.cognitiveComplexity > 3 || a.coordinationComplexity > 4 || a.governanceRisk > 4) return "collaborative";
  return "direct";
}

function inferRequiredCapabilities(raw:string): string[] {
  const t=raw.toLowerCase();
  const caps=new Set<string>();
  if (/(current|latest|research|verify|compare|source|evidence|web|online)/.test(t)) caps.add("web.search");
  if (/(code|typescript|javascript|python|build|compile|test|repository|github|website|app)/.test(t)) caps.add("code.execute");
  if (/(file|document|zip|artifact|export|save|write)/.test(t)) caps.add("filesystem.write");
  if (/(read|inspect|review|analy[sz]e|file|document|zip|artifact)/.test(t)) caps.add("filesystem.read");
  return [...caps];
}

export function forgeObjective(id:string, raw:string, assessment:ForgeAssessment): ObjectiveForge {
  const mode=modeFromAssessment(assessment);
  const specialists = mode==="direct" ? ["generalist"] : mode==="collaborative" ? ["worker","critic"] : ["researcher","domain_specialist","critic","verifier","arbiter"];
  return {
    id, rawRequest:raw, normalizedObjective:raw.trim(), successCriteria:["Satisfy the user's objective","Meet MALACHII Quality Floor"],
    constraints:["Respect host precedence","Do not claim unavailable capabilities"], assumptions:[], assessment,
    execution:{mode,specialists,independentReasoners:mode==="direct"?1:mode==="collaborative"?2:3,requiredCapabilities:inferRequiredCapabilities(raw),verification:{independent:mode!=="direct",adversarial:mode.startsWith("sovereign"),evidence:true},maxRepairRounds:mode==="direct"?1:2}
  };
}
