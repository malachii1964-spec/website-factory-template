# MALACHII Autonomous Execution Plane — Phase 06 Reference

> **RC1.4 placement:** This execution plane is a subordinate runtime subsystem of the MALACHII Sovereign Control Plane. It performs authorized work; it does not define global routing, governance, desired state, evidence convergence, or release qualification.


## Objective

Turn MALACHII from a strong governance/router core into a portable execution control plane that can drive Manus-like hosts, ChatGPT/Codex tools, local machines, cloud sandboxes, browsers, connectors and future A2A agents without pretending those capabilities exist when they do not.

## Control loop

```text
User Objective
    ↓
Objective Forge
    ↓
Consequence-Aware Plan Gate
    ↓
Runtime Manifest / fresh capability evidence
    ↓
Branch / parallel execution graph
    ↓
Action-time authorization + replay protection
    ↓
Execution Adapters
    ↓
Evidence + Event Ledger
    ↓
Critic / Verifier / repair loop
    ↓
Quality Floor + hard gates
    ↓
Release / Publish / Schedule / Deliver
    ↓
Governed learning proposal
```

## Adapter families

MALACHII should recognize capability families rather than provider identities:

- `web.search`, `web.fetch`
- `browser.navigate`, `browser.interact`, `browser.authenticated_action`
- `code.execute`, `shell.execute`
- `filesystem.read`, `filesystem.write`
- `workspace.persistent`
- `connector.read`, `connector.write`
- `artifact.document`, `artifact.spreadsheet`, `artifact.slides`, `artifact.image`, `artifact.video`
- `app.build`, `website.build`, `mobile.build`
- `deploy.preview`, `deploy.publish`
- `scheduler.create`, `scheduler.update`
- `agent.spawn`, `agent.remote`

A concrete host adapter may implement any subset. Runtime Manifest evidence determines what MALACHII may actually execute.

## Plan Gate

Planning is not ceremony. It is risk control.

- Read-only / reversible-local work with acceptable uncertainty can auto-proceed.
- External side effects or irreversible/high-impact actions require review/approval.
- High objective uncertainty or governance risk forces review.
- The plan is an auditable source of truth, but may be revised as evidence changes.

## Parallel work

Execution plans are DAGs. Steps whose dependencies are satisfied run in the same execution wave. This supports Wide-Research-like fan-out without requiring every worker to share one growing context window.

Parallelism is not a quality claim. Candidate outputs still require evidence/critique/verification where the Objective Forge requires it.

## Replay and TOCTOU protection

- Each executable step carries an `actionId`.
- Action IDs are redeemed once per redemption ledger.
- Authorization is re-run against a fresh Runtime Manifest immediately before execution.
- A prior approval cannot resurrect a capability that has expired or been revoked.

## Learning boundary

- Reversible, non-authoritative working memory can auto-apply.
- Durable project instructions/files require review.
- Executable Skill changes require review/trust validation.
- Policy and constitutional changes require review.
- Any attempted authority expansion is denied.

## Sovereign release

External publication is more than `build succeeded`.

Default reference release rule:

- quality floor >= 9
- all hard gates pass
- build succeeds
- explicit external publish grant exists

The actual website/application skill may impose stronger domain-specific gates.

## Current implementation boundary

The TypeScript reference implementation provides:

- execution plan/step contracts
- parallel DAG execution waves
- fresh-manifest authorization
- adapter capability matching
- dependency failure propagation
- replay protection
- context branch graph
- consequence-aware plan gate
- governed project-learning disposition
- release decision gate
- ledger events for plan/step execution

It intentionally does **not** hard-code OpenAI, Anthropic, Manus, browser, cloud or local-computer SDKs into constitutional code.
