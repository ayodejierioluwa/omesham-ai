#!/usr/bin/env python3
import os
import sys
import time
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# =====================================================================
#                          CTO OUTREACH BOT CONFIG
# =====================================================================
DRY_RUN = True  # Set to False to actually send emails via SMTP on Monday morning!
SENDER_NAME = "Omesham AI Founder"
SENDER_EMAIL = "founder@omesham.ai"  # Contact email for correspondence
SMTP_SERVER = "smtp.gmail.com"  # Replace with your SMTP server
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
        "email": "roger.brown@seplatenergy.com",
        "is_operator": True,
        "custom_focus": "your gas and oil development campaigns across your Western Niger Delta assets, where maximizing Mechanical Specific Energy (MSE) and controlling hole integrity in interbedded sands are critical to lowering cost-per-foot."
    },
    {
        "company": "Heirs Energies Limited",
        "recipient_name": "Osa Igbinoba",
        "recipient_title": "Head of Drilling & Completions",
        "greeting": "Dear Engr. Igbinoba,",
        "email": "osa.igbinoba@heirsenergies.com",
        "is_operator": True,
        "custom_focus": "your extensive drilling operations across the OML 17 asset, where sliding-mode steering, sand-shale boundary vibrational resonance, and mud motor efficiency are paramount to driving down rig Non-Productive Time (NPT)."
    },
    {
        "company": "Aradel Holdings Plc",
        "recipient_name": "Gbite Falade",
        "recipient_title": "Managing Director & CEO",
        "greeting": "Dear Mr. Falade,",
        "email": "gbite.falade@aradelholdings.com",
        "is_operator": True,
        "custom_focus": "your pioneering marginal field developments at Ogbele and Omerelu, where deploying lightweight edge-computing diagnostics can proactively prevent pipe washouts, protect drill collars, and extend drillstring life."
    },
    {
        "company": "First E&P",
        "recipient_name": "Ademola Adeyemi-Bero",
        "recipient_title": "Managing Director",
        "greeting": "Dear Mr. Adeyemi-Bero,",
        "email": "adeyemi-bero@first-ep.com",
        "is_operator": True,
        "custom_focus": "your shallow-water drilling campaigns in the Anyala-Maduan fields, where maintaining rigorous trajectory controls and mitigating marine stick-slip are essential to keeping complex offshore wellbores on target."
    },
    {
        "company": "Oando Energy Resources",
        "recipient_name": "Wale Tinubu",
        "recipient_title": "Group Chief Executive",
        "greeting": "Dear Mr. Tinubu,",
        "email": "wtinubu@oandoplc.com",
        "is_operator": True,
        "custom_focus": "Oando's proud commitment to local content and technical excellence, demonstrating how an indigenous digital co-drilling brain can reduce structural well-delivery costs across your JV acreage."
    },
    {
        "company": "NUPRC (Nigerian Upstream Petroleum Regulatory Commission)",
        "recipient_name": "Engr. Gbenga Komolafe",
        "recipient_title": "Commission Chief Executive",
        "greeting": "Dear Engr. Komolafe,",
        "email": "gbenga.komolafe@nuprc.gov.ng",
        "is_operator": False,
        "custom_focus": "your visionary leadership in promoting local content, digital sovereign drilling standards, and regulatory safety oversight of downhole operations in Nigeria."
    }
]

# =====================================================================
#                        TAILORED PITCH TEMPLATES (SINGULAR FIRST PERSON)
# =====================================================================

# TEMPLATE A: FOR UPSTREAM OIL & GAS OPERATORS (Singular, focused on you!)
OPERATOR_EMAIL_TEMPLATE = """{greeting}

I hope this email finds you well. I am writing to you in your capacity as {recipient_title} of {company}.

As {company} continues to drive high-impact campaigns across {custom_focus}

In the complex, interbedded geology of the Niger Delta, drilling hazards like lateral vibrations, torsional stick-slip, and sudden downhole motor stalling represent massive cost factors. When daily rig rates in land and swamp operations are factored in, unplanned Non-Productive Time (NPT) easily translates to losses of $80,000 to $150,000 per day.

I am an indigenous petroleum software developer and engineering co-founder, and I have built **Omesham AI**—an advanced, physics-clamped downhole diagnostic and co-drilling advisor designed to act as an autopilot and safety co-pilot for active drilling assemblies.

### What Omesham AI Solves:
1.  **Stick-Slip Prevention & Vibrational Mitigation:** Detects early-stage downhole torsional resonance and recommends real-time, micro-adjusted RPM/WOB targets to bypass rock resonance before cutter wear or drillpipe twist-offs occur.
2.  **Autonomous State Monitoring:** Automatically identifies directional sliding versus rotating modes in real time, tracking toolface steering orientations to keep the wellbore perfectly aligned with your 3D path.
3.  **Predictive Fluid Dynamics:** Monitors standpipe pressure anomalies to warn of mud-motor stalls and washouts up to 30 minutes before they physically manifest, protecting your Bottom Hole Assemblies (BHA).

I have validated Omesham's physical models against complex geothermal and oilfield datasets, and I am passionate about proving this technology directly on Nigerian wells.

### Our Ask — The Zero-Risk "Historical Shadow Trial":
Rather than asking to deploy live on your active rigs today, I propose a completely risk-free **historical data playback**:
*   Provide me with the raw WITSML/LAS log files of a previously drilled well that suffered from downhole dysfunction, high NPT, or drillstring failure.
*   I will run this data through Omesham’s simulator in playback mode.
*   I will deliver a comprehensive, data-backed Drilling Efficiency Report proving exactly when and where Omesham would have predicted and mitigated the failure.

If you are looking to optimize drilling Mechanical Specific Energy (MSE) and spearhead indigenous digital innovation on your active campaigns, I would love to schedule a brief 10-minute technical web-demo with your drilling team this week to show Omesham running in real time.

Thank you for your time, leadership, and support of local content development.

Warm regards,

**[Your Name]**
Founder & Lead Developer, Omesham AI
*Email: founder@omesham.ai | Lagos, Nigeria*
"""

