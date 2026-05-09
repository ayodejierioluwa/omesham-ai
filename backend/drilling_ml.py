import pandas as pd
import numpy as np
import logging
import os
import sqlite3

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Omesham-Drill-ML")

DB_PATH = "/Users/macbook/.gemini/antigravity/scratch/well_analyses_v3.db"

_last_calibrated = {}
_cache_needs_refresh = True

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH, timeout=15.0)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS drilling_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                torque_ftlbs REAL,
                rpm REAL,
                wob_klbs REAL,
                spp_psi REAL,
                rop_fph REAL,
                formation_type TEXT,
                original_anomaly TEXT,
                operator_correction TEXT
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to initialize SQLite Database: {e}")

# Initialize database on module load
init_db()

def invalidate_thresholds_cache():
    global _cache_needs_refresh
    _cache_needs_refresh = True

def get_calibrated_thresholds(location: str):
    global _cache_needs_refresh, _last_calibrated
    
    # Base thresholds
    torque_limit = 45000 if location == 'utah_forge' else 16000
    rpm_floor = 40 if location == 'utah_forge' else 75
    
    # Return cache if active and populated
    if not _cache_needs_refresh and location in _last_calibrated:
        return _last_calibrated[location]
        
    try:
        if os.path.exists(DB_PATH):
            conn = sqlite3.connect(DB_PATH, timeout=15.0)
            cursor = conn.cursor()
            
            # Check for torque false alarms to auto-expand threshold envelope
            cursor.execute("""
                SELECT MAX(torque_ftlbs) FROM drilling_feedback 
                WHERE operator_correction = 'false_alarm' 
                AND original_anomaly = 'Severe Stick-Slip Vibration'
            """)
            row = cursor.fetchone()
            if row and row[0] is not None:
                max_false_alarm_torque = row[0]
                if max_false_alarm_torque > torque_limit:
                    new_torque = max_false_alarm_torque * 1.10
                    if location not in _last_calibrated or new_torque != _last_calibrated[location][0]:
                        logger.info(f"Omesham AI Online Calibration: Adjusted Torque Limit to {new_torque:.1f} ft-lbs based on feedback.")
                    torque_limit = new_torque
                    
            # Check for RPM false alarms to lower RPM floor
            cursor.execute("""
                SELECT MIN(rpm) FROM drilling_feedback 
                WHERE operator_correction = 'false_alarm' 
                AND original_anomaly = 'Severe Stick-Slip Vibration'
            """)
            row = cursor.fetchone()
            if row and row[0] is not None:
                min_false_alarm_rpm = row[0]
                if min_false_alarm_rpm < rpm_floor:
                    new_rpm = max(5.0, min_false_alarm_rpm * 0.90)
                    if location not in _last_calibrated or new_rpm != _last_calibrated[location][1]:
                        logger.info(f"Omesham AI Online Calibration: Lowered RPM Floor to {new_rpm:.1f} RPM based on feedback.")
                    rpm_floor = new_rpm
                    
            conn.close()
    except Exception as e:
        logger.error(f"Error loading online feedback calibration: {e}")
        
    _last_calibrated[location] = (torque_limit, rpm_floor)
    _cache_needs_refresh = False
    return torque_limit, rpm_floor

