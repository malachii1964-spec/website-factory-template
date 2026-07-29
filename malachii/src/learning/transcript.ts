import { readFileSync } from "node:fs";

/**
 * Reading a session back.
 *
 * Claude Code writes each session to a JSONL transcript. The shape is not a
 * stable contract, so every field here is treated as optional and anything
 * unrecognised is skipped rather than throwing — a distiller that crashes on
 * an unfamiliar line is a distiller that stops learning.
 *
 * The hard part is not parsing, it is *restraint*. An extractor that captures
 * everything matching a keyword fills memory with noise, and noise compounds:
 * it gets recalled, eats context, and eventually misleads. Everything below is
 * built to throw away more than it keeps.
 */

export interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ToolFailure {
  tool: string;
  detail: string;
}

export interface SessionDigest {
  turns: TranscriptTurn[];
  failures: ToolFailure[];
  /** Individual sentences that read as a correction — not the whole turn. */
  corrections: string[];
  /** Individual sentences stating a durable rule — not the whole turn. */
  directives: string[];
  turnCount: number;
}

const CORRECTION_MARKERS = [
  /\bthat'?s (not|wrong|incorrect)\b/i,
  /\bdon'?t\b/i,
  /\bstop\b/i,
  /\bactually\b/i,
  /\binstead\b/i,
  /\byou (broke|missed|forgot|misunderstood)\b/i,
  /\bwrong\b/i,
  /\bnot what i (asked|meant|wanted)\b/i,
];

const DIRECTIVE_MARKERS = [
  /\balways\b/i,
  /\bnever\b/i,
  /\bfrom now on\b/i,
  /\bremember (that|to)\b/i,
  /\bgoing forward\b/i,
  /\bmake sure (you|to)\b/i,
  /\bevery time\b/i,
];

/**
 * Sentences that describe *this task* rather than a standing rule. Without
 * this, "I want to build X, and it should always be fast" is stored as the
 * rule "I want to build X…" — the exact defect that put a 1,200-character
 * prompt into memory at 0.80 confidence.
 */
