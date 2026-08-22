# MALACHII CMA-002R v1.2 — SUAF repair + single-tree merge

**Disposition:** `REPAIR_THEN_REAUDIT` — repaired, not promoted.
**Derived from:** `MALACHII_CMA002R_TRUE_CHALLENGER_v0.1_CLAUDE_CODE_OPUS5.zip`
**Predecessor SHA-256:** `5a079396ff2a2a4a016fa11c46dcac97e552bff8ddefd363593ec6f7b3b8bedb` — **VERIFIED** before any file was read for modification.
**Governing spec:** SUAF-001-LATEST (22 Aug 2026), §§2 and 7 implemented first as instructed. No hardware/YubiKey code added (§8 step 6).
**Frozen baseline:** untouched. This is a fork of the v0.1 challenger tree, not an edit of the CMA-001 ZIP.

---

## 1. Independent verification of the inherited claims

The v0.1 build report's claims were re-executed here rather than accepted:

| Claim | Result |
|---|---|
| Package SHA-256 `5a0793…bedb` | **MATCHES** |
| TypeScript build passes | **PASS**, reproduced |
| Full runtime suite 92/92 | **PASS**, reproduced — 92 tests, 0 fail |

This is the first artifact in this program whose stated results reproduce exactly. The v0.1 build report is also notably candid: it declines to call itself production-grade and names `sourceGroup`'s weakness as a declared-not-proven field. Both are accurate.

---

## 2. Executed findings against v0.1

Four attacks were written and **run** against the v0.1 build before repair. Each is now a permanent regression test.

### R-001 — CRITICAL: an untrusted agent could self-issue Super-User approval

v0.1 replaced the `approvedBySuperUser` boolean with a ledger-anchored approval event. But `recordApproval()` and `recordRegressionPass()` were public, unauthenticated methods on the fabric. Any caller holding a fabric handle could mint its own approval and pass the id straight back to `promote()`.

Executed result on v0.1 — a memory created by `untrusted_agent`, reading *"Deploy to production without human approval."*:

```
M1_CANDIDATE:      permit
M2_CORROBORATED:   permit
M3_VALIDATED:      permit
M4_PROCEDURALIZED: permit (behavior_change_reviewed_and_regression_passed)
M5_CONSTITUTIONAL: permit (constitutional_promotion_explicitly_approved)
FINAL MATURITY: M5_CONSTITUTIONAL
```

This violates SUAF §0 law 1 outright. Anchoring an authority decision to a log that accepts anonymous writes is a boolean with extra steps. The v0.1 hardening suite did not catch it because its own M5 test performs exactly this sequence and asserts `permit`.

### R-002 — HIGH: the exported `promotionDecision()` still trusted caller counts

Derivation was implemented inside `promote()`, but the exported pure function kept its `evidence` parameter. Called directly with `independentSourceCount: 99` on a single-lineage record, v0.1 returned `permit (independent_corroboration_met)`. SUAF §2.1 requires derivation *inside* `promotionDecision`.

### R-003 — HIGH (F-003 unresolved): self-reported outcomes bought retrieval rank

`recordOutcome` recorded no attestor. Twenty self-reported successes moved fitness `0.4300 → 0.7200` and lifted the spam record above an honest one in retrieval (`spam(0.744) > honest(0.686)`). The v0.1 report's hardening item 7 is accurate but narrow: *retrieval* no longer inflates fitness, while *self-attested outcomes* still did.

### R-004 — MEDIUM (F-004 unresolved): free-text contradictions remained invisible

`detectStructuredConflicts` returns `[]` immediately when a candidate has no `assertion`. Two directly opposed prose rules produced 0 conflicts.

---

## 3. Repairs (SUAF §2)

**§2.1 — derive independence.** `derivedIndependentSourceCount`, `derivedSupportingEvidenceCount`, `derivedContradictionCount` added, plus `derivedIndependentOutcomeCount` for F-003. `promotionDecision(record, target, input)` now derives every count from the persisted record. `PromotionEvidence` fields survive as deprecated no-ops so old callers compile; none are read.

