# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/agents/orchestrator.py
# ─────────────────────────────────────────────────────────────

import asyncio
import uuid
import time
import logging
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI

from config import settings
from agents.lab_agent import LabInterpreterAgent
from agents.radiology_agent import RadiologyAnalyzerAgent
from agents.allergy_agent import AllergySafetyAgent
from services.langfuse_client import langfuse, get_trace, score_trace, FakeTrace
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

client   = OpenAI(api_key=settings.OPENAI_API_KEY)
executor = ThreadPoolExecutor(max_workers=3)

# ── Role filter ────────────────────────────────────────────────
def apply_role_filter(result: dict, role: str) -> dict:
    """
    Filter orchestrator result based on user role.
    Patient: plain language only.
    Doctor: full clinical detail.
    Radiologist: imaging focused.
    Admin: everything.
    """
    if role == "patient":
        # Keep agent data for transparency but mark as patient view
        result["patient_view"] = True
    elif role == "radiologist":
        # Focus on radiology — hide lab details
        result["lab"] = None
    return result

# ── Plain language summary for patients ────────────────────────
def generate_patient_summary(lab: dict, allergy: dict, query: str) -> str:
    """Generate plain-language summary for patient role."""
    try:
        context_parts = []
        if lab and lab.get("summary"):
            context_parts.append(f"Lab results: {lab['summary']}")
        if allergy and allergy.get("summary"):
            context_parts.append(f"Allergy check: {allergy['summary']}")

        if not context_parts:
            return "Your results are being reviewed by your doctor."

        context = "\n".join(context_parts)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are explaining medical results to a patient in simple, non-technical language. Be reassuring but accurate. Keep it to 2-3 sentences."},
                {"role": "user",   "content": f"Query: {query}\n\nClinical context:\n{context}\n\nWrite a plain-language patient summary."},
            ],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content or "Your results are being reviewed by your doctor."
    except Exception as e:
        logger.error(f"Patient summary error: {e}")
        return "Your results are being reviewed by your doctor."

# ── Confidence gate ────────────────────────────────────────────
def check_confidence_gate(
    lab: dict,
    radiology: dict,
    allergy: dict
) -> tuple:
    """
    HITL gate: flag for human review if overall confidence is low.
    Only counts agents that actually found relevant data (confidence > 0.2).
    Returns (hitl_required, reason)
    """
    confidences = []
    # Only include agents that found relevant data
    if lab and lab.get("confidence", 0) > 0.2:
        confidences.append(lab.get("confidence", 1.0))
    if radiology and radiology.get("confidence", 0) > 0.2:
        confidences.append(radiology.get("confidence", 1.0))
    if allergy and allergy.get("confidence", 0) > 0.2:
        confidences.append(allergy.get("confidence", 1.0))

    if not confidences:
        return False, None

    avg_confidence = sum(confidences) / len(confidences)

    if avg_confidence < 0.5:
        return True, f"Low overall confidence ({avg_confidence:.0%}) — requires clinical review"

    # Check for agent disagreement on emergency
    lab_emergency     = lab.get("emergency_flag", False) if lab else False
    allergy_emergency = allergy.get("emergency_flag", False) if allergy else False
    radio_emergency   = radiology.get("emergency_flag", False) if radiology else False

    emergency_votes = sum([lab_emergency, allergy_emergency, radio_emergency])
    total_agents    = sum([bool(lab), bool(radiology), bool(allergy)])

    if total_agents > 1 and emergency_votes == 1 and lab_emergency:
        return True, "Agent conflict detected — one agent flagged emergency, others did not"

    return False, None

