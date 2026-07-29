# Malachii

Malachi's intelligence, and the things it builds.

Two halves of one repo:

- **`malachii/`** — the intelligence kernel. Persistent memory, retrieval,
  and a learning loop that gets better from outcomes. Start with
  [`MALACHII.md`](MALACHII.md) for what it is and how it works, or
  [`malachii/README.md`](malachii/README.md) to just run it.
- **everything else** — the website factory it uses to build production sites,
  plus the FutureDeskAI storefront currently living at the repo root.

## What's inside

| File | Job |
|---|---|
| `MALACHII.md` | The intelligence: architecture, learning mechanics, governance, roadmap |
| `malachii/` | The kernel — memory, retrieval, lessons, distillation, consolidation, the `mal` CLI |
| `CLAUDE.md` | The standing brain: how to behave, the interview, stack menu, quality gates, project log |
| `.claude/settings.json` | Hooks: recall on every prompt, distillation and quality gates on every stop |
| `.claude/hooks/` | The hook implementations, including the enforcer that blocks a failing stop |
| `.claude/agents/` | `reviewer` (adversarial code review) and `design-critic` (looks at the page) |
| `design.md` | Taste, written once, inherited by every build |
| `performance.md` | Core Web Vitals budgets, JS/image/font limits, verification steps |
| `templates/` | 12 website blueprints — the interview offers them as a menu |
| `design-library/` | Style directions, palettes, the immersive-3D contract, ideas backlog |
| `.env.example` | Where service keys go |

## Setup

```bash
pnpm install     # Node 22.18+ required
```

That's it for the intelligence — no database server, no vector store, no keys.
The brain is one SQLite file at `~/.malachii/brain.db`.

Optional, and worth it:

```bash
export ANTHROPIC_API_KEY=...   # model-quality session distillation
export VOYAGE_API_KEY=...      # trained embeddings instead of local hashing
```

## Using it

Open Claude Code in this folder. The hooks do the rest: every prompt is
answered with the relevant slice of everything it has learned, and every
finished session is distilled back into memory.

To talk to the brain directly:

```bash
alias mal="node malachii/src/cli/mal.ts"
mal stats                       # what it knows
mal lessons                     # what it believes, and how strongly
mal recall "how does billing work"
mal sleep                       # consolidate — worth running nightly
```

To build a website: `New website. Run your interview.`

## How the enforcement works

Three layers, and only the first is advisory:

1. **`CLAUDE.md`** — guidance the agent follows.
2. **The Stop hook** — physics it cannot ignore. When Claude tries to finish,
   `.claude/hooks/quality-gate.sh` runs typecheck, lint, and tests for whatever
   actually changed. Any failure exits 2, which blocks the stop and feeds the
   errors back. A loop guard (`stop_hook_active`) prevents infinite retries.
3. **GitHub Actions** — re-runs the gates on push, outside the agent entirely.

That is the honest meaning of "foolproof."
