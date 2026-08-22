import { createConfidence } from "./confidence.js";
import type { ForgeAssessment } from "./types.js";
import { clamp10 } from "./objectiveForge.js";

// RC deterministic baseline. It exists for testing/calibration, not as a claim of optimal task difficulty estimation.
export function scoreObjective(text:string): ForgeAssessment {
  const t=text.toLowerCase(); const words=t.split(/\s+/).filter(Boolean).length;
  const cognitive=2 + Math.min(4,words/80) + (/(architecture|strategy|design|prove|audit|compare|optimi[sz]e)/.test(t)?2:0);
  const coordination=2 + (/(website|business|system|platform|product)/.test(t)?2:0) + (/(research|code|design|legal|security|marketing)/.test(t)?2:0);
  const governance=1 + (/(send|publish|delete|transfer|pay)/.test(t)?3:0) + (/(money|financial|production|legal|medical|security)/.test(t)?4:0) + (/(irreversible|credential|password|api key)/.test(t)?2:0);
  const uncertainty=2 + (/(best|ultimate|perfect|everything|whatever)/.test(t)?2:0) + (words<8?1:0);
  const vals={cognitiveComplexity:clamp10(cognitive),coordinationComplexity:clamp10(coordination),governanceRisk:clamp10(governance),objectiveUncertainty:clamp10(uncertainty)};
  const minSignal=Math.min(...Object.values(vals));
  const conf=Math.max(.45,Math.min(.9,.72 + Math.min(words,100)/1000 - (vals.objectiveUncertainty/100)));
  return {...vals,confidence:createConfidence(conf,{...vals},["heuristic_rc1"],new Date())};
}
