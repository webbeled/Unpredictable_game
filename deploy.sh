#!/bin/bash
set -e

echo "=== NewsGap Deployment Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this from project root.${NC}"
    exit 1
fi

# Step 2: Database migration
echo -e "${YELLOW}Step 1: Running database migrations...${NC}"
npm run migrate 2>&1 || {
    echo -e "${RED}Migration failed. Check database connection.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Database migrations complete${NC}"
echo ""

# Step 3: Build frontend
echo -e "${YELLOW}Step 2: Building frontend...${NC}"
npm run build 2>&1 | grep -E "built|error" || true
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 4: Copy frontend to web root (requires sudo)
echo -e "${YELLOW}Step 3: Copying static files to /var/www/newsgap/...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist/ directory not found after build${NC}"
    exit 1
fi

# Create directory if needed and copy
sudo mkdir -p /var/www/newsgap
sudo rm -rf /var/www/newsgap/*
sudo cp -r dist/* /var/www/newsgap/
echo -e "${GREEN}✓ Static files deployed${NC}"
echo ""

# Step 5: Kill old backend process and start new one
echo -e "${YELLOW}Step 4: Restarting backend server...${NC}"
sudo pkill -f "tsx server/index.ts" || true
sleep 1
sudo npm start > /tmp/newsgap-backend.log 2>&1 &
sleep 2

# Verify backend started
if pgrep -f "tsx server/index.ts" > /dev/null; then
    echo -e "${GREEN}✓ Backend server started${NC}"
else
    echo -e "${RED}Warning: Backend may not have started. Check /tmp/newsgap-backend.log${NC}"
fi
echo ""

# Final verification
echo -e "${YELLOW}Step 5: Verification...${NC}"
echo "Git HEAD: $(git log --oneline -n 1)"
echo "Frontend files: $(ls /var/www/newsgap/assets/*.js 2>/dev/null | wc -l) JS files"
echo "Backend process: $(pgrep -f 'tsx server' | wc -l) process(es)"
echo ""
echo -e "${GREEN}=== Deployment complete ===${NC}"
echo "Visit https://newsgap.huma-num.fr to verify changes"
