// Runnable entrypoint: `pnpm --filter @fda/agentic-swarm demo`.
//
// Per MALACHII Kernel §9 ("do not describe unavailable capabilities as
// present"), this probes the REAL host before doing anything: if Playwright's
// browser is reachable it actually reproduces the fixture bug (real geometry,
// real overlap detection — nothing mocked). If ANTHROPIC_API_KEY or a Docker
// daemon is missing, those two nodes are swapped for clearly-labeled mocks so
// the rest of the pipeline (router, retry loop, ledger, quality floor, HITL
// gate) still runs end to end and prints real output — but the run report
// says exactly which nodes were mocked, never claims otherwise.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { hasExecutableCapability, probeSwarmRuntime } from "./governance/runtimeManifest.js";
import { runSwarm, type SwarmDeps } from "./graph/run.js";
import { capture } from "./vision/capture.js";
import { triage as realTriage } from "./nodes/triage.js";
import { diagnose as realDiagnose } from "./nodes/diagnose.js";
import { verify as realVerify } from "./nodes/verify.js";
import { runInSandbox } from "./sandbox/dockerRunner.js";
import type { IncomingEvent, VisualEvidence, ProposedPatch, SandboxResult } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  const manifest = await probeSwarmRuntime();
  const hasAnthropic = hasExecutableCapability(manifest, "model.anthropic", "swarm");
  const hasDocker = hasExecutableCapability(manifest, "sandbox.docker", "swarm");
  const hasVision = hasExecutableCapability(manifest, "vision.capture", "swarm");

  console.log("== Runtime Capability Manifest ==");
  console.log(JSON.stringify({ host: manifest.host, hasAnthropic, hasDocker, hasVision }, null, 2));
  console.log();

  const event: IncomingEvent = {
    eventId: "evt_demo_1",
    route: `file://${join(here, "..", "fixtures", "broken-checkout.html")}`,
    customerText: "Checkout crashes when I click Buy Now on mobile — the button overlaps the footer.",
    repoPath: process.cwd(),
  };

  const deps: SwarmDeps = {
    triage: hasAnthropic
      ? realTriage
      : async (e) => {
          console.log("[MOCK] triage — no ANTHROPIC_API_KEY observed");
          return { isLayoutDefect: true, severity: "medium", summary: `mock triage of: ${e.customerText.slice(0, 60)}` };
        },
    capture: hasVision
      ? (route: string) => capture(route)
      : async (): Promise<VisualEvidence> => {
          console.log("[MOCK] capture — no browser binary observed");
          return { route: event.route, viewport: { width: 390, height: 844 }, screenshotBase64: "", geometry: [], overlaps: [["#checkout-btn", "footer"]], consoleErrors: [] };
        },
    diagnose: hasAnthropic
      ? realDiagnose
      : async (): Promise<ProposedPatch> => {
          console.log("[MOCK] diagnose — no ANTHROPIC_API_KEY observed");
          return {
            diagnosis: "mock: #checkout-btn has a negative top offset that pulls it into the footer",
            rootCauseSelector: "#checkout-btn",
            edits: [{ file: "src/checkout.css", find: "top: -20px;", replace: "top: 10px;", rationale: "mock placeholder edit" }],
            assertion: "await page.locator('#checkout-btn').boundingBox().then(b => b.y >= 80)",
          };
        },
    runSandbox: hasDocker
      ? runInSandbox
      : async (): Promise<SandboxResult> => {
          console.log("[MOCK] sandbox — no Docker daemon observed");
          return { exitCode: 0, logs: "[MOCK] sandbox not executed — no docker daemon on this host", diff: null, assertionPassed: true };
        },
    verify: hasAnthropic
      ? realVerify
      : async (input) => {
          console.log("[MOCK] verify — no ANTHROPIC_API_KEY observed");
          const scores = { accuracy: 6, verification: 6, completeness: 6, intentAlignment: 6, executionReadiness: 6, structure: 6, edgeCases: 6 };
          return {
            scores,
            criticalVulnerability: "mock verification — no live model call was made, this score is not evidence of anything",
            ship: false,
            floor: 6,
            failedGates: input.sandboxResult.diff ? [] : ["diff_non_empty"],
          };
        },
    pnpmStorePath: process.env.PNPM_STORE_PATH ?? join(process.env.HOME ?? "/tmp", ".pnpm-store"),
  };

  const result = await runSwarm(event, manifest, deps);

  console.log();
  console.log("== Final State ==");
  console.log(JSON.stringify({ phase: result.state.phase, retryCount: result.state.retryCount, quality: result.state.quality }, null, 2));

  console.log();
  console.log("== Event Ledger ==");
  console.log(JSON.stringify(result.ledger.snapshot(), null, 2));
  console.log(`ledger hash-chain valid: ${result.ledger.verify()}`);

  console.log();
  console.log("== Ship Authorization ==");
  console.log(JSON.stringify(result.shipAuthorization, null, 2));

  if (!hasAnthropic || !hasDocker) {
    console.log();
    console.log("NOTE: this run used mocked node(s) — set ANTHROPIC_API_KEY and run a Docker daemon for a real end-to-end pass.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
