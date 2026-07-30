#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
// node:sqlite is flagged experimental and warns on import. The warning is noise
// in every hook and every shell, and the API it warns about is one we pin.
import { parseArgs } from "node:util";
import { createInterface } from "node:readline";
import { basename } from "node:path";
import { z } from "zod";
import { loadConfig } from "../core/config.ts";
import { MEMORY_KINDS, type MemoryKind } from "../core/types.ts";
import { MemoryStore } from "../memory/store.ts";
import { brief, describe } from "../memory/pack.ts";
import { consolidate } from "../memory/consolidate.ts";
import { ingestFile, ingestUrl } from "../memory/ingest.ts";
import { activeLessons, learn, report } from "../learning/lessons.ts";
import { distill } from "../learning/distill.ts";
import { openProposals, reflect } from "../learning/reflect.ts";
import { readTranscript } from "../learning/transcript.ts";
import {
  VOLATILITY_DAYS,
  lookupStandards,
  recordStandard,
  staleStandards,
  trustStandard,
  type Volatility,
} from "../knowledge/standards.ts";

/**
 * `mal` — the brain's command surface.
 *
 * Every capability the hooks, the console, and Malachi himself use goes
 * through here, so there is exactly one way to write to memory and one way to
 * read from it. `mal console` puts the same surface behind a running prompt
 * instead of one process per command.
 */

const HELP = `malachii v3 — Malachi's intelligence

  mal remember <text>            Write a memory       [--kind --title --tags --project --importance --pin]
  mal learn <rule> --when <cond> Teach a lesson       [--project --confidence]
  mal recall <query>             Search memory        [--k --kind --project --json]
  mal brief [query]              Context block for a prompt   [--project --budget]
  mal lessons                    What it believes, by confidence   [--project]
  mal confirm <id>               A lesson held up
  mal refute <id> <reason>       A lesson led it wrong
  mal forget <id> [reason]       Retire a memory
  mal show <id>                  Full detail on one memory
  mal ingest <path|url>          Learn from a file or page    [--project --tags]
  mal capture --transcript <p>   Distill a finished session   [--project --session]
  mal reflect <what you built>   Record the two-pass reflex   [--tighten --escalate]
  mal proposals                  The 10x ideas waiting on a decision
  mal standard <claim> --for <scope> --source <url>   Shelve an external standard  [--volatility --trusted]
  mal standards [scope]          What "good" means, and what expired  [--stale]
  mal vouch <id>                 Take a standard out of quarantine
  mal sleep                      Consolidate: fade, merge, retire, promote  [--dry-run]
  mal stats                      What it knows
  mal log                        Recent life log      [--n --kind]
  mal console                    Interactive session — same commands, one open connection

Storage: ${loadConfig().dbPath}
`;

const CONSOLE_HELP = `\ntype any command above without the leading "mal", e.g. \`recall stripe\`.
  help, ?          show this list
  clear, cls       clear the screen
  exit, quit, q    leave (Ctrl+D also works)
`;

/** Thrown for a bad command; caught and printed without ever exiting the process while in the console. */
class CliError extends Error {}

const KindSchema = z.enum(MEMORY_KINDS);
const UnitSchema = z.coerce.number().min(0).max(1);
const CountSchema = z.coerce.number().int().min(1).max(1000);

const OPTIONS = {
  kind: { type: "string" },
  title: { type: "string" },
  tags: { type: "string" },
  project: { type: "string" },
  importance: { type: "string" },
  confidence: { type: "string" },
  when: { type: "string" },
  tighten: { type: "string" },
  escalate: { type: "string" },
  k: { type: "string" },
  budget: { type: "string" },
  transcript: { type: "string" },
  session: { type: "string" },
  n: { type: "string" },
  for: { type: "string" },
  source: { type: "string" },
  volatility: { type: "string" },
  trusted: { type: "boolean", default: false },
  stale: { type: "boolean", default: false },
  json: { type: "boolean", default: false },
  pin: { type: "boolean", default: false },
  "dry-run": { type: "boolean", default: false },
  quiet: { type: "boolean", default: false },
  help: { type: "boolean", default: false },
} as const;

function parseCommand(args: string[]) {
  return parseArgs({ allowPositionals: true, strict: true, options: OPTIONS, args });
}
type Parsed = ReturnType<typeof parseCommand>;

