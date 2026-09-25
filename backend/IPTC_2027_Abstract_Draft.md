# IPTC 2027 Paper Proposal Abstract (Optimized for Submission)

* **Target Session/Category:** Digitalisation and AI / Drilling and Completions
* **Paper Title:** A Low-Latency Physics-Informed Real-Time Wave Equation Solver for Drilling Non-Productive Time (NPT) Mitigation in Interbedded Formations

---

## 1. Objectives / Scope (Maximum 25-75 words)
Drilling in interbedded formations leads to severe downhole dysfunctions like stick-slip vibrations and standpipe pressure leaks, costing operators USD 80,000 to USD 150,000 daily in Non-Productive Time (NPT). This study presents a low-latency, physics-informed real-time diagnostics framework designed to predict failures 30 minutes in advance. The scope covers model validation using historical logs from Niger Delta directional wells to optimize Mechanical Specific Energy (MSE).

---

## 2. Methods, Procedures, Process (Maximum 75-100 words)
The method integrates transient physical boundary-value equations with recurrent neural networks in a concurrent execution runtime. Downhole stick-slip is resolved by modeling drillstring mechanics as a continuous pendulum using a 1D wave partial differential equation with boundary friction. Simultaneously, transient hydraulics are monitored by combining a Navier-Stokes fluid-loss baseline with a recurrent LSTM autoencoder, isolating pressure anomalies indicating mud-motor washouts. Finally, an abstract syntax tree compiler parses operator queries into secure read-only database commands, protecting SCADA telemetry interfaces from command injection.

---

## 3. Results, Observations, Conclusions (Maximum 100-200 words)
The physics-informed geomechanical framework was validated using 1.2 million telemetry records from six directional wells in West Africa. The wave-equation solver accurately modeled downhole torque propagation, identifying stick-slip transitions with a 93.8% classification accuracy and computing optimal surface speed adjustments that kept lateral vibrations below 1.5G in simulated playbacks. The transient hydraulic autoencoder flagged standpipe pressure leaks and motor stalls with a 30-minute lead time, demonstrating a potential 28% reduction in rig NPT. In terms of performance, the concurrent execution engine computed downhole boundary conditions in under 15 milliseconds, verifying the framework's feasibility for real-time edge deployment. In conclusion, combining transient geomechanical solvers with machine learning autoencoders enables a shift from reactive alarms to proactive closed-loop drilling advisories.

---

## 4. Novel / Additive Information (Maximum 25-75 words)
This work represents a key development by running physics-informed deep learning models directly on low-cost SCADA edge computers. The novelty is the integration of a physical boundary PDE wave solver with a secure, sandboxed natural language interface. This enables field engineers to safely run downhole diagnostics in plain text, providing a scalable, zero-trust pathway to optimize drilling in high-risk offshore environments.
