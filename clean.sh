#!/usr/bin/env bash
# clean.sh
# Removes dependencies and generated files (builds, coverage, Playwright reports) so the
# project can be reinstalled from scratch. Never touches .env* files or untracked notes.
# Usage: ./clean.sh   (works from any directory: it always cleans the repo it lives in)

set -euo pipefail
cd "$(dirname "$0")"

PATHS=(
  node_modules
  frontend/node_modules
  backend/node_modules
  frontend/dist
  frontend/coverage
  backend/coverage
  frontend/playwright-report
  frontend/test-results
  frontend/blob-report
)

echo "🧹 Cleaning up $(pwd)..."

removed=0
for path in "${PATHS[@]}"; do
  if [ -e "$path" ]; then
    rm -rf -- "./$path"
    echo "   removed $path"
    removed=$((removed + 1))
  fi
done

[ "$removed" -eq 0 ] && echo "   nothing to remove"
echo "✅ Done. Reinstall with: npm install && npm install --prefix frontend && npm install --prefix backend"
