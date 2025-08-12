#!/bin/bash

# Art Therapy Plus - Cloudflare Deployment Script

echo "🚀 Starting Art Therapy Plus deployment to Cloudflare..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo -e "${YELLOW}📝 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Cloudflare:${NC}"
    wrangler login
fi

# Deploy Backend (Worker)
echo -e "\n${GREEN}🔧 Deploying Backend to Cloudflare Workers...${NC}"
cd cloudflare-worker

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Deploy the worker
wrangler deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    WORKER_URL=$(wrangler deployments list | grep -oE 'https://[^ ]+workers.dev' | head -1)
    echo -e "Worker URL: ${GREEN}$WORKER_URL${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Deploy Frontend (Pages)
echo -e "\n${GREEN}🎨 Deploying Frontend to Cloudflare Pages...${NC}"
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully!${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Deploy to Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=arttherapy-plus

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "Pages URL: ${GREEN}https://arttherapy-plus.pages.dev${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "\nYour application is now live at:"
echo -e "Frontend: ${GREEN}https://arttherapy-plus.pages.dev${NC}"
echo -e "Backend API: ${GREEN}$WORKER_URL${NC}"
echo -e "\n${YELLOW}⚠️  Remember to:${NC}"
echo "1. Set your OPENAI_API_KEY secret in the Worker settings"
echo "2. Update the API URL in frontend if needed"
echo "3. Configure custom domains if desired"