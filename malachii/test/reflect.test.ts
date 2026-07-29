import { afterEach, describe, expect, it } from "vitest";
import { openProposals, reflect } from "../src/learning/reflect.ts";
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

describe("the reflex", () => {
  it("records both passes so the reflection can be audited", async () => {
    const result = await reflect(brain(), {
      subject: "fixed the distiller",
      tighten: "cut 3 junk memories to 1 correct lesson",
      escalate: "distill inside a live session instead of paying API rates",
      project: "malachii",
    });
    expect(result.record.kind).toBe("episodic");
    expect(result.record.body).toContain("cut 3 junk memories");
    expect(result.record.body).toContain("distill inside a live session");
    expect(result.foundNothing).toBe(false);
  });

  it("treats a 10x idea as a durable proposal, not a passing thought", async () => {
    const result = await reflect(brain(), {
      subject: "built the recall path",
      escalate: "replace the whole candidate pass with a learned index",
    });
    expect(result.proposal).not.toBeNull();
    expect(result.proposal?.kind).toBe("semantic");
    expect(result.proposal?.tags).toContain("awaiting-decision");
    // An idea is not a finding — it has to survive a decision to earn trust.
    expect(result.proposal?.confidence).toBeLessThan(0.5);
  });

  it("links the proposal back to the reflection that raised it", async () => {
    const result = await reflect(brain(), {
      subject: "the ingest path",
      escalate: "watch a source list instead of ingesting by hand",
    });
    const links = brain()
      .db.prepare("SELECT src, dst, rel FROM links WHERE rel = 'raised-during'")
      .all() as { src: string; dst: string }[];
    expect(links[0]?.src).toBe(result.proposal?.id);
    expect(links[0]?.dst).toBe(result.record.id);
  });

  it("records 'nothing worth changing' as a real outcome", async () => {
    const result = await reflect(brain(), { subject: "renamed a variable" });
    expect(result.foundNothing).toBe(true);
    expect(result.proposal).toBeNull();
    expect(result.record.tags).toContain("no-change");
    expect(result.record.body).toContain("nothing worth the churn");
  });

  it("does not raise a proposal when pass 2 found nothing", async () => {
    await reflect(brain(), { subject: "a small fix", tighten: "deleted a redundant query" });
    expect(openProposals(brain())).toHaveLength(0);
  });

  it("keeps proposals visible until they are decided on", async () => {
    await reflect(brain(), { subject: "a", escalate: "idea one" });
    await reflect(brain(), { subject: "b", escalate: "idea two" });
    expect(openProposals(brain())).toHaveLength(2);

    const [first] = openProposals(brain());
    brain().retire(first!.id, "decided against it");
    expect(openProposals(brain())).toHaveLength(1);
  });

  it("writes the reflex to the life log", async () => {
    await reflect(brain(), { subject: "something", tighten: "something else" });
    expect(brain().recentEvents(10).map((e) => e.kind)).toContain("task.reflected");
  });

  it("treats whitespace-only input as nothing rather than as a finding", async () => {
    const result = await reflect(brain(), { subject: "x", tighten: "   ", escalate: "  " });
    expect(result.foundNothing).toBe(true);
    expect(result.proposal).toBeNull();
  });
});
