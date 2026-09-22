#!/usr/bin/env bash
# SessionStart: report factory context at the top of every session.
# Never fails — a startup hook that blocks you out of your own repo is
# worse than no hook. All output is informational only.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

lines=()

# Branch + last commit
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
last_commit=$(git log -1 --pretty="[%h] %s" 2>/dev/null || echo "no commits")
lines+=("branch: $branch")
lines+=("last commit: $last_commit")

# Scaffolded project or bare template?
if [ -f package.json ]; then
  pkg_name=$(node -pe "require('./package.json').name" 2>/dev/null || echo "unknown")
  lines+=("project: $pkg_name (scaffolded)")
else
  lines+=("project: template only — no package.json yet")
fi

# PROJECT_STATE.md if present
if [ -f PROJECT_STATE.md ]; then
  stage=$(grep "^Current stage:" PROJECT_STATE.md 2>/dev/null | head -1 | sed 's/Current stage://' | tr -d ' ')
  [ -n "$stage" ] && lines+=("stage: $stage") || lines+=("stage: PROJECT_STATE.md present (no stage line)")
fi

# Cloud vs local (relevant for browser automation capabilities)
if [ -d /dev/bus/usb ]; then
  lines+=("env: local machine")
else
  lines+=("env: cloud container — browser automation available via Playwright")
fi

# Uncommitted changes warning
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
[ "$dirty" -gt 0 ] && lines+=("warning: $dirty uncommitted file(s)")

printf '%s' "$(node -e '
  const l = process.argv.slice(1);
  process.stdout.write(JSON.stringify({
    systemMessage: "Website Factory — " + l.join(" · ")
  }));
' "${lines[@]}" 2>/dev/null || echo '{}')"
