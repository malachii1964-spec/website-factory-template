import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testStore } from "./helpers.ts";
import type { MemoryStore } from "../src/memory/store.ts";
import {
  IDENTITY_SLOTS,
  filled,
  identityStatus,
  recordIdentity,
  unfilled,
} from "../src/knowledge/identity.ts";

let store: MemoryStore;
beforeEach(() => {
  store = testStore();
});
afterEach(() => {
  store.close();
});

describe("identity slots", () => {
  it("starts by knowing nothing, and says so rather than guessing", () => {
    const status = identityStatus(store);
    expect(status.answers).toEqual([]);
    expect(status.missing).toHaveLength(IDENTITY_SLOTS.length);
  });

  it("records one answer without needing the rest", async () => {
    await recordIdentity(store, "name", "Malachi");
    const status = identityStatus(store);
    expect(status.answers).toHaveLength(1);
    expect(status.answers[0]!.answer).toBe("Malachi");
    expect(status.missing).toHaveLength(IDENTITY_SLOTS.length - 1);
  });

  it("pins what it learns, so it is never crowded out of recall", async () => {
    const memory = await recordIdentity(store, "style", "direct, no hedging");
    expect(memory.pinned).toBe(true);
    expect(memory.kind).toBe("identity");
  });

  it("attributes identity to him, never to itself", async () => {
    // The one kind that must never be inferred: a wrong fact about Malachi
    // shapes every answer for as long as it sits there.
    const memory = await recordIdentity(store, "purpose", "everything, not just code");
    expect(memory.origin).toBe("user");
  });

  it("orders answers the way the slots are asked, not by when they arrived", async () => {
    await recordIdentity(store, "values", "honesty over polish");
    await recordIdentity(store, "name", "Malachi");
    expect(identityStatus(store).answers.map((a) => a.slot.id)).toEqual(["name", "values"]);
  });

  it("rejects a slot it does not have", async () => {
    await expect(recordIdentity(store, "favourite-colour", "blue")).rejects.toThrow(
      /no identity slot/,
    );
  });
});

describe("changing an answer", () => {
  it("replaces rather than accumulating a contradiction", async () => {
    await recordIdentity(store, "style", "formal and thorough");
    await recordIdentity(store, "style", "blunt and short");

    const answers = identityStatus(store).answers.filter((a) => a.slot.id === "style");
    expect(answers).toHaveLength(1);
    expect(answers[0]!.answer).toBe("blunt and short");
  });

  it("keeps the old answer readable instead of deleting it", async () => {
    const first = await recordIdentity(store, "style", "formal and thorough");
    await recordIdentity(store, "style", "blunt and short");

    const old = store.get(first.id)!;
    expect(old.status).toBe("superseded");
    expect(old.body).toBe("formal and thorough");
    expect(old.supersededBy).not.toBeNull();
  });

  it("treats an identical re-answer as nothing to change", async () => {
    const first = await recordIdentity(store, "name", "Malachi");
    const again = await recordIdentity(store, "name", "Malachi");
    expect(again.id).toBe(first.id);
    expect(filled(store)).toHaveLength(1);
  });
});

describe("unfilled", () => {
  it("lists exactly what is still unknown", async () => {
    for (const slot of IDENTITY_SLOTS.slice(0, 2)) {
      await recordIdentity(store, slot.id, "an answer");
    }
    const missing = unfilled(store).map((slot) => slot.id);
    expect(missing).toEqual(IDENTITY_SLOTS.slice(2).map((slot) => slot.id));
  });

  it("is empty once every slot is answered", async () => {
    for (const slot of IDENTITY_SLOTS) await recordIdentity(store, slot.id, `answer for ${slot.id}`);
    expect(unfilled(store)).toEqual([]);
  });
});

describe("identity in recall", () => {
  it("surfaces an identity memory even for a query that does not mention it", async () => {
    // Identity is always in the candidate pool — that is what makes recall
    // recognisably his rather than merely topical.
    await recordIdentity(store, "style", "blunt, no hedging, no filler");
    const results = await store.recall({ query: "how should I write this changelog?", limit: 5 });
    expect(results.some((r) => r.memory.kind === "identity")).toBe(true);
  });
});
