import type { Memory } from "../core/types.ts";
import type { MemoryStore } from "../memory/store.ts";

/**
 * Lessons are the part of the brain that actually improves.
 *
 * A lesson is a procedural memory: a rule plus the condition that triggers it.
 * It enters with modest confidence, then moves only on evidence — never on
 * repetition or assertion. That is the whole mechanism behind "learns from its
 * own mistakes": being wrong is cheap to record and expensive to keep.
 */

export interface LessonInput {
  /** What to do. Written as an instruction to a future self. */
  rule: string;
  /** When it applies. Recall matches against this as much as the rule. */
  when: string;
  project?: string | null;
  tags?: string[];
  /** Where the lesson came from — sets its starting confidence. */
  origin?: "user" | "self" | "session" | "web" | "file";
  originRef?: string | null;
  confidence?: number;
}

export async function learn(store: MemoryStore, input: LessonInput): Promise<Memory> {
  const title = input.rule.length > 90 ? `${input.rule.slice(0, 89)}…` : input.rule;
  const lesson = await store.remember({
    kind: "procedural",
    title,
    body: input.rule,
    appliesWhen: input.when,
    tags: input.tags ?? [],
    project: input.project ?? null,
    origin: input.origin ?? "self",
    originRef: input.originRef ?? null,
    importance: 0.75,
    ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
  });
  store.logEvent({
    kind: "lesson.learned",
    project: lesson.project,
    summary: `New lesson: ${lesson.title}`,
    payload: { id: lesson.id, when: input.when, origin: lesson.origin },
  });
  return lesson;
}

export function activeLessons(store: MemoryStore, project?: string | null): Memory[] {
  const all = store.list({ kind: "procedural", limit: 500 });
  const scoped =
    project === undefined ? all : all.filter((m) => m.project === project || m.project === null);
  return scoped
    .filter((m) => m.confidence >= store.config.retireBelowConfidence)
    .sort((a, b) => b.confidence * b.importance - a.confidence * a.importance);
}

/** The lesson held up. */
export function confirm(store: MemoryStore, id: string): Memory | null {
  return store.reinforce(id);
}

/** The lesson led the brain astray. Repeated refutation retires it automatically. */
export function refute(store: MemoryStore, id: string, reason: string): Memory | null {
  return store.refute(id, reason);
}

export interface LessonReport {
  trusted: Memory[];
  provisional: Memory[];
  failing: Memory[];
}

/**
 * A read of the brain's own competence: what it can rely on, what it is still
 * testing, and what is on its way out. This is the honest version of
 * "self-awareness" — a system that can report the state of its own beliefs.
 */
export function report(store: MemoryStore, project?: string | null): LessonReport {
  const lessons = activeLessons(store, project);
  return {
    trusted: lessons.filter((l) => l.confidence >= 0.75),
    provisional: lessons.filter((l) => l.confidence >= 0.4 && l.confidence < 0.75),
    failing: lessons.filter((l) => l.confidence < 0.4),
  };
}
