// Reproduce-then-diff. The customer's screenshot is the bug REPORT, not the
// evidence — it has no DOM, no computed styles, no viewport metadata, and under
// MALACHII Kernel §5 it is UNTRUSTED_EXTERNAL_CONTENT. This module reproduces
// the page in a controlled browser and extracts facts a model can be graded
// against, instead of asking a vision model to eyeball pixel coordinates.
import { chromium, type Browser } from "playwright";
import type { VisualEvidence } from "../types.js";
import { findOverlaps, type GeometryEntry } from "./geometry.js";

export interface CaptureOptions {
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  /** Override only for local/CI environments with a non-standard browser install path. */
  executablePath?: string;
  timeoutMs?: number;
}

const DEFAULT_VIEWPORT = { width: 390, height: 844 }; // iPhone-class mobile viewport — the class of report this targets

// Plain ES2020 JS (not TS) — this string is sent verbatim into the page context, so it
// must run unmodified by any bundler. See the comment at the call site for why.
const GEOMETRY_EXTRACTION_SCRIPT = `
(() => {
  const nodes = [...document.querySelectorAll("button, a, input, [role=button], main *")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })
    .slice(0, 400);

  const describe = (el) =>
    el.id ? ("#" + el.id) : (el.tagName.toLowerCase() + (el.className ? "." + [...el.classList].join(".") : ""));

  const ancestorsOf = (el) => {
    const chain = [];
    let cur = el.parentElement;
    while (cur) {
      chain.push(describe(cur));
      cur = cur.parentElement;
    }
    return chain;
  };

  const watchedProps = ["position", "top", "left", "z-index", "overflow", "display", "transform", "margin", "padding"];

  return nodes.map((el) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      selector: describe(el),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
      computed: Object.fromEntries(watchedProps.map((p) => [p, cs.getPropertyValue(p)])),
      ancestors: ancestorsOf(el),
    };
  });
})()
`;

export async function capture(url: string, opts: CaptureOptions = {}): Promise<VisualEvidence> {
  const viewport = opts.viewport ?? DEFAULT_VIEWPORT;
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ executablePath: opts.executablePath ?? process.env.PLAYWRIGHT_EXECUTABLE_PATH });
    const context = await browser.newContext({ viewport, deviceScaleFactor: opts.deviceScaleFactor ?? 3 });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await page.goto(url, { waitUntil: "networkidle", timeout: opts.timeoutMs ?? 15000 });

    // Passed as a STRING, not a closure: a bundler/transpiler (esbuild via tsx in
    // dev, or any minifier in prod) can inject helper calls like `__name(...)`
    // into a function's source when preserving names; Playwright re-serializes
    // that source via `.toString()` and evaluates it inside the page, where the
    // helper doesn't exist, producing "ReferenceError: __name is not defined".
    // A string literal is never touched by the transform, so it can't happen.
    const geometry: GeometryEntry[] = await page.evaluate(GEOMETRY_EXTRACTION_SCRIPT);

    const screenshotBuffer = await page.screenshot({ fullPage: true });

    return {
      route: url,
      viewport,
      screenshotBase64: screenshotBuffer.toString("base64"),
      geometry: geometry.map((g) => ({ selector: g.selector, rect: g.rect as unknown as Record<string, number>, computed: g.computed })),
      overlaps: findOverlaps(geometry),
      consoleErrors,
    };
  } finally {
    await browser?.close();
  }
}