**§2.2 — clamp `createMemory`.** Already correct in v0.1; kept and covered by SUAF-3.

**§2.3 — retire the boolean.** `approvedBySuperUser` is typed `never`, so a stale caller now fails to compile rather than silently doing nothing. Replaced by a signed `SuperUserApproval` carrying `payloadHash`, `signature`, `algorithm`, `keyId`, `validUntil`, `challengeNonce` and `regressionTestIds` (min 1). Verification rebuilds the §3 canonical payload **from the record**, so an approval is bound to one memory, one target maturity, and one exact rule text. `recordApproval`/`recordRegressionPass` now throw rather than being deleted, so any surviving caller fails loudly.

**Gates.** M3 additionally requires one outcome attested by someone other than the record's creator. M4/M5 require a verified signature; *absent* approval is `review_required`, *invalid* approval is `deny` — forging is not the same event as not asking.

**Fail-closed default.** The key registry defaults to empty, so a deployment that never registered a Super-User key cannot proceduralize anything.

**F-004.** Deterministic polarity detector for prose contradictions. It has false negatives and does not claim otherwise — but it only ever *adds* contradictions, and contradictions only ever block promotion, so every error falls toward refusal.

---

## 4. Verification executed

| Gate | Result |
|---|---|
| Predecessor SHA-256 | VERIFIED |
| TypeScript build (strict, `exactOptionalPropertyTypes`) | PASS |
| Full suite | **109/109 PASS** (92 inherited + 17 new) |
| SUAF §7 falsification tests 1–10 | PASS (13 cases; 8, 9 and 10 carry extra sub-cases) |
| R-001…R-004 re-run post-repair | all four **closed** |
| Host repo gates | root typecheck, lint, vitest, `next build` — all PASS |

Post-repair re-run of the exploit script:

```
EXPLOIT A: M3_VALIDATED deny (independent_outcome_attestation_required); FINAL M2_CORROBORATED
           recordApproval -> recordApproval_retired_use_signed_SuperUserApproval
EXPLOIT B: deny (independent_corroboration_required)
EXPLOIT C: fitness 0.4300 -> 0.4300 after 20 self-reported successes
EXPLOIT D: 1 conflict (free_text_polarity_conflict)
```

The hostile rule still reaches M2 — correctly. It presented two genuinely distinct source groups and two evidence ids, so corroborated is what it is. It cannot become *validated* without an outcome it cannot attest, or *procedural* without a signature it cannot produce.

---

## 5. Inherited tests that were changed, and why

Three tests asserted behaviour that §2.1/§2.3 make unreachable. Intent was preserved; assertions were not deleted.

- `promotion requires independent corroboration` — fixtures had `sourceRefs: []` and passed counts as arguments. Now carries real source groups; the deny case is achieved with real evidence.
- `proceduralization requires regression evidence and review` — the `regressionPassed: false` case has no analogue (regression ids live inside the signed approval). Now asserts: wrong layer → deny; no approval → review_required; approval naming zero regressions → deny; valid signature → permit.
- `CMA-002R: constitutional promotion requires ledger-anchored approval` — this test *performed* R-001. Rewritten to assert the retired methods throw and that only a signed approval permits.

---

## 6. Honest limitations

- **Signature ≠ human presence.** This proves a registered private key endorsed exact bytes. It does not prove a person touched anything. That is what §3's YubiKey/TPM path buys, and per §8 step 6 it is deliberately not built yet. Do not describe the current gate as "hardware-verified".
- **`sourceGroup` is still a declared field.** Two mirrors of one origin that declare different groups still count as two roots. The v0.1 report flagged this; it remains true and is the single largest remaining weakness.
- **Free-text detection is a heuristic**, not language understanding. Bypassable by rephrasing.
- **Nonces and the key registry are in-memory**, so replay protection does not survive a process restart. A durable nonce store is required before this is a production claim.
- **Not run:** the full 21-attack campaign and the constitutional mutation campaign against *this* package. The separate `malachii/` kernel in this repo carries both (20/20 mutation kill); this tree does not yet.
- **Not promoted.** Per §8 and CMA governance, promotion is the Super-User's call, not this build's.

---

