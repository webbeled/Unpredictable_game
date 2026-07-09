#!/usr/bin/env bash
set -e

SERVER="okearey@newsgap.huma-num.fr"
REMOTE_DIR="/home/okearey/Unpredictable_game"

# Commit
echo "=== Commit message ==="
read -p "> " MSG
git add -A
git commit -m "$MSG"
git push origin "$(git branch --show-current)"

# Build
echo ""
echo "=== Building ==="
npm run build

# Deploy
echo ""
echo "=== Deploying ==="
rsync -a --delete dist/ "$SERVER:/var/www/newsgap/"
rsync -a server/ "$SERVER:$REMOTE_DIR/server/"
ssh -t "$SERVER" "sudo systemctl restart newsgap"

echo ""
echo "✅ Done"
