#!/usr/bin/env bash
# The Voyage comparison, as one command.
#
# Answers one question: does a trained embedding model beat the hand-rolled
# local one, which the ablation measured as contributing nothing to retrieval?
#
#   VOYAGE_API_KEY=pa-... bash malachii/bench/voyage-comparison.sh
#
# Runs four things against the identical corpus and questions:
#   0. a paraphrase probe   — the local embedder scores 0.67 on a restatement
#   1. local baseline       — the control, should reproduce 60.7% any@10
#   2. voyage hybrid        — the actual question
#   3. voyage, vectors off  — does the trained embedder beat lexical-only?
#
# Run 3 is the decisive one. If a real embedder still adds nothing over BM25,
# the bottleneck was never the embedder.
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1

if [ -z "${VOYAGE_API_KEY:-}" ]; then
  echo "VOYAGE_API_KEY is not set." >&2
  echo "  VOYAGE_API_KEY=pa-... bash malachii/bench/voyage-comparison.sh" >&2
  exit 1
fi

DATA=malachii/bench/data/locomo10.json
if [ ! -f "$DATA" ]; then
  echo "Fetching LoCoMo…"
  mkdir -p malachii/bench/data
  curl -fsSL -o "$DATA" \
    https://raw.githubusercontent.com/snap-research/LoCoMo/main/data/locomo10.json || exit 1
fi

echo "════════ 0. paraphrase probe ════════"
node --disable-warning=ExperimentalWarning -e '
const { VoyageEmbedder, LocalEmbedder, cosine } = await import("./malachii/src/memory/embed.ts");
const pairs = [
  ["Stripe handles checkout and webhooks", "the checkout flow is processed through Stripe"],
  ["the build broke on a missing environment variable", "deployment failed because a config value was absent"],
  ["Stripe handles checkout and webhooks", "the cabinet hinges arrive on Tuesday"],
];
const norm = (v) => { let n=0; for (const x of v) n+=x*x; n=Math.sqrt(n); return n>0 ? v.map(x=>x/n) : v; };
const voyage = new VoyageEmbedder(process.env.VOYAGE_API_KEY);
const local = new LocalEmbedder();
const flat = pairs.flat();
const V = (await voyage.embed(flat)).map(norm);
const L = await local.embed(flat);
console.log("                                          local   voyage");
pairs.forEach((p, i) => {
  const label = i === 2 ? "unrelated (should be LOW)" : "paraphrase (should be HIGH)";
  console.log(
    label.padEnd(40),
    cosine(L[i*2], L[i*2+1]).toFixed(3).padStart(6),
    cosine(V[i*2], V[i*2+1]).toFixed(3).padStart(8),
  );
});
' || echo "  probe failed — check the key and that api.voyageai.com is reachable"

echo
echo "════════ 1. local baseline (control) ════════"
env -u VOYAGE_API_KEY node malachii/bench/locomo.ts 2>/dev/null | sed -n '4,17p'

echo
echo "════════ 2. voyage, full hybrid ════════"
node malachii/bench/locomo.ts 2>/dev/null | sed -n '4,17p'

echo
echo "════════ 3. voyage, vectors OFF (the decisive one) ════════"
node malachii/bench/locomo.ts --ablate no-vector 2>/dev/null | sed -n '4,17p'

echo
echo "Reference — what we measured on the local embedder:"
echo "  hybrid       52.6 / 60.7 / 68.0 any@k · 48.7 all@10 · MRR 0.396"
echo "  vectors off  51.6 / 61.5 / 68.6 any@k · 49.5 all@10 · MRR 0.395"
echo
echo "If run 2 beats run 1, the trained embedder is worth its cost."
echo "If run 2 and run 3 are still level, the vector path should be deleted."
