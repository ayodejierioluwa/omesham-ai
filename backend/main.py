from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from drilling_ml import DrillingML
from datetime import datetime, timedelta
import asyncio
import json

app = FastAPI(title="Omesham AI API")

# Add CORS middleware for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3006", 
        "http://127.0.0.1:3006",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

drilling_engine = DrillingML()

@app.get("/")
def read_root():
    return {"status": "Omesham AI API is operational"}

@app.get("/api/drilling/processed_telemetry")
def get_drilling_telemetry(offset: int = 0, limit: int = 30):
    """Serve the ML-processed drilling rig telemetry data."""
    df = drilling_engine.get_processed_data()
    
    total_records = len(df)
    if offset >= total_records:
        offset = total_records - limit
        
    chunk = df.iloc[offset : offset + limit]
    
    # Simulate high-frequency 1-second timestamps for drilling
    base_time = datetime.now() - timedelta(seconds=limit)
    
    data = []
    for i, row in enumerate(chunk.to_dict(orient="records")):
        row["timestamp"] = (base_time + timedelta(seconds=i)).isoformat()
        data.append(row)
        
    return {
        "asset_id": "Rig-01",
        "offset": offset,
        "limit": limit,
        "total_records": total_records,
        "data": data
    }

@app.get("/api/drilling/telemetry_stream")
async def telemetry_stream():
    """Establish a real-time, low-latency Server-Sent Events (SSE) stream."""
    async def event_generator():
        df = drilling_engine.get_processed_data()
        total_records = len(df)
        offset = 0
        
        while True:
            row = df.iloc[offset].to_dict()
            # Inject live, high-resolution timestamp
            row["timestamp"] = datetime.now().isoformat()
            
            # Format and send SSE payload
            yield f"data: {json.dumps(row)}\n\n"
            
            # Progress loop to stream continuous realtime frames
            offset = (offset + 1) % total_records
            await asyncio.sleep(0.2) # High-frequency 5Hz streams (every 200ms)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
