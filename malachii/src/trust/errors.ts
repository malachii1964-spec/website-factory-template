/** Every rejection the kernel performs is a named, catchable failure. */

export class TrustBoundaryViolation extends Error {
  override readonly name = "TrustBoundaryViolation";
  readonly code = "TRUST_BOUNDARY_VIOLATION";
  readonly offendingFields: readonly string[];

  constructor(message: string, offendingFields: readonly string[] = []) {
    super(message);
    this.offendingFields = offendingFields;
  }
}

export class AuthorizationError extends Error {
  override readonly name = "AuthorizationError";
  readonly code = "AUTHORIZATION_DENIED";
}

export class InvalidRequestError extends Error {
  override readonly name = "InvalidRequestError";
  readonly code = "INVALID_REQUEST";
}

export class LedgerIntegrityError extends Error {
  override readonly name = "LedgerIntegrityError";
  readonly code = "LEDGER_INTEGRITY_FAILURE";
}

export class ReconciliationError extends Error {
  override readonly name = "ReconciliationError";
  readonly code = "RECONCILIATION_DIVERGENCE";
  readonly divergentMemoryIds: readonly string[];

  constructor(message: string, divergentMemoryIds: readonly string[] = []) {
    super(message);
    this.divergentMemoryIds = divergentMemoryIds;
  }
}
