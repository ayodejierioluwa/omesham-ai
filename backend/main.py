from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from drilling_ml import DrillingML, DB_PATH, get_calibrated_thresholds, invalidate_thresholds_cache
from datetime import datetime, timedelta
from pydantic import BaseModel
import sqlite3
import xml.etree.ElementTree as ET
import asyncio
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Omesham-API")

from chaos_engine import DrillingChaosEngine

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
def get_drilling_telemetry(offset: int = 0, limit: int = 30, chaos: bool = False, location: str = "permian_basin"):
    """Serve the ML-processed drilling rig telemetry data with stratigraphical location context."""
    df = drilling_engine.get_processed_data(location=location)
    
    total_records = len(df)
    if offset >= total_records:
        offset = total_records - limit
        
    chunk = df.iloc[offset : offset + limit]
    
    # Simulate high-frequency 1-second timestamps for drilling
    base_time = datetime.now() - timedelta(seconds=limit)
    
    # Initialize chaos engine if requested
    chaos_engine = DrillingChaosEngine() if chaos else None
    
    data = []
    for i, row in enumerate(chunk.to_dict(orient="records")):
        row["timestamp"] = (base_time + timedelta(seconds=i)).isoformat()
        if chaos_engine:
            mutated = chaos_engine.mutate(row, dropout_rate=0.0) # No dropouts in historical/batch REST responses
            if mutated:
                row = mutated
        data.append(row)
        
    return {
        "asset_id": "Rig-01",
        "offset": offset,
        "limit": limit,
        "total_records": total_records,
        "data": data
    }

@app.get("/api/drilling/telemetry_stream")
def telemetry_stream(chaos: bool = False, location: str = "permian_basin"):
    """Establish a real-time, low-latency Server-Sent Events (SSE) stream with stratigraphy support."""
    async def event_generator():
        df = drilling_engine.get_processed_data(location=location)
        total_records = len(df)
        offset = 0
        
        # Initialize a single persistent chaos engine for this stream connection
        # to track continuous sensor drift correctly.
        chaos_engine = DrillingChaosEngine() if chaos else None
        
        while True:
            row = df.iloc[offset].to_dict()
            # Inject live, high-resolution timestamp
            row["timestamp"] = datetime.now().isoformat()
            
            if chaos_engine:
                mutated = chaos_engine.mutate(row)
                if mutated is None:
                    # Simulates a transmission dropout / packet loss:
                    # We skip streaming this point and wait for the next interval
                    offset = (offset + 1) % total_records
                    await asyncio.sleep(0.2)
                    continue
                row = mutated
            
            # Format and send SSE payload
            yield f"data: {json.dumps(row)}\n\n"
            
            # Progress loop to stream continuous realtime frames
            offset = (offset + 1) % total_records
            await asyncio.sleep(0.2) # High-frequency 5Hz streams (every 200ms)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


from field_streamer import ForgeDrillingStreamer

@app.get("/api/field/drilling_stream")
def field_drilling_stream(chaos: bool = False, location: str = "utah_forge"):
    """Establish a real-time Server-Sent Events (SSE) stream for real-world geothermal well telemetry with alignment calibration."""
    async def event_generator():
        streamer = ForgeDrillingStreamer()
        generator = streamer.generate_stream(location=location)
        
        # Initialize single persistent chaos engine for physical drift and dropouts
        chaos_engine = DrillingChaosEngine() if chaos else None
        
        while True:
            row = next(generator)
            
            if chaos_engine:
                mutated = chaos_engine.mutate(row)
                if mutated is None:
                    # Simulates transmission network dropouts: pause and retry
                    await asyncio.sleep(0.2)
                    continue
                row = mutated
                
            yield f"data: {json.dumps(row)}\n\n"
            await asyncio.sleep(0.2) # Maintain matching 5Hz sampling rate
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

class FeedbackRequest(BaseModel):
    torque_ftlbs: float
    rpm: float
    wob_klbs: float
    spp_psi: float
    rop_fph: float
    formation_type: str
    original_anomaly: str
    operator_correction: str  # 'false_alarm' or 'correct'

