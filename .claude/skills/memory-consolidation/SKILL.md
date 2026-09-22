---
name: memory-consolidation
description: Prune and consolidate the CLAUDE.md Project Log before it becomes unmanageable. Archive completed milestones, promote active decisions, surface the three highest-value next actions. Run when the Project Log exceeds 60 lines, at the end of a major milestone, or when CLAUDE.md feels harder to read than to ignore.
---

# Memory Consolidation — Project Log Maintenance

## Mission

CLAUDE.md is the project's operating memory. When the Project Log grows past ~60 lines of dense history, it starts working against you — too long to read, too stale to trust, too fragmented to navigate. Consolidation keeps it sharp.

## When to run

- Project Log > 60 lines
- End of a major milestone (launch, major feature complete)
- Start of a new phase (e.g., moving from "build" to "scale")
- When sessions consistently ignore the log because it's overwhelming
- When decisions at the top contradict decisions at the bottom (drift)

## What consolidation does

1. **Archives** completed milestones to `docs/archive/CLAUDE_HISTORY.md` — they happened, they matter, but they don't need to live in the active OS
2. **Promotes** active state, pending owner actions, and current blockers to the top
3. **Deduplicates** decisions that appear in multiple places
4. **Removes** superseded decisions (an old decision that a newer one overrides)
5. **Surfaces** the three highest-value next actions, ranked by impact

## Process

### Step 1 — Read the full Project Log

Read every line. Map the structure:
- What is VERIFIED (shipped, in production, working)
- What is IN PROGRESS (started, not done)
- What is BLOCKED (owner action needed)
- What DECISIONS are still active vs. superseded
- What OWNER ACTIONS are still pending vs. completed

### Step 2 — Triage each item

For each milestone block in the log:

| Category | Action |
|---|---|
| Shipped >2 milestones ago, no open dependencies | Archive to CLAUDE_HISTORY.md |
| Shipped, has active pending owner actions | Keep active until actions complete |
| In progress | Keep + update to current state |
| Decision that's been superseded | Remove + note in "Decisions made" what replaced it |
| Pending owner action | Pull to top of active state |

### Step 3 — Write the consolidated log

Replace the Project Log with this structure:

```markdown
## Project Log (keep current — this is the project's memory)

### Current state
[One paragraph: what is built, what is deployed, what is verified working. Factual only.]

### Pending owner actions (unblock these first)
- [ ] [Action — exact what, where, why it matters]
- [ ] ...

### Active work (in progress, not done)
- [Feature/task — what's done, what remains]
- ...

### Decisions made (do not relitigate)
- [Decision — one-sentence rationale]
- ...

### Known issues / TODO
- [Issue — severity, workaround if any]
- ...

### Archived milestones
See docs/archive/CLAUDE_HISTORY.md for the full build history.
```

### Step 4 — Write to CLAUDE_HISTORY.md

Append (do not overwrite) all archived milestones to `docs/archive/CLAUDE_HISTORY.md` with a datestamp:

```markdown
## Archived [date]

### [Milestone name] ([date completed])
[Full original text from the Project Log]
---
```

### Step 5 — Identify the three next actions

After reading the full state, identify the three highest-leverage actions ranked by:
1. Owner-blocked work that's been waiting longest
2. Work with the highest user-facing impact if shipped
3. Work that would unblock other work

Write them to the bottom of the consolidated log as:

```markdown
### Recommended next actions (ranked by impact)
1. [Action — why this is first]
2. [Action]
3. [Action]
```

## Anti-patterns

- **Do NOT delete verified history** — only archive it. Every milestone produced evidence; it belongs in CLAUDE_HISTORY.md.
- **Do NOT remove pending owner actions** even if they've been waiting a long time. They wait until done or explicitly cancelled.
- **Do NOT summarize decisions into vagueness** — if the decision was "use Better Auth instead of Supabase Auth because...", keep the rationale. Vague decisions get relitigated.
- **Do NOT change the technical decisions** — consolidation is a maintenance operation, not an architecture review.

## Output

After consolidation:
- CLAUDE.md Project Log: ≤ 60 lines, current state accurate
- `docs/archive/CLAUDE_HISTORY.md`: all archived milestones in chronological order
- Consolidation summary in chat: what was archived, what was promoted, what the three next actions are
