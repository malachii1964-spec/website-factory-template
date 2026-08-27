import type { RuntimeManifest } from "./types.js";
import { hasExecutableCapability } from "./runtimeManifest.js";

export type Impact = "read_only" | "reversible_local" | "external_side_effect" | "irreversible_high_impact";
export interface ActionRequest { capability: string; scope: string; impact: Impact; approvalId?: string; }
export interface AuthorizationDecision { decision: "permit" | "deny" | "require_approval"; reason: string; decidedAt: string; }

export function authorize(manifest: RuntimeManifest, req: ActionRequest, now=new Date()): AuthorizationDecision {
  if (!hasExecutableCapability(manifest, req.capability, req.scope, now)) return {decision:"deny",reason:"capability_not_observed_or_attested",decidedAt:now.toISOString()};
  if ((req.impact==="external_side_effect" || req.impact==="irreversible_high_impact") && !req.approvalId)
    return {decision:"require_approval",reason:"high_impact_requires_approval",decidedAt:now.toISOString()};
  return {decision:"permit",reason:"capability_and_policy_satisfied",decidedAt:now.toISOString()};
}

// Redemption intentionally re-runs authorization against a fresh manifest snapshot.
export function redeemAuthorization(freshManifest: RuntimeManifest, req: ActionRequest, now=new Date()): AuthorizationDecision {
  return authorize(freshManifest, req, now);
}
