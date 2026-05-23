# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/schemas/allergy.py
# ─────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional

class AllergyItem(BaseModel):
    allergen: str
    severity: str                         # mild | moderate | severe | anaphylactic
    cross_reactivities: list[str] = []
    safe_alternatives: list[str] = []
    source_chunk_id: Optional[str] = None

class AllergyReport(BaseModel):
    allergies: list[AllergyItem] = []
    drug_conflicts: list[str] = []
    emergency_flag: bool = False
    emergency_reason: Optional[str] = None
    summary: str
    confidence: float
    source_chunk_ids: list[str] = []
    agent: str = "allergy_safety"
    runtime: Optional[str] = None
    cost: Optional[str] = None