#!/bin/bash

echo "🚀 Starting deployment..."

# Push to GitHub
cd /home/owenk/project/Unpredictable_game
git add -A
git commit -m "Update UI: average score, game number x-axis" || true
git push origin main

echo "📤 Pushed to GitHub, deploying to server..."

# Deploy to server
ssh okearey@newsgap.huma-num.fr 'cd /home/okearey/Unpredictable_game && git pull origin main && npm run build && pkill -f "npx tsx server" || true && sleep 2 && nohup npx tsx server/index.ts > server.log 2>&1 &'

echo "✅ Deployment complete!"
