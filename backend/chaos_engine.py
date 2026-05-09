import random

class DrillingChaosEngine:
    def __init__(self):
        # Accumulates linear drift for sensors (e.g., thermal or calibration drift)
        self.spp_drift = 0.0
        self.torque_drift = 0.0
        self.counter = 0

    def mutate(self, row_data: dict, noise_multiplier: float = 1.0, dropout_rate: float = 0.08) -> dict:
        """
        Mutates a single row of nominal drilling data to simulate real-world field conditions.
        Returns None to represent a complete network dropout (packet loss).
        """
        # 1. Simulate Network Dropout
        if random.random() < dropout_rate:
            return None

        # Copy the original dictionary to preserve nominal state in-memory
        mutated = row_data.copy()
        self.counter += 1

        # 2. Accumulate Drift (Simulates mechanical sensor drift over time)
        self.spp_drift += random.uniform(0.1, 0.4) * noise_multiplier
        self.torque_drift += random.uniform(0.5, 2.0) * noise_multiplier

        # 3. Apply Gaussian Jitter & Drift to Physical Parameters
        # Weight on Bit (WOB)
        if "wob_klbs" in mutated and isinstance(mutated["wob_klbs"], (int, float)):
            mutated["wob_klbs"] = max(0.0, mutated["wob_klbs"] + random.gauss(0, 1.8) * noise_multiplier)

        # RPM
        if "rpm" in mutated and isinstance(mutated["rpm"], (int, float)):
            mutated["rpm"] = max(0.0, mutated["rpm"] + random.gauss(0, 4.0) * noise_multiplier)

        # Rate of Penetration (ROP)
        if "rop_fph" in mutated and isinstance(mutated["rop_fph"], (int, float)):
            original_rop = mutated["rop_fph"]
            if original_rop > 5:
                mutated["rop_fph"] = max(1.0, original_rop + random.gauss(0, 6.0) * noise_multiplier)
            else:
                mutated["rop_fph"] = max(0.0, original_rop)

        # Standpipe Pressure (SPP)
        if "spp_psi" in mutated and isinstance(mutated["spp_psi"], (int, float)):
            mutated["spp_psi"] = max(0.0, mutated["spp_psi"] + (random.gauss(0, 45.0) + self.spp_drift) * noise_multiplier)

        # Torque
        if "torque_ftlbs" in mutated and isinstance(mutated["torque_ftlbs"], (int, float)):
            mutated["torque_ftlbs"] = max(0.0, mutated["torque_ftlbs"] + (random.gauss(0, 400.0) + self.torque_drift) * noise_multiplier)

        # 4. Occasional Sensor Spikes (Simulating sudden high-frequency electromagnetic interference)
        if self.counter % 25 == 0:
            if "torque_ftlbs" in mutated:
                mutated["torque_ftlbs"] = max(0.0, mutated["torque_ftlbs"] + random.choice([-1500, 1500]))
            if "spp_psi" in mutated:
                mutated["spp_psi"] = max(0.0, mutated["spp_psi"] + random.choice([-200, 200]))

        return mutated
