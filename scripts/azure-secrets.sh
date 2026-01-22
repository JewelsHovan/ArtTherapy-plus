#!/bin/bash
#
# ArtTherapy+ Azure Secrets Configuration
#
# This script configures environment variables and secrets for the Container App.
# Secrets are stored securely in Azure Container Apps (not Key Vault for simplicity).
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - ./scripts/azure-setup.sh has been run
#
# Usage:
#   ./scripts/azure-secrets.sh
#
# Or with environment variables:
#   JWT_SECRET=xxx OPENAI_API_KEY=yyy ./scripts/azure-secrets.sh
#

set -euo pipefail

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
# Load Configuration
#==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.azure-config"

if [ -f "$CONFIG_FILE" ]; then
    log_info "Loading configuration from $CONFIG_FILE"
    source "$CONFIG_FILE"
else
    log_error "Configuration file not found: $CONFIG_FILE"
    log_info "Please run ./scripts/azure-setup.sh first."
    exit 1
fi

echo "=============================================="
echo "ArtTherapy+ Azure Secrets Configuration"
echo "=============================================="
echo ""
echo "Container App: $CONTAINER_APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

#==============================================================================
# Collect Secrets
#==============================================================================

# JWT_SECRET - Must match Cloudflare Worker for token compatibility!
if [ -z "${JWT_SECRET:-}" ]; then
    echo ""
    log_warn "JWT_SECRET must match your Cloudflare Worker secret for token compatibility!"
    log_info "You can retrieve it with: wrangler secret list"
    echo ""
    read -sp "Enter JWT_SECRET: " JWT_SECRET
    echo ""
fi

if [ -z "$JWT_SECRET" ]; then
    log_error "JWT_SECRET is required."
    exit 1
fi

# OPENAI_API_KEY
if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo ""
    read -sp "Enter OPENAI_API_KEY: " OPENAI_API_KEY
    echo ""
fi

if [ -z "$OPENAI_API_KEY" ]; then
    log_error "OPENAI_API_KEY is required."
    exit 1
fi

# SQL Admin Password (for DATABASE_URL)
if [ -z "${SQL_ADMIN_PASSWORD:-}" ]; then
    echo ""
    read -sp "Enter SQL Admin Password (used during azure-setup.sh): " SQL_ADMIN_PASSWORD
    echo ""
fi

if [ -z "$SQL_ADMIN_PASSWORD" ]; then
    log_error "SQL Admin Password is required."
    exit 1
fi

# Build connection strings
DATABASE_URL="mssql://${SQL_ADMIN_USER}:${SQL_ADMIN_PASSWORD}@${SQL_SERVER_FQDN}:1433/${SQL_DATABASE_NAME}?encrypt=true&trustServerCertificate=false"

STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

#==============================================================================
# Configure Container App Secrets
#==============================================================================
log_info "Configuring Container App secrets..."

# Azure Container Apps requires all secrets to be set at once
# We use the 'az containerapp secret set' command

az containerapp secret set \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --secrets \
        "jwt-secret=$JWT_SECRET" \
        "openai-api-key=$OPENAI_API_KEY" \
        "database-url=$DATABASE_URL" \
        "azure-storage-connection-string=$STORAGE_CONNECTION_STRING" \
    --output none

log_success "Secrets configured successfully."

#==============================================================================
# Configure Container App Environment Variables
#==============================================================================
log_info "Configuring Container App environment variables..."

az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
        "PORT=8787" \
        "NODE_ENV=production" \
        "JWT_SECRET=secretref:jwt-secret" \
        "OPENAI_API_KEY=secretref:openai-api-key" \
        "DATABASE_URL=secretref:database-url" \
        "AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string" \
        "AZURE_STORAGE_CONTAINER_NAME=$STORAGE_CONTAINER_NAME" \
        "AZURE_STORAGE_PUBLIC_URL=$STORAGE_PUBLIC_URL" \
        "MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a" \
    --output none

log_success "Environment variables configured successfully."

#==============================================================================
# Update Container Image (if available)
#==============================================================================
log_info "Checking for container image in ACR..."

IMAGE_TAG="latest"
FULL_IMAGE="${ACR_LOGIN_SERVER}/arttherapy-plus-api:${IMAGE_TAG}"

# Check if image exists in ACR
if az acr repository show --name "$ACR_NAME" --image "arttherapy-plus-api:$IMAGE_TAG" &>/dev/null; then
    log_info "Found image in ACR, updating Container App..."

    az containerapp update \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --image "$FULL_IMAGE" \
        --output none

    log_success "Container App updated with image: $FULL_IMAGE"
else
    log_warn "No image found in ACR. Push an image first:"
    log_info "  cd azure-backend && docker build -t $FULL_IMAGE . && docker push $FULL_IMAGE"
    log_info "  Or push via GitHub Actions workflow."
fi

#==============================================================================
# Summary
#==============================================================================
echo ""
echo "=============================================="
echo "SECRETS CONFIGURATION COMPLETE"
echo "=============================================="
echo ""
log_success "All secrets and environment variables have been configured."
echo ""
echo "Configured secrets (stored securely):"
echo "  - jwt-secret"
echo "  - openai-api-key"
echo "  - database-url"
echo "  - azure-storage-connection-string"
echo ""
echo "Configured environment variables:"
echo "  - PORT=8787"
echo "  - NODE_ENV=production"
echo "  - AZURE_STORAGE_CONTAINER_NAME=$STORAGE_CONTAINER_NAME"
echo "  - AZURE_STORAGE_PUBLIC_URL=$STORAGE_PUBLIC_URL"
echo "  - MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a"
echo ""
echo "Container App URL: https://$CONTAINER_APP_URL"
echo ""
echo "=============================================="
echo "NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Initialize the database schema:"
echo "   sqlcmd -S $SQL_SERVER_FQDN -d $SQL_DATABASE_NAME -U $SQL_ADMIN_USER -P '<password>' -i azure-backend/sql/001_init_schema.sql"
echo ""
echo "2. Export data from Cloudflare D1:"
echo "   ./scripts/export-d1-data.sh"
echo ""
echo "3. Import data to Azure SQL:"
echo "   ./scripts/import-azure-data.sh"
echo ""
echo "4. Deploy the container (via GitHub Actions or manually):"
echo "   git push origin main  # Triggers deploy-azure.yml workflow"
echo ""
echo "5. Verify the deployment:"
echo "   curl https://$CONTAINER_APP_URL/api/health"
echo ""
