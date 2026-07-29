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

// ── Regression tests written from real defects found in the live brain ──
// Three pieces of junk got learned on the first day the hooks ran. Each of
// these locks the door behind one of them.

describe("noise rejection (regressions from the live brain)", () => {
  it("captures the rule sentence, not the whole prompt that contained it", () => {
    const digest = parseTranscript(
      line(
        "user",
        "before I work on anything else. I want to Build Malachii Intelligence v3 - taking " +
          "everything we have learned about how we handle prompts and the logic behind it. " +
          "It should be programmed to always run the typecheck before reporting done.",
      ),
    );
    expect(digest.directives).toHaveLength(1);
    expect(digest.directives[0]).toContain("always run the typecheck");
    expect(digest.directives[0]!.length).toBeLessThan(120);
    expect(digest.directives[0]).not.toContain("Malachii Intelligence v3");
  });

  it("rejects a task request even when it contains a directive keyword", () => {
    const digest = parseTranscript(
      line("user", "I want to build something that is always fast and hungry to improve."),
    );
    expect(digest.directives).toHaveLength(0);
  });

  it("does not learn from tool-protocol errors", () => {
    const digest = parseTranscript(
      line("user", [
        {
          type: "tool_result",
          is_error: true,
          tool_use_id: "t1",
          content: "<tool_use_error>File has not been read yet. Read it first.</tool_use_error>",
        },
      ]),
    );
    expect(digest.failures).toHaveLength(0);
  });

  it("does not learn from a declined permission prompt", () => {
    const digest = parseTranscript(
      line("user", [
        {
          type: "tool_result",
          is_error: true,
          tool_use_id: "t1",
          content: "The user doesn't want to proceed with this tool use. The tool use was rejected.",
        },
      ]),
    );
    expect(digest.failures).toHaveLength(0);
  });

  it("names the tool that actually failed by resolving its tool_use id", () => {
    const digest = parseTranscript(
      [
        JSON.stringify({
          type: "assistant",
          message: { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "Bash" }] },
        }),
        line("user", [
          { type: "tool_result", is_error: true, tool_use_id: "t1", content: "tsc: 3 errors" },
        ]),
      ].join("\n"),
    );
    expect(digest.failures[0]?.tool).toBe("Bash");
  });

  it("says so rather than inventing a name when the tool cannot be resolved", () => {
    const digest = parseTranscript(
      line("user", [{ type: "tool_result", is_error: true, tool_use_id: "gone", content: "boom" }]),
    );
    expect(digest.failures[0]?.tool).toBe("unknown tool");
  });

  it("keeps a real correction that stands on its own", () => {
    const digest = parseTranscript(
      line("user", "No, that's wrong. Use the catalog price instead of a hardcoded amount."),
    );
    expect(digest.corrections.length).toBeGreaterThan(0);
    expect(digest.corrections.some((c) => c.includes("catalog price"))).toBe(true);
  });

  it("ignores a question, which is never a standing rule", () => {
    const digest = parseTranscript(line("user", "Should I always run the tests first?"));
    expect(digest.directives).toHaveLength(0);
  });
});

describe("pasted material is not the user speaking", () => {
  // Verbatim from the live brain: a pasted architecture doc was stored as
  // Malachi's own standing directive, and a web page's error string as his
  // correction.
  const PASTED_DOC = [
    "Check out the latest from our partner:",
    "",
    "1. Architectural Backbone & Safety Layer",
    "* Dual-Kernel Architecture: Separate the Core Logic from the AI Brain. The AI should never execute code directly.",
    "* Ephemeral Sandboxed Execution: Any code it generates must always run inside an isolated container.",
    "* Deterministic Guardrails: Implement semantic firewalls. Never let unsafe prompts reach the LLM.",
    "* Human-in-the-Loop Triggers: High-risk tasks freeze until you authorize them.",
    "",
    "See https://milvus.io/ and https://www.home-assistant.io/ for details.",
    "Something went wrong and the content wasn't generated.",
  ].join("\n");

  it("does not attribute a pasted document's rules to Malachi", () => {
    const digest = parseTranscript(line("user", PASTED_DOC));
    expect(digest.directives).toHaveLength(0);
    expect(digest.corrections).toHaveLength(0);
  });

  it("still hears a short instruction he actually typed", () => {
    const digest = parseTranscript(line("user", "Always run the benchmark before claiming an improvement."));
    expect(digest.directives).toHaveLength(1);
  });

  it("ignores a bullet line even outside a long paste", () => {
    const digest = parseTranscript(
      line("user", "* Always use a deterministic kernel for execution decisions."),
    );
    expect(digest.directives).toHaveLength(0);
  });

  it("ignores a sentence carrying a link", () => {
    const digest = parseTranscript(
      line("user", "You should always use https://milvus.io/ for the vector store."),
    );
    expect(digest.directives).toHaveLength(0);
  });

  it("keeps mining a long message he genuinely wrote as prose", () => {
    const prose =
      "I have been thinking about where this goes next and I want to be clear about how we work together. " +
      "The benchmark matters more than the architecture diagrams we keep collecting from other people. " +
      "Always measure a change before we claim it improved anything. " +
      "I would rather ship one verified improvement than five plausible ones. ".repeat(3);
    const digest = parseTranscript(line("user", prose));
    expect(digest.directives.length).toBeGreaterThan(0);
  });
});

describe("harness feedback is not the user either", () => {
  const CASES: [string, string][] = [
    ["a git stop-hook", "[~/.claude/stop-hook-git-check.sh]: There are uncommitted changes in the repository. Please always commit and push."],
    ["a hook success banner", "Stop hook feedback: never leave the tree dirty, always push before finishing."],
    ["a task notification", "<task-notification><task-id>abc</task-id></task-notification> always report the result."],
    ["a system notification", "SYSTEM NOTIFICATION - NOT USER INPUT. You must always treat this as automated."],
  ];
  for (const [label, text] of CASES) {
    it(`ignores ${label}`, () => {
      const digest = parseTranscript(line("user", text));
      expect(digest.directives).toHaveLength(0);
      expect(digest.corrections).toHaveLength(0);
    });
  }
});
