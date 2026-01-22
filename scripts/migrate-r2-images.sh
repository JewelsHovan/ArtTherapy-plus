#!/bin/bash
#
# ArtTherapy+ R2 to Azure Blob Storage Image Migration
#
# This script downloads images from Cloudflare R2 (via public URL) and
# uploads them to Azure Blob Storage, then updates the database URLs.
#
# Prerequisites:
#   - Azure CLI installed and logged in
#   - Data exported via ./scripts/export-d1-data.sh
#   - curl and jq installed
#
# Usage:
#   ./scripts/migrate-r2-images.sh
#

set -euo pipefail

#==============================================================================
# Configuration
#==============================================================================
R2_PUBLIC_URL="https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev"
EXPORT_DIR="exports"
IMAGES_DIR="exports/images"

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
echo "ArtTherapy+ R2 to Azure Blob Migration"
echo "=============================================="
echo ""

#==============================================================================
# Verify Prerequisites
#==============================================================================

# Check for exported data
if [ ! -f "$EXPORT_DIR/gallery_items_data.json" ]; then
    log_error "Export data not found. Run ./scripts/export-d1-data.sh first."
    exit 1
fi

# Check for Azure CLI
if ! command -v az &>/dev/null; then
    log_error "Azure CLI not found."
    exit 1
fi

# Check for curl and jq
if ! command -v curl &>/dev/null || ! command -v jq &>/dev/null; then
    log_error "curl and jq are required."
    exit 1
fi

# Create images directory
mkdir -p "$IMAGES_DIR"

#==============================================================================
# Extract Image URLs from Gallery Items
#==============================================================================
log_info "Extracting image URLs from gallery items..."

# Get unique image URLs
IMAGE_URLS=$(jq -r '.[].image_url' "$EXPORT_DIR/gallery_items_data.json" 2>/dev/null | sort -u)
TOTAL_IMAGES=$(echo "$IMAGE_URLS" | wc -l | tr -d ' ')

log_info "Found $TOTAL_IMAGES unique images to migrate."
echo ""

#==============================================================================
# Download Images from R2
#==============================================================================
log_info "Downloading images from R2..."

DOWNLOADED=0
FAILED=0

while IFS= read -r url; do
    if [ -z "$url" ] || [ "$url" == "null" ]; then
        continue
    fi

    # Extract the path from the URL (everything after the domain)
    # URL format: https://pub-xxx.r2.dev/gallery/userId/timestamp-uuid.png
    IMAGE_PATH=$(echo "$url" | sed "s|$R2_PUBLIC_URL/||")
    LOCAL_FILE="$IMAGES_DIR/$IMAGE_PATH"
    LOCAL_DIR=$(dirname "$LOCAL_FILE")

    # Skip if already downloaded
    if [ -f "$LOCAL_FILE" ]; then
        log_info "Already exists: $IMAGE_PATH"
        ((DOWNLOADED++))
        continue
    fi

    # Create directory structure
    mkdir -p "$LOCAL_DIR"

    # Download the image
    if curl -sf "$url" -o "$LOCAL_FILE" 2>/dev/null; then
        log_success "Downloaded: $IMAGE_PATH"
        ((DOWNLOADED++))
    else
        log_warn "Failed to download: $url"
        ((FAILED++))
    fi
done <<< "$IMAGE_URLS"

echo ""
log_info "Download complete: $DOWNLOADED succeeded, $FAILED failed"
echo ""

#==============================================================================
# Upload Images to Azure Blob Storage
#==============================================================================
log_info "Uploading images to Azure Blob Storage..."

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[0].value" -o tsv)

UPLOADED=0
UPLOAD_FAILED=0

# Find all downloaded images
while IFS= read -r local_file; do
    if [ -z "$local_file" ]; then
        continue
    fi

    # Get the blob name (relative path from images directory)
    BLOB_NAME=$(echo "$local_file" | sed "s|$IMAGES_DIR/||")

    # Upload to Azure Blob Storage
    if az storage blob upload \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_KEY" \
        --container-name "$STORAGE_CONTAINER_NAME" \
        --name "$BLOB_NAME" \
        --file "$local_file" \
        --overwrite \
        --output none 2>/dev/null; then
        log_success "Uploaded: $BLOB_NAME"
        ((UPLOADED++))
    else
        log_warn "Failed to upload: $BLOB_NAME"
        ((UPLOAD_FAILED++))
    fi
done < <(find "$IMAGES_DIR" -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" 2>/dev/null)

echo ""
log_info "Upload complete: $UPLOADED succeeded, $UPLOAD_FAILED failed"

#==============================================================================
# Generate URL Update SQL
#==============================================================================
log_info "Generating URL update SQL..."

UPDATE_SQL="$EXPORT_DIR/sql/update_image_urls.sql"
mkdir -p "$(dirname "$UPDATE_SQL")"

cat > "$UPDATE_SQL" << EOF
-- Update gallery_items image URLs from R2 to Azure Blob Storage
-- Generated by migrate-r2-images.sh

SET NOCOUNT ON;
BEGIN TRANSACTION;

PRINT 'Updating image URLs from R2 to Azure Blob Storage...';

UPDATE gallery_items
SET image_url = REPLACE(image_url, '$R2_PUBLIC_URL', '$STORAGE_PUBLIC_URL')
WHERE image_url LIKE '$R2_PUBLIC_URL%';

DECLARE @RowsAffected INT = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@RowsAffected AS NVARCHAR(10)) + ' image URLs.';

COMMIT TRANSACTION;
EOF

log_success "Generated $UPDATE_SQL"

#==============================================================================
# Summary
#==============================================================================
echo ""
echo "=============================================="
echo "MIGRATION COMPLETE"
echo "=============================================="
echo ""
log_success "Image migration completed!"
echo ""
echo "Summary:"
echo "  Downloaded from R2: $DOWNLOADED"
echo "  Uploaded to Azure:  $UPLOADED"
echo "  Download failures:  $FAILED"
echo "  Upload failures:    $UPLOAD_FAILED"
echo ""
echo "New image URL prefix: $STORAGE_PUBLIC_URL"
echo ""
echo "=============================================="
echo "NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Update the image URLs in Azure SQL:"
echo "   sqlcmd -S <server> -d <database> -U <user> -P <pass> -i $UPDATE_SQL"
echo ""
echo "2. Verify images are accessible:"
echo "   curl -I ${STORAGE_PUBLIC_URL}/gallery/<some-image>.png"
echo ""
echo "3. Test the application with the new image URLs."
echo ""
