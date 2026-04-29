#!/bin/bash

# Start FastAPI backend on port 8006
echo "Starting OMESHAM AI Backend (Port 8006)..."
cd /Users/macbook/.gemini/antigravity/scratch/omesham_ai/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8006 --reload &
BACKEND_PID=$!

# Start Next.js frontend on port 3006
echo "Starting OMESHAM AI Frontend (Port 3006)..."
cd /Users/macbook/.gemini/antigravity/scratch/omesham_ai/frontend
npm run dev -- -p 3006 &
FRONTEND_PID=$!

echo "Omesham AI (Drill AI) Servers are running."
echo "Frontend: http://localhost:3006"
echo "Backend API: http://localhost:8006"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
