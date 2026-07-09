#!/usr/bin/env bash
set -e

SERVER="okearey@newsgap.huma-num.fr"
REMOTE_DIR="/home/okearey/Unpredictable_game"
LOCAL_DIR="$HOME/Desktop/Newsgap_data"

mkdir -p "$LOCAL_DIR"
rm -f "$LOCAL_DIR"/*_export_*.csv

echo "=== Running export on server ==="
ssh "$SERVER" "cd $REMOTE_DIR && node export_data.js"

echo "=== Downloading CSVs ==="
scp "$SERVER:$REMOTE_DIR/*_export_*.csv" "$LOCAL_DIR/"

echo ""
echo "✅ Done — files saved to $LOCAL_DIR/"
ls "$LOCAL_DIR/"
