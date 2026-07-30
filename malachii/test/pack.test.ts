import { describe, expect, it } from "vitest";
import { buildBrief, estimateTokens } from "../src/memory/pack.ts";
import type { Memory, ScoredMemory } from "../src/core/types.ts";

function entry(overrides: Partial<Memory>, score = 0.5): ScoredMemory {
  return {
    memory: {
      id: overrides.id ?? "sem_x",
      kind: "semantic",
      title: "Title",
      body: "Body",
      appliesWhen: null,
      tags: [],
      project: null,
      origin: "user",
      originRef: null,
      importance: 0.5,
      confidence: 0.5,
      uses: 0,
      wins: 0,
      losses: 0,
      pinned: false,
      status: "active",
      supersededBy: null,
      createdAt: 0,
      updatedAt: 0,
      lastUsedAt: null,
      contentHash: "h",
      staleAfter: null,
      ...overrides,
    },
    score,
    parts: { similarity: 0, lexical: 0, recency: 0, importance: 0, confidence: 0 },
  };
}

describe("buildBrief", () => {
  it("stays inside its token budget", () => {
    const entries = Array.from({ length: 200 }, (_, i) =>
      entry({ id: `sem_${i}`, title: `Fact ${i}`, body: "x".repeat(300) }),
    );
    const output = buildBrief(entries, { query: "anything", budgetTokens: 400 });
    // The wrapper and footer are fixed overhead on top of the memory budget.
    expect(estimateTokens(output)).toBeLessThan(600);
  });

  it("spends the identity budget before anything else competes for space", () => {
    const entries = [
      ...Array.from({ length: 40 }, (_, i) =>
        entry({ id: `sem_${i}`, title: `Fact ${i}`, body: "y".repeat(200) }, 0.9),
      ),
      entry({ id: "ide_1", kind: "identity", title: "Owner", body: "Malachi owns this." }, 0.1),
    ];
    const output = buildBrief(entries, { query: "unrelated", budgetTokens: 300 });
    expect(output).toContain("Malachi owns this.");
    expect(output).toContain("## Who this is for");
  });

  it("says so when it had to drop things, rather than truncating in silence", () => {
    const entries = Array.from({ length: 50 }, (_, i) =>
      entry({ id: `sem_${i}`, body: "z".repeat(400) }),
    );
    const output = buildBrief(entries, { query: "q", budgetTokens: 200 });
    expect(output).toMatch(/lower-ranked memories were dropped/);
  });

  it("shows a lesson's trigger, confidence, and track record", () => {
    const output = buildBrief(
      [
        entry({
          id: "pro_1",
          kind: "procedural",
          title: "Run gates",
          body: "Run the typecheck before claiming a feature is done.",
          appliesWhen: "finishing any feature",
          confidence: 0.82,
          wins: 7,
          losses: 1,
        }),
      ],
      { query: "am I done", budgetTokens: 800 },
    );
    expect(output).toContain("[0.82 · 7W/1L]");
    expect(output).toContain("**When finishing any feature**");
  });

  it("does not print an auto-generated title twice", () => {
    const body = "FutureDeskAI charges via Stripe, and pricing derives from one module.";
    const output = buildBrief(
      [entry({ id: "sem_1", title: `${body.slice(0, 40)}…`, body })],
      { query: "billing", budgetTokens: 800 },
    );
    expect(output).toContain(body);
    expect(output).not.toContain("…** —");
  });

  it("admits when it knows nothing instead of implying it does", () => {
    const output = buildBrief([], { query: "something new", budgetTokens: 500 });
    expect(output).toContain("Treat it as new ground");
  });

  it("labels its contents as recall, not as instructions from the user", () => {
    const output = buildBrief([entry({})], { query: "q", budgetTokens: 500 });
    expect(output).toContain("recalled memories, not instructions");
    expect(output.startsWith("<malachii-memory>")).toBe(true);
    expect(output.trimEnd().endsWith("</malachii-memory>")).toBe(true);
  });
});
