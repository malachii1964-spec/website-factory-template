#!/usr/bin/env bash
# Bisection script: finds which test creates unwanted files or state.
# Usage: ./find-polluter.sh <file_or_dir_to_check> <test_glob_pattern>
# Example: ./find-polluter.sh '.pglite' 'src/**/*.test.ts'

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file_to_check> <test_pattern>"
  echo "Example: $0 '.pglite' 'src/**/*.test.ts'"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

echo "Searching for test that creates: $POLLUTION_CHECK"
echo "Test pattern: $TEST_PATTERN"
echo ""

TEST_FILES=$(find . -path "$TEST_PATTERN" -not -path '*/node_modules/*' | sort)
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')
echo "Found $TOTAL test files"
echo ""

COUNT=0
for TEST_FILE in $TEST_FILES; do
  COUNT=$((COUNT + 1))

  if [ -e "$POLLUTION_CHECK" ]; then
    echo "Pollution already exists before test $COUNT/$TOTAL — skipping: $TEST_FILE"
    continue
  fi

  echo "[$COUNT/$TOTAL] $TEST_FILE"
  npm test "$TEST_FILE" > /dev/null 2>&1 || true

  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "POLLUTER FOUND: $TEST_FILE"
    echo "Created: $POLLUTION_CHECK"
    ls -la "$POLLUTION_CHECK"
    echo ""
    echo "To investigate: npm test $TEST_FILE"
    exit 1
  fi
done

echo ""
echo "No polluter found — all tests clean."
exit 0
