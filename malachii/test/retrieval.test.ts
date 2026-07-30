import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/core/config.ts";
import { LocalEmbedder } from "../src/memory/embed.ts";
import {
  normaliseLexical,
  recencyScore,
  scoreCandidates,
  selectDiverse,
  toFtsQuery,
} from "../src/memory/retrieval.ts";
import type { Memory, ScoredMemory } from "../src/core/types.ts";

const DAY = 86_400_000;

function fakeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: "sem_test",
    kind: "semantic",
    title: "t",
    body: "b",
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastUsedAt: null,
    contentHash: "h",
    staleAfter: null,
    ...overrides,
  };
}

describe("toFtsQuery", () => {
  it("strips punctuation that FTS5 would treat as syntax", () => {
    const query = toFtsQuery("why did the build fail? (again) -- AND OR");
    expect(query).not.toBeNull();
    expect(query).not.toContain("?");
    expect(query).not.toContain("(");
  });

  it("returns null when nothing searchable is left", () => {
    expect(toFtsQuery("?? -- ...")).toBeNull();
    expect(toFtsQuery("the a of")).toBeNull();
  });

  it("builds prefix terms joined by OR", () => {
    expect(toFtsQuery("stripe webhook")).toBe('"stripe"* OR "webhook"*');
  });
});

describe("recencyScore", () => {
  it("is 1 at write time and halves each half-life", () => {
    expect(recencyScore(0, 30)).toBeCloseTo(1, 6);
    expect(recencyScore(30 * DAY, 30)).toBeCloseTo(0.5, 6);
    expect(recencyScore(60 * DAY, 30)).toBeCloseTo(0.25, 6);
  });

  it("never fades identity memories", () => {
    expect(recencyScore(10_000 * DAY, Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("normaliseLexical", () => {
  it("maps bm25 ranks onto 0..1 with the best match at 1", () => {
    const out = normaliseLexical(new Map([["a", -9], ["b", -1], ["c", -5]]));
    expect(out.get("a")).toBeCloseTo(1, 6);
    expect(out.get("b")).toBeCloseTo(0, 6);
    expect(out.get("c")).toBeGreaterThan(0);
    expect(out.get("c")).toBeLessThan(1);
  });

  it("gives a lone result the full score rather than dividing by zero", () => {
    expect(normaliseLexical(new Map([["only", -3]])).get("only")).toBe(1);
  });
});

describe("scoreCandidates", () => {
  const config = loadConfig();

  it("ranks a confident, important, recent memory above a weak one", () => {
    const strong = fakeMemory({ id: "strong", importance: 0.9, confidence: 0.9 });
    const weak = fakeMemory({ id: "weak", importance: 0.1, confidence: 0.1 });
    const [first] = scoreCandidates({
      candidates: [weak, strong],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map(),
      config,
      now: Date.now(),
    });
    expect(first?.memory.id).toBe("strong");
  });

  it("keeps every score inside 0..1 even for a pinned memory", () => {
    const pinned = fakeMemory({ id: "p", pinned: true, importance: 1, confidence: 1 });
    const [scored] = scoreCandidates({
      candidates: [pinned],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map([["p", 1]]),
      config,
      now: Date.now(),
    });
    expect(scored!.score).toBeLessThanOrEqual(1);
    expect(scored!.score).toBeGreaterThan(0);
  });

  it("lets a pinned memory outrank an unpinned one that is otherwise identical", () => {
    const plain = fakeMemory({ id: "plain" });
    const pinned = fakeMemory({ id: "pinned", pinned: true });
    const scored = scoreCandidates({
      candidates: [plain, pinned],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map(),
      config,
      now: Date.now(),
    });
    expect(scored[0]?.memory.id).toBe("pinned");
  });
});

describe("selectDiverse", () => {
  const embedder = new LocalEmbedder();

  it("refuses to spend two slots on the same idea", () => {
    const text = "the deploy needs the environment variables set first";
    const vectors = new Map([
      ["a", embedder.embedOne(text)],
      ["b", embedder.embedOne(text)],
      ["c", embedder.embedOne("cabinet hinges arrive on tuesday")],
    ]);
    const scored: ScoredMemory[] = ["a", "b", "c"].map((id, index) => ({
      memory: fakeMemory({ id }),
      score: 1 - index * 0.1,
      parts: { similarity: 0, lexical: 0, recency: 0, importance: 0, confidence: 0 },
    }));

    const picked = selectDiverse(scored, vectors, 3, 0.93);
    expect(picked.map((p) => p.memory.id)).toEqual(["a", "c"]);
  });

  it("keeps near-duplicates when the threshold is loosened", () => {
    const vectors = new Map([
      ["a", embedder.embedOne("same thing")],
      ["b", embedder.embedOne("same thing")],
    ]);
    const scored: ScoredMemory[] = ["a", "b"].map((id) => ({
      memory: fakeMemory({ id }),
      score: 1,
      parts: { similarity: 0, lexical: 0, recency: 0, importance: 0, confidence: 0 },
    }));
    expect(selectDiverse(scored, vectors, 2, 1.01)).toHaveLength(2);
  });
});

describe("relevance-first scoring", () => {
  const relevanceFirst = { ...loadConfig(), scoring: "relevance-first" as const };

  it("gives an irrelevant memory a score of zero, however trusted it is", () => {
    const trusted = fakeMemory({ id: "trusted", importance: 1, confidence: 1 });
    const [scored] = scoreCandidates({
      candidates: [trusted],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map(), // matched nothing
      config: relevanceFirst,
      now: Date.now(),
    });
    expect(scored!.score).toBe(0);
  });

  it("still lets priors order two memories that are equally relevant", () => {
    const strong = fakeMemory({ id: "strong", importance: 0.9, confidence: 0.9 });
    const weak = fakeMemory({ id: "weak", importance: 0.1, confidence: 0.1 });
    const scored = scoreCandidates({
      candidates: [weak, strong],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map([["strong", 1], ["weak", 1]]),
      config: relevanceFirst,
      now: Date.now(),
    });
    expect(scored[0]?.memory.id).toBe("strong");
    expect(scored[1]!.score).toBeGreaterThan(0);
  });

  it("under the additive default, an irrelevant memory still floats on priors", () => {
    // The defect this mode exists to fix, pinned as a test so the difference
    // between the two modes is visible rather than argued about.
    const [scored] = scoreCandidates({
      candidates: [fakeMemory({ id: "x", importance: 0.9, confidence: 0.9 })],
      queryVector: null,
      vectors: new Map(),
      lexical: new Map(),
      config: { ...loadConfig(), scoring: "additive" },
      now: Date.now(),
    });
    expect(scored!.score).toBeGreaterThan(0.25);
  });
});
