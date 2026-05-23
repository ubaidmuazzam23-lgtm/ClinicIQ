# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/routers/routing.py
# ─────────────────────────────────────────────────────────────

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from utils.audit import log_action
from services.supabase_client import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Specialty classifier ───────────────────────────────────────
SPECIALTY_KEYWORDS = {
    "Hematology":     ["hemoglobin","cbc","anemia","ferritin","rbc","wbc","platelets","blood count","iron","thalassemia"],
    "Endocrinology":  ["thyroid","tsh","t4","t3","diabetes","hba1c","glucose","insulin","cortisol","hormone"],
    "Hepatology":     ["liver","alt","ast","bilirubin","albumin","lft","hepatitis","cirrhosis","fatty liver"],
    "Nephrology":     ["kidney","creatinine","egfr","bun","renal","urine","dialysis","kft"],
    "Cardiology":     ["heart","troponin","ecg","cardiac","chest pain","echocardiogram","cholesterol","lipid"],
    "Pulmonology":    ["lung","chest","xray","x-ray","ct chest","pneumonia","asthma","copd","breathing"],
    "Radiology":      ["mri","ct scan","ultrasound","x-ray","imaging","scan","radiology"],
    "Allergology":    ["allergy","allergen","anaphylaxis","urticaria","igg","ige","sensitivity"],
    "Rheumatology":   ["arthritis","joint","inflammation","autoimmune","lupus","rheumatoid"],
}

def classify_specialty(query_text: str, doc_categories: list) -> tuple[str, float]:
    """Classify query into medical specialty."""
    query_lower = query_text.lower()

    # Score each specialty
    scores = {}
    for specialty, keywords in SPECIALTY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in query_lower)
        if score > 0:
            scores[specialty] = score

    # Boost from document categories
    for cat in doc_categories:
        if 'radiology' in cat:
            scores['Radiology'] = scores.get('Radiology', 0) + 3
        elif 'allergy' in cat:
            scores['Allergology'] = scores.get('Allergology', 0) + 3
        elif 'clinician' in cat:
            scores['Hematology'] = scores.get('Hematology', 0) + 1

    if not scores:
        return "Internal Medicine", 0.6

    best = max(scores, key=scores.get)
    confidence = min(0.95, 0.6 + scores[best] * 0.05)
    return best, confidence


def score_doctor(doctor: dict, specialty: str, urgency: str) -> float:
    """Score a doctor for assignment. Returns 0-1."""
    score = 0.0

    # Specialty match (40 points)
    doc_spec = (doctor.get("specialization") or "").lower()
    doc_sub  = (doctor.get("sub_specialization") or "").lower()
    spec_lower = specialty.lower()

    if spec_lower in doc_spec or spec_lower in doc_sub:
        score += 0.4
    elif "internal" in doc_spec:
        score += 0.2

    # Availability (30 points)
    status = doctor.get("availability_status", "available")
    if status == "available":
        score += 0.3
    elif status == "busy":
        score += 0.1

    # Load (20 points)
    current = doctor.get("current_patient_count", 0) or 0
    maximum = doctor.get("max_patients", 20) or 20
    load_ratio = current / maximum if maximum > 0 else 1
    score += 0.2 * (1 - load_ratio)

    # Urgency bonus (10 points)
    if urgency == "urgent" and status == "available":
        score += 0.1

    return round(score, 3)


