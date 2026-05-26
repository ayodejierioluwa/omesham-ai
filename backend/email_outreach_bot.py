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
        "greeting": "Dear Mr. Brown,",
        "emails": ["roger.brown@seplatenergy.com", "info@seplatenergy.com", "corporatecommunications@seplatenergy.com"],
        "is_operator": True,
        "custom_focus": "your gas and oil development campaigns across your Western Niger Delta assets, where maximizing Mechanical Specific Energy (MSE) and controlling hole integrity in interbedded sands are critical to lowering cost-per-foot."
    },
    {
        "company": "Heirs Energies Limited",
        "recipient_name": "Osa Igiehon",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Mr. Igiehon,",
        "emails": ["osa.igiehon@heirsenergies.com", "info@heirsenergies.com"],
        "is_operator": True,
        "custom_focus": "your extensive drilling operations across the OML 17 asset, where sliding-mode steering, sand-shale boundary vibrational resonance, and mud motor efficiency are paramount to driving down rig Non-Productive Time (NPT)."
    },
    {
        "company": "Aradel Holdings Plc",
        "recipient_name": "Gbite Falade",
        "recipient_title": "Managing Director & CEO",
        "greeting": "Dear Mr. Falade,",
        "emails": ["g.falade@aradel.com", "info@aradel.com", "corporatecommunications@aradel.com"],
        "is_operator": True,
        "custom_focus": "your pioneering marginal field developments at Ogbele and Omerelu, where deploying lightweight edge-computing diagnostics can proactively prevent pipe washouts, protect drill collars, and extend drillstring life."
    },
    {
        "company": "First E&P",
        "recipient_name": "Ademola Adeyemi-Bero",
        "recipient_title": "Managing Director",
        "greeting": "Dear Mr. Adeyemi-Bero,",
        "emails": ["demola.adeyemibero@first-epdc.com", "adeyemi-bero@first-epdc.com", "info@first-epdc.com"],
        "is_operator": True,
        "custom_focus": "your shallow-water drilling campaigns in the Anyala-Maduan fields, where maintaining rigorous trajectory controls and mitigating marine stick-slip are essential to keeping complex offshore wellbores on target."
    },
    {
        "company": "Oando Energy Resources",
        "recipient_name": "Wale Tinubu",
        "recipient_title": "Group Chief Executive",
        "greeting": "Dear Mr. Tinubu,",
        "emails": ["wtinubu@oandoplc.com", "info@oandoplc.com"],
        "is_operator": True,
        "custom_focus": "Oando's proud commitment to local content and technical excellence, demonstrating how an indigenous digital co-drilling brain can reduce structural well-delivery costs across your JV acreage."
    },
    {
        "company": "ND Western",
        "recipient_name": "Eberechukwu Oji",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Mr. Oji,",
        "emails": ["eberechukwu.oji@ndwestern.com", "info@ndwestern.com"],
        "is_operator": True,
        "custom_focus": "your oil and gas operations in OML 34, where controlling severe lateral vibrations in thick Cretaceous sands and preventing unexpected mud-motor stalls are paramount to keeping rig downtime at zero."
    },
    {
        "company": "Lekoil Nigeria Limited",
        "recipient_name": "Olalekan Adebayo",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Mr. Adebayo,",
        "emails": ["lekan.adebayo@lekoil.com", "info@lekoil.com"],
        "is_operator": True,
        "custom_focus": "your offshore assets in OML 113 and the Otakikpo field, where high wave-induced stick-slip, lateral cutter wear, and standpipe pressure mud leaks can cause catastrophic bottom-hole assembly (BHA) washouts."
    },
    {
        "company": "AMNI International Petroleum Development Company",
        "recipient_name": "Chief Tunde Afolabi",
        "recipient_title": "Chairman & CEO",
        "greeting": "Dear Chief Afolabi,",
        "emails": ["info@amni.com", "tafolabi@amni.com"],
        "is_operator": True,
        "custom_focus": "your offshore operations at the Ima and Okoro fields, where marine stick-slip and rapid formation compaction require real-time, closed-loop RPM and WOB micro-adjustments to protect expensive directional BHAs."
    },
    {
        "company": "Waltersmith Petroman Oil Limited",
        "recipient_name": "Chikezie Nwosu",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Mr. Nwosu,",
        "emails": ["info@waltersmithng.com", "cnwosu@waltersmithng.com"],
        "is_operator": True,
        "custom_focus": "your Ibigwe field development campaigns, where deploying lightweight edge-computed Downhole Vibration Diagnostics (DVD) can prevent structural drillstring failures, maintain hole geometry, and protect bottom-hole assemblies."
    },
    {
        "company": "Eroton Exploration & Production",
        "recipient_name": "Dr. Emeka Onyeka",
        "recipient_title": "Chief Executive Officer",
        "greeting": "Dear Dr. Onyeka,",
        "emails": ["info@eroton-ep.com", "eonyeka@eroton-ep.com"],
        "is_operator": True,
        "custom_focus": "your production and development campaigns in OML 18, where real-time standpipe pressure (SPP) anomaly tracking can predict mud-motor washouts and downhole stalls before they result in expensive rig NPT."
    },
    {
        "company": "NUPRC (Nigerian Upstream Petroleum Regulatory Commission)",
        "recipient_name": "Engr. Gbenga Komolafe",
        "recipient_title": "Commission Chief Executive",
        "greeting": "Dear Engr. Komolafe,",
        "emails": ["nuprc@nuprc.gov.ng", "info@nuprc.gov.ng"],
        "is_operator": False,
        "custom_focus": "your visionary leadership in promoting local content, digital sovereign drilling standards, and regulatory safety oversight of downhole operations in Nigeria."
    }
]

