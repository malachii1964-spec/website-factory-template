# MALACHII Trust Kernel — CMA-002 Stage A

A working implementation of the part of the MALACHII Sovereign Master
Specification that is precise enough to build and load-bearing enough to matter:
**memory maturity that is mechanically enforced rather than asserted.**

Read [REVIEW.md](./REVIEW.md) first — it explains what was kept from the
specification, what was cut, and why the Gemini `CMA-001` audit was discarded
rather than repaired.

Zero runtime dependencies. Node's built-in `crypto` only, so the kernel stays
portable and provider-neutral (spec §18–19).

## The one idea

A caller supplies **references**. The kernel reaches the **verdict**.

Nothing a caller sends can carry trust. Not a maturity level, not a
`trust_override`, not an `independentSourceCount`, not an
`approvedBySuperUser: true`. Those fields are rejected by name, at any nesting
depth, on every entry point — and the type system rejects them at compile time
as well.

## Running it

```bash
pnpm install                 # from the repo root
cd malachii
../node_modules/.bin/tsc --noEmit -p tsconfig.json   # typecheck
../node_modules/.bin/vitest run                       # 58 tests
node scripts/mutate.mjs                               # constitutional mutation testing
```

## What is implemented

| Spec | Component | File |
|---|---|---|
| §32 | Forbidden trust fields, rejected not stripped, at any depth | `src/trust/forbiddenFields.ts` |
| §27–28, P-009 | Authority plane; a request may narrow authority, never widen it | `src/trust/authority.ts` |
| §38 | Constitution: pinned root keys, thresholds, no runtime edits | `src/trust/constitution.ts` |
| §36 | Evidence resolver; `VerifiedEvidenceRef` is unforgeable (brand + registry) | `src/memory/evidence.ts` |
| §37 | Independence by lineage root, with cycle detection | `src/memory/evidence.ts` |
| §38, §51 | Signed approval / outcome receipts; nonce replay protection; content binding | `src/memory/receipts.ts` |
| §34, §39–40 | Promotion engine, M0→M5, cumulative requirements, one level at a time | `src/memory/promotionEngine.ts` |
| §33, §41, §54 | Fabric: create (always M0), import (history kept, trust withheld), lifecycle | `src/memory/fabric.ts` |
| §35, §52 | Append-only hash-chained ledger; effective maturity by replay | `src/ledger/` |
| §53 | Startup reconciliation; ledger wins, divergent projections quarantined | `src/memory/fabric.ts` |
| §43–46 | Retrieval: authorise before rank, no global wildcard, no blank-query dump | `src/retrieval/retrieval.ts` |
| §55 | The 20-case attack corpus, executable | `tests/attacks/` |
| §56 | Property invariants P-001…P-010 over generated input | `tests/properties/` |
| §57 | Constitutional mutation testing | `scripts/mutate.mjs` |

## Three design decisions worth knowing

**Promotion advances exactly one level.** Not "no direct M5" — no skipping at
all. Each step is earned and ledgered separately, which keeps the audit trail
readable and makes the M0→M5 jump structurally impossible rather than
conditionally blocked.

**Retrieval reads live state through a supplier function, never a snapshot.**
An earlier version handed callers a materialised array; the ATK-020 test caught
that a caller holding that array across a revocation could still see the revoked
memory. Reading live on every call makes the cache escape unrepresentable rather
than merely tested against.

**Creation events carry the whole record, so the projection is a true cache.**
The ledger is not just an audit trail of *what changed* — it holds every
immutable field, which is what lets reconciliation rebuild a corrupted or
deleted projection from the log rather than only detecting that it is wrong.
Delete `projection.json` and the next start reconstructs all of it.

## Deliberately not built

- **Persistent ledger.** In-memory, with `export()`/`restore()` and full chain
  verification on restore. Reconciliation is proven against a tampered chain and
  a tampered projection, but not across a real process restart. This is the one
  honest gap against §52 and it is the next thing to do.
- **Learning governor (Stage C), retrieval index (D05–D06), fuzz corpus (E04).**
- **Everything in CMA-003 through CMA-007.** See REVIEW.md §5.

## Known issues

- An approval nonce is consumed during evaluation, so a promotion denied for an
  unrelated reason burns the receipt and needs a fresh signature. Safe direction,
  mildly annoying in practice.
- `SourceRegistry` treats an unregistered source as its own lineage root. This
  is the permissive direction and it is where independence can be inflated —
  see REVIEW.md §3.4. Registering provenance is currently a human duty.
- Principal credentials are compared as plain strings in an in-memory registry.
  Fine for a kernel under test; a real deployment needs hashed credentials and a
  real store.
- The evidence store and source registry are still in-memory, so evidence does
  not survive a restart even though memory does. Promotion after a restart needs
  its evidence re-supplied. Persisting the evidence plane is the natural next
  step and the ledger format is already content-addressed for it.
- The projection is rewritten in full on every mutation. Fine at this scale,
  quadratic at large ones; it wants an incremental write before it holds real
  volume.
