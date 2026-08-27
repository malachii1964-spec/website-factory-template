# MALACHII Sovereign OS v3.3-RC1.6.2 — Distributed Worker Fabric + Command Center Shell

Status: **CANDIDATE CANONICAL BASELINE — the single reconciled artifact superseding all prior fragments**

RC1.6 extends the RC1.5 Live Control Fabric with authenticated remote worker daemons, live challenge-based A3 capability observation, signed execution receipts, durable queued dispatch/leases, replay protection, signed heartbeat capability-drift propagation, per-reconciliation registry refresh and multi-process failover proof. It does not claim multi-host HA, distributed consensus, SPIFFE/SPIRE attestation, production Internet-scale operation, credentialed provider validation, or Agent Foundry.

## RC1.6.2 changes (2026-08-17 reconciliation pass)

This point release does not change runtime logic. It reconciles every artifact the
Super-User was holding across sessions into one package:

- **Command Center GUI** (`command-center/`) added at the package root — the static
  Simple Mode / full Command Center front-end shell (HTML/CSS/JS, no build step, no
  external network calls). It is a **UX prototype driven by a demo pipeline**, not wired
  to this package's runtime. A visible `DEMO / SIMULATED EXECUTION` badge was added to
  `index.html` so it cannot be mistaken for live output — this was flagged independently
  by two prior review rounds (ChatGPT and Grok) as a required correction before this GUI
  could be called anything more than a prototype.
- **Skill 001 (Sovereign Research) confirmed identical** to the standalone
  `MALACHII_SKILL_001_SOVEREIGN_RESEARCH.zip` the Super-User was holding separately — this
  package's `skills/malachii-sovereign-research/` is byte-identical to that zip's payload
  (verified by diff, not assumption). Nothing to merge; it was already correctly
  integrated as of RC1.6.
- **`MALACHII_Sovereign_OS_v3.3_RC1_PORTABLE.zip`** (the older, single-process, 20-test
  predecessor lineage) is now formally superseded. It carries the same clock-propagation
  defect class documented in `evidence/CLAUDE_INDEPENDENT_VERIFICATION_2026-08-16.md`:
  `authorize()` in `runtime/src/authorization.ts` accepts an injected `now` but never
  passes it into `hasExecutableCapability()`, so two tests (`observed side effect still
  requires approval`, `observed with approval permits`) fail against real wall-clock time
  independent of the injected clock. This package's own `runtime/tests/trust.test.ts`
  threads `now` correctly end-to-end and does not have this defect — confirmed by the
  73/73 live re-run recorded in RC1.6.1's verification evidence.
- **`MALACHII_Sovereign_OS_v3.1.zip`** and **`MALACHII_Operating_System.docx`** are earlier
  governance-only drafts, already superseded by the Kernel/Identity/Learning
  Log/Project Lock lineage shipped in `constitution/`.
- **`MALACHII_OS_COMPLETE_FOLDER.zip`** was a transport container holding byte-identical
  copies of the Skill 001 and RC1_PORTABLE zips above — not a distinct build.

After this pass there is exactly one current artifact: this package.
