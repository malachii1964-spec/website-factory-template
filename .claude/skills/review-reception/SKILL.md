---
name: review-reception
description: Receive and respond to code review feedback correctly. Use when reading PR review comments, reviewer notes, or feedback on completed work. Prevents sycophantic agreement, blind implementation, and partial-understanding errors.
---

# Code Review Reception

## The Pattern

```
1. READ:      Complete feedback without reacting
2. UNDERSTAND: Restate the requirement in your own words — or ask
3. VERIFY:    Check the actual codebase against the claim
4. EVALUATE:  Is the feedback technically correct FOR THIS codebase?
5. RESPOND:   Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test after each
```

Never skip step 3. "Sounds right" is not verification.

## Banned responses

Never say:
- "You're absolutely right!"
- "Great point!"
- "Excellent suggestion!"
- "Let me implement that now" (before verification)

These are social performance. They do not engage with the technical claim, and they commit you to implementing something you have not verified.

Instead: restate the requirement technically, ask if unclear, push back if wrong, or just start working — actions over words.

## When feedback is unclear

If any item is unclear: stop, do not implement anything yet. Ask for clarification on the unclear items before starting. Items may be related — partial understanding produces a wrong implementation.

## Reasoned pushback

If verification shows the feedback is incorrect, say so with evidence:
- "I checked `file.ts:42` — the condition already handles the null case here: [quote]."
- "Changing this would break the existing behavior at [path], which tests cover in [test]."

A reviewer who is wrong needs to know. Polite silence or "I see your point" while doing the wrong thing is worse than a respectful technical correction.

## When the reviewer is right

Acknowledge technically, not emotionally. "Confirmed — line 87 will throw if `items` is undefined. Fixing now." Then fix it.

## Multiple items

Do them one at a time. Test after each. Do not batch all review items into one change — errors compound and attribution becomes impossible.
