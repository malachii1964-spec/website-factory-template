#!/usr/bin/env bash
# PostToolUse(Write|Edit): typecheck the trust kernel the moment it is edited.
# Runs only for files inside malachii-cma002r/ — every other edit in this repo
# exits immediately, so the hook costs nothing on the website side.
set -uo pipefail
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
case "$file" in
  *malachii-cma002r/src/*.ts|*malachii-cma002r/tests/*.ts) ;;
  *) exit 0 ;;
esac

root="$(cd "$(dirname "$0")/../.." && pwd)"
tsc="$root/node_modules/.bin/tsc"
[ -x "$tsc" ] || exit 0

out=$(cd "$root/malachii-cma002r" && "$tsc" --noEmit -p tsconfig.json 2>&1)
[ -z "$out" ] && exit 0

jq -nc --arg out "$out" '{
  decision: "block",
  reason: ("Typecheck failed after that edit:\n" + $out),
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: ("tsc --noEmit:\n" + $out) }
}'
