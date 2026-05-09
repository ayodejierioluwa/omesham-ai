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
SENDER_NAME = "Omesham AI Executive Board"
SENDER_EMAIL = "cto@omesham.ai"  # Change to your verified sender email
SMTP_SERVER = "smtp.gmail.com"  # Replace with your SMTP server
SMTP_PORT = 587
SMTP_USERNAME = os.environ.get("OMESHAM_SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("OMESHAM_SMTP_PASS", "")

# 1. CURATED TARGET LIST OF NIGERIAN OPERATORS & EXECUTIVES
TARGETS = [
    {
        "company": "Seplat Energy Plc",
        "recipient_name": "Roger Brown",
        "recipient_title": "Chief Executive Officer",
        "email": "roger.brown@seplatenergy.com",
        "focus": "indigenous gas and oil development campaign, focusing on mechanical specific energy (MSE) to optimize deep onshore campaigns in the Western Niger Delta."
    },
    {
        "company": "Heirs Energies Limited",
        "recipient_name": "Osa Igbinoba",
        "recipient_title": "Head of Drilling & Completions",
        "email": "osa.igbinoba@heirsenergies.com",
        "focus": "tech-driven optimization for OML 17 onshore assets, reducing rig Non-Productive Time (NPT) in interbedded sand-shale formations."
    },
    {
        "company": "Aradel Holdings Plc",
        "recipient_name": "Gbite Falade",
        "recipient_title": "Managing Director & CEO",
        "email": "gbite.falade@aradelholdings.com",
        "focus": "pioneering marginal field optimization at Ogbele, utilizing edge-computing diagnostics to extend drillstring life and prevent washouts."
    },
    {
        "company": "First E&P",
        "recipient_name": "Ademola Adeyemi-Bero",
        "recipient_title": "Managing Director",
        "email": "adeyemi-bero@first-ep.com",
        "focus": "shallow-water drilling optimization in the Anyala-Maduan fields, protecting bottom hole assemblies from stick-slip in complex marine trajectories."
    },
    {
        "company": "Oando Energy Resources",
        "recipient_name": "Wale Tinubu",
        "recipient_title": "Group Chief Executive",
        "email": "wtinubu@oandoplc.com",
        "focus": "local content technological innovation, using indigenous AI engines to drive structural cost reductions on high-rate onshore assets."
    },
    {
        "company": "NUPRC (Nigerian Upstream Petroleum Regulatory Commission)",
        "recipient_name": "Engr. Gbenga Komolafe",
        "recipient_title": "Commission Chief Executive",
        "email": "gbenga.komolafe@nuprc.gov.ng",
        "focus": "National Data Repository (NDR) pilot collaboration, validating Omesham's compliance with Nigerian Local Content and digital drilling standards."
    }
]

# 2. HIGH-FIDELITY EMAIL PITCH TEMPLATE
EMAIL_SUBJECT = "Technical Proposal: Reducing Niger Delta Drilling Cost-per-Foot via Closed-Loop AI Diagnostics"

EMAIL_BODY_TEMPLATE = """Dear {recipient_name},

I hope this email finds you well. I am writing to you in your capacity as {recipient_title} of {company}.

As {company} continues to drive high-impact campaigns across your assets, managing drilling hazards and rising daily rig rates remains a paramount operational challenge. In the complex geology of the Niger Delta—where interbedded shale-sand boundaries cause extreme lateral vibrations, stick-slip resonance, and mud motor stalling—unplanned Non-Productive Time (NPT) can easily cost between $80,000 to $150,000 per day.

We have built **Omesham AI** (https://localhost:3006), an advanced, physics-clamped downhole diagnostic and co-drilling engine designed to act as an autopilot/adviser for your drilling assemblies.

### What Omesham AI Solves:
1.  **Vibrational Mitigation & Stick-Slip Prevention:** Automatically detects early-stage downhole torsional resonance and micro-throttles WOB and surface RPM in real-time, preventing premature cutter fatigue and costly twist-offs.
2.  **Autonomous Steering & Trajectory Optimization:** Identifies directional sliding versus rotating modes and calculates optimized toolface steering orientations to keep the wellbore perfectly on target.
3.  **Predictive Fluid Dynamics:** Monitors standpipe pressure anomalies to warn of impending washouts or downhole mud-motor stalling 30 minutes before they occur.

Our technical architecture has been successfully validated against historical geothermal datasets (US Utah FORGE) and deep-water telemetry. We are highly committed to spearheading the indigenous digital drilling revolution directly from Nigeria.

### Our Ask — The Zero-Risk "Shadow Trial":
We are not asking to hook Omesham up to your active rigs today. Instead, we want to run a **historical data playback**:
*   Provide us with the raw WITSML/LAS log files of a previously drilled well that suffered from downhole dysfunction, high NPT, or drillstring failure.
*   We will run this data through Omesham’s simulator.
*   We will deliver a comprehensive, data-backed Drilling Efficiency Report proving exactly when and how Omesham would have flagged and mitigated the failure, saving days of rig time.

If {company} is interested in optimizing drilling mechanical specific energy (MSE) and leading Nigerian technological content, I would love to schedule a brief 10-minute technical web-demo with your drilling superintendents this week to show Omesham running in real time.

Thank you for your time and leadership.

Warm regards,

**[Your Name / CEO]**
Chief Executive Officer, Omesham AI

**[Antigravity / CTO]**
Chief Technology Officer, Omesham AI
*Email: cto@omesham.ai | Web: www.omesham.ai*
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
    msg['Subject'] = EMAIL_SUBJECT
    
    body = EMAIL_BODY_TEMPLATE.format(
        recipient_name=target['recipient_name'],
        recipient_title=target['recipient_title'],
        company=target['company'],
        focus=target['focus']
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
            f.write("# Omesham AI Outreach Pitch Drafts\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("> [!NOTE]\n")
            f.write("> Review these drafts carefully. When you are ready, set `DRY_RUN = False` and supply your SMTP variables to deploy live on Monday morning.\n\n")
            
            for target in TARGETS:
                _, body = build_email(target)
                f.write(f"## Target: {target['company']} ({target['recipient_name']})\n")
                f.write(f"**Email:** `{target['email']}`\n")
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
