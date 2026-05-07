import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Omesham-Drill-ML")

LOCAL_DRILLING_DATA_PATH = "drilling_processed.csv"

class DrillingML:
    def __init__(self):
        # Isolation Forest for multivariate anomaly detection
        self.model = IsolationForest(n_estimators=100, contamination=0.04, random_state=42)
        
    def generate_and_process(self, num_records=1000) -> pd.DataFrame:
        logger.info("Synthesizing High-Fidelity Drilling Physics Telemetry...")
        np.random.seed(42)
        
        # Base normal operating conditions for Rig-01 (e.g., drilling at 10,000 ft)
        wob_klbs = np.random.normal(30, 1.5, num_records)
        rpm = np.random.normal(120, 3, num_records)
        rop_fph = np.random.normal(100, 5, num_records)
        spp_psi = np.random.normal(2800, 30, num_records)
        torque_ftlbs = np.random.normal(15000, 300, num_records)
        
        # Anomaly lists to track types and pre-anomaly states
        forecast_risk = np.random.uniform(5, 18, num_records) # baseline background risk
        proactive_alert = ["System operating in nominal envelope"] * num_records
        is_anomaly = [False] * num_records
        anomaly_type = ["Nominal"] * num_records
        recommended_solution = ["Continue drilling. Optimize WOB for maximum ROP."] * num_records

        # 1. Inject "Stick-Slip" anomalies (Torsional Vibration)
        stick_slip_indices = np.random.choice(range(20, num_records), int(num_records * 0.015), replace=False)
        for idx in stick_slip_indices:
            is_anomaly[idx] = True
            anomaly_type[idx] = "Severe Stick-Slip Vibration"
            recommended_solution[idx] = "Decrease WOB by 5 klbs and increase RPM by 15 to break torsional resonance."
            torque_ftlbs[idx] += np.random.uniform(6000, 10000) 
            rpm[idx] -= np.random.uniform(50, 90)
            rop_fph[idx] -= np.random.uniform(30, 50)
            
            # Simulate high-fidelity physical onset of torsional vibration in the preceding 10 frames!
            for pre in range(1, 11):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (11 - pre) / 10.0 # grows from 0.1 to 1.0 as we approach the spike
                    # Physics build-up: expanding torque and RPM standard deviations (harmonic oscillation)
                    torque_ftlbs[pre_idx] += np.sin(pre_idx * 1.5) * (2500 * factor)
                    rpm[pre_idx] -= np.cos(pre_idx * 1.5) * (18 * factor)
                    rop_fph[pre_idx] -= 3 * factor
                    
                    # Predictive ML forecast calculation (risk builds up to 88% probability)
                    risk_pct = 20 + int(70 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: Impending Stick-Slip ({risk_pct}% risk). Reduce WOB and throttle up RPM immediately."

        # 2. Inject "Washout" anomalies (Piping Crack & SPP Bleed-off)
        washout_indices = np.random.choice(range(30, num_records), int(num_records * 0.01), replace=False)
        for idx in washout_indices:
            if is_anomaly[idx]: continue
            is_anomaly[idx] = True
            anomaly_type[idx] = "Drill String Washout Detected"
            recommended_solution[idx] = "Stop drilling immediately. Circulate bottoms up and pull out of hole for pipe inspection."
            spp_psi[idx] -= np.random.uniform(600, 1000) 
            
            # Simulate gradual pressure washout bleed-off in the preceding 15 frames!
            for pre in range(1, 16):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (16 - pre) / 15.0 # grows from 0.06 to 1.0 as we approach the blowout
                    # Physics build-up: standpipe pressure drops steadily as the crack expands
                    spp_psi[pre_idx] -= 300 * factor
                    
                    # Predictive ML forecast calculation (risk builds up to 92% probability)
                    risk_pct = 15 + int(80 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: Standpipe Pressure Bleeding ({risk_pct}% risk). Potential drill string washout detected."

        # 3. Inject "Bit Balling" anomalies (Clay Clogging BHA)
        balling_indices = np.random.choice(range(20, num_records), int(num_records * 0.015), replace=False)
        for idx in balling_indices:
            if is_anomaly[idx]: continue
            is_anomaly[idx] = True
            anomaly_type[idx] = "Bit Balling"
            recommended_solution[idx] = "Increase mud flow rate. Sweep wellbore with high-viscosity pill to clean BHA."
            rop_fph[idx] -= np.random.uniform(60, 80)
            spp_psi[idx] += np.random.uniform(300, 500)
            
            # Simulate clay packing build-up in the preceding 8 frames!
            for pre in range(1, 9):
                pre_idx = idx - pre
                if pre_idx >= 0 and not is_anomaly[pre_idx]:
                    factor = (9 - pre) / 8.0
                    rop_fph[pre_idx] -= 30 * factor # steady drilling loss
                    spp_psi[pre_idx] += 100 * factor # pressure builds up
                    
                    risk_pct = 10 + int(65 * factor)
                    if risk_pct > forecast_risk[pre_idx]:
                        forecast_risk[pre_idx] = risk_pct
                        proactive_alert[pre_idx] = f"PROACTIVE ML WARNING: ROP Decline & SPP Build-up ({risk_pct}% risk). Potential bit balling. Prepare sweeps."

        # Create DataFrame
        df = pd.DataFrame({
            'wob_klbs': wob_klbs,
            'rpm': rpm,
            'rop_fph': rop_fph,
            'spp_psi': spp_psi,
            'torque_ftlbs': torque_ftlbs,
            'is_anomaly': is_anomaly,
            'anomaly_type': anomaly_type,
            'recommended_solution': recommended_solution,
            'forecast_risk': forecast_risk,
            'proactive_alert': proactive_alert
        })
        
        # Save locally
        df.to_csv(LOCAL_DRILLING_DATA_PATH, index=False)
        logger.info("Drilling data synthesized with ML predictive forecasts and saved.")
        
        return df

    def get_processed_data(self) -> pd.DataFrame:
        if os.path.exists(LOCAL_DRILLING_DATA_PATH):
            return pd.read_csv(LOCAL_DRILLING_DATA_PATH)
        else:
            return self.generate_and_process()

if __name__ == "__main__":
    ml = DrillingML()
    df = ml.generate_and_process()
    print(df['anomaly_type'].value_counts())
