# MALACHII — architectural review

Reviewed: `MALACHII_Operating_System.docx` (the persona prompt), the
`MALACHII SOVEREIGN MASTER SPECIFICATION v1.0` transcript (134 sections), and
the Gemini `CMA-001_BLIND_AUDIT` artifact.

Reviewer's short version: **roughly 15% of this specification is excellent and
buildable today. I built that 15%. The rest is either vocabulary that cannot be
implemented as written, or real work that is years away and should not block the
part that matters.**

---

## 1. The Gemini audit is fabricated. Do not repair against it.

Disposition: **DISCARD**. Not "repair then re-audit" — discard.

| Evidence | Detail |
|---|---|
| Language mismatch | Every finding cites Python (`malachii/memory/promotion.py:42`). Spec §63 says the code lives in `runtime/src/memory/memoryTypes.ts` — TypeScript. Both cannot be the frozen baseline. |
| Modules that exist nowhere | `reward/verifier.py`, `storage/vector_store.py`, `retrieval/engine.py` appear in no section of the spec. |
| Internal contradiction | MAL-003 names `malachii/security/boundary.py`; its own exploit script imports `malachii.security.context`. |
| Claimed execution | "EXECUTED CONFIRMED EXPLOIT" and "Fuzzing … confirmed `IndexError`" assert work was *run* against files that do not exist. |
| No artifact to audit | There is no baseline ZIP on this machine. The SHA-256 gate in §113 (`d3a67b66…`) cannot be evaluated, so nothing was hashed, cloned, or inspected. |

Why it reads convincingly: it restated the requirements it was handed as if they
were discoveries. "Caller-controlled trust," "revocation doesn't propagate,"
"single-source derivation" are §32, §42 and §37 of your own spec, reworded into
finding-shaped prose with plausible line numbers attached.

This is exactly the failure mode §126 forbids, and it is the strongest available
argument for building the trust kernel: an untrusted model produced a confident,
well-formatted, entirely imaginary security report, and the only thing that
caught it was cross-checking against an independent artifact. That is what
lineage-rooted evidence is *for*.

---

## 2. What is genuinely strong

These survive review and are the reason the project is worth building.

1. **T0 / T1 / T2 (§27–28).** The central claim — an LLM's assertion can never
   mint verified state — is correct and unusually well drawn. Most agent
   memory systems have no equivalent and quietly let model confidence become
   stored fact.
2. **Forbidden caller-supplied trust fields (§32).** This is ordinary, correct
   security engineering: never trust the client. Rejecting rather than stripping
   is the right call — stripping turns a probe into a silent no-op.
3. **Independence counted by evidence lineage root, not by reviewer count
   (§37).** The sharpest idea in the document. Three models citing one source is
   one source. Nearly every multi-agent "consensus" design gets this wrong and
   mistakes correlated agreement for corroboration.
4. **Signed approval receipts instead of `approvedBySuperUser = true` (§38).**
   Correct, and the binding to `objectHash` is the part most people forget.
5. **Append-only hash-chained ledger, derived projections, startup
   reconciliation (§35, §52, §53).** Well-understood event sourcing, applied to
   the right problem. "Observed ledger state wins over claimed projection state"
   is the correct tiebreak.
6. **Retrieval cannot increase maturity (§46, P-003).** This one line prevents
   the self-reinforcing loop that is the actual failure mode of every
   retrieval-augmented memory system: a hallucination gets retrieved, retrieval
   looks like use, use looks like validation.
7. **Import ≠ create (§54).** Preserve history, withhold trust. Exactly right.
8. **Baseline / challenger / blind review / no self-promotion (§61, §107).**
   The right shape for self-modification.

---

## 3. What is weak, and what I would cut

