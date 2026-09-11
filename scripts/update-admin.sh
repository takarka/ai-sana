#!/usr/bin/env bash
# Pull latest changes and redeploy the admin.craftai.kz Angular SPA (static
# build, no SSR, served directly by nginx).
#
# Steps: git pull -> npm install (if lockfile changed) -> nx build admin
# (production) -> backup current /var/www/craftai-admin -> rsync new build
# -> fix ownership -> health check.
set -euo pipefail

REPO_DIR="/root/ai-sana"
FRONT_DIR="$REPO_DIR/platform/front"
BUILD_OUTPUT="$FRONT_DIR/dist/admin"
DEPLOY_DIR="/var/www/craftai-admin"
DEPLOY_USER="craftai"
BACKUP_DIR="/var/www/craftai-admin.bak-$(date +%Y%m%d-%H%M%S)"
KEEP_BACKUPS=5
HEALTH_URL="https://admin.craftai.kz/"

log() { echo "[update-admin] $*"; }

cd "$REPO_DIR"

log "Checking working tree..."
if [[ -n "$(git status --porcelain)" ]]; then
  log "ERROR: working tree has uncommitted changes, aborting. Run 'git status' to inspect."
  exit 1
fi

log "Pulling latest changes from origin..."
BEFORE_LOCK_HASH="$(sha1sum "$FRONT_DIR/package-lock.json" | awk '{print $1}')"
git pull --ff-only

log "Checking if frontend dependencies changed..."
AFTER_LOCK_HASH="$(sha1sum "$FRONT_DIR/package-lock.json" | awk '{print $1}')"
if [[ "$BEFORE_LOCK_HASH" != "$AFTER_LOCK_HASH" ]]; then
  log "package-lock.json changed, running npm ci..."
  (cd "$FRONT_DIR" && npm ci)
else
  log "No dependency changes detected, skipping npm ci."
fi

log "Building admin app (production)..."
(cd "$FRONT_DIR" && npx nx build admin --configuration=production)

if [[ ! -d "$BUILD_OUTPUT/browser" ]]; then
  log "ERROR: build output not found at $BUILD_OUTPUT, aborting deploy."
  exit 1
fi

log "Backing up current deploy to $BACKUP_DIR..."
cp -a "$DEPLOY_DIR" "$BACKUP_DIR"

log "Syncing new build into $DEPLOY_DIR..."
rsync -a --delete "$BUILD_OUTPUT/browser/" "$DEPLOY_DIR/"

log "Fixing ownership..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

log "Health check..."
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL")"
if [[ "$HTTP_CODE" != "200" ]]; then
  log "ERROR: health check failed (HTTP $HTTP_CODE). Rolling back..."
  rsync -a --delete "$BACKUP_DIR/" "$DEPLOY_DIR/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
  exit 1
fi
log "Health check OK (HTTP $HTTP_CODE)."

log "Pruning old backups (keeping last $KEEP_BACKUPS)..."
ls -1dt /var/www/craftai-admin.bak-* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf

log "Done. Deployed $(git -C "$REPO_DIR" rev-parse --short HEAD)."
