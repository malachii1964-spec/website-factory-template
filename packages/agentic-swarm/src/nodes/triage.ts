// Cheapest model that can do the job (MALACHII Kernel §10). Triage only needs
// to extract a route and a severity signal from free text — Haiku, not Opus.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { IncomingEvent } from "../types.js";

const triageResultSchema = z.object({
  isLayoutDefect: z.boolean(),
  severity: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});
export type TriageResult = z.infer<typeof triageResultSchema>;

const triageTool: Anthropic.Tool = {
  name: "classify_report",
  description: "Classify an incoming bug report.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["isLayoutDefect", "severity", "summary"],
    properties: {
      isLayoutDefect: { type: "boolean" },
      severity: { type: "string", enum: ["low", "medium", "high"] },
      summary: { type: "string" },
    },
  },
};

export async function triage(event: IncomingEvent, client = new Anthropic()): Promise<TriageResult> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: "Classify whether the report describes a visual/layout defect (vs. a backend, auth, or data bug) and estimate severity.",
    tools: [triageTool],
    tool_choice: { type: "tool", name: "classify_report" },
    messages: [{ role: "user", content: `Route: ${event.route}\nReport: ${event.customerText}` }],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "classify_report");
  if (!toolUse) throw new Error(`triage: expected classify_report tool_use, got stop_reason=${response.stop_reason}`);
  return triageResultSchema.parse(toolUse.input);
}
