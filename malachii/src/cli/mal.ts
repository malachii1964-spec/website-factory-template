#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
// node:sqlite is flagged experimental and warns on import. The warning is noise
// in every hook and every shell, and the API it warns about is one we pin.
import { parseArgs } from "node:util";
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

/**
 * `mal` — the brain's command surface.
 *
 * Every capability the hooks, the console, and Malachi himself use goes
 * through here, so there is exactly one way to write to memory and one way to
 * read from it.
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
  mal sleep                      Consolidate: fade, merge, retire, promote  [--dry-run]
  mal stats                      What it knows
  mal log                        Recent life log      [--n --kind]

Storage: ${loadConfig().dbPath}
`;

const KindSchema = z.enum(MEMORY_KINDS);
const UnitSchema = z.coerce.number().min(0).max(1);
const CountSchema = z.coerce.number().int().min(1).max(1000);

function fail(message: string): never {
  process.stderr.write(`mal: ${message}\n`);
  process.exit(1);
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

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
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
      json: { type: "boolean", default: false },
      pin: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  const [command, ...rest] = positionals;
  if (!command || values.help) {
    process.stdout.write(HELP);
    return;
  }

  const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const store = MemoryStore.open();

  try {
    switch (command) {
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
        process.stdout.write(
          `memories      ${stats.total}\n` +
            Object.entries(stats.byKind)
              .map(([kind, n]) => `  ${kind.padEnd(12)}${n}\n`)
              .join("") +
            `lessons       ${stats.lessons.active} active, ${stats.lessons.retired} retired, ` +
            `mean confidence ${stats.lessons.meanConfidence.toFixed(2)}\n` +
            `embedded      ${stats.embedded} (${store.embedder.id})\n` +
            `life log      ${stats.events} events\n` +
            `first memory  ${stats.oldest ? new Date(stats.oldest).toISOString() : "—"}\n`,
        );
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

      default:
        fail(`unknown command "${command}" — run \`mal --help\``);
    }
  } finally {
    store.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`mal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
