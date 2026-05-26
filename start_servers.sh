#!/bin/bash

# Resolve the absolute path of the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start FastAPI backend on port 8006
echo "Starting OMESHAM AI Backend (Port 8006)..."
cd "$SCRIPT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi

if [ "$NODE_ENV" = "production" ]; then
    uvicorn main:app --host 0.0.0.0 --port 8006 &
else
    uvicorn main:app --host 0.0.0.0 --port 8006 --reload &
fi
BACKEND_PID=$!

# Start Next.js frontend on port 3006
echo "Starting OMESHAM AI Frontend (Port 3006)..."
cd "$SCRIPT_DIR/frontend"
if [ "$NODE_ENV" = "production" ]; then
    npm run start -- -p 3006 &
else
    npm run dev -- -p 3006 &
fi
FRONTEND_PID=$!

echo "Omesham AI (Drill AI) Servers are running."
echo "Frontend: http://localhost:3006"
echo "Backend API: http://localhost:8006"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
