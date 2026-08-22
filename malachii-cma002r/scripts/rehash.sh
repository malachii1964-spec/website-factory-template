#!/usr/bin/env bash
# Re-bind the tree hash after any source change.
#
# The manifest covers source, tests and scripts only — not the build report.
# A hash that included the document citing it could never be stable, and a
# reviewer needs to bind to the code, not the prose.
set -euo pipefail
cd "$(dirname "$0")/.."
find src tests scripts package.json tsconfig.json -type f | sort | xargs sha256sum > PACKAGE_HASHES.txt
sha256sum PACKAGE_HASHES.txt | cut -d' ' -f1 > CHALLENGER_TREE_SHA256.txt
cat CHALLENGER_TREE_SHA256.txt
