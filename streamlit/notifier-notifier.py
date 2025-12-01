# notifier/notifier.py
import os
import smtplib
from email.message import EmailMessage
from twilio.rest import Client as TwilioClient
from datetime import datetime

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_FROM")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO")  # comma-separated
ALERT_SMS_TO = os.getenv("ALERT_SMS_TO")      # comma-separated E.164

def send_email(subject, body, to_list):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_list
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)

def send_sms(body, to_number):
    client = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
    client.messages.create(to=to_number, from_=TWILIO_FROM, body=body)

async def notify_bypass_if_needed(payload: dict, supabase_client=None):
    # Decide severity: score > 0.8 high
    score = payload.get("score", 0.0)
    reason = payload.get("reason", "unknown")
    order = payload.get("order_id")
    prod = payload.get("producer_id")
    created = payload.get("created_at", datetime.utcnow().isoformat())

    subject = f"[ALERTA BYPASS] {reason} - order #{order}"
    body = f"Alerta bypass detectada:\n\norder: {order}\nproducer: {prod}\nreason: {reason}\nscore: {score}\ncreated: {created}\n\nPayload: {payload}"

    # Always log to supabase table `bypass_alerts_log` for audit (optional)
    try:
        if supabase_client:
            supabase_client.table("bypass_alerts_log").insert({
                "order_id": order,
                "producer_id": prod,
                "reason": reason,
                "score": score,
                "payload": payload,
                "created_at": created
            }).execute()
    except Exception as e:
        # log to stdout; don't raise
        print("Error logging bypass to supabase:", e)

    # Escalation: high score => email + SMS; medium score => email
    if score >= 0.8:
        if SMTP_HOST and SMTP_USER:
            send_email(subject, body, os.getenv("ALERT_EMAIL_TO"))
        if TWILIO_SID and TWILIO_TOKEN and os.getenv("ALERT_SMS_TO"):
            for n in os.getenv("ALERT_SMS_TO").split(","):
                send_sms(subject + "\n" + reason, n.strip())
    elif score >= 0.5:
        if SMTP_HOST and SMTP_USER:
            send_email("[WARNING] " + subject, body, os.getenv("ALERT_EMAIL_TO"))
    else:
        print("Bypass low score; logged only.")
