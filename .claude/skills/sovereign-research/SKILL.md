---
name: sovereign-research
description: Evidence-first research for consequential questions — competitor analysis, pricing, legal/compliance claims, technical specs, anything that feeds public copy. Use when claims must be fresh, sourced, auditable, or capable of surviving hostile review. Triggers on "research", "verify", "fact-check", "compare", "what does X cost", "is X true", or before any claim labeled UNKNOWN in the Truth Protocol.
---

# Sovereign Research

## Mission

Produce a decision-grade answer whose material factual claims trace to evidence, whose uncertainty is explicit, whose contradictions are surfaced, and whose final delivery clears the 7-dimension Quality Floor for the stakes of the objective.

## Non-Negotiable Invariants

1. **Evidence over memory.** Model memory may propose search terms; it cannot certify a current external fact.
2. **Primary before commentary.** For load-bearing claims, prefer primary/official sources.
3. **Freshness is a property of a claim.** Record when evidence was published/accessed where material.
4. **Claim-level provenance.** Every material claim must identify its supporting source.
5. **Inference is labeled.** Never present synthesis as directly sourced fact.
6. **Contradictions are first-class.** Do not average incompatible claims into false consensus.
7. **No citation laundering.** A secondary source citing a primary does not become primary evidence.
8. **Mode declaration.** If live research tools are unavailable, state `source_bounded` and its limitations — never certify current claims from stale memory.
9. **Quality Floor controls release.** A polished narrative cannot compensate for a verification failure.

## Runtime Entry Check

Before researching, declare the mode:

- `live_research` — web/search retrieval is actually available
- `source_bounded` — only user-provided or already-loaded materials can be inspected

If the objective requires current facts and only `source_bounded` mode is available, continue only to produce a bounded analysis; label it explicitly.

## Source Classes

| Class | Use for |
|---|---|
| PRIMARY | Official docs, statutes, first-party filings, source repos, published datasets |
| INDEPENDENT_SECONDARY | Independent analysis with named authorship and transparent methodology |
| SPECIALIST | Industry/domain material with disclosed incentives |
| COMMUNITY | Forums, issue threads, user testimony — useful for failure discovery, weak for universal claims |
| USER_PROVIDED | Authoritative for what the document says; not independently verified as externally true |

**Independence rule:** Two articles from the same press release are one evidence lineage, not two confirmations.

**Promotional-source rule:** A vendor is primary evidence for its own docs, pricing, and terms. It is not independent evidence that its product is objectively superior.

## Workflow

### 1. Lock the objective
Write the normalized question and what a usable answer requires. Identify: decision to support, material claims to establish, freshness requirement, what would make the answer unusable.

### 2. Build a Claim Ledger
For every material claim:

| Field | Values |
|---|---|
| claim | exact statement |
| importance | `critical` / `material` / `supporting` |
| status | `verified` / `supported` / `disputed` / `inference` / `unverified` |
| evidence | source IDs |
| rationale | one sentence |

A `critical` claim that changes the final decision may **not** remain `unverified` in a released answer.

### 3. Contradiction pass
For each critical/material claim, actively seek credible disagreement before synthesizing. Do not average conflicting sources — surface the conflict. Prefer newer evidence only when the underlying fact is time-sensitive.

### 4. Freshness pass
For time-sensitive claims (prices, product availability, laws, API behavior): identify the newest authoritative evidence found, distinguish publication date from effective date, and re-check at execution time when tools permit.

### 5. Synthesize with provenance intact
Structure the answer:
1. Conclusion / decision first
2. What the evidence establishes (with source attribution)
3. Material tradeoffs or contradictions
4. Recommendation / next action
5. Limitations and unresolved uncertainty

A recommendation may combine evidence and judgment, but the distinction must remain visible.

## Claim Status Rules

- `verified` — at least one authoritative primary source establishes it within that source's authority; OR two independent credible sources converge with no stronger contradiction
- `supported` — credible evidence supports it but assurance is below verified
- `disputed` — credible evidence materially conflicts and resolution is incomplete
- `inference` — conclusion follows from evidence but is not directly stated; requires explicit label and reasoning bridge
- `unverified` — insufficient evidence

## Failure Conditions

Do not release the research if any of these remain:
- critical claim has no evidence
- current claim inferred from stale memory when live research was required
- promotional source treated as independent corroboration of its own claim
- unresolved critical contradiction omitted
- source-bounded analysis presented as current external verification

## Handoff

Downstream work (copy writing, feature specs, pricing pages) should consume the Claim Ledger rather than re-researching settled facts, unless evidence is stale or scope changed. Research evidence does not grant action authority — external actions still pass through autonomy gating.
