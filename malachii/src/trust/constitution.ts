import type { KeyObject } from "node:crypto";
import { fingerprintOf } from "../crypto/signing.ts";

/**
 * The constitution is the small set of facts the kernel refuses to learn at
 * runtime: which public keys count as root, and where the promotion thresholds
 * sit. Nothing inside the system may edit it — changing it is a deploy, which
 * is exactly the point of section 27's T2 boundary.
 */
export interface Constitution {
  /** Fingerprints of public keys whose signatures count as Super-User approval. */
  readonly rootKeyFingerprints: ReadonlySet<string>;
  readonly rootPublicKeys: ReadonlyMap<string, KeyObject>;
  /** Independent evidence roots required for M2_CORROBORATED. */
  readonly corroborationThreshold: number;
  /** Maximum lifetime honoured on an approval receipt, in milliseconds. */
  readonly maxApprovalLifetimeMs: number;
  /** Tolerance for a receipt issued slightly ahead of local time. */
  readonly clockSkewToleranceMs: number;
}

export interface ConstitutionInput {
  readonly rootPublicKeys: readonly KeyObject[];
  readonly corroborationThreshold?: number;
  readonly maxApprovalLifetimeMs?: number;
  readonly clockSkewToleranceMs?: number;
}

export function defineConstitution(input: ConstitutionInput): Constitution {
  const keys = new Map<string, KeyObject>();
  for (const key of input.rootPublicKeys) {
    keys.set(fingerprintOf(key), key);
  }
  return Object.freeze({
    rootKeyFingerprints: new Set(keys.keys()),
    rootPublicKeys: keys,
    corroborationThreshold: input.corroborationThreshold ?? 2,
    maxApprovalLifetimeMs: input.maxApprovalLifetimeMs ?? 15 * 60_000,
    clockSkewToleranceMs: input.clockSkewToleranceMs ?? 30_000,
  });
}
