# CMA-002 Stage A — build report

Status: **READY_FOR_BLIND_REAUDIT** (Stage A scope only)

Per §112 and §126, everything below was executed. No result in this report is
predicted, estimated, or transcribed from a previous run.

## Baseline verification — NOT PERFORMED, and why

§113 requires verifying the frozen baseline against SHA-256
`d3a67b66c07413b4196899797effd08325cf98f728e776e9ad3e8c37a42f6ff5` before any
work, and stopping if it does not match.

**No baseline artifact exists on this machine.** No
`MALACHII_SOVEREIGN_OS_RC1.6.2_MEMF_v1_FOUNDATION_CANDIDATE.zip`, no
`runtime/src/memory/memoryTypes.ts`, no MALACHII source of any kind. Nothing was
hashed because there was nothing to hash.

Consequence: this is **not** a challenger against RC1.6.2. It is a clean-room
implementation of the Stage A trust kernel written directly from the master
specification. If the frozen baseline is later produced, this must be re-scoped
as either a challenger or a replacement, and re-audited as such.

## CMA-001 audit disposition — DISCARDED

The Gemini `CMA-001_BLIND_AUDIT` was assessed and rejected as fabricated: it
audits a Python codebase that the specification does not describe, cites modules
that appear in no section, contradicts itself on file paths, and claims executed
exploits and fuzzing runs against files that do not exist. Full reasoning in
`REVIEW.md` §1. No finding from it was repaired, because no finding from it
refers to real code.

## Gates executed

| Gate | Command | Result |
|---|---|---|
| Typecheck | `tsc --noEmit -p tsconfig.json` | **PASS** — 0 errors, `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` |
| Kernel unit suite | `vitest run tests/kernel.test.ts` | **PASS** — 13/13 |
| Attack corpus (§55) | `vitest run tests/attacks` | **PASS** — 34/34 |
| Property invariants (§56) | `vitest run tests/properties` | **PASS** — 11/11 |
| Total | `vitest run` | **PASS** — 58/58 |
| Constitutional mutation (§57) | `node scripts/mutate.mjs` | **PASS** — 15/15 killed, 100% |

Host repository gates, re-run to confirm nothing regressed:

| Gate | Result |
|---|---|
| `tsc --noEmit` (root) | PASS — 0 errors |
| `eslint` (root) | PASS — 0 errors, 1 pre-existing warning in `scripts/generate-pdf.mjs` |
| `vitest run` (root) | PASS — 10/10 |
| `next build` | PASS — 15 routes, 30 SSG product pages |

## Attack corpus coverage

All twenty §55 cases are implemented and blocked. ATK-005, ATK-010, ATK-015,
ATK-017, ATK-018, ATK-019 and ATK-020 carry more than one case each, which is
why the file reports 34 tests for 20 attacks.

ATK-001 direct M5 · ATK-002 fake independent count · ATK-003 same-source
corroboration · ATK-004 contradiction bypass · ATK-005 fake Super-User approval
· ATK-006 fake regression · ATK-007 phantom evidence · ATK-008 retrieval fitness
inflation · ATK-009 fabricated outcome · ATK-010 global leakage · ATK-011
blank-query dump · ATK-012 learning authority escalation · ATK-013 global
learning from local evidence · ATK-014 nonexistent regression · ATK-015 restart
ledger divergence · ATK-016 missing rollback · ATK-017 caller trust override ·
ATK-018 forged security metadata · ATK-019 retrieval metadata scope injection ·
ATK-020 revoked-memory cache escape

## Mutation results (the credibility gate)

A green test suite proves nothing until the controls are broken on purpose. Each
mutation disables exactly one governance control; all fifteen were killed, so no
control in the kernel is decorative.

Approval verification · imported history conferring trust · corroboration
threshold · contradiction blocking · phantom-evidence rejection ·
retrieval-driven promotion · global wildcard · blank-query rejection ·
revocation reachability · reconciliation · authority widening · trust-field
rejection · single-level promotion · outcome signature verification · ledger
hash-chain integrity

Machine-readable results: `MUTATION_RESULTS.json`.

## Defects found and fixed during the build

Both were found by the tests, not by reading:

1. **`VerifiedEvidenceRef` brand was type-only.** A `declare const unique symbol`
   was used as a runtime computed key, throwing `ReferenceError` on every
   resolve. Fixed by keeping the compile-time brand and adding a module-private
   `WeakSet` registry plus an `isVerifiedEvidenceRef` runtime guard.
2. **`records()` returned a live map iterator, then a stale snapshot.** The first
   consumer exhausted it; making it an array then exposed the actual ATK-020
   attack, where a caller holding a pre-revocation snapshot still saw revoked
   memory. Fixed at the API level: `RetrievalInputs.records` is now a supplier
   function, so retrieval always reads live state and a stale snapshot cannot be
   supplied at all.

## Scope not covered

Stage B (partial — lifecycle transitions are implemented, learning is not),
Stage C learning governor, D05–D06 derived retrieval index, E04 fuzz corpus,
E07 performance benchmark, and a persistent on-disk ledger. Reconciliation is
proven against a tampered chain and a tampered projection but not across a real
process restart; that is the one honest gap against §52.

## What this build does not claim

Not promoted. Not certified. Not benchmarked against a baseline, because no
baseline was available to benchmark against. Per §71 and §112, promotion
authority rests with the Super-User and is not something this build can assert.
