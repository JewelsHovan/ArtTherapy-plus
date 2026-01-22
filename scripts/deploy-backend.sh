#!/bin/bash
#
# ArtTherapy+ Backend Deployment
#
# Deploys the backend container to Azure Container Apps.
#
# Prerequisites:
#   - Azure CLI installed and logged in
#   - scripts/.azure-config configured (run azure-setup.sh first)
#   - Container image built and pushed (run build-container.sh)
#
# Usage:
#   ./scripts/deploy-backend.sh [--build] [--tag <tag>]
#
# Examples:
#   ./scripts/deploy-backend.sh                 # Deploy latest
#   ./scripts/deploy-backend.sh --tag v1.0.0    # Deploy specific tag
#   ./scripts/deploy-backend.sh --build         # Build and deploy
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

usage() {
    echo "Usage: $0 [--build] [--tag <tag>]"
    echo ""
    echo "Options:"
    echo "  --build        Build container before deploying"
    echo "  --tag <tag>    Image tag to deploy (default: latest)"
    echo "  -h, --help     Show this help message"
    exit 0
}

#==============================================================================
# Parse Arguments
#==============================================================================
BUILD=false
TAG="latest"

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

#==============================================================================
# Load Configuration
#==============================================================================
echo "=============================================="
echo "ArtTherapy+ Backend Deployment"
echo "=============================================="
echo ""

CONFIG_FILE="$SCRIPT_DIR/.azure-config"
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Azure config not found: $CONFIG_FILE"
    log_error "Run ./scripts/azure-setup.sh first to create Azure resources."
    exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"
log_success "Loaded configuration from .azure-config"

#==============================================================================
# Prerequisites Check
#==============================================================================
log_info "Checking prerequisites..."

# Check Azure CLI
if ! command -v az &>/dev/null; then
    log_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &>/dev/null; then
    log_error "Not logged into Azure. Please run 'az login' first."
    exit 1
fi
log_success "Azure CLI is authenticated."

#==============================================================================
# Build Container (if requested)
#==============================================================================
if [ "$BUILD" = true ]; then
    echo ""
    log_info "Building container first..."
    "$SCRIPT_DIR/build-container.sh" --tag "$TAG"
    echo ""
fi

#==============================================================================
# Deploy to Container Apps
#==============================================================================
IMAGE="$ACR_LOGIN_SERVER/arttherapy-plus-api:$TAG"

echo ""
log_info "Deploying to Azure Container Apps..."
log_info "  Resource Group: $RESOURCE_GROUP"
log_info "  Container App:  $CONTAINER_APP_NAME"
log_info "  Image:          $IMAGE"

az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE" \
    --output none

log_success "Container App updated."

#==============================================================================
# Verify Deployment
#==============================================================================
echo ""
log_info "Verifying deployment health..."

# Get the container app URL
APP_URL="https://$CONTAINER_APP_URL"
HEALTH_URL="$APP_URL/api/health"

# Wait for deployment to stabilize
sleep 5

# Check health endpoint (with retries)
MAX_RETRIES=6
RETRY_DELAY=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log_info "Checking health endpoint (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."

    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Health check passed! (HTTP $HTTP_STATUS)"
        break
    else
        log_warn "Health check returned HTTP $HTTP_STATUS"
        RETRY_COUNT=$((RETRY_COUNT + 1))

        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_info "Waiting ${RETRY_DELAY}s before retry..."
            sleep $RETRY_DELAY
        fi
    fi
done

if [ "$HTTP_STATUS" != "200" ]; then
    log_warn "Health check did not pass after $MAX_RETRIES attempts."
    log_warn "The deployment may still be in progress or there may be an issue."
    log_warn "Check the Azure portal for more details."
fi

#==============================================================================
# Output Summary
#==============================================================================
echo ""
echo "=============================================="
log_success "Backend Deployment Complete!"
echo "=============================================="
echo ""
echo "Deployment Summary:"
echo "  Container App: $CONTAINER_APP_NAME"
echo "  Image:         $IMAGE"
echo "  URL:           $APP_URL"
echo "  Health:        $HEALTH_URL"
echo ""
echo "API Base URL (for frontend):"
echo "  $APP_URL/api"
echo ""
