#!/usr/bin/env bash
# Pull latest changes and redeploy the CraftAi API backend (.NET).
#
# Steps: git pull -> dotnet publish (Release) -> backup current
# /var/www/craftai-api -> rsync new build -> fix ownership -> restart
# systemd service -> health check (rollback on failure).
set -euo pipefail

REPO_DIR="/root/ai-sana"
BACK_DIR="$REPO_DIR/platform/back"
API_PROJECT="$BACK_DIR/src/Bootstrap/CraftAi.Api/CraftAi.Api.csproj"
PUBLISH_DIR="/tmp/craftai-api-publish"
DEPLOY_DIR="/var/www/craftai-api"
SERVICE_NAME="craftai-api.service"
DEPLOY_USER="craftai"
BACKUP_DIR="/var/www/craftai-api.bak-$(date +%Y%m%d-%H%M%S)"
KEEP_BACKUPS=5
HEALTH_URL="http://localhost:5009/health"

log() { echo "[update-backend] $*"; }

cd "$REPO_DIR"

log "Checking working tree..."
if [[ -n "$(git status --porcelain)" ]]; then
  log "ERROR: working tree has uncommitted changes, aborting. Run 'git status' to inspect."
  exit 1
fi

log "Pulling latest changes from origin..."
git pull --ff-only

log "Publishing API (Release)..."
rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"
dotnet publish "$API_PROJECT" -c Release -o "$PUBLISH_DIR"

if [[ ! -f "$PUBLISH_DIR/CraftAi.Api.dll" ]]; then
  log "ERROR: publish output not found at $PUBLISH_DIR, aborting deploy."
  exit 1
fi

log "Backing up current deploy to $BACKUP_DIR..."
cp -a "$DEPLOY_DIR" "$BACKUP_DIR"

log "Syncing new build into $DEPLOY_DIR..."
rsync -a --delete "$PUBLISH_DIR/" "$DEPLOY_DIR/"

log "Fixing ownership..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

log "Restarting $SERVICE_NAME..."
systemctl restart "$SERVICE_NAME"
sleep 3

log "Checking service status..."
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  log "ERROR: $SERVICE_NAME is not active after restart. Rolling back..."
  rsync -a --delete "$BACKUP_DIR/" "$DEPLOY_DIR/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
  systemctl restart "$SERVICE_NAME"
  exit 1
fi

log "Health check..."
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL")"
if [[ "$HTTP_CODE" != "200" ]]; then
  log "ERROR: health check failed (HTTP $HTTP_CODE). Rolling back..."
  rsync -a --delete "$BACKUP_DIR/" "$DEPLOY_DIR/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
  systemctl restart "$SERVICE_NAME"
  exit 1
fi
log "Health check OK (HTTP $HTTP_CODE)."

log "Pruning old backups (keeping last $KEEP_BACKUPS)..."
ls -1dt /var/www/craftai-api.bak-* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf

log "Done. Deployed $(git -C "$REPO_DIR" rev-parse --short HEAD)."
