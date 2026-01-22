#!/bin/bash
#
# ArtTherapy+ Cloudflare D1 Data Export
#
# This script exports all data from Cloudflare D1 database to JSON files
# for migration to Azure SQL.
#
# Prerequisites:
#   - Wrangler CLI installed (npm install -g wrangler)
#   - Wrangler authenticated (wrangler login)
#   - Access to the arttherapy-plus-db D1 database
#
# Usage:
#   ./scripts/export-d1-data.sh
#
# Output:
#   exports/
#     users.json
#     gallery_items.json
#     journal_entries.json
#     export_metadata.json
#

set -euo pipefail

#==============================================================================
# Configuration
#==============================================================================
D1_DATABASE_NAME="arttherapy-plus-db"
EXPORT_DIR="exports"

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

export_table() {
    local table_name=$1
    local output_file="$EXPORT_DIR/${table_name}.json"

    log_info "Exporting table '$table_name'..."

    # Execute query and capture JSON output
    npx wrangler d1 execute "$D1_DATABASE_NAME" --remote \
        --command "SELECT * FROM $table_name" \
        --json > "$output_file" 2>/dev/null

    # Check if export was successful
    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        # Extract the results array from wrangler's JSON output
        # Wrangler returns: [{"results": [...], "success": true, ...}]
        local count=$(jq '.[0].results | length' "$output_file" 2>/dev/null || echo "0")
        log_success "Exported $count rows from '$table_name' to $output_file"
    else
        log_warn "No data or error exporting '$table_name'"
    fi
}

#==============================================================================
# Main Script
#==============================================================================
echo "=============================================="
echo "ArtTherapy+ D1 Data Export"
echo "=============================================="
echo ""

# Check wrangler is installed
if ! command -v npx &>/dev/null; then
    log_error "npx (Node.js) is required. Please install Node.js first."
    exit 1
fi

# Check wrangler is authenticated
if ! npx wrangler whoami &>/dev/null; then
    log_error "Wrangler not authenticated. Please run 'wrangler login' first."
    exit 1
fi

ACCOUNT_INFO=$(npx wrangler whoami 2>/dev/null | head -1)
log_info "Authenticated: $ACCOUNT_INFO"
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"
log_info "Export directory: $EXPORT_DIR/"
echo ""

#------------------------------------------------------------------------------
# Get Database Info
#------------------------------------------------------------------------------
log_info "Checking D1 database '$D1_DATABASE_NAME'..."

# Verify database exists by listing tables
TABLES_OUTPUT=$(npx wrangler d1 execute "$D1_DATABASE_NAME" --remote \
    --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'" \
    --json 2>/dev/null || echo "[]")

if [ "$TABLES_OUTPUT" == "[]" ]; then
    log_error "Could not connect to D1 database or no tables found."
    log_info "Make sure you have access to '$D1_DATABASE_NAME'."
    exit 1
fi

echo "$TABLES_OUTPUT" | jq -r '.[0].results[].name' 2>/dev/null | while read -r table; do
    log_info "Found table: $table"
done
echo ""

#------------------------------------------------------------------------------
# Export Tables
#------------------------------------------------------------------------------
log_info "Starting data export..."
echo ""

# Export users (excluding rate_limits as it's transient data)
export_table "users"
export_table "gallery_items"
export_table "journal_entries"

# Optionally export rate_limits (usually not needed for migration)
log_info "Skipping 'rate_limits' table (transient data)."
echo ""

#------------------------------------------------------------------------------
# Create Export Metadata
#------------------------------------------------------------------------------
log_info "Creating export metadata..."

METADATA_FILE="$EXPORT_DIR/export_metadata.json"

# Count records in each file
USERS_COUNT=$(jq '.[0].results | length' "$EXPORT_DIR/users.json" 2>/dev/null || echo "0")
GALLERY_COUNT=$(jq '.[0].results | length' "$EXPORT_DIR/gallery_items.json" 2>/dev/null || echo "0")
JOURNAL_COUNT=$(jq '.[0].results | length' "$EXPORT_DIR/journal_entries.json" 2>/dev/null || echo "0")

cat > "$METADATA_FILE" << EOF
{
  "source": "cloudflare-d1",
  "database": "$D1_DATABASE_NAME",
  "exported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tables": {
    "users": {
      "count": $USERS_COUNT,
      "file": "users.json"
    },
    "gallery_items": {
      "count": $GALLERY_COUNT,
      "file": "gallery_items.json"
    },
    "journal_entries": {
      "count": $JOURNAL_COUNT,
      "file": "journal_entries.json"
    }
  },
  "notes": [
    "rate_limits table was not exported (transient data)",
    "Image URLs reference R2 storage - need to update after blob migration"
  ]
}
EOF

log_success "Export metadata saved to $METADATA_FILE"

#------------------------------------------------------------------------------
# Validate Exports
#------------------------------------------------------------------------------
echo ""
log_info "Validating exports..."

# Check for valid JSON in each file
for file in "$EXPORT_DIR"/*.json; do
    if jq empty "$file" 2>/dev/null; then
        log_success "Valid JSON: $(basename "$file")"
    else
        log_error "Invalid JSON: $(basename "$file")"
    fi
done

#------------------------------------------------------------------------------
# Create Clean Data Files (just the results array)
#------------------------------------------------------------------------------
echo ""
log_info "Creating clean data files (results only)..."

# Extract just the results array for easier import
for table in users gallery_items journal_entries; do
    INPUT_FILE="$EXPORT_DIR/${table}.json"
    OUTPUT_FILE="$EXPORT_DIR/${table}_data.json"

    if [ -f "$INPUT_FILE" ]; then
        jq '.[0].results' "$INPUT_FILE" > "$OUTPUT_FILE" 2>/dev/null
        log_success "Created ${table}_data.json"
    fi
done

#==============================================================================
# Summary
#==============================================================================
echo ""
echo "=============================================="
echo "EXPORT COMPLETE"
echo "=============================================="
echo ""
log_success "Data exported successfully to $EXPORT_DIR/"
echo ""
echo "Files created:"
ls -la "$EXPORT_DIR"/*.json 2>/dev/null || true
echo ""
echo "Record counts:"
echo "  Users:          $USERS_COUNT"
echo "  Gallery Items:  $GALLERY_COUNT"
echo "  Journal Entries: $JOURNAL_COUNT"
echo ""
echo "=============================================="
echo "NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Review the exported data files in $EXPORT_DIR/"
echo ""
echo "2. If you need to migrate R2 images to Azure Blob Storage:"
echo "   ./scripts/migrate-r2-images.sh"
echo ""
echo "3. Initialize the Azure SQL schema first (if not done):"
echo "   sqlcmd -S <server>.database.windows.net -d arttherapy-plus -U <user> -P <pass> -i azure-backend/sql/001_init_schema.sql"
echo ""
echo "4. Import data to Azure SQL:"
echo "   ./scripts/import-azure-data.sh"
echo ""
