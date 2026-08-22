import { generateSuperUserKeyPair, signSuperUserApproval, SuperUserKeyRegistry, ApprovalNonceLedger } from "../src/superUserApproval.js";
import type { SuperUserApproval } from "../src/superUserApproval.js";
import type { MemoryMaturity, MemoryRecord, PromotionInput } from "../src/memoryTypes.js";

/** A Super-User whose public key is registered, plus the private key to sign with. */
export function superUser(keyId = "su-key-1") {
  const { publicKey, privateKey } = generateSuperUserKeyPair();
  const keyRegistry = new SuperUserKeyRegistry();
  keyRegistry.register(keyId, publicKey);
  const nonces = new ApprovalNonceLedger();
  let counter = 0;

  function approve(
    record: Pick<MemoryRecord, "id" | "statement">,
    target: MemoryMaturity,
    overrides: Partial<{
      regressionTestIds: string[];
      validUntil: string;
      approvedAt: string;
      challengeNonce: string;
      approvedBy: string;
    }> = {},
  ): SuperUserApproval {
    counter += 1;
    return signSuperUserApproval(
      record,
      target,
      {
        approvedBy: overrides.approvedBy ?? "superuser:owner",
        approvedAt: overrides.approvedAt ?? new Date("2026-08-22T19:00:00Z").toISOString(),
        regressionTestIds: overrides.regressionTestIds ?? ["test_env_gate"],
        challengeNonce: overrides.challengeNonce ?? `nonce-${counter}`,
        validUntil: overrides.validUntil ?? new Date("2099-01-01T00:00:00Z").toISOString(),
        keyId,
      },
      privateKey,
    );
  }

  function input(approval?: SuperUserApproval, now?: Date): PromotionInput {
    return {
      ...(approval ? { superUserApproval: approval } : {}),
      keyRegistry,
      nonces,
      ...(now ? { now } : {}),
    };
  }

  return { keyId, publicKey, privateKey, keyRegistry, nonces, approve, input };
}
