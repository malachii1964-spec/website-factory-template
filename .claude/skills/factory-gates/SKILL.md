---
name: factory-gates
description: Run the completion gate before declaring anything done, shipped, complete, finished, or ready. Triggers on "done", "finished", "ready to ship", "complete", "that works", or before any claim that work is finished. Also triggers before marking a task complete or closing a work order.
---

# Before you say done

Run this. Every gate. No skipping because it "obviously passed."

## G0 — Did you run it?

Not "should pass." Not "looks right." Ran it, this session, and saw output.

```bash
tsc --noEmit
npx next build
npx vitest run 2>&1 | tail -20
```

`--test-reporter=tap` is mandatory when using Node's built-in test runner directly.
Node 24 defaults to `spec`, which emits no `# fail` line. A gate grepping for `# fail 0`
**passes silently on Node 24 without this flag**. That defect shipped here and was caught
in review.

If you did not run it, stop. Run it. Everything below depends on this.

## G1 — Contract satisfied

Pull the task lock. Walk every criterion.

- Each deterministic check has command output you can quote
- Each judgment criterion has an evaluator who is not the producer
- Unevaluated criteria are `not_evaluated`, never assumed pass
- Any required criterion failing = task fails

## G2 — Scope held

```bash
git status --short
```

Every changed file is in the scope of what was asked. A file outside scope is a violation
and blocks completion regardless of what passed.

Also confirm you are where you think you are:

```bash
pwd
```

A `git add .` from the wrong directory has staged an entire home folder in a real project's
history. Check before staging.

## G3 — Drift check

Re-read the original request. Not your summary of it. The actual words.

Does what you built answer what was asked? Objective drift blocks completion even when every
criterion passes — because passing the wrong test is not success.

## G4 — Claims true

Every factual statement in the output traces to a source, a measurement, or an explicit
"unverified." No invented numbers, no assumed partnerships, no "up to X%" without the
measurement behind it.

Net impression must be true, not just each sentence individually.

## G5 — Secrets clean

```bash
git log -p | grep -iE 'sk-ant-|sk-proj-|AKIA|ghp_|xoxb-|-----BEGIN.*PRIVATE KEY'
```

Empty output required. A match means a key is in history — rotate it and say so immediately.
Deleting the file does not remove it from git history.

## G6 — Reversible or declared

Either this can be undone and you can state how, or it cannot and you said so before doing
it. Irreversible work done without that declaration is a process failure even if the result
is good.

---

## Verdict

| All gates pass | `COMPLETE` |
| Some deterministic checks unevaluated | `PARTIAL` — name which |
| Required criterion failed | `FAILED` — name which and why |
| Scope violation or drift | `BLOCKED` — regardless of what passed |

Say the verdict plainly. "Mostly done" is not a verdict.
