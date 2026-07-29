import { z } from "zod";
import type { Memory } from "../core/types.ts";
import type { MemoryStore } from "../memory/store.ts";
import { hasClaude, structured } from "../llm/claude.ts";
import { learn } from "./lessons.ts";
import { digestToPrompt, type SessionDigest } from "./transcript.ts";

/**
 * Turning a finished session into things worth keeping.
 *
 * Two paths, and the cheap one is always run: heuristics catch explicit
 * instructions, corrections, and repeated tool failures without a single
 * token. When a key is present, Claude reads the session digest and proposes
 * better-worded lessons and durable facts. Both paths write with modest
 * confidence — a freshly distilled lesson is a hypothesis, not a rule.
 */

const CandidateSchema = z.object({
  lessons: z
    .array(
      z.object({
        rule: z.string().min(8).max(400),
        when: z.string().min(3).max(200),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(6),
  facts: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        body: z.string().min(3).max(600),
      }),
    )
    .max(6),
});

type Candidates = z.infer<typeof CandidateSchema>;

const CANDIDATE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["lessons", "facts"],
  properties: {
    lessons: {
      type: "array",
      description: "Durable rules worth applying in future sessions. Empty is a valid answer.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rule", "when", "confidence"],
        properties: {
          rule: { type: "string", description: "The instruction to a future self." },
          when: { type: "string", description: "The condition that makes the rule relevant." },
          confidence: { type: "number", description: "0..1 — how strongly the session supports this." },
        },
      },
    },
    facts: {
      type: "array",
      description: "Durable facts about the project or the person. Empty is a valid answer.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "body"],
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM = `You distill finished engineering sessions into durable memory for a personal AI.

Keep only what will still be true and useful weeks from now. A good lesson is
specific, testable, and phrased as an instruction with a clear trigger.

Reject:
- restatements of the task that was just done
- anything already obvious to a competent engineer
- one-off details (a particular file path, a transient error, today's date)
- praise, sentiment, or narration

Returning empty arrays is the correct answer for a session that taught nothing.`;

export interface DistillResult {
  lessons: Memory[];
  facts: Memory[];
  usedModel: boolean;
}

/** Recurring failures are the strongest self-taught signal in a transcript. */
function failurePatterns(digest: SessionDigest): { rule: string; when: string }[] {
  const counts = new Map<string, number>();
  for (const failure of digest.failures) {
    const key = `${failure.tool}: ${failure.detail.split("\n")[0]?.slice(0, 120) ?? ""}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .slice(0, 3)
    .map(([key, n]) => ({
      rule: `This failed ${n} times in one session: ${key}. Check for it before repeating the same approach.`,
      when: `using ${key.split(":")[0] ?? "this tool"} in a similar situation`,
    }));
}

export async function distill(
  store: MemoryStore,
  digest: SessionDigest,
  context: { project?: string | null; sessionRef?: string | null } = {},
): Promise<DistillResult> {
  const project = context.project ?? null;
  const sessionRef = context.sessionRef ?? null;
  const result: DistillResult = { lessons: [], facts: [], usedModel: false };

  // --- Heuristic pass: free, always runs, and deliberately unsure of itself. ---
  //
  // A keyword match is weak evidence even when the sentence is well-shaped, so
  // nothing from this pass enters the trusted tier. It proposes; outcomes
  // promote. Entering at 0.8 is what previously let a regex hit on the word
  // "always" install itself as a standing rule.
  for (const directive of digest.directives.slice(0, 5)) {
    result.lessons.push(
      await learn(store, {
        rule: directive,
        when: "working on anything for Malachi",
        project,
        origin: "user",
        originRef: sessionRef,
        confidence: 0.5,
        tags: ["directive", "unverified"],
      }),
    );
  }
  // "Never hardcode the amount" reads as both a directive and a correction.
  // The directive form is the better-phrased, higher-confidence one, so a turn
  // already captured there must not be learned a second time as a correction.
  const captured = new Set(digest.directives.map((d) => d.trim()));
  const corrections = digest.corrections.filter((c) => !captured.has(c.trim()));

  for (const correction of corrections.slice(0, 4)) {
    result.lessons.push(
      await learn(store, {
        rule: `Malachi pushed back with: "${correction}" — do not repeat what prompted it.`,
        when: "about to take a similar action in this project",
        project,
        origin: "user",
        originRef: sessionRef,
        confidence: 0.45,
        tags: ["correction", "unverified"],
      }),
    );
  }
  for (const pattern of failurePatterns(digest)) {
    result.lessons.push(
      await learn(store, {
        ...pattern,
        project,
        origin: "self",
        originRef: sessionRef,
        confidence: 0.3,
        tags: ["failure-pattern", "unverified"],
      }),
    );
  }

  // --- Model pass: better phrasing, real synthesis, only if a key exists. ---
  if (hasClaude() && digest.turnCount > 2) {
    const candidates = await structured<Candidates>({
      model: store.config.model,
      system: SYSTEM,
      prompt: digestToPrompt(digest),
      jsonSchema: CANDIDATE_JSON_SCHEMA,
      schema: CandidateSchema,
      effort: "low",
    });
    if (candidates) {
      result.usedModel = true;
      for (const lesson of candidates.lessons) {
        result.lessons.push(
          await learn(store, {
            rule: lesson.rule,
            when: lesson.when,
            project,
            origin: "session",
            originRef: sessionRef,
            // The model's own read of the evidence is capped: it proposes, outcomes decide.
            confidence: Math.min(0.6, lesson.confidence),
            tags: ["distilled"],
          }),
        );
      }
      for (const fact of candidates.facts) {
        result.facts.push(
          await store.remember({
            kind: "semantic",
            title: fact.title,
            body: fact.body,
            project,
            origin: "session",
            originRef: sessionRef,
            confidence: 0.55,
            tags: ["distilled"],
          }),
        );
      }
    }
  }

  store.logEvent({
    kind: "session.distilled",
    project,
    summary: `Distilled a session into ${result.lessons.length} lessons and ${result.facts.length} facts`,
    payload: {
      sessionRef,
      usedModel: result.usedModel,
      turns: digest.turnCount,
      failures: digest.failures.length,
    },
  });
  return result;
}
