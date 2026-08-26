// Pure geometry math, deliberately separated from capture.ts so it runs (and is
// tested) in plain Node — no browser required. This is the fix for the design
// flaw where a vision model was asked to judge "do these two elements overlap"
// from a screenshot. Overlap is arithmetic; a getBoundingClientRect() comparison
// is authoritative and a model is not — the model's job is to say WHY it matters,
// not to compute WHETHER it happened.
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GeometryEntry {
  selector: string;
  rect: Rect;
  computed: Record<string, string>;
  /** Ancestor selectors — used to exclude parent/child containment from the overlap set. */
  ancestors: string[];
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function findOverlaps(entries: GeometryEntry[]): Array<[string, string]> {
  const overlaps: Array<[string, string]> = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!;
      const b = entries[j]!;
      const nested = a.ancestors.includes(b.selector) || b.ancestors.includes(a.selector);
      if (nested) continue;
      if (rectsIntersect(a.rect, b.rect)) overlaps.push([a.selector, b.selector]);
    }
  }
  return overlaps;
}
