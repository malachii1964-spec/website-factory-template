/**
 * Importing what other assistants remember about Malachi.
 *
 * Four assistants have been accumulating observations of him for months. That
 * is real evidence and the brain starts cold without it. But it arrives with
 * three problems that this module exists to handle:
 *
 * 1. **It is second-hand.** A model saying "he prefers X" is not Malachi saying
 *    it. So nothing here is written as `identity` (the kind that never decays)
 *    and nothing arrives at the confidence a first-hand statement earns. It
 *    lands as `semantic`: it fades, and his own answer supersedes it.
 * 2. **It is sensitive.** These exports surface legal matters, recovery history,
 *    custody, health, and minors' names. `brain.db` is plaintext on disk and
 *    recall injects memories into unrelated prompts. Sensitive lines are held
 *    back by default and reported for a human decision rather than stored.
 * 3. **Models disagree, confidently.** Three exports gave three different
 *    answers for his name, one of them ("Big Daddy") plainly bled in from a
 *    roleplay context and marked OBSERVED. Identity is never written from these
 *    at all — slot lines are collected and shown, and he answers them himself.
 */

import type { MemoryKind } from "../core/types.ts";

export type Provenance = "OBSERVED" | "INFERRED";

export interface ExportLine {
  type: string;
  field: string;
  provenance: Provenance;
  statement: string;
  basis: string;
  /** Which assistant produced it. Drives trust, so it is never optional. */
  source: string;
  /** Set when the model tagged the line as coming from public activity. */
  publicSource: boolean;
}

export interface SensitiveHit {
  line: ExportLine;
  /** Which rule caught it, so the report can explain itself. */
  matched: string;
}

export interface ParsedExport {
  /** Storable, non-sensitive, non-slot lines. */
  storable: ExportLine[];
  /** Identity-slot claims — reported for his answer, never written. */
  slots: ExportLine[];
  /** Held back as sensitive, with the rule that caught each. */
  sensitive: SensitiveHit[];
  /** Lines that did not parse, kept verbatim so nothing vanishes silently. */
  unparsed: string[];
}

/**
 * Fields whose subject matter should not sit unencrypted on disk.
 *
 * Deliberately broad. A false positive costs one manual decision; a false
 * negative writes a CPS matter into a file that gets read aloud into unrelated
 * prompts months later.
 */
const SENSITIVE_FIELDS = new Set([
  "legal", "legal_context", "custody", "probation", "criminal", "court",
  "recovery", "addiction", "addiction_history", "sobriety", "substance",
  "health", "adhd", "medical", "diagnosis", "disability",
  "family", "family_loss", "children", "kids", "partner", "relationship",
  "location", "address", "housing", "tenancy",
  "income", "finance", "financial", "benefits", "insurance", "debt",
  "plant_count", "grow_setup", "cultivation", "grow",
  "content", "nsfw", "sexual",
  "age", "birth", "dob",
]);

/**
 * Content that makes a line sensitive whatever its field is called.
 *
 * Models choose their own field tags, so the field set alone is not enough —
 * a legal matter filed under `PATTERN | crisis_vs_attention` still needs
 * catching.
 */
const SENSITIVE_TERMS: [RegExp, string][] = [
  [/\bcps\b|child protective|\bfounded\b report/i, "child-protective matter"],
  [/custody|family court|visitation/i, "custody"],
  [/probation|parole|convicted|criminal charge|dismissed charge|arrest/i, "criminal-legal"],
  [/sober|sobriety|heroin|\biv\b drug|addict|relapse|treatment facilit|recovery date/i, "recovery history"],
  [/\badhd\b|diagnos|prescri|mental health/i, "health"],
  [/died|death|passed away|stillborn/i, "bereavement"],
  [/\bssn\b|social security|bank account|routing number/i, "financial identifier"],
  [/nsfw|erotic|porn|sexual|hotwife|gangbang/i, "sexual content"],
  [/plant count|\d+\s*plants|caregiver structure|unlicensed|not official/i, "cannabis legal exposure"],
  [/lives? in|resides? in|\bapartment\b|county|street address/i, "location"],
];

/** Names of minors and partners appear inside otherwise innocuous statements. */
const SENSITIVE_CONTEXT = /\b(my (son|sons|daughter|kids|boys|partner|fianc))/i;

export function classifySensitivity(line: ExportLine): string | null {
  const field = line.field.toLowerCase().replace(/[^a-z_]/g, "");
  if (SENSITIVE_FIELDS.has(field)) return `field "${line.field}"`;

  const haystack = `${line.statement} ${line.basis}`;
  for (const [pattern, label] of SENSITIVE_TERMS) {
    if (pattern.test(haystack)) return label;
  }
  if (SENSITIVE_CONTEXT.test(haystack)) return "family detail";
  return null;
}

