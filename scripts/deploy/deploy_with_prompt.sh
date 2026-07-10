#!/usr/bin/env bash
set -e

DEPLOY_USER="${DEPLOY_USER:-okearey}"

echo "=== Building frontend ==="
npm run build

echo ""
echo "=== Deploying to production ==="
ssh -t "$DEPLOY_USER@newsgap.huma-num.fr" "sudo rsync -a --delete /home/$DEPLOY_USER/Unpredictable_game/dist/ /var/www/newsgap/ && sudo systemctl restart newsgap && sudo systemctl reload nginx"

echo ""
echo "✅ Deployment complete"
