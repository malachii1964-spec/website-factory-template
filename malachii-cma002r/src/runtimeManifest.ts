import type { AssuranceLabel, CapabilityEvidence, CapabilityRecord, RuntimeManifest } from "./types.js";

export function evidenceFresh(e: CapabilityEvidence, now = new Date()): boolean {
  return !e.expiresAt || new Date(e.expiresAt).getTime() > now.getTime();
}

export function effectiveAssurance(record: CapabilityRecord, requestedScope: string, now = new Date()): AssuranceLabel {
  const valid = record.evidence.filter(e => e.capability === record.name && e.scope.some(s => s === "*" || requestedScope === s || requestedScope.startsWith(`${s}.`)) && evidenceFresh(e, now));
  if (valid.some(e => e.kind === "attestation" && e.authenticity === "verified")) return "A4_ATTESTED";
  if (valid.some(e => e.kind === "observation" && e.observedSuccess === true)) return "A3_OBSERVED";
  if (valid.some(e => e.kind === "authenticated_declaration" && e.authenticity === "verified")) return "A2_AUTHENTICATED_DECLARATION";
  if (valid.length) return "A1_HINTED";
  return "A0_UNKNOWN";
}

export function candidateHostFromEnv(env: Record<string,string|undefined>): RuntimeManifest["host"] {
  const hint = env.MALACHII_HOST;
  return hint ? { id: "unverified-host", hint } : { id: "unknown-host" };
}

export function hasExecutableCapability(manifest: RuntimeManifest, capability: string, scope: string, now = new Date()): boolean {
  const rec = manifest.capabilities.find(c => c.name === capability);
  if (!rec) return false;
  const assurance = effectiveAssurance(rec, scope, now);
  return assurance === "A3_OBSERVED" || assurance === "A4_ATTESTED";
}
