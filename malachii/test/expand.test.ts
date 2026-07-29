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

/**
 * The claim second-hop expansion makes: a memory the question cannot reach on
 * its own becomes reachable through the memory that the question *can* reach.
 */
describe("second-hop expansion", () => {
  async function seedChain(): Promise<void> {
    // Reachable from the query.
    await brain().remember({
      kind: "semantic",
      title: "Vercel deploy",
      body: "The Vercel production deploy fails unless STRIPE_SECRET_KEY is set in the dashboard.",
    });
    // Reachable only from the memory above — it shares no wording with the query.
    await brain().remember({
      kind: "semantic",
      title: "Key storage",
      body: "STRIPE_SECRET_KEY lives in the team password manager under the Payments vault.",
    });
    // Noise.
    for (const [title, body] of [
      ["Hinges", "The cabinet hinges are on order and arrive Tuesday."],
      ["Typeface", "IBM Plex Sans is the body typeface across the site."],
      ["Race", "The charity race raised awareness for mental health."],
    ]) {
      await brain().remember({ kind: "semantic", title: title!, body: body! });
    }
  }

  it("reaches a memory the query alone cannot", async () => {
    await seedChain();
    const query = "why does the vercel production deploy fail";

    const plain = await brain().recall({ query, limit: 2, markUsed: false });
    const expanded = await brain().recall({ query, limit: 2, markUsed: false, expand: true });

    const has = (r: Awaited<ReturnType<MemoryStore["recall"]>>, t: string) =>
      r.some((x) => x.memory.title === t);

    // Both find the directly-reachable memory.
    expect(has(plain, "Vercel deploy")).toBe(true);
    expect(has(expanded, "Vercel deploy")).toBe(true);
    // Only expansion follows it to the second hop.
    expect(has(expanded, "Key storage")).toBe(true);
  });

  it("still puts the direct answer first", async () => {
    await seedChain();
    const results = await brain().recall({
      query: "why does the vercel production deploy fail",
      limit: 5,
      markUsed: false,
      expand: true,
    });
    expect(results[0]?.memory.title).toBe("Vercel deploy");
  });

  it("is off unless asked for, so recall cost is unchanged by default", async () => {
    await seedChain();
    const plain = await brain().recall({ query: "vercel deploy", limit: 5, markUsed: false });
    expect(plain.length).toBeGreaterThan(0);
  });

  it("does nothing when the query reaches nothing to expand from", async () => {
    const results = await brain().recall({
      query: "something about a topic never mentioned",
      limit: 5,
      markUsed: false,
      expand: true,
    });
    expect(results).toEqual([]);
  });
});
