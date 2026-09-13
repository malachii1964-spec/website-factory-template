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

for (const [label, width] of [["desktop", 1440], ["mobile", 375]]) {
  const { ctx, page } = await open("/", { width, height: 812 });
  const vis = await page.evaluate(() => {
    const paths = [...document.querySelectorAll(".root-line path")];
    const wrap = document.querySelector(".root-line")?.parentElement;
    const w = wrap?.getBoundingClientRect();
    return paths.filter((p) => {
      const r = p.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && w && r.left < w.right && r.right > w.left;
    }).length;
  });
  console.log(`\nRoot Line @${label}`);
  check(vis > 0, "the signature renders at all", `${vis} visible paths`);
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
