# malachii

The intelligence kernel. Design and rationale live in [`../MALACHII.md`](../MALACHII.md);
this is how to run it.

## Requirements

Node **22.18+**. Nothing else — `node:sqlite` is built in, and TypeScript runs
through Node's native type stripping, so there is no build step.

## Try it in sixty seconds

```bash
export MALACHII_HOME=/tmp/brain-demo          # leave unset to use ~/.malachii

alias mal="node malachii/src/cli/mal.ts"

mal remember "Malachi wants maximum autonomy and minimal check-ins." --kind identity --pin
mal learn "Run tsc, lint and the tests before saying a feature is done." --when "finishing any feature"
mal remember "Pricing derives from src/lib/pricing.ts so display and charge can never disagree." --project fda

mal recall "how does billing work"
mal brief "add a discount code to checkout" --project fda
mal stats
```

## Watch it learn from being wrong

```bash
mal learn "Deploy straight to production without checking." --when "shipping" --confidence 0.5
ID=$(mal recall "deploy straight to production" --k 1 --json | grep -o 'pro_[a-z0-9]*' | head -1)

mal refute "$ID" "shipped a broken build"
mal refute "$ID" "happened again"
mal refute "$ID" "third time — it is simply wrong"

mal lessons          # gone: confidence collapsed and it retired itself
mal show "$ID"       # still on disk, with the full record of why
```

## Commands

| Command | What it does |
|---|---|
| `mal remember <text>` | Write a memory. `--kind identity\|semantic\|episodic\|procedural\|source` |
| `mal learn <rule> --when <cond>` | Teach a lesson. `--confidence` sets the starting belief |
| `mal recall <query>` | Search. `--k`, `--kind`, `--project`, `--json` |
| `mal brief [query]` | The context block the hooks inject. `--budget` in tokens |
| `mal lessons` | What it believes, grouped trusted / provisional / failing |
| `mal confirm <id>` / `mal refute <id> <reason>` | Grade a lesson |
| `mal show <id>` | Full record including provenance and counters |
| `mal ingest <path\|url>` | Learn from a file or a web page |
| `mal capture --transcript <p>` | Distill a finished session |
| `mal sleep` | Consolidate: fade, merge, retire, promote. `--dry-run` |
| `mal stats` / `mal log` | What it knows / what it has done |

## Environment

| Variable | Effect |
|---|---|
| `MALACHII_HOME` | Where the brain lives. Default `~/.malachii` |
| `MALACHII_DB` | Override the database path directly |
| `MALACHII_PROJECT` | Default project scope. Otherwise the current directory name |
| `MALACHII_BRIEF_BUDGET` | Default brief size in tokens (1200) |
| `ANTHROPIC_API_KEY` | Enables model-quality distillation and consolidation |
| `VOYAGE_API_KEY` | Upgrades embeddings from local hashing to a trained model |
| `MALACHII_DUPLICATE_THRESHOLD` | Override the embedder's near-duplicate cosine |

None are required. With no keys at all the brain still remembers, recalls,
scores, consolidates, and distills — it uses heuristics instead of judgement.

## Development

```bash
pnpm install                                   # from the repo root
node_modules/.bin/tsc --noEmit -p malachii/tsconfig.json
node_modules/.bin/vitest run --root malachii
```

## Layout

```
src/core/       schema, migrations, config, ids
src/memory/     store, embeddings, retrieval, packing, consolidation, ingestion
src/learning/   lesson lifecycle, session distillation, transcript parsing
src/llm/        the optional Claude layer — every call degrades to null
src/cli/mal.ts  the command surface
```
