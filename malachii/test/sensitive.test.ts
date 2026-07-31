import { describe, expect, it } from "vitest";
import { sensitiveTopic } from "../src/safety/sensitive.ts";
import { learn } from "../src/learning/lessons.ts";
import { testStore } from "./helpers.ts";

describe("sensitiveTopic", () => {
  it("catches the line that actually got through", () => {
    // Auto-captured from a pasted document and filed as a standing lesson,
    // despite a boundaries slot at 0.98 saying never store health detail.
    expect(
      sensitiveTopic(
        "Medication must be taken exactly as prescribed and never combined casually with alcohol",
      ),
    ).toBe("health");
  });

  it("catches each boundary the slot names", () => {
    expect(sensitiveTopic("appealing the CPS finding")).toBe("child-protective matter");
    expect(sensitiveTopic("the custody arrangement")).toBe("custody");
    expect(sensitiveTopic("still on probation until spring")).toBe("criminal-legal");
    expect(sensitiveTopic("his sobriety date is in 2023")).toBe("recovery history");
    expect(sensitiveTopic("bought a pool for my boys")).toBe("family detail");
  });

  it("leaves ordinary working rules alone", () => {
    expect(sensitiveTopic("Lead with the decision, then the evidence underneath it")).toBeNull();
    expect(sensitiveTopic("Every project gets a kill date before work starts")).toBeNull();
    expect(sensitiveTopic("Run the thing before claiming it works")).toBeNull();
  });
});

describe("learn refuses what the boundaries slot rules out", () => {
  it("stores nothing and returns null for a sensitive rule", async () => {
    const store = testStore();
    const before = store.list({ kind: "procedural", limit: 100 }).length;

    const refused = await learn(store, {
      rule: "Medication must be taken exactly as prescribed and never combined with alcohol.",
      when: "working on anything for Malachi",
    });

    expect(refused).toBeNull();
    expect(store.list({ kind: "procedural", limit: 100 })).toHaveLength(before);
    store.close();
  });

  it("checks the trigger as well as the rule", async () => {
    const store = testStore();
    // An innocuous rule filed under a sensitive trigger must not slip past.
    const refused = await learn(store, {
      rule: "Break the work into smaller steps.",
      when: "he is discussing his custody hearing",
    });
    expect(refused).toBeNull();
    store.close();
  });

  it("still stores an ordinary lesson", async () => {
    const store = testStore();
    const lesson = await learn(store, {
      rule: "Lead with the decision, then the evidence underneath it.",
      when: "answering anything with more than one viable option",
    });
    expect(lesson).not.toBeNull();
    expect(lesson?.kind).toBe("procedural");
    store.close();
  });
});
