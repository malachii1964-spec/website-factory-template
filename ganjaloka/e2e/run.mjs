// End-to-end check of phase 1 in a real browser against local Supabase.
// Usage: pnpm db:start && pnpm seed && pnpm build && pnpm start, then `pnpm e2e`.
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MAILPIT = "http://127.0.0.1:54324";
if (!process.env.SUPABASE_SECRET_KEY) throw new Error("Set SUPABASE_SECRET_KEY in .env.local (see .env.example).");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321", process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const SHOTS = new URL("./screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const tag = Date.now().toString(36).slice(-6);
const email = `e2e_${tag}@test.ganjaloka.dev`;
const username = `e2e_${tag}`;
const password = "frostybuds42";
let step = 0;

function check(condition, message) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`  ✓ ${message}`);
}

async function section(name, fn) {
  step += 1;
  console.log(`\n${step}. ${name}`);
  await fn();
}

async function confirmationLink(to) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const { messages = [] } = await res.json();
    if (messages.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const href = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(msg.HTML)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("FAILED: confirmation email never arrived");
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const phone = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await phone.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(e.message));

try {
  await section("Age gate blocks content until confirmed", async () => {
    await page.goto(`${BASE}/explore`);
    check(page.url().includes("/age?next=%2Fexplore"), "visitor is redirected to /age with next");
    await page.screenshot({ path: `${SHOTS}01-age-375.png`, fullPage: true });
    await page.goto(`${BASE}/legal/terms`);
    check(page.url().endsWith("/legal/terms"), "legal pages stay reachable without the gate");
    await page.goto(`${BASE}/age?next=/explore`);
    await page.getByRole("button", { name: /21 or older/ }).click();
    await page.waitForURL(`${BASE}/explore`);
    check(await page.getByText("Trichomes going milky").isVisible(), "explore shows seeded posts after confirming");
    await page.screenshot({ path: `${SHOTS}02-explore-guest-375.png`, fullPage: true });
  });

  await section("Landing page", async () => {
    await page.goto(`${BASE}/`);
    check(await page.getByRole("heading", { name: /grown by its people/i }).isVisible(), "hero renders");
    await page.screenshot({ path: `${SHOTS}03-landing-375.png`, fullPage: true });
  });

  await section("Sign-up rejects under-21 and invalid input (failure case)", async () => {
    await page.goto(`${BASE}/signup`);
    await page.fill("input[name=email]", email);
    await page.fill("input[name=password]", password);
    await page.fill("input[name=username]", username);
    await page.fill("input[name=displayName]", "E2E Grower");
    await page.fill("input[name=birthDate]", "2010-01-01");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByText("Accept the Terms").first().waitFor();
    check(await page.getByText("You must be 21 or older").isVisible(), "under-21 birth date is rejected inline");
    check(await page.locator("input[name=email]").inputValue() === email, "entered values are kept");
    await page.screenshot({ path: `${SHOTS}04-signup-errors-375.png`, fullPage: true });
  });

  await section("Sign-up → confirmation email → signed in", async () => {
    await page.fill("input[name=password]", password);
    await page.fill("input[name=birthDate]", "1990-04-20");
    await page.check("input[name=acceptTerms]");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(`${BASE}/check-email`);
    check(true, "lands on check-email");
    const link = await confirmationLink(email);
    await page.goto(link);
    await page.waitForURL(`${BASE}/home`);
    check(await page.getByText("Your feed grows with who you follow").isVisible(), "confirmed member sees empty-home state");
    await page.screenshot({ path: `${SHOTS}05-home-empty-375.png`, fullPage: true });
  });

  await section("Content filter blocks a sales post (failure case)", async () => {
    await page.getByLabel("Your post").fill("zaza for sale, menu in bio, cashapp only");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await page.getByText("doesn't allow buying or selling").waitFor();
    check(true, "sales solicitation is refused with an explanation");
  });

  await section("Post with a photo — GPS/EXIF stripped before upload", async () => {
    await page.getByLabel("Your post").fill("First harvest on GANJALOKA. Week 9, smelling like fuel.");
    await page.locator("input[type=file]").setInputFiles(new URL("./fixtures/grow-with-gps.jpg", import.meta.url).pathname);
    await page.getByLabel("Alt text for this photo").waitFor({ timeout: 15_000 });
    await page.getByLabel("Alt text for this photo").fill("Amber dots on a dark background");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await page.getByText("First harvest on GANJALOKA").waitFor();
    check(true, "post appears in the home feed");

    const { data: profile } = await admin.from("profiles").select("id").eq("username", username).single();
    const { data: post } = await admin.from("posts").select("media").eq("author_id", profile.id).single();
    const item = post.media[0];
    check(item.w === 2048 && item.h === 1365, `photo resized to ${item.w}×${item.h} (long edge 2048)`);
    const { data: blob } = await admin.storage.from("post-media").download(item.path);
    const bytes = Buffer.from(await blob.arrayBuffer());
    check(bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP", "stored as WebP");
    check(!bytes.includes(Buffer.from("Exif")) && !bytes.includes(Buffer.from("TestCamera")), "no EXIF/GPS/camera data in the stored file");
    await page.screenshot({ path: `${SHOTS}06-home-post-375.png`, fullPage: true });
  });

  await section("Follow, like (ripeness), repost, reply", async () => {
    await page.goto(`${BASE}/u/nightgrower`);
    await page.getByRole("button", { name: "Follow" }).click();
    await page.getByRole("button", { name: /Following|Unfollow/ }).waitFor();
    check(true, "follow toggles to Following");
    await page.screenshot({ path: `${SHOTS}07-profile-375.png`, fullPage: true });

    const like = page.getByRole("button", { name: /^Like · 0 likes/ }).first();
    await like.click();
    await page.getByRole("button", { name: /^Unlike · 1 like/ }).first().waitFor();
    await page.reload();
    check(await page.getByRole("button", { name: /^Unlike · 1 like/ }).first().isVisible(), "like persists after reload");
    const trichome = page.locator("svg.trichome[data-liked=true]").first();
    check((await trichome.getAttribute("data-ripeness")) === "milky", "liked post's trichome ripened to milky");

    await page.getByRole("button", { name: /^Repost · 0/ }).first().click();
    await page.getByText("Reposted to your followers.").waitFor();
    check(true, "repost confirmed");

    await page.goto(`${BASE}/home`);
    check(await page.getByText("Trichomes going milky").first().isVisible(), "followed member's posts are in the home feed");

    await page.getByRole("link", { name: /^Reply ·/ }).first().click();
    await page.waitForURL(/\/p\//);
    await page.getByLabel("Your reply").fill("Patience pays. Looking frosty!");
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    await page.getByText("Patience pays. Looking frosty!").waitFor();
    check(true, "reply appears on the thread");
    await page.screenshot({ path: `${SHOTS}08-thread-375.png`, fullPage: true });
  });

  await section("Report and block", async () => {
    await page.goto(`${BASE}/u/terpene_tasha`);
    await page.getByRole("button", { name: "Post options" }).first().click();
    await page.getByRole("menuitem", { name: "Report post" }).click();
    await page.getByRole("button", { name: "Send report" }).click();
    check(await page.getByText("Pick the reason that fits best.").isVisible(), "report without a reason is refused (failure case)");
    await page.getByLabel("Spam or scam").check();
    await page.getByRole("button", { name: "Send report" }).click();
    await page.getByText("Report sent.").waitFor();
    check(true, "report filed");

    await page.getByRole("button", { name: "More options for @terpene_tasha" }).click();
    await page.getByRole("menuitem", { name: "Block @terpene_tasha" }).click();
    await page.getByRole("button", { name: "Block @terpene_tasha" }).click();
    await page.getByText("You blocked @terpene_tasha").waitFor();
    check(true, "blocked profile shows the blocked state");
    await page.goto(`${BASE}/explore`);
    check((await page.getByText("limonene-forward").count()) === 0, "blocked member's posts vanish from Explore");
  });

  await section("Desktop layout", async () => {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: await phone.storageState() });
    const d = await desktop.newPage();
    await d.goto(`${BASE}/home`);
    await d.screenshot({ path: `${SHOTS}09-home-1280.png` });
    await d.goto(`${BASE}/u/nightgrower`);
    await d.screenshot({ path: `${SHOTS}10-profile-1280.png` });
    const guest = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const g = await guest.newPage();
    await g.goto(`${BASE}/age?next=/`);
    await g.getByRole("button", { name: /21 or older/ }).click();
    await g.waitForURL(`${BASE}/`);
    await g.screenshot({ path: `${SHOTS}11-landing-1280.png`, fullPage: true });
    check(true, "desktop screenshots captured");
  });

  await section("Delete account", async () => {
    await page.goto(`${BASE}/settings`);
    await page.screenshot({ path: `${SHOTS}12-settings-375.png`, fullPage: true });
    await page.fill("input[name=confirm]", "delete");
    await page.getByRole("button", { name: "Delete my account" }).click();
    check(await page.getByText("Type DELETE in capital letters").isVisible({ timeout: 5000 }).catch(() => false) ||
      (await page.getByText("Type DELETE in capital letters").waitFor().then(() => true)), "wrong confirmation is refused (failure case)");
    await page.fill("input[name=confirm]", "DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.waitForURL(/account=deleted/);
    const { data } = await admin.from("profiles").select("id").eq("username", username);
    check(data.length === 0, "profile and content are gone");
  });

  // Vercel Analytics' script only exists on Vercel; locally it 404s.
  const unexpected = consoleErrors.filter(
    (e) => !/Failed to load resource.*(401|403|404)/.test(e) && !e.includes("_vercel/insights"),
  );
  check(unexpected.length === 0, `no browser console errors${unexpected.length ? `: ${unexpected.join(" | ")}` : ""}`);
  console.log("\nAll end-to-end checks passed.");
} catch (error) {
  await page.screenshot({ path: `${SHOTS}FAILURE.png`, fullPage: true }).catch(() => {});
  console.error(`\n${error.message}\nConsole errors: ${consoleErrors.join(" | ") || "none"}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
