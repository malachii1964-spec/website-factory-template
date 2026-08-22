#!/usr/bin/env bash
# SessionStart: report where this session is running and whether the MALACHII
# tree still matches its recorded hash. Never fails the session — a startup hook
# that can block you out of your own repo is worse than no startup hook.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 0

TREE_DIR="malachii-cma002r"
lines=()

# Local vs cloud. The distinction is load-bearing: hardware signing (SUAF §3) is
# impossible without a USB bus, so say so plainly rather than letting someone
# discover it three hours in.
if [ -d /dev/bus/usb ]; then
  lines+=("host: local — USB present, hardware signing (SUAF §3) is available")
  if command -v ykman >/dev/null 2>&1; then
    lines+=("yubikey: ykman found$(ykman list 2>/dev/null | head -1 | sed 's/^/ — /')")
  else
    lines+=("yubikey: ykman not installed (brew install ykman / apt install yubikey-manager)")
  fi
else
  lines+=("host: cloud container — no USB bus, SUAF §3 hardware signing NOT possible here")
fi

if [ -d "$TREE_DIR" ]; then
  recorded=$(cat "$TREE_DIR/CHALLENGER_TREE_SHA256.txt" 2>/dev/null | tr -d '[:space:]')
  actual=$(cd "$TREE_DIR" && find src tests scripts package.json tsconfig.json -type f 2>/dev/null \
    | sort | xargs sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1)
  if [ -z "$recorded" ]; then
    lines+=("tree: no recorded hash")
  elif [ "$recorded" = "$actual" ]; then
    lines+=("tree: VERIFIED ${actual:0:12}… — matches CHALLENGER_TREE_SHA256.txt")
  else
    lines+=("tree: CHANGED — recorded ${recorded:0:12}… actual ${actual:0:12}… (expected if you have edits; re-bind before review)")
  fi
  [ -d "$TREE_DIR/dist" ] || lines+=("build: dist/ missing — run 'cd $TREE_DIR && ../node_modules/.bin/tsc -p tsconfig.json'")
fi

printf '%s' "$(node -e '
  const l = process.argv.slice(1);
  process.stdout.write(JSON.stringify({
    systemMessage: "MALACHII — " + l.join(" · "),
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: l.join("\n") },
  }));
' "${lines[@]}" 2>/dev/null || echo '{}')"
