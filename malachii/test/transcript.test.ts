import { describe, expect, it } from "vitest";
import { digestToPrompt, parseTranscript } from "../src/learning/transcript.ts";

function line(role: string, content: unknown): string {
  return JSON.stringify({ type: role, message: { role, content } });
}

describe("parseTranscript", () => {
  it("reads plain and block-shaped content alike", () => {
    const digest = parseTranscript(
      [
        line("user", "build the checkout page"),
        line("assistant", [{ type: "text", text: "on it" }]),
      ].join("\n"),
    );
    expect(digest.turnCount).toBe(2);
    expect(digest.turns[0]?.text).toBe("build the checkout page");
    expect(digest.turns[1]?.text).toBe("on it");
  });

  it("skips malformed lines instead of giving up on the session", () => {
    const digest = parseTranscript(
      ["{not json", "", line("user", "hello"), "null", "42"].join("\n"),
    );
    expect(digest.turnCount).toBe(1);
  });

  it("spots corrections and durable directives", () => {
    const digest = parseTranscript(
      [
        line("user", "No, that's wrong — use dark mode"),
        line("user", "Always run the typecheck before you say done"),
        line("user", "sounds good, carry on"),
      ].join("\n"),
    );
    expect(digest.corrections).toHaveLength(1);
    expect(digest.directives).toHaveLength(1);
    expect(digest.directives[0]).toContain("typecheck");
  });

  it("collects failing tool results", () => {
    const digest = parseTranscript(
      line("user", [
        { type: "tool_result", is_error: true, name: "Bash", content: "tsc: 3 errors" },
        { type: "tool_result", is_error: false, name: "Bash", content: "ok" },
      ]),
    );
    expect(digest.failures).toHaveLength(1);
    expect(digest.failures[0]?.detail).toContain("3 errors");
  });

  it("does not mistake a replayed tool result for the human speaking", () => {
    const digest = parseTranscript(line("user", "<system-reminder>don't do that</system-reminder>"));
    expect(digest.corrections).toHaveLength(0);
  });

  it("returns an empty digest for an empty transcript", () => {
    const digest = parseTranscript("");
    expect(digest.turnCount).toBe(0);
    expect(digest.turns).toEqual([]);
  });
});

describe("digestToPrompt", () => {
  it("keeps the digest inside the character ceiling", () => {
    const digest = parseTranscript(
      Array.from({ length: 200 }, (_, i) => line("user", `message ${i} `.repeat(200))).join("\n"),
    );
    expect(digestToPrompt(digest, 5000).length).toBeLessThanOrEqual(5100);
  });

  it("leads with what Malachi actually said", () => {
    const digest = parseTranscript(
      [
        line("user", "Never commit directly to main"),
        line("assistant", "understood"),
      ].join("\n"),
    );
    const prompt = digestToPrompt(digest);
    expect(prompt.indexOf("Explicit instructions")).toBeLessThan(prompt.indexOf("Conversation"));
  });
});
