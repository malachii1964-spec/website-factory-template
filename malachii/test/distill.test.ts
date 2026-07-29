import { afterEach, describe, expect, it } from "vitest";
import { distill } from "../src/learning/distill.ts";
import { parseTranscript } from "../src/learning/transcript.ts";
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

function line(role: string, content: unknown): string {
  return JSON.stringify({ type: role, message: { role, content } });
}

describe("distilling a finished session", () => {
  it("learns a durable instruction, but does not trust it yet", async () => {
    const digest = parseTranscript(
      [
        line("user", "build the checkout flow"),
        line("assistant", [{ type: "text", text: "on it" }]),
        line("user", "Always run the typecheck before you tell me a feature is done"),
      ].join("\n"),
    );
    const result = await distill(brain(), digest, { project: "fda" });
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0]?.origin).toBe("user");
    // A keyword match is weak evidence. It enters provisional and has to earn
    // the trusted tier through outcomes — entering at 0.8 is the defect that
    // installed a whole prompt as a standing rule.
    expect(result.lessons[0]?.confidence).toBeGreaterThan(0.4);
    expect(result.lessons[0]?.confidence).toBeLessThan(0.6);
  });

  it("does not learn the same sentence twice as both directive and correction", async () => {
    const digest = parseTranscript(
      [
        line("user", "start the work"),
        line("user", "No, that is wrong — never hardcode the Stripe amount"),
      ].join("\n"),
    );
    const result = await distill(brain(), digest, { project: "fda" });
    expect(result.lessons).toHaveLength(1);
  });

  it("learns from a repeated failure, but only tentatively", async () => {
    const failure = [{ type: "tool_result", is_error: true, name: "Bash", content: "tsc: TS2304" }];
    const digest = parseTranscript(
      [line("user", "go"), line("user", failure), line("user", failure)].join("\n"),
    );
    const result = await distill(brain(), digest);
    expect(result.lessons).toHaveLength(1);
    // Self-taught guesses start low: outcomes, not observation, earn confidence.
    expect(result.lessons[0]?.confidence).toBeLessThan(0.5);
    expect(result.lessons[0]?.origin).toBe("self");
  });

  it("ignores a failure that only happened once", async () => {
    const digest = parseTranscript(
      [
        line("user", "go"),
        line("user", [{ type: "tool_result", is_error: true, name: "Bash", content: "one-off blip" }]),
      ].join("\n"),
    );
    const result = await distill(brain(), digest);
    expect(result.lessons).toHaveLength(0);
  });

  it("takes nothing from a session that taught nothing", async () => {
    const digest = parseTranscript(
      [line("user", "what time is it"), line("assistant", [{ type: "text", text: "2pm" }])].join("\n"),
    );
    const result = await distill(brain(), digest);
    expect(result.lessons).toHaveLength(0);
    expect(result.facts).toHaveLength(0);
  });

  it("records the distillation in the life log either way", async () => {
    const digest = parseTranscript(line("user", "nothing useful here"));
    await distill(brain(), digest);
    expect(brain().recentEvents(10).map((e) => e.kind)).toContain("session.distilled");
  });

  it("works with no API key — heuristics are the floor, not the fallback", async () => {
    const digest = parseTranscript(line("user", "From now on, always use dark mode as the default"));
    const result = await distill(brain(), digest);
    expect(result.usedModel).toBe(false);
    expect(result.lessons.length).toBeGreaterThan(0);
  });
});
