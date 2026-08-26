// Capability != authorization, and high-impact actions get action-time revalidation
// (TOCTOU) — Kernel §7. This is what makes the HITL checkpoint a real gate instead
// of a formality: `require_approval` cannot be satisfied by anything except the
// human supplying an `approvalId`, and `redeemAuthorization` re-checks a FRESH
// manifest at the moment the PR is actually opened, not the moment it was planned.
import type { RuntimeManifest, CapabilityRecord } from "./runtimeManifest.js";
import { hasExecutableCapability } from "./runtimeManifest.js";

export type Impact = "read_only" | "reversible_local" | "external_side_effect" | "irreversible_high_impact";

export interface ActionRequest {
  capability: string;
  scope: string;
  impact: Impact;
  approvalId?: string;
}

export interface AuthorizationDecision {
  decision: "permit" | "deny" | "require_approval";
  reason: string;
  decidedAt: string;
}

export function authorize(manifest: RuntimeManifest, req: ActionRequest, now = new Date()): AuthorizationDecision {
  if (!hasExecutableCapability(manifest, req.capability, req.scope, now)) {
    return { decision: "deny", reason: "capability_not_observed_or_attested", decidedAt: now.toISOString() };
  }
  if ((req.impact === "external_side_effect" || req.impact === "irreversible_high_impact") && !req.approvalId) {
    return { decision: "require_approval", reason: "high_impact_requires_approval", decidedAt: now.toISOString() };
  }
  return { decision: "permit", reason: "capability_and_policy_satisfied", decidedAt: now.toISOString() };
}

/** Re-run authorization against a FRESH manifest snapshot at the actual execution boundary. */
export function redeemAuthorization(freshManifest: RuntimeManifest, req: ActionRequest, now = new Date()): AuthorizationDecision {
  return authorize(freshManifest, req, now);
}

/**
 * A declared capability (e.g. an API key being set) only reaches A2. Only an
 * observed successful call reaches A3, which is the floor `authorize()` requires.
 * Nodes call this immediately after their first successful API/tool invocation
 * in a run — never before, and never on the strength of a declaration alone.
 */
export function recordObservedSuccess(manifest: RuntimeManifest, capability: string, scope: string, now = new Date()): RuntimeManifest {
  const existing = manifest.capabilities.find((c) => c.name === capability);
  const evidence = {
    id: `${capability}-observed-${now.getTime()}`,
    kind: "observation" as const,
    source: "runtime_call_succeeded",
    authenticity: "verified" as const,
    directness: "direct" as const,
    capability,
    scope: [scope],
    observedSuccess: true,
    verifiedAt: now.toISOString(),
  };
  const updated: CapabilityRecord = existing
    ? { ...existing, evidence: [...existing.evidence, evidence] }
    : { name: capability, evidence: [evidence] };
  return {
    ...manifest,
    capabilities: [...manifest.capabilities.filter((c) => c.name !== capability), updated],
  };
}
