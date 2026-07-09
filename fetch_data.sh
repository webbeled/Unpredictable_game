#!/usr/bin/env bash
set -e

SERVER="okearey@newsgap.huma-num.fr"
REMOTE_DIR="/home/okearey/Unpredictable_game"
LOCAL_DIR="$(dirname "$0")/data_exports"
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
