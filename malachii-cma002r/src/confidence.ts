import type { ConfidenceOverride, ConfidenceRecord, ExecutionMode } from "./types.js";

export function createConfidence(derived: number, perDimension: Record<string, number>, evidenceIds: string[], now = new Date()): ConfidenceRecord {
  if (derived < 0 || derived > 1) throw new Error("derived confidence must be 0..1");
  return Object.freeze({ derived, perDimension: Object.freeze({...perDimension}), evidenceIds: Object.freeze([...evidenceIds]), generatedAt: now.toISOString() });
}

export function createOverride(actor: string, reason: string, opts: {value?: number; routeMode?: ExecutionMode}, now = new Date()): ConfidenceOverride {
  if (opts.value !== undefined && (opts.value < 0 || opts.value > 1)) throw new Error("override value must be 0..1");
  return { ...opts, actor, reason, timestamp: now.toISOString() };
}
