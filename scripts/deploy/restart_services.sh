#!/bin/bash

# Simple script to restart production services with password prompt

DEPLOY_USER="${DEPLOY_USER:-okearey}"
HOST="$DEPLOY_USER@newsgap.huma-num.fr"

echo "Connecting to production server to restart services..."
echo "You will be prompted for SSH password below."
echo ""

ssh -t "$HOST" "sudo systemctl restart newsgap && sudo systemctl reload nginx"

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Services restarted successfully!"
else
  echo ""
  echo "✗ Failed to restart services. Check error above."
  exit 1
fi
