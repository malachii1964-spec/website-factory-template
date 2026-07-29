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

## Ablation — what is actually carrying retrieval, 2026-07-29

Same corpus, one scoring term zeroed at a time and its weight redistributed.

| config | any@5 | any@10 | any@20 | all@10 | MRR |
|---|---|---|---|---|---|
| hybrid (baseline) | 52.6% | 60.7% | 68.0% | 48.7% | 0.396 |
| **vectors off** (BM25 + priors) | 51.6% | **61.5%** | **68.6%** | **49.5%** | 0.395 |
| **lexical off** (vectors + priors) | 17.7% | **24.3%** | 33.3% | 19.7% | 0.126 |

**The local hashed embedder contributes nothing to retrieval.** Removing it
entirely moves every metric by less than a point, and moves most of them
*upward*. Removing BM25 instead collapses the system — multi-hop `all@10` goes
from 11.3% to 0.7%.

So "hybrid retrieval" is not hybrid in practice. BM25 does effectively all of
the work, and the vector half is cost without benefit on the hot path: an embed
call per write, a blob per memory, a vector load and a dot product per
candidate per query.

This also corrects an earlier reading of the baseline. Multi-hop was diagnosed
as needing traversal; it more likely needs a semantic signal to traverse
*with*. Lexical-only multi-hop (10.6%) is statistically indistinguishable from
hybrid (11.3%) — there is no semantic contribution to build on.

**Consequences, in order of value:**

1. A real embedding model is the single highest-value change available, and now
   has a measured before-number to prove any gain against. Set `VOYAGE_API_KEY`
   and re-run all three configs.
2. If a real embedder is not adopted, the vector path should be deleted from
   retrieval rather than left in place looking like it does something. It would
   still earn its keep in near-duplicate detection during `mal sleep` and in
   diversity selection — but both of those deserve their own measurement first,
   since a noisy similarity signal may be actively harming diversity selection.

Cost note: second-hop expansion raises full-corpus runtime from 5.5 min to
45.8 min — roughly 8x — because each query fans out into several more. Any gain
it shows has to be weighed against that.

## Scoring modes, and a limit of this benchmark — 2026-07-29

The original scorer adds every term:

```
score = 0.34·similarity + 0.26·lexical + 0.14·recency + 0.14·importance + 0.12·confidence
```

That has a noise floor. Priors alone put a completely irrelevant memory at
~0.26, and folded cosine adds ~0.17 more, so an unrelated memory sits near 0.43
while a perfect match tops out near 0.86. Relevance only ever decides the top
half of the scale. This is also why second-hop expansion could not promote
anything: a discounted associative score could never clear that floor.

`relevance-first` fixes it in principle — relevance *is* the score, and priors
scale it, so something the query does not match scores zero however trusted it
is:

```
relevance = (w_sim·similarity + w_lex·lexical) / (w_sim + w_lex)
prior     = 1 + 0.35·(importance−½) + 0.30·(confidence−½) + 0.25·(recency−½)
score     = relevance × prior   (+ pin bonus)
```

**Measured, one conversation, n=150:**

| config | any@10 | all@10 | MRR |
|---|---|---|---|
| additive | 60.0% | 50.0% | 0.361 |
| relevance-first | 58.0% | 48.7% | 0.345 |
| additive, vectors off | 60.0% | 50.0% | 0.371 |
| relevance-first, vectors off | 60.0% | 50.0% | 0.371 |

Two findings.

**With the current embedder, relevance-first is slightly worse.** It gives the
similarity term 57% of the relevance weight instead of 34% of the total — and
that term is measured noise. Better structure, more weight on the broken input.

**With vectors off, the two modes are byte-identical**, and that is not luck.
Every LoCoMo memory is written in the same instant, with the same kind, the
same importance (0.40) and the same confidence (0.50). The prior term is
therefore a *constant* across every candidate, so `w·lex + C` and `lex × C`
produce the same ordering.

**LoCoMo is structurally blind to prior handling.** It measures relevance
ranking over a flat corpus. It cannot see trust, decay, or confidence — which
are exactly the things that distinguish this system from a search index. A
second benchmark is needed for that machinery, over a corpus where memories
differ in age and trustworthiness and some of them are wrong.

The default therefore stays `additive`, on evidence rather than preference.
`relevance-first` ships as an option (`MALACHII_SCORING`), with both behaviours
pinned by tests. Re-run this comparison the day a real embedder lands; the
argument should flip, because the noise it amplifies will have become signal.
