# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/agents/allergy_agent.py
# ─────────────────────────────────────────────────────────────

import json
import time
import logging
from agents.base_agent import BaseAgent
from schemas.allergy import AllergyReport, AllergyItem
from services.knowledge_graph import get_cross_reactivities, get_safe_alternatives

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an allergy safety agent in ClinicalIQ.
Your role: identify allergies, assess severity, check drug conflicts, and flag emergencies.

You MUST:
- Only use information from the provided document context
- Check for cross-reactivities between allergens and medications
- Set emergency_flag=true for anaphylactic-tier allergies or dangerous drug conflicts
- Return ONLY valid JSON matching the schema below

Output schema (JSON only, no markdown):
{
  "allergies": [
    {
      "allergen": "allergen name",
      "severity": "mild|moderate|severe|anaphylactic",
      "cross_reactivities": ["related substance 1"],
      "safe_alternatives": ["alternative 1"]
    }
  ],
  "drug_conflicts": ["conflict description"],
  "emergency_flag": true|false,
  "emergency_reason": "reason if emergency_flag is true",
  "summary": "allergy safety summary in 1-2 sentences",
  "confidence": 0.0-1.0
}

If no allergy data found, return confidence: 0.1 with empty allergies and summary explaining no data."""

class AllergySafetyAgent(BaseAgent):
    name  = "allergy_safety"
    model = "gpt-4o-mini"
    top_k = 4

    def run(self, query: str, patient_id: str, span=None) -> dict:
        """
        Retrieve allergy documents → analyze → enrich with NetworkX → return AllergyReport.
        """
        start = time.time()

        # ── Step 1: Retrieve allergy chunks ────────────────────
        chunks, chunk_ids = self.retrieve(query, patient_id, doc_type="allergy")

        if not chunks:
            chunks, chunk_ids = self.retrieve(query, patient_id)

        if not chunks:
            return {
                "allergies": [], "drug_conflicts": [], "summary": "No allergy documents found in patient records.",
                "emergency_flag": False, "emergency_reason": "", "confidence": 0.05,
                "runtime": "0.0s", "cost": "$0.00000", "source_chunk_ids": [],
            }
        context = self.build_context(chunks)

        # ── Step 2: Build user prompt ──────────────────────────
        user_prompt = f"""Patient query: {query}

Allergy documents:
{context}

Identify all allergies, assess severity, and flag any dangerous conflicts."""

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

            # ── Step 4: Enrich with NetworkX knowledge graph ───
            allergies = []
            for a in data.get("allergies", []):
                allergen = a.get("allergen", "")

                # Get cross-reactivities from graph
                graph_cross = get_cross_reactivities(allergen)
                cross_list = [c["substance"] for c in graph_cross]

                # Get safe alternatives from graph
                alt_list = get_safe_alternatives(allergen)

                # Merge LLM + graph results
                all_cross = list(set(a.get("cross_reactivities", []) + cross_list))
                all_alts  = list(set(a.get("safe_alternatives", []) + alt_list))

                allergies.append(AllergyItem(
                    allergen=allergen,
                    severity=a.get("severity", "unknown"),
                    cross_reactivities=all_cross,
                    safe_alternatives=all_alts,
                ))

            runtime = f"{time.time()-start:.2f}s"

            # ── Step 5: Emergency flag logic ───────────────────
            emergency_flag = bool(data.get("emergency_flag", False))
            # Also flag if any allergy is anaphylactic
            if any(a.severity == "anaphylactic" for a in allergies):
                emergency_flag = True

            report = AllergyReport(
                allergies=allergies,
                drug_conflicts=data.get("drug_conflicts", []),
                emergency_flag=emergency_flag,
                emergency_reason=data.get("emergency_reason"),
                summary=data.get("summary", ""),
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
                    "allergies_found": len(allergies),
                })

            return report.model_dump()

        except Exception as e:
            logger.error(f"AllergySafetyAgent error: {e}")
            return AllergyReport(
                allergies=[],
                drug_conflicts=[],
                emergency_flag=False,
                summary=f"Allergy check unavailable: {str(e)}",
                confidence=0.1,
                source_chunk_ids=chunk_ids,
                agent=self.name,
                runtime=f"{time.time()-start:.2f}s",
                cost="$0.00",
            ).model_dump()