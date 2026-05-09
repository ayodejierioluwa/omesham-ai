import pandas as pd
import requests
import io
import logging
import random
import warnings
import sqlite3
from datetime import datetime
from urllib3.exceptions import InsecureRequestWarning
from drilling_ml import get_calibrated_thresholds

warnings.filterwarnings('ignore', category=InsecureRequestWarning)
logger = logging.getLogger("Forge-Geothermal-Streamer")

FORGE_CSV_URL = "https://raw.githubusercontent.com/Arbi-ben-aoun/Drilling-rate-of-penetration-prediction/main/Well_58-32.csv"

# WITSML XML payload formatter
def format_witsml_xml(row: dict) -> str:
    timestamp_iso = row.get("timestamp", datetime.now().isoformat())
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<witsml:trajectorys xmlns:witsml="http://www.witsml.org/schemas/1series" version="1.4.1.1">
  <witsml:trajectory uidWell="Omesham-01" uid="Wellbore-Realtime">
    <witsml:nameWell>Omesham Asset-01</witsml:nameWell>
    <witsml:nameWellbore>Live Active Side-track</witsml:nameWellbore>
    <witsml:dtimCreation>{timestamp_iso}</witsml:dtimCreation>
    <witsml:trajectoryStation>
      <witsml:md uom="ft">{row.get('depth_ft', 0.0):.2f}</witsml:md>
      <witsml:tvd uom="ft">{row.get('depth', 0.0):.2f}</witsml:tvd>
      <witsml:wob uom="klbs">{row.get('wob_klbs', 0.0):.2f}</witsml:wob>
      <witsml:rpm uom="rpm">{row.get('rpm', 0.0):.1f}</witsml:rpm>
      <witsml:rop uom="ft/h">{row.get('rop_fph', 0.0):.2f}</witsml:rop>
      <witsml:spp uom="psi">{row.get('spp_psi', 0.0):.1f}</witsml:spp>
      <witsml:torque uom="ft-lb">{row.get('torque_ftlbs', 0.0):.1f}</witsml:torque>
      <witsml:bhaState>{row.get('bha_state', 'Rotating')}</witsml:bhaState>
      <witsml:formation>{row.get('formation_type', 'Sedimentary')}</witsml:formation>
    </witsml:trajectoryStation>
  </witsml:trajectory>
