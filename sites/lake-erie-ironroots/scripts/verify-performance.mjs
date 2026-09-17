/**
 * Core Web Vitals on a simulated mid-range phone.
 *
 *   npm run build && npx next start -p 4800
 *   node scripts/verify-performance.mjs http://localhost:4800
 *
 * performance.md sets the budgets: LCP < 2.5s, CLS < 0.1, INP < 200ms, and
 * first-load JS < 150KB gzipped per route. Those numbers only mean anything
 * against a throttled device — an unthrottled localhost LCP of ~1.1s is not
 * evidence of anything, which is exactly what this build had before.
 *
 * So: 4x CPU slowdown and Slow-4G network shaping via CDP, cache disabled,
 * measured with a real PerformanceObserver rather than by reading entries
 * after the fact (largest-contentful-paint is not reliably buffered).
 *
 * JS is counted the way it must be counted on this stack: only what a MODERN
 * browser actually downloads. Next emits a `noModule` core-js chunk that no
 * browser since 2017 fetches, and summing every <script src> in the HTML
 * inflates the figure by roughly 25%.
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";

/*
  This container pins a Chromium build at a known path; a normal machine does
  not have it. Use the pinned one when it is there and otherwise let Playwright
  resolve its own browser, so the same script runs here and on the owner's
  laptop. If neither exists Playwright says so clearly, and the fix is one
  command: npx playwright install chromium
*/
const PINNED = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(PINNED) ? { executablePath: PINNED } : {};

import { gzipSync } from "node:zlib";

const BASE = process.argv[2] ?? "http://localhost:4800";

const BUDGET = { lcp: 2500, cls: 0.1, inp: 200, jsKb: 150 };

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch(launchOptions);

async function measure(path) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  // Slow 4G, the shape performance.md means by "mid-range mobile".
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  // Observe from the very first script, before anything paints.
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, inp: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__vitals.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.hadRecentInput) window.__vitals.cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          window.__vitals.inp = Math.max(window.__vitals.inp, e.duration);
        }
      }).observe({ type: "event", durationThreshold: 16, buffered: true });
    } catch {
      /* event timing is optional */
    }
  });

  const js = new Map();
  const css = new Map();
  page.on("response", async (res) => {
    const u = res.url();
    if (!u.includes("/_next/")) return;
    // A noModule chunk is never fetched by a modern engine; if Chromium does
    // not request it, it simply never reaches this handler — which is the
    // point. Nothing here needs to filter it out by name.
    try {
      const body = await res.body();
      const gz = gzipSync(body).length;
      if (u.endsWith(".js")) js.set(u, gz);
      else if (u.endsWith(".css")) css.set(u, gz);
    } catch {
      /* redirects and aborted bodies are not interesting */
    }
  });

  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);

  // Drive one real interaction so INP has something to report.
  const link = page.locator('a[href="#ready"]').first();
  if (await link.count()) {
    await link.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }

  const v = await page.evaluate(() => window.__vitals);
  const jsKb = [...js.values()].reduce((a, b) => a + b, 0) / 1024;
  const cssKb = [...css.values()].reduce((a, b) => a + b, 0) / 1024;

  await ctx.close();
  return { ...v, jsKb, cssKb, files: js.size };
}

for (const path of ["/", "/visit"]) {
  console.log(`\n${path} — Pixel 5, 4x CPU throttle, Slow 4G, cache disabled`);
  const m = await measure(path);
  check(m.lcp > 0 && m.lcp < BUDGET.lcp, "LCP under 2.5s", `${Math.round(m.lcp)}ms`);
  check(m.cls < BUDGET.cls, "CLS under 0.1", m.cls.toFixed(4));
  check(m.inp < BUDGET.inp, "slowest interaction under 200ms", `${Math.round(m.inp)}ms`);
  check(
    m.jsKb < BUDGET.jsKb,
    "first-load JS under 150KB gzipped",
    `${m.jsKb.toFixed(1)}KB across ${m.files} files`,
  );
  console.log(`  note  CSS ${m.cssKb.toFixed(1)}KB gzipped`);
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL BUDGETS MET" : `${failures} BUDGET(S) BROKEN`}`);
process.exit(failures === 0 ? 0 : 1);
