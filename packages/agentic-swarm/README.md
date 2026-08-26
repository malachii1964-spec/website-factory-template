# Multimodal Hierarchical Agentic Swarm — Event-Driven Sandbox Example

A real, working example of the architecture described in the project's source
conversation: an event-driven swarm that ingests a UI bug report (text +
screenshot), reproduces it, diagnoses it with Claude, patches it inside an
isolated Docker sandbox, verifies the fix against an objective assertion, and
stops at a human-in-the-loop checkpoint before anything ships.

It is also a from-scratch, dependency-free port of the governance primitives
from `MALACHII_Sovereign_OS_v3.3_RC1` — event ledger, capability-based
authorization, and the seven-dimension Quality Floor — because the swarm and
the governance layer are one system, not two. See **MALACHII Alignment**
below for how this maps to that project's own roadmap.

## What's real vs. what's designed

Run `pnpm demo` right now, on this machine, with no setup — it works. What
"works" means depends on what the runtime manifest actually observes,
per Kernel §9 ("do not describe unavailable capabilities as present"):

| Capability | Observed here | What that gets you |
|---|---|---|
| `vision.capture` (Playwright) | **yes** | The reproduce node genuinely launches Chromium, loads `fixtures/broken-checkout.html`, and its **own arithmetic** (not a model) detects `#checkout-btn` overlapping `footer` via `getBoundingClientRect()` — this is the literal "red Buy Now button overlapping the footer" bug from the source conversation, caught for real. |
| `model.anthropic` | no (`ANTHROPIC_API_KEY` unset) | Triage/diagnose/verify fall back to clearly-`[MOCK]`-logged stand-ins so the rest of the pipeline still runs. |
| `sandbox.docker` | no (daemon unreachable) | Sandbox execution falls back to a mock result. |

The orchestrator, retry-safe router, hash-chained event ledger, and quality
floor / hard-gate logic are **not** mocked — they run for real every time,
against whatever the nodes (real or mock) return. In the demo run, the mock
sandbox correctly gets **refused at the quality gate** (`failedGates:
["diff_non_empty"]`) even though every soft score was 6/10 — proof the hard
gate actually overrides the score instead of averaging past it.

To run it fully live:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker build -t swarm-runner:latest src/sandbox/
# ensure a Docker daemon is reachable
pnpm demo
```

## Architecture

```
Webhook event (zod-validated at the boundary)
   │
   ▼
Triage        claude-haiku-4-5      classify: is this a layout defect?
   │
   ▼
