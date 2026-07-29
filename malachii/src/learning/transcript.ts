import { readFileSync } from "node:fs";

/**
 * Reading a session back.
 *
 * Claude Code writes each session to a JSONL transcript. The shape is not a
 * stable contract, so every field here is treated as optional and anything
 * unrecognised is skipped rather than throwing — a distiller that crashes on
 * an unfamiliar line is a distiller that stops learning.
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
  /** User turns that read as a correction of something the assistant just did. */
  corrections: string[];
  /** Statements the user explicitly framed as durable ("always", "never", "remember"). */
  directives: string[];
  turnCount: number;
}

const CORRECTION_MARKERS = [
  /\bno[,.\s]/i,
  /\bthat's (not|wrong|incorrect)\b/i,
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

function extractFailures(content: unknown): ToolFailure[] {
  if (!Array.isArray(content)) return [];
  const failures: ToolFailure[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const record = block as Record<string, unknown>;
    if (record["type"] !== "tool_result" || record["is_error"] !== true) continue;
    const detail = extractText(record["content"]) || String(record["content"] ?? "");
    failures.push({
      tool: typeof record["name"] === "string" ? record["name"] : "tool",
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
    digest.failures.push(...extractFailures(record["content"]));

    const text = extractText(record["content"]).trim();
    if (!text) continue;
    digest.turns.push({ role, text });

    if (role === "user") {
      // Tool results are replayed as user turns; they are not the human speaking.
      if (text.startsWith("<") || text.length > 4000) continue;
      if (CORRECTION_MARKERS.some((re) => re.test(text))) digest.corrections.push(text);
      if (DIRECTIVE_MARKERS.some((re) => re.test(text))) digest.directives.push(text);
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
