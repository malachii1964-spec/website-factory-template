#!/usr/bin/env bash
# Stop hook — the enforcement layer.
#
# CLAUDE.md is guidance the agent can rationalise around. This is physics:
# when Claude tries to finish, the gates run. Exit code 2 blocks the stop and
# feeds the failures back, so the only way out is to fix them.
#
# Only the surfaces that actually changed are checked, so a docs-only turn
# doesn't pay for a full build.
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT="$(cat)"

# Loop guard: if this hook already blocked once and Claude is still stuck,
# let it stop and report rather than trapping it in a retry loop.
if printf '%s' "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

CHANGED="$(git status --porcelain 2>/dev/null | awk '{print $NF}')"
[ -z "$CHANGED" ] && exit 0

FAILURES=""
run_gate() {
  local label="$1"; shift
  local output
  if ! output="$("$@" 2>&1)"; then
    FAILURES="${FAILURES}
── ${label} ──
$(printf '%s' "$output" | tail -30)"
  fi
}

if printf '%s' "$CHANGED" | grep -q '^malachii/'; then
  if [ -x node_modules/.bin/tsc ]; then
    run_gate "malachii typecheck" node_modules/.bin/tsc --noEmit -p malachii/tsconfig.json
  fi
  if [ -x node_modules/.bin/vitest ]; then
    run_gate "malachii tests" node_modules/.bin/vitest run --root malachii
  fi
fi

if printf '%s' "$CHANGED" | grep -qE '^(src|content|scripts)/'; then
  if [ -x node_modules/.bin/tsc ]; then
    run_gate "site typecheck" node_modules/.bin/tsc --noEmit
  fi
  if [ -x node_modules/.bin/eslint ]; then
    run_gate "site lint" node_modules/.bin/eslint
  fi
fi

if [ -n "$FAILURES" ]; then
  {
    echo "Quality gates failed. These must pass before this work is done:"
    echo "$FAILURES"
    echo
    echo "Fix them and finish. Do not skip, comment out, or weaken a test to get past this."
  } >&2
  exit 2
fi

exit 0
