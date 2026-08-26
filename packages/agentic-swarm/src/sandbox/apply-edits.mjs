#!/usr/bin/env node
// Runs INSIDE the sandbox container only. Applies the model's structured find/replace
// edits to files under /work/src. Never executes model output as a shell string —
// this is a fixed script baked into the image; only its JSON *input* is model-generated.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const WORK_ROOT = "/work";
const ALLOWED_ROOT = resolve(WORK_ROOT, "src");

function assertPathAllowed(file) {
  const resolved = resolve(WORK_ROOT, file);
  const rel = relative(ALLOWED_ROOT, resolved);
  if (rel.startsWith("..") || resolved === ALLOWED_ROOT) {
    throw new Error(`edit target outside allowed root: ${file}`);
  }
  if (relative(WORK_ROOT, resolved).split("/")[0] === ".git") {
    throw new Error(`edit target inside .git is forbidden: ${file}`);
  }
  return resolved;
}

function main() {
  const editsPath = process.argv[2];
  if (!editsPath) {
    console.error("usage: apply-edits.mjs <edits.json>");
    process.exit(1);
  }
  const edits = JSON.parse(readFileSync(editsPath, "utf8"));
  if (!Array.isArray(edits) || edits.length === 0) {
    console.error("edits.json must be a non-empty array");
    process.exit(1);
  }

  for (const edit of edits) {
    const target = assertPathAllowed(edit.file);
    const original = readFileSync(target, "utf8");
    const occurrences = original.split(edit.find).length - 1;
    if (occurrences === 0) {
      throw new Error(`find text not found in ${edit.file}: ${JSON.stringify(edit.find).slice(0, 120)}`);
    }
    if (occurrences > 1) {
      throw new Error(`find text is not unique in ${edit.file} (${occurrences} occurrences) — refusing ambiguous edit`);
    }
    writeFileSync(target, original.replace(edit.find, edit.replace), "utf8");
    console.log(`applied edit: ${edit.file}`);
  }
}

main();
