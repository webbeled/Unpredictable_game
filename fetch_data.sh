#!/usr/bin/env bash
set -e

DEPLOY_USER="${DEPLOY_USER:-okearey}"
SERVER="$DEPLOY_USER@newsgap.huma-num.fr"
REMOTE_DIR="/home/$DEPLOY_USER/Unpredictable_game"
if [ "$DEPLOY_USER" = "okearey" ]; then
  LOCAL_DIR="/home/owenk/Desktop/Newsgap_data"
else
  LOCAL_DIR="$(dirname "$0")/data_exports"
fi
mkdir -p "$LOCAL_DIR"

echo "=== Running export on server ==="
OUTPUT=$(ssh "$SERVER" "cd $REMOTE_DIR && node export_data.js")
echo "$OUTPUT"

TIMESTAMP=$(echo "$OUTPUT" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}' | head -1)

echo "=== Downloading CSVs ==="
scp "$SERVER:$REMOTE_DIR/users_export_${TIMESTAMP}.csv" \
    "$SERVER:$REMOTE_DIR/guesses_export_${TIMESTAMP}.csv" \
    "$SERVER:$REMOTE_DIR/feedback_export_${TIMESTAMP}.csv" \
    "$LOCAL_DIR/"

echo ""
echo "✅ Done — files saved to $LOCAL_DIR/"
ls "$LOCAL_DIR/"*_export_*.csv
