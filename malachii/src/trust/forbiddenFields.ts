import { TrustBoundaryViolation } from "./errors";

/**
 * Section 32 of the spec: fields that carry trust. An untrusted caller (T0) may
 * never supply any of these, on any request, at any depth.
 *
 * The kernel rejects rather than strips. Stripping teaches a caller nothing and
 * turns a probe into a silent no-op, so a poisoning attempt looks identical to
 * a well-formed request in the logs.
 */
export const FORBIDDEN_TRUST_FIELDS = Object.freeze([
  "approvedBySuperUser",
  "assurance",
  "attested",
  "authorityTier",
  "contradictionCount",
  "effectiveMaturity",
  "failedUseCount",
  "independentSourceCount",
  "maturity",
  "raisesAuthority",
  "regressionPassed",
  "successfulUseCount",
  "supportingEvidenceCount",
  "trustTier",
  "trust_override",
  "trusted",
  "trustOverride",
  "verified",
] as const);

const FORBIDDEN = new Set<string>(FORBIDDEN_TRUST_FIELDS);

/**
 * Walks the whole payload, not just its top level: a forbidden key nested inside
 * `relations[0].meta` is the same escalation attempt as one at the root.
 */
export function assertNoTrustBearingFields(payload: unknown, label = "request"): void {
  const found: string[] = [];
  scan(payload, "", found, new Set());
  if (found.length > 0) {
    throw new TrustBoundaryViolation(
      `${label} carried caller-supplied trust-bearing field(s): ${found.join(", ")}`,
      found,
    );
  }
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
