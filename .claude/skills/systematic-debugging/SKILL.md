---
name: systematic-debugging
description: Investigate any bug, test failure, or unexpected behavior before proposing fixes. Triggers on any failing test, build error, runtime error, or "this isn't working" — especially when under time pressure or when a quick fix "seems obvious".
---

# Systematic Debugging

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE FIRST
```

If you have not completed Phase 1, you cannot propose a fix. A symptom fix is not debugging — it is hiding the problem.

**This applies especially when:**
- Under time pressure ("just a quick fix")
- The cause seems obvious
- You've already tried several fixes
- You don't fully understand the failure

Confidence that you know the cause is the most reliable predictor of a wrong guess.

## Phase 1 — Understand Before Touching

1. **State the symptom exactly.** What failed, what was expected, what was observed. Exact output, not a paraphrase.
2. **Reproduce it.** Run the failing command or test exactly as given. If you cannot reproduce it, stop and say so — guessing at an unreproducible failure always makes things worse.
3. **Isolate the scope.** Is this one test, one file, one function, one environment? Narrow to the smallest reproducible case.
4. **Form a hypothesis.** Name the most likely cause and what evidence would confirm it. Do not skip this — acting on "probably this" is the source of most regressions.

## Phase 2 — Verify the Hypothesis

1. Check the evidence against the hypothesis. Read the actual code, not your mental model of it.
2. If the evidence does not confirm the hypothesis, form a new one. Do not fit evidence to a preferred explanation.
3. State the root cause as a specific, falsifiable claim: "Function X receives Y when it expects Z because of condition W."

## Phase 3 — Fix the Root Cause

Fix what Phase 2 confirmed, nothing else. Do not refactor unrelated code, add defensive handling for unrelated paths, or clean up while fixing — scope creep in a bug fix introduces new bugs.

After the fix: run the original reproduction case. Confirm green. Check for regressions.

## What a Fix Is Not

- Commenting out the failing assertion
- Catching the exception silently
- Hardcoding the expected value
- Skipping the test
- Changing the test to match wrong behavior

Any fix that makes the symptom disappear without addressing the root cause is a debt, not a resolution.
