#!/usr/bin/env bash
set -e

echo "=== Building frontend ==="
npm run build

echo ""
echo "=== Deploying to production ==="
ssh -t okearey@newsgap.huma-num.fr 'sudo rsync -a --delete /home/okearey/Unpredictable_game/dist/ /var/www/newsgap/ && sudo systemctl restart newsgap && sudo systemctl reload nginx'

echo ""
echo "✅ Deployment complete"
