
# FILE: clinicaliq/backend/routers/chat.py

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from utils.audit import log_action
from services.supabase_client import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

class SendMessageRequest(BaseModel):
    to_user_id: str
    message: str

class GenerateMessageRequest(BaseModel):
    patient_id: str
    report_id: Optional[str] = None

@router.post("/send")
async def send_message(body: SendMessageRequest, user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("chat_messages").insert({
            "sender_id":   user["user_id"],
            "receiver_id": body.to_user_id,
            "message":     body.message,
            "role":        user["role"],
            "read":        False,
        }).execute()
        return {"status": "sent", "message": result.data[0]}
    except Exception as e:
        logger.error(f"Send error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, user: dict = Depends(get_current_user)):
    try:
        sent = supabase.table("chat_messages")\
            .select("*")\
            .eq("sender_id", user["user_id"])\
            .eq("receiver_id", other_user_id)\
            .execute()

        received = supabase.table("chat_messages")\
            .select("*")\
            .eq("sender_id", other_user_id)\
            .eq("receiver_id", user["user_id"])\
            .execute()

        all_messages = (sent.data or []) + (received.data or [])
        all_messages.sort(key=lambda x: x["created_at"])
        return {"messages": all_messages}
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contacts")
async def get_contacts(user: dict = Depends(get_current_user)):
    try:
        if user["role"] == "patient":
            doctors = supabase.table("profiles")\
                .select("id,full_name,email,role,specialization,sub_specialization,availability_status")\
                .in_("role", ["doctor", "radiologist"])\
                .eq("activated", True)\
                .execute()
            return {"contacts": doctors.data or []}
        else:
            patients = supabase.table("profiles")\
                .select("id,full_name,email,role")\
                .eq("role", "patient")\
                .eq("activated", True)\
                .execute()
            return {"contacts": patients.data or []}
    except Exception as e:
        logger.error(f"Contacts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unread")
async def get_unread_count(user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("chat_messages")\
            .select("id")\
            .eq("receiver_id", user["user_id"])\
            .eq("read", False)\
            .execute()
        return {"unread": len(result.data or [])}
    except Exception as e:
        return {"unread": 0}

@router.post("/generate-message")
async def generate_message(body: dict, user: dict = Depends(get_current_user)):
    import openai
    from config import settings
    patient_id = body.get("patient_id")
    try:
        report = supabase.table("reports").select("*").eq("patient_id", patient_id).order("created_at", desc=True).limit(1).execute()
        if not report.data:
            doctor_name = user.get("full_name", "Your Doctor")
            return {"message": f"Dear Patient,\n\nI have reviewed your documents. Please reach out with any questions.\n\nBest regards,\n{doctor_name}"}
        r  = report.data[0]
        rj = r.get("response_json") or {}
        parts = []
        if rj.get("patient_summary"):
            parts.append("AI Summary: " + rj["patient_summary"])
        lab = rj.get("lab") or {}
        tests = lab.get("tests") or []
        if tests:
            abnormal = [t for t in tests if t.get("status") not in ["normal","ok"]]
            if abnormal:
                vals = [t.get("name","") + " = " + str(t.get("value","")) + " " + str(t.get("unit","")) + " (" + str(t.get("status","")) + ")" for t in abnormal]
                parts.append("ABNORMAL: " + ", ".join(vals))
            normal = [t for t in tests if t.get("status") in ["normal","ok"]]
            if normal:
                vals = [t.get("name","") + " = " + str(t.get("value","")) for t in normal[:3]]
                parts.append("Normal: " + ", ".join(vals))
            if lab.get("summary"):
                parts.append("Clinical interpretation: " + lab["summary"])
            recs = lab.get("recommendations") or []
            if recs:
                parts.append("Recommendations: " + "; ".join(recs[:3]))
        allergy = rj.get("allergy") or {}
        allergies = allergy.get("allergies") or []
        if allergies:
            vals = [a.get("allergen","") + " (" + a.get("severity","") + ")" for a in allergies]
            parts.append("Patient allergies: " + ", ".join(vals))
        radiology = rj.get("radiology") or {}
        if radiology.get("confidence", 0) > 0.2 and radiology.get("findings"):
            parts.append("Radiology: " + str(radiology["findings"])[:200])
        if rj.get("emergency_flag"):
            parts.append("EMERGENCY FLAG raised")
        clinical_context = "\n".join(parts)
        doctor_name = user.get("full_name", "Your Doctor")
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    f"You are {doctor_name}, a caring doctor writing to your patient. "
                    "Write a warm clear empathetic message explaining their health results. "
                    "Rules: first person as the doctor, simple language no jargon, "
                    "mention SPECIFIC values and what they mean, give clear next steps, "
                    "3-4 short paragraphs, start with Dear Patient and end with doctor name."
                )},
                {"role": "user", "content": "Write a patient message based on:\n\n" + clinical_context}
            ],
            max_tokens=500,
        )
        message = response.choices[0].message.content.strip()
        return {"message": message}
    except Exception as e:
        logger.error(f"Generate error: {e}")
        doctor_name = user.get("full_name", "Your Doctor")
        return {"message": f"Dear Patient,\n\nI have reviewed your recent results carefully. Please contact us to discuss.\n\nBest regards,\n{doctor_name}"}



@router.get("/staff-contacts")
async def get_staff_contacts(user: dict = Depends(get_current_user)):
    """Get all doctors and radiologists to chat with."""
    try:
        staff = supabase.table("profiles")            .select("id,full_name,email,role,specialization,availability_status")            .in_("role", ["doctor","radiologist"])            .eq("activated", True)            .neq("id", user["user_id"])            .execute()
        return {"contacts": staff.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
