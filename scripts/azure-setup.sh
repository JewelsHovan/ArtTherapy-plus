#!/bin/bash
#
# ArtTherapy+ Azure Infrastructure Setup
#
# This script creates all required Azure resources for the backend migration.
# It is idempotent - safe to run multiple times.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Sufficient Azure subscription permissions
#
# Usage:
#   ./scripts/azure-setup.sh
#
# After running this script:
#   1. Run ./scripts/azure-secrets.sh to configure secrets
#   2. Set up GitHub secrets for CI/CD (see output)
#   3. Run the GitHub Actions workflow to deploy
#

set -euo pipefail

#==============================================================================
# Configuration - Modify these values as needed
#==============================================================================
RESOURCE_GROUP="pain-plus-rg"
LOCATION="centralus"

# Azure Container Registry
ACR_NAME="arttherapyplusacr"  # Must be globally unique, lowercase alphanumeric

# Azure SQL Database
SQL_SERVER_NAME="painplus-sql-01"  # Must be globally unique
SQL_DATABASE_NAME="arttherapy-plus"
SQL_ADMIN_USER="arttherapyadmin"
# Password will be prompted or read from environment

# Azure Storage Account
STORAGE_ACCOUNT_NAME="arttherapyplusstore"  # Must be globally unique, lowercase alphanumeric
STORAGE_CONTAINER_NAME="images"

# Azure Container Apps
CONTAINER_APPS_ENV="arttherapy-plus-env"
CONTAINER_APP_NAME="arttherapy-plus-api"

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

check_resource_exists() {
    local resource_type=$1
    local name=$2
    local extra_args=${3:-}

    case $resource_type in
        "group")
            az group show --name "$name" &>/dev/null
            ;;
        "acr")
            az acr show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
        "sql-server")
            az sql server show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
        "sql-db")
            az sql db show --name "$name" --server "$extra_args" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
        "storage")
            az storage account show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
        "containerapp-env")
            az containerapp env show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
        "containerapp")
            az containerapp show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null
            ;;
    esac
}

#==============================================================================
# Main Script
#==============================================================================
echo "=============================================="
echo "ArtTherapy+ Azure Infrastructure Setup"
echo "=============================================="
echo ""

# Check Azure CLI is installed and logged in
if ! command -v az &>/dev/null; then
    log_error "Azure CLI is not installed. Please install it first."
    log_info "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &>/dev/null; then
    log_error "Not logged into Azure. Please run 'az login' first."
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
log_info "Using Azure subscription: $SUBSCRIPTION_NAME"
echo ""

#------------------------------------------------------------------------------
# 1. Create Resource Group
#------------------------------------------------------------------------------
log_info "Step 1/7: Creating Resource Group..."

if check_resource_exists "group" "$RESOURCE_GROUP"; then
    log_warn "Resource Group '$RESOURCE_GROUP' already exists, skipping."
else
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
    log_success "Resource Group '$RESOURCE_GROUP' created in '$LOCATION'."
fi

#------------------------------------------------------------------------------
# 2. Create Azure Container Registry (ACR)
#------------------------------------------------------------------------------
log_info "Step 2/7: Creating Azure Container Registry..."

if check_resource_exists "acr" "$ACR_NAME"; then
    log_warn "Container Registry '$ACR_NAME' already exists, skipping."
else
    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --sku Basic \
        --admin-enabled true \
        --output none
    log_success "Container Registry '$ACR_NAME' created."
fi

# Get ACR credentials
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" -o tsv)

#------------------------------------------------------------------------------
# 3. Create Azure SQL Server and Database
#------------------------------------------------------------------------------
log_info "Step 3/7: Creating Azure SQL Server and Database..."

if check_resource_exists "sql-server" "$SQL_SERVER_NAME"; then
    log_warn "SQL Server '$SQL_SERVER_NAME' already exists, skipping."
