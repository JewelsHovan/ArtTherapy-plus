#!/bin/bash
#
# ArtTherapy+ Local Development Startup
#
# Starts both the Azure backend (Express server) and React frontend
# for local development.
#
# Prerequisites:
#   - Node.js 20+
#   - azure-backend/.env file configured
#
# Usage:
#   ./scripts/start-dev.sh
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

#==============================================================================
# Cleanup Handler
#==============================================================================
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    log_info "Shutting down development servers..."

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
        log_info "Backend server stopped."
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
        log_info "Frontend server stopped."
    fi

    log_success "All servers stopped."
    exit 0
}

trap cleanup INT TERM

#==============================================================================
# Prerequisites Check
#==============================================================================
echo "=============================================="
echo "ArtTherapy+ Local Development"
echo "=============================================="
echo ""

# Check Node.js version
log_info "Checking prerequisites..."

if ! command -v node &>/dev/null; then
    log_error "Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) detected."

# Check for azure-backend/.env
if [ ! -f "$PROJECT_ROOT/azure-backend/.env" ]; then
    log_warn "azure-backend/.env not found!"
    log_warn "Copy from .env.example and configure:"
    log_warn "  cp $PROJECT_ROOT/azure-backend/.env.example $PROJECT_ROOT/azure-backend/.env"
    log_warn ""
    log_warn "Continuing anyway - backend may fail without proper configuration."
    echo ""
fi

#==============================================================================
# Install Dependencies
#==============================================================================
log_info "Checking dependencies..."

# Backend dependencies
if [ ! -d "$PROJECT_ROOT/azure-backend/node_modules" ]; then
    log_info "Installing backend dependencies..."
    cd "$PROJECT_ROOT/azure-backend"
    npm install
    log_success "Backend dependencies installed."
fi

# Frontend dependencies
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    log_info "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend"
    npm install
    log_success "Frontend dependencies installed."
fi

#==============================================================================
# Start Servers
#==============================================================================
echo ""
log_info "Starting development servers..."

# Export API URL for frontend to use local backend
export VITE_API_URL="http://localhost:8787/api"

# Start backend
cd "$PROJECT_ROOT/azure-backend"
npm run dev &
BACKEND_PID=$!
log_info "Backend starting (PID: $BACKEND_PID)..."

# Wait for backend to be ready
sleep 3

# Verify backend is running
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_error "Backend failed to start. Check logs above for errors."
    exit 1
fi

# Start frontend
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
log_info "Frontend starting (PID: $FRONTEND_PID)..."

# Wait briefly for frontend to start
sleep 2

#==============================================================================
# Output Summary
#==============================================================================
echo ""
echo "=============================================="
log_success "Development servers running!"
echo "=============================================="
echo ""
echo "  Backend API:  http://localhost:8787/api"
echo "  Frontend:     http://localhost:5173"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for both processes
wait
