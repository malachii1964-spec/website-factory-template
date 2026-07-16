/**
 * Turn an upgraded content markdown file into a branded, print-ready PDF.
 *
 *   node scripts/generate-pdf.mjs content/products/easy-ai-prompt-mastery.md
 *
 * Output: private/downloads/<slug>.pdf  (gitignored — it's a paid product)
 * The slug comes from the file's front matter, falling back to the filename.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "playwright";

const CHROME = process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

function parseFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return { meta, body: m[2] };
}

const CSS = `
  @page { size: Letter; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a22; line-height: 1.6; font-size: 11.5pt; }
  h1, h2, h3 { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f0e17; line-height: 1.2; }
  h1 { font-size: 26pt; letter-spacing: -0.02em; }
  h2 { font-size: 18pt; margin-top: 0; padding-top: 0; page-break-before: always; border-bottom: 2px solid #5b3df5; padding-bottom: 6px; color: #2a1a6a; }
  h3 { font-size: 13pt; color: #5b3df5; margin-top: 22px; }
  p { margin: 0 0 12px; }
  strong { color: #0f0e17; }
  em { color: #444; }
  ul, ol { margin: 0 0 14px; padding-left: 22px; }
  li { margin-bottom: 6px; }
  blockquote { border-left: 3px solid #5b3df5; margin: 14px 0; padding: 2px 16px; color: #333; background: #f6f4ff; font-style: italic; }
  code, pre { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 9.5pt; }
  pre { background: #14121f; color: #e9e8f0; padding: 14px 16px; border-radius: 8px; white-space: pre-wrap; overflow-wrap: anywhere; }
  code { background: #efeafe; color: #3a1a8a; padding: 1px 4px; border-radius: 3px; }
  pre code { background: none; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 10pt; }
  th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #f3f1fb; font-family: 'Helvetica Neue', Arial, sans-serif; }
  hr { border: 0; border-top: 1px solid #e2e0ec; margin: 22px 0; }
  a { color: #5b3df5; }
  /* Title block sits before the first chapter; keep it on page one */
  .cover { text-align: center; padding-top: 40mm; }
  .cover h1 { border: 0; }
`;

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node scripts/generate-pdf.mjs <content-file.md>");
    process.exit(1);
  }
  const raw = await readFile(input, "utf8");
  const { meta, body } = parseFrontMatter(raw);
  const slug = meta.slug || path.basename(input).replace(/\.md$/, "");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
  <body>${marked.parse(body)}</body></html>`;

  const outDir = path.join(process.cwd(), "private", "downloads");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${slug}.pdf`);

  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: outFile,
    format: "Letter",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="width:100%;font-size:8px;color:#999;text-align:center;font-family:Arial">FutureDeskAI.com — 50% of every sale supports St. Jude &amp; homeless veterans · Page <span class="pageNumber"></span></div>',
    margin: { top: "22mm", bottom: "20mm", left: "20mm", right: "20mm" },
  });
  await browser.close();

  console.log(`✓ ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
