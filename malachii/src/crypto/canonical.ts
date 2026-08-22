/**
 * Deterministic serialisation. Every hash and every signature in the kernel is
 * taken over the output of `canonicalize`, so two structurally identical values
 * always produce the same bytes regardless of key insertion order.
 *
 * Rejects values that have no stable representation (undefined, NaN, functions,
 * cycles) rather than silently dropping them — a dropped field is a field an
 * attacker can smuggle past a signature check.
 */

export class CanonicalizationError extends Error {
  override readonly name = "CanonicalizationError";
}

export type CanonicalValue =
  | string
  | number
  | boolean
  | null
  | CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

export function canonicalize(value: unknown): string {
  return write(value, new Set());
}

function write(value: unknown, seen: Set<object>): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new CanonicalizationError(`non-finite number: ${String(value)}`);
      }
      // Normalise -0 so it cannot produce a second encoding of the same value.
      return JSON.stringify(value === 0 ? 0 : value);
    case "object":
      break;
    default:
      throw new CanonicalizationError(`unserialisable type: ${typeof value}`);
  }

  const obj = value as object;
  if (seen.has(obj)) throw new CanonicalizationError("cycle detected");
  seen.add(obj);
  try {
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => write(item, seen)).join(",")}]`;
    }
    const entries = Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const body = entries
      .map(([k, v]) => `${JSON.stringify(k)}:${write(v, seen)}`)
      .join(",");
    return `{${body}}`;
  } finally {
    seen.delete(obj);
  }
}