**3.1 Scope. This is the biggest problem.**
134 sections spanning CMA-002 through CMA-007 describes several engineer-years.
There is no MVP anywhere in the document, and no statement of what MALACHII does
for you on day one. Every value claim in it is about governing itself. A system
that cannot yet do anything, but governs its inability rigorously, is a
liability. The trust kernel is worth building *first* precisely because it is
the part that gets harder to retrofit later — but everything after it needs a
user-facing job before it earns a line of code.

**3.2 Ceremony inflation.**
Six maturity levels × five learning levels × five assurance levels × six quality
levels × six autonomy levels × three formation axes. I implemented all six
maturity levels because you specified them, and the ladder works — but I predict
M2/M3/M4 collapse in practice and you end up using three tiers: observed,
corroborated, and constitutional. Watch which levels ever get used and delete
the rest.

**3.3 §87–98 (Quality Intelligence) is vocabulary, not specification.**
`QUALITY = FITNESS TO OBJECTIVE + VERIFIED CORRECTNESS + BENCHMARK-RELATIVE
CRAFTSMANSHIP` is a slogan, not a formula. Q0–Q5 have no measurement procedure.
The MPDB benchmark (§98) has thirteen metrics and no scoring method. None of it
is implementable as written. Cut it to one sentence — "external releases need a
named acceptance contract written before execution" — which is the one real idea in
there (§89) and is worth keeping.

**3.4 The hard part is the part left unspecified.**
Everything rests on the Evidence Resolver deriving `lineageRootId` correctly, and
the spec just names the box. In my implementation lineage comes from an
explicitly registered derivation graph, and **the failure mode is permissive**:
an unregistered source becomes its own root, which inflates independence. Two
mirrors of one wire story counted as two roots is the whole attack. This is the
real research problem in the design and it deserves more of your attention than
the next four CMA programs combined.

**3.5 Cryptography scope.**
Ed25519 signing where the private key sits on the same host as the agent gives
you tamper-evidence and non-repudiation between components. It does **not** give
you an air gap, and it does not mean "the AI cannot escalate." Worth having —
but if the T2 boundary is meant to mean what §27 says, the root key has to live
off-box. I noted this in the code rather than letting the ceremony imply more
than it delivers.

**3.6 Sections 78–86 and 98 belong in a different document.**
MPDD, the design engineering mesh, and the "generic-AI design penalty" are
product and taste opinions. They are fine opinions. They are not an operating
system, and bundling them makes the spec unreviewable.

**3.7 A tension worth naming.**
§18–19 insist on provider neutrality; §113 then hardcodes an execution workflow
around one vendor's CLI and one model family. Pick one. Neutrality is the more
valuable property and it is cheap to keep if you keep the kernel dependency-free
(mine has zero runtime dependencies for this reason).

---

## 4. The structural problem nobody in the transcript names

§27 classifies "LLMs, agents, providers, workers" as T0 — untrusted.

But an LLM wrote the code that enforces T0. The trust kernel is only as
trustworthy as the human review performed on the kernel itself, and no amount of
internal ceremony changes that. The Gemini artifact demonstrates the failure
directly.

The only real mitigation is a size budget. **The trust kernel must stay small
enough that one person can read all of it in a sitting.** The implementation
here is under 2,300 lines of source, comments included. That is not an accident and it should be a
hard constraint, not an aspiration: every feature added to the kernel makes the
one control you cannot automate — a human reading it — weaker.

---

## 5. Recommended sequence

1. **Done here:** the trust kernel — the part that is genuinely hard to retrofit.
2. **Done:** the ledger is persistent, and reconciliation is proven across real
   process restarts — including a cache edited to claim M5, a cache edited to
   un-revoke a memory, an injected record, a tampered log, and a crash mid-append.
3. **Then stop building infrastructure** and give MALACHII one real job end to
   end. Pick the narrowest useful thing. The kernel exists to make that job's
   memory trustworthy; it has no value on its own.
4. **Defer** CMA-003 through CMA-007 until step 3 has produced something you
   actually use. Reassess the spec then — you will delete more of it than you
   expect, and you will know which parts from experience rather than from
   argument.
