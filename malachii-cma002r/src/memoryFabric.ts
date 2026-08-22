import { randomUUID } from "node:crypto";
import type { StateStore } from "./durableState.js";
import { EventLedger } from "./eventLedger.js";
import { learningDisposition } from "./projectLearning.js";
import {
  ApprovalNonceLedger,
  SuperUserKeyRegistry,
  verifySuperUserApproval,
} from "./superUserApproval.js";
import type { SuperUserApproval } from "./superUserApproval.js";
import { PERMISSIVE_LINEAGE, SourceLineageRegistry } from "./sourceLineage.js";
import { assertNoTrustBearingFields } from "./trustBoundary.js";
import { authorityFieldsOf, replayMemoryState, type ReconciliationReport } from "./memoryReplay.js";
import type {
  CreateMemoryInput,
  FailureLearningInput,
  LearningProposal,
  MemoryConflict,
  MemoryMaturity,
  MemoryOutcomeLink,
  MemoryQuery,
  MemoryRecord,
  PromotionDecision,
  PromotionEvidence,
  PromotionInput,
  DerivedPromotionFacts,
  RetrievedMemory,
} from "./memoryTypes.js";

const MEMORY_NS = "memf_memory";
const LEARNING_NS = "memf_learning";
const MATURITY_ORDER: readonly MemoryMaturity[] = [
  "M0_OBSERVATION",
  "M1_CANDIDATE",
  "M2_CORROBORATED",
  "M3_VALIDATED",
  "M4_PROCEDURALIZED",
  "M5_CONSTITUTIONAL",
];

