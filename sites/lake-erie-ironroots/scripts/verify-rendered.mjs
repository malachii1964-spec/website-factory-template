/**
 * Rendered verification. Run against `next build && next start`.
 *
 *   node scripts/verify-rendered.mjs http://localhost:3000
 *
 * The unit tests cover arithmetic. This covers the things arithmetic cannot
 * see, and each check exists because something actually shipped broken:
 *
 *  - the Season Rule's today-marker was drawn 100px right of where its own
 *    numbers said, because a margin on an absolutely positioned element is
 *    added to the used `left` rather than shrinking the box
 *  - the Root Line rendered zero visible paths below 768px
 *  - a sticky header at 95% opacity let body text bleed through it
 *  - a heading turned invisible on the light band when a Tailwind utility lost
 *    to an unlayered class
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: EXE });

async function open(path, viewport) {
  const ctx = await browser.newContext({ viewport, isMobile: viewport.width < 500 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  return { ctx, page, errors, status: res?.status() };
}

/* ------------------------------------------------ the Season Rule marker -- */

for (const width of [1440, 375]) {
  const { ctx, page } = await open("/", { width, height: 900 });
  console.log(`\nSeason Rule geometry @${width}px`);

  const geo = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("figure li")];
    const marker = [...document.querySelectorAll("figure div")].find(
      (d) => getComputedStyle(d).backgroundColor === "rgb(226, 112, 42)" &&
             d.getBoundingClientRect().height > 50,
    );
    if (!rows.length || !marker) return null;
    // The track is the growing span in any row.
    const track = rows[0].querySelector(":scope > span:nth-child(2)").getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    const lit = rows
      .map((r) => {
        const bar = r.querySelector(":scope > span:nth-child(2) > span");
        const cs = bar && getComputedStyle(bar);
        return cs && cs.backgroundColor === "rgb(226, 112, 42)"
          ? { name: r.textContent.split(" — ")[0], ...bar.getBoundingClientRect().toJSON() }
          : null;
      })
      .filter(Boolean);
    return { track: track.toJSON(), marker: m.toJSON(), lit };
  });

  if (!geo) {
    check(false, "found the chart");
  } else {
    check(
      geo.marker.left >= geo.track.left - 1 &&
        geo.marker.right <= geo.track.right + 1,
      "today-marker sits inside the track",
      `marker ${Math.round(geo.marker.left)} vs track ${Math.round(geo.track.left)}–${Math.round(geo.track.right)}`,
    );
    // Every bar lit as "ready today" must actually contain the marker.
    const straddles = geo.lit.filter(
      (b) => b.left - 1 <= geo.marker.left && b.right + 1 >= geo.marker.left,
    );
    check(
      straddles.length === geo.lit.length,
      "every ember bar contains the today-marker",
      `${straddles.length}/${geo.lit.length}`,
    );
    check(geo.lit.length > 0, "something is lit as ready", `${geo.lit.length} crops`);
  }
  await ctx.close();
}

/* ------------------------------------------------------- the Root Line --- */

const window_innerHeightGuess = 812;
for (const [label, width] of [["desktop", 1440], ["mobile", 375]]) {
  const { ctx, page } = await open("/", { width, height: 812 });
  const vis = await page.evaluate(() => {
    const onScreen = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
    };
    const trunkSvg = document.querySelector("main svg[viewBox='0 0 16 1000'] path");
    const branches = [...document.querySelectorAll(".root-branch")];
    return {
      trunk: trunkSvg ? onScreen(trunkSvg) : false,
      trunkHeight: trunkSvg ? Math.round(trunkSvg.getBoundingClientRect().height) : 0,
      branches: branches.length,
      branchesVisible: branches.filter(onScreen).length,
      docHeight: document.documentElement.scrollHeight,
    };
  });
  console.log(`\nRoot Line @${label}`);
  check(vis.trunk, "the trunk renders", `height ${vis.trunkHeight} of doc ${vis.docHeight}`);
  // The trunk must span the document, not one viewport — that was the whole
  // point of moving it out of `position: fixed`.
  check(
    vis.trunkHeight > window_innerHeightGuess * 1.5 || vis.trunkHeight > 2000,
    "the trunk spans the document, not a viewport",
    `${vis.trunkHeight}px`,
  );
  if (width >= 768) {
    check(vis.branchesVisible > 0, "branches render on desktop", `${vis.branchesVisible}/${vis.branches}`);
  }
  await ctx.close();
}

/* ------------------------------------- chrome, overflow and page errors --- */