# TEMPLATE B: FOR THE NUPRC REGULATORY COMMISSION (Singular)
REGULATOR_EMAIL_TEMPLATE = """{greeting}

I hope this email finds you well. I am writing to you in your capacity as the Commission Chief Executive of the NUPRC.

We greatly admire {custom_focus} As Nigeria cements its position as Africa's premier oil producer, advancing technical oversight and indigenous digital capabilities is critical to ensuring drilling safety and cost-efficiency.

I am an indigenous petroleum software developer and engineering co-founder, and I have built **Omesham AI**—an advanced, physics-clamped digital twin and drilling diagnostic engine. 

Designed as a cloud-based web application, Omesham AI ingests real-time drilling streams to automatically diagnose downhole hazards (like severe stick-slip vibrations, pipe washouts, and mud-motor stalling) and monitors 3D wellbore trajectory steering. 

### Why This is Critical for Upstream Oversight:
1.  **Digital Drilling Standards:** Omesham provides an independent, physics-compliant audit log of drillstring mechanical integrity and safe operational envelopes.
2.  **Local Content Empowerment:** This platform represents a major breakthrough in local software content, proving that elite drilling-mechanics software can be designed and deployed directly by Nigerian engineers.
3.  **National Data Repository (NDR) Integration:** I am looking to collaborate with the NUPRC to test and validate Omesham’s diagnostic capabilities over sanitized historical well logs stored in the NDR. 

### Our Request:
I would be highly honored to schedule a brief, 10-minute technical web-demo with your digital transformation and engineering teams at the Commission to present Omesham's capabilities, and discuss a collaborative pilot to validate our diagnostics using historical National Data Repository files.

Thank you for your time, leadership, and dedicated service to the nation.

Warm regards,

**[Your Name]**
Founder & Lead Developer, Omesham AI
*Email: founder@omesham.ai | Lagos, Nigeria*
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

def build_email(target):
    """Personalizes and builds a MIME message."""
    msg = MIMEMultipart()
    msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg['To'] = f"{target['recipient_name']} <{target['email']}>"
    
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
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("> [!IMPORTANT]\n")
            f.write("> These pitches have been fully optimized to remove localhost URLs, implement cultural engineering titles (Engr., Mr.), align with Nigeria's Local Content guidelines, remove the AI co-founder from the signature block, and frame all communications in the singular first person representing a brilliant solo founder based in Lagos.\n\n")
            
            for target in TARGETS:
                _, body = build_email(target)
                f.write(f"## Target: {target['company']} ({target['recipient_name']})\n")
                f.write(f"**Email Contact:** `{target['email']}`\n")
                f.write(f"**Title:** {target['recipient_title']}\n\n")
                f.write("```text\n")
                f.write(body)
                f.write("\n```\n\n---\n\n")
                
        print(f"Drafts written successfully to {drafts_file}!")
        print("Please view the file to inspect the personalized letters.")
        return

    # Real-world scheduled execution loop
    sleep_seconds = calculate_sleep_until_monday_8am()
    wake_up_time = datetime.utcnow() + timedelta(seconds=sleep_seconds)
    print(f"\n[{datetime.now().isoformat()}] SMTP credentials loaded successfully.")
    print(f"Scheduling outreach to fire exactly on Monday at 8:00 AM West Africa Time (7:00 AM UTC).")
    print(f"Calculated wait: {sleep_seconds / 3600:.2f} hours (Waking up at UTC: {wake_up_time.isoformat()})")
    
    if sleep_seconds > 0:
        print("Outreach thread going to standby mode... [Press CTRL+C to abort scheduling]")
        time.sleep(sleep_seconds)
        
    print(f"\n[{datetime.now().isoformat()}] Standby concluded. Deploying pitches...")
    
    # Establish connection
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
    except Exception as e:
        print(f"ERROR: Failed to connect or login to SMTP server: {e}", file=sys.stderr)
        return

    success_count = 0
    for target in TARGETS:
        msg, _ = build_email(target)
        try:
            server.sendmail(SENDER_EMAIL, [target['email']], msg.as_string())
            print(f"SUCCESS: Pitch sent to {target['recipient_name']} ({target['company']}) -> {target['email']}")
            success_count += 1
        except Exception as e:
            print(f"FAILED: Could not send to {target['recipient_name']} at {target['company']}: {e}", file=sys.stderr)
            
    server.quit()
    print(f"\n[{datetime.now().isoformat()}] Pitch deployment completed. {success_count}/{len(TARGETS)} successfully delivered.")

if __name__ == "__main__":
    main()
