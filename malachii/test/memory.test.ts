import { afterEach, describe, expect, it } from "vitest";
import { testStore } from "./helpers.ts";
import type { MemoryStore } from "../src/memory/store.ts";

let store: MemoryStore | null = null;
function brain(): MemoryStore {
  store ??= testStore();
  return store;
}
afterEach(() => {
  store?.close();
  store = null;
});

describe("writing", () => {
  it("stores a memory with provenance and an embedding", async () => {
    const memory = await brain().remember({
      kind: "semantic",
      title: "Deploy target",
      body: "FutureDeskAI deploys to Vercel.",
      project: "fda",
      origin: "user",
    });
    expect(memory.id).toMatch(/^sem_/);
    expect(memory.origin).toBe("user");
    expect(brain().stats().embedded).toBe(1);
  });

  it("treats a repeated memory as evidence, not as a second memory", async () => {
    const input = {
      kind: "semantic" as const,
      title: "Deploy target",
      body: "FutureDeskAI deploys to Vercel.",
      project: "fda",
    };
    const first = await brain().remember(input);
    const second = await brain().remember(input);
    expect(second.id).toBe(first.id);
    expect(second.confidence).toBeGreaterThan(first.confidence);
    expect(brain().stats().total).toBe(1);
  });

  it("ignores whitespace and casing when deciding two memories are the same", async () => {
    const a = await brain().remember({ kind: "semantic", title: "Stack", body: "Next.js and Tailwind" });
    const b = await brain().remember({ kind: "semantic", title: "stack", body: "Next.js   and Tailwind  " });
    expect(b.id).toBe(a.id);
  });

  it("trusts Malachi more than it trusts itself", async () => {
    const fromHim = await brain().remember({ kind: "semantic", title: "A", body: "dark mode is the default", origin: "user" });
    const fromItself = await brain().remember({ kind: "semantic", title: "B", body: "probably wants light mode", origin: "self" });
    expect(fromHim.confidence).toBeGreaterThan(fromItself.confidence);
  });
});

describe("recall", () => {
  it("finds the relevant memory among unrelated ones", async () => {
    await brain().remember({ kind: "semantic", title: "Payments", body: "Stripe handles checkout and webhooks." });
    await brain().remember({ kind: "semantic", title: "Kitchen", body: "The cabinet hinges are on order." });
    await brain().remember({ kind: "semantic", title: "Fonts", body: "IBM Plex Sans is the body typeface." });

    const results = await brain().recall({ query: "how does stripe checkout work", limit: 3 });
    expect(results[0]?.memory.title).toBe("Payments");
  });

  it("always surfaces identity, even for an unrelated query", async () => {
    await brain().remember({
      kind: "identity",
      title: "Owner",
      body: "Malachi owns this. He wants maximum autonomy and minimal check-ins.",
    });
    await brain().remember({ kind: "semantic", title: "Hinges", body: "Cabinet hinges are on order." });

    const results = await brain().recall({ query: "postgres index tuning", limit: 5 });
    expect(results.some((r) => r.memory.kind === "identity")).toBe(true);
  });

  it("records that a recalled memory was used", async () => {
    const memory = await brain().remember({ kind: "semantic", title: "Payments", body: "Stripe handles checkout." });
    await brain().recall({ query: "stripe", limit: 3 });
    expect(brain().get(memory.id)?.uses).toBeGreaterThan(0);
  });

  it("does not fall over on a query full of punctuation", async () => {
    await brain().remember({ kind: "semantic", title: "Build", body: "next build must pass." });
    await expect(brain().recall({ query: "why?! (again) -- ???", limit: 3 })).resolves.toBeDefined();
  });

  it("keeps another project's memories out of a scoped recall", async () => {
    await brain().remember({ kind: "semantic", title: "A", body: "thing about alpha", project: "alpha" });
    await brain().remember({ kind: "semantic", title: "B", body: "thing about beta", project: "beta" });
    const results = await brain().recall({ query: "thing", project: "alpha", limit: 10 });
    expect(results.every((r) => r.memory.project === "alpha" || r.memory.project === null)).toBe(true);
  });
});

describe("learning from outcomes", () => {
  it("raises confidence toward — but never to — certainty", async () => {
    const memory = await brain().remember({ kind: "procedural", title: "Rule", body: "Run the tests first.", confidence: 0.5 });
    let current = memory.confidence;
    for (let i = 0; i < 20; i++) {
      current = brain().reinforce(memory.id)!.confidence;
    }
    expect(current).toBeGreaterThan(0.9);
    expect(current).toBeLessThan(1);
  });

  it("retires a lesson that keeps being wrong", async () => {
    const lesson = await brain().remember({
      kind: "procedural",
      title: "Bad rule",
      body: "Skip the typecheck, it is slow.",
      confidence: 0.6,
    });
    let updated = brain().get(lesson.id);
    for (let i = 0; i < 6 && updated?.status === "active"; i++) {
      updated = brain().refute(lesson.id, "this caused a broken build");
    }
    expect(updated?.status).toBe("retired");
    expect(updated?.losses).toBeGreaterThan(0);
  });

  it("stops recalling a lesson once its confidence collapses", async () => {
    const lesson = await brain().remember({
      kind: "procedural",
      title: "Doomed",
      body: "Always force push to main.",
      confidence: 0.5,
    });
    for (let i = 0; i < 8; i++) brain().refute(lesson.id, "no");
    const results = await brain().recall({ query: "force push to main", limit: 10 });
    expect(results.some((r) => r.memory.id === lesson.id)).toBe(false);
  });

  it("keeps a superseded belief readable and linked to its replacement", async () => {
    const old = await brain().remember({ kind: "semantic", title: "Theme", body: "Light mode is the default." });
    const next = await brain().supersede(
      old.id,
      { kind: "semantic", title: "Theme", body: "Dark mode is the default." },
      "he changed his mind",
    );
    const stale = brain().get(old.id);
    expect(stale?.status).toBe("superseded");
    expect(stale?.supersededBy).toBe(next.id);
    expect(stale?.body).toBe("Light mode is the default.");
  });
});

describe("the life log", () => {
  it("records every write, reinforcement, and retirement", async () => {
    const memory = await brain().remember({ kind: "semantic", title: "X", body: "something" });
    brain().reinforce(memory.id);
    brain().retire(memory.id, "no longer true");
    const kinds = brain().recentEvents(20).map((e) => e.kind);
    expect(kinds).toContain("memory.written");
    expect(kinds).toContain("memory.reinforced");
    expect(kinds).toContain("memory.retired");
  });

  it("reports what it knows", async () => {
    await brain().remember({ kind: "identity", title: "Owner", body: "Malachi." });
    await brain().remember({ kind: "procedural", title: "Rule", body: "Test first.", confidence: 0.8 });
    const stats = brain().stats();
    expect(stats.total).toBe(2);
    expect(stats.byKind["identity"]).toBe(1);
    expect(stats.lessons.active).toBe(1);
    expect(stats.lessons.meanConfidence).toBeGreaterThan(0);
  });
});
