#!/usr/bin/env python3
import os
import sys
import time
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load local .env if it exists
def load_dotenv_custom(dotenv_path=".env"):
    if os.path.exists(dotenv_path):
        with open(dotenv_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Ensure .env is loaded from the directory of this script
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv_custom(os.path.join(backend_dir, ".env"))

# =====================================================================
#                          CTO OUTREACH BOT CONFIG
# =====================================================================
DRY_RUN = True  # Default to True. Pass --send CLI flag to set to False!
if "--send" in sys.argv:
    DRY_RUN = False

SENDER_NAME = "Ayodeji Erioluwa"
SENDER_EMAIL = "ayodejierioluwa@gmail.com"  # Your verified sender email
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.environ.get("OMESHAM_SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("OMESHAM_SMTP_PASS", "")

# 1. CURATED TARGET DATABASE WITH CULTURAL GREETINGS AND TAILORED GEOLOGICAL PROFILES
TARGETS = [
    {
        "company": "Seplat Energy Plc",
        "recipient_name": "Roger Brown",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Sir/Ma,",
        "emails": ["roger.brown@seplatenergy.com", "info@seplatenergy.com", "ir@seplatenergy.com"],
        "is_operator": True,
        "custom_focus": "your gas and oil development campaigns across your Western Niger Delta assets, where maximizing Mechanical Specific Energy (MSE) and controlling hole integrity in interbedded sands are critical to lowering cost-per-foot.",
        "product_solutions": """1. Omesham AI — Torsional Stick-Slip Prevention: Instantly detects early-stage downhole harmonic resonance during your Western Niger Delta campaigns, recommending real-time RPM/WOB target adjustments to prevent costly drillstring twist-offs.
2. PetroGenesis-3D — Subsurface Workstation: Models complex reservoir stratigraphy and faults in full 3D, using high-fidelity synthetic seismic trace generation to improve structural drilling targeting.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Allows your drilling engineers to safely query rig databases in plain English (e.g., "Show all high-risk anomalies except Nominal") under the protection of the secure Antigravity execution shield."""
    },
    {
        "company": "Heirs Energies Limited",
        "recipient_name": "Osa Igiehon",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Sir/Ma,",
        "emails": ["Chidimma.Ugbojiaku@Heirsenergies.com", "info@heirsenergies.com"],
        "is_operator": True,
        "custom_focus": "your extensive drilling operations across the OML 17 asset, where sliding-mode steering, sand-shale boundary vibrational resonance, and mud motor efficiency are paramount to driving down rig Non-Productive Time (NPT).",
        "product_solutions": """1. PetroSight AI — Predictive Operations: Processes pipeline telemetry to predict flow anomalies and pressure losses, safeguarding production transport across OML 17.
2. Omesham AI — Mud Motor Efficiency & BHA Protection: Tracks standpipe pressure changes to warn of downhole stalls and washouts up to 30 minutes before they cause expensive Non-Productive Time (NPT).
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Enables natural-language database querying (NLPS) backed by the secure Antigravity (AG) sandbox to search operational histories securely."""
    },
    {
        "company": "Aradel Holdings Plc",
        "recipient_name": "Gbite Falade",
        "recipient_title": "Managing Director & CEO",
        "greeting": "Dear Sir/Ma,",
        "emails": ["adegbolaadesina@aradel.com", "IR@aradel.com", "info@aradel.com"],
        "is_operator": True,
        "custom_focus": "your pioneering marginal field developments at Ogbele and Omerelu, where deploying lightweight edge-computing diagnostics can proactively prevent pipe washouts, protect drill collars, and extend drillstring life.",
        "product_solutions": """1. PetroGenesis-3D — Reservoir Stratigraphy Modeling: Visualizes and interacts with 3D geological block models to pinpoint thin-bed sands and optimize marginal field exploration at Ogbele and Omerelu.
2. Omesham AI — BHA Diagnostics: Integrates physics-compliant models with high-frequency telemetry to predict washouts and cutter wear, protecting drill collars and extending drillstring life.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Engineers can query exploration and well archives in natural language, securely sandboxed from code-injection vulnerabilities."""
    },
    {
        "company": "Oando Energy Resources",
        "recipient_name": "Wale Tinubu",
        "recipient_title": "Group Chief Executive",
        "greeting": "Dear Sir/Ma,",
        "emails": ["albalogun@oandoplc.com", "info@oandoplc.com", "ir@oandoplc.com"],
        "is_operator": True,
        "custom_focus": "Oando's proud commitment to local content and technical excellence, demonstrating how an indigenous digital co-drilling brain can reduce structural well-delivery costs across your JV acreage.",
        "product_solutions": """1. GAIA AI — Unified Asset Intelligence: Consolidates your exploration, drilling, and production streams into a single, SSO-secured operations shell to reduce overhead across your JV acreage.
2. PetroSight AI — Predictive Pipeline Diagnostics: Monitors transport networks in real-time, predicting structural anomalies before they lead to flow interruptions.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Provides a natural-language search bar for corporate telemetry, letting staff search database metrics securely without SQL knowledge."""
    },
    {
        "company": "ND Western",
        "recipient_name": "Olanrewaju (Lanre) Kalejaiye",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Sir/Ma,",
        "emails": ["info@ndwestern.com"],
        "is_operator": True,
        "custom_focus": "your oil and gas operations in OML 34, where controlling severe lateral vibrations in thick Cretaceous sands and preventing unexpected mud-motor stalls are paramount to keeping rig downtime at zero.",
        "product_solutions": """1. Omesham AI — Vibrational Mitigation: Analyzes downhole dynamics to identify lateral shock waves in thick Cretaceous formations, providing real-time RPM/WOB targets to damp rock resonance.
2. Omesham AI — Autonomous State Monitoring: Distinguishes rotating vs. sliding modes, tracking toolface steering to keep OML 34 wellbores aligned with planned 3D trajectories.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Rig supervisors can run natural language well logs queries, shielded from backend database corruption using the Antigravity sandbox."""
    },
    {
        "company": "Lekoil Nigeria Limited",
        "recipient_name": "Olalekan (\"Lekan\") Akinyanmi",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Sir/Ma,",
        "emails": ["investorrelations@lekoil.com", "info@lekoil.com"],
        "is_operator": True,
        "custom_focus": "your offshore assets in OML 113 and the Otakikpo field, where high wave-induced stick-slip, lateral cutter wear, and standpipe pressure mud leaks can cause catastrophic bottom-hole assembly (BHA) washouts.",
        "product_solutions": """1. Omesham AI — Wave Heave Compensation: Detects stick-slip and torque oscillations induced by offshore wave heave, recommending immediate RPM modifications to protect the bottom-hole assembly.
2. PetroGenesis-3D — 3D Stratigraphy: Models reservoir faults and thin sands in 3D, convolving formation data with Ricker wavelets to generate real-time synthetic acoustic seismic profiles.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Natural language querying of offshore telemetry with absolute backend security via the Antigravity Translation Shield."""
    },
    {
        "company": "AMNI International Petroleum Development Company",
        "recipient_name": "Chief Tunde Afolabi",
        "recipient_title": "Chairman & CEO",
        "greeting": "Dear Sir/Ma,",
        "emails": ["info@amni.com"],
        "is_operator": True,
        "custom_focus": "your offshore operations at the Ima and Okoro fields, where marine stick-slip and rapid formation compaction require real-time, closed-loop RPM and WOB micro-adjustments to protect expensive directional BHAs.",
        "product_solutions": """1. Omesham AI — Closed-loop RPM/WOB Optimization: Recommends real-time adjustments to RPM and Weight-on-Bit to bypass rock compaction resonance at Ima and Okoro fields.
2. Omesham AI — Predictive Fluid Dynamics: Tracks standpipe pressure anomalies to predict mud-motor washouts and downhole stalls before they result in expensive rig NPT.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Safe natural-language interrogation of BHA telemetry, protected by the Antigravity secure execution sandbox."""
    },
    {
        "company": "Waltersmith Petroman Oil Limited",
        "recipient_name": "Oladapo Filani",
        "recipient_title": "Managing Director & CEO",
        "greeting": "Dear Sir/Ma,",
        "emails": ["info@waltersmithng.com"],
        "is_operator": True,
        "custom_focus": "your Ibigwe field development campaigns, where deploying lightweight edge-computed Downhole Vibration Diagnostics (DVD) can prevent structural drillstring failures, maintain hole geometry, and protect bottom-hole assemblies.",
        "product_solutions": """1. Omesham AI — Downhole Vibration Diagnostics: Evaluates torsional wave propagation to prevent drillstring failures, maintain borehole geometry, and protect bottom-hole assemblies at Ibigwe.
2. PetroGenesis-3D — Subsurface Workstation: Interactively rotates and visualizes reservoir layers in full 3D to guide complex geological targeting.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Allows engineers to query live rig databases in plain English under the secure Antigravity execution shield."""
    },
    {
        "company": "Eroton Exploration & Production",
        "recipient_name": "Dr. Emeka Onyeka",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Sir/Ma,",
        "emails": ["info@erotonep.com"],
        "is_operator": True,
        "custom_focus": "your production and development campaigns in OML 18, where real-time standpipe pressure (SPP) anomaly tracking can predict mud-motor washouts and downhole stalls before they result in expensive rig NPT.",
        "product_solutions": """1. Omesham AI — Fluid Dynamics & SPP Tracking: Monitors standpipe pressure anomalies to warn of mud-motor washouts and downhole stalls up to 30 minutes before they occur.
2. PetroSight AI — Flow Intelligence: Evaluates production and transport telemetry to identify flow anomalies and optimize transport security.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Operates a natural-language query interface for well logs and transport logs, sandboxed safely by the Antigravity shell."""
    },
    {
        "company": "NUPRC (Nigerian Upstream Petroleum Regulatory Commission)",
        "recipient_name": "Engr. Gbenga Komolafe",
        "recipient_title": "Commission Chief Executive",
        "greeting": "Dear Sir/Ma,",
        "emails": ["nuprc@nuprc.gov.ng", "info@nuprc.gov.ng"],
        "is_operator": False,
        "custom_focus": "your visionary leadership in promoting local content, digital sovereign drilling standards, and regulatory safety oversight of downhole operations in Nigeria.",
        "product_solutions": """1. GAIA AI — Regulatory Dashboard: Aggregates operator data feeds into a unified dashboard, establishing digital compliance records and tracking national production metrics.
2. NDR Conversational Search (NLPS): Empowers regulatory staff to query complex National Data Repository archives using natural English (e.g., "Find all wells with high risk in Cretaceous zones").
3. Antigravity (AG) Translation Shield: Runs all natural language queries in a secure, sandboxed environment, preventing command injection or data tampering."""
    },
    {
        "company": "Neconde Energy Limited",
        "recipient_name": "Engr. Chichi Emenike",
        "recipient_title": "Acting Managing Director",
        "greeting": "Dear Sir/Ma,",
        "emails": ["info@neconde.com.ng"],
        "is_operator": True,
        "custom_focus": "your operations and gas development campaigns across the OML 42 asset, where optimizing Mechanical Specific Energy (MSE) and controlling hole integrity in interbedded sands are critical to lowering cost-per-foot.",
        "product_solutions": """1. Omesham AI — MSE Optimization: Integrates real-time ROP, RPM, and Hookload to optimize Mechanical Specific Energy and lower cost-per-foot across OML 42.
2. PetroGenesis-3D — Seismic Explorer: Interactively visualizes subsurface strata and shears faults in real-time, matching structural traps perfectly.
3. Conversational Telemetry (NLPS) & Secure Execution (AG): Rig supervisors query live well parameters in natural language, shielded by the Antigravity sandbox interpreter."""
    }
]

# TEMPLATE A: FOR UPSTREAM OIL & GAS OPERATORS
OPERATOR_EMAIL_TEMPLATE = """Dear {recipient_name},

I hope this email finds you well. I am writing to you in your capacity as {recipient_title} of {company}.

I am closely following {company}'s high-impact operations across {custom_focus}

In the complex, interbedded geology of the Niger Delta, drilling hazards like lateral vibrations, torsional stick-slip, and sudden downhole motor stalling represent massive cost factors. When daily rig rates in land and swamp operations are factored in, unplanned Non-Productive Time (NPT) easily translates to losses of $80,000 to $150,000 per day.

I am an indigenous petroleum software developer and engineering co-founder, and I have built PetroOne, a unified exploration and operations intelligence suite designed specifically for modern energy operators.

WHAT WE TARGET AND OFFER FOR {company}:

{product_solutions}

I have validated our physical models and 3D subsurface engines against complex geothermal and oilfield datasets, and I am passionate about proving this technology directly on Nigerian fields.

MY ASK — THE ZERO-RISK "HISTORICAL SHADOW TRIAL":

Rather than asking to deploy live on your active assets today, I propose a completely risk-free historical data playback:

- Provide me with the raw WITSML/LAS log files of a previously drilled well or historical operational logs that suffered from dysfunction, high NPT, or failure.
- I will run this data through our simulator workstation in playback mode.
- I will deliver a comprehensive, data-backed Drilling/Operations Efficiency Report proving exactly when and where PetroOne would have predicted and mitigated the failure.

If you are looking to optimize your campaigns and spearhead indigenous digital innovation, I would love to schedule a brief 10-minute technical web-demo with your engineering team this week to show our systems running in real time.

Warm regards,

Ayodeji Erioluwa
Founder & Lead Developer, PetroOne
Email: ayodejierioluwa@gmail.com | Lagos, Nigeria
"""

# TEMPLATE B: FOR THE NUPRC REGULATORY COMMISSION
REGULATOR_EMAIL_TEMPLATE = """Dear {recipient_name},

I hope this email finds you well. I am writing to you in your capacity as the Commission Chief Executive of the NUPRC.

We greatly admire {custom_focus} As Nigeria cements its position as Africa's premier oil producer, advancing technical oversight and indigenous digital capabilities is critical to ensuring drilling safety and cost-efficiency.

I am an indigenous petroleum software developer and engineering co-founder, and I have built PetroOne, our unified exploration and operations intelligence suite designed specifically for modern energy operators and regulatory oversight.

WHAT WE OFFER FOR UPSTREAM OVERSIGHT:

{product_solutions}

WHY THIS IS CRITICAL FOR UPSTREAM OVERSIGHT:

1. Digital Drilling Standards: PetroOne provides an independent, physics-compliant audit log of drillstring mechanical integrity and safe operational envelopes.

2. Local Content Empowerment: This platform represents a major breakthrough in local software content, proving that elite diagnostics and 3D visualization software can be designed and deployed directly by Nigerian engineers.

3. National Data Repository (NDR) Integration: I am looking to collaborate with the NUPRC to test and validate our diagnostic capabilities over sanitized historical well logs stored in the NDR. 

MY REQUEST:

I would be highly honored to schedule a brief, 10-minute technical web-demo with your digital transformation and engineering teams at the Commission to present PetroOne's capabilities, and discuss a collaborative pilot to validate our diagnostics using historical National Data Repository files.

Warm regards,

Ayodeji Erioluwa
Founder & Lead Developer, PetroOne
Email: ayodejierioluwa@gmail.com | Lagos, Nigeria
"""

# =====================================================================
#                          CORE LOGIC ENGINE
# =====================================================================

def calculate_sleep_until_monday_8am():
    """
    Calculates the seconds to sleep until Monday 8:00 AM WAT (UTC+1).
    Since local server time is UTC, Monday 8:00 AM WAT is Monday 7:00 AM UTC.
    """
    now = datetime.utcnow()
    # Find next Monday
    days_ahead = 0 - now.weekday()
    if days_ahead <= 0:  # Target is today or already passed this week
        days_ahead += 7
    
    next_monday_7am_utc = datetime(
        year=now.year,
        month=now.month,
        day=now.day,
        hour=7,
        minute=0,
        second=0
    ) + timedelta(days=days_ahead)
    
    time_diff = next_monday_7am_utc - now
    return max(0, time_diff.total_seconds())

def build_email(target, recipient_email):
    """Personalizes and builds a MIME message for a specific email address."""
    msg = MIMEMultipart()
    msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg['To'] = f"{target['recipient_name']} <{recipient_email}>"
    
    if target['is_operator']:
        msg['Subject'] = "Proposal: Reducing Niger Delta Operations Overhead via Closed-Loop AI Diagnostics"
        body = OPERATOR_EMAIL_TEMPLATE.format(
            greeting=target['greeting'],
            recipient_name=target['recipient_name'],
            recipient_title=target['recipient_title'],
            company=target['company'],
            custom_focus=target['custom_focus'],
            product_solutions=target['product_solutions']
        )
    else:
        msg['Subject'] = "Collaboration Proposal: Advancing Upstream Regulatory Safety via Indigenous Digital Twin Tech"
        body = REGULATOR_EMAIL_TEMPLATE.format(
            greeting=target['greeting'],
            recipient_name=target['recipient_name'],
            recipient_title=target['recipient_title'],
            company=target['company'],
            custom_focus=target['custom_focus'],
            product_solutions=target['product_solutions']
        )
        
    msg.attach(MIMEText(body, 'plain'))
    return msg, body

def main():
    print(f"[{datetime.now().isoformat()}] Omesham AI Outreach Bot Initializing...")
    print(f"Target count: {len(TARGETS)} major operators.")
    
    if DRY_RUN:
        print("\n=== DRY RUN ACTIVE: WRITING OUTREACH DRAFTS TO LOCAL MARKDOWN ===")
        drafts_file = "/Users/macbook/.gemini/antigravity-ide/scratch/omesham_ai/backend/outreach_drafts.md"
        
        with open(drafts_file, "w") as f:
            f.write("# Omesham AI Optimized B2B Outreach Pitch Drafts\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("Sender: Ayodeji Erioluwa (ayodejierioluwa@gmail.com)\n\n")
            f.write("> [!IMPORTANT]\n")
            f.write("> These drafts are optimized for PLAIN-TEXT clean emailing. All Markdown formatting characters (hashtags, bold stars, bullet stars) have been removed from the templates to ensure beautiful, professional, and readable Gmail inbox rendering.\n\n")
            
            for target in TARGETS:
                # We use the primary email address for drafts display
                primary_email = target['emails'][0]
                _, body = build_email(target, primary_email)
                f.write(f"## Target: {target['company']} ({target['recipient_name']})\n")
                f.write(f"**Email Contacts:** `{', '.join(target['emails'])}`\n")
                f.write(f"**Title:** {target['recipient_title']}\n\n")
                f.write("```text\n")
                f.write(body)
                f.write("\n```\n\n---\n\n")
                
        print(f"Drafts written successfully to {drafts_file}!")
        print("Please view the file to inspect the personalized letters.")
        return

    # Verify credentials before any waiting or sending
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\nERROR: SMTP credentials (OMESHAM_SMTP_USER / OMESHAM_SMTP_PASS) are missing!", file=sys.stderr)
        print("Please ensure they are defined in your .env file in the backend directory.", file=sys.stderr)
        sys.exit(1)

    # Real-world scheduled execution loop
    bypass_schedule = "--now" in sys.argv
    if not bypass_schedule:
        sleep_seconds = calculate_sleep_until_monday_8am()
        wake_up_time = datetime.utcnow() + timedelta(seconds=sleep_seconds)
        print(f"\n[{datetime.now().isoformat()}] SMTP credentials loaded successfully.")
        print(f"Scheduling outreach to fire exactly on Monday at 8:00 AM West Africa Time (7:00 AM UTC).")
        print(f"Calculated wait: {sleep_seconds / 3600:.2f} hours (Waking up at UTC: {wake_up_time.isoformat()})")
        
        if sleep_seconds > 0:
            print("Outreach thread going to standby mode... [Press CTRL+C to abort scheduling]")
            time.sleep(sleep_seconds)
    else:
        print(f"\n[{datetime.now().isoformat()}] Bypassing scheduling. Initiating immediate email outreach...")
        
    print(f"\n[{datetime.now().isoformat()}] Deploying pitches...")
    
    # Establish connection
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
    except Exception as e:
        print(f"ERROR: Failed to connect or login to SMTP server: {e}", file=sys.stderr)
        return

    success_count = 0
    total_emails = 0
    for target in TARGETS:
        for email in target['emails']:
            total_emails += 1
            msg, _ = build_email(target, email)
            try:
                server.sendmail(SENDER_EMAIL, [email], msg.as_string())
                print(f"SUCCESS: Pitch sent to {target['recipient_name']} ({target['company']}) -> {email}")
                success_count += 1
            except Exception as e:
                print(f"FAILED: Could not send to {target['recipient_name']} at {target['company']} to address {email}: {e}", file=sys.stderr)
            
    server.quit()
    print(f"\n[{datetime.now().isoformat()}] Pitch deployment completed. {success_count}/{total_emails} successfully delivered.")

if __name__ == "__main__":
    main()
