#!/usr/bin/env node
// VS001 Chromium evidence pass — real browser, real served site.
// Facts a model cannot be the oracle for (overlap, contrast ratio, focus visibility,
// tap target size, horizontal overflow) are COMPUTED here. The model's role is
// interpretation, never measurement.
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const BASE = process.env.VS001_BASE ?? "http://127.0.0.1:3200";
const ROUTES = (process.env.VS001_ROUTES ?? "/,/products,/about,/membership,/free-toolkit,/local-business,/legal/terms,/products/ai-workspace-notion-template,/nonexistent-page-404-probe").split(",");
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const PAGE_PROBE = `
(() => {
  const R = (el) => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,top:r.top,left:r.left,right:r.right,bottom:r.bottom}; };
  const sel = (el) => el.id ? ("#"+el.id) : (el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "."+el.className.trim().split(/\\s+/).slice(0,2).join(".") : ""));

  // ---- horizontal overflow (a real, common mobile defect) ----
  const de = document.documentElement;
  const horizontalOverflowPx = Math.max(0, de.scrollWidth - de.clientWidth);
  const overflowingEls = [];
  if (horizontalOverflowPx > 0) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > de.clientWidth + 1) overflowingEls.push({ selector: sel(el), right: Math.round(r.right), viewport: de.clientWidth });
      if (overflowingEls.length >= 10) break;
    }
  }

  // ---- interactive element inventory + tap-target sizing (WCAG 2.2 AA 2.5.8 = 24px) ----
  const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])')];
  const tooSmall = [];
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 24 || r.height < 24) tooSmall.push({ selector: sel(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText||el.value||"").trim().slice(0,40) });
  }

  // ---- overlap among non-nested interactive elements ----
  const boxes = interactive.map(el => ({ el, sel: sel(el), r: R(el) })).filter(b => b.r.w > 0 && b.r.h > 0);
  const overlaps = [];
  for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
    const A=boxes[i], B=boxes[j];
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
    const a=A.r,b=B.r;
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
      overlaps.push([A.sel, B.sel]);
      if (overlaps.length >= 10) break;
    }
  }

  // ---- landmarks / heading structure ----
  const h1s = [...document.querySelectorAll("h1")].map(h => h.innerText.trim()).filter(Boolean);
  const mains = document.querySelectorAll("main").length;
  const headingLevels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h => Number(h.tagName[1]));
  let headingSkips = [];
  for (let i=1;i<headingLevels.length;i++) if (headingLevels[i] - headingLevels[i-1] > 1) headingSkips.push({ from: headingLevels[i-1], to: headingLevels[i] });

  // ---- images without alt ----
  const imgsNoAlt = [...document.querySelectorAll("img")].filter(i => !i.hasAttribute("alt")).map(i => i.getAttribute("src")||"(no src)").slice(0,10);

  // ---- contrast: computed, not judged ----
  const parseRGB = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p = m[1].split(",").map(x=>parseFloat(x)); return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]}; };
  const lum = (c) => { const f=(v)=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); };
  const effBg = (el) => { let n=el; while(n && n!==document.documentElement){ const bg=parseRGB(getComputedStyle(n).backgroundColor); if(bg && bg.a>0.95) return bg; n=n.parentElement; } const b=parseRGB(getComputedStyle(document.body).backgroundColor); return b&&b.a>0.95?b:{r:255,g:255,b:255,a:1}; };
  const lowContrast = [];
  const textEls = [...document.querySelectorAll("p,li,a,span,h1,h2,h3,h4,button,label")].slice(0,300);
  for (const el of textEls) {
    const t=(el.innerText||"").trim(); if(!t) continue;
    const r=el.getBoundingClientRect(); if(r.width===0||r.height===0) continue;
    const cs=getComputedStyle(el); const fg=parseRGB(cs.color); if(!fg||fg.a<0.95) continue;
    const bg=effBg(el);
    const L1=lum(fg), L2=lum(bg);
    const ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px=parseFloat(cs.fontSize); const bold=(parseInt(cs.fontWeight)||400)>=700;
    const large = px>=24 || (px>=18.66 && bold);
    const required = large?3:4.5;
    if (ratio < required) lowContrast.push({ selector: sel(el), ratio: Math.round(ratio*100)/100, required, fontPx: Math.round(px), text: t.slice(0,40) });
    if (lowContrast.length>=15) break;
  }

  return {
    horizontalOverflowPx, overflowingEls,
    interactiveCount: interactive.length,
    tapTargetsUnder24px: tooSmall.slice(0,10),
    interactiveOverlaps: overlaps,
    h1Count: h1s.length, h1Texts: h1s.slice(0,3), mainLandmarks: mains, headingSkips: headingSkips.slice(0,5),
    imagesMissingAlt: imgsNoAlt,
    lowContrast,
    title: document.title, lang: document.documentElement.getAttribute("lang"),
    metaDescription: !!document.querySelector('meta[name="description"][content]:not([content=""])'),
  };
})()
`;

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
    page.on("pageerror", e => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));
    const url = BASE + route;
    let status = null, probe = null, error = null, keyboard = null, t0 = Date.now(), loadMs = null;
    try {
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      status = resp?.status() ?? null;
      loadMs = Date.now() - t0;
      probe = await page.evaluate(PAGE_PROBE);

      // keyboard reachability: does Tab reach a visible, focus-styled control?
      await page.keyboard.press("Tab");
      keyboard = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { reachedControl: false };
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        const visible = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
        const hasFocusStyle = cs.outlineStyle !== "none" || cs.boxShadow !== "none";
        return { reachedControl: true, tag: a.tagName.toLowerCase(), visible, hasFocusStyle,
                 text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 40) };
      });
    } catch (e) { error = String(e).slice(0, 300); }
    results.push({ viewport: vp.name, route, status, loadMs, consoleErrors, keyboard, probe, error });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

