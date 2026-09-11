#!/usr/bin/env bash
# Pull latest changes and redeploy the craftai.kz landing (Angular SSR).
#
# Steps: git pull -> npm install (if lockfile changed) -> nx build landing
# (production) -> backup current /var/www/craftai-landing -> rsync new build
# -> fix ownership -> restart systemd service -> health check.
set -euo pipefail

REPO_DIR="/root/ai-sana"
FRONT_DIR="$REPO_DIR/platform/front"
BUILD_OUTPUT="$FRONT_DIR/dist/apps/landing"
DEPLOY_DIR="/var/www/craftai-landing"
SERVICE_NAME="craftai-landing.service"
DEPLOY_USER="craftai"
BACKUP_DIR="/var/www/craftai-landing.bak-$(date +%Y%m%d-%H%M%S)"
KEEP_BACKUPS=5

log() { echo "[update-frontend] $*"; }

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

log "Building landing app (production)..."
(cd "$FRONT_DIR" && npx nx build landing --configuration=production)

if [[ ! -d "$BUILD_OUTPUT/browser" ]]; then
  log "ERROR: build output not found at $BUILD_OUTPUT, aborting deploy."
  exit 1
fi

log "Backing up current deploy to $BACKUP_DIR..."
cp -a "$DEPLOY_DIR" "$BACKUP_DIR"

log "Syncing new build into $DEPLOY_DIR..."
rsync -a --delete "$BUILD_OUTPUT/" "$DEPLOY_DIR/"

log "Fixing ownership..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

log "Restarting $SERVICE_NAME..."
systemctl restart "$SERVICE_NAME"
sleep 2

log "Checking service status..."
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  log "ERROR: $SERVICE_NAME is not active after restart. Rolling back..."
  rsync -a --delete "$BACKUP_DIR/" "$DEPLOY_DIR/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
  systemctl restart "$SERVICE_NAME"
  exit 1
fi

log "Health check..."
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: craftai.kz' http://localhost:4000/ru/)"
if [[ "$HTTP_CODE" != "200" ]]; then
  log "ERROR: health check failed (HTTP $HTTP_CODE). Rolling back..."
  rsync -a --delete "$BACKUP_DIR/" "$DEPLOY_DIR/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
  systemctl restart "$SERVICE_NAME"
  exit 1
fi
log "Health check OK (HTTP $HTTP_CODE)."

log "Pruning old backups (keeping last $KEEP_BACKUPS)..."
ls -1dt /var/www/craftai-landing.bak-* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf

log "Done. Deployed $(git -C "$REPO_DIR" rev-parse --short HEAD)."