/**
 * Second-hand claims never reach the confidence of something he said himself.
 *
 * A first-hand statement enters around 0.90. These sit well below it on
 * purpose: they are leads that should lose to his own answer without a fight,
 * and INFERRED lines are a model's reasoning rather than its records.
 */
export function confidenceFor(provenance: Provenance, publicSource: boolean): number {
  const base = provenance === "OBSERVED" ? 0.55 : 0.35;
  return publicSource ? base - 0.1 : base;
}

/**
 * Everything second-hand is `semantic` — it decays and can be superseded.
 *
 * Notably NOT `identity`, even for PREFERENCE and BOUNDARY lines that look like
 * identity. Identity never decays, and a permanent undecaying record of what
 * some model thought he preferred is exactly the wrong shape for a claim he
 * has not confirmed.
 */
export function kindFor(_line: ExportLine): MemoryKind {
  return "semantic";
}

const SLOT_FIELDS = new Set(["name", "work", "style", "purpose", "boundaries", "values"]);

/** Strip the decorations models added around the contract we asked for. */
function cleanStatement(raw: string): { statement: string; publicSource: boolean } {
  let statement = raw.trim();
  let publicSource = false;

  if (/source\s*=\s*x\b/i.test(statement)) {
    publicSource = true;
    statement = statement.replace(/source\s*=\s*x\b/i, "").trim();
  }
  // ChatGPT prefixed every line with its pass label.
  statement = statement.replace(/^\[(SAVED|HISTORY)\]\s*/i, "").trim();
  return { statement, publicSource };
}

export function parseExportLine(raw: string, source: string): ExportLine | null {
  const parts = raw.split("|").map((part) => part.trim());
  if (parts.length < 4) return null;

  const [type, field, provenanceRaw, ...rest] = parts;
  if (type === undefined || field === undefined || provenanceRaw === undefined) return null;
  const provenance = provenanceRaw.toUpperCase();
  if (provenance !== "OBSERVED" && provenance !== "INFERRED") return null;
  if (!/^[A-Z_]+$/.test(type)) return null;

  const statementRaw = rest[0] ?? "";
  const basis = rest.slice(1).join(" | ").trim();
  if (!statementRaw.trim()) return null;

  const { statement, publicSource } = cleanStatement(statementRaw);
  return {
    type: type.toUpperCase(),
    field,
    provenance: provenance as Provenance,
    statement,
    basis,
    source,
    publicSource,
  };
}

export function parseExport(text: string, source: string): ParsedExport {
  const result: ParsedExport = { storable: [], slots: [], sensitive: [], unparsed: [] };

  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Section headers and prose the models wrapped around the contract.
    if (!trimmed.includes("|")) continue;

    const line = parseExportLine(trimmed, source);
    if (!line) {
      if (/\|/.test(trimmed) && trimmed.length > 20) result.unparsed.push(trimmed);
      continue;
    }

    if (line.type === "SLOT" || SLOT_FIELDS.has(line.field.toLowerCase())) {
      result.slots.push(line);
      continue;
    }

    const matched = classifySensitivity(line);
    if (matched) {
      result.sensitive.push({ line, matched });
      continue;
    }
    result.storable.push(line);
  }

  return result;
}

/** Where models disagree about the same slot, he decides — not a scorer. */
export interface SlotConflict {
  slot: string;
  claims: { source: string; statement: string; provenance: Provenance }[];
}

export function slotConflicts(slots: ExportLine[]): SlotConflict[] {
  const bySlot = new Map<string, ExportLine[]>();
  for (const line of slots) {
    const key = line.field.toLowerCase();
    const list = bySlot.get(key) ?? [];
    list.push(line);
    bySlot.set(key, list);
  }

  const conflicts: SlotConflict[] = [];
  for (const [slot, lines] of bySlot) {
    const distinct = new Set(lines.map((line) => line.statement.toLowerCase()));
    if (lines.length > 1 && distinct.size > 1) {
      conflicts.push({
        slot,
        claims: lines.map((line) => ({
          source: line.source,
          statement: line.statement,
          provenance: line.provenance,
        })),
      });
    }
  }
  return conflicts;
}

export function titleFor(line: ExportLine): string {
  const label = `${line.type.toLowerCase()}:${line.field}`;
  return `${label} (via ${line.source})`;
}

export function bodyFor(line: ExportLine): string {
  const parts = [line.statement];
  if (line.basis) parts.push(`Basis: ${line.basis}`);
  parts.push(
    `Second-hand: ${line.source} reported this as ${line.provenance}${
      line.publicSource ? ", from public activity rather than conversation" : ""
    }. Not confirmed by Malachi.`,
  );
  return parts.join("\n");
}
