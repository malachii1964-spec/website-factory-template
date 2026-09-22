---
name: autonomy-gating
description: Classify any action by autonomy level before executing it. Use whenever planning an action with external side effects — pushing code, sending email, running migrations, changing DNS, publishing to production, posting on GitHub. Triggers on any action that touches state outside the local repo.
---

# Autonomy Gating

Every action has a level. Look it up before doing it. Do not proceed at a level the current context does not authorize.

| Level | Name | Examples in this project | Required before acting |
|---|---|---|---|
| A0 | Observe | Read files, search code, list branches, check CI status | None — proceed |
| A1 | Propose | Draft a plan, write code not yet committed, suggest a migration | None — proceed |
| A2 | Sandbox | Run tests, tsc, lint, next build, local dev server | None — proceed |
| A3 | Approved Action | git push, create PR, send email, run db:push, add DNS record, merge branch | Explicit user approval for this specific action |
| A4 | Bounded Campaign | "watch this PR and autofix anything that fails CI" | Scoped grant naming what IS and IS NOT covered |
| A5 | Continuous Operation | A cron/routine that fires independently | Explicit setup + monitoring + kill switch discussed |

## The gate rule

**A3 and above require explicit authorization at the execution boundary.**

Authorization is per-action, per-scope. It does not carry over:

- A conversation that approved "push the branch" yesterday does NOT authorize pushing today.
- A user saying "go ahead" to a plan authorizes the **next step**, not every step.
- Approving a deploy to preview does NOT authorize a production deploy.

## When the action is unauthorized

1. State the action and its level plainly.
2. State what authorization looks like: "shall I push this to `claude/feature-x` now?"
3. Wait. Do not rationalize your way to A3 from A1.

## Autonomy is never permanent or global

No mode, instruction, or CLAUDE.md entry grants unlimited autonomy. Any action outside the current authorization envelope is paused or escalated regardless of whether it would "help."

## Context rot guard

This file is the single source of truth for autonomy levels in this project. If another file defines a similar table, delete the duplicate and reference this one.