/**
 * Splits one console line into argv-shaped tokens, honouring quotes so
 * `remember "ship it" --tags "a b"` keeps its spaces where they're wanted.
 * Unquoted text still just splits on whitespace, same as a shell would hand
 * `mal` its argv.
 */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return tokens;
}

function fail(message: string): never {
  throw new CliError(message);
}

function parseUnit(value: string | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = UnitSchema.safeParse(value);
  if (!parsed.success) fail(`--${label} must be a number between 0 and 1`);
  return parsed.data;
}

function parseCount(value: string | undefined, fallback: number, label: string): number {
  if (value === undefined) return fallback;
  const parsed = CountSchema.safeParse(value);
  if (!parsed.success) fail(`--${label} must be a whole number`);
  return parsed.data;
}

function parseKind(value: string | undefined): MemoryKind | undefined {
  if (value === undefined) return undefined;
  const parsed = KindSchema.safeParse(value);
  if (!parsed.success) fail(`--kind must be one of: ${MEMORY_KINDS.join(", ")}`);
  return parsed.data;
}

/** Default project scope is the directory you are standing in. */
function projectOf(explicit: string | undefined): string | null {
  if (explicit === "global") return null;
  return explicit ?? process.env["MALACHII_PROJECT"] ?? basename(process.cwd());
}

function firstLine(text: string, max = 90): string {
  const line = text.split("\n")[0]!.trim();
  return line.length <= max ? line : `${line.slice(0, max - 1)}…`;
}

function parseVolatility(value: string | undefined): Volatility | undefined {
  if (value === undefined) return undefined;
  if (value in VOLATILITY_DAYS) return value as Volatility;
  fail(`--volatility must be one of: ${Object.keys(VOLATILITY_DAYS).join(", ")}`);
}

function describeStandard(standard: import("../core/types.ts").Memory): string {
  const until = standard.staleAfter
    ? new Date(standard.staleAfter).toISOString().slice(0, 10)
    : "no expiry";
  const flags = [
    standard.tags.includes("quarantined") ? "quarantined" : "vouched",
    standard.staleAfter && standard.staleAfter <= Date.now() ? "EXPIRED" : `until ${until}`,
  ].join(" · ");
  return (
    `${standard.id}  [${flags}]\n  for: ${standard.appliesWhen ?? "—"}\n` +
    `  ${firstLine(standard.body, 110)}\n  source: ${standard.originRef ?? "—"}`
  );
}

function statsSummary(store: MemoryStore): string {
  const stats = store.stats();
  return (
    `memories      ${stats.total}\n` +
    Object.entries(stats.byKind)
      .map(([kind, n]) => `  ${kind.padEnd(12)}${n}\n`)
      .join("") +
    `lessons       ${stats.lessons.active} active, ${stats.lessons.retired} retired, ` +
    `mean confidence ${stats.lessons.meanConfidence.toFixed(2)}\n` +
    `embedded      ${stats.embedded} (${store.embedder.id})\n` +
    `life log      ${stats.events} events\n` +
    `first memory  ${stats.oldest ? new Date(stats.oldest).toISOString() : "—"}\n`
  );
}

