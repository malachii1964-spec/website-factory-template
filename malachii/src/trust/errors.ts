/** Every rejection the kernel performs is a named, catchable failure. */

export class TrustBoundaryViolation extends Error {
  override readonly name = "TrustBoundaryViolation";
  readonly code = "TRUST_BOUNDARY_VIOLATION";
  constructor(
    message: string,
    readonly offendingFields: readonly string[] = [],
  ) {
    super(message);
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
  constructor(
    message: string,
    readonly divergentMemoryIds: readonly string[] = [],
  ) {
    super(message);
  }
}
