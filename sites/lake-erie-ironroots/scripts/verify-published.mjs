/**
 * Verify the PUBLISHED state — the half of /visit that only exists once the
 * owner fills in their real details.
 *
 * This script exists because that branch had never been rendered. While the
 * placeholders are in place `hasRealContactDetails()` is false, so the
 * tap-to-call link, the address block, the "Open in maps" link and the Google
 * Maps iframe were dead code in every build that had ever been made — and the
 * day they switch on is the day nobody is watching. Rule 3's fifth gate asks
 * for verification in a real browser flow, and it could not have been met for
 * that half of the page.
 *
 * HOW TO RUN IT
 *
 *   1. In src/lib/farm.ts, temporarily set a real-shaped street, phone and
 *      email. A 555 number is correct here — nothing is ever dialled.
 *   2. npm run build && npx next start -p 4700
 *   3. node scripts/verify-published.mjs
 *   4. git checkout src/lib/farm.ts
 *
 * Last run, all checks passed at both widths: the placeholder notice
 * disappears, the map renders at 472x354 (desktop) and 335x251 (mobile) with
 * no horizontal overflow and no layout shift, the phone renders formatted and
 * dials the real number, and the structured data starts publishing the
 * address, phone and coordinates it had been correctly withholding.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:4700";
const OUT = process.env.SHOT_DIR ?? "/tmp/ironroots-shots";

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

let bad = 0;
const ck = (ok, l, d = "") => {
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${l}${d ? ` — ${d}` : ""}`);
};

for (const w of [1440, 375]) {
  const ctx = await b.newContext({
    viewport: { width: w, height: 900 },
    isMobile: w < 500,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(`${BASE}/visit`, { waitUntil: "domcontentloaded" });
  // The map is a third-party frame and may never settle; do not wait on it.
  await p.waitForTimeout(1200);

  console.log(`\n/visit PUBLISHED state @${w}px`);
  const o = await p.evaluate(() => ({
    tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => ({
      href: a.getAttribute("href"),
      text: a.textContent.trim(),
    })),
    mailto: [...document.querySelectorAll('a[href^="mailto:"]')].length,
    iframes: [...document.querySelectorAll("iframe")].map((f) => {
      const r = f.getBoundingClientRect();
      return {
        loading: f.getAttribute("loading"),
        h: Math.round(r.height),
        w: Math.round(r.width),
      };
    }),
    mapsLink: [...document.querySelectorAll('a[href*="google.com/maps"]')].map(
      (a) => a.getAttribute("href"),
    ),
    addressEl: document.querySelector("address")?.textContent.replace(/\s+/g, " ").trim(),
    placeholderBox: document.body.textContent.includes("have not been published yet"),
    ld: document.querySelector('script[type="application/ld+json"]')?.textContent ?? "",
    docW: document.documentElement.scrollWidth,
    vw: window.innerWidth,
  }));

  // The first tel: on the page is the header's call button, which carries both
  // a mobile "Call" label and a desktop number — hence `includes`, not equality.
  ck(o.tel.length > 0 && /^tel:\+1-\d{3}-\d{3}-\d{4}$/.test(o.tel[0].href ?? ""),
    "tap-to-call renders and dials a real number", o.tel[0]?.href);
  ck(/\(\d{3}\) \d{3}-\d{4}/.test(o.tel[0]?.text ?? ""),
    "phone is displayed formatted", o.tel[0]?.text);
  ck(o.mailto > 0, "mailto link renders");
  ck(!o.placeholderBox, "the not-published placeholder is gone");
  ck(!!o.addressEl, "address block renders", o.addressEl);
  ck(o.iframes.length === 1, "exactly one map iframe");
  ck(o.iframes[0]?.loading === "lazy", "map is lazy-loaded");
  ck((o.iframes[0]?.h ?? 0) > 100 && (o.iframes[0]?.w ?? 0) > 100,
    "map has a real box (no CLS surprise)", `${o.iframes[0]?.w}x${o.iframes[0]?.h}`);
  ck(o.mapsLink.length > 0, "'Open in maps' link renders");
  ck(o.ld.includes("streetAddress"), "structured data now publishes the address");
  ck(o.ld.includes("telephone"), "structured data now publishes the phone");
  ck(o.ld.includes("GeoCoordinates"), "structured data now publishes geo");
  ck(o.docW <= o.vw, "no horizontal overflow with the map present",
    `${o.docW} vs ${o.vw}`);
  ck(errs.length === 0, "no page errors", errs.join(" | ") || "clean");

  try {
    await p.screenshot({ path: `${OUT}/visit-published-${w}.png`, fullPage: w === 1440 });
  } catch {
    // Screenshots are a convenience here, not the assertion.
  }
  await ctx.close();
}

await b.close();
console.log(`\n${bad === 0 ? "PUBLISHED-STATE VERIFIED" : `${bad} CHECK(S) FAILED`}`);
process.exit(bad === 0 ? 0 : 1);
