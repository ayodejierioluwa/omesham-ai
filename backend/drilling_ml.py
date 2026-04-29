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
        wob_klbs = np.random.normal(30, 2, num_records)
        rpm = np.random.normal(120, 5, num_records)
        rop_fph = np.random.normal(100, 10, num_records)
        spp_psi = np.random.normal(2800, 50, num_records)
        torque_ftlbs = np.random.normal(15000, 500, num_records)
        
        # Inject "Stick-Slip" anomalies
        # High fluctuations in torque and RPM, bit stops rotating then slips at high speed
        stick_slip_indices = np.random.choice(num_records, int(num_records * 0.015), replace=False)
        for idx in stick_slip_indices:
            torque_ftlbs[idx] += np.random.uniform(4000, 8000) 
            rpm[idx] -= np.random.uniform(40, 80)
            rop_fph[idx] -= np.random.uniform(20, 40)
            
        # Inject "Washout" anomalies
        # Sudden drop in SPP while drilling
        washout_indices = np.random.choice(list(set(range(num_records)) - set(stick_slip_indices)), int(num_records * 0.01), replace=False)
        for idx in washout_indices:
            spp_psi[idx] -= np.random.uniform(500, 1000) 
            
        # Inject "Bit Balling" anomalies
        # ROP drops significantly, SPP slightly increases
        balling_indices = np.random.choice(list(set(range(num_records)) - set(stick_slip_indices) - set(washout_indices)), int(num_records * 0.015), replace=False)
        for idx in balling_indices:
            rop_fph[idx] -= np.random.uniform(50, 80)
            spp_psi[idx] += np.random.uniform(200, 400)
            
        # Create DataFrame
        df = pd.DataFrame({
            'wob_klbs': wob_klbs,
            'rpm': rpm,
            'rop_fph': rop_fph,
            'spp_psi': spp_psi,
            'torque_ftlbs': torque_ftlbs
        })
        
        # Run ML Anomaly Detection
        logger.info("Training Isolation Forest on Drilling telemetry...")
        self.model.fit(df)
        
        predictions = self.model.predict(df)
        df['is_anomaly'] = predictions == -1
        
        # Agentic Prescriptive Logic
        def diagnose_and_prescribe(row):
            if not row['is_anomaly']:
                return "Nominal", "Continue drilling. Optimize WOB for maximum ROP."
            
            # Diagnose based on physical signatures
            if row['torque_ftlbs'] > 18000 and row['rpm'] < 100:
                return "Severe Stick-Slip Vibration", "Decrease WOB by 5 klbs and increase RPM by 15 to break torsional resonance."
            elif row['spp_psi'] < 2400:
                return "Drill String Washout Detected", "Stop drilling immediately. Circulate bottoms up and pull out of hole for pipe inspection to prevent blowout."
            elif row['rop_fph'] < 50 and row['spp_psi'] > 2900:
                return "Bit Balling", "Increase mud flow rate. Sweep wellbore with high-vis pill to clean BHA."
            else:
                return "Formation Lithology Change", "Recalculate drillability parameters based on new rock mechanics."

        # Apply diagnosis
        results = df.apply(diagnose_and_prescribe, axis=1)
        df['anomaly_type'] = [res[0] for res in results]
        df['recommended_solution'] = [res[1] for res in results]
        
        # Save locally
        df.to_csv(LOCAL_DRILLING_DATA_PATH, index=False)
        logger.info("Drilling data synthesized, diagnosed, and saved.")
        
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
