#!/usr/bin/env bash
set -e

APP_DIR="$HOME/project/Unpredictable_game"

echo "=== Go to project ==="
cd "$APP_DIR"

echo "=== Pull latest code ==="
git pull

echo "=== Load Node ==="
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null

echo "=== Install dependencies ==="
npm install

echo "=== Build frontend ==="
npm run build

echo "=== Deploy frontend ==="
ssh okearey@newsgap.huma-num.fr 'sudo rsync -a --delete /home/okearey/Unpredictable_game/dist/ /var/www/newsgap/'

echo "=== Restart backend ==="
ssh okearey@newsgap.huma-num.fr 'sudo systemctl restart newsgap'

echo "=== Reload nginx ==="
ssh okearey@newsgap.huma-num.fr 'sudo systemctl reload nginx'

echo "✅ Deployment complete"
