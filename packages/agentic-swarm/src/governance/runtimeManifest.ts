// Ported from MALACHII v3.3-RC1 with the clock-threading fix already applied
// (see runtime/tests/trust.test.ts "observed side effect still requires approval" —
// the original dropped the injected `now` and fell back to wall-clock time, which
// silently fails evidence-freshness checks on replay/backdated audits).
export type AssuranceLabel = "A0_UNKNOWN" | "A1_HINTED" | "A2_AUTHENTICATED_DECLARATION" | "A3_OBSERVED" | "A4_ATTESTED";
export type EvidenceKind = "hint" | "authenticated_declaration" | "observation" | "attestation";

export interface CapabilityEvidence {
  id: string;
  kind: EvidenceKind;
  source: string;
  authenticity: "unknown" | "declared" | "verified";
  directness: "indirect" | "direct";
  capability: string;
  scope: string[];
  observedSuccess?: boolean;
  verifiedAt: string;
  expiresAt?: string;
}

export interface CapabilityRecord {
  name: string;
  evidence: CapabilityEvidence[];
}

export interface RuntimeManifest {
  host: { id: string; hint?: string };
  capabilities: CapabilityRecord[];
}

export function evidenceFresh(e: CapabilityEvidence, now = new Date()): boolean {
  return !e.expiresAt || new Date(e.expiresAt).getTime() > now.getTime();
}

export function effectiveAssurance(record: CapabilityRecord, requestedScope: string, now = new Date()): AssuranceLabel {
  const valid = record.evidence.filter(
    (e) =>
      e.capability === record.name &&
      e.scope.some((s) => requestedScope === s || requestedScope.startsWith(`${s}.`)) &&
      evidenceFresh(e, now),
  );
  if (valid.some((e) => e.kind === "attestation" && e.authenticity === "verified")) return "A4_ATTESTED";
  if (valid.some((e) => e.kind === "observation" && e.observedSuccess === true)) return "A3_OBSERVED";
  if (valid.some((e) => e.kind === "authenticated_declaration" && e.authenticity === "verified")) return "A2_AUTHENTICATED_DECLARATION";
  if (valid.length) return "A1_HINTED";
  return "A0_UNKNOWN";
}

export function hasExecutableCapability(manifest: RuntimeManifest, capability: string, scope: string, now = new Date()): boolean {
  const rec = manifest.capabilities.find((c) => c.name === capability);
  if (!rec) return false;
  const assurance = effectiveAssurance(rec, scope, now);
  return assurance === "A3_OBSERVED" || assurance === "A4_ATTESTED";
}

/** Probe the actual host — never trust env vars or filenames as capability proof (Kernel §6). */
export async function probeSwarmRuntime(now = new Date()): Promise<RuntimeManifest> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);

  const capabilities: CapabilityRecord[] = [];

  const dockerEvidence: CapabilityEvidence[] = [];
  try {
    await run("docker", ["info", "--format", "{{.ServerVersion}}"], { timeout: 5000 });
    dockerEvidence.push({
      id: "docker-observed",
      kind: "observation",
      source: "docker info",
      authenticity: "verified",
      directness: "direct",
      capability: "sandbox.docker",
      scope: ["swarm"],
      observedSuccess: true,
      verifiedAt: now.toISOString(),
    });
  } catch {
    // Daemon unreachable or binary missing — leave capability unlisted (A0_UNKNOWN), never fabricate a hint.
  }
  if (dockerEvidence.length) capabilities.push({ name: "sandbox.docker", evidence: dockerEvidence });

  const anthropicEvidence: CapabilityEvidence[] = [];
  if (process.env.ANTHROPIC_API_KEY) {
    anthropicEvidence.push({
      id: "anthropic-key-declared",
      kind: "authenticated_declaration",
      source: "env:ANTHROPIC_API_KEY",
      authenticity: "declared",
      directness: "indirect",
      capability: "model.anthropic",
      scope: ["swarm"],
      verifiedAt: now.toISOString(),
    });
  }
  if (anthropicEvidence.length) capabilities.push({ name: "model.anthropic", evidence: anthropicEvidence });

  const visionEvidence: CapabilityEvidence[] = [];
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
    await browser.close();
    visionEvidence.push({
      id: "playwright-observed",
      kind: "observation",
      source: "chromium.launch",
      authenticity: "verified",
      directness: "direct",
      capability: "vision.capture",
      scope: ["swarm"],
      observedSuccess: true,
      verifiedAt: now.toISOString(),
    });
  } catch {
    // no browser binary reachable — leave unlisted
  }
  if (visionEvidence.length) capabilities.push({ name: "vision.capture", evidence: visionEvidence });

  return { host: { id: process.env.MALACHII_HOST ?? "unknown-host" }, capabilities };
}