function targetIndexFor(target:MemoryMaturity):number { return MATURITY_ORDER.indexOf(target); }
function clamp(value:number,min=0,max=1):number { return Math.max(min,Math.min(max,value)); }
function assertUnit(value:number,name:string):void { if (!Number.isFinite(value) || value<0 || value>1) throw new Error(`${name}_out_of_range`); }
function uniq(values:readonly string[]):string[] { return [...new Set(values.filter(Boolean))]; }
function tokens(value:string):Set<string> { return new Set(value.toLowerCase().match(/[a-z0-9_.:-]+/g) ?? []); }
function overlapRatio(a:Set<string>,b:Set<string>):number {
  if (!a.size || !b.size) return 0;
  let intersection=0; for (const value of a) if (b.has(value)) intersection++;
  return intersection/Math.max(1,Math.min(a.size,b.size));
}
function parseTime(value:string):number { const n=Date.parse(value); if (!Number.isFinite(n)) throw new Error("invalid_memory_time"); return n; }
function intervalOverlaps(aFrom:string,aUntil:string|undefined,bFrom:string,bUntil:string|undefined):boolean {
  const af=parseTime(aFrom), au=aUntil ? parseTime(aUntil) : Number.POSITIVE_INFINITY;
  const bf=parseTime(bFrom), bu=bUntil ? parseTime(bUntil) : Number.POSITIVE_INFINITY;
  return af<=bu && bf<=au;
}
function scopesOverlap(a:readonly string[],b:readonly string[],allowGlobal=false):boolean {
  const hasGlobal=a.includes("global") || b.includes("global");
  if (hasGlobal) return allowGlobal;
  return a.some(x=>b.includes(x));
}
const FREE_TEXT_CONFLICT_THRESHOLD=0.6;
const NEGATIVE_POLARITY=/\b(never|not|no|cannot|can't|don't|doesn't|must not|shall not|avoid|forbidden|prohibited|disallow(?:ed)?|refuse)\b/i;
const POSITIVE_POLARITY=/\b(always|must|shall|required|require|ensure|mandatory|enforce)\b/i;
const POLARITY_WORDS=/\b(never|not|no|cannot|can't|don't|doesn't|must|shall|always|required|require|ensure|mandatory|enforce|avoid|forbidden|prohibited|disallow(?:ed)?|refuse)\b/gi;

export type StatementPolarity="positive"|"negative"|"neutral";

/** Negative wins when a statement carries both, since "must not" reads as a prohibition. */
export function statementPolarity(statement:string):StatementPolarity {
  if (NEGATIVE_POLARITY.test(statement)) return "negative";
  if (POSITIVE_POLARITY.test(statement)) return "positive";
  return "neutral";
}

/** Statement tokens with the modality words removed, so only the claim remains. */
export function polarityStrippedTokens(statement:string):Set<string> {
  return tokens(statement.replace(POLARITY_WORDS," "));
}

function normalizeAssertionObject(value:string):string { return value.trim().toLowerCase().replace(/\s+/g, " "); }
function hasAuthorityExpansion(text:string):boolean {
  return /\b(may|allow|permit|authorize|self[- ]authorize|bypass|skip|without approval|grant (?:network|access|permission|authority)|publish to production)\b/i.test(text);
}
function ledgerHasApproval(ledger:EventLedger, eventId:string|undefined, memoryId:string, target:MemoryMaturity):boolean {
  if (!eventId) return false;
  return ledger.snapshot().some(e=>e.id===eventId && e.type==="memory.approval" &&
    typeof e.payload==="object" && e.payload!==null &&
    (e.payload as any).memoryId===memoryId && (e.payload as any).target===target);
}
function ledgerHasRegression(ledger:EventLedger, eventId:string|undefined, memoryId:string, target:MemoryMaturity):boolean {
  if (!eventId) return false;
  return ledger.snapshot().some(e=>e.id===eventId && e.type==="memory.regression_passed" &&
    typeof e.payload==="object" && e.payload!==null &&
    (e.payload as any).memoryId===memoryId && (e.payload as any).target===target);
}
function recordText(record:MemoryRecord):string {
  return [record.subject,record.statement,...record.tags,record.assertion?.subject ?? "",record.assertion?.predicate ?? "",record.assertion?.object ?? ""].join(" ");
}
function currentAt(record:MemoryRecord,atTime:string):boolean {
  const at=parseTime(atTime), from=parseTime(record.validFrom), until=record.validUntil ? parseTime(record.validUntil) : Number.POSITIVE_INFINITY;
  return at>=from && at<=until;
}

/**
 * SUAF §2.1 -- the three derived counts, plus outcome independence for F-003.
 *
 * Each reads only persisted record state. Nothing a caller passes to `promote`
 * can change any of them, which is the whole point: the strongest attack path
 * in the CMA-001 audit was forging these numbers.
 */
export function derivedIndependentSourceCount(
  record: MemoryRecord,
  lineage: SourceLineageRegistry = PERMISSIVE_LINEAGE,
): number {
  // Distinct lineage *roots*, not distinct declared groups: two mirrors of one
  // origin collapse to one, and under a strict registry an unregistered group
  // buys nothing at all.
  return lineage.independentRoots(record.provenance?.sourceRefs ?? []).size;
}

export function derivedSupportingEvidenceCount(record: MemoryRecord): number {
  return (record.evidenceIds ?? []).filter(Boolean).length;
}

export function derivedContradictionCount(record: MemoryRecord, liveConflicts = 0): number {
  return (record.relations ?? []).filter(r => r.type === "contradicts").length + liveConflicts;
}

/**
 * Outcomes attested by someone other than the record's own creator. Five
 * self-reported successes are five self-reported successes (§7 test 10).
 */
export function independentOutcomes(record: MemoryRecord): readonly MemoryOutcomeLink[] {
  const creator = record.provenance?.createdBy;
  return (record.outcomes ?? []).filter(o => o.attestedBy && o.attestedBy !== creator);
}

export function derivedIndependentOutcomeCount(record: MemoryRecord): number {
  return new Set(independentOutcomes(record).map(o => o.attestedBy)).size;
}

export function derivePromotionFacts(
  record: MemoryRecord,
  liveConflicts = 0,
  lineage: SourceLineageRegistry = PERMISSIVE_LINEAGE,
): DerivedPromotionFacts {
  return {
    supportingEvidenceCount: derivedSupportingEvidenceCount(record),
    independentSourceCount: derivedIndependentSourceCount(record, lineage),
    contradictionCount: derivedContradictionCount(record, liveConflicts),
    independentOutcomeCount: derivedIndependentOutcomeCount(record),
  };
}

export function memoryFitness(record:MemoryRecord,now=new Date()):number {
  // F-003 / F-007: only independently attested outcomes may move fitness, and
  // fitness feeds retrieval rank. Otherwise an actor reports its own memory
  // successful twenty times and buys itself the top of every result list.
  // When a record carries no outcome links at all the raw counters are used, so
  // records assembled directly (fixtures, imports) still score as before.
  const attested=independentOutcomes(record);
  const usingLinks=record.outcomes.length>0;
  const successes=usingLinks ? attested.filter(o=>o.result==="success").length : record.successfulUseCount;
  const failures=usingLinks ? attested.filter(o=>o.result==="failure").length : record.failedUseCount;
  const uses=successes+failures;
  const utility=uses ? successes/uses : 0.5;
  const recurrence=clamp(attested.length/5);
  const evidenceQuality=clamp(record.evidenceIds.length/3);
  const outcomeImpact=attested.length
    ? attested.reduce((sum,o)=>sum+(o.result==="success"?o.impact:o.result==="partial"?o.impact*0.4:-o.impact),0)/attested.length
    : 0;
  const ageDays=Math.max(0,(now.getTime()-parseTime(record.updatedAt))/86_400_000);
  const recency=clamp(1-ageDays/365);
  const contradictionPenalty=clamp(record.relations.filter(r=>r.type==="contradicts").length/3)*0.25;
  return clamp(
    0.24*utility +
    0.20*record.confidence +
    0.12*record.importance +
    0.12*recurrence +
    0.12*evidenceQuality +
    0.10*clamp((outcomeImpact+1)/2) +
    0.10*recency -
    contradictionPenalty
  );
}

/**
 * SUAF §2.1 + §2.3. Every fact is derived from `record`; the only external input
 * that can produce a permit at M4/M5 is a signature this function verifies
 * itself. There is no argument a caller can pass that asserts a verdict.
 */
export function promotionDecision(
  record: MemoryRecord,
  target: MemoryMaturity,
  input: PromotionInput,
): PromotionDecision {
  const currentIndex = MATURITY_ORDER.indexOf(record.maturity);
  const targetIndex = MATURITY_ORDER.indexOf(target);
  if (targetIndex !== currentIndex + 1) {
    return { decision: "deny", reason: "promotion_must_advance_exactly_one_level" };
  }

  const facts = derivePromotionFacts(record, input.liveConflictCount ?? 0, input.lineage);
  if (facts.contradictionCount > 0 && targetIndex >= 2) {
    return { decision: "deny", reason: "unresolved_contradictions_block_promotion" };
  }

  const corroborated =
    facts.independentSourceCount >= 2 && facts.supportingEvidenceCount >= 2;

  switch (target) {
    case "M1_CANDIDATE":
      return record.confidence >= 0.50
        ? { decision: "permit", reason: "candidate_threshold_met" }
        : { decision: "deny", reason: "insufficient_confidence" };

    case "M2_CORROBORATED":
      return corroborated
        ? { decision: "permit", reason: "independent_corroboration_met" }
        : { decision: "deny", reason: "independent_corroboration_required" };

    case "M3_VALIDATED":
      if (!corroborated) return { decision: "deny", reason: "independent_corroboration_required" };
      if (record.confidence < 0.80) return { decision: "deny", reason: "validation_threshold_not_met" };
      // F-003 / §7 test 10: "validated" has to mean somebody other than the
      // author saw it work. Self-reported success is not validation.
      if (facts.independentOutcomeCount < 1) {
        return { decision: "deny", reason: "independent_outcome_attestation_required" };
      }
      return { decision: "permit", reason: "validation_threshold_met" };

    case "M4_PROCEDURALIZED": {
      if (record.layer !== "procedural") {
        return { decision: "deny", reason: "only_procedural_memory_can_be_proceduralized" };
      }
      if (!input.superUserApproval) {
        return { decision: "review_required", reason: "behavior_changing_memory_requires_review" };
      }
      const verdict = verifySuperUserApproval(
        input.superUserApproval, record, target, input.keyRegistry, input.nonces, input.now,
      );
      // Absent approval is a review. A *forged* approval is a denial: someone
      // tried to manufacture authority and that is not the same event.
      return verdict.valid
        ? { decision: "permit", reason: "behavior_change_reviewed_and_regression_passed" }
        : { decision: "deny", reason: verdict.reason };
    }

    case "M5_CONSTITUTIONAL": {
      if (record.confidence < 0.95) {
        return { decision: "deny", reason: "constitutional_threshold_not_met" };
      }
      if (!input.superUserApproval) {
        return { decision: "review_required", reason: "constitutional_memory_requires_super_user_approval" };
      }
      const verdict = verifySuperUserApproval(
        input.superUserApproval, record, target, input.keyRegistry, input.nonces, input.now,
      );
      return verdict.valid
        ? { decision: "permit", reason: "constitutional_promotion_explicitly_approved" }
        : { decision: "deny", reason: verdict.reason };
    }

    default:
      return { decision: "deny", reason: "unsupported_promotion" };
  }
}

export interface PromoteOptions extends PromotionEvidence {
  superUserApproval?: SuperUserApproval;
}

export class EvolvingMemoryFabric {
  /**
   * The registry defaults to empty, which means every M4/M5 approval fails with
   * `approval_key_not_registered`. Failing closed is deliberate: a deployment
   * that forgot to register a Super-User key must not be able to proceduralize
   * anything.
   */
  constructor(
    private readonly store:StateStore,
    private readonly ledger:EventLedger,
    private readonly keyRegistry:SuperUserKeyRegistry = new SuperUserKeyRegistry(),
    private readonly nonces:ApprovalNonceLedger = new ApprovalNonceLedger(),
    private readonly lineage:SourceLineageRegistry = PERMISSIVE_LINEAGE,
  ) {}

  registerSuperUserKey(keyId:string, publicKey:Parameters<SuperUserKeyRegistry["register"]>[1]):void {
    this.keyRegistry.register(keyId, publicKey);
  }

  async createMemory(input:CreateMemoryInput,now=new Date()):Promise<MemoryRecord> {
    // Refuse rather than ignore: a dropped field teaches an attacker nothing.
    assertNoTrustBearingFields(input,"createMemory input");
    assertUnit(input.confidence,"confidence"); assertUnit(input.importance,"importance");
    if (!input.scope.length) throw new Error("memory_scope_required");
    if (!input.subject.trim() || !input.statement.trim()) throw new Error("memory_content_required");
    const createdAt=now.toISOString();
    const record:MemoryRecord={
      id:input.id ?? `mem_${randomUUID()}`,
      layer:input.layer,
      maturity:"M0_OBSERVATION",
      status:input.status ?? "active",
      scope:uniq(input.scope),
      subject:input.subject.trim(),
      statement:input.statement.trim(),
      confidence:input.confidence,
      importance:input.importance,
      tags:uniq(input.tags ?? []),
      validFrom:input.validFrom ?? createdAt,
      createdAt,
      updatedAt:createdAt,
      provenance:{
        createdBy:input.createdBy,
        createdAt,
        sourceRefs:[...(input.sourceRefs ?? [])],
        derivedFromMemoryIds:uniq(input.derivedFromMemoryIds ?? []),
        ...(input.observedAt ? {observedAt:input.observedAt} : {}),
      },
      evidenceIds:uniq(input.evidenceIds ?? []),
      relations:[...(input.relations ?? [])],
      outcomes:[],
      retrievalCount:0,
      successfulUseCount:0,
      failedUseCount:0,
      fitness:0,
      supersedes:uniq(input.supersedes ?? []),
      ...(input.assertion ? {assertion:{...input.assertion}} : {}),
      ...(input.validUntil ? {validUntil:input.validUntil} : {}),
    };
    record.fitness=memoryFitness(record,now);
    await this.store.put(MEMORY_NS,record.id,record);
    // The full record goes in the event, not just its headline fields. That is
    // what makes the state store a true cache: it can be deleted or corrupted
    // and rebuilt from the journal alone (see memoryReplay.ts).
    this.ledger.append("memory.created",{id:record.id,layer:record.layer,maturity:record.maturity,scope:record.scope,record},now);
    return record;
  }

  async getMemory(id:string):Promise<MemoryRecord|undefined> { return (await this.store.get<MemoryRecord>(MEMORY_NS,id))?.value; }
  async listMemories():Promise<MemoryRecord[]> { return (await this.store.list<MemoryRecord>(MEMORY_NS)).map(x=>x.value); }
  async getLearningProposal(id:string):Promise<LearningProposal|undefined> { return (await this.store.get<LearningProposal>(LEARNING_NS,id))?.value; }
  async listLearningProposals():Promise<LearningProposal[]> { return (await this.store.list<LearningProposal>(LEARNING_NS)).map(x=>x.value); }

  async supersede(existingId:string,replacement:CreateMemoryInput,now=new Date()):Promise<MemoryRecord> {
    const envelope=await this.store.get<MemoryRecord>(MEMORY_NS,existingId);
    if (!envelope) throw new Error("memory_not_found");
    const next=await this.createMemory({...replacement,supersedes:uniq([...(replacement.supersedes ?? []),existingId])},now);
    const old:MemoryRecord={...envelope.value,status:"superseded",updatedAt:now.toISOString(),supersededBy:next.id};
    old.fitness=memoryFitness(old,now);
    await this.store.put(MEMORY_NS,existingId,old,envelope.revision);
    this.ledger.append("memory.superseded",{oldId:existingId,newId:next.id},now);
    return next;
  }

  async recordOutcome(id:string,outcome:Omit<MemoryOutcomeLink,"timestamp"|"attestedBy"> & {attestedBy?:string},now=new Date()):Promise<MemoryRecord> {
    assertUnit(outcome.impact,"outcome_impact");
    const envelope=await this.store.get<MemoryRecord>(MEMORY_NS,id); if(!envelope) throw new Error("memory_not_found");
    // An outcome with no named attestor is treated as self-reported by the
    // record's creator -- the conservative reading, so omitting the field can
    // never buy independence.
    const attestedBy=outcome.attestedBy ?? envelope.value.provenance.createdBy;
    const link:MemoryOutcomeLink={...outcome,attestedBy,timestamp:now.toISOString(),evidenceIds:uniq(outcome.evidenceIds)};
    const record:MemoryRecord={...envelope.value,outcomes:[...envelope.value.outcomes,link],updatedAt:now.toISOString()};
    if (outcome.result==="success") record.successfulUseCount++;
    else if (outcome.result==="failure") record.failedUseCount++;
    record.fitness=memoryFitness(record,now);
    await this.store.put(MEMORY_NS,id,record,envelope.revision);
    this.ledger.append("memory.outcome_recorded",{id,result:outcome.result,impact:outcome.impact,attestedBy},now);
    return record;
  }

  async recordRetrievalUse(id:string,useful:boolean,now=new Date()):Promise<MemoryRecord> {
    const envelope=await this.store.get<MemoryRecord>(MEMORY_NS,id); if(!envelope) throw new Error("memory_not_found");
    const record:MemoryRecord={...envelope.value,retrievalCount:envelope.value.retrievalCount+1};
    // Reading is not evidence of correctness: do not alter fitness, evidence-bearing updatedAt,
    // or outcome counters. This prevents popularity/retrieval feedback loops.
    await this.store.put(MEMORY_NS,id,record,envelope.revision);
    this.ledger.append("memory.retrieval_recorded",{id,useful},now);
    return record;
  }

  async detectStructuredConflicts(candidate:CreateMemoryInput):Promise<MemoryConflict[]> {
    if (!candidate.assertion) return [];
    const memories=await this.listMemories();
    const from=candidate.validFrom ?? new Date().toISOString();
    return memories.filter(m=>
      (m.status==="active" || m.status==="cool") &&
      !!m.assertion &&
      normalizeAssertionObject(m.assertion.subject)===normalizeAssertionObject(candidate.assertion!.subject) &&
      normalizeAssertionObject(m.assertion.predicate)===normalizeAssertionObject(candidate.assertion!.predicate) &&
      normalizeAssertionObject(m.assertion.object)!==normalizeAssertionObject(candidate.assertion!.object) &&
      scopesOverlap(m.scope,candidate.scope) &&
      intervalOverlaps(m.validFrom,m.validUntil,from,candidate.validUntil)
    ).map(m=>({
      existingMemoryId:m.id,
      candidateSubject:candidate.assertion!.subject,
      candidatePredicate:candidate.assertion!.predicate,
      existingObject:m.assertion!.object,
      candidateObject:candidate.assertion!.object,
      reason:"structured_assertion_conflict" as const,
    }));
  }

  async promote(id:string,target:MemoryMaturity,options:PromoteOptions={},now=new Date()):Promise<{decision:PromotionDecision;memory:MemoryRecord}> {
    const envelope=await this.store.get<MemoryRecord>(MEMORY_NS,id); if(!envelope) throw new Error("memory_not_found");
    const current=envelope.value;

    // Live conflicts are recomputed at promotion time from the persisted record,
    // structured and free-text alike. Nothing about them comes from the caller.
    const liveConflictCount=targetIndexFor(target)>=2 ? (await this.detectConflictsFor(current)).length : 0;

    const decision=promotionDecision(current,target,{
      ...(options.superUserApproval ? {superUserApproval:options.superUserApproval} : {}),
      keyRegistry:this.keyRegistry,
      nonces:this.nonces,
      lineage:this.lineage,
      liveConflictCount,
      now,
    });
    if(decision.decision!=="permit") return {decision,memory:current};

    // Burn the nonce only on a granted promotion, so a denial for an unrelated
    // reason does not consume the Super-User's signature.
    if (options.superUserApproval) this.nonces.consume(options.superUserApproval.challengeNonce);

    const record:MemoryRecord={...current,maturity:target,updatedAt:now.toISOString()};
    record.fitness=memoryFitness(record,now);
    await this.store.put(MEMORY_NS,id,record,envelope.revision);
    const facts=derivePromotionFacts(current,liveConflictCount,this.lineage);
    // The ledger records the derived facts and the signing key, not the caller's
    // claims: an audit trail that can log lies is not an audit trail (§6).
    this.ledger.append("memory.promoted",{
      id,from:current.maturity,to:target,reason:decision.reason,
      derived:facts,
      ...(options.superUserApproval ? {approvalKeyId:options.superUserApproval.keyId,approvalPayloadHash:options.superUserApproval.payloadHash} : {}),
    },now);
    return {decision,memory:record};
  }

  /** Structured plus free-text conflicts for an already-persisted record. */
  async detectConflictsFor(record:MemoryRecord):Promise<MemoryConflict[]> {
    const candidate:CreateMemoryInput={
      id:record.id, layer:record.layer, scope:record.scope, subject:record.subject, statement:record.statement,
      confidence:record.confidence, importance:record.importance, createdBy:record.provenance.createdBy,
      sourceRefs:record.provenance.sourceRefs, evidenceIds:record.evidenceIds, validFrom:record.validFrom,
    };
    if (record.assertion) candidate.assertion={...record.assertion};
    if (record.validUntil) candidate.validUntil=record.validUntil;
    const structured=await this.detectStructuredConflicts(candidate);
    const freeText=await this.detectFreeTextConflicts(candidate);
    const seen=new Set(structured.map(c=>c.existingMemoryId));
    return [...structured,...freeText.filter(c=>!seen.has(c.existingMemoryId))];
  }

  /**
   * SUAF F-004 / §6 "semantic gateway": a contradiction expressed in prose was
   * previously invisible, so a harmful rule could be written as free text and
   * never trip the structured conflict check.
   *
   * This is a deterministic polarity detector, not language understanding: two
   * statements about the same subject whose wording overlaps heavily but whose
   * modality is opposite ("must never deploy on Friday" vs "must always deploy
   * on Friday") are flagged. It has false negatives and is honest about that --
   * but it only ever *adds* contradictions, and contradictions only ever block
   * promotion, so every error it makes falls on the side of refusing.
   */
  async detectFreeTextConflicts(candidate:CreateMemoryInput):Promise<MemoryConflict[]> {
    const memories=await this.listMemories();
    const from=candidate.validFrom ?? new Date().toISOString();
    const candidateCore=polarityStrippedTokens(candidate.statement);
    const candidatePolarity=statementPolarity(candidate.statement);
    if (!candidateCore.size) return [];

    return memories.filter(m=>
      m.id!==candidate.id &&
      (m.status==="active" || m.status==="cool") &&
      normalizeAssertionObject(m.subject)===normalizeAssertionObject(candidate.subject) &&
      scopesOverlap(m.scope,candidate.scope) &&
      intervalOverlaps(m.validFrom,m.validUntil,from,candidate.validUntil) &&
      statementPolarity(m.statement)!==candidatePolarity &&
      statementPolarity(m.statement)!=="neutral" && candidatePolarity!=="neutral" &&
      overlapRatio(polarityStrippedTokens(m.statement),candidateCore)>=FREE_TEXT_CONFLICT_THRESHOLD
    ).map(m=>({
      existingMemoryId:m.id,
      candidateSubject:candidate.subject,
      candidatePredicate:"free_text_polarity",
      existingObject:m.statement,
      candidateObject:candidate.statement,
      reason:"free_text_polarity_conflict" as const,
    }));
  }

  /**
   * RETIRED in v1.1. These minted a ledger event that `promote` then accepted as
   * proof of Super-User approval -- but any caller holding a fabric handle could
   * call them, so an untrusted agent could walk its own rule to M5. They now
   * throw rather than being quietly deleted, so any surviving caller fails
   * loudly instead of silently losing its approval path.
   */
  async recordApproval():Promise<never> {
    throw new Error("recordApproval_retired_use_signed_SuperUserApproval");
  }

  async recordRegressionPass():Promise<never> {
    throw new Error("recordRegressionPass_retired_regression_ids_live_in_signed_approval");
  }
  async retrieve(query:MemoryQuery,now=new Date()):Promise<RetrievedMemory[]> {
    if (!query.text.trim() && !query.tags?.length) return [];
    const queryTokens=tokens(query.text); const queryTags=new Set(query.tags ?? []); const at=query.atTime ?? now.toISOString();
    const records=await this.listMemories(); const results:RetrievedMemory[]=[];
    for(const memory of records){
      if(!query.includeArchived && ["archived","deprecated","superseded","quarantined"].includes(memory.status)) continue;
      if(query.layers?.length && !query.layers.includes(memory.layer)) continue;
      if(query.scopes?.length && !scopesOverlap(memory.scope,query.scopes,query.allowGlobal===true)) continue;
      if(!currentAt(memory,at)) continue;
      const lexical=overlapRatio(queryTokens,tokens(recordText(memory)));
      const tagScore=queryTags.size ? overlapRatio(queryTags,new Set(memory.tags)) : 0;
      const scopeScore=query.scopes?.length && scopesOverlap(memory.scope,query.scopes,query.allowGlobal===true) ? 1 : 0;
      const score=clamp(0.45*lexical+0.15*tagScore+0.10*scopeScore+0.20*memory.fitness+0.10*memory.importance);
      if(score<=0 && query.text.trim()) continue;
      const reasons:string[]=[];
      if(lexical>0) reasons.push("semantic_lexical_match");
      if(tagScore>0) reasons.push("tag_match");
      if(scopeScore>0) reasons.push("scope_match");
      if(memory.fitness>=0.7) reasons.push("high_fitness");
      results.push({memory,score,reasons});
    }
    return results.sort((a,b)=>b.score-a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt)).slice(0,query.limit ?? 10);
  }

  async proposeLearning(input:FailureLearningInput,now=new Date()):Promise<LearningProposal> {
    assertUnit(input.confidence,"learning_confidence");
    const proposal:LearningProposal={
      id:input.id ?? `learn_${randomUUID()}`,
      trigger:"failure",
      rootCause:input.rootCause,
      proposedRule:input.reusableRule,
      scope:uniq(input.scope),
      confidence:input.confidence,
      evidenceIds:uniq(input.evidenceIds),
      sourceMemoryIds:uniq(input.sourceMemoryIds),
      regressionTestIds:uniq(input.regressionTestIds ?? []),
      targetKind:input.targetKind ?? "project_instruction",
      raisesAuthority: input.targetKind === "policy" || input.targetKind === "constitution" || input.scope.includes("global") || hasAuthorityExpansion(input.reusableRule),
      reversible: !hasAuthorityExpansion(input.reusableRule),
      status:"proposed",
      createdAt:now.toISOString(),
    };
    await this.store.put(LEARNING_NS,proposal.id,proposal);
    this.ledger.append("learning.proposed",{id:proposal.id,trigger:proposal.trigger,targetKind:proposal.targetKind,severity:input.severity,repair:input.repair},now);
    return proposal;
  }

  /**
   * Startup reconciliation. Replays the journal, compares it to the state store,
   * and lets the journal win.
   *
   * Only authority-bearing fields are compared -- maturity, status, statement,
   * scope, layer, evidence, source groups. Fitness, outcome counters and
   * retrieval counts legitimately move without a creation event, so comparing
   * them would produce permanent false divergence and train everyone to ignore
   * the report.
   *
   * Anything repaired is quarantined rather than silently corrected: a
   * divergence means something wrote state without going through the fabric,
   * and that fact should outlive the repair.
   */
  async reconcile(now=new Date()):Promise<ReconciliationReport> {
    if (!this.ledger.verify()) throw new Error("ledger_integrity_failure");
    const derived=replayMemoryState(this.ledger);
    const projected=await this.store.list<MemoryRecord>(MEMORY_NS);

    const divergent:string[]=[]; const orphaned:string[]=[]; const missing:string[]=[];
    const seen=new Set<string>();

    for (const envelope of projected) {
      const record=envelope.value; seen.add(record.id);
      const truth=derived.get(record.id);
      if (!truth) { orphaned.push(record.id); continue; }
      if (authorityFieldsOf(truth.record)!==authorityFieldsOf(record)) divergent.push(record.id);
    }
    for (const id of derived.keys()) if (!seen.has(id)) missing.push(id);

    const touched=[...divergent,...missing,...orphaned];
    if (!touched.length) return {divergent:[],missing:[],orphaned:[],quarantined:[],ok:true};

    const quarantined:string[]=[];
    for (const id of [...divergent,...missing]) {
      const truth=derived.get(id); if(!truth) continue;
      const envelope=await this.store.get<MemoryRecord>(MEMORY_NS,id);
      const repaired:MemoryRecord={...(envelope?.value ?? truth.record),
        maturity:truth.record.maturity, status:"quarantined",
        statement:truth.record.statement, scope:[...truth.record.scope], layer:truth.record.layer,
        evidenceIds:[...truth.record.evidenceIds], provenance:{...truth.record.provenance},
        updatedAt:now.toISOString()};
      await this.store.put(MEMORY_NS,id,repaired,envelope?.revision);
      quarantined.push(id);
    }
    for (const id of orphaned) await this.store.delete(MEMORY_NS,id);

    this.ledger.append("memory.reconciliation_divergence",{
      divergent,missing,orphaned,
      detail:"state store disagreed with journal replay; journal applied and records quarantined",
    },now);
    return {divergent,missing,orphaned,quarantined,ok:false};
  }

  learningDecision(proposal:LearningProposal){
    return learningDisposition({
      id:proposal.id,
      kind:proposal.targetKind,
      content:proposal.proposedRule,
      raisesAuthority:proposal.raisesAuthority,
      reversible:proposal.reversible,
    });
  }
}