# =====================================================================
#             TAILORED PITCH TEMPLATES (CLEAN PLAIN-TEXT GMAIL FORMAT)
# =====================================================================

# TEMPLATE A: FOR UPSTREAM OIL & GAS OPERATORS
OPERATOR_EMAIL_TEMPLATE = """{greeting}

I hope this email finds you well. I am writing to you in your capacity as {recipient_title} of {company}.

As {company} continues to drive high-impact campaigns across {custom_focus}

In the complex, interbedded geology of the Niger Delta, drilling hazards like lateral vibrations, torsional stick-slip, and sudden downhole motor stalling represent massive cost factors. When daily rig rates in land and swamp operations are factored in, unplanned Non-Productive Time (NPT) easily translates to losses of $80,000 to $150,000 per day.

I am an indigenous petroleum software developer and engineering co-founder, and I have built Omesham AI—the flagship drilling safety and real-time co-piloting module of PetroOne, our unified exploration and operations intelligence suite designed specifically for modern energy operators.

WHAT OMESHAM AI SOLVES:

1. Stick-Slip Prevention & Vibrational Mitigation: Detects early-stage downhole torsional resonance and recommends real-time, micro-adjusted RPM/WOB targets to bypass rock resonance before cutter wear or drillpipe twist-offs occur.

2. Autonomous State Monitoring: Automatically identifies directional sliding versus rotating modes in real time, tracking toolface steering orientations to keep the wellbore perfectly aligned with your 3D path.

3. Predictive Fluid Dynamics: Monitors standpipe pressure anomalies to warn of mud-motor stalls and washouts up to 30 minutes before they physically manifest, protecting your Bottom Hole Assemblies (BHA).

I have validated Omesham's physical models against complex geothermal and oilfield datasets, and I am passionate about proving this technology directly on Nigerian wells.

MY ASK — THE ZERO-RISK "HISTORICAL SHADOW TRIAL":

Rather than asking to deploy live on your active rigs today, I propose a completely risk-free historical data playback:

- Provide me with the raw WITSML/LAS log files of a previously drilled well that suffered from downhole dysfunction, high NPT, or drillstring failure.
- I will run this data through Omesham's simulator in playback mode.
- I will deliver a comprehensive, data-backed Drilling Efficiency Report proving exactly when and where Omesham would have predicted and mitigated the failure.

If you are looking to optimize drilling Mechanical Specific Energy (MSE) and spearhead indigenous digital innovation on your active campaigns, I would love to schedule a brief 10-minute technical web-demo with your drilling team this week to show Omesham running in real time.

Thank you for your time, leadership, and support of local content development.

Warm regards,

Ayodeji Erioluwa
Founder & Lead Developer, PetroOne (Omesham AI)
Email: ayodejierioluwa@gmail.com | Lagos, Nigeria
"""

