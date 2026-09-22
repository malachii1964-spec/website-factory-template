#!/usr/bin/env bash
# Website Factory — Quality Gate (Stop hook)
# Runs every time Claude tries to finish a turn.
# Exit 0 = all clear. Exit 2 = checks failed; stderr goes back to Claude
# and it MUST keep working. This is enforcement, not suggestion.

INPUT=$(cat)

# Loop guard: if this stop was already triggered by this hook, don't block
# again — prevents infinite fix-loops on unfixable errors.
if command -v jq >/dev/null 2>&1; then
  if echo "$INPUT" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
    exit 0
  fi
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# Nothing scaffolded yet? Nothing to gate.
[ -f package.json ] || exit 0

FAILURES=""

run_check () {
  local name="$1"; shift
  local out
  if ! out=$("$@" 2>&1); then
    FAILURES="${FAILURES}
=== ${name} FAILED ===
$(echo "$out" | tail -30)"
  fi
}

# Gate 1: TypeScript — zero type errors
if [ -f tsconfig.json ]; then
  run_check "TYPECHECK (tsc --noEmit)" npx tsc --noEmit
fi

# Gate 2: Lint (only if a lint script exists)
if grep -q '"lint"' package.json 2>/dev/null; then
  run_check "LINT" npm run --silent lint
fi

# Gate 3: Tests (only if a test script exists)
if grep -q '"test"' package.json 2>/dev/null; then
  run_check "TESTS" npm run --silent test -- --run 2>/dev/null || \
  run_check "TESTS" npm run --silent test
fi

if [ -n "$FAILURES" ]; then
  echo "QUALITY GATE FAILED — you are not done. Fix these before finishing:" >&2
  echo "$FAILURES" >&2
  exit 2
fi

exit 0
