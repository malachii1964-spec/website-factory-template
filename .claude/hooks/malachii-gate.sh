#!/usr/bin/env bash
# Stop: the trust kernel does not get to be left broken.
#
# Runs build + the full test suite (~6s) whenever malachii-cma002r has
# uncommitted changes. The 25-mutation campaign is deliberately NOT here — it
# takes minutes, and a gate slow enough to resent is a gate people disable. Run
# it before committing with: malachii-cma002r/scripts/gate.sh
set -uo pipefail
input=$(cat)

# Never re-block a stop we already blocked once, or the turn cannot end.
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root" || exit 0
[ -d malachii-cma002r ] || exit 0
[ -n "$(git status --porcelain malachii-cma002r 2>/dev/null)" ] || exit 0

tsc="$root/node_modules/.bin/tsc"
[ -x "$tsc" ] || exit 0

build=$(cd malachii-cma002r && "$tsc" -p tsconfig.json 2>&1)
if [ -n "$build" ]; then
  jq -nc --arg out "$build" '{decision:"block", reason:("MALACHII gate: build failed.\n" + $out)}'
  exit 0
fi

tests=$(cd malachii-cma002r && node --test $(ls dist/tests/*.test.js) 2>&1)
if printf '%s' "$tests" | grep -qE '^# fail [1-9]'; then
  failed=$(printf '%s' "$tests" | grep -E '^not ok' | head -10)
  jq -nc --arg f "$failed" '{decision:"block", reason:("MALACHII gate: tests failing.\n" + $f + "\nFix before stopping. Full run: cd malachii-cma002r && node --test $(ls dist/tests/*.test.js)")}'
  exit 0
fi

passed=$(printf '%s' "$tests" | grep -E '^# pass' | head -1 | tr -dc '0-9')
jq -nc --arg p "$passed" '{systemMessage:("MALACHII gate: " + $p + " tests pass. Run malachii-cma002r/scripts/gate.sh before committing for the mutation campaign.")}'