@router.post("/assign")
async def assign_doctor(
    patient_id: str,
    query_text: str,
    doc_categories: list = [],
    urgency: str = "routine",
    user: dict = Depends(get_current_user)
):
    """Auto-assign best available doctor to patient."""
    try:
        # Classify specialty
        specialty, conf = classify_specialty(query_text, doc_categories)
        logger.info(f"Classified as {specialty} ({conf:.0%}) for patient {patient_id}")

        # Get all active doctors
        doctors = supabase.table("profiles")\
            .select("*")\
            .eq("role", "doctor")\
            .eq("activated", True)\
            .execute().data or []

        if not doctors:
            raise HTTPException(status_code=404, detail="No doctors available")

        # Score each doctor
        candidates = []
        for doc in doctors:
            score = score_doctor(doc, specialty, urgency)
            candidates.append({
                "doctor_id":   doc["id"],
                "doctor_name": doc["full_name"],
                "specialty":   doc.get("specialization", ""),
                "score":       score,
                "status":      doc.get("availability_status", "available"),
            })

        # Sort by score
        candidates.sort(key=lambda x: x["score"], reverse=True)
        best = candidates[0]

        # Create assignment
        supabase.table("assignments").insert({
            "patient_id":  patient_id,
            "doctor_id":   best["doctor_id"],
            "specialty":   specialty,
            "confidence":  conf,
            "urgency":     urgency,
            "score":       best["score"],
            "candidates":  candidates,
        }).execute()

        # Audit log
        supabase.table("audit_logs").insert({
            "user_id":  user["user_id"],
            "action":   "DOCTOR_ASSIGNED",
            "metadata": {
                "patient_id":  patient_id,
                "doctor_id":   best["doctor_id"],
                "specialty":   specialty,
                "score":       best["score"],
            }
        }).execute()

        logger.info(f"Assigned {best['doctor_name']} to patient {patient_id} (score: {best['score']})")

        return {
            "status":      "assigned",
            "specialty":   specialty,
            "confidence":  conf,
            "assigned_to": best,
            "all_candidates": candidates,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Routing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-assignment")
async def get_my_assignment(user: dict = Depends(get_current_user)):
    """Get patient's current doctor assignment."""
    try:
        result = supabase.table("assignments")\
            .select("*")\
            .eq("patient_id", user["user_id"])\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        if not result.data:
            return {"assignment": None}

        assignment = result.data[0]

        # Get doctor profile
        doctor = supabase.table("profiles")\
            .select("id,full_name,email,specialization,sub_specialization")\
            .eq("id", assignment["doctor_id"])\
            .execute()

        assignment["doctor"] = doctor.data[0] if doctor.data else None
        return {"assignment": assignment}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/log")
async def get_routing_log(user: dict = Depends(get_current_user)):
    """Get full routing log — admin/doctor only."""
    try:
        result = supabase.table("assignments")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        return {"assignments": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-patients")
async def get_my_patients(user: dict = Depends(get_current_user)):
    """Get all patients assigned to this doctor with their latest reports."""
    try:
        assignments = supabase.table("assignments")            .select("*")            .eq("doctor_id", user["user_id"])            .order("created_at", desc=True)            .execute()

        result = []
        seen = set()
        for a in (assignments.data or []):
            pid = a["patient_id"]
            if pid in seen:
                continue
            seen.add(pid)

            # Get patient profile
            patient = supabase.table("profiles")                .select("id,full_name,email,mrn,age,condition")                .eq("id", pid).execute()

            # Get patient reports
            reports = supabase.table("reports")                .select("*")                .eq("patient_id", pid)                .order("created_at", desc=True)                .execute()

            # Get patient documents
            docs = supabase.table("documents")                .select("id,filename,category,chunk_count,created_at")                .eq("patient_id", pid)                .order("created_at", desc=True)                .execute()

            result.append({
                "assignment": a,
                "patient":    patient.data[0] if patient.data else None,
                "reports":    reports.data or [],
                "documents":  docs.data or [],
            })

        return {"patients": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-assignments")
async def get_my_assignments(user: dict = Depends(get_current_user)):
    """Get all doctors/specialists assigned to this patient."""
    try:
        assignments = supabase.table("assignments")            .select("*")            .eq("patient_id", user["user_id"])            .order("created_at", desc=True)            .execute()

        result = []
        for a in (assignments.data or []):
            doctor = supabase.table("profiles")                .select("id,full_name,email,role,specialization,availability_status,imaging_expertise")                .eq("id", a["doctor_id"]).execute()
            if doctor.data:
                # Embed doctor into assignment object for frontend compatibility
                assignment_with_doctor = {**a, "doctor": doctor.data[0]}
                result.append(assignment_with_doctor)
        return {"assignments": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
