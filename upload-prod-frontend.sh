#!/usr/bin/env bash
# upload-prod-frontend.sh
# Builds the frontend and publishes it to production:
#   1. Build (includes the prerender and Brotli compression from postbuild).
#   2. Checks the bundle doesn't point at localhost and the prerendered pages exist.
#   3. Uploads dist/ to the server with rsync.
#   4. Reloads the frontend nginx (no downtime) so it stops serving old files from its
#      open_file_cache.
#   5. Checks production serves the bundle that was just uploaded.
# Usage: ./upload-prod-frontend.sh [--dry-run]
#   --dry-run  builds and runs the checks, and shows what would be uploaded, without uploading or reloading.
# Requires the "malaspersonas" SSH alias in ~/.ssh/config and frontend/.env.production.

set -euo pipefail
cd "$(dirname "$0")"

REMOTE="malaspersonas"
WEB_DIR="/home/opc/data/malaspersonas/frontend/web/"
CONTAINER="malaspersonas-frontend"
SITE="https://www.malaspersonas.com"

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

step() { printf '\n==> %s\n' "$1"; }
fail() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

[ -f frontend/.env.production ] || fail "frontend/.env.production is missing (VITE_API_URL and VITE_SOCKET_URL)"

step "Building the frontend"
npm run build --prefix frontend

step "Checking the build"
if grep -rl 'localhost:3000' frontend/dist/assets; then
  fail "the bundle points at localhost:3000; nothing was uploaded"
fi
[ -f frontend/dist/prerender/home.html ] || fail "the prerendered pages were not generated"
echo "OK: no localhost, $(ls frontend/dist/prerender/*.html | wc -l | tr -d ' ') prerendered pages"

RSYNC_OPTS=(-a --delete-after --checksum --itemize-changes -e "ssh -q")
if [ "$DRY_RUN" = "1" ]; then
  step "Dry run: this is what would be uploaded (nothing is uploaded)"
  RSYNC_OPTS+=(-n)
else
  step "Uploading dist/ to $REMOTE:$WEB_DIR"
fi
rsync "${RSYNC_OPTS[@]}" frontend/dist/ "$REMOTE:$WEB_DIR" \
  | awk '/^\*deleting/ { del++ } /^<f/ { up++ } END { printf "Files uploaded or updated: %d, deleted: %d\n", up, del }'

if [ "$DRY_RUN" = "1" ]; then
  printf '\nDry run finished. To publish: ./upload-prod-frontend.sh\n'
  exit 0
fi

step "Reloading the frontend nginx"
ssh -q "$REMOTE" "docker exec $CONTAINER sh -c 'nginx -t && nginx -s reload'"

step "Checking production"
LOCAL_JS=$(grep -oE '/assets/js/index-[^"]+\.js' frontend/dist/index.html)
LIVE_JS=$(curl -s -H 'Accept-Encoding: identity' "$SITE/" | grep -oE '/assets/js/index-[^"]+\.js' || true)
if [ "$LOCAL_JS" = "$LIVE_JS" ]; then
  echo "OK: $SITE serves the new bundle ($LOCAL_JS)"
else
  fail "production serves '$LIVE_JS' instead of '$LOCAL_JS'"
fi
