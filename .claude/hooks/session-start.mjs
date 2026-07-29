#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { brainAvailable, malPath, projectName, readHookInput } from "./lib.mjs";

/**
 * SessionStart — who you are, who this is for, and what you already believe.
 *
 * Deliberately small. The heavy, query-specific recall happens per prompt in
 * recall.mjs; this exists so the very first turn of a session is not amnesiac.
 */

const input = await readHookInput();
if (!brainAvailable()) process.exit(0);

const project = projectName(input);

try {
  const output = execFileSync(process.execPath, [
    "--disable-warning=ExperimentalWarning",
    malPath(),
    "brief",
    `standing context and open work for ${project}`,
    "--project",
    project,
    "--budget",
    "600",
  ], { encoding: "utf8", timeout: 8000, stdio: ["ignore", "pipe", "ignore"] });

  if (output.includes("Treat it as new ground")) process.exit(0);
  process.stdout.write(output);
} catch {
  // A cold start is a worse session, not a broken one.
}
process.exit(0);
