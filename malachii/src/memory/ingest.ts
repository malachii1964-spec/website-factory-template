import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Memory } from "../core/types.ts";
import type { MemoryStore } from "./store.ts";

/**
 * Learning from material rather than from conversation.
 *
 * Ingested text lands as `source` memories: retrievable, citable, and lower
 * trust than anything Malachi said directly. Provenance travels with every
 * chunk so a recalled claim can always be traced back to where it came from.
 */

export interface ChunkOptions {
  maxChars?: number;
  overlapChars?: number;
}

/**
 * Split on paragraph boundaries, packing up to `maxChars`, with a tail overlap
 * so a fact that straddles a boundary survives in at least one chunk intact.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? 1400;
  const overlap = options.overlapChars ?? 150;
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const flush = (): void => {
    if (!current.trim()) return;
    chunks.push(current.trim());
    current = overlap > 0 ? current.slice(-overlap) : "";
  };

  for (const paragraph of paragraphs) {
    // A single oversized paragraph is cut on sentence boundaries, not mid-word.
    if (paragraph.length > maxChars) {
      flush();
      for (const sentence of paragraph.match(/[^.!?]+[.!?]*\s*/g) ?? [paragraph]) {
        if (current.length + sentence.length > maxChars) flush();
        current += sentence;
      }
      continue;
    }
    if (current.length + paragraph.length + 2 > maxChars) flush();
    current += (current ? "\n\n" : "") + paragraph;
  }
  flush();
  return chunks.filter((c) => c.length > 40);
}

/** Good-enough HTML stripping. Not a parser — a way to get readable text out of a page. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, " ")
    // Stripped tags leave stray padding around the breaks they created.
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** First heading or sentence in a chunk, used as its title. */
function titleFor(chunk: string, fallback: string, index: number): string {
  const heading = chunk.match(/^#{1,6}\s+(.{3,90})$/m)?.[1];
  if (heading) return heading.trim();
  const sentence = chunk.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  if (sentence.length >= 12 && sentence.length <= 110) return sentence;
  return `${fallback} — part ${index + 1}`;
}

export interface IngestOptions {
  project?: string | null;
  tags?: string[];
  maxChunks?: number;
  importance?: number;
}

async function ingestText(
  store: MemoryStore,
  text: string,
  ref: string,
  label: string,
  origin: "file" | "web",
  options: IngestOptions,
): Promise<Memory[]> {
  const chunks = chunkText(text).slice(0, options.maxChunks ?? 200);
  const written: Memory[] = [];
  for (const [index, chunk] of chunks.entries()) {
    written.push(
      await store.remember({
        kind: "source",
        title: titleFor(chunk, label, index),
        body: chunk,
        project: options.project ?? null,
        origin,
        originRef: ref,
        tags: [...(options.tags ?? []), origin],
        ...(options.importance !== undefined ? { importance: options.importance } : {}),
      }),
    );
  }
  store.logEvent({
    kind: "brain.ingested",
    project: options.project ?? null,
    summary: `Ingested ${written.length} chunks from ${label}`,
    payload: { ref, origin, chunks: written.length },
  });
  return written;
}

export async function ingestFile(
  store: MemoryStore,
  path: string,
  options: IngestOptions = {},
): Promise<Memory[]> {
  const raw = readFileSync(path, "utf8");
  const text = /\.html?$/i.test(path) ? htmlToText(raw) : raw;
  return ingestText(store, text, path, basename(path), "file", options);
}

export async function ingestUrl(
  store: MemoryStore,
  url: string,
  options: IngestOptions = {},
): Promise<Memory[]> {
  const response = await fetch(url, {
    headers: { "user-agent": "malachii/3.0 (personal knowledge agent)" },
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  const text = contentType.includes("html") ? htmlToText(raw) : raw;
  return ingestText(store, text, url, new URL(url).hostname, "web", options);
}