async function dispatch(store: MemoryStore, parsed: Parsed): Promise<void> {
  const { values, positionals } = parsed;
  const [command, ...rest] = positionals;
  if (!command || values.help) {
    process.stdout.write(HELP);
    return;
  }

  const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  switch (command) {
    case "help": {
      process.stdout.write(HELP);
      break;
    }

    case "remember": {
      const text = rest.join(" ").trim();
      if (!text) fail("nothing to remember — pass the text as an argument");
      const kind = parseKind(values.kind) ?? "semantic";
      const importance = parseUnit(values.importance, "importance");
      const memory = await store.remember({
        kind,
        title: values.title ?? firstLine(text),
        body: text,
        tags,
        project: projectOf(values.project),
        origin: "user",
        pinned: values.pin,
        ...(importance !== undefined ? { importance } : {}),
      });
      process.stdout.write(`remembered ${memory.id}\n${describe(memory)}\n`);
      break;
    }

    case "learn": {
      const rule = rest.join(" ").trim();
      if (!rule) fail("pass the lesson as an argument");
      if (!values.when) fail("a lesson needs --when <condition> or it can never be recalled");
      const confidence = parseUnit(values.confidence, "confidence");
      const lesson = await learn(store, {
        rule,
        when: values.when,
        project: projectOf(values.project),
        tags,
        origin: "user",
        ...(confidence !== undefined ? { confidence } : {}),
      });
      process.stdout.write(`learned ${lesson.id}\n${describe(lesson)}\n`);
      break;
    }

    case "recall": {
      const query = rest.join(" ").trim();
      if (!query) fail("pass a query as an argument");
      const kind = parseKind(values.kind);
      const results = await store.recall({
        query,
        limit: parseCount(values.k, 8, "k"),
        project: projectOf(values.project),
        ...(kind ? { kinds: [kind] } : {}),
      });
      if (values.json) {
        process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
        break;
      }
      if (results.length === 0) {
        process.stdout.write("nothing recalled\n");
        break;
      }
      for (const { memory, score } of results) {
        process.stdout.write(`${score.toFixed(3)}  ${describe(memory)}\n`);
      }
      break;
    }

    case "brief": {
      const query = rest.join(" ").trim() || "current work in this project";
      process.stdout.write(
        `${await brief(store, {
          query,
          project: projectOf(values.project),
          budgetTokens: parseCount(values.budget, store.config.briefTokenBudget, "budget"),
        })}\n`,
      );
      break;
    }

    case "lessons": {
      const scope = values.project === undefined ? undefined : projectOf(values.project);
      const grouped = report(store, scope);
      if (values.json) {
        process.stdout.write(`${JSON.stringify(grouped, null, 2)}\n`);
        break;
      }
      const sections: [string, typeof grouped.trusted][] = [
        ["trusted", grouped.trusted],
        ["provisional", grouped.provisional],
        ["failing", grouped.failing],
      ];
      for (const [label, lessons] of sections) {
        if (lessons.length === 0) continue;
        process.stdout.write(`\n## ${label} (${lessons.length})\n`);
        for (const lesson of lessons) {
          process.stdout.write(
            `  [${lesson.confidence.toFixed(2)} ${lesson.wins}W/${lesson.losses}L] ${lesson.id}\n` +
              `      when ${lesson.appliesWhen ?? "—"}\n      ${firstLine(lesson.body, 120)}\n`,
          );
        }
      }
      if (activeLessons(store, scope).length === 0) {
        process.stdout.write("no lessons yet — teach one with `mal learn`\n");
      }
      break;
    }

    case "confirm": {
      const id = rest[0];
      if (!id) fail("pass a memory id");
      const updated = store.reinforce(id);
      if (!updated) fail(`no memory ${id}`);
      process.stdout.write(`confidence now ${updated.confidence.toFixed(3)} — ${updated.title}\n`);
      break;
    }

    case "refute": {
      const [id, ...reasonParts] = rest;
      if (!id) fail("pass a memory id");
      const reason = reasonParts.join(" ").trim() || "no reason given";
      const updated = store.refute(id, reason);
      if (!updated) fail(`no memory ${id}`);
      process.stdout.write(
        `confidence now ${updated.confidence.toFixed(3)} (${updated.status}) — ${updated.title}\n`,
      );
      break;
    }

    case "forget": {
      const [id, ...reasonParts] = rest;
      if (!id) fail("pass a memory id");
      if (!store.get(id)) fail(`no memory ${id}`);
      store.retire(id, reasonParts.join(" ").trim() || "retired by hand");
      process.stdout.write(`retired ${id}\n`);
      break;
    }

    case "show": {
      const id = rest[0];
      if (!id) fail("pass a memory id");
      const memory = store.get(id);
      if (!memory) fail(`no memory ${id}`);
      process.stdout.write(`${JSON.stringify(memory, null, 2)}\n`);
      break;
    }

    case "ingest": {
      const target = rest[0];
      if (!target) fail("pass a file path or url");
      const options = { project: projectOf(values.project), tags };
      const written = /^https?:\/\//i.test(target)
        ? await ingestUrl(store, target, options)
        : await ingestFile(store, target, options);
      process.stdout.write(`ingested ${written.length} chunks from ${target}\n`);
      break;
    }

    case "capture": {
      if (!values.transcript) fail("pass --transcript <path>");
      const digest = readTranscript(values.transcript);
      if (!digest) fail(`could not read transcript ${values.transcript}`);
      if (digest.turnCount < 2) {
        if (!values.quiet) process.stdout.write("session too short to learn from\n");
        break;
      }
      const result = await distill(store, digest, {
        project: projectOf(values.project),
        sessionRef: values.session ?? values.transcript,
      });
      if (!values.quiet) {
        process.stdout.write(
          `captured ${result.lessons.length} lessons, ${result.facts.length} facts` +
            `${result.usedModel ? " (model-distilled)" : " (heuristics only)"}\n`,
        );
      }
      break;
    }

    case "reflect": {
      const subject = rest.join(" ").trim();
      if (!subject) fail("say what you are reflecting on");
      const result = await reflect(store, {
        subject,
        tighten: values.tighten ?? null,
        escalate: values.escalate ?? null,
        project: projectOf(values.project),
      });
      process.stdout.write(`reflected ${result.record.id}\n`);
      if (result.proposal) process.stdout.write(`proposal  ${result.proposal.id}\n`);
      if (result.foundNothing) {
        process.stdout.write("no change worth the churn — recorded as such\n");
      }
      break;
    }

    case "proposals": {
      const open = openProposals(
        store,
        values.project === undefined ? undefined : projectOf(values.project),
      );
      if (values.json) {
        process.stdout.write(`${JSON.stringify(open, null, 2)}\n`);
        break;
      }
      if (open.length === 0) {
        process.stdout.write("no open proposals\n");
        break;
      }
      for (const proposal of open) {
        const scope = proposal.project ? `[${proposal.project}]` : "[global]";
        process.stdout.write(
          `${proposal.id}  ${scope}\n  ${proposal.body.split("\n")[0]}\n` +
            `  raised ${new Date(proposal.createdAt).toISOString().slice(0, 10)}\n\n`,
        );
      }
      process.stdout.write(
        `${open.length} awaiting a decision. Accept one with \`mal confirm <id>\`, ` +
          `drop it with \`mal forget <id> "<why>"\`.\n`,
      );
      break;
    }

    case "standard": {
      const claim = rest.join(" ").trim();
      if (!claim) fail("pass the standard itself as an argument");
      if (!values.for) fail("a standard needs --for <scope>, or nothing can ever match it");
      if (!values.source) fail("a standard needs --source <url|spec>; an unsourced standard is an opinion");
      const volatility = parseVolatility(values.volatility);
      const standard = await recordStandard(store, {
        claim,
        scope: values.for,
        source: values.source,
        project: projectOf(values.project),
        tags,
        trusted: values.trusted,
        ...(volatility ? { volatility } : {}),
      });
      process.stdout.write(
        `shelved ${standard.id}\n${describe(standard)}\n` +
          `  current until ${new Date(standard.staleAfter!).toISOString().slice(0, 10)}` +
          `${values.trusted ? "" : " · quarantined — `mal vouch <id>` before it may gate work"}\n`,
      );
      break;
    }

    case "standards": {
      if (values.stale) {
        const stale = staleStandards(store);
        if (stale.length === 0) {
          process.stdout.write("nothing expired\n");
          break;
        }
        for (const standard of stale) {
          process.stdout.write(
            `EXPIRED ${new Date(standard.staleAfter!).toISOString().slice(0, 10)}  ${standard.id}\n` +
              `  ${standard.appliesWhen ?? "—"}\n  ${firstLine(standard.body, 110)}\n`,
          );
        }
        process.stdout.write(`\n${stale.length} need re-verifying before they can be quoted.\n`);
        break;
      }

      const scope = rest.join(" ").trim();
      if (!scope) {
        const all = store.list({ kind: "standard", limit: 200 });
        if (all.length === 0) {
          process.stdout.write("the shelf is empty — add one with `mal standard`\n");
          break;
        }
        for (const standard of all) process.stdout.write(`${describeStandard(standard)}\n`);
        break;
      }

      const found = await lookupStandards(store, scope, { project: projectOf(values.project) });
      if (values.json) {
        process.stdout.write(`${JSON.stringify(found, null, 2)}\n`);
        break;
      }
      if (found.usable.length === 0 && found.unusable.length === 0) {
        process.stdout.write(
          `no standard for "${scope}" — nothing to measure the work against yet.\n`,
        );
        break;
      }
      for (const standard of found.usable) {
        process.stdout.write(`${describeStandard(standard)}\n`);
      }
      for (const { standard, reason } of found.unusable) {
        process.stdout.write(`${describeStandard(standard)}   << ${reason}, cannot gate work\n`);
      }
      break;
    }

    case "vouch": {
      const id = rest[0];
      if (!id) fail("pass a standard id");
      const standard = store.get(id);
      if (!standard) fail(`no memory ${id}`);
      if (standard.kind !== "standard") fail(`${id} is a ${standard.kind}, not a standard`);
      const vouched = trustStandard(store, id);
      process.stdout.write(`out of quarantine — ${vouched?.title}\n`);
      break;
    }

    case "sleep": {
      const result = await consolidate(store, { dryRun: values["dry-run"] });
      process.stdout.write(
        `${values["dry-run"] ? "would " : ""}fade ${result.decayed}, merge ${result.merged}, ` +
          `retire ${result.retired}, promote ${result.promoted}\n`,
      );
      for (const note of result.notes) process.stdout.write(`  ${note}\n`);
      break;
    }

    case "stats": {
      const stats = store.stats();
      if (values.json) {
        process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
        break;
      }
      process.stdout.write(statsSummary(store));
      break;
    }

    case "log": {
      const events = store.recentEvents(parseCount(values.n, 20, "n"), values.kind);
      for (const event of events.reverse()) {
        process.stdout.write(
          `${new Date(event.ts).toISOString()}  ${event.kind.padEnd(20)} ${event.summary}\n`,
        );
      }
      break;
    }

    case "console": {
      await startConsole(store);
      break;
    }

    default:
      fail(`unknown command "${command}" — run \`mal --help\``);
  }
}

