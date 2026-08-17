#!/usr/bin/env node
/**
 * Sovereign Website Factory — browser inspection pass.
 *
 * Skill 002 §12: when a browser is available, inspect rather than assume layout
 * correctness from source. This drives real Chromium against the real production
 * server and checks the things static HTML analysis structurally cannot see:
 * keyboard focus behaviour, rendered overflow at real viewports, and runtime
 * console/page errors.
 *
 * It deliberately does NOT emit Core Web Vitals numbers. Timings taken over
 * loopback with no network shaping are not field data and labelling them as such
 * would be exactly the kind of claim inflation the skill forbids.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

// The host ships a pinned Chromium that may not match the build Playwright
// expects. Prefer the provided binary over downloading a second one.
const HOST_CHROMIUM = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(HOST_CHROMIUM) ? { executablePath: HOST_CHROMIUM } : {};

const PORT = Number(process.env.SOVEREIGN_PORT ?? 4312);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve(".sovereign/browser");

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

// A representative slice of page archetypes, not every route — each one exercises
// a different layout and interaction shape.
const ROUTES = [
  { path: "/", label: "home" },
  { path: "/products", label: "catalog" },
  { path: "/products/ai-workspace-notion-template", label: "product-detail" },
  { path: "/membership", label: "membership" },
  { path: "/free-toolkit", label: "lead-magnet" },
  { path: "/__sovereign_missing_route__", label: "not-found" },
];

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(ORIGIN, { redirect: "manual" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`server not ready on ${ORIGIN}`);
}

async function inspect(page, route, viewport) {
  const findings = [];
  const consoleErrors = [];
  const pageErrors = [];

  const expectedStatus = route.label === "not-found" ? 404 : 200;
  const onConsole = (msg) => {
    if (msg.type() !== "error") return;
    // A page that is supposed to 404 logs its own document status as a console
    // error. That is the route working, not a defect.
    if (expectedStatus === 404 && /status of 404/.test(msg.text())) return;
    consoleErrors.push(msg.text());
  };
  const onPageError = (err) => pageErrors.push(String(err));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const response = await page.goto(`${ORIGIN}${route.path}`, { waitUntil: "networkidle" });

  if (response.status() !== expectedStatus) {
    findings.push(`unexpected status ${response.status()} (expected ${expectedStatus})`);
  }

  // Horizontal overflow is the classic responsive break that source review misses.
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    findings.push(`horizontal overflow: content ${overflow.scrollWidth}px in ${overflow.clientWidth}px viewport`);
  }

  // The skip link must be reachable and actually visible on first Tab, not merely
  // present in the DOM — presence is what the static audit already proved.
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el.tagName !== "A") return null;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      href: el.getAttribute("href"),
      text: (el.textContent ?? "").trim(),
      visible: rect.top >= 0 && rect.height > 0 && rect.width > 0 && style.visibility !== "hidden",
      top: Math.round(rect.top),
    };
  });
  if (!skip || skip.href !== "#main-content") {
    findings.push(`first Tab stop is not the skip link (got ${skip ? skip.href : "no anchor"})`);
  } else if (!skip.visible) {
    findings.push(`skip link focused but not visible (top=${skip.top}px)`);
  }

  const target = await page.evaluate(() => !!document.getElementById("main-content"));
  if (!target) findings.push("skip link target #main-content missing");

  if (consoleErrors.length) findings.push(`console errors: ${consoleErrors.slice(0, 3).join(" | ")}`);
  if (pageErrors.length) findings.push(`page errors: ${pageErrors.slice(0, 3).join(" | ")}`);

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  await page.screenshot({
    path: path.join(OUT, "screenshots", `${route.label}-${viewport.name}.png`),
    fullPage: false,
  });

  return { route: route.path, label: route.label, viewport: viewport.name, status: findings.length ? "FAIL" : "PASS", findings };
}

async function main() {
  const server = spawn("node_modules/.bin/next", ["start", "--port", String(PORT)], {
    stdio: ["ignore", "ignore", "ignore"],
    env: { ...process.env, NODE_ENV: "production" },
  });

  let browser;
  try {
    await waitForServer();
    await mkdir(path.join(OUT, "screenshots"), { recursive: true });

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];
    for (const route of ROUTES) {
      for (const viewport of VIEWPORTS) {
        results.push(await inspect(page, route, viewport));
      }
    }

    const failed = results.filter((r) => r.status === "FAIL");
    const report = {
      schema: "sovereign.browser-inspection.v1",
      inspectedAt: new Date().toISOString(),
      origin: ORIGIN,
      engine: `chromium ${browser.version()}`,
      checks: ["http status", "horizontal overflow", "skip-link keyboard reachability and visibility", "console/page errors"],
      viewports: VIEWPORTS,
      status: failed.length ? "FAIL" : "PASS",
      passed: results.length - failed.length,
      total: results.length,
      results,
      scopeNote:
        "Rendered-behaviour inspection over loopback. Not a WCAG conformance audit, " +
        "not assistive-technology testing, and deliberately carries no Core Web Vitals " +
        "numbers — loopback timings are not field data.",
    };

    await writeFile(path.join(OUT, "browser-inspection.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(`[browser] ${report.status}: ${report.passed}/${report.total} checks passed across ${ROUTES.length} routes x ${VIEWPORTS.length} viewports`);
    for (const f of failed) console.log(`  FAIL ${f.label} @ ${f.viewport}: ${f.findings.join("; ")}`);
    if (failed.length) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("[browser] FAILED:", err.message);
  process.exitCode = 1;
});
