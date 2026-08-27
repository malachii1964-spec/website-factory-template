#!/usr/bin/env node
// VS001 Runtime Capability Manifest — MALACHII Kernel §3 boot step 2.
// Observes. Never infers capability from an env var, a filename, or a plan name.
// A capability reaches A3_OBSERVED only when an actual invocation succeeded here.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = promisify(execFile);
const now = new Date();
const capabilities = [];

function record(name, kind, ok, source, detail) {
  capabilities.push({
    name,
    kind,                       // observation | authenticated_declaration | hint
    assurance: ok ? (kind === "observation" ? "A3_OBSERVED" : "A2_AUTHENTICATED_DECLARATION") : "A0_UNKNOWN",
    observedSuccess: kind === "observation" ? ok : undefined,
    source,
    detail,
    verifiedAt: now.toISOString(),
  });
}

// node.execute
try {
  const { stdout } = await run("node", ["-e", "process.stdout.write('ok')"]);
  record("node.execute", "observation", stdout === "ok", "node -e", process.version);
} catch (e) { record("node.execute", "observation", false, "node -e", String(e)); }

// filesystem.write
try {
  const d = await mkdtemp(join(tmpdir(), "vs001-"));
  await writeFile(join(d, "probe.txt"), "ok", "utf8");
  await rm(d, { recursive: true, force: true });
  record("filesystem.write", "observation", true, "mkdtemp+write+rm", "scoped tmp");
} catch (e) { record("filesystem.write", "observation", false, "mkdtemp+write+rm", String(e)); }

// browser.render — the boundary RC1.6.2 lists as UNVERIFIED in its build host
try {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.setContent("<!doctype html><html lang=en><head><title>probe</title></head><body><main><h1>probe</h1></main></body></html>");
  const h1 = await page.locator("h1").innerText();
  const box = await page.locator("h1").boundingBox();
  const v = browser.version();
  await browser.close();
  const ok = h1 === "probe" && !!box && box.width > 0;
  record("browser.render", "observation", ok, "chromium.launch+setContent+boundingBox", `chromium ${v}; h1 box w=${box?.width}`);
} catch (e) { record("browser.render", "observation", false, "chromium.launch", String(e).slice(0, 200)); }

// python.execute (the skill's own validators are Python)
try {
  const { stdout } = await run("python3", ["-c", "print('ok')"]);
  record("python.execute", "observation", stdout.trim() === "ok", "python3 -c", "3.x");
} catch (e) { record("python.execute", "observation", false, "python3 -c", String(e)); }

// model.anthropic — key presence is a DECLARATION, never an observation.
// Without a successful call it cannot exceed A2 and must not be used as though observed.
if (process.env.ANTHROPIC_API_KEY) {
  record("model.anthropic", "authenticated_declaration", true, "env:ANTHROPIC_API_KEY", "declared only; no call attempted");
} else {
  record("model.anthropic", "observation", false, "env:ANTHROPIC_API_KEY", "unset");
}

// deploy.publish — deliberately never probed. No deployment target, no authority.
record("deploy.publish", "observation", false, "not attempted", "no target, no authority granted");

const observed = new Set(capabilities.filter(c => c.assurance === "A3_OBSERVED").map(c => c.name));
// Execution state per the skill's own contract in SKILL.md §Runtime Capability Check
let executionState = "spec_only";
if (observed.has("filesystem.write") && observed.has("node.execute")) executionState = "source_build";
if (executionState === "source_build" && observed.has("browser.render")) executionState = "preview_verified";
// deployed_verified requires an actual deployment + live endpoint inspection. Never claimed here.

const manifest = {
  schema: "malachii.vs001.runtime-manifest.v1",
  host: { id: "claude-code-remote-sandbox", hint: process.env.MALACHII_HOST ?? null },
  probedAt: now.toISOString(),
  capabilities,
  executionState,
  truthBoundary:
    "Assurance reflects what was invoked successfully on this host at probe time. " +
    "model.anthropic is DECLARED at most, never observed — no credentialed call was made. " +
    "deploy.publish was never attempted and is not authorized. " +
    "executionState is capped at preview_verified; deployed_verified is not claimed.",
};

process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
