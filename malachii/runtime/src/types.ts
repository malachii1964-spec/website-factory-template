export type TrustDomain =
  | "HOST_POLICY" | "MALACHII_POLICY" | "SUPER_USER_INSTRUCTION" | "PROJECT_INSTRUCTION"
  | "AGENT_MESSAGE" | "TOOL_OUTPUT" | "RETRIEVED_CONTENT" | "UNTRUSTED_EXTERNAL_CONTENT";

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
  revocationChecked?: boolean;
}

export interface CapabilityRecord { name: string; evidence: CapabilityEvidence[]; }
export interface RuntimeManifest { host: { id: string; hint?: string }; capabilities: CapabilityRecord[]; }

export interface ConfidenceRecord {
  readonly derived: number;
  readonly perDimension: Readonly<Record<string, number>>;
  readonly evidenceIds: readonly string[];
  readonly generatedAt: string;
}
export interface ConfidenceOverride { value?: number; routeMode?: ExecutionMode; actor: string; reason: string; timestamp: string; }

export interface ForgeAssessment {
  cognitiveComplexity: number;
  coordinationComplexity: number;
  governanceRisk: number;
  objectiveUncertainty: number;
  confidence: ConfidenceRecord;
}
export type ExecutionMode = "direct" | "collaborative" | "sovereign" | "sovereign_escalated";

export interface ObjectiveForge {
  id: string;
  rawRequest: string;
  normalizedObjective: string;
  successCriteria: string[];
  constraints: string[];
  assumptions: string[];
  assessment: ForgeAssessment;
  execution: {
    mode: ExecutionMode;
    specialists: string[];
    independentReasoners: number;
    requiredCapabilities: string[];
    verification: { independent: boolean; adversarial: boolean; evidence: boolean };
    maxRepairRounds: number;
  };
}

export interface ModelDescriptor {
  id: string;
  provider: string;
  capabilities: string[];
  tags: string[];
  measured: { quality?: number; latencyMs?: number; costIndex?: number; sampleSize: number };
  available: boolean;
}

export interface QualityScores {
  accuracy: number;
  verification: number;
  completeness: number;
  intentAlignment: number;
  executionReadiness: number;
  structure: number;
  edgeCases: number;
}

export interface CouncilCandidate { workerId: string; role: string; output: string; evidenceIds: string[]; }
export interface CouncilResult { mode: ExecutionMode; candidates: CouncilCandidate[]; critique: string; verification: string; final: string; }
