import type { QualityScores } from "./governance/quality.js";

export type SwarmPhase = "TRIAGED" | "REPRODUCED" | "DIAGNOSED" | "SANDBOXED" | "VERIFIED" | "AWAITING_APPROVAL" | "SHIPPED" | "ESCALATED";

export interface IncomingEvent {
  eventId: string;
  route: string;
  customerText: string;
  /** Base64 PNG the customer attached. Treated as UNTRUSTED_EXTERNAL_CONTENT — see nodes/diagnose.ts. */
  customerScreenshotBase64?: string;
  repoPath: string;
}

export interface VisualEvidence {
  route: string;
  viewport: { width: number; height: number };
  screenshotBase64: string;
  geometry: Array<{ selector: string; rect: Record<string, number>; computed: Record<string, string> }>;
  overlaps: Array<[string, string]>;
  consoleErrors: string[];
}

export interface PatchEdit {
  file: string;
  find: string;
  replace: string;
  rationale: string;
}

export interface ProposedPatch {
  diagnosis: string;
  rootCauseSelector: string;
  edits: PatchEdit[];
  /** A Playwright expression that must be FALSE before the patch and TRUE after. No assertion, no ship. */
  assertion: string;
}

export interface SandboxResult {
  exitCode: number;
  logs: string;
  diff: string | null;
  assertionPassed: boolean | null;
}

export interface SwarmState {
  phase: SwarmPhase;
  event: IncomingEvent;
  evidence?: VisualEvidence;
  patch?: ProposedPatch;
  sandboxResult?: SandboxResult;
  quality?: QualityScores;
  retryCount: number;
  maxRetries: number;
  humanFeedback?: string;
  failureLog?: string;
}

export function initialState(event: IncomingEvent, maxRetries = 3): SwarmState {
  return { phase: "TRIAGED", event, retryCount: 0, maxRetries };
}
