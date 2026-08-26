// MALACHII Quality Floor (Kernel §11): true quality is the MINIMUM of seven
// dimensions, never an average — a beautiful patch that fails "Verification"
// (no passing assertion) does not ship no matter how high the other six score.
export interface QualityScores {
  accuracy: number;
  verification: number;
  completeness: number;
  intentAlignment: number;
  executionReadiness: number;
  structure: number;
  edgeCases: number;
}

export function qualityFloor(s: QualityScores): number {
  return Math.min(
    s.accuracy,
    s.verification,
    s.completeness,
    s.intentAlignment,
    s.executionReadiness,
    s.structure,
    s.edgeCases,
  );
}

export function polish(s: QualityScores): number {
  const v = Object.values(s);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function shipDecision(
  s: QualityScores,
  threshold = 7,
  hardGates: Record<string, boolean> = {},
): { ship: boolean; floor: number; failedGates: string[] } {
  const failedGates = Object.entries(hardGates)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);
  const floor = qualityFloor(s);
  return { ship: floor >= threshold && failedGates.length === 0, floor, failedGates };
}