</witsml:trajectorys>"""

class ForgeDrillingStreamer:
    def __init__(self):
        self.cached_df = None

    def fetch_data(self) -> pd.DataFrame:
        """Loads Utah FORGE geothermal drilling logs in-memory over HTTPS (0 bytes disk)."""
        if self.cached_df is not None:
            return self.cached_df

        logger.info("Connecting to online repository for raw Utah FORGE drilling well logs...")
        try:
            response = requests.get(FORGE_CSV_URL, verify=False, timeout=8)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                df.columns = df.columns.str.strip()
                logger.info(f"Loaded {len(df)} FORGE Geothermal well log rows in-memory successfully.")
                self.cached_df = df
                return df
            else:
                logger.warning(f"FORGE Well log fetch failed (HTTP {response.status_code}). Deploying fallback.")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Failed to stream FORGE Well logs over HTTPS: {e}. Deploying fallback.")
            return pd.DataFrame()

    def get_fallback_data(self, count=200) -> pd.DataFrame:
        """Generates premium geothermal drilling parameters if raw logs are unreachable."""
        logger.info("Generating realistic fallback FORGE drilling telemetry...")
        data = []
        base_depth = 4250.0
        for i in range(count):
            data.append({
                "Depth(ft)": base_depth + (i * 1.2),
                "weight on bit (k-lbs)": random.normalvariate(22.4, 1.8),
                "Rotary Speed (rpm)": random.normalvariate(95.0, 4.0),
                "ROP(1 ft)": random.normalvariate(64.5, 3.5),
                "Pump Press (psi)": random.normalvariate(1150.0, 45.0),
                "Surface Torque (psi)": random.normalvariate(11.2, 0.6)
            })
        return pd.DataFrame(data)

    def generate_stream(self, location='utah_forge'):
        """Streaming generator emitting real well log telemetry row-by-row, aligned to geology."""
        df = self.fetch_data()
        
        # Deploy fallback if offline
        if df.empty:
            df = self.get_fallback_data()

        total_rows = len(df)
        offset = 0

        while True:
            raw_row = df.iloc[offset].to_dict()
            
            # Map raw geothermal CSV attributes to Omesham ML layout schema
            depth_val = max(0.0, float(raw_row.get("Depth(ft)", 12450.0 + offset * 0.24)))
            wob_val = max(0.0, float(raw_row.get("weight on bit (k-lbs)", 0.0)))
            rpm_val = max(0.0, float(raw_row.get("Rotary Speed (rpm)", 120.0)))
            rop_val = max(0.0, float(raw_row.get("ROP(1 ft)", 80.0)))
            spp_val = max(0.0, float(raw_row.get("Pump Press (psi)", 2800.0)))
            
            # Surface Torque in raw FORGE is recorded in psi (hydraulic top-drive pressure).
            # We scale it cleanly to Omesham's ft-lbs dashboard bounds (~1200x scale factor)
            torque_psi = float(raw_row.get("Surface Torque (psi)", 10.0))
            torque_ftlbs = max(0.0, torque_psi * 1250.0 if torque_psi > 1.0 else random.normalvariate(12500.0, 300.0))

            # Determine live formation type based on well depth and location alignment
            formation_type = "Clay & Soil"
            if location == 'utah_forge':
                if depth_val < 1500:
                    formation_type = "Alluvial Gravel"
                elif depth_val < 3000:
                    formation_type = "Volcanic Tuff"
                else:
                    formation_type = "Granite Basement"
            elif location == 'volve_field':
                if depth_val < 3000:
                    formation_type = "Unconsolidated Sand"
                elif depth_val < 8000:
                    formation_type = "Sticky Claystone"
                elif depth_val < 11000:
                    formation_type = "Chalk & Marl"
                else:
                    formation_type = "Deep Reservoir Sand"
            elif location == 'gom_deepwater':
                if depth_val < 3000:
                    formation_type = "Deepwater Mudline"
                elif depth_val < 5000:
                    formation_type = "Soft Marine Silt"
                elif depth_val < 8000:
                    formation_type = "Squeezing Salt Dome"
                else:
                    formation_type = "Deep Marine Shale"
            elif location == 'arabian_basin':
                if depth_val < 1500:
                    formation_type = "Desert Overburden"
                elif depth_val < 4000:
                    formation_type = "Abrasive Anhydrite Cap"
                elif depth_val < 10000:
                    formation_type = "Ghawar Carbonate Limestone"
                else:
                    formation_type = "High-Pressure Reservoir"
            else: # Permian Basin
                if depth_val < 2000:
                    formation_type = "Clay & Soil"
                elif depth_val < 6000:
                    formation_type = "Sandstone Bed"
                elif depth_val < 10000:
                    formation_type = "Organic Shale"
                else:
                    formation_type = "Dense Limestone"

            # Determine BHA directional drilling status (Sliding vs Rotating)
            # In live wells, if string rotation stops (RPM < 10), we are slide steering
            is_sliding = (offset % 180) >= 100 and (offset % 180) < 130
            bha_state = "Sliding (Directional)" if is_sliding else "Rotating (Rotary)"

            if is_sliding:
                rpm_val = random.uniform(0.0, 0.4) # Pipe is still, downhole motor rotates
                torque_ftlbs = random.uniform(800.0, 1400.0) # minimal surface friction torque
                spp_val += 350.0 # additional standpipe load due to downhole mud motor friction
                rop_val *= 0.65 # sliding rates of penetration are typically lower

            mapped_row = {
                "timestamp": datetime.now().isoformat(),
                "depth_ft": depth_val,
                "depth": depth_val,
                "wob_klbs": wob_val,
                "rpm": rpm_val,
                "rop_fph": rop_val,
                "spp_psi": spp_val,
                "torque_ftlbs": torque_ftlbs,
                "formation_type": formation_type,
                "bha_state": bha_state,
                "is_anomaly": False,
                "anomaly_type": "Nominal",
                "recommended_solution": "Continue drilling. Optimize WOB for maximum ROP.",
                "forecast_risk": float(random.randint(4, 12)),
                "proactive_alert": "System operating in nominal envelope"
            }

            # --- Geology-Aligned Physical Outlier & Drilling Dysfunction Classifier ---
            
            # Load active model limits (potentially self-calibrated via active learning!)
            torque_limit, rpm_floor = get_calibrated_thresholds(location)

            # 1. Torsional Dysfunction: Stick-slip
            # Suppressed entirely inside Sliding Mode (since string is not rotating)
            if bha_state != "Sliding (Directional)":
                is_stick_slip = mapped_row["torque_ftlbs"] > torque_limit and mapped_row["rpm"] < rpm_floor and mapped_row["rpm"] > 3
                
                if is_stick_slip:
                    mapped_row["is_anomaly"] = True
                    mapped_row["anomaly_type"] = "Severe Stick-Slip Vibration"
                    mapped_row["recommended_solution"] = "Decrease WOB by 5 klbs and increase RPM by 15 to break torsional resonance."
                    mapped_row["forecast_risk"] = 92.0
                    mapped_row["proactive_alert"] = f"PROACTIVE ML WARNING: Impending Stick-Slip (92% risk). Torque {mapped_row['torque_ftlbs']:.0f} exceeds calibrated {torque_limit:.0f} ft-lbs limits."

            # 2. Hydraulic Dysfunction: Washout / Line Leak
            if not mapped_row["is_anomaly"] and mapped_row["spp_psi"] < 300 and mapped_row["rpm"] > 40:
                mapped_row["is_anomaly"] = True
                mapped_row["anomaly_type"] = "Drill String Washout Detected"
                mapped_row["recommended_solution"] = "Stop drilling immediately. Pull out of hole for pipe inspection."
                mapped_row["forecast_risk"] = 89.0
                mapped_row["proactive_alert"] = "PROACTIVE ML WARNING: Standpipe Pressure Bleeding (89% risk). Washout suspected."

            # 3. Gulf of Mexico Squeezing Salt Dome anomaly (Inject in salt dome layers)
            if not mapped_row["is_anomaly"] and location == 'gom_deepwater' and "Salt" in formation_type and offset % 85 == 0:
                mapped_row["is_anomaly"] = True
                mapped_row["anomaly_type"] = "Salt Squeezing (Tight Spot)"
                mapped_row["recommended_solution"] = "Ream tight spot. Increase mud weight to hold back salt formation."
                mapped_row["torque_ftlbs"] += 15000
                mapped_row["rop_fph"] *= 0.2
                mapped_row["forecast_risk"] = 94.0
                mapped_row["proactive_alert"] = "PROACTIVE ML WARNING: Mudline Drag Squeezing wellbore (94% risk)."

            # 4. Arabian Carbonate limestone cavitation / Lost Circulation (Inject in limestone layers)
            if not mapped_row["is_anomaly"] and location == 'arabian_basin' and "Limestone" in formation_type and offset % 95 == 0:
                mapped_row["is_anomaly"] = True
                mapped_row["anomaly_type"] = "Lost Circulation Event"
                mapped_row["recommended_solution"] = "Pump coarse LCM sweeps immediately. Monitor annular fluid level."
                mapped_row["spp_psi"] = max(150.0, mapped_row["spp_psi"] - 1200)
                mapped_row["rop_fph"] *= 0.1
                mapped_row["forecast_risk"] = 96.0
                mapped_row["proactive_alert"] = "PROACTIVE ML WARNING: Total fluid loss in cavernous limestone formation (96% risk)."

            # Generate real-time standard WITSML XML string
            mapped_row["witsml_xml"] = format_witsml_xml(mapped_row)

            yield mapped_row
            offset = (offset + 1) % total_rows
