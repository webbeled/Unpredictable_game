#!/usr/bin/env bash
set -e

REMOTE_HOST="okearey@newsgap.huma-num.fr"

ssh -t "$REMOTE_HOST" <<'EOF'
set -e

APP_DIR="$HOME/Unpredictable_game"

echo "=== Go to project ==="
cd "$APP_DIR"

echo "=== Pull latest code ==="
git fetch origin
git reset --hard origin/main

echo "=== Load Node ==="
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null

echo "=== Install dependencies ==="
npm install

echo "=== Build frontend ==="
npm run build

echo "=== Deploy frontend ==="
sudo rsync -a --delete dist/ /var/www/newsgap/

echo "=== Restart backend ==="
sudo systemctl restart newsgap

echo "=== Reload nginx ==="
sudo systemctl reload nginx

echo "✅ Deployment complete"
EOF
