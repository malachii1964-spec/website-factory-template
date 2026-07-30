import type { MemoryStore } from "../memory/store.ts";
import type { Memory } from "../core/types.ts";

/**
 * What the brain knows about the person it works for.
 *
 * Identity memories are the ones that make recall recognisably *his* rather than
 * merely topical — they are pinned, never decay, and are always in the candidate
 * pool. That is also why they are the one kind that must never be guessed. A
 * wrong fact about a project can be refuted by the next build; a wrong fact
 * about Malachi shapes every answer for as long as it sits there.
 *
 * So identity is only ever written from something he said outright. Nothing here
 * infers, and nothing here is filled in by a model.
 *
 * ## Why slots instead of an interview
 *
 * The interview was offered and declined — not because the questions were wrong,
 * but because answering six questions in a row is a chore, and a chore gets put
 * off indefinitely. A slot can be filled in a single line, in any order, months
 * apart, and the brain can say precisely what it still does not know. Partial
 * knowledge that accumulates beats complete knowledge that never gets entered.
 */

export interface IdentitySlot {
  id: string;
  /** What is being asked, in plain language. */
  question: string;
  /** Why the brain wants it — shown so answering never feels like filling in a form. */
  because: string;
}

export const IDENTITY_SLOTS: IdentitySlot[] = [
  {
    id: "name",
    question: "What should I call you?",
    because: "so I address you the way you actually want to be addressed",
  },
  {
    id: "work",
    question: "What do you spend your days on — work, main projects, what you're building toward?",
    because: "so I can tell which requests are central and which are side quests",
  },
  {
    id: "style",
    question: "How do you want me to talk to you?",
    because: "so tone is a setting rather than something I re-guess every session",
  },
  {
    id: "purpose",
    question: "What is Malachii for — code only, or everything?",
    because: "so I know whether to stay in my lane or carry the whole load",
  },
  {
    id: "boundaries",
    question: "What should I never do, or never store, even if asked in the moment?",
    because: "so a limit holds when it is inconvenient, which is the only time it matters",
  },
  {
    id: "values",
    question: "What matters to you — the things that should shape how I work, not just what I build?",
    because: "so judgement calls go the way you would make them",
  },
];

const SLOT_TAG = "identity-slot";

export function slotById(id: string): IdentitySlot | undefined {
  return IDENTITY_SLOTS.find((slot) => slot.id === id);
}

/**
 * Record an answer.
 *
 * Answering again replaces rather than accumulates: people change their minds,
 * and two contradictory identity memories both in the pool is worse than either
 * one alone. The old answer is superseded, not deleted, so what the brain used
 * to believe about him stays readable.
 */
export async function recordIdentity(
  store: MemoryStore,
  slotId: string,
  answer: string,
): Promise<Memory> {
  const slot = slotById(slotId);
  if (!slot) throw new Error(`no identity slot "${slotId}"`);

  const input = {
    kind: "identity" as const,
    title: slot.question,
    body: answer.trim(),
    appliesWhen: null,
    tags: [SLOT_TAG, slot.id],
    project: null,
    // Identity is only ever written from something he said outright, so the
    // origin is always `user` — there is no path here for an inference.
    origin: "user" as const,
    pinned: true,
  };

  const existing = filled(store).find((memory) => memory.tags.includes(slot.id));
  if (existing) {
    if (existing.body.trim() === answer.trim()) return existing;
    return store.supersede(existing.id, input, `he answered "${slot.id}" differently`);
  }
  return store.remember(input);
}

/** Answers on record, newest first. */
export function filled(store: MemoryStore): Memory[] {
  return store
    .list({ kind: "identity", project: null, limit: 200 })
    .filter((memory) => memory.tags.includes(SLOT_TAG));
}

/** Slots with nothing in them — what the brain can honestly say it does not know. */
export function unfilled(store: MemoryStore): IdentitySlot[] {
  const answered = new Set(filled(store).flatMap((memory) => memory.tags));
  return IDENTITY_SLOTS.filter((slot) => !answered.has(slot.id));
}

export interface IdentityStatus {
  answers: { slot: IdentitySlot; answer: string; id: string }[];
  missing: IdentitySlot[];
}

export function identityStatus(store: MemoryStore): IdentityStatus {
  const answers: IdentityStatus["answers"] = [];
  for (const memory of filled(store)) {
    const slot = IDENTITY_SLOTS.find((candidate) => memory.tags.includes(candidate.id));
    if (slot) answers.push({ slot, answer: memory.body, id: memory.id });
  }
  answers.sort(
    (a, b) =>
      IDENTITY_SLOTS.findIndex((s) => s.id === a.slot.id) -
      IDENTITY_SLOTS.findIndex((s) => s.id === b.slot.id),
  );
  return { answers, missing: unfilled(store) };
}
