// The orchestrator. Deliberately a plain async function with a while-loop, not
// a graph-framework state machine — six nodes and one retry loop is less code
// this way than adopting LangGraph, and it sidesteps the exact bug that made
// this rewrite necessary: LangGraph conditional edges cannot persist state
// mutations, so the reference design's retry counter never actually
// incremented. Here the loop body — a real node — owns `state.retryCount`;
// `router.ts` only ever reads it.
import type { IncomingEvent, SwarmState, VisualEvidence, ProposedPatch, SandboxResult } from "../types.js";
import { initialState } from "../types.js";
import { route } from "../router.js";
import type { TriageResult } from "../nodes/triage.js";
import type { VerifyOutput } from "../nodes/verify.js";
import type { SandboxRunOptions } from "../sandbox/dockerRunner.js";
import { EventLedger } from "../governance/eventLedger.js";
import { authorize, redeemAuthorization, type ActionRequest, type AuthorizationDecision } from "../governance/authorization.js";
import type { RuntimeManifest } from "../governance/runtimeManifest.js";

export interface SwarmDeps {
  triage: (event: IncomingEvent) => Promise<TriageResult>;
  capture: (route: string) => Promise<VisualEvidence>;
  diagnose: (input: { customerText: string; customerScreenshotBase64?: string; evidence: VisualEvidence; priorFailureLog?: string }) => Promise<ProposedPatch>;
  runSandbox: (opts: SandboxRunOptions) => Promise<SandboxResult>;
  verify: (input: { patch: ProposedPatch; sandboxResult: SandboxResult; evidence: VisualEvidence }) => Promise<VerifyOutput>;
  pnpmStorePath: string;
}

export interface SwarmRunResult {
  state: SwarmState;
  ledger: EventLedger;
  verification?: VerifyOutput;
  shipAuthorization: AuthorizationDecision;
}

/**
 * Runs the full pipeline up to (and including) the HITL checkpoint. It never
 * ships on its own — `authorize()` on an `external_side_effect` action without
 * an `approvalId` always returns `require_approval`, so this function's own
 * return value IS the pause. Call `resumeAfterApproval` to go further.
 */
export async function runSwarm(event: IncomingEvent, manifest: RuntimeManifest, deps: SwarmDeps): Promise<SwarmRunResult> {
  const ledger = new EventLedger();
  ledger.append("EVENT_RECEIVED", { eventId: event.eventId, route: event.route });

  let state = initialState(event);

  const triageResult = await deps.triage(event);
  ledger.append("TRIAGED", triageResult);
  if (!triageResult.isLayoutDefect) {
    state = { ...state, phase: "ESCALATED", failureLog: `triage: not a layout defect (${triageResult.summary})` };
    ledger.append("ESCALATED", { reason: "not_a_layout_defect" });
    return { state, ledger, shipAuthorization: { decision: "deny", reason: "not_applicable", decidedAt: new Date().toISOString() } };
  }

  const evidence = await deps.capture(event.route);
  ledger.append("REPRODUCED", { overlaps: evidence.overlaps, consoleErrors: evidence.consoleErrors.length });
  state = { ...state, phase: "REPRODUCED", evidence };

  while (true) {
    const decision = route(state);

    if (decision === "diagnose" || decision === "retry_diagnose") {
      const patch = await deps.diagnose({
        customerText: event.customerText,
        customerScreenshotBase64: event.customerScreenshotBase64,
        evidence: state.evidence!,
        priorFailureLog: state.failureLog,
      });
      ledger.append("DIAGNOSED", { assertion: patch.assertion, editCount: patch.edits.length, retryCount: state.retryCount });
      state = { ...state, phase: "DIAGNOSED", patch };
      continue;
    }

    if (decision === "sandbox") {
      const sandboxResult = await deps.runSandbox({
        repoPath: event.repoPath,
        edits: state.patch!.edits,
        route: event.route,
        assertion: state.patch!.assertion,
        pnpmStorePath: deps.pnpmStorePath,
      });
      ledger.append("SANDBOXED", { exitCode: sandboxResult.exitCode, assertionPassed: sandboxResult.assertionPassed });

      // Retry counter is mutated HERE — a node — never inside route().
      const failed = sandboxResult.exitCode !== 0 || sandboxResult.assertionPassed !== true;
      state = {
        ...state,
        phase: "SANDBOXED",
        sandboxResult,
        retryCount: failed ? state.retryCount + 1 : state.retryCount,
        failureLog: failed ? sandboxResult.logs.slice(-4000) : undefined,
      };
      continue;
    }

    if (decision === "verify") {
      const verification = await deps.verify({ patch: state.patch!, sandboxResult: state.sandboxResult!, evidence: state.evidence! });
      ledger.append("VERIFIED", { floor: verification.floor, ship: verification.ship, failedGates: verification.failedGates });
      state = { ...state, phase: "VERIFIED", quality: verification.scores };

      if (!verification.ship) {
        state = { ...state, phase: "ESCALATED" };
        ledger.append("ESCALATED", { reason: "quality_floor_or_hard_gate_failed", floor: verification.floor, failedGates: verification.failedGates });
        return { state, ledger, verification, shipAuthorization: { decision: "deny", reason: "quality_floor_not_met", decidedAt: new Date().toISOString() } };
      }

      const shipRequest: ActionRequest = { capability: "vcs.push_pr", scope: "swarm", impact: "external_side_effect" };
      const shipAuthorization = authorize(manifest, shipRequest);
      state = { ...state, phase: shipAuthorization.decision === "permit" ? "SHIPPED" : "AWAITING_APPROVAL" };
      ledger.append("HITL_CHECKPOINT", shipAuthorization);
      return { state, ledger, verification, shipAuthorization };
    }

    // hitl / escalate — nothing further this function can do without a human.
    state = { ...state, phase: "ESCALATED" };
    ledger.append("ESCALATED", { reason: `router_returned_${decision}`, retryCount: state.retryCount });
    return { state, ledger, shipAuthorization: { decision: "deny", reason: "escalated", decidedAt: new Date().toISOString() } };
  }
}

/** Called once a human supplies an approvalId. Re-checks a FRESH manifest at the actual boundary (Kernel §7 TOCTOU). */
export function resumeAfterApproval(prior: SwarmRunResult, freshManifest: RuntimeManifest, approvalId: string): SwarmRunResult {
  const shipRequest: ActionRequest = { capability: "vcs.push_pr", scope: "swarm", impact: "external_side_effect", approvalId };
  const shipAuthorization = redeemAuthorization(freshManifest, shipRequest);
  prior.ledger.append("HITL_RESUMED", shipAuthorization);
  const state: SwarmState = { ...prior.state, phase: shipAuthorization.decision === "permit" ? "SHIPPED" : "ESCALATED" };
  return { ...prior, state, shipAuthorization };
}