@app.post("/api/drilling/feedback")
def submit_operator_feedback(feedback: FeedbackRequest):
    """Saves operator feedback corrections to SQLite database, triggering immediate AI self-calibration."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=15.0)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO drilling_feedback (
                timestamp, torque_ftlbs, rpm, wob_klbs, spp_psi, rop_fph, formation_type, original_anomaly, operator_correction
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            feedback.torque_ftlbs,
            feedback.rpm,
            feedback.wob_klbs,
            feedback.spp_psi,
            feedback.rop_fph,
            feedback.formation_type,
            feedback.original_anomaly,
            feedback.operator_correction
        ))
        conn.commit()
        conn.close()
        
        # Invalidate local thresholds cache to force immediate self-calibration
        invalidate_thresholds_cache()
        
        logger.info(f"Omesham AI received operator feedback. Brain calibrated for anomaly: '{feedback.original_anomaly}' as '{feedback.operator_correction}'.")
        return {"status": "success", "message": "Omesham AI calibrated successfully from active feedback!"}
    except Exception as e:
        logger.error(f"Failed to save active learning feedback: {e}")
        return {"status": "error", "message": f"Database insertion failed: {e}"}

@app.post("/api/drilling/parse_witsml")
async def parse_witsml_payload(request: Request):
    """Ingests raw industrial XML WITSML telemetry, extracts values, and classifies dysfunctions."""
    try:
        body = await request.body()
        xml_str = body.decode("utf-8")
        
        # Remove namespaces for robust tag matching
        xml_clean = xml_str
        for ns in ["witsml:", 'xmlns:witsml="http://www.witsml.org/schemas/1series"']:
            xml_clean = xml_clean.replace(ns, "")
            
        root = ET.fromstring(xml_clean)
        station = root.find(".//trajectoryStation") or root
        
        def safe_float(tag, default=0.0):
            elem = station.find(f".//{tag}") or station.find(tag)
            return float(elem.text) if elem is not None and elem.text else default
            
        depth = safe_float("md", 12000.0)
        wob = safe_float("wob", 20.0)
        rpm = safe_float("rpm", 80.0)
        rop = safe_float("rop", 60.0)
        spp = safe_float("spp", 2500.0)
        torque = safe_float("torque", 15000.0)
        
        elem_bha = station.find(".//bhaState") or station.find("bhaState")
        bha_state = elem_bha.text if elem_bha is not None and elem_bha.text else "Rotating (Rotary)"
        
        elem_form = station.find(".//formation") or station.find("formation")
        formation_type = elem_form.text if elem_form is not None and elem_form.text else "Granite Basement"

        # Classify dysfunction
        is_anomaly = False
        anomaly_type = "Nominal"
        solution = "Continue drilling. Optimize WOB for maximum ROP."
        risk = 8.0
        alert = "System operating in nominal envelope"
        
        # Load self-calibrated thresholds
        torque_limit, rpm_floor = get_calibrated_thresholds("utah_forge")

        if bha_state != "Sliding (Directional)" and torque > torque_limit and rpm < rpm_floor and rpm > 3:
            is_anomaly = True
            anomaly_type = "Severe Stick-Slip Vibration"
            solution = "Decrease WOB by 5 klbs and increase RPM by 15 to break torsional resonance."
            risk = 92.0
            alert = f"PROACTIVE ML WARNING: Impending Stick-Slip (92% risk). Torque {torque:.0f} exceeds calibrated {torque_limit:.0f} ft-lbs limits."
            
        return {
            "parsed": {
                "depth_ft": depth,
                "wob_klbs": wob,
                "rpm": rpm,
                "rop_fph": rop,
                "spp_psi": spp,
                "torque_ftlbs": torque,
                "bha_state": bha_state,
                "formation_type": formation_type
            },
            "evaluation": {
                "is_anomaly": is_anomaly,
                "anomaly_type": anomaly_type,
                "recommended_solution": solution,
                "forecast_risk": risk,
                "proactive_alert": alert
            }
        }
    except Exception as e:
        logger.error(f"Failed to parse WITSML XML payload: {e}")
        return {"status": "error", "message": f"WITSML parsing failed: {e}"}