class DrillingML:
    def __init__(self):
        # Configuration for geographic locations and their stratigraphic layers
        self.stratigraphy = {
            "permian_basin": [
                {"min_depth": 0, "max_depth": 2000, "name": "Clay & Soil", "hardness": 1.2, "shear": 1.1, "base_wob": 15.0, "base_rpm": 110.0, "base_rop": 120.0, "base_spp": 1200.0, "base_torque": 4000.0},
                {"min_depth": 2000, "max_depth": 6000, "name": "Sandstone Bed", "hardness": 3.4, "shear": 2.8, "base_wob": 24.0, "base_rpm": 120.0, "base_rop": 95.0, "base_spp": 2100.0, "base_torque": 8500.0},
                {"min_depth": 6000, "max_depth": 10000, "name": "Organic Shale", "hardness": 4.8, "shear": 4.2, "base_wob": 30.0, "base_rpm": 130.0, "base_rop": 75.0, "base_spp": 2800.0, "base_torque": 13500.0},
                {"min_depth": 10000, "max_depth": 99999, "name": "Dense Limestone", "hardness": 7.2, "shear": 6.5, "base_wob": 34.0, "base_rpm": 95.0, "base_rop": 45.0, "base_spp": 3400.0, "base_torque": 17000.0}
            ],
            "volve_field": [
                {"min_depth": 0, "max_depth": 3000, "name": "Unconsolidated Sand", "hardness": 0.8, "shear": 0.7, "base_wob": 12.0, "base_rpm": 105.0, "base_rop": 140.0, "base_spp": 1100.0, "base_torque": 3200.0},
                {"min_depth": 3000, "max_depth": 8000, "name": "Sticky Claystone", "hardness": 2.8, "shear": 3.9, "base_wob": 22.0, "base_rpm": 90.0, "base_rop": 80.0, "base_spp": 2300.0, "base_torque": 11500.0},
                {"min_depth": 8000, "max_depth": 11000, "name": "Chalk & Marl", "hardness": 4.1, "shear": 3.2, "base_wob": 28.0, "base_rpm": 115.0, "base_rop": 65.0, "base_spp": 3000.0, "base_torque": 12500.0},
                {"min_depth": 11000, "max_depth": 99999, "name": "Deep Reservoir Sand", "hardness": 5.2, "shear": 4.0, "base_wob": 26.0, "base_rpm": 120.0, "base_rop": 90.0, "base_spp": 3500.0, "base_torque": 10500.0}
            ],
            "utah_forge": [
                {"min_depth": 0, "max_depth": 1500, "name": "Alluvial Gravel", "hardness": 1.5, "shear": 1.3, "base_wob": 16.0, "base_rpm": 110.0, "base_rop": 85.0, "base_spp": 1150.0, "base_torque": 4800.0},
                {"min_depth": 1500, "max_depth": 3000, "name": "Volcanic Tuff", "hardness": 4.5, "shear": 3.8, "base_wob": 25.0, "base_rpm": 100.0, "base_rop": 55.0, "base_spp": 2100.0, "base_torque": 11200.0},
                {"min_depth": 3000, "max_depth": 99999, "name": "Granite Basement", "hardness": 9.5, "shear": 9.1, "base_wob": 38.0, "base_rpm": 62.0, "base_rop": 24.0, "base_spp": 3800.0, "base_torque": 31500.0}
            ],
            "gom_deepwater": [
                {"min_depth": 0, "max_depth": 3000, "name": "Deepwater Mudline", "hardness": 0.5, "shear": 0.4, "base_wob": 10.0, "base_rpm": 120.0, "base_rop": 165.0, "base_spp": 900.0, "base_torque": 2500.0},
                {"min_depth": 3000, "max_depth": 5000, "name": "Soft Marine Silt", "hardness": 2.1, "shear": 1.8, "base_wob": 18.0, "base_rpm": 110.0, "base_rop": 115.0, "base_spp": 1800.0, "base_torque": 6500.0},
                {"min_depth": 5000, "max_depth": 8000, "name": "Squeezing Salt Dome", "hardness": 3.8, "shear": 5.5, "base_wob": 24.0, "base_rpm": 85.0, "base_rop": 70.0, "base_spp": 2500.0, "base_torque": 18000.0},
                {"min_depth": 8000, "max_depth": 99999, "name": "Deep Marine Shale", "hardness": 4.5, "shear": 3.9, "base_wob": 28.0, "base_rpm": 100.0, "base_rop": 80.0, "base_spp": 3200.0, "base_torque": 11000.0}
            ],
            "arabian_basin": [
                {"min_depth": 0, "max_depth": 1500, "name": "Desert Overburden", "hardness": 1.1, "shear": 0.9, "base_wob": 12.0, "base_rpm": 115.0, "base_rop": 130.0, "base_spp": 1000.0, "base_torque": 3000.0},
                {"min_depth": 1500, "max_depth": 4000, "name": "Abrasive Anhydrite Cap", "hardness": 6.5, "shear": 5.8, "base_wob": 32.0, "base_rpm": 80.0, "base_rop": 40.0, "base_spp": 2400.0, "base_torque": 15000.0},
                {"min_depth": 4000, "max_depth": 10000, "name": "Ghawar Carbonate Limestone", "hardness": 7.8, "shear": 7.1, "base_wob": 35.0, "base_rpm": 75.0, "base_rop": 35.0, "base_spp": 3300.0, "base_torque": 19000.0},
                {"min_depth": 10000, "max_depth": 99999, "name": "High-Pressure Reservoir", "hardness": 5.4, "shear": 4.8, "base_wob": 28.0, "base_rpm": 100.0, "base_rop": 85.0, "base_spp": 3900.0, "base_torque": 12000.0}
            ]
        }

    def get_layer_properties(self, depth: float, location: str) -> dict:
        """Finds active geological formation profile as a function of depth."""
        layers = self.stratigraphy.get(location, self.stratigraphy["permian_basin"])
        for layer in layers:
            if layer["min_depth"] <= depth < layer["max_depth"]:
                return layer
        return layers[-1]

    def generate_and_process(self, num_records=1000, location='permian_basin') -> pd.DataFrame:
        logger.info(f"Synthesizing Stratigraphy-Aware Drilling Physics for {location.upper()}...")
        np.random.seed(42)
        
        # We simulate a deep drilling run progressing linearly down the wellbore
        start_depth = 1000.0
        depth_progression = [start_depth + (i * 11.5) for i in range(num_records)]
        
        # Dynamic telemetry lists
        wob_list, rpm_list, rop_list, spp_list, torque_list, formation_list, bha_state_list = [], [], [], [], [], [], []
        
        for i, depth in enumerate(depth_progression):
            props = self.get_layer_properties(depth, location)
            
            # Simulate sliding steering zones (e.g., every 300 records, we slide for 50 records)
            is_sliding = (i % 300) >= 120 and (i % 300) < 170
            bha_state = "Sliding (Directional)" if is_sliding else "Rotating (Rotary)"
            
            # Physics-based sensor equations with geological scales:
            wob = np.random.normal(props["base_wob"], props["hardness"] * 0.4)
            
            if is_sliding:
                # Sliding steering: surface RPM is zero (no string rotation)
                rpm = np.random.normal(0.0, 0.2)
                # Standpipe pressure climbs because mud is driving the downhole motor
                spp_motor_load = 400.0 + (props["hardness"] * 50.0)
                spp_friction_loss = (depth * 0.08)
                spp = np.random.normal(props["base_spp"] + spp_friction_loss + spp_motor_load, 25.0)
                # Surface torque is minimal since string isn't spinning
                torque = np.random.normal(1000.0, 150.0)
                # Rate of penetration is slightly lower while sliding
                rop = np.random.normal(props["base_rop"] * 0.65, props["hardness"] * 0.5)
            else:
                # Standard rotary drilling
                rpm = np.random.normal(props["base_rpm"], 2.5)
                spp_friction_loss = (depth * 0.08)
                spp = np.random.normal(props["base_spp"] + spp_friction_loss, 25.0)
                torque = np.random.normal(props["base_torque"], props["shear"] * 120.0)
                rop = np.random.normal(props["base_rop"], props["hardness"] * 0.8)
            
            wob_list.append(max(0, wob))
            rpm_list.append(max(0, rpm))
            rop_list.append(max(0, rop))
            spp_list.append(max(0, spp))
            torque_list.append(max(0, torque))
            formation_list.append(props["name"])
            bha_state_list.append(bha_state)
            
        # Convert to numpy arrays for injection mapping
        wob_klbs = np.array(wob_list)
        rpm = np.array(rpm_list)
        rop_fph = np.array(rop_list)
        spp_psi = np.array(spp_list)
        torque_ftlbs = np.array(torque_list)
        
        # Anomaly trackers
        forecast_risk = np.random.uniform(5, 15, num_records)
        proactive_alert = ["System operating in nominal envelope"] * num_records
        is_anomaly = [False] * num_records
        anomaly_type = ["Nominal"] * num_records
        recommended_solution = ["Continue drilling. Optimize WOB for maximum ROP."] * num_records

        # --- Geology-Aligned High-Fidelity Dysfunction Injection ---
        
        # Load self-calibrated thresholds
        torque_limit, rpm_floor = get_calibrated_thresholds(location)

        # 1. Torsional Anomaly: Stick-Slip (Inject in Hard formations)
        stick_slip_indices = []
        if location == 'utah_forge':
            stick_slip_indices = [idx for idx, d in enumerate(depth_progression) if d > 1500 and idx % 95 == 0]
        elif location == 'arabian_basin':
            stick_slip_indices = [idx for idx, d in enumerate(depth_progression) if d > 1500 and idx % 115 == 0]
        else:
            stick_slip_indices = [idx for idx, d in enumerate(depth_progression) if d > 2000 and idx % 220 == 0]
            
        for idx in stick_slip_indices:
            if idx >= num_records: continue
            # Avoid stick-slip injection during SLIDING mode (surface string torque is near zero)
            if bha_state_list[idx] == "Sliding (Directional)": continue
            
            is_anomaly[idx] = True
            anomaly_type[idx] = "Severe Stick-Slip Vibration"
            recommended_solution[idx] = "Decrease WOB by 5 klbs and increase RPM by 15 to break torsional resonance."
            torque_ftlbs[idx] += np.random.uniform(12000, 18000) 
            rpm[idx] = max(15, rpm[idx] - np.random.uniform(40, 55))
            rop_fph[idx] = max(5, rop_fph[idx] - np.random.uniform(15, 25))
            
            # Physics ramp-up over 10 frames
            for pre in range(1, 11):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (11 - pre) / 10.0
                    torque_ftlbs[pre_idx] += np.sin(pre_idx * 1.5) * (3500 * factor)
                    rpm[pre_idx] = max(20, rpm[pre_idx] - np.cos(pre_idx * 1.5) * (15 * factor))
                    rop_fph[pre_idx] = max(5, rop_fph[pre_idx] - 3 * factor)
                    
                    risk_pct = 20 + int(72 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: Impending Stick-Slip ({risk_pct}% risk). Adjust RPM immediately."

        # 2. Hydraulic Anomaly: Washout (Leak in abrasive formations)
        washout_indices = [idx for idx, d in enumerate(depth_progression) if idx % 280 == 0 and idx not in stick_slip_indices]
        for idx in washout_indices:
            if idx >= num_records: continue
            is_anomaly[idx] = True
            anomaly_type[idx] = "Drill String Washout Detected"
            recommended_solution[idx] = "Stop drilling immediately. Circulate bottoms up and pull out of hole for pipe inspection."
            spp_psi[idx] -= np.random.uniform(500, 850)
            
            # Physics pressure bleed-off over 15 frames
            for pre in range(1, 16):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (16 - pre) / 15.0
                    spp_psi[pre_idx] -= 250 * factor
                    
                    risk_pct = 15 + int(78 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: Mud Pressure Dropping ({risk_pct}% risk). Leak suspected."

        # 3. Mechanical Anomaly: Bit Balling (Only in Sticky Claystone/Clay zones)
        balling_indices = [idx for idx, d in enumerate(depth_progression) if "Clay" in formation_list[idx] and idx % 75 == 0]
        for idx in balling_indices:
            if idx >= num_records: continue
            if is_anomaly[idx]: continue
            is_anomaly[idx] = True
            anomaly_type[idx] = "Bit Balling"
            recommended_solution[idx] = "Increase mud flow rate. Sweep wellbore with high-viscosity pill to clean BHA."
            rop_fph[idx] -= np.random.uniform(40, 55)
            spp_psi[idx] += np.random.uniform(250, 400)
            
            # Pack build-up over 8 frames
            for pre in range(1, 9):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (9 - pre) / 8.0
                    rop_fph[pre_idx] -= 20 * factor
                    spp_psi[pre_idx] += 80 * factor
                    
                    risk_pct = 10 + int(60 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: Clay Packing Alert ({risk_pct}% risk). Bit balling expected."

        # 4. Gulf of Mexico Basin: Salt Squeezing Anomalies
        if location == 'gom_deepwater':
            salt_indices = [idx for idx, d in enumerate(depth_progression) if "Salt" in formation_list[idx] and idx % 110 == 0]
            for idx in salt_indices:
                if idx >= num_records: continue
                is_anomaly[idx] = True
                anomaly_type[idx] = "Salt Squeezing (Tight Spot)"
                recommended_solution[idx] = "Ream tight spot. Increase mud density to stabilize squeezing salt formation."
                torque_ftlbs[idx] += np.random.uniform(18000, 24000)
                rop_fph[idx] = max(3.0, rop_fph[idx] - np.random.uniform(20, 35))
                forecast_risk[idx] = 94.0
                proactive_alert[idx] = "PROACTIVE ML WARNING: Wellbore Squeezing (94% risk). High drag torque detected inside Salt Dome."

        # 5. Middle East Basin: Lost Circulation Event (Limestone cavities)
        if location == 'arabian_basin':
            lost_circ_indices = [idx for idx, d in enumerate(depth_progression) if "Ghawar" in formation_list[idx] and idx % 130 == 0]
            for idx in lost_circ_indices:
                if idx >= num_records: continue
                is_anomaly[idx] = True
                anomaly_type[idx] = "Lost Circulation Event"
                recommended_solution[idx] = "Pump LCM (Lost Circulation Material) sweeps. Reduce mud weight to prevent reservoir reservoir fracture."
                spp_psi[idx] = max(100.0, spp_psi[idx] - np.random.uniform(1100, 1500))
                rop_fph[idx] = max(2.0, rop_fph[idx] - np.random.uniform(15, 25))
                forecast_risk[idx] = 95.0
                proactive_alert[idx] = "PROACTIVE ML WARNING: Lost Circulation (95% risk). Sudden mud pressure drop inside Karst cavities."

        # Create DataFrame
        df = pd.DataFrame({
            'depth_ft': depth_progression,
            'depth': depth_progression,
            'wob_klbs': wob_klbs,
            'rpm': rpm,
            'rop_fph': rop_fph,
            'spp_psi': spp_psi,
            'torque_ftlbs': torque_ftlbs,
            'formation_type': formation_list,
            'bha_state': bha_state_list,
            'is_anomaly': is_anomaly,
            'anomaly_type': anomaly_type,
            'recommended_solution': recommended_solution,
            'forecast_risk': forecast_risk,
            'proactive_alert': proactive_alert
        })
        
        # Save basin-specific file
        filepath = f"drilling_processed_{location}.csv"
        df.to_csv(filepath, index=False)
        logger.info(f"Synthesized dynamic lithology dataset saved: {filepath}")
        
        return df

    def get_processed_data(self, location='permian_basin') -> pd.DataFrame:
        # Always generate fresh data to ensure active column alignments and latest physics simulations are returned
        return self.generate_and_process(location=location)

if __name__ == "__main__":
    ml = DrillingML()
    df = ml.generate_and_process(location='utah_forge')
    print(df['formation_type'].value_counts())
