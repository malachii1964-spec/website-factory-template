#!/usr/bin/env bash
# Quality gate — Stop hook. This is the "physics" layer of the Website Factory:
# CLAUDE.md Rule 3 is guidance the agent can talk itself out of; this script is not.
#
# Exit codes:
#   0 = gates pass (or genuinely not applicable) -> Claude may stop
#   2 = gates fail -> the stop is BLOCKED and stderr is fed back to Claude to fix
#
# Loop guard: if this hook already blocked once this turn (stop_hook_active) and
# the gates are STILL failing, we let Claude stop rather than trapping it forever
# on something it cannot fix (broken toolchain, no network). The failure is still
# printed, and Claude is told to report it honestly instead of claiming success.

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR" || exit 0

HOOK_INPUT="$(cat)"

if command -v jq >/dev/null 2>&1; then
  ALREADY_BLOCKED="$(printf '%s' "$HOOK_INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)"
else
  case "$HOOK_INPUT" in
    *'"stop_hook_active":true'* | *'"stop_hook_active": true'*) ALREADY_BLOCKED=true ;;
    *) ALREADY_BLOCKED=false ;;
  esac
fi

# Not a JS/TS project yet (docs-only change, fresh template before scaffolding).
[ -f package.json ] || exit 0

if [ -f pnpm-lock.yaml ]; then
  PM=pnpm
elif [ -f yarn.lock ]; then
  PM=yarn
else
  PM=npm
fi

if [ ! -d node_modules ]; then
  [ "$ALREADY_BLOCKED" = "true" ] && exit 0
  {
    echo "QUALITY GATE: dependencies are not installed, so no gate could run."
    echo "Run '$PM install', then satisfy CLAUDE.md Rule 3 before finishing."
  } >&2
  exit 2
fi

FAILED=""
DETAIL=""

# gate <name> <command...>
gate() {
  local name="$1"; shift
  local out
  if ! out="$("$@" 2>&1)"; then
    FAILED="${FAILED}${name} "
    DETAIL="${DETAIL}
----- ${name} FAILED -----
$(printf '%s' "$out" | tail -n 60)
"
  fi
}

has_script() { # has_script <name>
  node -e "process.exit(require('./package.json').scripts?.['$1'] ? 0 : 1)" 2>/dev/null
}

gate "typecheck" npx --no-install tsc --noEmit
has_script lint && gate "lint" "$PM" run lint
has_script test && gate "tests" "$PM" run test

# `next build` is also a Rule 3 gate, but it is too slow to run on every stop.
# CI (.github/workflows/quality-gates.yml) runs it on every push instead.

if [ -n "$FAILED" ]; then
  if [ "$ALREADY_BLOCKED" = "true" ]; then
    {
      echo "QUALITY GATE still failing: ${FAILED}"
      echo "Not blocking again. Report this failure to the user honestly — do not claim the work is done."
      echo "$DETAIL"
    } >&2
    exit 0
  fi
  {
    echo "QUALITY GATE FAILED: ${FAILED}"
    echo "CLAUDE.md Rule 3: a feature is not done until typecheck, lint, build and tests pass."
    echo "Fix these now. Do not skip, delete, or weaken tests to get past this gate."
    echo "$DETAIL"
  } >&2
  exit 2
fi

exit 0