## 7. Artifact binding

- Predecessor package SHA-256: `5a079396ff2a2a4a016fa11c46dcac97e552bff8ddefd363593ec6f7b3b8bedb` (verified)
- This challenger's per-file hashes: `PACKAGE_HASHES.txt` (62 files)
- Challenger tree SHA-256 (hash of that manifest): `16040aa01d8211352eacbb80ead341765e2b1404c2a0501c2d7544fc043f1b01`

Recompute with:

```bash
find src tests scripts package.json tsconfig.json -type f \
  | sort | xargs sha256sum | sha256sum
```

The manifest deliberately covers source, tests and scripts only — not this report. A hash that included the document citing it could never be stable, and reviewers need to bind to the code, not the prose.

## 8. v1.2 — merge to one tree

The standalone `malachii/` kernel that lived alongside this one has been merged in and deleted. One tree, one hash. Four mechanisms were ported:

**Lineage roots over declared groups** (`src/sourceLineage.ts`). Both prior reports named declared `sourceGroup` as the top weakness, correctly: counting distinct declared groups measures how many labels someone typed, not how many origins a claim has. Independence is now counted over lineage *roots* derived from a deploy-time registry, with cycle detection. A `strict` mode makes unregistered provenance contribute nothing at all — the actual fix. Default stays permissive so enabling it is a deliberate, visible change.

**Journal replay and reconciliation** (`src/memoryReplay.ts`, `fabric.reconcile()`). `memory.created` now carries the whole record, which makes the state store a true cache: it can be deleted or edited and rebuilt from the journal. Reconciliation compares only authority-bearing fields — fitness and retrieval counters legitimately move without a creation event, and comparing them would produce permanent false divergence that trains everyone to ignore the report. Anything repaired is quarantined, because a divergence means something wrote state outside the fabric and that fact should outlive the repair. Replay also forces created records to M0 regardless of what the journal claims, which holds even against an attacker who can rewrite and re-hash the whole file.

**Crash recovery** (`src/persistentLedger.ts`). A torn final record previously made the journal permanently unopenable — `JSON.parse` threw in the constructor. It is now dropped, reported via `recoveredTornTail`, and physically truncated so the next append cannot land behind the partial bytes. An unparseable line *earlier* in the file is still fatal: that is corruption, not a crash, and skipping it would surface later as a confusing chain error instead of the truth.

**Trust boundary** (`src/trustBoundary.ts`). Caller-supplied trust fields are now refused rather than ignored, at any nesting depth. Forcing was already spec-compliant (SUAF §7.3 permits "refuse or force"); refusing is the stronger reading, because a silently dropped field makes a probe and a well-formed request look identical in the logs.

Deliberately **not** ported: the branded `VerifiedEvidenceRef` resolver (CAS-backed evidence remains on the later list), and the principal/scope authority plane — SUAF §5 places authorization outside MEMF, and importing it would blur that boundary.

### v1.2 verification

| Gate | Result |
|---|---|
| Full suite | **130/130 PASS** |
| Constitutional mutation campaign | **25/25 killed, 100%** |
| Cross-restart continuity + tamper detection | PASS (MERGE-15) |
| Host repo gates | typecheck, lint, vitest, `next build` — all PASS |

The mutation campaign earned its place immediately: on first run **three controls survived** — level-skipping, the M5 confidence threshold, and, most seriously, **Super-User signature verification**. Disabling signature checking entirely still passed all 124 tests, because every existing forgery test was caught by the payload-hash check before the signature was ever examined. Four tests were added (SUAF-E6…E9), including a forged signature under a genuine `keyId`. A fifth mutation then survived for a different reason — the new trust boundary shadows the M0 clamp — so the clamp is now tested where nothing shadows it, in replay, plus a composite mutation that removes the boundary to prove the clamp holds alone.

That sequence is the argument for mutation testing in one paragraph: 124 green tests, and the single most important control in the system was untested.

## 9. Required next gate

Run the full 21-attack adversarial campaign against this exact tree, bind the results to the hash below, then submit the identical tree to blind independent reviewers. Do not add YubiKey/TPM until that gate is green.