else
    # Only prompt for password if we need to create the server
    if [ -z "${SQL_ADMIN_PASSWORD:-}" ]; then
        echo ""
        log_info "Enter a password for the SQL admin user '$SQL_ADMIN_USER'."
        log_info "Requirements: 8+ chars, uppercase, lowercase, number, special char."
        read -sp "SQL Admin Password: " SQL_ADMIN_PASSWORD
        echo ""
    fi

    az sql server create \
        --name "$SQL_SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --admin-user "$SQL_ADMIN_USER" \
        --admin-password "$SQL_ADMIN_PASSWORD" \
        --output none
    log_success "SQL Server '$SQL_SERVER_NAME' created."
fi

# Create firewall rule to allow Azure services
log_info "Configuring SQL Server firewall rules..."
az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SQL_SERVER_NAME" \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none 2>/dev/null || true

# Create the database (Serverless tier for cost efficiency)
if check_resource_exists "sql-db" "$SQL_DATABASE_NAME" "$SQL_SERVER_NAME"; then
    log_warn "SQL Database '$SQL_DATABASE_NAME' already exists, skipping."
else
    az sql db create \
        --name "$SQL_DATABASE_NAME" \
        --server "$SQL_SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --edition GeneralPurpose \
        --family Gen5 \
        --capacity 1 \
        --compute-model Serverless \
        --auto-pause-delay 60 \
        --min-capacity 0.5 \
        --output none
    log_success "SQL Database '$SQL_DATABASE_NAME' created (Serverless tier)."
fi

# Build server FQDN for config
SQL_SERVER_FQDN="${SQL_SERVER_NAME}.database.windows.net"

#------------------------------------------------------------------------------
# 4. Create Azure Storage Account and Blob Container
#------------------------------------------------------------------------------
log_info "Step 4/7: Creating Azure Storage Account..."

if check_resource_exists "storage" "$STORAGE_ACCOUNT_NAME"; then
    log_warn "Storage Account '$STORAGE_ACCOUNT_NAME' already exists, skipping."
else
    az storage account create \
        --name "$STORAGE_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --allow-blob-public-access true \
        --output none
    log_success "Storage Account '$STORAGE_ACCOUNT_NAME' created."
fi

# Get storage connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

# Create blob container with public access for images
log_info "Creating blob container '$STORAGE_CONTAINER_NAME'..."
az storage container create \
    --name "$STORAGE_CONTAINER_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --public-access blob \
    --output none 2>/dev/null || true
log_success "Blob container '$STORAGE_CONTAINER_NAME' configured with public blob access."

STORAGE_PUBLIC_URL="https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${STORAGE_CONTAINER_NAME}"

#------------------------------------------------------------------------------
# 5. Create Container Apps Environment
#------------------------------------------------------------------------------
log_info "Step 5/7: Creating Container Apps Environment..."

if check_resource_exists "containerapp-env" "$CONTAINER_APPS_ENV"; then
    log_warn "Container Apps Environment '$CONTAINER_APPS_ENV' already exists, skipping."
else
    az containerapp env create \
        --name "$CONTAINER_APPS_ENV" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
    log_success "Container Apps Environment '$CONTAINER_APPS_ENV' created."
fi

#------------------------------------------------------------------------------
# 6. Create Container App (placeholder image)
#------------------------------------------------------------------------------
log_info "Step 6/7: Creating Container App..."

if check_resource_exists "containerapp" "$CONTAINER_APP_NAME"; then
    log_warn "Container App '$CONTAINER_APP_NAME' already exists, skipping."
else
    # Create with a placeholder image - the actual image will be deployed via CI/CD
    az containerapp create \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$CONTAINER_APPS_ENV" \
        --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
        --target-port 8787 \
        --ingress external \
        --cpu 0.25 \
        --memory 0.5Gi \
        --min-replicas 0 \
        --max-replicas 3 \
        --output none
    log_success "Container App '$CONTAINER_APP_NAME' created."
fi

# Configure registry credentials for the container app
log_info "Configuring ACR credentials for Container App..."
az containerapp registry set \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --server "$ACR_LOGIN_SERVER" \
    --username "$ACR_USERNAME" \
    --password "$ACR_PASSWORD" \
    --output none

