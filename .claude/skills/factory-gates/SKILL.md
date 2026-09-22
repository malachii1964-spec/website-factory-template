---
name: factory-gates
description: Run the completion gate before declaring anything done, shipped, complete, finished, or ready. Triggers on "done", "finished", "ready to ship", "complete", "that works", or before any claim that work is finished. Also triggers before marking a task complete or closing a work order.
---

# Before you say done

Run this. Every gate. No skipping because it "obviously passed."

## G0 — Did you run it?

**Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

If you have not run the command in this session and read the actual output, you cannot claim it passes. "Should pass" and "looks right" are not evidence.

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

## G7 — Deploy gates (only when shipping to a real domain)

**Before pushing:**
- `git remote -v` confirms the correct repo; current branch is the intended deploy target
- Working tree is clean; local commit is what you think it is
- All links and routes verified against REAL files — zero guessed paths
- No lorem ipsum, placeholder images, or fabricated testimonials/stats (placeholders labeled if intentionally pending)
- Tap targets ≥ 44px; no horizontal scroll at 375px

**Preview first.** Production is never the first target. Verify the preview URL fully
(forms, critical paths, responsive at 375px and 1440px, reduced-motion respected) before
promoting to production.

**DNS go-live sequence for domains** (order matters — each step gates the next):
1. Resold/aged domain? Audit and DELETE all inherited DNS records — including a stranger's
   DMARC, SPF, MX — before writing anything new. Foreign records will silently intercept
   or reject your email.
2. Wait for DNS propagation to the active zone.
3. Configure email routing with a catch-all.
4. Attach the site (A/CNAME to the host).
5. Configure the sending service (SPF, DKIM).
6. Write DMARC **last** — only after SPF/DKIM are verified passing.

**Production verify:** after deploy, open the live URL in a private browser window, test
every critical form and CTA, confirm visuals match the approved preview. Local success
proves nothing to a real visitor. Monitor again after 24 hours.

**On any production failure:** rollback first, debug second. Never debug on a broken live site.

## Release stage — what you can honestly claim

| Stage | What it means | Evidence required |
|---|---|---|
| `BUILD_ARTIFACT` | Source compiles, structural checks pass | tsc + lint + build green, secrets clean |
| `LAUNCH_CANDIDATE` | Build + preview verified + tests pass, remaining limits disclosed | Preview URL opened, critical paths exercised, test suite green |
| `PRODUCTION_VERIFIED` | Deployed + verified on the live URL | Live URL confirmed, critical forms/CTAs tested in a private browser |

Never claim a higher stage than the evidence supports. "Deployed" means a real visitor can access it and critical paths work — not "pushed to a branch."

---

## Verdict

| All gates pass | `COMPLETE` |
| Some deterministic checks unevaluated | `PARTIAL` — name which |
| Required criterion failed | `FAILED` — name which and why |
| Scope violation or drift | `BLOCKED` — regardless of what passed |

Say the verdict plainly. "Mostly done" is not a verdict.
