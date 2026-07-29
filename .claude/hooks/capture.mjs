#!/usr/bin/env node
import { spawn } from "node:child_process";
import { brainAvailable, malPath, projectName, readHookInput, transcriptTurnCount } from "./lib.mjs";

/**
 * Stop — distill the finished session into durable memory.
 *
 * Runs detached so it never delays the end of a turn. Distillation may call
 * the API, which can take seconds; making Malachi wait for it would be the
 * fastest way to get the whole mechanism turned off.
 */

const input = await readHookInput();
const transcript = input.transcript_path;

if (!transcript || !brainAvailable()) process.exit(0);
// Below a handful of turns there is nothing worth keeping.
if (transcriptTurnCount(transcript) < 6) process.exit(0);

try {
  const child = spawn(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      malPath(),
      "capture",
      "--transcript",
      transcript,
      "--project",
      projectName(input),
      "--quiet",
      ...(input.session_id ? ["--session", input.session_id] : []),
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
} catch {
  // Losing one session's lessons is survivable; blocking the stop is not.
}
process.exit(0);