// ---- aggregate into measured facts ----
const agg = {
  routesProbed: ROUTES.length,
  viewports: VIEWPORTS.map(v => v.name),
  pagesWithHorizontalOverflow: results.filter(r => r.probe?.horizontalOverflowPx > 0).map(r => ({ viewport: r.viewport, route: r.route, px: r.probe.horizontalOverflowPx, offenders: r.probe.overflowingEls })),
  pagesWithConsoleErrors: results.filter(r => r.consoleErrors.length).map(r => ({ viewport: r.viewport, route: r.route, errors: r.consoleErrors })),
  pagesWithInteractiveOverlap: results.filter(r => r.probe?.interactiveOverlaps?.length).map(r => ({ viewport: r.viewport, route: r.route, overlaps: r.probe.interactiveOverlaps })),
  pagesWithSmallTapTargets: results.filter(r => r.probe?.tapTargetsUnder24px?.length).map(r => ({ viewport: r.viewport, route: r.route, targets: r.probe.tapTargetsUnder24px })),
  pagesWithLowContrast: results.filter(r => r.probe?.lowContrast?.length).map(r => ({ viewport: r.viewport, route: r.route, items: r.probe.lowContrast })),
  pagesMissingH1: results.filter(r => r.probe && r.probe.h1Count === 0).map(r => `${r.viewport}${r.route}`),
  pagesWithMultipleMain: results.filter(r => r.probe && r.probe.mainLandmarks !== 1).map(r => ({ route: `${r.viewport}${r.route}`, mains: r.probe.mainLandmarks })),
  pagesMissingAlt: results.filter(r => r.probe?.imagesMissingAlt?.length).map(r => ({ route: `${r.viewport}${r.route}`, imgs: r.probe.imagesMissingAlt })),
  pagesWithHeadingSkips: results.filter(r => r.probe?.headingSkips?.length).map(r => ({ route: `${r.viewport}${r.route}`, skips: r.probe.headingSkips })),
  keyboardFailures: results.filter(r => r.keyboard && (!r.keyboard.reachedControl || !r.keyboard.hasFocusStyle)).map(r => ({ route: `${r.viewport}${r.route}`, kb: r.keyboard })),
  navigationErrors: results.filter(r => r.error).map(r => ({ route: `${r.viewport}${r.route}`, error: r.error })),
  nonOkStatuses: results.filter(r => r.status !== null && r.status >= 400).map(r => ({ route: `${r.viewport}${r.route}`, status: r.status })),
};

const out = {
  schema: "malachii.vs001.chromium-evidence.v1",
  capturedAt: new Date().toISOString(),
  base: BASE,
  engine: "chromium (playwright)",
  measurementNote: "Overlap, overflow, tap-target size and contrast ratio are COMPUTED from getBoundingClientRect/getComputedStyle, not judged by a model. Load timings are single-sample lab measurements on a sandbox host and are NOT field data or Core Web Vitals p75.",
  aggregate: agg,
  perPage: results,
};
await writeFile(process.env.VS001_OUT ?? "chromium-evidence.json", JSON.stringify(out, null, 2), "utf8");
console.log(JSON.stringify(agg, null, 2));
