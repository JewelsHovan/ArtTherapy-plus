#!/bin/bash

# Start Cloudflare Worker (local development)
echo "Starting Cloudflare Worker locally..."
cd cloudflare-worker
npm run dev &
WORKER_PID=$!

# Wait for Worker to be ready
sleep 3

# Start React frontend
echo "Starting React frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Worker PID: $WORKER_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🚀 Development servers running:"
echo "   Worker API: http://localhost:8787"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $WORKER_PID $FRONTEND_PID; exit" INT
wait