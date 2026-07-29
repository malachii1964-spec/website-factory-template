import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared plumbing for the hooks.
 *
 * Hooks run on every prompt and every stop, so the rule here is: never throw,
 * never block, never print anything Claude has to read past. A hook that
 * breaks must degrade to silence, not to a broken session.
 */

export function projectDir() {
  return (
    process.env.CLAUDE_PROJECT_DIR ??
    resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
  );
}

export function malPath() {
  return join(projectDir(), "malachii", "src", "cli", "mal.ts");
}

export function brainAvailable() {
  return existsSync(malPath());
}

/** Read the hook payload from stdin. Returns `{}` rather than failing on surprises. */
export async function readHookInput() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Project scope defaults to the directory name, matching the CLI's own default. */
export function projectName(input) {
  const cwd = input?.cwd ?? process.cwd();
  return cwd.split("/").filter(Boolean).pop() ?? "global";
}

export function transcriptTurnCount(path) {
  try {
    return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}
