---
name: context-rot-scan
description: Find duplicate rules, stale references, and conflicting instructions across CLAUDE.md and all skill files. Context rot happens when one rule lives in two places — edit one, the other drifts. Run at the start of any new session on a repo you haven't touched in a while, before adding a new rule, or whenever something feels "wasn't that already in here somewhere?"
---

# Context Rot Scan — OS Integrity Check

## Mission

Every rule that lives in more than one file is a maintenance liability. When one copy changes and the other doesn't, the OS contradicts itself. A contradicting OS produces contradicting behavior. This scan finds every instance of that rot and produces a consolidation plan.

## Definition of context rot

Context rot is any of:

1. **Duplication** — the same rule, protocol, or checklist appears in two or more files
2. **Contradiction** — two files give different instructions for the same situation
3. **Stale reference** — a file references another file that has been renamed, moved, or deleted
4. **Dead rule** — a rule references a capability, tool, or service that no longer exists
5. **Orphaned content** — a section that was "temporary" and never got cleaned up
6. **Superseded decision** — a decision that was overridden by a later one in a different file

## Scan process

### Step 1 — Inventory all instruction files

```bash
find . -name "CLAUDE.md" -o \
       -name "SKILL.md" -o \
       -name "*.md" -path "*/.claude/*" | \
  grep -v node_modules | sort
```

List every file. Note the file path — that determines authority (CLAUDE.md > skill files for project-level rules).

### Step 2 — Extract rule statements

For each file, identify every rule, protocol, checklist, or decision statement. Things that start with:
- "Never", "Always", "Must", "Do not", "Require"
- A numbered list of steps
- A gate or quality check
- A technology or stack decision

### Step 3 — Find duplicates

Compare across files. Flag any rule that appears in more than one place, even with different wording.

Common rot locations in this factory:
- Quality floor dimensions (appear in CLAUDE.md AND challenger/SKILL.md — intentional or not?)
- Autonomy levels (should only be in `.claude/skills/autonomy-gating/SKILL.md`)
- Truth protocol labels (appear in CLAUDE.md AND MASTER_FACTORY_PROMPT — needs a single source)
- Stack defaults (Next.js, Tailwind, etc.) — should only be in CLAUDE.md Rule 2
- Gate definitions (G0–G8) — should only be in factory-gates SKILL.md
- Secrets handling — should only be in `security-secrets` skill

### Step 4 — Find contradictions

Compare rules in the same domain across files. Common contradictions:
- One file says "always ask before X" and another says "proceed without asking for X"
- One file describes a 4-level autonomy scale and another describes a 5-level one
- One file lists 6 quality dimensions and another lists 7

When you find a contradiction: identify which file is the **authoritative source** (usually the one that was written most recently and intentionally, or the one that's a dedicated skill rather than inline prose).

### Step 5 — Find stale references

```bash
# Find references to files that don't exist
grep -r "references/" .claude/skills/ | grep -v ".git" | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  ref=$(echo "$line" | grep -oP 'references/[^\s"]+')
  dir=$(dirname "$file")
  if [ -n "$ref" ] && [ ! -f "$dir/$ref" ]; then
    echo "STALE REF: $file → $ref (file not found)"
  fi
done
```

Also check: any `import`, `require`, or `@` references in SKILL.md files that point to missing paths.

### Step 6 — Find dead rules

Rules become dead when:
- They reference a library that's no longer in package.json
- They reference an environment variable that's no longer in .env.example
- They reference a service that was replaced (e.g., "use Clerk for auth" after the stack switched to Better Auth)
- They reference a file structure that no longer exists

```bash
# Check for outdated service references in skill files
grep -ri "supabase\|clerk\|prisma\|redux\|graphql" .claude/skills/ | grep -v ".git"
```

If any hit appears in a rule (not just a comparison or mention), verify whether it's still the correct service.

### Step 7 — Find orphaned content

Sections marked TODO, PENDING, "coming soon," "will be added later," or similar that are older than the project's most recent milestone are orphaned content. They create false expectations.

---

## Output format

```
CONTEXT ROT SCAN
Scanned: [list of files]
Date: [date]

DUPLICATES (same rule in multiple files)
1. Rule: "[rule text]"
   Found in: [file1:line], [file2:line]
   Recommended owner: [file]
   Action: Remove from [file2], keep in [file1], add reference

CONTRADICTIONS (conflicting rules)
1. [file1:line] says: "[rule A]"
   [file2:line] says: "[rule B]"
   Resolution: Use [file] version because [reason]

STALE REFERENCES (files referenced but missing)
1. [file:line] references [missing path]
   Action: [update reference | create the file | remove the reference]

DEAD RULES (reference removed capabilities)
1. [file:line] references [capability/service]
   Status: [no longer used / replaced by X]
   Action: Remove or update

ORPHANED CONTENT
1. [file:line] — [content description], last relevant: [milestone]
   Action: Remove

CONSOLIDATION PLAN (ranked by severity)
1. CRITICAL: [action — contradictions that cause behavioral drift]
2. HIGH: [action — duplicates that will drift]
3. MEDIUM: [action — stale references]
4. LOW: [action — orphaned content]

OS INTEGRITY SCORE: [Clean / Minor Issues / Degraded / Compromised]
```

## After the scan

Apply the consolidation plan in this order:
1. Fix contradictions first (they produce wrong behavior now)
2. Consolidate duplicates to single-source (they will produce wrong behavior when one copy drifts)
3. Update stale references (they block skills from loading correctly)
4. Remove dead rules (they add confusion)
5. Remove orphaned content (they add false promises)

**Every edit is one targeted change.** Don't refactor while consolidating — you'll introduce new rot while fixing old rot.

## Single-source-of-truth map

This is where each class of rule SHOULD live (do not duplicate to other locations):

| Rule class | Authoritative file |
|---|---|
| Autonomy levels A0–A5 | `.claude/skills/autonomy-gating/SKILL.md` |
| Quality floor dimensions | `CLAUDE.md` (Rule 5) |
| Stack defaults | `CLAUDE.md` (Rule 2) |
| Interview questions | `CLAUDE.md` (Rule 1) |
| Gate definitions G0–G8 | `.claude/skills/factory-gates/SKILL.md` |
| Truth protocol labels | `CLAUDE.md` (Rule 4 / Truth Protocol) |
| Secrets rules | `.claude/skills/security-secrets/SKILL.md` |
| Design rules | `design.md` (Part 1 and 2) |
| Performance budgets | `performance.md` |
| Task classification | `CLAUDE.md` (Rule 4) |
