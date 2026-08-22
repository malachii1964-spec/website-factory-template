import type { KeyObject } from "node:crypto";
import { canonicalize } from "../crypto/canonical";
import { fingerprintOf, signBytes, verifyBytes } from "../crypto/signing";
import type { Constitution } from "../trust/constitution";
import { InvalidRequestError, TrustBoundaryViolation } from "../trust/errors";

/**
 * Receipts replace booleans. Section 38 forbids `approvedBySuperUser = true` and
 * section 51 forbids `recordOutcome(id, true)`: in both cases the caller was
 * asserting the very thing the system needed to establish independently.
 */

export interface ApprovalReceiptBody {
  readonly version: 1;
  readonly approvalId: string;
  readonly action: string;
  readonly resourceId: string;
  readonly targetState: string;
  readonly scope: string;
  /** Binds the approval to exact content — approving a memory, not a name. */
  readonly objectHash: string;
  readonly nonce: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly signerFingerprint: string;
}

export interface SignedApprovalReceipt extends ApprovalReceiptBody {
  readonly signatureBase64: string;
}

export function signApprovalReceipt(
  body: ApprovalReceiptBody,
  privateKey: KeyObject,
): SignedApprovalReceipt {
  return { ...body, signatureBase64: signBytes(canonicalize(body), privateKey) };
}

/** Single-use nonce ledger. Without it a captured receipt is reusable forever. */
export class NonceLedger {
  readonly #used = new Set<string>();
  consume(nonce: string): void {
    if (this.#used.has(nonce)) {
      throw new TrustBoundaryViolation(`approval nonce replayed: ${nonce}`, ["nonce"]);
    }
    this.#used.add(nonce);
  }
  has(nonce: string): boolean {
    return this.#used.has(nonce);
  }
}

export interface ApprovalBinding {
  readonly action: string;
  readonly resourceId: string;
  readonly targetState: string;
  readonly objectHash: string;
}

export class ApprovalVerifier {
  constructor(
    private readonly constitution: Constitution,
    private readonly nonces: NonceLedger,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Verifies a receipt AND that it is the receipt for *this* action on *this*
   * content. A valid signature over some other memory is not an approval here.
   */
  verify(receipt: SignedApprovalReceipt, binding: ApprovalBinding): void {
    if (receipt.version !== 1) {
      throw new TrustBoundaryViolation(`unsupported approval version: ${receipt.version}`);
    }

    const publicKey = this.constitution.rootPublicKeys.get(receipt.signerFingerprint);
    if (!publicKey) {
      throw new TrustBoundaryViolation(
        `approval signed by non-root key: ${receipt.signerFingerprint}`,
        ["signerFingerprint"],
      );
    }
    // Defence in depth: the fingerprint is claimed in the signed body, so verify
    // it actually names the key we are about to check against.
    if (fingerprintOf(publicKey) !== receipt.signerFingerprint) {
      throw new TrustBoundaryViolation("root key fingerprint mismatch");
    }

    const { signatureBase64, ...body } = receipt;
    if (!verifyBytes(canonicalize(body), signatureBase64, publicKey)) {
      throw new TrustBoundaryViolation("approval signature invalid", ["signatureBase64"]);
    }

    const now = this.now();
    const skew = this.constitution.clockSkewToleranceMs;
    if (receipt.issuedAt - skew > now) {
      throw new TrustBoundaryViolation("approval issued in the future");
    }
    if (receipt.expiresAt <= receipt.issuedAt) {
      throw new TrustBoundaryViolation("approval expires before it is issued");
    }
    if (receipt.expiresAt - receipt.issuedAt > this.constitution.maxApprovalLifetimeMs) {
      throw new TrustBoundaryViolation("approval lifetime exceeds constitutional maximum");
    }
    if (now > receipt.expiresAt) {
      throw new TrustBoundaryViolation("approval expired");
    }

    if (
      receipt.action !== binding.action ||
      receipt.resourceId !== binding.resourceId ||
      receipt.targetState !== binding.targetState ||
      receipt.objectHash !== binding.objectHash
    ) {
      throw new TrustBoundaryViolation("approval does not bind to the requested action");
    }

    this.nonces.consume(receipt.nonce);
  }
}

export type OutcomeResult = "success" | "failure";

export interface OutcomeReceiptBody {
  readonly receiptId: string;
  readonly kind: "outcome" | "regression" | "review";
  readonly objectiveId: string;
  readonly workOrderId: string;
  readonly executionId: string;
  readonly workerId: string;
  readonly result: OutcomeResult;
  readonly outputHash: string;
  readonly evidenceIds: readonly string[];
  readonly timestamp: number;
  readonly signerFingerprint: string;
}

export interface SignedOutcomeReceipt extends OutcomeReceiptBody {
  readonly signatureBase64: string;
}

export function signOutcomeReceipt(
  body: OutcomeReceiptBody,
  privateKey: KeyObject,
): SignedOutcomeReceipt {
  return { ...body, signatureBase64: signBytes(canonicalize(body), privateKey) };
}

/** Public keys of workers permitted to attest that work actually ran. */
export class WorkerKeyRegistry {
  readonly #keys = new Map<string, KeyObject>();

  register(publicKey: KeyObject): string {
    const fingerprint = fingerprintOf(publicKey);
    this.#keys.set(fingerprint, publicKey);
    return fingerprint;
  }

  get(fingerprint: string): KeyObject | undefined {
    return this.#keys.get(fingerprint);
  }
}

export class OutcomeVerifier {
  constructor(private readonly workers: WorkerKeyRegistry) {}

  verify(receipt: SignedOutcomeReceipt): void {
    const publicKey = this.workers.get(receipt.signerFingerprint);
    if (!publicKey) {
      throw new TrustBoundaryViolation(
        `outcome receipt signed by unregistered worker: ${receipt.signerFingerprint}`,
      );
    }
    const { signatureBase64, ...body } = receipt;
    if (!verifyBytes(canonicalize(body), signatureBase64, publicKey)) {
      throw new TrustBoundaryViolation("outcome receipt signature invalid");
    }
    if (receipt.evidenceIds.length === 0) {
      throw new InvalidRequestError("outcome receipt cites no evidence");
    }
  }
}
