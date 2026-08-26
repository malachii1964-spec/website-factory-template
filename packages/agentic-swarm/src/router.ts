// Routing is arithmetic on state, not a model call — MALACHII Kernel §10,
// "smallest sufficient intelligence configuration." Paying a frontier model to
// emit {"next_node": "..."} JSON for what a switch statement decides is the
// single most common failure mode in the reference designs this package fixes.
//
// This function is PURE. It must never mutate SwarmState — the ChatGPT-sourced
// design that inspired this package incremented `retry_count` inside a
// LangGraph conditional edge, which routing functions cannot persist, so the
// counter stayed frozen at 0 and the graph looped until it hit the platform's
// hard recursion ceiling. The fix: routers return a decision, only NODES
// (run.ts) touch state.
import type { SwarmState } from "./types.js";

export type RouteDecision = "reproduce" | "diagnose" | "sandbox" | "verify" | "hitl" | "retry_diagnose" | "escalate";

export function route(state: SwarmState): RouteDecision {
  switch (state.phase) {
    case "TRIAGED":
      return "reproduce";
    case "REPRODUCED":
      return "diagnose";
    case "DIAGNOSED":
      return "sandbox";
    case "SANDBOXED": {
      const result = state.sandboxResult;
      if (!result) return "escalate";
      if (result.exitCode === 0 && result.assertionPassed === true) return "verify";
      if (state.retryCount < state.maxRetries) return "retry_diagnose";
      return "escalate";
    }
    case "VERIFIED":
      return "hitl";
    default:
      return "escalate";
  }
}
