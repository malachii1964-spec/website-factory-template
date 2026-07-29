import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

/**
 * The reasoning organ.
 *
 * Everything here is optional: with no API key the brain still remembers,
 * recalls, and scores — it just distills lessons with heuristics instead of
 * judgement. Nothing in the kernel may hard-depend on this module succeeding.
 */

export function hasClaude(): boolean {
  return Boolean(process.env["ANTHROPIC_API_KEY"] ?? process.env["ANTHROPIC_AUTH_TOKEN"]);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export interface StructuredRequest<T> {
  model: string;
  system: string;
  prompt: string;
  /** JSON Schema the response is constrained to. Must set `additionalProperties: false`. */
  jsonSchema: Record<string, unknown>;
  /** Parsed and validated against this before anything downstream sees it. */
  schema: z.ZodType<T>;
  maxTokens?: number;
  /** `low` is right for extraction; raise it for synthesis. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

/**
 * Ask Claude for a typed answer. Returns `null` on refusal, malformed output,
 * or any transport failure — callers fall back to their heuristic path rather
 * than propagating an exception into a background hook.
 */
export async function structured<T>(request: StructuredRequest<T>): Promise<T | null> {
  if (!hasClaude()) return null;
  try {
    const response = await getClient().messages.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 8000,
      system: request.system,
      output_config: {
        effort: request.effort ?? "low",
        format: { type: "json_schema", schema: request.jsonSchema },
      },
      messages: [{ role: "user", content: request.prompt }],
    });

    // Claude Opus 5 can decline a request outright; that arrives as a 200.
    if (response.stop_reason === "refusal") return null;

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (!text.trim()) return null;

    const parsed = request.schema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
