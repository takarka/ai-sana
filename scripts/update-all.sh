#!/usr/bin/env bash
# Update and redeploy every CraftAi service on this box: backend API,
# admin panel, and the public landing. Each sub-script pulls the repo
# itself (git pull --ff-only is a no-op if already current), builds,
# deploys with a timestamped backup, and health-checks itself with
# automatic rollback on failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 1/3: backend ==="
"$SCRIPT_DIR/update-backend.sh"

echo "=== 2/3: admin ==="
"$SCRIPT_DIR/update-admin.sh"

echo "=== 3/3: landing ==="
"$SCRIPT_DIR/update-frontend.sh"

echo "All services updated and deployed successfully."
