import { createHash, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import type { MemoryMaturity, MemoryRecord } from "./memoryTypes.js";

/**
 * SUAF §2.3 and §3 — the Super-User approval object that retires
 * `approvedBySuperUser`.
 *
 * Why the boolean had to go, and why a ledger event was not enough: the
 * previous design anchored approval to an EventLedger entry, but any caller
 * holding a fabric handle could append that entry itself. Anchoring an
 * authority decision to a log that accepts anonymous writes is a boolean with
 * extra steps. An approval has to be something the caller *cannot manufacture*,
 * which means a signature over an exact payload by a key the caller does not
 * hold.
 *
 * Scope, stated plainly: this proves the holder of a registered Super-User
 * private key endorsed these exact bytes. It does not prove a human was
 * present. That is what §3's hardware path (YubiKey touch / TPM) buys, and it
 * is deliberately not implemented here -- SUAF §8 step 6 says do not add
 * hardware until §§2 and 7 pass.
 */

export const APPROVAL_PAYLOAD_SCHEMA = "malachii.memf.superuser-approval-payload.v1";

/** The exact bytes that get signed (§3). */
export interface SuperUserApprovalPayload {
  schema: typeof APPROVAL_PAYLOAD_SCHEMA;
  memoryId: string;
  targetMaturity: MemoryMaturity;
  /** sha256 of the statement, so an approval cannot survive the rule changing. */
  proposedRuleHash: string;
  regressionTestIds: string[];
  approvedBy: string;
  approvedAt: string;
  challengeNonce: string;
}

/** SUAF §2.3. `payloadHash`, `signature`, `algorithm`, `keyId`, `validUntil` and
 *  `challengeNonce` are optional in the spec's interface but required in
 *  practice: an approval missing any of them cannot be verified, and an
 *  unverifiable approval is refused rather than downgraded. */
export interface SuperUserApproval {
  approvedBy: string;
  approvedAt: string;
  regressionTestIds: string[];
  rationale?: string;
  payloadHash: string;
  signature: string;
  algorithm: "ed25519";
  keyId: string;
  validUntil: string;
  challengeNonce: string;
}

export interface ApprovalVerdict {
  valid: boolean;
  reason: string;
}

/** Deterministic serialisation; two structurally equal payloads always hash alike. */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number_in_payload");
    return JSON.stringify(value === 0 ? 0 : value);
  }
  if (Array.isArray(value)) return `[${value.map(v => canonicalJson(v)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  throw new Error("unserialisable_payload_value");
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function ruleHashOf(record: Pick<MemoryRecord, "statement">): string {
  return sha256Hex(record.statement.trim());
}

/**
 * Registry of Super-User public keys. Lives in portable state (§3) and is the
 * only thing that turns a signature into authority. Nothing inside MEMF may add
 * to it at runtime -- registering a key is a deploy-time act, which is what
 * keeps "memory never creates authority" (§0 law 1) true.
 */
export class SuperUserKeyRegistry {
  readonly #keys = new Map<string, KeyObject>();

  register(keyId: string, publicKey: KeyObject | string): void {
    this.#keys.set(keyId, typeof publicKey === "string" ? createPublicKey(publicKey) : publicKey);
  }

  get(keyId: string): KeyObject | undefined {
    return this.#keys.get(keyId);
  }

  get size(): number {
    return this.#keys.size;
  }
}

/** Single-use nonce ledger. Without it, one captured approval is reusable forever. */
export class ApprovalNonceLedger {
  readonly #used = new Set<string>();
  isUsed(nonce: string): boolean {
    return this.#used.has(nonce);
  }
  consume(nonce: string): void {
    this.#used.add(nonce);
  }
}

export function buildApprovalPayload(
  record: Pick<MemoryRecord, "id" | "statement">,
  targetMaturity: MemoryMaturity,
  approval: Pick<
    SuperUserApproval,
    "approvedBy" | "approvedAt" | "regressionTestIds" | "challengeNonce"
  >,
): SuperUserApprovalPayload {
  return {
    schema: APPROVAL_PAYLOAD_SCHEMA,
    memoryId: record.id,
    targetMaturity,
    proposedRuleHash: ruleHashOf(record),
    regressionTestIds: [...approval.regressionTestIds].sort(),
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    challengeNonce: approval.challengeNonce,
  };
}

/**
 * Verifies an approval against *this* memory at *this* target. Every check that
 * can fail returns a named reason: a promotion denial has to be explainable to
 * the Super-User who is being told their approval was rejected.
 */
export function verifySuperUserApproval(
  approval: SuperUserApproval | undefined,
  record: Pick<MemoryRecord, "id" | "statement">,
  targetMaturity: MemoryMaturity,
  registry: SuperUserKeyRegistry,
  nonces: ApprovalNonceLedger,
  now: Date = new Date(),
): ApprovalVerdict {
  if (!approval) return { valid: false, reason: "super_user_approval_absent" };
  if (approval.algorithm !== "ed25519") {
    return { valid: false, reason: "unsupported_approval_algorithm" };
  }
  // §2.3 rule 2: at least one regression test must be named.
  if (!Array.isArray(approval.regressionTestIds) || approval.regressionTestIds.length < 1) {
    return { valid: false, reason: "approval_names_no_regression_test" };
  }

  const key = registry.get(approval.keyId);
  if (!key) return { valid: false, reason: "approval_key_not_registered" };

  const expiry = Date.parse(approval.validUntil);
  if (!Number.isFinite(expiry)) return { valid: false, reason: "approval_validUntil_invalid" };
  // §7 test 9.
  if (now.getTime() > expiry) return { valid: false, reason: "approval_expired" };

  if (nonces.isUsed(approval.challengeNonce)) {
    return { valid: false, reason: "approval_nonce_replayed" };
  }

  // The payload is rebuilt from the *record*, never from the approval's own
  // claims about which memory it covers. That is what makes an approval for
  // memory A fail on memory B (§7 test 8), and what makes an approval stop
  // verifying the moment the statement it approved is edited.
  const payload = buildApprovalPayload(record, targetMaturity, approval);
  const canonical = canonicalJson(payload);
  const expectedHash = sha256Hex(canonical);
  if (approval.payloadHash !== expectedHash) {
    return { valid: false, reason: "approval_payload_hash_mismatch" };
  }

  let signatureOk = false;
  try {
    signatureOk = verify(null, Buffer.from(canonical, "utf8"), key, Buffer.from(approval.signature, "base64"));
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) return { valid: false, reason: "approval_signature_invalid" };

  return { valid: true, reason: "super_user_approval_verified" };
}

/**
 * Signing helper. Production keeps the private key on a YubiKey/TPM (§3) and
 * this function never sees it; it exists so tests and dev flows can mint real
 * signatures instead of stubbing verification out.
 */
export function signSuperUserApproval(
  record: Pick<MemoryRecord, "id" | "statement">,
  targetMaturity: MemoryMaturity,
  fields: {
    approvedBy: string;
    approvedAt: string;
    regressionTestIds: string[];
    challengeNonce: string;
    validUntil: string;
    keyId: string;
    rationale?: string;
  },
  privateKey: KeyObject,
): SuperUserApproval {
  const payload = buildApprovalPayload(record, targetMaturity, fields);
  const canonical = canonicalJson(payload);
  return {
    approvedBy: fields.approvedBy,
    approvedAt: fields.approvedAt,
    regressionTestIds: [...fields.regressionTestIds].sort(),
    ...(fields.rationale ? { rationale: fields.rationale } : {}),
    payloadHash: sha256Hex(canonical),
    signature: sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64"),
    algorithm: "ed25519",
    keyId: fields.keyId,
    validUntil: fields.validUntil,
    challengeNonce: fields.challengeNonce,
  };
}

export function generateSuperUserKeyPair(): { publicKey: KeyObject; privateKey: KeyObject } {
  return generateKeyPairSync("ed25519");
}
