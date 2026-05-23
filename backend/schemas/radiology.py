# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/schemas/radiology.py
# ─────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional

class Differential(BaseModel):
    diagnosis: str
    probability: float                    # 0.0 - 1.0
    urgent: bool = False

class RadiologyReport(BaseModel):
    modality: Optional[str] = None        # CT | MRI | X-Ray | US
    findings: str
    differentials: list[Differential] = []
    follow_up: Optional[str] = None
    urgency: str = "routine"              # routine | urgent | emergency
    emergency_flag: bool = False
    confidence: float
    source_chunk_ids: list[str] = []
    agent: str = "radiology_analyzer"
    runtime: Optional[str] = None
    cost: Optional[str] = None