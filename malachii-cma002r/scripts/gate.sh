#!/usr/bin/env bash
# The full release gate. Run before committing or handing the tree to a reviewer.
#
# The Stop hook runs build + tests on every stop because that is fast. This adds
# the two slow things that actually decide whether the tests mean anything: the
# constitutional mutation campaign, and re-binding the tree hash.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
fail=0

step() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=1; }

step "1/4  build"
if ../node_modules/.bin/tsc -p tsconfig.json 2>&1 | grep -q .; then bad "typecheck"; else ok "typecheck + emit"; fi

step "2/4  test suite"
out=$(node --test $(ls dist/tests/*.test.js) 2>&1)
pass=$(printf '%s' "$out" | grep -E '^# pass' | tr -dc '0-9')
if printf '%s' "$out" | grep -qE '^# fail [1-9]'; then
  bad "$(printf '%s' "$out" | grep -E '^# fail')"
  printf '%s\n' "$out" | grep -E '^not ok' | head -10
else
  ok "$pass tests"
fi

step "3/4  constitutional mutation campaign"
# The gate that decides whether the suite above is worth anything: every
# governance control is broken on purpose and must be caught.
if node scripts/mutate.mjs >/tmp/malachii-mutate.log 2>&1; then
  ok "$(grep 'kill rate' /tmp/malachii-mutate.log)"
else
  bad "$(grep 'kill rate' /tmp/malachii-mutate.log || echo 'campaign failed')"
  grep -E 'SURVIVED|NOT APPLIED' /tmp/malachii-mutate.log || true
fi

step "4/4  artifact binding"
./scripts/rehash.sh >/dev/null 2>&1 && ok "tree hash $(cat CHALLENGER_TREE_SHA256.txt | cut -c1-12)… written to CHALLENGER_TREE_SHA256.txt" || bad "rehash"

if [ "$fail" -eq 0 ]; then
  printf '\n\033[32mGATE GREEN\033[0m — safe to commit. Remember: repaired, not promoted.\n\n'
else
  printf '\n\033[31mGATE RED\033[0m — do not commit.\n\n'
fi
exit "$fail"
