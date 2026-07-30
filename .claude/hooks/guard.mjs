#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { brainAvailable, projectDir, readHookInput } from "./lib.mjs";

/**
 * PreToolUse — a speed bump in front of actions that cannot be undone.
 *
 * The verdict comes from `malachii/src/safety/risk.ts`, which is pure and
 * deterministic on purpose: a guard has to behave the same on the thousandth
 * action as on the first, and a guard that reasons can be reasoned out of its
 * own conclusion.
 *
 * Two rules this hook lives by:
 *
 *   Fail open. If the classifier cannot be loaded or the payload is a shape it
 *   has never seen, the tool call proceeds. A guard that breaks the session when
 *   it breaks is worse than no guard — it gets uninstalled, and then nothing is
 *   guarded at all.
 *
 *   Explain, never just refuse. Every non-allow verdict carries the reason and
 *   the alternative, because a bare "denied" teaches nothing and invites a
 *   retry of the same thing.
 */

const input = await readHookInput();
const name = input.tool_name ?? "";
const toolInput = input.tool_input ?? {};

if (!name || !brainAvailable()) process.exit(0);

let verdict;
try {
  // Run the classifier out-of-process so a syntax error in it can never take
  // the hook — and therefore the session — down with it.
  const riskPath = join(projectDir(), "malachii", "src", "safety", "risk.ts");
  const out = execFileSync(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      "-e",
      `const { classify } = await import(${JSON.stringify(riskPath)});
       let payload = "";
       for await (const c of process.stdin) payload += c;
       process.stdout.write(JSON.stringify(classify(JSON.parse(payload))));`,
    ],
    {
      input: JSON.stringify({ name, input: toolInput }),
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "ignore"],
    },
  );
  verdict = JSON.parse(out);
} catch {
  process.exit(0); // Fail open.
}

if (!verdict || verdict.tier === "allow") process.exit(0);

// Record what the guard did, so its rules can be reviewed rather than
// accumulating forever unexamined.
//
// The life log, not memory. A guard fire is something that happened, not
// something the brain knows: written as a memory it entered the retrieval pool
// at high confidence and surfaced in unrelated briefs, and the stream of them
// is unbounded.
try {
  execFileSync(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      join(projectDir(), "malachii", "src", "cli", "mal.ts"),
      "event",
      `Guard ${verdict.tier}: ${verdict.rule} on ${name}`,
      "--kind",
      "guard.fired",
      "--quiet",
    ],
    { encoding: "utf8", timeout: 5000, stdio: "ignore" },
  );
} catch {
  // Logging is a nice-to-have; the verdict itself is what matters.
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: verdict.tier === "deny" ? "deny" : "ask",
      permissionDecisionReason: `${verdict.reason} [malachii guard: ${verdict.rule}]`,
    },
  }),
);
process.exit(0);
