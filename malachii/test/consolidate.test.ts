import { afterEach, describe, expect, it } from "vitest";
import { consolidate } from "../src/memory/consolidate.ts";
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

const WEEK = 604_800_000;

/** Backdate a memory so the decay pass has something aged to work on. */
function age(memory: { id: string }, weeks: number): void {
  const then = Date.now() - weeks * WEEK;
  brain()
    .db.prepare("UPDATE memories SET created_at = ?, last_used_at = NULL WHERE id = ?")
    .run(then, memory.id);
}

describe("consolidation", () => {
  it("merges two memories that say the same thing, keeping the stronger one", async () => {
    const strong = await brain().remember({
      kind: "semantic",
      title: "Deploy target",
      body: "The site deploys to Vercel with environment variables set in the dashboard.",
      confidence: 0.9,
      importance: 0.9,
    });
    const weak = await brain().remember({
      kind: "semantic",
      title: "Deploy target notes",
      body: "The site deploys to Vercel with environment variables set in the dashboard!",
      confidence: 0.3,
      importance: 0.3,
    });

    const report = await consolidate(brain());
    expect(report.merged).toBe(1);
    expect(brain().get(strong.id)?.status).toBe("active");
    expect(brain().get(weak.id)?.status).toBe("superseded");
    expect(brain().get(weak.id)?.supersededBy).toBe(strong.id);
  });

  it("fades an episode nobody has needed", async () => {
    const episode = await brain().remember({
      kind: "episodic",
      title: "Fixed a typo",
      body: "Fixed a typo in the footer copy.",
      importance: 0.4,
    });
    age(episode, 8);

    const before = brain().get(episode.id)!.importance;
    const report = await consolidate(brain());
    expect(report.decayed).toBe(1);
    const after = brain().get(episode.id);
    // It either faded or was retired outright; both count as forgetting.
    expect(after?.status === "retired" || after!.importance < before).toBe(true);
  });

  it("leaves identity and pinned memories alone", async () => {
    const identity = await brain().remember({
      kind: "identity",
      title: "Owner",
      body: "Malachi owns this and wants maximum autonomy.",
    });
    age(identity, 200);
    await consolidate(brain());
    const after = brain().get(identity.id);
    expect(after?.status).toBe("active");
    expect(after?.importance).toBe(identity.importance);
  });

  it("retires a lesson whose confidence has collapsed", async () => {
    const lesson = await brain().remember({
      kind: "procedural",
      title: "Bad rule",
      body: "Deploy straight to production without checks.",
      confidence: 0.05,
    });
    const report = await consolidate(brain());
    expect(report.retired).toBeGreaterThanOrEqual(1);
    expect(brain().get(lesson.id)?.status).toBe("retired");
  });

  it("rolls a cluster of related episodes into one durable fact", async () => {
    for (let i = 0; i < 4; i++) {
      await brain().remember({
        kind: "episodic",
        title: `Build broke on missing env var ${i}`,
        body: `The Vercel build broke again because an environment variable was missing (run ${i}).`,
        project: "fda",
      });
    }
    const report = await consolidate(brain());
    expect(report.promoted).toBeGreaterThanOrEqual(1);
    const promoted = brain().list({ kind: "semantic", project: "fda" });
    expect(promoted.some((m) => m.tags.includes("consolidated"))).toBe(true);
  });

  it("changes nothing on a dry run", async () => {
    const lesson = await brain().remember({
      kind: "procedural",
      title: "Bad rule",
      body: "Skip every check.",
      confidence: 0.05,
    });
    const report = await consolidate(brain(), { dryRun: true });
    expect(report.retired).toBeGreaterThanOrEqual(1);
    expect(brain().get(lesson.id)?.status).toBe("active");
  });

  it("says plainly when there is nothing to do", async () => {
    const report = await consolidate(brain());
    expect(report.notes[0]).toContain("already tidy");
  });
});
