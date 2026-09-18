/**
 * Rendered verification — measure the page, do not assert about the source.
 *
 * Usage:
 *   npm run build && npx next start -p 4800
 *   node scripts/verify-rendered.mjs http://localhost:4800
 *
 * This exists because the defects that actually shipped on this project were
 * all invisible in source and obvious in a browser: a heading painted the same
 * colour as its background by an unlayered CSS rule, SVG labels clipped
 * mid-word by a viewBox one size too small, a print stylesheet that hid the
 * printed sheet's own masthead, and a signature element that rendered zero
 * paths below 768px. Every check below measures the rendered result.
 *
 * It also enforces the art direction's anti-patterns against the DOM rather
 * than the stylesheet, so a rounded corner or a drop shadow arriving through a
 * Tailwind utility is caught too.
 */

import { chromium } from "playwright";
import { existsSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:4800";
const PINNED = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(PINNED) ? { executablePath: PINNED } : {};

let failures = 0;
let checks = 0;

function report(ok, label, detail) {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

function note(text) {
  console.log(`  note  ${text}`);
}

/* ------------------------------------------------------------ contrast --- */

function luminance([r, g, b]) {
  const v = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function parseRgb(s) {
  const m = s.match(/-?[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : null;
}

/* --------------------------------------------------------------- suite --- */

const ROUTES = ["/", "/visit", "/sign", "/nope"];
const WIDTHS = [320, 375, 768, 1280, 1920];

const browser = await chromium.launch(launchOptions);

/* 1. Layout: nothing may overflow horizontally at any width we support. */
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  console.log(`\n@${width}px`);
  for (const route of ROUTES) {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(BASE + route, { waitUntil: "networkidle" });

    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    report(over <= 0, `${route} no horizontal overflow`, `${over}px`);
    report(errors.length === 0, `${route} no uncaught page errors`, `${errors.length}`);
  }
  await page.close();
}

/* 2. Nothing is painted invisible against its own background. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\ntext is actually legible");
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const worst = await page.evaluate(() => {
      const bgOf = (el) => {
        let n = el;
        while (n) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
          n = n.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const out = [];
      for (const el of document.querySelectorAll("h1,h2,h3,h4,p,td,th,li,a,dt,dd,figcaption")) {
        if (!el.textContent.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        out.push({
          color: cs.color,
          bg: bgOf(el),
          size: parseFloat(cs.fontSize),
          weight: cs.fontWeight,
          text: el.textContent.trim().slice(0, 40),
        });
      }
      return out;
    });

    let low = null;
    for (const item of worst) {
      const fg = parseRgb(item.color);
      const bg = parseRgb(item.bg);
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      // WCAG large text is 18.66px bold or 24px regular.
      const large = item.size >= 24 || (item.size >= 18.66 && Number(item.weight) >= 700);
      const required = large ? 3 : 4.5;
      if (ratio < required && (!low || ratio < low.ratio)) {
        low = { ...item, ratio, required };
      }
    }
    report(
      low === null,
      `${route} every run of text clears AA`,
      low ? `${low.ratio.toFixed(2)} vs ${low.required} on "${low.text}"` : "none below",
    );
  }
  await page.close();
}

/* 3. SVG figure labels stay inside their own viewBox. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\nfigures");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const clipped = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll("figure svg")) {
      const vb = svg.viewBox.baseVal;
      for (const t of svg.querySelectorAll("text")) {
        const b = t.getBBox();
        if (b.x + b.width > vb.width - 1 || b.y + b.height > vb.height - 1 || b.x < 0) {
          bad.push(`${t.textContent} ends at ${(b.x + b.width).toFixed(0)} of ${vb.width}`);
        }
      }
    }
    return bad;
  });
  report(clipped.length === 0, "no figure label is clipped", clipped.join("; ") || "all inside");

  const described = await page.evaluate(() => {
    const figs = [...document.querySelectorAll("figure svg")];
    return {
      total: figs.length,
      labelled: figs.filter((s) => (s.getAttribute("aria-label") ?? "").length > 40).length,
      captioned: [...document.querySelectorAll("figure")].filter((f) =>
        f.querySelector("figcaption"),
      ).length,
    };
  });
  report(
    described.total > 0 && described.labelled === described.total,
    "every figure has a text description",
    `${described.labelled}/${described.total}`,
  );
  report(
    described.captioned === described.total,
    "every figure has a caption",
    `${described.captioned}/${described.total}`,
  );
  await page.close();
}

/* 4. The record is a real table, not a grid of divs pretending to be one. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\nthe record");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const t = await page.evaluate(() => {
    const tables = [...document.querySelectorAll("table")];
    return {
      count: tables.length,
      withCaption: tables.filter((x) => x.querySelector("caption")).length,
      scoped: tables.every((x) =>
        [...x.querySelectorAll("th")].every((h) => h.hasAttribute("scope")),
      ),
      rows: tables.reduce((n, x) => n + x.querySelectorAll("tbody tr").length, 0),
    };
  });
  report(t.count >= 2, "both registers render as tables", `${t.count}`);
  report(t.withCaption === t.count, "every table has a caption", `${t.withCaption}/${t.count}`);
  report(t.scoped, "every table header carries scope");
  report(t.rows > 0, "the register is not empty", `${t.rows} rows`);
  await page.close();
}

/* 5. The art direction's anti-patterns, measured on the rendered DOM. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\nart direction");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const found = await page.evaluate(() => {
    const hits = { radius: [], shadow: [], blur: [], darkBg: [] };
    const lum = ([r, g, b]) => {
      const v = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      const name = el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ")[0]}` : "");
      if (cs.borderRadius && !/^0px( 0px)*$/.test(cs.borderRadius)) hits.radius.push(`${name} ${cs.borderRadius}`);
      if (cs.boxShadow && cs.boxShadow !== "none") hits.shadow.push(`${name} ${cs.boxShadow}`);
      if (cs.backdropFilter && cs.backdropFilter !== "none") hits.blur.push(name);
      const m = cs.backgroundColor.match(/-?[\d.]+/g);
      if (m && Number(m[3] ?? 1) > 0.5) {
        const el_lum = lum([Number(m[0]), Number(m[1]), Number(m[2])]);
        const r = el.getBoundingClientRect();
        if (el_lum < 0.3 && r.width * r.height > 20000) {
          hits.darkBg.push(`${name} area ${Math.round(r.width * r.height)}`);
        }
      }
    }
    return hits;
  });
  report(found.radius.length === 0, "no rounded corners", found.radius.slice(0, 3).join("; ") || "none");
  report(found.shadow.length === 0, "no drop shadows", found.shadow.slice(0, 3).join("; ") || "none");
  report(found.blur.length === 0, "no backdrop blur", found.blur.slice(0, 3).join("; ") || "none");
  report(found.darkBg.length === 0, "no large dark surface", found.darkBg.slice(0, 3).join("; ") || "none");
  await page.close();
}

/* 6. Reduced motion: the page must be identical, because nothing animates. */
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  console.log("\nprefers-reduced-motion: reduce");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const moving = await page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.animationName !== "none" && cs.animationDuration !== "0s") n += 1;
      if (el.getAnimations && el.getAnimations().length > 0) n += 1;
    }
    return n;
  });
  report(moving === 0, "nothing animates", `${moving} animated`);
  await page.close();
}

