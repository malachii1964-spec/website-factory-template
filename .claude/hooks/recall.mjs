#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { brainAvailable, malPath, projectName, readHookInput } from "./lib.mjs";

/**
 * UserPromptSubmit — recall against what Malachi just asked.
 *
 * This is the hook that makes the intelligence feel continuous: every prompt
 * is answered with the relevant slice of everything it has ever learned,
 * retrieved by that prompt rather than dumped wholesale. stdout on exit 0 is
 * appended to the model's context.
 */

const input = await readHookInput();
const prompt = (input.prompt ?? "").trim();

// Nothing to retrieve against, or no brain installed — stay out of the way.
if (!prompt || prompt.length < 8 || !brainAvailable()) process.exit(0);

// Slash commands are addressed to the harness, not to the brain.
if (prompt.startsWith("/")) process.exit(0);

try {
  const output = execFileSync(process.execPath, [
    "--disable-warning=ExperimentalWarning",
    malPath(),
    "brief",
    prompt,
    "--project",
    projectName(input),
    "--budget",
    process.env.MALACHII_BRIEF_BUDGET ?? "900",
  ], { encoding: "utf8", timeout: 8000, stdio: ["ignore", "pipe", "ignore"] });

  // A brief with nothing in it is worse than no brief — it just burns context.
  if (output.includes("Treat it as new ground")) process.exit(0);
  process.stdout.write(output);
} catch {
  // Recall is an enhancement. If it fails, the session continues unaffected.
}
process.exit(0);
