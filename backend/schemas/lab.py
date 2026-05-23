# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/schemas/lab.py
# ─────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional

class LabTest(BaseModel):
    name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str                           # normal | low | high | critical
    significance: Optional[str] = None
    source_chunk_id: Optional[str] = None

class LabReport(BaseModel):
    tests: list[LabTest] = []
    summary: str
    recommendations: list[str] = []
    confidence: float
    source_chunk_ids: list[str] = []
    agent: str = "lab_interpreter"
    runtime: Optional[str] = None
    cost: Optional[str] = None