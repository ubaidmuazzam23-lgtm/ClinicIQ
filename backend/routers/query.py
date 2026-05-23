from fastapi import APIRouter
router = APIRouter()
# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/routers/query.py
# ─────────────────────────────────────────────────────────────

import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from middleware.auth import get_current_user
from agents.orchestrator import run_orchestrator
from utils.audit import log_action

router   = APIRouter()
logger   = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=4)

class QueryRequest(BaseModel):
    query_text: str
    patient_id: Optional[str] = None

@router.post("/")
async def run_query(
    body: QueryRequest,
    user: dict = Depends(get_current_user),
):
    """
    Main clinical query endpoint.
    Runs all 3 agents in parallel via orchestrator.
    Returns role-filtered result.
    """
    import asyncio
    from functools import partial

    # Determine patient_id
    if user["role"] == "patient":
        patient_id = user["user_id"]
    elif body.patient_id:
        patient_id = body.patient_id
    else:
        raise HTTPException(
            status_code=400,
            detail="patient_id required for doctor/admin queries"
        )

    logger.info(f"Query from {user['role']} {user['user_id']} for patient {patient_id}")

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            partial(
                run_orchestrator,
                query=body.query_text,
                patient_id=patient_id,
                role=user["role"],
                user_id=user["user_id"],
            )
        )
        return result

    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports")
