#!/bin/bash
#
# ArtTherapy+ Frontend Deployment
#
# Builds and deploys the React frontend to Azure Static Web Apps.
#
# Prerequisites:
#   - Node.js installed
#   - Azure Static Web Apps deployment token
#     (set AZURE_STATIC_WEB_APPS_API_TOKEN env var or be prompted)
#
# Usage:
#   ./scripts/deploy-frontend.sh
#
# Environment:
#   AZURE_STATIC_WEB_APPS_API_TOKEN - Deployment token (optional, will prompt)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

#==============================================================================
# Helper Functions
#==============================================================================
log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warn() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

#==============================================================================
# Prerequisites Check
#==============================================================================
echo "=============================================="
echo "ArtTherapy+ Frontend Deployment"
echo "=============================================="
echo ""

log_info "Checking prerequisites..."

# Check npm
if ! command -v npm &>/dev/null; then
    log_error "npm is not installed. Please install Node.js."
    exit 1
fi
log_success "npm is available."

# Check deployment token
if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    log_warn "AZURE_STATIC_WEB_APPS_API_TOKEN not set."
    echo ""
    echo "You can find the deployment token in the Azure Portal:"
    echo "  1. Go to your Static Web App resource"
    echo "  2. Click 'Manage deployment token'"
    echo "  3. Copy the token"
    echo ""
    read -sp "Enter deployment token: " AZURE_STATIC_WEB_APPS_API_TOKEN
    echo ""
    export AZURE_STATIC_WEB_APPS_API_TOKEN
fi

if [ -z "$AZURE_STATIC_WEB_APPS_API_TOKEN" ]; then
    log_error "Deployment token is required."
    exit 1
fi

log_success "Deployment token configured."

#==============================================================================
# Build Frontend
#==============================================================================
echo ""
log_info "Building frontend..."

cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# Run lint first
log_info "Running lint checks..."
npm run lint

# Build the production bundle
log_info "Creating production build..."
npm run build

if [ ! -d "dist" ]; then
    log_error "Build failed - dist directory not created."
    exit 1
fi

log_success "Frontend built successfully."

#==============================================================================
# Deploy to Azure Static Web Apps
#==============================================================================
echo ""
log_info "Deploying to Azure Static Web Apps..."

# Use the SWA CLI to deploy
npx @azure/static-web-apps-cli deploy ./dist \
    --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
    --env production

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -ne 0 ]; then
    log_error "Deployment failed."
    exit 1
fi

#==============================================================================
# Output Summary
#==============================================================================
echo ""
echo "=============================================="
log_success "Frontend Deployment Complete!"
echo "=============================================="
echo ""
echo "Your frontend has been deployed to Azure Static Web Apps."
echo ""
echo "Production URL:"
echo "  https://witty-glacier-01b4b7710.5.azurestaticapps.net"
echo ""
echo "Note: It may take a few minutes for the deployment to propagate."
echo ""
