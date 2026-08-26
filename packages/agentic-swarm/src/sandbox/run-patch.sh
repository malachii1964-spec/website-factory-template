#!/bin/sh
# Fixed script baked into the runner image. Model output NEVER reaches the shell
# as a string — only as the JSON file /work/.agent/edits.json, consumed by the
# path-validated apply-edits.mjs. This is what closes the arbitrary-command
# injection hole in `command=f"python -c \"{code}\""` from the original design.
set -eu
cd /work

echo "== applying edits =="
node /opt/agent/apply-edits.mjs /edits/edits.json

echo "== installing deps (offline, read-only store) =="
pnpm --offline --store-dir /store install --frozen-lockfile

echo "== typecheck =="
pnpm exec tsc --noEmit

echo "== lint =="
pnpm lint

echo "== unit tests =="
pnpm test

echo "== build =="
pnpm build

echo "== assertion (pre-patch expectation already captured by caller) =="
node /opt/agent/verify-assertion.mjs

echo "== diff =="
git diff > /out/patch.diff
echo "patch written to /out/patch.diff"
