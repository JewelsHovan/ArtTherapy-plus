#!/bin/bash
#
# ArtTherapy+ Container Build and Push
#
# Builds the backend Docker image and pushes to Azure Container Registry.
#
# Prerequisites:
#   - Docker running
#   - Azure CLI installed and logged in
#   - scripts/.azure-config configured (run azure-setup.sh first)
#
# Usage:
#   ./scripts/build-container.sh [--tag <tag>]
#
# Examples:
#   ./scripts/build-container.sh              # Uses git commit SHA
#   ./scripts/build-container.sh --tag v1.0.0 # Uses custom tag
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
    echo "Usage: $0 [--tag <tag>]"
    echo ""
    echo "Options:"
    echo "  --tag <tag>    Docker image tag (default: git commit SHA)"
    echo "  -h, --help     Show this help message"
    exit 0
}

#==============================================================================
# Parse Arguments
#==============================================================================
TAG=""

while [[ $# -gt 0 ]]; do
    case $1 in
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
echo "ArtTherapy+ Container Build"
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

# Check Docker
if ! command -v docker &>/dev/null; then
    log_error "Docker is not installed. Please install Docker."
    exit 1
fi

if ! docker info &>/dev/null; then
    log_error "Docker is not running. Please start Docker."
    exit 1
fi
log_success "Docker is running."

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
# Determine Tag
#==============================================================================
if [ -z "$TAG" ]; then
    # Use git commit SHA as default tag
    cd "$PROJECT_ROOT"
    if git rev-parse --git-dir &>/dev/null; then
        TAG=$(git rev-parse --short HEAD)
        log_info "Using git commit SHA as tag: $TAG"
    else
        TAG="latest"
        log_warn "Not in a git repository. Using 'latest' as tag."
    fi
fi

IMAGE_NAME="$ACR_LOGIN_SERVER/arttherapy-plus-api"
IMAGE_TAG="$IMAGE_NAME:$TAG"
IMAGE_LATEST="$IMAGE_NAME:latest"

#==============================================================================
# Login to ACR
#==============================================================================
log_info "Logging into Azure Container Registry..."
az acr login --name "$ACR_NAME" --output none
log_success "Logged into $ACR_LOGIN_SERVER"

#==============================================================================
# Build Image
#==============================================================================
echo ""
log_info "Building Docker image..."
log_info "  Context: $PROJECT_ROOT/azure-backend"
log_info "  Tag: $IMAGE_TAG"

cd "$PROJECT_ROOT"
docker build \
    -t "$IMAGE_TAG" \
    -t "$IMAGE_LATEST" \
    ./azure-backend

log_success "Docker image built successfully."

#==============================================================================
# Push Image
#==============================================================================
echo ""
log_info "Pushing images to Azure Container Registry..."

log_info "Pushing $IMAGE_TAG..."
docker push "$IMAGE_TAG"

log_info "Pushing $IMAGE_LATEST..."
docker push "$IMAGE_LATEST"

log_success "Images pushed successfully."

#==============================================================================
# Output Summary
#==============================================================================
echo ""
echo "=============================================="
log_success "Container Build Complete!"
echo "=============================================="
echo ""
echo "Images pushed to ACR:"
echo "  - $IMAGE_TAG"
echo "  - $IMAGE_LATEST"
echo ""
echo "To deploy this image, run:"
echo "  ./scripts/deploy-backend.sh --tag $TAG"
echo ""
