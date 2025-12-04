#!/bin/bash

# Test Production Build Script
# This script tests if the production build works correctly before deploying

set -e  # Exit on error

echo "🧪 Testing Production Build"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node_modules exist
echo "📦 Checking dependencies..."
if [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm run install:all
fi

# Build client
echo ""
echo "🏗️  Building React frontend..."
cd client
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Client build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Client build successful${NC}"
cd ..

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
cd server
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
cd ..

# Check if .env exists
echo ""
echo "🔍 Checking environment variables..."
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: server/.env not found${NC}"
    echo "   Copy server/.env.example to server/.env and configure it"
    echo ""
fi

# Instructions
echo ""
echo "================================"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "To test the production build locally:"
echo ""
echo "  1. Make sure your .env file is configured:"
echo "     cd server && cp .env.example .env"
echo "     # Edit .env with your settings"
echo ""
echo "  2. Start the server:"
echo "     cd server"
echo "     NODE_ENV=production npm start"
echo ""
echo "  3. Open http://localhost:3001 in your browser"
echo ""
echo "The server will serve both the API and the React app!"
echo ""
