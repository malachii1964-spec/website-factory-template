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
| Restart / persistence (§52–53) | `vitest run tests/restart` | **PASS** — 11/11, real OS processes |
| Total | `vitest run` | **PASS** — 69/69 |
| Constitutional mutation (§57) | `node scripts/mutate.mjs` | **PASS** — 20/20 killed, 100% |
| Runs without a build step | `node tests/restart/child.ts seed <dir>` | **PASS** — plain `node`, no toolchain |

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
hash-chain integrity · torn-tail repair · corrupt-line detection · orphaned
cache records · missing cache records · whole-record comparison

MUT-17 (an unparseable ledger line must be reported as corruption, not skipped)
survived its first run: no test covered a malformed line mid-log. The gap was
closed with a test rather than by dropping the mutation, and the rate returned
to 20/20.

Machine-readable results: `MUTATION_RESULTS.json`.

## Persistence and restart (added after the first Stage A pass)

§52 and §53 are now implemented and demonstrated across genuine process
boundaries. Every case in `tests/restart/` spawns `node` as a separate OS
process; simulating a restart in-process would leave the in-memory maps intact
and prove nothing.

Demonstrated: maturity, status, statement and revocation all survive a restart ·
a deleted `projection.json` is fully rebuilt from the log · a cache edited to
claim M5 is overruled and quarantined · a cache edited to un-revoke a memory is
overruled · a record injected into the cache that the log never saw is discarded
· a tampered or removed ledger line refuses to start · a half-written final
record is dropped, reported, and truncated so later appends stay valid · a
malformed line mid-log is reported as corruption rather than skipped.

Supporting change: creation events now carry the full immutable record, so the
ledger is a complete source of truth and the projection is a real cache that can
be deleted and reconstructed — reconciliation repairs rather than only detects.

## Defects found and fixed during the build

The first two were found by the tests, the third by mutation testing:

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
3. **A torn ledger tail was skipped on read but left on disk.** Recovery looked
   correct in isolation, but the next append would land behind the partial bytes
   and turn a recoverable crash into a permanently unparseable log. The store now
   truncates to the last complete record during `open()`.

## Scope not covered

Stage C learning governor, D05–D06 derived retrieval index, E04 fuzz corpus, and
E07 performance benchmark. Stage B is partial: lifecycle transitions are
implemented, learning is not. The evidence plane is still in-memory, so evidence
does not survive a restart even though memory does — promotion after a restart
needs its evidence re-supplied.

## What this build does not claim

Not promoted. Not certified. Not benchmarked against a baseline, because no
baseline was available to benchmark against. Per §71 and §112, promotion
authority rests with the Super-User and is not something this build can assert.