async def get_reports(user: dict = Depends(get_current_user)):
    """Get all reports for the current user."""
    from services.supabase_client import supabase
    try:
        if user["role"] == "patient":
            result = supabase.table("reports")\
                .select("*")\
                .eq("patient_id", user["user_id"])\
                .order("created_at", desc=True)\
                .execute()
        else:
            result = supabase.table("reports")\
                .select("*")\
                .order("created_at", desc=True)\
                .execute()
        return {"reports": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-report/{report_id}")
async def download_report(report_id: str, user: dict = Depends(get_current_user)):
    """Generate a downloadable text summary of a report."""
    from fastapi.responses import PlainTextResponse
    try:
        result = supabase.table("reports").select("*").eq("id", report_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")

        r  = result.data[0]
        rj = r.get("response_json") or {}
        clean_q = (r.get("query_text") or "").replace("[Referring to:", "").split("]")[-1].strip()

        lines = []
        lines.append("=" * 60)
        lines.append("CLINICALIQ — PATIENT REPORT")
        lines.append("=" * 60)
        lines.append(f"Query: {clean_q}")
        lines.append(f"Date:  {r.get('created_at','')[:10]}")
        lines.append(f"Confidence: {int((r.get('confidence') or 0) * 100)}%")
        lines.append(f"Agents: {', '.join(r.get('agents_used') or [])}")
        lines.append("")

        if rj.get("patient_summary"):
            lines.append("SUMMARY")
            lines.append("-" * 40)
            lines.append(rj["patient_summary"])
            lines.append("")

        lab = rj.get("lab") or {}
        if lab.get("tests"):
            lines.append("LAB RESULTS")
            lines.append("-" * 40)
            for t in lab["tests"]:
                flag = "" if t.get("status") in ["normal","ok"] else f" ← {t.get('status','').upper()}"
                lines.append(f"{t.get('name',''):30} {t.get('value',''):8} {t.get('unit',''):15} Ref: {t.get('reference_range','')}{flag}")
            if lab.get("summary"):
                lines.append("")
                lines.append(lab["summary"])
            lines.append("")

        allergy = rj.get("allergy") or {}
        if allergy.get("allergies"):
            lines.append("ALLERGY SAFETY")
            lines.append("-" * 40)
            for a in allergy["allergies"]:
                lines.append(f"⚠ {a.get('allergen','')} — {a.get('severity','').upper()}")
                if a.get("cross_reactivities"):
                    lines.append(f"  Cross-reactive: {', '.join(a['cross_reactivities'])}")
                if a.get("safe_alternatives"):
                    lines.append(f"  Safe alternatives: {', '.join(a['safe_alternatives'])}")
            lines.append("")

        radiology = rj.get("radiology") or {}
        if radiology.get("confidence", 0) > 0.2 and radiology.get("findings"):
            lines.append("RADIOLOGY")
            lines.append("-" * 40)
            lines.append(radiology["findings"])
            lines.append("")

        if lab.get("recommendations"):
            lines.append("RECOMMENDATIONS")
            lines.append("-" * 40)
            for i, rec in enumerate(lab["recommendations"], 1):
                lines.append(f"{i}. {rec}")
            lines.append("")

        if r.get("emergency_flag"):
            lines.append("⚠ EMERGENCY FLAG RAISED")
        if r.get("hitl_required"):
            lines.append(f"⚠ HITL REQUIRED: {rj.get('hitl_reason','')}")

        lines.append("")
        lines.append("=" * 60)
        lines.append("Generated by ClinicalIQ AI. Always consult your doctor.")
        lines.append("=" * 60)

        content_text = "\n".join(lines)
        return PlainTextResponse(
            content=content_text,
            headers={"Content-Disposition": f"attachment; filename=report_{report_id[:8]}.txt"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve-report/{report_id}")
async def approve_report(report_id: str, user: dict = Depends(get_current_user)):
    """Doctor approves a HITL report."""
    try:
        from datetime import datetime
        from services.supabase_client import supabase as sb
        sb.table("reports").update({
            "approved":    True,
            "approved_by": user["user_id"],
            "approved_at": datetime.utcnow().isoformat(),
        }).eq("id", report_id).execute()

        # Auto-send chat message to patient
        try:
            from services.supabase_client import supabase as sb2
            # Get report to find patient
            report = sb2.table("reports").select("patient_id,query_text").eq("id", report_id).execute()
            if report.data:
                patient_id = report.data[0]["patient_id"]
                query_text = (report.data[0].get("query_text") or "").replace("[Referring to:", "").split("]")[-1].strip()[:60]
                doctor = sb2.table("profiles").select("full_name").eq("id", user["user_id"]).execute()
                doctor_name = doctor.data[0]["full_name"] if doctor.data else "Your doctor"

                message = (
                    f"Dear Patient,\n\n"
                    f"I have reviewed your recent health query: \"{query_text}\".\n\n"
                    f"The AI-generated results have been clinically reviewed and confirmed by me. "
                    f"You can trust the findings in your report. Please check your Reports section for the full details.\n\n"
                    f"If you have any questions, feel free to message me here.\n\n"
                    f"Best regards,\n{doctor_name}"
                )

                sb2.table("chat_messages").insert({
                    "sender_id":   user["user_id"],
                    "receiver_id": patient_id,
                    "message":     message,
                    "role":        "doctor",
                    "read":        False,
                }).execute()
        except Exception as ce:
            logger.warning(f"Chat notification failed: {ce}")

        return {"status": "approved"}
    except Exception as e:
        logger.error(f"Approve error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/consult-doctor/{report_id}")
async def consult_doctor(report_id: str, user: dict = Depends(get_current_user)):
    """Patient chooses to consult a doctor about their query result."""
    from services.supabase_client import supabase as sb
    from datetime import datetime
    try:
        report = sb.table("reports").select("*").eq("id", report_id).execute()
        if not report.data:
            raise HTTPException(status_code=404, detail="Report not found")
        r = report.data[0]

        sb.table("reports").update({
            "hitl_required": True,
        }).eq("id", report_id).execute()

        assignment = sb.table("assignments")            .select("doctor_id")            .eq("patient_id", user["user_id"])            .order("created_at", desc=True)            .limit(1).execute()

        if assignment.data:
            doctor_id = assignment.data[0]["doctor_id"]
            patient = sb.table("profiles").select("full_name").eq("id", user["user_id"]).execute()
            patient_name = patient.data[0]["full_name"] if patient.data else "Patient"
            query_text = (r.get("query_text","") or "")[:80]

            sb.table("chat_messages").insert({
                "sender_id":   user["user_id"],
                "receiver_id": doctor_id,
                "message":     f"Dear Doctor,\n\n{patient_name} has requested a consultation regarding their recent query:\n\n\"{query_text}\"\n\nPlease review their report in the Human Review queue.\n\nRegards,\nClinicalIQ System",
                "role":        "system",
                "read":        False,
            }).execute()

        log_action(user["user_id"], "CONSULT_REQUESTED", {"report_id": report_id})

        # Get doctor info to return to frontend
        doctor_info = None
        if assignment.data:
            doc = sb.table("profiles")                .select("full_name,email,specialization,role")                .eq("id", assignment.data[0]["doctor_id"]).execute()
            if doc.data:
                doctor_info = doc.data[0]

        return {
            "status":       "consultation_requested",
            "hitl_raised":  True,
            "doctor":       doctor_info,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
