# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/agents/radiology_agent.py
# ─────────────────────────────────────────────────────────────

import json
import time
import logging
from agents.base_agent import BaseAgent
from schemas.radiology import RadiologyReport, Differential

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a radiology analyzer agent in ClinicalIQ.
Your role: interpret radiology reports (X-Ray, CT, MRI, Ultrasound) and provide differential diagnoses.

You MUST:
- Only use information from the provided document context
- Never invent imaging findings
- Rank differentials by probability (must sum to ~1.0)
- Set urgent=true for life-threatening differentials
- Set emergency_flag=true if findings require immediate action
- Return ONLY valid JSON matching the schema below

Output schema (JSON only, no markdown):
{
  "modality": "CT|MRI|X-Ray|Ultrasound|unknown",
  "findings": "key imaging findings in 2-3 sentences",
  "differentials": [
    {
      "diagnosis": "diagnosis name",
      "probability": 0.0-1.0,
      "urgent": true|false
    }
  ],
  "follow_up": "recommended next steps",
  "urgency": "routine|urgent|emergency",
  "emergency_flag": true|false,
  "confidence": 0.0-1.0
}

If no radiology/imaging data found in the context, return EXACTLY:
{"modality":"unknown","findings":"No radiology documents found in patient records.","differentials":[],"follow_up":"","urgency":"routine","emergency_flag":false,"confidence":0.05}
DO NOT generate differentials from lab values, blood tests, or non-imaging data."""

class RadiologyAnalyzerAgent(BaseAgent):
    name  = "radiology_analyzer"
    model = "gpt-4o-mini"
    top_k = 3

    def run(self, query: str, patient_id: str, span=None) -> dict:
        """
        Retrieve radiology documents → analyze → return RadiologyReport.
        """
        start = time.time()

        # ── Step 1: Retrieve radiology chunks ONLY ─────────────
        # NO fallback to general chunks — only real radiology docs
        chunks, chunk_ids = self.retrieve(query, patient_id, doc_type="radiology")

        if not chunks:
            return {
                "findings": "No radiology documents found in patient records.",
                "differentials": [], "modality": "unknown", "urgency": "routine",
                "follow_up": "", "confidence": 0.05,
                "runtime": "0.0s", "cost": "$0.00000", "source_chunk_ids": [],
            }
        context = self.build_context(chunks)

        # ── Step 2: Build user prompt ──────────────────────────
        user_prompt = f"""Patient query: {query}

Radiology documents:
{context}

Analyze the imaging findings and return JSON matching the schema."""

        # ── Step 3: Call LLM ───────────────────────────────────
        try:
            raw, cost = self.call_llm(SYSTEM_PROMPT, user_prompt)

            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            data = json.loads(raw)

            differentials = [
                Differential(**d) for d in data.get("differentials", [])
            ]
            runtime = f"{time.time()-start:.2f}s"

            report = RadiologyReport(
                modality=data.get("modality", "unknown"),
                findings=data.get("findings", ""),
                differentials=differentials,
                follow_up=data.get("follow_up"),
                urgency=data.get("urgency", "routine"),
                emergency_flag=bool(data.get("emergency_flag", False)),
                confidence=float(data.get("confidence", 0.5)),
                source_chunk_ids=chunk_ids,
                agent=self.name,
                runtime=runtime,
                cost=f"${cost:.5f}",
            )

            if span:
                span.end(output={
                    "confidence": report.confidence,
                    "emergency_flag": report.emergency_flag,
                    "differentials": len(differentials),
                })

            return report.model_dump()

        except Exception as e:
            logger.error(f"RadiologyAnalyzerAgent error: {e}")
            return RadiologyReport(
                findings=f"Radiology analysis unavailable: {str(e)}",
                differentials=[],
                urgency="routine",
                emergency_flag=False,
                confidence=0.1,
                source_chunk_ids=chunk_ids,
                agent=self.name,
                runtime=f"{time.time()-start:.2f}s",
                cost="$0.00",
            ).model_dump()