// Independent verification: a fresh call that has not seen the diagnose node's
// reasoning trace, deliberately on a different model tier (Sonnet, not Opus) so
// its blind spots don't correlate 1:1 with the model that wrote the patch.
// Scores the MALACHII seven dimensions, but the two facts that matter most —
// did the assertion flip, did the build pass — are computed in CODE and passed
// in as hard gates. A model's optimism can never overrule an objective failure
// (Kernel §11: "Critical binary gates may prevent shipment even when scores are high").
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ProposedPatch, SandboxResult, VisualEvidence } from "../types.js";
import type { QualityScores } from "../governance/quality.js";
import { shipDecision } from "../governance/quality.js";

const scoresSchema = z.object({
  accuracy: z.number().min(1).max(10),
  verification: z.number().min(1).max(10),
  completeness: z.number().min(1).max(10),
  intentAlignment: z.number().min(1).max(10),
  executionReadiness: z.number().min(1).max(10),
  structure: z.number().min(1).max(10),
  edgeCases: z.number().min(1).max(10),
});

const scoreTool: Anthropic.Tool = {
  name: "score_quality",
  description: "Score the patch against the seven MALACHII Quality Floor dimensions, 1-10 each, with brief evidence per score.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["accuracy", "verification", "completeness", "intentAlignment", "executionReadiness", "structure", "edgeCases", "criticalVulnerability"],
    properties: {
      accuracy: { type: "integer", minimum: 1, maximum: 10 },
      verification: { type: "integer", minimum: 1, maximum: 10 },
      completeness: { type: "integer", minimum: 1, maximum: 10 },
      intentAlignment: { type: "integer", minimum: 1, maximum: 10 },
      executionReadiness: { type: "integer", minimum: 1, maximum: 10 },
      structure: { type: "integer", minimum: 1, maximum: 10 },
      edgeCases: { type: "integer", minimum: 1, maximum: 10 },
      criticalVulnerability: { type: "string", description: "The single most important remaining risk, one sentence." },
    },
  },
};

export interface VerifyInput {
  patch: ProposedPatch;
  sandboxResult: SandboxResult;
  evidence: VisualEvidence;
}

export interface VerifyOutput {
  scores: QualityScores;
  criticalVulnerability: string;
  ship: boolean;
  floor: number;
  failedGates: string[];
}

export async function verify(input: VerifyInput, client = new Anthropic()): Promise<VerifyOutput> {
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system:
      "You are an adversarial reviewer scoring a code patch you did not write. Score honestly — do not inflate scores to be agreeable. True quality is the MINIMUM dimension, not the average, so a single weak dimension should read as weak.",
    tools: [scoreTool],
    tool_choice: { type: "tool", name: "score_quality" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Diagnosis: ${input.patch.diagnosis}` },
          { type: "text", text: `Edits:\n${JSON.stringify(input.patch.edits, null, 2)}` },
          { type: "text", text: `Assertion: ${input.patch.assertion}` },
          { type: "text", text: `Sandbox result: exitCode=${input.sandboxResult.exitCode} assertionPassed=${input.sandboxResult.assertionPassed}\n${input.sandboxResult.logs}` },
          { type: "text", text: `Original defect evidence: ${JSON.stringify({ overlaps: input.evidence.overlaps, consoleErrors: input.evidence.consoleErrors })}` },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "score_quality");
  if (!toolUse) throw new Error(`verify: expected score_quality tool_use, got stop_reason=${response.stop_reason}`);

  const raw = toolUse.input as Record<string, unknown>;
  const scores = scoresSchema.parse(raw);
  const criticalVulnerability = z.string().parse(raw.criticalVulnerability);

  // Hard gates computed from fact, not model opinion.
  const hardGates = {
    sandbox_build_passed: input.sandboxResult.exitCode === 0,
    assertion_passed: input.sandboxResult.assertionPassed === true,
    diff_non_empty: Boolean(input.sandboxResult.diff && input.sandboxResult.diff.trim().length > 0),
  };

  const decision = shipDecision(scores, 7, hardGates);
  return { scores, criticalVulnerability, ...decision };
}