# Get the container app URL
CONTAINER_APP_URL=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

#------------------------------------------------------------------------------
# 7. Create Service Principal for GitHub Actions
#------------------------------------------------------------------------------
log_info "Step 7/7: Creating Service Principal for CI/CD..."

SP_NAME="arttherapy-plus-github-actions"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Check if service principal exists
if az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null | grep -q .; then
    log_warn "Service Principal '$SP_NAME' already exists."
    SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv)
    log_info "To regenerate credentials, delete the SP and run this script again."
else
    # Create new service principal with Contributor role on the resource group
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role Contributor \
        --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
        --sdk-auth)
    AZURE_CREDENTIALS="$SP_OUTPUT"
fi

#==============================================================================
# Output Summary
#==============================================================================
echo ""
echo "=============================================="
echo "SETUP COMPLETE"
echo "=============================================="
echo ""
log_success "All Azure resources have been created successfully!"
echo ""
echo "Resource Summary:"
echo "  Resource Group:      $RESOURCE_GROUP"
echo "  Location:            $LOCATION"
echo "  ACR Login Server:    $ACR_LOGIN_SERVER"
echo "  SQL Server:          $SQL_SERVER_FQDN"
echo "  SQL Database:        $SQL_DATABASE_NAME"
echo "  Storage Account:     $STORAGE_ACCOUNT_NAME"
echo "  Blob Container:      $STORAGE_CONTAINER_NAME"
echo "  Container App URL:   https://$CONTAINER_APP_URL"
echo ""
echo "=============================================="
echo "NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Run the secrets configuration script:"
echo "   ./scripts/azure-secrets.sh"
echo ""
echo "2. Configure GitHub Secrets (Settings > Secrets > Actions):"
echo ""
echo "   AZURE_RESOURCE_GROUP=$RESOURCE_GROUP"
echo "   AZURE_CONTAINER_APP_NAME=$CONTAINER_APP_NAME"
echo "   ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "   ACR_USERNAME=$ACR_USERNAME"
echo "   ACR_PASSWORD=$ACR_PASSWORD"
echo ""
if [ -n "${AZURE_CREDENTIALS:-}" ]; then
    echo "   AZURE_CREDENTIALS (paste as JSON):"
    echo "   $AZURE_CREDENTIALS"
fi
echo ""
echo "3. Initialize the database schema:"
echo "   sqlcmd -S $SQL_SERVER_FQDN -d $SQL_DATABASE_NAME -U $SQL_ADMIN_USER -P '<password>' -i azure-backend/sql/001_init_schema.sql"
echo ""
echo "4. Export data from Cloudflare D1:"
echo "   ./scripts/export-d1-data.sh"
echo ""
echo "5. Import data to Azure SQL:"
echo "   ./scripts/import-azure-data.sh"
echo ""
echo "=============================================="

# Save configuration for other scripts
CONFIG_FILE="$(dirname "$0")/.azure-config"
cat > "$CONFIG_FILE" << EOF
# Azure configuration - generated by azure-setup.sh
# Do not commit this file!
RESOURCE_GROUP=$RESOURCE_GROUP
LOCATION=$LOCATION
ACR_NAME=$ACR_NAME
ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER
SQL_SERVER_NAME=$SQL_SERVER_NAME
SQL_SERVER_FQDN=$SQL_SERVER_FQDN
SQL_DATABASE_NAME=$SQL_DATABASE_NAME
SQL_ADMIN_USER=$SQL_ADMIN_USER
STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME
STORAGE_CONTAINER_NAME=$STORAGE_CONTAINER_NAME
STORAGE_PUBLIC_URL=$STORAGE_PUBLIC_URL
CONTAINER_APPS_ENV=$CONTAINER_APPS_ENV
CONTAINER_APP_NAME=$CONTAINER_APP_NAME
CONTAINER_APP_URL=$CONTAINER_APP_URL
EOF

log_info "Configuration saved to $CONFIG_FILE"