Reproduce     Playwright, no model  capture geometry + overlaps + console errors
   │                                 (overlap = arithmetic, never a model's guess)
   ▼
Diagnose      claude-opus-5         image + geometry → forced `propose_patch` tool call
   │                                 adaptive thinking, effort: xhigh
   ▼
Sandbox       Docker, no model      hardened container → tsc/lint/test/build/assertion
   │
   ├─ fail, retries remain ──► back to Diagnose with the failure log appended
   │                            (retry counter incremented in a NODE, not the router)
   ▼
Verify        claude-sonnet-5       independent pass — has NOT seen diagnose's reasoning
   │                                 seven-dimension score + code-computed hard gates
   ▼
HITL          governance.authorize() require_approval on any external_side_effect
   │                                 until a human supplies an approvalId
   ▼
Ship (not implemented — stub)       PR creation is the one step this package
                                     deliberately does not wire up; see below.
```

Every transition appends to a SHA-256 hash-chained `EventLedger` — that's
the audit trail a human reads at the HITL checkpoint, not console output.

### Defects fixed relative to the source design

The conversation this package implements went through several drafts of a
Python + LangGraph + Docker design. Each of the following was a real defect
in that design, found and fixed here:

1. **Retry counter never persisted.** The reference design mutated
   `state["retry_count"]` inside a LangGraph *conditional edge* — routing
   functions can't persist state, so the graph looped until it hit the
   platform's recursion ceiling, burning tokens every pass with the counter
   frozen at 0. Fixed: `router.ts` is a pure function; only `graph/run.ts`'s
   loop body (a real step) mutates `state.retryCount`. `tests/router.test.ts`
   asserts `route()` never mutates its input, and separately asserts the
   ceiling is respected.
2. **`network="host"` + container-name DNS is self-contradictory.** Docker's
   embedded DNS only resolves on a user-defined bridge; `host` networking
   also deletes the sandbox's isolation, which is its entire job. Fixed: a
   per-run `--internal` bridge network in `dockerRunner.ts` — DNS resolves
   between the runner and Postgres containers, nothing reaches the internet.
3. **Model output interpolated into a shell string** (`python -c
   "{code}"`). One stray quote or newline is arbitrary command construction.
   Fixed: model output only ever reaches disk as `edits.json`, consumed by
   `apply-edits.mjs`, which path-validates every target against `/work/src`
   and rejects `.git/**`. `run-patch.sh` is a fixed script baked into the
   image — never touched by model output.
4. **`mode: 'rw'` bind-mounted the live repository.** Fixed: `dockerRunner.ts`
   creates a throwaway `git worktree`, seeds a named Docker volume from it,
   and mounts *that* — the real working tree is never in the blast radius.
5. **No Postgres readiness check** — migrations raced the socket. Fixed:
   `waitHealthy()` polls `docker inspect .State.Health.Status` before the
   runner container starts.
6. **Fixed container/volume names** caused 409 Conflict on a second run and
   leaked resources on crash. Fixed: a `randomUUID()`-derived run ID on every
   resource, `--rm`, and a `finally` block that tears down network, volume,
   Postgres, and worktree even on failure.
7. **`{type: "image_url", image_url: {url}}`** is OpenAI's shape, not
   Anthropic's. Fixed: `{type: "image", source: {type: "base64",
   media_type, data}}` throughout `nodes/diagnose.ts`.
8. **"Output ONLY raw code, no markdown"** is a prompt, not a contract, and
   fails silently. Fixed: `tools/patchTool.ts` uses `strict: true` +
   `tool_choice: {type: "tool", name: "propose_patch"}` — the API guarantees
   the shape before the harness ever sees it, and `parsePatchToolInput`
   re-validates with Zod regardless.
9. **Stale model IDs and API shapes** (`gpt-4o`, `claude-3-5-sonnet-20241022`,
   `budget_tokens`). Fixed: `claude-opus-5` / `claude-haiku-4-5` /
   `claude-sonnet-5`, `thinking: {type: "adaptive"}`, `output_config:
   {effort: "xhigh"}`.
10. **A model was asked to be the router.** The reference design had GPT-4o
    emit `{"next_node": "..."}` JSON to decide `exit code 0 → verify, else →
    recode`. That's arithmetic. `router.ts` is a plain TypeScript `switch`.
11. **A vision model was asked to judge pixel overlap from a screenshot.**
    Fixed: `vision/geometry.ts` computes overlap by exact rectangle
    intersection on `getBoundingClientRect()` output — a fact, not a
    perception. The model's job is to explain *why* the overlap matters and
    propose a fix, never to decide *whether* it happened.
12. **The customer's screenshot was treated as evidence.** It's the bug
    *report* — no DOM, no computed styles, unknown device pixel ratio, and
    it's `UNTRUSTED_EXTERNAL_CONTENT` under MALACHII Kernel §5 (it could
    contain adversarial text rendered inside the image itself). Fixed:
    `vision/capture.ts` reproduces the page independently; `diagnose.ts`
    wraps the customer's content in a `<customer_report>` fence with an
    explicit instruction that nothing inside it is a command, and grounds
    every claim in the agent-captured `<reproduction>` block instead.
13. **A framework was reached for before it was needed.** LangGraph earns
    its cost on graphs with many branches, long-running checkpointed state,
    or a team that needs its visual debugger. Six nodes and one retry loop
    is less code as a plain `async function` with a `while` loop — see
    `graph/run.ts`. (MALACHII Kernel §10: smallest sufficient configuration.)

### What is deliberately NOT wired up

- **PR creation.** `authorize()` correctly returns `require_approval` for the
  `vcs.push_pr` capability and the pipeline stops there
  (`resumeAfterApproval` exists for when a human supplies an `approvalId`).
  Actually opening a PR needs a GitHub token and a decision about which repo
  this targets — that's a real decision for whoever wires this into a
  specific project, not something to fabricate here.
- **Webhook ingestion endpoint.** This package exposes `runSwarm()` as a
  library function. It is deliberately not wired to a `/api/webhook` route
  in this repository's live Next.js site — this is a standalone example
  package (`@fda/agentic-swarm`), not a feature of the production storefront
  it sits alongside.

## Running the gates

```bash
pnpm --filter @fda/agentic-swarm typecheck   # tsc --strict, zero errors
pnpm --filter @fda/agentic-swarm lint        # typescript-eslint
pnpm --filter @fda/agentic-swarm test        # vitest — 32 tests, pure-logic coverage
pnpm --filter @fda/agentic-swarm build       # tsc emit
pnpm --filter @fda/agentic-swarm demo        # runs the pipeline against fixtures/broken-checkout.html
```

## Layout

```
src/
  governance/    EventLedger, authorization (capability != authorization, TOCTOU
                 revalidation), quality floor — ported from MALACHII v3.3-RC1
  types.ts        SwarmState and the event/patch/evidence contracts
  eventPayload.schema.ts   Zod validation at the untrusted boundary
  router.ts       pure routing function — no state mutation, ever
  vision/         Playwright reproduction + pure overlap-detection math
  tools/          Anthropic strict tool schema for propose_patch
  nodes/          triage (Haiku), diagnose (Opus 5), verify (Sonnet 5)
  sandbox/        Dockerfile, fixed run-patch.sh, path-validated apply-edits.mjs,
                  verify-assertion.mjs, and the host-side dockerRunner.ts
  graph/run.ts    the orchestrator
  demo.ts         runnable entrypoint — real or mocked per the capability manifest
tests/            32 tests covering every pure-logic module
fixtures/         broken-checkout.html — the exact bug scenario from the source design
```

## MALACHII Alignment

MALACHII's own `architecture/NORTH_STAR.md`: *"MALACHII is not another
LangGraph/AutoGen/CrewAI clone. Those runtimes are potential execution
backends."* Its `ROADMAP.md` and `PROJECT_LOCK.md` both name **"first live
provider adapter + Direct/Collaborative/Sovereign evaluation"** as the
single blocking milestone before Phase 10 (Command Center UI). This package
*is* that adapter, scoped to one task class (UI layout defects) instead of
being built as another abstract contract. Concretely:

- `governance/eventLedger.ts` is the same SHA-256 hash-chained event log as
  MALACHII's `runtime/src/eventLedger.ts`.
- `governance/authorization.ts` implements the same capability-vs-
  authorization split and TOCTOU revalidation as MALACHII's `authorization.ts`
  — **with the clock-threading bug already fixed.** MALACHII's own test
  suite (`runtime/tests/trust.test.ts`) has 2 of 20 tests failing as of this
  writing because `authorize()` accepts an injected `now` but
  `hasExecutableCapability` silently drops it and falls back to wall-clock
  time — so evidence-freshness checks pass or fail depending on when the
  test happens to run, not the clock the caller supplied. This package's
  `runtimeManifest.ts` threads `now` all the way through, and
  `tests/authorization.test.ts` pins the clock explicitly so the regression
  can't recur silently again.
- `governance/quality.ts` is MALACHII's seven-dimension Quality Floor —
  minimum, never average — with hard gates computed from sandbox fact
  (`assertion_passed`, `sandbox_build_passed`) rather than model self-report.
- The Direct / Collaborative / Sovereign distinction MALACHII's roadmap asks
  to be measured, not assumed, maps onto this pipeline's model tiers: Haiku
  (Direct-equivalent triage), Opus 5 (the primary reasoner), Sonnet 5 as an
  independent second opinion (Collaborative-equivalent verification). A real
  A/B/C evaluation — the same objective run through each tier, scored on the
  seven dimensions plus latency/cost/retries — is the next real step, not
  something to claim already measured here.

What this package does **not** carry over from MALACHII, deliberately: the
full model/agent `registry.ts` + `router.ts` ranking system, `confidence.ts`
override tracking, and `telemetry.ts` OTLP attribute contract. Those solve
problems this single-task-class swarm doesn't have yet (MALACHII Kernel
§10: smallest sufficient configuration). If a second task class is added
(e.g. a Postgres/Drizzle migration-drift fixer) and multiple provider
adapters exist to choose between for a given step, port `registry.ts`/
`router.ts` at that point — not before.
