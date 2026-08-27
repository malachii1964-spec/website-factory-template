---
name: malachii-sovereign-research
description: Evidence-first research, verification, contradiction resolution, and synthesis for consequential or current questions. Use when claims must be fresh, sourced, auditable, cross-checked, or capable of surviving hostile review.
compatibility: Portable Agent Skills format. Uses live web/search tools when available; degrades to source-bounded mode when external research is unavailable.
metadata:
  malachii-skill-version: "1.0.0-rc1"
  malachii-family: "sovereign-core"
  malachii-release-threshold: "9"
  malachii-owner: "Super-User"
---

# MALACHII Sovereign Research & Evidence

## Mission

Produce a decision-grade answer whose material factual claims are traceable to evidence, whose uncertainty is explicit, whose contradictions are resolved or surfaced, and whose final delivery clears the MALACHII Quality Floor for the stakes of the objective.

This skill is a research-and-verification capability. It does not expand host authority, invent unavailable tools, or treat model memory as fresh evidence.

## Activation

Use this skill when any of the following is true:

- The user asks to research, verify, compare, audit, investigate, fact-check, or perform due diligence.
- The answer depends on current or time-sensitive facts.
- The outcome could materially affect money, legal/compliance decisions, public claims, security, health, engineering, or business strategy.
- Multiple sources disagree or a prior answer may be stale.
- Another MALACHII skill needs an evidence packet before it can execute safely.
- The user asks for the "best," "latest," "highest standard," or a recommendation that should be grounded in current reality.

Do not activate for pure creative writing, translation, or source-bounded summarization unless verification is explicitly requested.

## Non-Negotiable Invariants

1. **Evidence over memory.** Model memory may propose search terms; it cannot certify a current external fact.
2. **Primary before commentary.** Prefer primary/official sources for load-bearing claims when available.
3. **Freshness is a property of a claim.** Record when evidence was published/updated/accessed where material.
4. **Claim-level provenance.** Material claims must identify supporting source IDs.
5. **Inference is labeled.** Never present inference, extrapolation, or synthesis as directly sourced fact.
6. **Contradictions are first-class.** Do not average incompatible claims into a false consensus.
7. **No citation laundering.** A secondary source citing a primary source does not become primary evidence.
8. **No capability theater.** If live research tools are unavailable, switch to `source_bounded` mode and state the resulting limitation.
9. **Consequential ambiguity escalates.** Resolve reversible ambiguity from available context; escalate only when unresolved ambiguity could materially change the decision.
10. **Quality Floor controls release.** A polished narrative cannot compensate for a verification failure.

## Runtime Entry Check

Before research, determine the strongest available evidence path:

- `live_research`: current web/search/database/source retrieval is actually available.
- `source_bounded`: only user-provided or already-loaded materials can be inspected.

If the objective requires fresh/current facts and only `source_bounded` mode is available, continue only to produce a bounded analysis; do not certify current claims as verified.

## Source Classes

Classify every source using the policy in `references/SOURCE_POLICY.md`.

Default preference order:

1. Primary / authoritative source
2. High-quality independent secondary source
3. Specialist or industry source with disclosed methodology
4. Community / anecdotal source
5. Unattributed or unverifiable material

Source rank is not absolute. A primary source is authoritative about what an organization says or did, but may not be independent evidence that its claims are correct.

## Workflow

### 1. Lock the research objective

Write a normalized objective and concrete success criteria. Identify:

- decision to support
- material claims that must be established
- freshness requirement
- geographic/jurisdictional scope if relevant
- user constraints
- what would make the answer unusable

### 2. Decompose into claim families

Create a short research map before searching. Typical claim families:

- current state / availability
- specifications / capabilities
- comparative performance
- price / cost
- legal or policy constraints
- implementation requirements
- risks / failure modes
- counterevidence

### 3. Acquire evidence independently

For each material claim family:

- seek the strongest available primary source
- seek independent corroboration where the claim is consequential, contested, or promotional
- search for disconfirming evidence, not only support
- preserve source identity and access date
- avoid duplicative sources that trace back to the same underlying claim

