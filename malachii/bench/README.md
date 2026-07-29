# Benchmarks

Measurement, not assertion. An efficiency or quality claim without a number is
an opinion (`efficiency.md`).

## LoCoMo — retrieval

```bash
mkdir -p malachii/bench/data
curl -L -o malachii/bench/data/locomo10.json \
  https://raw.githubusercontent.com/snap-research/LoCoMo/main/data/locomo10.json

node malachii/bench/locomo.ts                     # full run, ~5 min
node malachii/bench/locomo.ts --conversations 1   # quick smoke
node malachii/bench/locomo.ts --json              # machine-readable
```

**What it measures.** LoCoMo labels every question with the exact dialogue
turns containing its answer. This harness asks one question: given a query,
does recall surface those turns? It scores retrieval only — not the model that
would answer from it.

**These numbers are not comparable to published end-to-end LoCoMo scores**,
which grade a generated answer and therefore measure the memory and the model
together. Retrieval is the ceiling on that score, not the same quantity.

Scored set is categories 1–4 (1,540 questions), matching the standard
evaluation. Category 5 is adversarial — the correct behaviour is to decline,
which tests generation rather than retrieval — so it is reported separately.

`any@k` is the forgiving metric: at least one gold turn retrieved.
`all@k` is the real one for multi-hop: every gold turn retrieved.

## Baseline — local hashed embedder, 2026-07-29

10 conversations · 5,882 turns · 1,536 scored questions

| | any@5 | any@10 | any@20 | all@10 | MRR |
|---|---|---|---|---|---|
| **overall** | 52.6% | **60.7%** | 68.0% | **48.7%** | 0.396 |
| single-hop | 56.6% | 63.6% | 69.9% | 60.3% | 0.431 |
| temporal | 58.3% | 66.7% | 73.5% | 58.9% | 0.469 |
| multi-hop | 41.5% | 52.8% | 64.9% | **11.3%** | 0.274 |
| open-domain | 30.4% | 38.0% | 41.3% | 21.7% | 0.192 |

Ingest 0.16 ms/turn · query 167 ms.

**Read of the baseline.** Single-hop and temporal hold up — dates and proper
nouns are distinctive lexical tokens and the BM25 half of the hybrid earns its
keep. Multi-hop collapses on `all@k` (11.3%): finding one of two required
turns is common, finding both is rare, because one-shot retrieval has no way
to use the first hit to go looking for the second. Open-domain is worst
overall, which is the expected shape for an embedder measured at 0.67 cosine
on a true paraphrase.

Re-run after setting `VOYAGE_API_KEY` to separate the embedder's contribution
from the retrieval architecture's.
