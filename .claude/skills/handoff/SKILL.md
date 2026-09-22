---
name: handoff
description: Produce a crisp HANDOFF.md before ending any session, when context is getting long, or when switching to a different task. Makes every session restart from truth, not from guessing. Triggers on "end session", "switching to", "I'll be back", "save state", or any sign the current thread is pausing.
---

# Handoff — Session Continuity Protocol

## Mission

The worst thing that happens in long projects is losing track of what was verified vs. assumed, what's blocked vs. in progress, and what the exact next action is. A HANDOFF.md fixes this permanently. It is written BEFORE the session ends — not reconstructed from memory after.

## When to invoke

- Before ending any session where real work happened
- When context is compressing and important state might be lost
- When switching from one project to another mid-session
- When a human is about to take over and needs to know where things are
- When a task will span multiple sessions

## Output location

Write to `HANDOFF.md` at the project root, or to `.malachii/HANDOFF.md` if the project uses that structure.

**This file represents current truth, not aspirational status. If something is not verified, say so.**

## Template

```markdown
# Handoff — [Project Name]
Last updated: [date and session context]

## Current state in one sentence
[What is the most important thing someone resuming this needs to know first?]

## What is VERIFIED (tested, in production, confirmed working)
- [item with evidence: "tsc passes", "deployed to X", "user confirmed Y"]
- ...

## What is IN PROGRESS (started but not done)
- [item — what's done, what remains, what the blocker is if any]
- ...

## What is BLOCKED (cannot proceed without owner action)
- [item — exactly what is needed to unblock, from whom]
- ...

## What is PLANNED (decided but not started)
- [item — why it's next, what it depends on]
- ...

## Decisions made this session (do not relitigate)
- [decision — rationale in one sentence]
- ...

## Open questions (owner must answer before work continues)
- [question — what happens if it goes unanswered]
- ...

## Known issues (not blockers, but logged)
- [issue — severity and workaround if any]
- ...

## Secrets / credentials needed (not the values — just what's missing)
- [ENV_VAR_NAME — what it's for, where to get it]
- ...

## Exact next action
Branch: [branch name]
Command to resume: [exact command or instruction]
First task: [one sentence — the very first thing to do]
Gate status: [BUILD_ARTIFACT | LAUNCH_CANDIDATE | PRODUCTION_VERIFIED]

## Files changed this session
[git diff --name-only output or equivalent]

## Commit range
[first..last commit SHA from this session]
```

## Completion check

Before writing HANDOFF.md:

1. Run `git status` — confirm working tree state matches what you believe it is
2. Run `git log --oneline -10` — confirm commit history matches your narrative
3. Check `tsc --noEmit` if code was changed — never hand off broken type state
4. Confirm every "VERIFIED" item in the handoff has actual evidence (command output, URL, test result)

## What HANDOFF.md is NOT

- Not a PR description (that goes in the PR)
- Not a changelog (that's CLAUDE.md Project Log)
- Not aspirational — "should be working" is not VERIFIED
- Not permanent — it gets overwritten next session

## Recovery protocol (incoming session)

When resuming from a HANDOFF.md:

1. Read the "Current state in one sentence" — that orients everything
2. Check "Exact next action" — that's where to start
3. Verify "What is VERIFIED" is still true (run the commands)
4. Check for owner-answered questions in "Open questions"
5. Do NOT restart completed work or relitigate logged decisions