/* 7. Keyboard focus is visible and was not removed. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\nkeyboard focus");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      color: cs.outlineColor,
    };
  });
  report(focus !== null, "tab moves focus into the page", focus?.tag ?? "nothing focused");
  report(
    focus !== null && parseFloat(focus.width) >= 2 && focus.style !== "none",
    "the focus ring is drawn",
    focus ? `${focus.style} ${focus.width}` : "n/a",
  );
  await page.close();
}

/* 8. The printable sheet keeps its own masthead when printing. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log("\nprint");
  await page.goto(BASE + "/sign", { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  const printed = await page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    const h1 = document.querySelector("main h1, main header h1");
    return {
      ownMasthead: visible(document.querySelector("main header")),
      wordmark: h1 ? h1.textContent.trim() : null,
      siteHeaderHidden: !visible(document.querySelector("body > header")),
      instructionHidden: !visible(document.querySelector(".print\\:hidden")),
    };
  });
  report(printed.ownMasthead, "the sheet keeps its own masthead", printed.wordmark ?? "missing");
  report(printed.siteHeaderHidden, "the site navigation is dropped from the printout");
  report(printed.instructionHidden, "the on-screen print instruction is dropped");
  await page.emulateMedia({ media: "screen" });
  await page.close();
}

await browser.close();

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILED`} — ${checks} checks`,
);
process.exit(failures === 0 ? 0 : 1);