const TASK_REQUEST = [
  /^(?:i|we)\s+(?:want|need|would like)\s+(?:to|you to)?\s*(?:build|make|create|add|do|start|get)\b/i,
  /^(?:let'?s|lets)\b/i,
  /^(?:can|could|would)\s+you\b/i,
  /^please\s+(?:build|make|create|add|write|do)\b/i,
  /^(?:so|and|but|then)\b.*\bi want\b/i,
];

/**
 * Failures that say something about the harness rather than about the work.
 * A tool-protocol error or a declined permission prompt is not a lesson; it is
 * an artifact of how the session was driven, and storing it teaches nothing.
 */
const HARNESS_NOISE = [
  /tool_use_error/i,
  /has not been read yet/i,
  /tool use was rejected/i,
  /(?:doesn'?t|does not) want to proceed/i,
  /requested changes to the tool input/i,
  /interrupted by (?:the )?user/i,
  /operation was (?:aborted|cancell?ed)/i,
  /user (?:denied|declined)/i,
  /permission (?:denied|required)/i,
];

/**
 * A pasted document is not Malachi speaking.
 *
 * When he pastes an article, another model's answer, or a spec, its sentences
 * match the same keyword markers his own instructions do — and the brain ends
 * up storing someone else's architecture opinions, and even a web page's error
 * string, as *his* standing directives. Observed live, three times.
 *
 * The asymmetry decides the threshold: missing a real instruction costs
 * nothing, because he can always state it again or run `mal learn`. Inventing
 * one puts words in his mouth and then recalls them as his. So this errs
 * heavily toward skipping.
 */
const MARKUP_LINE = /^\s*(?:[*\-•|>]|#{1,6}\s|\d+\.\s)/;

function looksQuoted(text: string): boolean {
  const markupLines = text.split("\n").filter((line) => MARKUP_LINE.test(line)).length;
  const urls = (text.match(/https?:\/\//g) ?? []).length;
  return markupLines >= 4 || urls >= 2 || text.includes("```");
}

/**
 * A bullet's marker governs its whole line, but sentence splitting throws that
 * marker away after the first full stop — so "* Some Heading: do a thing. Never
 * do the other thing." leaks its second half through as a rule. Structured
 * lines are therefore dropped whole, before any sentence splitting happens.
 */
function speechOnly(text: string): string {
  return text
    .split("\n")
    .filter((line) => !MARKUP_LINE.test(line))
    .join("\n");
}

/** A durable rule is short, declarative, and reads like an instruction. */
function looksLikeRule(sentence: string): boolean {
  const words = sentence.split(/\s+/).length;
  if (sentence.length < 12 || sentence.length > 240) return false;
  if (words < 4 || words > 40) return false;
  if (sentence.endsWith("?")) return false; // a question is not a rule
  // Markup and links are the fingerprints of quoted material, not speech.
  if (/https?:\/\//.test(sentence) || sentence.includes("```")) return false;
  if (/^\s*(?:[*\-•#]|\d+\.)\s/.test(sentence)) return false;
  return !TASK_REQUEST.some((re) => re.test(sentence));
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const record = block as Record<string, unknown>;
    if (record["type"] === "text" && typeof record["text"] === "string") {
      parts.push(record["text"]);
    }
  }
  return parts.join("\n");
}

/** Collect `tool_use` ids so a later `tool_result` can name the tool that failed. */
function collectToolNames(content: unknown, into: Map<string, string>): void {
  if (!Array.isArray(content)) return;
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const record = block as Record<string, unknown>;
    if (record["type"] !== "tool_use") continue;
    const id = record["id"];
    const name = record["name"];
    if (typeof id === "string" && typeof name === "string") into.set(id, name);
  }
}

function extractFailures(content: unknown, toolNames: Map<string, string>): ToolFailure[] {
  if (!Array.isArray(content)) return [];
  const failures: ToolFailure[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const record = block as Record<string, unknown>;
    if (record["type"] !== "tool_result" || record["is_error"] !== true) continue;

    const detail = (extractText(record["content"]) || String(record["content"] ?? "")).trim();
    if (!detail || HARNESS_NOISE.some((re) => re.test(detail))) continue;

    const useId = record["tool_use_id"];
    const resolved = typeof useId === "string" ? toolNames.get(useId) : undefined;
    failures.push({
      // Never invent a tool name — an unresolved one is reported as unknown.
      tool: resolved ?? (typeof record["name"] === "string" ? record["name"] : "unknown tool"),
      detail: detail.slice(0, 500),
    });
  }
  return failures;
}

export function parseTranscript(jsonl: string): SessionDigest {
  const digest: SessionDigest = {
    turns: [],
    failures: [],
    corrections: [],
    directives: [],
    turnCount: 0,
  };
  const toolNames = new Map<string, string>();

  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed !== "object" || parsed === null) continue;
      entry = parsed as Record<string, unknown>;
    } catch {
      continue;
    }

    const message = entry["message"];
    if (typeof message !== "object" || message === null) continue;
    const record = message as Record<string, unknown>;
    const role = record["role"];
    if (role !== "user" && role !== "assistant") continue;

    digest.turnCount++;
    if (role === "assistant") collectToolNames(record["content"], toolNames);
    digest.failures.push(...extractFailures(record["content"], toolNames));

    const text = extractText(record["content"]).trim();
    if (!text) continue;
    digest.turns.push({ role, text });
    if (role !== "user") continue;

    // Tool results and injected reminders are replayed as user turns; they are
    // not the human speaking, and must never be mined for instructions.
    if (text.startsWith("<") || HARNESS_NOISE.some((re) => re.test(text))) continue;
    // Quoted material carries someone else's instructions, not his.
    if (looksQuoted(text)) continue;

    // Sentence-level, not turn-level: capture the rule, not the paragraph
    // that happens to contain it.
    for (const sentence of splitSentences(speechOnly(text))) {
      if (!looksLikeRule(sentence)) continue;
      if (DIRECTIVE_MARKERS.some((re) => re.test(sentence))) digest.directives.push(sentence);
      else if (CORRECTION_MARKERS.some((re) => re.test(sentence))) digest.corrections.push(sentence);
    }
  }

  return digest;
}

export function readTranscript(path: string): SessionDigest | null {
  try {
    return parseTranscript(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** A compact, token-bounded rendering of a session for the distiller to read. */
export function digestToPrompt(digest: SessionDigest, maxChars = 24_000): string {
  const sections: string[] = [];
  if (digest.directives.length) {
    sections.push(`## Explicit instructions from Malachi\n${digest.directives.map((d) => `- ${d}`).join("\n")}`);
  }
  if (digest.corrections.length) {
    sections.push(`## Corrections he made\n${digest.corrections.map((c) => `- ${c}`).join("\n")}`);
  }
  if (digest.failures.length) {
    sections.push(
      `## Tool failures\n${digest.failures.slice(0, 25).map((f) => `- ${f.tool}: ${f.detail.slice(0, 200)}`).join("\n")}`,
    );
  }
  // The tail of a session holds the outcome; the head holds the intent.
  const head = digest.turns.slice(0, 4);
  const tail = digest.turns.slice(-12);
  const shown = [...head, ...tail.filter((t) => !head.includes(t))];
  sections.push(
    `## Conversation (start and end)\n${shown
      .map((t) => `**${t.role}**: ${t.text.slice(0, 1200)}`)
      .join("\n\n")}`,
  );

  const joined = sections.join("\n\n");
  return joined.length > maxChars ? `${joined.slice(0, maxChars)}\n…[truncated]` : joined;
}
