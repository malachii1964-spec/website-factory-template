#!/usr/bin/env bash
# Quality gate — Stop hook. This is the "physics" layer of the Website Factory:
# CLAUDE.md Rule 3 is guidance the agent can talk itself out of; this script is not.
#
# Checks the root project AND every independent site under sites/*/ (each has
# its own package.json, node_modules, and tsconfig — they are siblings, not
# part of the root app's source tree; see root tsconfig.json/eslint.config.mjs
# excludes for the other half of that boundary).
#
# Exit codes:
#   0 = gates pass everywhere (or genuinely not applicable) -> Claude may stop
#   2 = a gate failed somewhere -> the stop is BLOCKED and stderr is fed back
#
# Loop guard: if this hook already blocked once this turn (stop_hook_active) and
# gates are STILL failing, we let Claude stop rather than trapping it forever on
# something it cannot fix (broken toolchain, no network). The failure is still
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

FAILED=""
DETAIL=""
NEEDS_INSTALL=""

# gate <dir> <label> <name> <command...>
# NOTE: runs the command via `cd "$dir" &&` INSIDE the command substitution
# (which forks its own subshell only for output capture) so that FAILED/DETAIL
# assignments below happen in this function's own (non-subshell) scope and are
# visible to the caller. Do not wrap the whole gate() call in `( ... )`.
gate() {
  local dir="$1" label="$2" name="$3"; shift 3
  local out
  if ! out="$(cd "$dir" && "$@" 2>&1)"; then
    FAILED="${FAILED}${label}:${name} "
    DETAIL="${DETAIL}
----- ${label} / ${name} FAILED -----
$(printf '%s' "$out" | tail -n 60)
"
  fi
}

has_script() { # has_script <package.json path> <script name>
  node -e "process.exit(require('$1').scripts?.['$2'] ? 0 : 1)" 2>/dev/null
}

# run_project_gates <dir> <label>
run_project_gates() {
  local dir="$1" label="$2"
  [ -f "$dir/package.json" ] || return 0

  local pm=npm
  [ -f "$dir/pnpm-lock.yaml" ] && pm=pnpm
  [ -f "$dir/yarn.lock" ] && pm=yarn

  if [ ! -d "$dir/node_modules" ]; then
    NEEDS_INSTALL="${NEEDS_INSTALL}${label} (run '${pm} install' in ${dir}) "
    return 0
  fi

  gate "$dir" "$label" "typecheck" npx --no-install tsc --noEmit
  has_script "$dir/package.json" "lint" && gate "$dir" "$label" "lint" "$pm" run lint
  has_script "$dir/package.json" "test" && gate "$dir" "$label" "tests" "$pm" run test
}
