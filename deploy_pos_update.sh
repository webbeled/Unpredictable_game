#!/bin/bash
set -e

echo "🚀 Deploy POS Data Restructuring Update"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}\n"

# 2. Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# 3. Add database columns
echo -e "${YELLOW}🗄️  Adding database columns...${NC}"
node --input-type=module - <<'EOF'
import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

try {
  await pool.query(`
    ALTER TABLE quiz_sessions
    ADD COLUMN IF NOT EXISTS adj_guesses TEXT,
    ADD COLUMN IF NOT EXISTS func_guesses TEXT,
    ADD COLUMN IF NOT EXISTS noun_guesses TEXT,
    ADD COLUMN IF NOT EXISTS num_guesses TEXT,
    ADD COLUMN IF NOT EXISTS propn_guesses TEXT,
    ADD COLUMN IF NOT EXISTS verb_guesses TEXT
  `)
  console.log('✅ All columns added to quiz_sessions')
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}

await pool.end()
EOF

echo -e "${GREEN}✅ Database updated${NC}\n"

# 4. Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}\n"

# 5. Restart server - check which method is used
echo -e "${YELLOW}🔄 Restarting server...${NC}"

if pgrep -f "tsx server/index.ts" > /dev/null; then
    echo "Stopping tsx server..."
    pkill -f "tsx server/index.ts" || true
    sleep 2
    echo "Starting new server..."
    # Adjust this line based on how you normally start the server
    # nohup tsx watch server/index.ts > server.log 2>&1 &
    echo -e "${YELLOW}⚠️  Please restart your backend manually or uncomment the start command in the script${NC}"
elif command -v pm2 &> /dev/null; then
    pm2 restart all
    echo -e "${GREEN}✅ Restarted with PM2${NC}"
else
    echo -e "${YELLOW}⚠️  Could not detect server method. Please restart manually.${NC}"
fi

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📊 What Changed:"
echo "  ✓ New columns added: adj_guesses, noun_guesses, verb_guesses, etc."
echo "  ✓ Frontend now tracks all guesses per POS"
echo "  ✓ Backend saves scores before each correct guess"
echo ""
echo "🎮 Test It:"
echo "  1. Play a new game on the server"
echo "  2. Run: node scripts/export_to_excel.js"
echo "  3. Check quiz_sessions_export.xlsx for your data"
echo ""
echo "⏮️  Need to rollback?"
echo "  git revert HEAD && git push origin main && [restart]"
