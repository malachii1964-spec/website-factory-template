/**
 * Caller-supplied trust fields are refused, not ignored.
 *
 * `createMemory` already forces M0 and `promotionDecision` derives every count,
 * so a caller that sends `maturity` or `independentSourceCount` gets no benefit
 * from it today. But silently dropping the field means a probe and a well-formed
 * request look identical in the logs, and the caller learns nothing about the
 * boundary it just hit. Refusing turns an invisible attempt into a recorded one.
 */

export class TrustBoundaryViolation extends Error {
  readonly code = "TRUST_BOUNDARY_VIOLATION";
  readonly offendingFields: readonly string[];
  constructor(label: string, offendingFields: readonly string[]) {
    super(`${label} carried caller-supplied trust-bearing field(s): ${offendingFields.join(", ")}`);
    this.name = "TrustBoundaryViolation";
    this.offendingFields = offendingFields;
  }
}

/** SUAF §32-equivalent: fields that carry trust and may never arrive from a caller. */
export const FORBIDDEN_TRUST_FIELDS: readonly string[] = Object.freeze([
  "approvedBySuperUser",
  "attested",
  "authorityTier",
  "contradictionCount",
  "effectiveMaturity",
  "failedUseCount",
  "fitness",
  "independentSourceCount",
  "maturity",
  "raisesAuthority",
  "regressionPassed",
  "successfulUseCount",
  "supportingEvidenceCount",
  "trustTier",
  "trustOverride",
  "trust_override",
  "trusted",
  "verified",
]);

const FORBIDDEN = new Set(FORBIDDEN_TRUST_FIELDS);

/** Walks the whole payload: a forbidden key nested three levels down is the same attempt. */
export function assertNoTrustBearingFields(payload: unknown, label = "request"): void {
  const found: string[] = [];
  scan(payload, "", found, new Set());
  if (found.length) throw new TrustBoundaryViolation(label, found);
}

function scan(value: unknown, path: string, found: string[], seen: Set<object>): void {
  if (value === null || typeof value !== "object") return;
  const obj = value as object;
  if (seen.has(obj)) return;
  seen.add(obj);

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => scan(item, `${path}[${i}]`, found, seen));
    return;
  }
  for (const [key, child] of Object.entries(obj as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key;
    if (FORBIDDEN.has(key)) found.push(here);
    scan(child, here, found, seen);
  }
}