# ── Main Orchestrator ──────────────────────────────────────────
def run_orchestrator(
    query: str,
    patient_id: str,
    role: str,
    user_id: str,
) -> dict:
    """
    Full orchestration pipeline:
    1. Run 3 agents in parallel (thread pool)
    2. Reconcile conflicts via NetworkX
    3. Apply confidence gate → HITL if needed
    4. Apply role filter
    5. Store in Supabase + Langfuse
    6. Return final response
    """
    query_id  = f"qry_{uuid.uuid4().hex[:8]}"
    start     = time.time()

    # ── Langfuse root trace ────────────────────────────────────
    trace = get_trace(
        name="clinical_query",
        user_id=user_id,
        metadata={"query_id": query_id, "role": role, "patient_id": patient_id}
    )
    trace_id = trace.id

    logger.info(f"[{query_id}] Starting orchestration for {role} — patient {patient_id}")

    # ── Step 1: Run agents in parallel ────────────────────────
    lab_agent    = LabInterpreterAgent()
    radio_agent  = RadiologyAnalyzerAgent()
    allergy_agent = AllergySafetyAgent()

    lab_span    = trace.span(name="lab_interpreter",    input={"query": query})
    radio_span  = trace.span(name="radiology_analyzer", input={"query": query})
    allergy_span = trace.span(name="allergy_safety",    input={"query": query})

    loop = asyncio.new_event_loop()
    try:
        async def run_all():
            lab_future     = loop.run_in_executor(executor, lab_agent.run,    query, patient_id, lab_span)
            radio_future   = loop.run_in_executor(executor, radio_agent.run,  query, patient_id, radio_span)
            allergy_future = loop.run_in_executor(executor, allergy_agent.run, query, patient_id, allergy_span)
            return await asyncio.gather(lab_future, radio_future, allergy_future, return_exceptions=True)

        results = loop.run_until_complete(run_all())
    finally:
        loop.close()

    lab_result, radio_result, allergy_result = results

    # Handle exceptions from agents
    if isinstance(lab_result, Exception):
        logger.error(f"Lab agent failed: {lab_result}")
        lab_result = None
    if isinstance(radio_result, Exception):
        logger.error(f"Radio agent failed: {radio_result}")
        radio_result = None
    if isinstance(allergy_result, Exception):
        logger.error(f"Allergy agent failed: {allergy_result}")
        allergy_result = None

    agents_used = [
        a for a, r in [("lab_interpreter", lab_result), ("radiology_analyzer", radio_result), ("allergy_safety", allergy_result)]
        if r is not None
    ]

    # ── Step 2: Confidence gate + HITL check ──────────────────
    hitl_required, hitl_reason = check_confidence_gate(lab_result, radio_result, allergy_result)

    # ── Step 3: Emergency flag (any agent) ────────────────────
    # Emergency: lab or radiology flagging is definitive
    # Allergy alone only flags if severity is anaphylactic AND query mentions medication
    lab_emergency   = lab_result and lab_result.get("emergency_flag", False)
    radio_emergency = radio_result and radio_result.get("emergency_flag", False)
    allergy_emergency = allergy_result and allergy_result.get("emergency_flag", False)

    emergency_flag = bool(lab_emergency or radio_emergency)
    # Allergy emergency triggers if anaphylactic allergen detected
    if allergy_emergency:
        # Check if any allergen is anaphylactic severity
        allergy_allergies = (allergy_result or {}).get("allergies", [])
        has_anaphylactic = any(
            a.get("severity","").lower() in ["anaphylactic","anaphylaxis"]
            for a in allergy_allergies
        )
        if has_anaphylactic:
            emergency_flag = True

    # Emergency flag is raised but HITL is NOT auto-raised
    # Patient decides whether to consult a doctor via the frontend button
    # hitl_required stays False unless patient explicitly requests consultation

    # ── Step 4: Overall confidence ─────────────────────────────
    # Only average agents that found relevant data
    conf_values = [
        r.get("confidence", 0) for r in [lab_result, radio_result, allergy_result]
        if r and r.get("confidence", 0) > 0.2
    ]
    overall_confidence = sum(conf_values) / len(conf_values) if conf_values else 0.0

    # ── Step 5: Patient plain-language summary ─────────────────
    patient_summary = None
    if role == "patient":
        patient_summary = generate_patient_summary(lab_result, allergy_result, query)

    # ── Step 6: Role filter ────────────────────────────────────
    response = {
        "query_id":          query_id,
        "role":              role,
        "lab":               lab_result,
        "radiology":         radio_result,
        "allergy":           allergy_result,
        "patient_summary":   patient_summary,
        "emergency_flag":    bool(emergency_flag),
        "hitl_required":     hitl_required,
        "hitl_reason":       hitl_reason,
        "overall_confidence": overall_confidence,
        "agents_used":       agents_used,
        "langfuse_trace_id": trace_id,
        "source_chunks":     [],
    }

    response = apply_role_filter(response, role)

    # ── Step 7: Store in Supabase ──────────────────────────────
    try:
        # Clean query text before storing
        import re
        clean_query = re.sub(r"^\[Referring to:[^\]]+\]\s*", "", query).strip()
        # Only save to reports if patient query OR emergency flag raised
        # Doctor queries are NOT saved to reports (they go to HITL only if patient query)
        if role == "patient":  # Only save patient queries — never doctor queries
            saved = supabase.table("reports").insert({
                "queried_by":      user_id,
                "patient_id":      patient_id,
                "query_text":      clean_query,
                "role":            role,
                "agents_used":     agents_used,
                "response_json":   response,
                "confidence":      overall_confidence,
                "langfuse_trace":  trace_id,
                "emergency_flag":  bool(emergency_flag),
                "hitl_required":   hitl_required,
            }).execute()
            if saved.data:
                response["report_id"] = saved.data[0]["id"]
    except Exception as e:
        logger.error(f"Supabase store error: {e}")

    # ── Step 8: Langfuse scores ────────────────────────────────
    try:
        score_trace(trace_id, "overall_confidence", overall_confidence)
        score_trace(trace_id, "agents_run", float(len(agents_used)))
        if emergency_flag:
            score_trace(trace_id, "emergency_flag", 1.0)
    except Exception as e:
        logger.error(f"Langfuse score error: {e}")

    elapsed = time.time() - start
    logger.info(f"[{query_id}] Orchestration complete in {elapsed:.2f}s | confidence: {overall_confidence:.2f}")

    return response