/**
 * One process, one open store, a prompt that keeps taking commands until you
 * leave. Exists because the one-shot CLI reopens brain.db for every single
 * call, which is fine for a hook and wasteful for a person sitting there
 * typing several commands in a row.
 */
async function startConsole(store: MemoryStore): Promise<void> {
  process.stdout.write(
    `malachii console\n${statsSummary(store)}\n` +
      `same commands as \`mal <command>\`, no leading "mal". \`help\` for the list, \`exit\` to leave.\n\n`,
  );

  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "mal> ", historySize: 200 });
  let closed = false;

  // Piped or pasted input can deliver several "line" events before the first
  // one's async work (embedding, recall) finishes. Without this queue those
  // handlers race and interleave their output. Chaining onto one promise
  // keeps commands executing in the order they were typed, always.
  let queue: Promise<void> = Promise.resolve();

  await new Promise<void>((resolveConsole) => {
    rl.prompt();
    rl.on("SIGINT", () => rl.close());
    rl.on("close", () => {
      closed = true;
      process.stdout.write("bye\n");
      resolveConsole();
    });
    rl.on("line", (line) => {
      queue = queue.then(async () => {
        const trimmed = line.trim();
        if (trimmed === "exit" || trimmed === "quit" || trimmed === "q") {
          rl.close();
          return;
        }
        if (trimmed === "help" || trimmed === "?") {
          process.stdout.write(HELP + CONSOLE_HELP);
        } else if (trimmed === "clear" || trimmed === "cls") {
          process.stdout.write("\x1Bc");
        } else if (trimmed === "console") {
          process.stdout.write("already in the console\n");
        } else if (trimmed) {
          try {
            await dispatch(store, parseCommand(tokenize(trimmed)));
          } catch (error) {
            process.stderr.write(`mal: ${error instanceof Error ? error.message : String(error)}\n`);
          }
        }
        if (!closed) rl.prompt();
      });
    });
  });
}

async function main(): Promise<void> {
  const store = MemoryStore.open();
  try {
    await dispatch(store, parseCommand(process.argv.slice(2)));
  } finally {
    store.close();
  }
}

// Only run as the entry point — importing this module (e.g. the test suite
// pulling in `tokenize`) must not also open the real brain.db as a side effect.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`mal: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
