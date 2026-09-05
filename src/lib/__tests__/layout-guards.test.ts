import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard against a layout bug that has now shipped twice.
 *
 * Flex and grid children default to `min-width: auto`, which means they refuse
 * to shrink below their content. A card built as a flex row whose text child
 * uses `truncate` therefore never truncates — instead the card grows past the
 * viewport and drags the whole document wider, which only shows up as
 * horizontal scrolling on a phone.
 *
 * It first appeared on the six grower pages (long guide titles pushed the
 * document 200-300px wide at 375px) and again on guide, strain and terpene
 * pages. Both times it was invisible until someone measured document
 * scrollWidth. The fix is one class — `min-w-0` on the flex item — so this
 * test enforces it rather than relying on remembering.
 */

const SRC = path.join(process.cwd(), "src");

function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return tsxFiles(full);
    return e.isFile() && e.name.endsWith(".tsx") ? [full] : [];
  });
}

/** Every className string literal in the file, with its source line. */
function classNames(file: string): { value: string; line: number }[] {
  const out: { value: string; line: number }[] = [];
  file.split("\n").forEach((text, i) => {
    for (const m of text.matchAll(/className="([^"]*)"/g)) {
      out.push({ value: m[1], line: i + 1 });
    }
    // Template-literal classNames: capture the static parts.
    for (const m of text.matchAll(/className=\{`([^`]*)`/g)) {
      out.push({ value: m[1], line: i + 1 });
    }
  });
  return out;
}

describe("flex row cards can shrink", () => {
  const files = tsxFiles(SRC);

  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("gives every horizontal card class list min-w-0", () => {
    const offenders: string[] = [];

    // How many lines after the opening tag count as "this element's subtree".
    // Generous enough for a card body, tight enough not to catch its siblings.
    const SUBTREE_LINES = 12;

    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      if (!src.includes("truncate")) continue;
      const lines = src.split("\n");

      for (const { value, line } of classNames(src)) {
        const isRowCard =
          value.includes("flex") &&
          value.includes("justify-between") &&
          !value.includes("flex-col") &&
          !value.includes("flex-wrap");
        if (!isRowCard || value.includes("min-w-0")) continue;

        // Only a card that actually contains truncating text can exhibit the
        // bug — a row of wrapping text shrinks on its own.
        const subtree = lines.slice(line, line + SUBTREE_LINES).join("\n");
        if (!subtree.includes("truncate")) continue;

        offenders.push(
          `${path.relative(process.cwd(), f)}:${line} — ${value.slice(0, 70)}`,
        );
      }
    }

    expect(
      offenders,
      `Flex row card(s) missing min-w-0, so a truncating child cannot shrink and ` +
        `will widen the document on narrow screens:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
