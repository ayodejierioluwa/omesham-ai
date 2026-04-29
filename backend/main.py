from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from drilling_ml import DrillingML
from datetime import datetime, timedelta

app = FastAPI(title="Omesham AI API")

# Add CORS middleware for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3006", "http://localhost:3000"],
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
