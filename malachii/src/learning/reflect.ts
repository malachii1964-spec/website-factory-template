import type { Memory } from "../core/types.ts";
import type { MemoryStore } from "../memory/store.ts";

/**
 * The reflex — the two-pass review that runs after substantive work.
 *
 * Pass 1 tightens what exists; pass 2 asks whether it should exist in that
 * shape. They are recorded rather than merely performed, for two reasons: an
 * unrecorded reflection cannot be audited, and a 10x idea that lives only in a
 * finished session is an idea that evaporates.
 *
 * "Nothing worth changing" is a first-class outcome here. A reflex that always
 * produces findings is the same defect as a distiller that learns every
 * sentence containing the word "always" — output with no quality filter.
 */

export interface ReflexInput {
  /** What was built or done. */
  subject: string;
  /** Pass 1 — what was actually changed as a result. Omit if nothing was. */
  tighten?: string | null;
  /** Pass 2 — the larger reframing. Proposed, never built unprompted. */
  escalate?: string | null;
  project?: string | null;
}

export interface ReflexResult {
  record: Memory;
  /** Present only when pass 2 surfaced something worth deciding on. */
  proposal: Memory | null;
  /** True when the reflex ran honestly and found nothing worth the churn. */
  foundNothing: boolean;
}

export async function reflect(store: MemoryStore, input: ReflexInput): Promise<ReflexResult> {
  const project = input.project ?? null;
  const tighten = input.tighten?.trim() || null;
  const escalate = input.escalate?.trim() || null;

  const record = await store.remember({
    kind: "episodic",
    title: `Reflex: ${truncate(input.subject, 70)}`,
    body: [
      `Reflected on: ${input.subject}`,
      `Tightened: ${tighten ?? "nothing worth the churn"}`,
      `Escalated: ${escalate ?? "no larger reframing surfaced"}`,
    ].join("\n"),
    project,
    origin: "self",
    tags: tighten || escalate ? ["reflex"] : ["reflex", "no-change"],
  });

  let proposal: Memory | null = null;
  if (escalate) {
    proposal = await store.remember({
      kind: "semantic",
      title: `Proposal: ${truncate(escalate, 70)}`,
      body: `${escalate}\n\n(Raised while reflecting on: ${input.subject})`,
      project,
      origin: "self",
      tags: ["proposal", "10x", "awaiting-decision"],
      importance: 0.7,
      // It is an idea, not a finding. It has to survive a decision to gain trust.
      confidence: 0.4,
    });
    store.link(proposal.id, record.id, "raised-during");
  }

  store.logEvent({
    kind: "task.reflected",
    project,
    summary: `Reflex on: ${input.subject}`,
    payload: { tightened: tighten, escalated: escalate },
  });

  return { record, proposal, foundNothing: !tighten && !escalate };
}

/** Proposals from pass 2 that are still waiting on Malachi. */
export function openProposals(store: MemoryStore, project?: string | null): Memory[] {
  return store
    .list({ kind: "semantic", limit: 500 })
    .filter((m) => m.tags.includes("awaiting-decision"))
    .filter((m) => project === undefined || m.project === project || m.project === null);
}

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
