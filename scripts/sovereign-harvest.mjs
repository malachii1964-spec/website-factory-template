#!/usr/bin/env node
/**
 * Sovereign Website Factory — evidence harvester.
 *
 * The Skill 002 static auditor (`audit_static_site.py`) reads a directory of real
 * HTML and CSS. A Next.js app has neither on disk in auditable form, so this script
 * produces one honestly: it boots the production server built by `next build`,
 * fetches every route the sitemap actually declares, and writes what the server
 * really served. Nothing here is synthesised — if a page 500s, the harvest fails
 * rather than emitting a placeholder.
 *
 * Output: .sovereign/site/  (gitignored; regenerate with `pnpm sovereign:harvest`)
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, readdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.SOVEREIGN_PORT ?? 4311);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve(".sovereign/site");
const NEXT_STATIC_DIR = path.resolve(".next/static");

const log = (...a) => console.log("[harvest]", ...a);

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(ORIGIN, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`server did not become ready on ${ORIGIN} within ${timeoutMs}ms`);
}

/** Route paths come from the sitemap so the audit can never drift from what we publish. */
function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].trim()).pathname)
    .sort();
}

/** "/" -> index.html, "/products/x" -> products/x/index.html */
function outputFileFor(routePath) {
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  return clean === "" ? "index.html" : path.join(clean, "index.html");
}

async function fetchText(url, { expectStatus = 200 } = {}) {
  const res = await fetch(url);
  if (res.status !== expectStatus) {
    throw new Error(`${url} returned ${res.status}, expected ${expectStatus}`);
  }
  return res.text();
}

async function main() {
  if (!existsSync(".next")) {
    throw new Error("no .next build found — run `pnpm build` before harvesting");
  }

  const server = spawn("node_modules/.bin/next", ["start", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));
  server.on("exit", (code) => {
    if (code !== null && code !== 0) log(`server exited early (${code}):\n${serverLog}`);
  });

  try {
    await waitForServer();
    log(`server up on ${ORIGIN}`);

    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });

    const sitemapXml = await fetchText(`${ORIGIN}/sitemap.xml`);
    const robotsTxt = await fetchText(`${ORIGIN}/robots.txt`);
    await writeFile(path.join(OUT, "sitemap.xml"), sitemapXml);
    await writeFile(path.join(OUT, "robots.txt"), robotsTxt);

    const routes = parseSitemap(sitemapXml);
    if (routes.length === 0) throw new Error("sitemap declared zero routes");
    log(`sitemap declares ${routes.length} routes`);

    for (const routePath of routes) {
      const html = await fetchText(`${ORIGIN}${routePath}`);
      const dest = path.join(OUT, outputFileFor(routePath));
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, html);
    }

    // The 404 is a real user-facing state and gets audited like any other page.
    const notFound = await fetchText(`${ORIGIN}/__sovereign_missing_route__`, { expectStatus: 404 });
    await mkdir(path.join(OUT, "_states/not-found"), { recursive: true });
    await writeFile(path.join(OUT, "_states/not-found/index.html"), notFound);

    // Real compiled CSS, so the auditor's reduced-motion and focus-outline checks
    // run against shipped styles rather than source.
    // Next has moved compiled CSS between static/css and static/chunks across
    // versions, so discover it rather than assuming a path.
    let cssCount = 0;
    if (existsSync(NEXT_STATIC_DIR)) {
      await mkdir(path.join(OUT, "assets"), { recursive: true });
      for (const entry of await readdir(NEXT_STATIC_DIR, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".css")) continue;
        const from = path.join(entry.parentPath ?? entry.path, entry.name);
        await copyFile(from, path.join(OUT, "assets", entry.name));
        cssCount += 1;
      }
    }
    if (cssCount === 0) throw new Error("no compiled CSS found — audit would silently skip style checks");

    await writeFile(
      path.join(OUT, "site-profile.json"),
      JSON.stringify(
        {
          name: "FutureDeskAI",
          indexable: true,
          origin: "https://www.futuredeskai.com",
          harvestedFrom: ORIGIN,
          harvestedAt: new Date().toISOString(),
          routes: routes.length,
          extraStates: ["not-found"],
          stylesheets: cssCount,
          note:
            "Server-rendered HTML captured from the production build. Reflects initial " +
            "response only; post-hydration DOM and field metrics are not represented here.",
        },
        null,
        2,
      ) + "\n",
    );

    log(`captured ${routes.length} routes + 404, ${cssCount} stylesheets -> ${path.relative(process.cwd(), OUT)}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("[harvest] FAILED:", err.message);
  process.exitCode = 1;
});
