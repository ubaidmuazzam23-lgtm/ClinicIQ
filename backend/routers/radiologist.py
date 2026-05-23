from fastapi import APIRouter
router = APIRouter()
# FILE: clinicaliq/backend/routers/radiologist.py

from fastapi import APIRouter, Depends, HTTPException
from services.supabase_client import supabase
from middleware.auth import get_current_user
from utils.audit import log_action
import logging, smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


logger = logging.getLogger(__name__)

def send_doctor_email(to_email: str, to_name: str, subject: str,
                      patient_name: str, rad_name: str, findings: str,
                      urgency_flag: bool):
    """Send professional clinical email to doctor only — not patient."""
    try:
        from config import settings
        from datetime import datetime
        smtp_user     = settings.GMAIL_SENDER
        smtp_password = settings.GMAIL_APP_PASSWORD
        if not smtp_user or not smtp_password:
            logger.warning("SMTP not configured")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"ClinicalIQ Radiology <{smtp_user}>"
        msg["To"]      = to_email

        report_date = datetime.utcnow().strftime("%d %B %Y, %I:%M %p UTC")
        urgency_html = ""
        if urgency_flag:
            urgency_html = """<tr><td style="padding:0 32px 16px;">
              <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:12px 16px;">
                <p style="color:#dc2626;font-weight:700;margin:0;font-size:13px;">⚠ URGENT — Immediate clinical action required</p>
              </div></td></tr>"""

        findings_html = findings.replace("\n", "<br>")

        html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#0d1f2d,#1a3a4a);padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="color:#D77A61;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px;">ClinicalIQ</p>
        <p style="color:rgba(255,255,255,0.45);font-size:10px;margin:4px 0 0;letter-spacing:0.1em;text-transform:uppercase;">AI-Powered Clinical Intelligence</p>
      </td>
      <td align="right">
        <p style="color:rgba(255,255,255,0.4);font-size:9px;margin:0;text-transform:uppercase;letter-spacing:0.06em;">In partnership with</p>
        <p style="color:#e07b3f;font-size:18px;font-weight:800;margin:2px 0 0;letter-spacing:-0.5px;">PwC</p>
        <p style="color:rgba(255,255,255,0.35);font-size:9px;margin:1px 0 0;">Technology &amp; Innovation</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- SUBJECT LINE -->
  <tr><td style="background:#D77A61;padding:12px 32px;">
    <p style="color:#fff;font-size:13px;font-weight:600;margin:0;letter-spacing:0.02em;">
      {"⚠ URGENT:" if urgency_flag else "📋"} Radiology Findings Ready — {patient_name}
    </p>
  </td></tr>

  <!-- URGENCY -->
  {urgency_html}

  <!-- BODY -->
  <tr><td style="padding:28px 32px 0;">
    <p style="color:#1a3a4a;font-size:15px;font-weight:600;margin:0 0 6px;">Dear {to_name},</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 20px;">The radiology report for your patient has been reviewed and findings are ready for your clinical action.</p>
  </td></tr>

  <!-- PATIENT INFO BOX -->
  <tr><td style="padding:0 32px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%">
              <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 3px;">Patient</p>
              <p style="color:#1a3a4a;font-size:14px;font-weight:600;margin:0;">{patient_name}</p>
            </td>
            <td width="50%">
              <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 3px;">Reviewed by</p>
              <p style="color:#1a3a4a;font-size:14px;font-weight:600;margin:0;">{rad_name}</p>
            </td>
          </tr>
          <tr><td colspan="2" style="padding-top:12px;">
            <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 3px;">Report date</p>
            <p style="color:#1a3a4a;font-size:13px;margin:0;">{report_date}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FINDINGS -->
  <tr><td style="padding:0 32px 20px;">
    <p style="color:#1a3a4a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Radiologist Findings</p>
    <div style="background:#fafafa;border-left:3px solid #D77A61;border-radius:4px;padding:14px 16px;">
      <p style="color:#334155;font-size:13px;line-height:1.7;margin:0;">{findings_html}</p>
    </div>
  </td></tr>

  <!-- ACTION -->
  <tr><td style="padding:0 32px 28px;">
    <p style="color:#64748b;font-size:13px;margin:0 0 14px;">Please log in to ClinicalIQ to review the full report, update the HITL queue, and take appropriate clinical action.</p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#D77A61;border-radius:6px;padding:10px 22px;">
      <a href="http://localhost:5173/doctor/dashboard" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">View in ClinicalIQ Dashboard →</a>
    </td></tr></table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>

  <!-- SIGNATURE -->
  <tr><td style="padding:20px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="color:#1a3a4a;font-size:13px;font-weight:700;margin:0;">Ubaid Muazzam Kundlik</p>
        <p style="color:#64748b;font-size:12px;margin:2px 0 0;">Chief Executive Officer, ClinicalIQ</p>
        <p style="color:#D77A61;font-size:11px;margin:2px 0 0;">PwC Technology &amp; Innovation Partner</p>
      </td>
      <td align="right">
        <p style="color:#94a3b8;font-size:10px;margin:0;">ClinicalIQ · Powered by PwC</p>
        <p style="color:#94a3b8;font-size:10px;margin:2px 0 0;">AI Clinical Intelligence Platform</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0d1f2d;padding:16px 32px;">
    <p style="color:rgba(255,255,255,0.35);font-size:10px;margin:0;text-align:center;">
      This email is intended for clinical staff only. Confidential medical information enclosed.<br>
      © 2026 ClinicalIQ · In partnership with PwC · All rights reserved.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""

        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())

        logger.info(f"Doctor email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


@router.get("/queue")
async def get_radiology_queue(user: dict = Depends(get_current_user)):
    """Get all radiology cases assigned to this radiologist."""
    if user["role"] not in ["radiologist", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        # Get assignments for this radiologist
        assignments = supabase.table("assignments")\
            .select("*")\
            .eq("doctor_id", user["user_id"])\
            .order("created_at", desc=True)\
            .execute()

        cases = []
        seen_patients = set()

        for a in (assignments.data or []):
            pid = a["patient_id"]
            if pid in seen_patients:
                continue
            seen_patients.add(pid)

            # Get patient
            patient = supabase.table("profiles")\
                .select("id,full_name,email,mrn,age")\
                .eq("id", pid).execute()

            # Get radiology documents
            docs = supabase.table("documents")\
                .select("*")\
                .eq("patient_id", pid)\
                .in_("category", ["radiology","imaging","xray","mri","ct","ultrasound"])\
                .order("created_at", desc=True)\
                .execute()

            # Get all docs if no radiology-specific ones
            if not docs.data:
                docs = supabase.table("documents")\
                    .select("*")\
                    .eq("patient_id", pid)\
                    .order("created_at", desc=True)\
                    .execute()

            # Get latest radiology report
            reports = supabase.table("reports")\
                .select("*")\
                .eq("patient_id", pid)\
                .order("created_at", desc=True)\
                .limit(5)\
                .execute()

            # Find best radiology report
            rad_report = None
            for r in (reports.data or []):
                rj = r.get("response_json") or {}
                rad = rj.get("radiology") or {}
                if rad.get("confidence", 0) > 0.2:
                    rad_report = r
                    break

            if not rad_report and reports.data:
                rad_report = reports.data[0]

            # Skip if already reviewed by this radiologist
            if rad_report and rad_report.get("approved_by") == user["user_id"]:
                continue

            cases.append({
                "assignment":  a,
                "patient":     patient.data[0] if patient.data else None,
                "documents":   docs.data or [],
                "report":      rad_report,
                "urgency":     "urgent" if rad_report and rad_report.get("emergency_flag") else "routine",
                "waiting":     _calc_waiting(a.get("created_at","")),
            })

        return {"cases": cases, "total": len(cases)}
    except Exception as e:
        logger.error(f"Queue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-findings/{report_id}")
async def submit_findings(report_id: str, body: dict, user: dict = Depends(get_current_user)):
    """Radiologist submits their findings for a case."""
    if user["role"] not in ["radiologist", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        findings      = body.get("findings", "")
        urgency_flag  = body.get("urgency_flag", False)
        patient_id    = body.get("patient_id", "")

        # Update report with radiologist findings
        supabase.table("reports").update({
            "approved":      True,
            "approved_by":   user["user_id"],
            "approved_at":   datetime.utcnow().isoformat(),
            "doctor_notes":  findings,
        }).eq("id", report_id).execute()

        # Get patient info
        patient = supabase.table("profiles")\
            .select("full_name,email")\
            .eq("id", patient_id).execute()
        patient_name  = patient.data[0]["full_name"]  if patient.data else "Patient"
        patient_email = patient.data[0]["email"]      if patient.data else ""

        # Get referring doctor from assignment
        assignment = supabase.table("assignments")\
            .select("doctor_id")\
            .eq("patient_id", patient_id)\
            .neq("doctor_id", user["user_id"])\
            .limit(1).execute()

        rad_name = user.get("full_name", "Radiologist")

        # Send chat message to patient
        try:
            supabase.table("chat_messages").insert({
                "sender_id":   user["user_id"],
                "receiver_id": patient_id,
                "message": (
                    f"Dear {patient_name},\n\n"
                    f"Your imaging study has been reviewed by {rad_name}.\n\n"
                    f"Findings: {findings[:300]}\n\n"
                    f"Please check your Reports section for the full details and follow up with your referring doctor.\n\n"
                    f"Best regards,\n{rad_name}"
                ),
                "role":  "doctor",
                "read":  False,
            }).execute()
        except Exception as ce:
            logger.warning(f"Chat message to patient failed: {ce}")

        # Send chat message to referring doctor
        if assignment.data:
            try:
                supabase.table("chat_messages").insert({
                    "sender_id":   user["user_id"],
                    "receiver_id": assignment.data[0]["doctor_id"],
                    "message": (
                        f"Dear Doctor,\n\n"
                        f"I have completed the radiology review for your patient {patient_name}.\n\n"
                        f"{'⚠ URGENT FINDING — Immediate action required.' if urgency_flag else 'Routine findings.'}\n\n"
                        f"Findings:\n{findings}\n\n"
                        f"Please review and take appropriate clinical action.\n\n"
                        f"Best regards,\n{rad_name}\nRadiologist"
                    ),
                    "role":  "doctor",
                    "read":  False,
                }).execute()
            except Exception as ce:
                logger.warning(f"Chat message to doctor failed: {ce}")

        # Send email to referring doctor
        if assignment.data:
            doc = supabase.table("profiles")\
                .select("full_name,email")\
                .eq("id", assignment.data[0]["doctor_id"]).execute()
            if doc.data:
                doc_name  = doc.data[0]["full_name"]
                doc_email = doc.data[0]["email"]
                subject = f"[ClinicalIQ] Radiology findings ready — {patient_name}"
                email_body = (
                    f"Dear {doc_name},\n\n"
                    f"Radiology findings for your patient <b>{patient_name}</b> are now available.\n\n"
                    f"<b>Reviewed by:</b> {rad_name}<br>"
                    f"<b>Urgency:</b> {'⚠ URGENT — Immediate action required' if urgency_flag else 'Routine'}<br><br>"
                    f"<b>Findings summary:</b><br>{findings[:500]}\n\n"
                    f"Please log in to ClinicalIQ to view the full report and take necessary action."
                )
                send_doctor_email(doc_email, doc_name, subject, patient_name, rad_name, findings, urgency_flag)
                send_doctor_email("pilotubaid1@gmail.com", doc_name, subject, patient_name, rad_name, findings, urgency_flag)

        # Send email to patient
        if patient_email:
            subject = "[ClinicalIQ] Your imaging results are ready"
            email_body = (
                f"Dear {patient_name},\n\n"
                f"Your imaging study has been reviewed by {rad_name}.\n\n"
                f"{'⚠ Your results contain an urgent finding. Please contact your doctor immediately.' if urgency_flag else 'Your results are available in your ClinicalIQ patient portal.'}\n\n"
                f"Please log in to view your full report and follow up with your doctor."
            )

        log_action(user["user_id"], "FINDINGS_SUBMITTED", {"report_id": report_id, "patient_id": patient_id, "urgent": urgency_flag})
        return {
            "status":        "submitted",
            "findings_saved": True,
            "emails_sent":   True,
        }
    except Exception as e:
        logger.error(f"Submit findings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-stats")
async def get_radiologist_stats(user: dict = Depends(get_current_user)):
    """Get radiologist performance stats."""
    if user["role"] not in ["radiologist", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        assignments = supabase.table("assignments")\
            .select("patient_id")\
            .eq("doctor_id", user["user_id"]).execute()

        patient_ids = [a["patient_id"] for a in (assignments.data or [])]

        reviewed = supabase.table("reports")\
            .select("id,emergency_flag,created_at")\
            .eq("approved_by", user["user_id"]).execute()

        return {
            "total_assigned":  len(set(patient_ids)),
            "reviewed_today":  len([r for r in (reviewed.data or []) if r["created_at"][:10] == datetime.utcnow().date().isoformat()]),
            "total_reviewed":  len(reviewed.data or []),
            "urgent_cases":    len([r for r in (reviewed.data or []) if r.get("emergency_flag")]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _calc_waiting(created_at: str) -> str:
    """Calculate how long ago a case was created."""
    try:
        from datetime import timezone
        created = datetime.fromisoformat(created_at.replace("Z","+00:00"))
        now     = datetime.now(timezone.utc)
        diff    = int((now - created).total_seconds() / 60)
        if diff < 60:   return f"{diff} min"
        if diff < 1440: return f"{diff//60} h"
        return f"{diff//1440} d"
    except:
        return "—"

@router.get("/reviewed-cases")
async def get_reviewed_cases(user: dict = Depends(get_current_user)):
    """Get all cases reviewed by this radiologist."""
    if user["role"] not in ["radiologist", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        reviewed = supabase.table("reports")            .select("*")            .eq("approved_by", user["user_id"])            .order("approved_at", desc=True)            .execute()

        cases = []
        for r in (reviewed.data or []):
            patient = supabase.table("profiles")                .select("id,full_name,email")                .eq("id", r["patient_id"]).execute()
            docs = supabase.table("documents")                .select("*")                .eq("patient_id", r["patient_id"]).execute()
            cases.append({
                "report":    r,
                "patient":   patient.data[0] if patient.data else {},
                "documents": docs.data or [],
                "urgency":   "urgent" if r.get("emergency_flag") else "routine",
            })

        return {"cases": cases, "total": len(cases)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
