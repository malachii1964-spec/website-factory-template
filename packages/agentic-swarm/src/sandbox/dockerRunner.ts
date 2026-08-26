// Host-side orchestration for the hardened sandbox. Fixes, relative to the
// reference design this replaces:
//   - `network="host"` deleted network isolation AND broke container-name DNS
//     at the same time. Here: a per-run `--internal` bridge network — DNS
//     resolves between containers, nothing can reach the internet.
//   - No Postgres readiness check — migrations raced the socket. Here: poll
//     `pg_isready` via `docker inspect .State.Health.Status` before proceeding.
//   - `mode: 'rw'` bind-mounted the live repo. Here: a throwaway `git worktree`,
//     never the real working tree — worst case `rm -rf` the worktree.
//   - Fixed container names caused 409 Conflict on a second run and leaked on
//     crash. Here: a unique run ID per invocation, `--rm`, and a `finally` that
//     tears down every resource even on failure.
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PatchEdit, SandboxResult } from "../types.js";

const run = promisify(execFile);
const RUNNER_IMAGE = "swarm-runner:latest";

export interface SandboxRunOptions {
  repoPath: string;
  edits: PatchEdit[];
  route: string;
  assertion: string;
  pnpmStorePath: string;
  postgresPassword?: string;
}

async function waitHealthy(containerName: string, timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const { stdout } = await run("docker", ["inspect", "-f", "{{.State.Health.Status}}", containerName]);
      if (stdout.trim() === "healthy") return;
    } catch {
      // container not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${containerName} did not become healthy within ${timeoutMs}ms`);
}

export async function runInSandbox(opts: SandboxRunOptions): Promise<SandboxResult> {
  const runId = randomUUID().slice(0, 8);
  const network = `swarm-net-${runId}`;
  const dbName = `swarm-db-${runId}`;
  const dbPassword = opts.postgresPassword ?? randomUUID();
  const worktreeDir = join(tmpdir(), `swarm-wt-${runId}`);
  const outDir = await mkdtemp(join(tmpdir(), "swarm-out-"));

  const cleanup: Array<() => Promise<void>> = [];
  try {
    await run("docker", ["network", "create", "--driver", "bridge", "--internal", network]);
    cleanup.push(async () => {
      await run("docker", ["network", "rm", network]).catch(() => {});
    });

    await run("docker", [
      "run", "-d", "--name", dbName, "--network", network,
      "-e", `POSTGRES_PASSWORD=${dbPassword}`, "-e", "POSTGRES_DB=testdb",
      "--health-cmd", "pg_isready -U postgres", "--health-interval=2s", "--health-retries=30",
      "postgres:16-alpine",
    ]);
    cleanup.push(async () => {
      await run("docker", ["rm", "-f", dbName]).catch(() => {});
    });
    await waitHealthy(dbName);

    // Throwaway worktree — never the real working tree. `-f` allows reusing a branch name across retries.
    await run("git", ["-C", opts.repoPath, "worktree", "add", "-f", worktreeDir, "HEAD"]);
    cleanup.push(async () => {
      await run("git", ["-C", opts.repoPath, "worktree", "remove", "--force", worktreeDir]).catch(() => {});
    });

    const editsDir = await mkdtemp(join(tmpdir(), "swarm-edits-"));
    cleanup.push(async () => {
      await rm(editsDir, { recursive: true, force: true }).catch(() => {});
    });
    await writeFile(join(editsDir, "edits.json"), JSON.stringify(opts.edits, null, 2), "utf8");

    const { stdout: workVolumeId } = await run("docker", ["volume", "create", `swarm-work-${runId}`]);
    const workVolume = workVolumeId.trim();
    cleanup.push(async () => {
      await run("docker", ["volume", "rm", "-f", workVolume]).catch(() => {});
    });
    // Seed the named volume from the worktree via a throwaway alpine container (keeps the bind mount read-only-friendly on the host side).
    await run("docker", [
      "run", "--rm",
      "-v", `${worktreeDir}:/src:ro`,
      "-v", `${workVolume}:/dst`,
      "alpine", "sh", "-c", "cp -a /src/. /dst/",
    ]);

    const runnerArgs = [
      "run", "--rm", "--name", `swarm-runner-${runId}`, "--network", network,
      "--user", "10001:10001",
      "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=256m",
      "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
      "--pids-limit", "512", "--memory", "4g", "--cpus", "2",
      "-v", `${workVolume}:/work`,
      "-v", `${outDir}:/out`,
      "-v", `${editsDir}:/edits:ro`,
      "-v", `${opts.pnpmStorePath}:/store:ro`,
      "-e", `DATABASE_URL=postgresql://postgres:${dbPassword}@${dbName}:5432/testdb`,
      "-e", `SWARM_ROUTE=${opts.route}`,
      "-e", `SWARM_ASSERTION=${opts.assertion}`,
      RUNNER_IMAGE,
    ];

    let exitCode = 0;
    let logs = "";
    try {
      const { stdout, stderr } = await run("docker", runnerArgs, { maxBuffer: 32 * 1024 * 1024 });
      logs = `${stdout}\n${stderr}`;
    } catch (err) {
      const e = err as { code?: number; stdout?: string; stderr?: string };
      exitCode = e.code ?? 1;
      logs = `${e.stdout ?? ""}\n${e.stderr ?? ""}`;
    }

    let diff: string | null = null;
    try {
      diff = await readFile(join(outDir, "patch.diff"), "utf8");
    } catch {
      diff = null;
    }

    const assertionPassed = logs.includes("ASSERTION_PASSED") ? true : logs.includes("ASSERTION_FAILED") ? false : null;

    return { exitCode, logs, diff, assertionPassed };
  } finally {
    for (const step of cleanup.reverse()) await step();
    await rm(outDir, { recursive: true, force: true }).catch(() => {});
  }
}
