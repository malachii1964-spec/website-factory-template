import type { TrustDomain } from "./types.js";

const rank: Record<TrustDomain, number> = {
  HOST_POLICY: 80,
  MALACHII_POLICY: 70,
  SUPER_USER_INSTRUCTION: 60,
  PROJECT_INSTRUCTION: 50,
  AGENT_MESSAGE: 20,
  TOOL_OUTPUT: 10,
  RETRIEVED_CONTENT: 5,
  UNTRUSTED_EXTERNAL_CONTENT: 0,
};

export function mayDirectPolicy(source: TrustDomain): boolean { return rank[source] >= rank.PROJECT_INSTRUCTION; }
export function mayOverride(source: TrustDomain, target: TrustDomain): boolean { return rank[source] >= rank[target] && mayDirectPolicy(source); }
export function assertNotInstruction(source: TrustDomain): void {
  if (!mayDirectPolicy(source)) return;
}
