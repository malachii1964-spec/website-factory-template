#!/usr/bin/env node
// Runs INSIDE the sandbox container. Boots the patched app, runs the model's
// assertion against it via Playwright, and prints PASS/FAIL — nothing here
// trusts the model's own claim that the fix worked.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 3100;
const ROUTE = process.env.SWARM_ROUTE ?? "/";
const ASSERTION_BODY = process.env.SWARM_ASSERTION;

if (!ASSERTION_BODY) {
  console.error("SWARM_ASSERTION env var is required");
  process.exit(2);
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // not up yet
    }
    await delay(500);
  }
  throw new Error(`server did not become ready within ${timeoutMs}ms`);
}

async function runAssertion(page) {
  // The assertion is a Playwright expression string proposed by the model
  // (e.g. "await page.locator('#checkout-btn').boundingBox().then(b => b.y > 100)").
  // It runs only inside this network-isolated, resource-limited, non-root container —
  // that containment is what makes evaluating model-authored code here acceptable.
  const fn = new Function("page", `return (async () => { return (${ASSERTION_BODY}); })();`);
  return Boolean(await fn(page));
}

async function main() {
  const server = spawn("pnpm", ["start", "--port", String(PORT)], { cwd: "/work", stdio: "inherit" });
  try {
    await waitForServer(`http://localhost:${PORT}${ROUTE}`);
    const browser = await chromium.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      await page.goto(`http://localhost:${PORT}${ROUTE}`, { waitUntil: "networkidle" });
      const passed = await runAssertion(page);
      console.log(passed ? "ASSERTION_PASSED" : "ASSERTION_FAILED");
      process.exit(passed ? 0 : 1);
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("ASSERTION_ERROR", err);
  process.exit(2);
});