# TEMPLATE B: FOR THE NUPRC REGULATORY COMMISSION
REGULATOR_EMAIL_TEMPLATE = """{greeting}

I hope this email finds you well. I am writing to you in your capacity as the Commission Chief Executive of the NUPRC.

We greatly admire {custom_focus} As Nigeria cements its position as Africa's premier oil producer, advancing technical oversight and indigenous digital capabilities is critical to ensuring drilling safety and cost-efficiency.

I am an indigenous petroleum software developer and engineering co-founder, and I have built Omesham AI—the flagship drilling safety and real-time co-piloting module of PetroOne, our unified exploration and operations intelligence suite designed specifically for modern energy operators.

Designed as a cloud-based web application, Omesham AI ingests real-time drilling streams to automatically diagnose downhole hazards (like severe stick-slip vibrations, pipe washouts, and mud-motor stalling) and monitors 3D wellbore trajectory steering. 

WHY THIS IS CRITICAL FOR UPSTREAM OVERSIGHT:

1. Digital Drilling Standards: Omesham provides an independent, physics-compliant audit log of drillstring mechanical integrity and safe operational envelopes.

2. Local Content Empowerment: This platform represents a major breakthrough in local software content, proving that elite drilling-mechanics software can be designed and deployed directly by Nigerian engineers.

3. National Data Repository (NDR) Integration: I am looking to collaborate with the NUPRC to test and validate Omesham's diagnostic capabilities over sanitized historical well logs stored in the NDR. 

MY REQUEST:

I would be highly honored to schedule a brief, 10-minute technical web-demo with your digital transformation and engineering teams at the Commission to present Omesham's capabilities, and discuss a collaborative pilot to validate our diagnostics using historical National Data Repository files.

Thank you for your time, leadership, and dedicated service to the nation.

Warm regards,

Ayodeji Erioluwa
Founder & Lead Developer, PetroOne (Omesham AI)
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
        msg['Subject'] = "Proposal: Reducing Niger Delta Drilling Cost-per-Foot via Closed-Loop AI Diagnostics"
        body = OPERATOR_EMAIL_TEMPLATE.format(
            greeting=target['greeting'],
            recipient_name=target['recipient_name'],
            recipient_title=target['recipient_title'],
            company=target['company'],
            custom_focus=target['custom_focus']
        )
    else:
        msg['Subject'] = "Collaboration Proposal: Advancing Upstream Regulatory Safety via Indigenous Digital Twin Tech"
        body = REGULATOR_EMAIL_TEMPLATE.format(
            greeting=target['greeting'],
            custom_focus=target['custom_focus']
        )
        
    msg.attach(MIMEText(body, 'plain'))
    return msg, body

def main():
    print(f"[{datetime.now().isoformat()}] Omesham AI Outreach Bot Initializing...")
    print(f"Target count: {len(TARGETS)} major operators.")
    
    if DRY_RUN:
        print("\n=== DRY RUN ACTIVE: WRITING OUTREACH DRAFTS TO LOCAL MARKDOWN ===")
        drafts_file = "/Users/macbook/.gemini/antigravity/scratch/omesham_ai/backend/outreach_drafts.md"
        
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
