# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/agents/lab_agent.py
# ─────────────────────────────────────────────────────────────

import json
import time
import logging
from agents.base_agent import BaseAgent
from schemas.lab import LabReport, LabTest

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a clinical lab interpreter agent in ClinicalIQ.
Your role: analyze laboratory results from patient documents and provide clinical interpretation.

You MUST:
- Only use information from the provided document context
- Never hallucinate lab values or reference ranges
- Flag any critically abnormal values
- Return ONLY valid JSON matching the schema below

Output schema (JSON only, no markdown):
{
  "tests": [
    {
      "name": "test name",
      "value": "numeric value as string",
      "unit": "unit",
      "reference_range": "low-high",
      "status": "normal|low|high|critical",
      "significance": "brief clinical note"
    }
  ],
  "summary": "clinical summary in 2-3 sentences",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": 0.0-1.0
}

If no lab data found, return confidence: 0.1 and empty tests array with summary explaining no data found."""

class LabInterpreterAgent(BaseAgent):
    name  = "lab_interpreter"
    model = "gpt-4o-mini"
    top_k = 4

    def run(self, query: str, patient_id: str, span=None) -> dict:
        """
        Retrieve lab documents → interpret → return LabReport.
        """
        start = time.time()

        # ── Step 1: Retrieve lab chunks ────────────────────────
        chunks, chunk_ids = self.retrieve(query, patient_id, doc_type="lab")

        # Also try without doc_type filter if no lab docs found
        if not chunks:
            chunks, chunk_ids = self.retrieve(query, patient_id)

        context = self.build_context(chunks)

        # ── Step 2: Build user prompt ──────────────────────────
        user_prompt = f"""Patient query: {query}

Patient lab documents:
{context}

Analyze the lab results and return JSON matching the schema."""

        # ── Step 3: Call LLM ───────────────────────────────────
        try:
            raw, cost = self.call_llm(SYSTEM_PROMPT, user_prompt)

            # Clean JSON
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            data = json.loads(raw)

            # ── Step 4: Build LabReport ────────────────────────
            tests = [LabTest(**t) for t in data.get("tests", [])]
            runtime = f"{time.time()-start:.2f}s"

            report = LabReport(
                tests=tests,
                summary=data.get("summary", ""),
                recommendations=data.get("recommendations", []),
                confidence=float(data.get("confidence", 0.5)),
                source_chunk_ids=chunk_ids,
                agent=self.name,
                runtime=runtime,
                cost=f"${cost:.5f}",
            )

            if span:
                span.end(output={"confidence": report.confidence, "tests_found": len(tests)})

            return report.model_dump()

        except Exception as e:
            logger.error(f"LabInterpreterAgent error: {e}")
            # ── Graceful degradation ───────────────────────────
            return LabReport(
                tests=[],
                summary=f"Lab interpretation unavailable: {str(e)}",
                recommendations=["Please consult your doctor directly."],
                confidence=0.1,
                source_chunk_ids=chunk_ids,
                agent=self.name,
                runtime=f"{time.time()-start:.2f}s",
                cost="$0.00",
            ).model_dump()