// Structured output over "output ONLY raw code, no markdown" — the latter is a
// prompt, not a contract, and fails silently. `strict: true` guarantees
// tool_use.input validates against this schema before the harness ever sees it.
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const proposePatchTool: Anthropic.Tool = {
  name: "propose_patch",
  description:
    "Propose a minimal, verifiable patch for the diagnosed layout defect. Ground every claim in the supplied geometry JSON — never invent a selector that is absent from it.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["diagnosis", "root_cause_selector", "edits", "assertion"],
    properties: {
      diagnosis: { type: "string", description: "One or two sentences: what is wrong and why." },
      root_cause_selector: { type: "string", description: "The selector from the geometry JSON responsible for the defect." },
      edits: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["file", "find", "replace", "rationale"],
          properties: {
            file: { type: "string", description: "Repo-relative path." },
            find: { type: "string", description: "Exact existing text to locate (must be unique in the file)." },
            replace: { type: "string", description: "Replacement text." },
            rationale: { type: "string" },
          },
        },
      },
      assertion: {
        type: "string",
        description: "A Playwright expression that is FALSE before this patch and TRUE after it. Required — no assertion, no ship.",
      },
    },
  },
};

// Defense in depth: the SDK JSON-parses tool_use.input for us, but we still
// validate the parsed object against our own contract before trusting it —
// `strict: true` constrains the API's output, not what a future model version
// might someday emit outside that guarantee.
export const proposedPatchSchema = z.object({
  diagnosis: z.string().min(1),
  root_cause_selector: z.string().min(1),
  edits: z
    .array(
      z.object({
        file: z.string().min(1),
        find: z.string().min(1),
        replace: z.string(),
        rationale: z.string().min(1),
      }),
    )
    .min(1),
  assertion: z.string().min(1),
});

export function parsePatchToolInput(input: unknown) {
  const parsed = proposedPatchSchema.parse(input);
  return {
    diagnosis: parsed.diagnosis,
    rootCauseSelector: parsed.root_cause_selector,
    edits: parsed.edits,
    assertion: parsed.assertion,
  };
}