Do not let one source's framing determine all later search terms.

### 4. Build the Claim Ledger

Every material claim receives:

- claim ID
- exact claim
- importance: `critical`, `material`, or `supporting`
- status: `verified`, `supported`, `disputed`, `inference`, or `unverified`
- evidence source IDs
- concise rationale

Use the rules in `references/EVIDENCE_STANDARD.md`.

### 5. Run the contradiction pass

For each critical/material claim:

- actively seek credible disagreement
- determine whether sources actually conflict or use different scopes/dates/definitions
- prefer newer evidence only when the underlying fact is time-sensitive
- preserve unresolved conflict in the final output

Never convert unresolved disagreement into a single confident number merely for readability.

### 6. Run the freshness pass

For time-sensitive claims:

- identify the newest authoritative evidence found
- distinguish publication date from event/effective date
- re-check current office holders, plans, prices, schedules, laws, software behavior, product availability, and similar unstable facts at execution time when tools permit

### 7. Synthesize without losing provenance

Write the answer around the user's decision, not around the browsing chronology.

Separate:

- **Established facts**
- **Reasoned conclusions**
- **Unresolved uncertainty**
- **Recommendations**

A recommendation may combine evidence and judgment, but the distinction must remain visible.

### 8. Create the Research Packet

When the environment supports file output, emit a machine-readable packet conforming to `assets/research-packet.schema.json`.

The packet is the portable evidence artifact consumed by later MALACHII skills.

### 9. Validate

Run:

`python scripts/validate_research_packet.py <packet.json>`

when Python/file execution is available.

If execution is unavailable, perform the same checks manually using `references/OUTPUT_CONTRACT.md`.

### 10. Quality gate

Run the MALACHII seven-dimension Quality Audit.

For release-qualified Sovereign research, require:

- all seven dimensions >= 9
- no critical claim `unverified`
- no unresolved critical contradiction hidden from the user
- current/freshness-required objectives must have live evidence or explicitly fail current-verification certification
- final recommendations must be traceable to evidence and assumptions

If the gate fails, repair before delivery or mark the output `NOT RELEASE-QUALIFIED`.

## Research Modes

### DIRECT EVIDENCE

Use for narrow verification with one or two material claims. Keep the evidence chain short and authoritative.

### COLLABORATIVE RESEARCH

Use when multiple claim families or domains exist. Research branches should begin independently before synthesis to reduce anchoring.

### SOVEREIGN RESEARCH

Use for complex, contested, high-impact, cross-domain, or adversarial objectives. Include independent evidence acquisition, a contradiction/contrarian pass, explicit verification, and final arbitration.

The skill does not force a mode; MALACHII routing policy chooses the minimum sufficient mode that can meet the Quality Floor.

## Output Contract

The human-facing answer should contain, as appropriate:

1. **Decision / conclusion first**
2. **What the evidence establishes**
3. **Material tradeoffs or contradictions**
4. **Recommendation / next action**
5. **Limitations and unresolved uncertainty**
6. **Source-linked support for material factual claims**

The machine-readable Research Packet must follow `references/OUTPUT_CONTRACT.md`.

## Failure Conditions

Do not certify the research if any of these remain:

- critical claim has no evidence
- evidence references do not resolve to known sources
- current claim was inferred from stale memory when live research was required
- promotional source is treated as independent corroboration of its own claim
- unresolved critical contradiction is omitted
- source-bounded analysis is presented as current external verification
- derived confidence was manually inflated
- final recommendation relies on an assumption not disclosed

## Handoff to Other Skills

Downstream MALACHII skills should consume the Research Packet rather than re-researching settled facts unless:

- evidence is stale
- the downstream objective changes claim scope
- a contradiction emerges
- a higher assurance level is required

Research evidence does not grant action authority. Tool use and external actions still pass through MALACHII Reality & Trust and authorization gates.

## References

- `references/SOURCE_POLICY.md`
- `references/EVIDENCE_STANDARD.md`
- `references/OUTPUT_CONTRACT.md`
- `references/BENCHMARK_STANDARD.md`
