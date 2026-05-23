# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/services/email.py
# ─────────────────────────────────────────────────────────────

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to: str, subject: str, body: str) -> bool:
    """Send email via Gmail SMTP."""
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.GMAIL_SENDER
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_SENDER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_SENDER, to, msg.as_string())

        logger.info(f"Email sent to {to}")
        return True

    except Exception as e:
        logger.error(f"Email failed to {to}: {e}")
        return False

def send_activation_email(to: str, full_name: str, role: str, code: str) -> bool:
    """Send activation email with code to new doctor/radiologist."""
    subject = "Activate your ClinicalIQ account"
    body = f"""
    <h2>Welcome to ClinicalIQ, {full_name}!</h2>
    <p>Your account has been created as <strong>{role}</strong>.</p>
    <p>Your activation code is:</p>
    <h1 style="color:#1a73e8; letter-spacing:4px;">{code}</h1>
    <p>Go to <a href="{settings.FRONTEND_URL}/activate">ClinicalIQ Activate</a> 
    and enter your email + this code to set your password.</p>
    <p>This code expires in <strong>24 hours</strong>.</p>
    <p>— ClinicalIQ Team</p>
    """
    return send_email(to, subject, body)

def send_assignment_email_doctor(
    to: str, doctor_name: str, patient_name: str, specialty: str
) -> bool:
    """Notify doctor of new patient assignment."""
    subject = "New Patient Assignment — ClinicalIQ"
    body = f"""
    <h2>New Assignment, Dr. {doctor_name}</h2>
    <p>You have been assigned a new patient: <strong>{patient_name}</strong></p>
    <p>Detected specialty: <strong>{specialty}</strong></p>
    <p>Log in to review their clinical documents and query results.</p>
    <p>— ClinicalIQ System</p>
    """
    return send_email(to, subject, body)

def send_emergency_alert(to: str, doctor_name: str, patient_name: str, alert: str) -> bool:
    """Send emergency alert to doctor."""
    subject = "🚨 EMERGENCY ALERT — ClinicalIQ"
    body = f"""
    <h2 style="color:red;">Emergency Alert, Dr. {doctor_name}</h2>
    <p>Patient: <strong>{patient_name}</strong></p>
    <p>Alert: <strong>{alert}</strong></p>
    <p>Please review immediately in your HITL queue.</p>
    <p>— ClinicalIQ System</p>
    """
    return send_email(to, subject, body)