for (const path of ["/", "/visit", "/nope"]) {
  for (const width of [375, 1440]) {
    const { ctx, page, errors, status } = await open(path, { width, height: 812 });
    const out = await page.evaluate(() => {
      const header = document.querySelector("header");
      const cs = header && getComputedStyle(header);
      const bg = cs?.backgroundColor ?? "";
      const alpha = bg.startsWith("rgba") ? Number(bg.split(",")[3]) : 1;
      // Anything painting transparent text must not also be transparent-filled.
      const invisible = [...document.querySelectorAll("h1,h2,h3")].filter((h) => {
        const s = getComputedStyle(h);
        return s.color === "rgba(0, 0, 0, 0)" && s.backgroundImage === "none";
      }).length;
      return {
        docWidth: document.documentElement.scrollWidth,
        vw: window.innerWidth,
        headerAlpha: alpha,
        invisible,
      };
    });
    console.log(`\n${path} @${width}px (HTTP ${status})`);
    check(out.docWidth <= out.vw, "no horizontal overflow", `${out.docWidth} vs ${out.vw}`);
    check(out.headerAlpha === 1, "header is fully opaque", `alpha ${out.headerAlpha}`);
    check(out.invisible === 0, "no heading painted invisible", `${out.invisible} found`);
    check(
      errors.length === 0,
      "no uncaught page errors",
      errors.join(" | ") || "clean",
    );
    await ctx.close();
  }
}

/* ------------------------------------------- the degradation paths -------- */
/*
  The component comments and the design plan both promise that the root
  degrades to a FINISHED DRAWING rather than to nothing. Four of the five
  worst findings in this project's code review were places where prose
  asserted behaviour the code did not have, so these are measured.
*/
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const rm = await page.evaluate(() => {
    const paths = [...document.querySelectorAll(".root-branch-path")];
    return {
      count: paths.length,
      animated: paths.filter((p) => getComputedStyle(p).animationName !== "none").length,
      undrawn: paths.filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) > 0.01).length,
    };
  });
  console.log("\nprefers-reduced-motion: reduce");
  check(rm.count > 0, "branches are present", `${rm.count} paths`);
  check(rm.animated === 0, "nothing animates", `${rm.animated} animated`);
  check(rm.undrawn === 0, "every branch is fully drawn, not blank", `${rm.undrawn} undrawn`);
  await ctx.close();
}

{
  // A browser with no view-timeline support falls through to the base rule.
  // Assert that rule exists OUTSIDE the @supports block, which is the only
  // thing making the no-support path a drawing rather than an empty rail.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const href = await page.evaluate(
    () => document.querySelector('link[rel="stylesheet"]')?.getAttribute("href") ?? "",
  );
  const css = href ? await (await fetch(`${BASE}${href}`)).text() : "";
  const supportsAt = css.indexOf("@supports (animation-timeline");
  const baseAt = css.indexOf(".root-branch-path{");
  console.log("\nno view-timeline support");
  check(css.length > 0, "stylesheet is reachable", href);
  check(baseAt >= 0, "the base .root-branch-path rule exists");
  check(
    baseAt >= 0 && (supportsAt < 0 || baseAt < supportsAt),
    "the fully-drawn base rule sits outside @supports",
    `base @${baseAt}, supports @${supportsAt}`,
  );
  await ctx.close();
}

/* ------------------------------------------------- the printable sign ----- */
/*
  The sign is a printed object, so what matters is what the PRINT stylesheet
  produces — not what the screen shows. A bare `header, footer { display:none }`
  in the print block hid the sign's own header and footer, and it printed as an
  unbranded list of vegetables. Caught by looking at the paper; pinned here.
*/
{
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/sign`, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  const sign = await page.evaluate(() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== "none" && s.visibility !== "hidden";
    };
    const first = document.querySelector(".sign-list li");
    return {
      wordmark: vis(".sign-wordmark"),
      head: vis(".sign-head"),
      foot: vis(".sign-foot"),
      date: document.querySelector(".sign-date")?.textContent ?? "",
      items: document.querySelectorAll(".sign-list li").length,
      itemPt: first ? parseFloat(getComputedStyle(first).fontSize) : 0,
      bg: getComputedStyle(document.querySelector(".sign")).backgroundColor,
      chromeHidden: !vis("body > header") && !vis("body > footer"),
    };
  });
  console.log("\n/sign, print stylesheet");
  check(sign.wordmark && sign.head, "the farm name prints on the sign");
  check(sign.foot, "the sign's own footer prints");
  check(sign.chromeHidden, "site nav and footer do NOT print");
  check(sign.bg === "rgb(255, 255, 255)", "sign prints on white, not on the dark palette", sign.bg);
  check(sign.itemPt > 30, "crop names are big enough to read across a table", `${sign.itemPt}px`);
  check(sign.date.length > 0, "the sign is dated", sign.date);
  await ctx.close();
}

/* -------------------------------------- placeholder data is not published -- */

{
  const { ctx, page } = await open("/", { width: 1440, height: 900 });
  const html = await page.content();
  console.log("\nPlaceholder containment");
  check(!html.includes("0000 Route 20"), "no placeholder street in the HTML");
  check(!html.includes("tel:+1-716-000-0000"), "no dead tel: link");
  const ld = await page.evaluate(
    () => document.querySelector('script[type="application/ld+json"]')?.textContent ?? "",
  );
  check(!ld.includes("0000 Route 20"), "no placeholder address in structured data");
  check(!ld.includes("79.57"), "no placeholder geo in structured data");
  check(!html.includes("certified-organic"), "no unsubstantiated certification claim");
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
