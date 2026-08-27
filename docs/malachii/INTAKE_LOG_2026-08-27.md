# MALACHII Candidate Additions Log

Quarantined intake per the batch protocol: additive only, project lock untouched.
Nothing here is promoted until you say so. Mirrors the intake law your own
ChatGPT session used: inventory → verify → extract value → identify conflicts →
map into the locked hierarchy → promote only with evidence.

---

## BATCH 1 — 2026-08-27

Files: `CMA001_REVIEW_CLAUDE.zip`, `CMA001_REVIEW_CLAUDE_1.zip` (byte-identical
duplicates), `CMA001_CLAUDE_BLIND_REVIEW.zip`, `CMA001_GEMINI_BLIND_REVIEW.zip`,
`CMA001_GROK_BLIND_REVIEW.zip`.

### What this batch actually is

A structured **blind red-team audit ("CMA-001")** of a newer MALACHII baseline
than what I had: **MALACHII Sovereign OS v3.3-RC1.6.2 + MEMF v1 Foundation
Candidate** (the Memory Fabric doc set the earlier ChatGPT thread flagged as
"critical merge" — it's here in full). Three reviewers (Claude, Gemini, Grok)
were each handed an identical frozen baseline + protocol packet with instructions
not to see each other's findings.

**Only the Claude packet contains a completed review.** The Gemini and Grok
zips are unanswered assignment packets (context + protocol + blank schema,
no filled report) — those two audits have not happened yet.

### Verdict per file

| File | Verdict | Why |
|---|---|---|
| `CMA001_REVIEW_CLAUDE(.1).zip` | **Adopt — high value** | Completed, executed audit (`REVIEW_CLAUDE.json`) + real exploit run logs against the compiled runtime. Not a documentation review — a red-team exercise with proof. |
| `CMA001_CLAUDE_BLIND_REVIEW.zip` | **Adopt — architecture spec** | Carries the actual MEMF v1 doc set (architecture, authority matrix, governance, retrieval policy, learning lifecycle, metrics, integration contract) + the audit protocol itself + the embedded RC1.6.2 baseline zip. |
| `CMA001_GEMINI_BLIND_REVIEW.zip` | **Hold — assignment only** | Identical packet, unanswered. Send to Gemini when ready; nothing to extract yet beyond the shared context (already captured from the Claude packet). |
| `CMA001_GROK_BLIND_REVIEW.zip` | **Hold — assignment only** | Same as above, for Grok. |

### New architecture concepts worth keeping (MEMF v1 / DMACP)

These extend, not replace, what I already had (RC3.3-RC1 Kernel + Identity):

- **MEMF (MALACHII Evolving Memory Fabric)** — typed durable memory with a
  maturity ladder `M0_OBSERVATION → M5_CONSTITUTIONAL`, non-destructive
  supersession (old record kept, forward/back pointers, ledger event — not
  overwritten), structured temporal assertions (`subject/predicate/object` +
  `validFrom`/`validUntil`), canonical-vs-derived split (embeddings/graph/FTS
  indexes are rebuildable caches; the checksummed store + hash-chained ledger
  are canonical truth).
- **Memory Authority Matrix** — a table pinning exactly what MEMF may decide
  vs. must defer (e.g. "Authorization/side effects → MALACHII authorization
  plane; MEMF cannot grant permission"). Directly useful: this is the missing
  piece that stops a memory system from quietly becoming a second control
  plane — exactly the failure class the audit then found unenforced (below).
- **MAL-0 to MAL-9 maturity scale** — an engineering maturity ladder for the
  memory/learning system itself (Reactive → Persistent → Episodic → Semantic →
  Procedural → Reflective → Adaptive → Governed Evolution → Meta-Cognitive).
  Useful as a non-hype-able way to state "how far along is memory, really" —
  explicitly bars claiming a level from documentation alone.
- **DMACP (Distributed Multi-Agent Control Plane) + Adaptive Cognitive Mesh** —
  a more developed 6-layer hierarchy than my RC3.3 copy's 8-plane model:
  Constitutional → Control Plane → Cognitive Mesh → Execution Planes →
  Interoperability (A2A sideways / MCP downward) → Experience. Core law worth
  keeping verbatim: *"Adaptive below, constitutional above. Work topology may
  reorganize itself; authority roots cannot."*
- **Governed Learning Lifecycle** — Capture → Diagnose → Propose → Classify
  scope → Corroborate (≥2 independent source groups) → Validate → Proceduralize
  → Observe outcomes → Reinforce/demote → prevent-repeat-failure escalation.
  Good, concrete, and exactly the kind of process the audit then proved isn't
  actually enforced in code yet (see below) — so it's a real design to build
  toward, not a false claim of current behavior.
- **Memory Intelligence Metrics** — 10 concrete metrics for proving memory is
  getting *more useful*, not just bigger (preventable recurrence rate,
  procedure success delta, retrieval precision, regression escape rate, memory
  bloat ratio, provider routing regret, etc.). Worth adopting as the eventual
  yardstick.
- **Audit protocol itself** (`00_COMMON_BLIND_RULES.md`, `AUDIT_RUBRIC.json`,
  `review-report.schema.json`) — a genuinely good reusable pattern: weighted
  rubric, 15 required attack vectors, forced KEEP findings so critique doesn't
  become pure demolition, forced falsification experiments, blind independence
  so reviewers don't anchor on each other. **Worth reusing** for auditing the
  agentic-swarm package and anything else going forward.

### What the executed audit actually found (proven by running code, not inferred)

Scores (0–10): memory_correctness 4, learning_safety **2**, architectural
coherence 5, failure_resilience 3, security 3, portability_sovereignty **7**.
`REPAIR_THEN_REAUDIT` — not reject, not ship as-is.

**14 of 15 required attacks PROVEN by execution** against the compiled
runtime (1 BLOCKED — corrupt-maturity input is correctly denied). The
governance layer that's supposed to gate memory promotion is decorative:

1. `createMemory()` accepts a caller-supplied `maturity` directly — a
   confidence-0.01 record was written straight to `M5_CONSTITUTIONAL` with
   zero promotion events in the ledger. The entire M0→M5 ladder is optional.
2. `promotionDecision()` never reads the record's own `sourceRefs[].sourceGroup`
   — a single-source record was accepted as "independently corroborated."
3. It never calls the conflict detector it ships with — a live, detected
   contradiction (`node:24` vs `node:18` both "active" for the same
   subject+predicate) did not block promotion.
4. `proposeLearning()` hardcodes `raisesAuthority:false` — the one guard
   designed to stop memory from expanding its own authority is unreachable.
5. Reading a memory rewrites its own ranking (`recordRetrievalUse()` bumps
   fitness and resets `updatedAt`) — a 19-month-old memory scored as fresh
   after being *read*, no new evidence involved. Reward-hacking / retrieval
   poisoning vector.
6. No code path ever writes `cool/archived/deprecated/quarantined` — a record
   with 25 consecutive recorded failures stayed active and retrievable.
   "Forgetting" is documentation-only.
7. **No rollback/demote/revert operation exists at all.** A wrongly-promoted
   M4/M5 record cannot be walked back. Invariant 12 ("every promoted
   evolution must retain a rollback path") has zero implementation.
8. `scope:["global"]` is an unbounded read/conflict channel — it matched a
   query scoped to a totally unrelated project.
9. **The shipped test suite pins the vulnerability as expected behavior**: the
   test named "promotion requires independent corroboration" builds a record
   with an *empty* `sourceRefs` array and asserts that claiming
   `independentSourceCount:2` yields `permit`. 84/84 + 11/11 green is not
   evidence these findings are absent — nothing exercises `fabric.promote()`
   for real.
10. Mitigating factor, stated plainly by the reviewer: **none of this is live
    yet.** MEMF has zero references from `controlPlane`, `objectiveForge`,
    `router`, or `executionPlane` — all 7 documented integration points are
    unimplemented. These are latent defects, not active ones — but wiring MEMF
    in before repairing them is the exact wrong order of operations.

**What's genuinely solid (KEEP, verified by execution, not doc claims):**
non-destructive supersession (old record preserved, bidirectional links,
ledger event on every change) and the hash-chained ledger's tamper detection
(flip one byte in history → `verify()` correctly fails). The reviewer's own
words: *"a genuinely good bones-level data model and a genuinely enforcing
storage layer, wrapped around a governance layer that does not enforce
anything."*

**Reviewer's own answer to "what would you delete to make this both safer and
more capable":** collapse 6 maturity levels to 3 enforced states, cut 7 memory
layers to 4, remove caller-supplied confidence as a promotion input, either
implement or delete the 4 never-written status values. Real cross-check
against MALACHII's own Kernel §10 (smallest sufficient configuration) — the
audit is telling MALACHII to follow its own law.

### Direct relevance to what's already in this repo

- Confirms, independently, the exact class of bug I already found and fixed
  in `authorize()` (a governance gate whose inputs are trusted rather than
  derived/observed) — same failure pattern, different subsystem. Good sign
  the fix pattern in `packages/agentic-swarm/src/governance/authorization.ts`
  (derive from evidence, never trust a caller-supplied claim) is the right
  general principle to carry into MEMF's promotion gate too, when that gets built.
- The blind-audit protocol (rubric + forced KEEP + falsification experiments)
  is directly reusable for auditing the swarm package itself.

### Not yet done (deferred, not forgotten)

- Have not diffed the embedded `MALACHII_SOVEREIGN_OS_RC1.6.2_MEMF_v1_
  FOUNDATION_CANDIDATE.zip` source against the RC3.3-RC1 copy I already have —
  logged its presence and SHA-256 (`d3a67b66c07413b4196899797effd08325cf98f728e776e9ad3e8c37a42f6ff5`
  per `BASELINE_LOCK.json`); full source diff is a separate task if/when you want it.
- Gemini and Grok blind reviews are unrun — nothing to extract from them yet.

---

## BATCHES 2–6 — 2026-08-27 (combined; arrived faster than one-at-a-time)

Note on pacing: batches 2 through 6 (20 files) arrived in rapid succession
within a single turn, not gated on my "give me more." I kept securing and
triaging rather than stall, but depth-of-read varies by item below — marked
explicitly. Full text extraction on everything MALACHII-core-relevant;
structural inventory only on large reference repos and one clearly
out-of-scope batch.

### Duplicates (zero new content — confirmed by SHA-256, not by eye)

- `MALACHII_OS_COMPLETE_FOLDER.zip` (batch 2) = the file loaded at session start.
- `MALACHII_SKILL_001_SOVEREIGN_RESEARCH.zip` (batch 2) = already-extracted Skill 001.
- `MALACHII_Sovereign_OS_v3.3_RC1_PORTABLE.zip` (batch 3) = already in the master folder.
- `MALACHII_Sovereign_OS_v3.1.zip` uploaded **three times** (batch 2, and twice more in batch 3/5, all identical hash `c4c8ee2...`).
- `MALACHII_Sovereign_OS_v3.zip` uploaded **twice** (batch 3 + batch 5, identical hash `5598def...`).
- `MALACHII_SOVEREIGN_OS_v3.3_RC1.6.2_CLAUDE_CODE.zip` uploaded **twice** (batch 3 + batch 5, identical hash `f1b2a4a...`).
- `malachiiorchestrator.zip` uploaded **twice** (batch 2 + batch 5, identical hash `5804b62...`).

### HIGH VALUE — adopt

**`MALACHII_SOVEREIGN_OS_v3.3_RC1.6.2_CLAUDE_CODE.zip`** (batch 3/5) — this is
the current authoritative build, and it's a real git repo (3 commits), not
just docs. Confirms and extends everything MEMF-related from batch 1, plus:
- `runtime/src` + `runtime/tests` — actual TypeScript implementation (92
  tests total per CMA-002R's report on the same lineage).
- `.claude/skills/malachii-sovereign-research` **and**
  `.claude/skills/malachii-sovereign-website-factory` — both already wired
  up as real Claude Code skills with `SKILL.md`, references, scripts, tests.
  This is your "first skill of the website factory," already built.
- New architecture layer beyond what I had: `architecture/
  SOVEREIGN_CONTROL_PLANE_KERNEL.md`, `LIVE_CONTROL_FABRIC.md`,
  `AUTONOMOUS_EXECUTION_PLANE.md`, `MANUS_PARITY_AND_BEYOND_2026-08-15.md`,
  `DISTRIBUTED_WORKER_FABRIC.md` — titles read as genuine engineering
  layers (not yet full-text read; flagged for a dedicated follow-up pass).
- `MALACHII_AUTOPILOT.py`, `AUTOPILOT_POLICY.md`, `live_server/` — an actual
  autonomous execution harness with policy docs, not just a runtime library.
- `evidence/` has real run artifacts: `LIVE_CONTROL_FABRIC_LEDGER.jsonl`,
  `DISTRIBUTED_WORKER_FABRIC_DEMO.json`, `CLAUDE_INDEPENDENT_VERIFICATION_
  2026-08-16.md` — i.e. this version has actually been executed and verified
  before, not just designed.
- **Not yet done:** full read of the new architecture docs and runtime/src
  diff against my RC3.3-RC1 copy. This is the single highest-value follow-up
  if you want depth next instead of breadth.

**`MALACHII_MEMF_SUPERUSER_AUTHORITY_FOUNDATION.docx`** (batch 5) — this is
the file the earlier ChatGPT thread flagged "critical merge" and I noted I
didn't have. Now read in full. It's the direct engineering answer to the
CMA-001 audit's worst findings (CLA-01/02/03/13):
- Never trust a caller-supplied `independentSourceCount` — derive it from
  `Set(record.provenance.sourceRefs[].sourceGroup)` (code given).
- `createMemory()` may only ever write `M0_OBSERVATION`; every higher step
  goes through `promote()`.
- `approvedBySuperUser` (a boolean) is retired in favor of a structured,
  **hardware-signed** `SuperUserApproval` object — YubiKey (PIV/CTAP) as
  preferred root of trust, TPM 2.0 as machine-bound alternative, software
  keys marked dev-only.
- Concrete phased rollout: v1.1 (derived counts + clamp, no hardware yet) →
  v1.2 (YubiKey signing) → v1.3 (adaptive risk class + TPM attestation).
- Ships 6 falsification tests that must stay red on the unpatched baseline —
  directly testable, not aspirational.
- **Worth adopting outright** as the authority-gate design once MEMF gets
  wired in. It's the missing piece the Claude CMA-001 audit says is missing.

**`MALACHII_CMA002R_TRUE_CHALLENGER_v0.1_CLAUDE_CODE_OPUS5.zip`** (batch 5) —
the actual repair pass responding to CMA-001, built by Claude against the
same frozen baseline. Two source files changed
(`memoryFabric.ts`, `memoryTypes.ts`) + one new test file — a minimal,
targeted diff, not a rewrite. Implements the v1.1 tier of the Authority
Foundation doc above: forced `M0_OBSERVATION` on create, derived
independence/contradiction counts, ledger-anchored approval events instead
of trusted booleans, retrieval no longer inflates its own fitness, blank
queries no longer dump the corpus. **Verified: 92/92 tests pass (84
baseline + 8 new hardening tests).** Self-reports what's still missing
(evidence IDs not yet resolved against CAS at every path; the full 21-attack
campaign hasn't been re-run against this exact package; no hardware signing
yet — that's the Authority Foundation's v1.2). Honest, well-scoped, ready to
be the actual v1.1 merge target.

**`MALACHII-Website-Factory-OS-v1.0`** (batch 4, `MALACHII_Website_Factory_OS_v1.0_Source.zip`) —
a complete, independent product spec for exactly what you said you want to
build once MALACHII is solid. Nine-layer architecture (Authority & Truth
Kernel → User Utility Engine → Task Contract → Adaptive Router → Capability
Modules → Execution State Machine → Evidence & Verification → Project State
& Memory → Evaluation & Evolution), a 10-gate release pipeline (G0 source
safety through G9 handoff, each with named exit evidence and blocker
examples — no gate passes on "looks good"), a 4-level authority model
(A0 advise-only through A3 production/consequential), capability packs
(cannabis compliance, immersive 3D, commerce, maps, adaptive UX), and a
`scripts/factory.py init/audit/gate` CLI that writes a `.malachii/` control
directory — no shell string execution, config-driven command gates only.
**This directly overlaps with — and is more developed than — this
repository's own `CLAUDE.md` Website Factory rules.** Two real named
examples ship with it: `rez-runner` and `thcmedsolutions`.
Explicit self-disclosed safety note: at least one source document in the
corpus it was built from contained what look like live plaintext
credentials, deliberately excluded from the package, with a rotate/revoke
warning. **This is the strongest single candidate for "the first skill of
the website factory" — recommend a dedicated pass to reconcile it against
this repo's CLAUDE.md next**, rather than skimming it into a bullet list.

**`Quality_Comparison_to_Another_Cosmic_Dimension.zip`** (batch 4) — not
architecture; it's the real source (React/TSX) and content for
**THCMedSolutions**, the project named as one of Website Factory OS's two
worked examples. Explains that example's grounding — it's a real prior
build, not a hypothetical. Not deep-read component-by-component; flag as
supporting evidence for the Website Factory OS example above, not a
standalone architecture source.

### MEDIUM VALUE — reference material, not MALACHII-authored

**`malachii-orchestrator`** (batch 2, confirmed no new content in its
batch-5 duplicate) — a real LangGraph + Pydantic-v2 four-phase build
pipeline (Discovery → Parallel Build Slices → Integration/Critic →
Deploy/Monitor), 975+1206 lines, syntax-checked and cross-validated against
its own contracts (zero mismatches across 123 enum refs + 52 constructor
calls) but **never actually executed** (sandboxed, no network, deps never
installed) — the author's own status note says so plainly. Documents two
concrete pitfalls worth keeping regardless of whether this code ships:
Pydantic v2 `.model_copy()` skips validators (use a dump/validate round
trip instead), and parallel-slice file ownership must be reserved at
planning time, before a slice goes `RUNNING`, not after. Directly
comparable to `packages/agentic-swarm`'s orchestrator in this repo — same
problem (retry-safe multi-step build pipeline), Python/LangGraph instead of
TypeScript, more general-purpose (any project) vs. task-specific.

**`skillsmain.zip`, `superpowersmain.zip`** (batch 4) — third-party
reference repos, not MALACHII output: `skillsmain` looks like Anthropic's
public Agent Skills spec/template/example repo; `superpowersmain` is the
`obra/superpowers` Claude Code plugin (skills + hooks + cross-model
`CLAUDE.md`/`AGENTS.md`/`GEMINI.md` markers). Useful as skill-authoring
convention references if/when you formalize more MALACHII skills; not
architecture content. Not deep-read — structural inventory only.

**`memoirfactory.zip`** (batch 4) — a small, separate "memoir-factory"
Claude project scaffold (book-writing, not MALACHII). Low relevance;
noted, not analyzed further unless you want it.

**`MALACHII_RC1.6_CROSS_MODEL_UPLOAD_PACKAGE.zip`** (batch 2) — a test kit +
an embedded `DISTRIBUTED_WORKER_FABRIC.zip`. Not yet opened past the top
level; likely overlaps with the Distributed Worker Fabric material already
found inside RC1.6.2_CLAUDE_CODE above. Deferred.

### LOW VALUE — historical ancestry, not read in full

`MALACHII_Sovereign_OS_v3.zip` and `v3.1.zip` (both re-uploaded 2–3× across
batches, confirmed identical each time) and `MALACHII_Sovereign_OS_v3.3_
BASE.zip` are earlier lineage steps whose Kernel/Identity content is
superseded by the RC3.3-RC1 Kernel already fully read at session start. Not
re-read in full — would only matter if you specifically want lineage
archaeology. One thing worth noting from `v3.3_BASE`: it ships an actual
`command-center/` implementation (`app.js`/`index.html`/`styles.css`), not
just the blueprint doc RC3.3-RC1 has — same as what's in RC1.6.2_CLAUDE_CODE.

### REJECT — off-lock, do not merge

**`MALACHII_v5.0_Universal_Intelligence_Leverage_System.docx`,
`MALACHII_v5.1_Combined_Revenue+Leverage_Master_Prompt.docx`,
`MALACHIIs_OMEGA_PROMPT_FRAMEWORK.docx`,
`Mission_complete_100_sentences_god_like_AI_SYSTEMS.docx`** (all batch 6) —
these are a different, earlier lineage of pure system-prompt writing:
grandiose capability-claim language ("transomniscient," "supraomniscient,"
"omnipotent... mathematically proven authority," "quantum networks,"
"post-omniscient") with no contract, no evidence requirement, no gate, no
falsification test. This is the exact failure pattern your locked Kernel
exists to prevent — Non-Negotiable Principle #12: *"Truth, authority,
capability, confidence, and quality are never granted merely because an AI
said so."* Same verdict your own ChatGPT session already reached on the
pasted Google-search memory material: reject the approach, nothing here
survives the intake law's "evidence over confidence" bar. Flagging plainly
rather than quietly dropping it, per your own instinct to not relitigate
project lock but also not silently pad the log with padding.

**`To_get_that_ultimate.docx`** (batch 6) — not MALACHII material at all: a
cannabis-cultivation nutrient/shopping list (coco coir ratios, Gaia Green
product list, terpene boosters). Likely personal reference material that
belongs with the THCMedSolutions project files, not this intake. Flagging
in case it was misrouted rather than assuming and discarding it.

---

## BATCH 7 (final) + DEEP VERIFICATION PASS — 2026-08-27

`Sophisticated_Prompts.docx` — **REJECT, one small extraction.** Three generic
"god-tier prompt" templates (Auto-CEO multi-persona simulation, God-Mode Prompt
Architect, Dopamine-Hook content engine). Same class as the batch-6 rejects: no
contract, no evidence gate, no falsification. One idea is genuinely reusable —
template #2's recursive loop (draft → 3-point self-critique → 3 targeted
questions → versioned iteration v1.1/v1.2) is a real technique and maps
directly onto OMEGA 100X's stated job. Extract that loop shape; discard the rest.

---

# CONSOLIDATED FINDINGS — everything verified by execution, not by reading

## 1. There is a newer canonical baseline than what I was loaded with

`MALACHII_SOVEREIGN_OS_v3.3_RC1.6.2_CLAUDE_CODE.zip` is a real git repo (3
commits, author "MALACHII Autopilot") and its own `VERSION.md` states it
**formally supersedes** `MALACHII_Sovereign_OS_v3.3_RC1_PORTABLE.zip` — the
exact file I was given at session start. It also explicitly retires
`MALACHII_Sovereign_OS_v3.1.zip`, `MALACHII_Operating_System.docx`, and
`MALACHII_OS_COMPLETE_FOLDER.zip` ("a transport container holding
byte-identical copies … not a distinct build" — which my own hash checks
independently confirmed).

**Verified by execution here:** `npm test` → **73/73 pass, 0 fail.**

**It already contains the clock fix I made earlier this session.**
`runtime/src/runtimeManifest.ts:21` takes `now`; `authorization.ts:9` passes it
through. Its `VERSION.md` documents the identical defect in the older lineage,
citing the same two failing tests by name. So: my finding was independently
correct, and my *fix* was redundant against a baseline I hadn't been given.
Reinforces the lesson rather than wasting it — "runtime truth over remembered
capability" applies to which artifact is current, not just to test results.

**What RC1.6.2 adds that no earlier copy had:**

| Layer | Substance |
|---|---|
| `SOVEREIGN_CONTROL_PLANE_KERNEL.md` (RC1.4) | Control decides & reconciles; execution performs; evidence reports reality back. Eligibility-before-score routing — authorization violations are **hard exclusions, never score penalties**. |
| `AUTONOMOUS_EXECUTION_PLANE.md` (RC1.3) | Capability *families* (`browser.*`, `code.execute`, `deploy.publish`, `agent.spawn`…) instead of provider identities. DAG execution waves. Per-step `actionId` + redemption ledger for replay/TOCTOU protection. |
| `LIVE_CONTROL_FABRIC.md` (RC1.5) | Durable atomic state, circuit breakers, durable work queue with leases, governed network policy (allowlist + private-address denial + redirect revalidation), argv-only command adapter (`shell:false`), rooted FS adapter with symlink-escape defense, MCP + A2A HTTP adapters, dependency-free OpenAI/Anthropic/Gemini adapters with secrets injected at call time and never persisted. |
| `DISTRIBUTED_WORKER_FABRIC.md` (RC1.6) | Authenticated remote worker daemons, nonce-challenge A3 capability observation, signed receipts, durable leases, signed-heartbeat capability-revocation propagation, worker-loss failover. |
| `MALACHII_AUTOPILOT.py` + `AUTOPILOT_POLICY.md` | An actual boot/verify harness — `python MALACHII_AUTOPILOT.py boot`. |
| `command-center/` | Working static GUI shell, correctly badged `DEMO / SIMULATED EXECUTION` because it is *not* wired to the runtime — a correction two prior review rounds demanded. |
| `evidence/` | Real run artifacts, incl. a multi-process loopback proof where worker-a genuinely fails and the fabric fails over to worker-b, ledger verified. |

**Truth-boundary discipline is the best thing in this package.** Every claim
carries an explicit negative: "LIVE_MULTI_PROCESS_LOOPBACK, **not** multi-host
HA, distributed consensus, SPIFFE/SPIRE, or Internet-scale." `LIVE_CONTROL_FABRIC.md`
even lists what failed in the build host (external DNS returned `EAI_AGAIN`;
headless Chromium timed out). That is the standard to hold everything else to.

## 2. The MEMF repair chain is complete and verified end-to-end

Three artifacts form one coherent chain — audit → design → implementation:

1. **CMA-001 Claude audit** (batch 1) — proved 14/15 attacks by execution.
2. **`MEMF_SUPERUSER_AUTHORITY_FOUNDATION.docx`** (batch 5) — the design answer.
   Derive `independentSourceCount` from `Set(sourceRefs[].sourceGroup)`, never
   the caller. Clamp `createMemory()` to `M0_OBSERVATION`. Retire the
   `approvedBySuperUser` boolean for a hardware-signed `SuperUserApproval`
   (YubiKey PIV/CTAP preferred, TPM 2.0 machine-bound alternative, software keys
   dev-only). Adaptive ceremony by risk class — single touch for a narrow
   procedural fix, dual-key + time-lock for M5 constitutional. Phased: v1.1
   mechanical repairs → v1.2 hardware signing → v1.3 TPM attestation. Ships 6
   falsification tests that must stay **red** on the unpatched baseline.
3. **`CMA002R_TRUE_CHALLENGER_v0.1`** (batch 5) — the v1.1 implementation.
   Minimal diff: 2 source files changed (`memoryFabric.ts`, `memoryTypes.ts`)
   + 1 new test file, with baseline↔challenger SHA-256 recorded per file.
   **Verified by execution here: `npm test` → 92/92 pass** (84 baseline + 8 new
   hardening). Honestly self-reports what it did *not* fix (evidence IDs still
   not resolved against CAS at every path; the 21-attack campaign not yet re-run
   against this exact package; no hardware signing — that's v1.2).

This chain is the single most valuable thing across all 26 files: a real defect
found by execution, a real design response, a real minimal implementation, all
three independently verifiable, none of them overclaiming.

## 3. THREE artifacts now claim the "website factory" role — this needs a decision

Your stated goal is "get this solid, then load the first skill of the website
factory." That skill already exists — twice — plus this repo's own rules:

| # | Artifact | Form | Verified | Depth |
|---|---|---|---|---|
| A | This repo's `CLAUDE.md` | 7 standing rules + `design.md` + `performance.md` | in active use | Interview → build → 5 validation gates → adversarial review. Opinionated stack (Next.js/Tailwind/shadcn). Practical, informal. |
| B | `skills/malachii-sovereign-website-factory` (inside RC1.6.2) | Real Agent Skill — `SKILL.md` + 5 reference standards + JSON schema + 2 validator scripts + tests | **15/15 tests pass; example packet validates** (run here) | 15-step workflow. 4 honest execution states (`spec_only` → `source_build` → `preview_verified` → `deployed_verified`). WCAG 2.2 AA, OWASP ASVS 5.0, Core Web Vitals at p75. 3 release stages. Depends on Skill 001. Emits a `website-build-packet.json`. |
| C | `MALACHII-Website-Factory-OS-v1.0` (standalone) | 78-file product: 9-layer architecture, 10 gates (G0–G9), 4 authority levels (A0–A3), 6 workflows, 8 capability packs, 15 templates, `factory.py` CLI | **3/3 self-tests pass; package validator passes (78 files, 18 JSON docs)** (run here) | Most complete. Writes a `.malachii/` control dir. `factory.py init/audit/gate`, no shell strings, config-declared argv gates. Ships 2 real worked examples (rez-runner, thcmedsolutions). |

**They agree on principles and differ on form.** All three enforce
evidence-before-completion, authority-before-action, no-fake-proof, and a
quality floor. B is the right *shape* (a portable Agent Skill, already
registered in `skills/REGISTRY.json`, already dependency-linked to Skill 001).
C has the richer *content* (gate state machine with named exit evidence per
gate, authority tiers, capability packs, worked examples, a real CLI).

**Recommendation (not applied — your call):** keep **B as the vessel**, merge
**C's gate table, authority model and packs into it**, and reduce **A** to the
project-specific layer it actually is (the FutureDeskAI stack choices, design.md
taste, template menu). One skill, one registry entry, no third competing spec.

**Note the safety flag inside C:** its README states at least one source
document in the corpus it was built from contained apparently-live plaintext
credentials, excluded from the package, with a rotate/revoke warning. If that
corpus is yours, treat it as still outstanding.

## 4. Reject pile — named, not silently dropped

`MALACHII_v5.0`, `MALACHII_v5.1`, `OMEGA_PROMPT_FRAMEWORK`,
`100_sentences_god_like_AI_SYSTEMS`, `Sophisticated_Prompts` — an earlier
lineage of pure prompt-writing: "transomniscient," "supraomniscient,"
"omnipotent… mathematically proven authority," "decentralized quantum networks."
No contract, no evidence requirement, no gate, no falsification test. Rejecting
these *is* the locked Kernel operating correctly — Non-Negotiable Principle #12:
truth, authority, capability and quality are never granted merely because an AI
said so. Same verdict your ChatGPT session reached on the pasted Google memory
material.

`To_get_that_ultimate.docx` — cannabis cultivation nutrient list. Almost
certainly belongs with the THCMedSolutions project files, not this intake.
Flagged rather than assumed-and-discarded.

## 5. Duplicate accounting (26 files → 17 distinct artifacts)

Confirmed by SHA-256, not by filename: `v3.1` uploaded ×3; `v3`, `RC1.6.2_CLAUDE_CODE`,
`malachiiorchestrator`, `REVIEW_CLAUDE` each ×2; `OS_COMPLETE_FOLDER`,
`SKILL_001`, `RC1_PORTABLE` each duplicated the session-start load. Nine
redundant uploads. RC1.6.2's own `VERSION.md` had already predicted exactly this
("copies the Super-User was holding across sessions") and reconciled them.

## 6. Deferred — deliberately not done

- `MALACHII_RC1.6_CROSS_MODEL_UPLOAD_PACKAGE.zip` — opened to top level only;
  its embedded `DISTRIBUTED_WORKER_FABRIC.zip` very likely duplicates material
  already inside RC1.6.2. Worth a hash check before spending a pass on it.
- Gemini and Grok CMA-001 blind reviews remain **unrun**. The audit protocol's
  whole design is three independent reviewers; you have one. Running the other
  two against the same frozen baseline is cheap and directly strengthens the
  MEMF decision.
- `skillsmain` / `superpowersmain` — third-party Agent Skills references
  (Anthropic's skills repo; the `obra/superpowers` plugin). Useful as
  convention references when formalizing more MALACHII skills. Structural
  inventory only.
- `memoirfactory` — unrelated book-writing scaffold. Noted, not analyzed.
- `Quality_Comparison_to_Another_Cosmic_Dimension.zip` — real THCMedSolutions
  React/TSX source; grounds one of WF-OS's two worked examples. Not read
  component-by-component.
