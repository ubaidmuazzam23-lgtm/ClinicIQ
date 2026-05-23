# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/schemas/query.py
# ─────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional
from schemas.lab import LabReport
from schemas.radiology import RadiologyReport
from schemas.allergy import AllergyReport

class QueryRequest(BaseModel):
    query_text: str
    patient_id: Optional[str] = None     # if doctor querying for patient

class OrchestratorResponse(BaseModel):
    query_id: str
    role: str
    lab: Optional[LabReport] = None
    radiology: Optional[RadiologyReport] = None
    allergy: Optional[AllergyReport] = None
    patient_summary: Optional[str] = None  # plain language for patient
    emergency_flag: bool = False
    hitl_required: bool = False
    hitl_reason: Optional[str] = None
    overall_confidence: float
    agents_used: list[str] = []
    langfuse_trace_id: Optional[str] = None
    source_chunks: list[dict] = []