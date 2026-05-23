# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/pipelines/ner.py
# ─────────────────────────────────────────────────────────────

import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# ── Medical NER — Domain Specific ─────────────────────────────
# Custom regex-based NER for clinical entities
# Goes beyond generic NER (person/org/date)
# Extracts: lab tests, drugs, allergens, anatomical terms

# ── Lab Test Patterns ──────────────────────────────────────────
LAB_PATTERNS = [
    # Hemoglobin: 12.5 g/dL
    r"(?P<name>hemoglobin|hgb|hb)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>g/dl|g/l)?",
    # WBC: 8.5 x10^3/uL
    r"(?P<name>wbc|white blood cell|white blood count)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>x10\^3/ul|10\^3/ul|k/ul)?",
    # Platelets: 250 x10^3/uL
    r"(?P<name>platelet|plt)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>x10\^3/ul|10\^3/ul)?",
    # RBC: 4.5 million/uL
    r"(?P<name>rbc|red blood cell)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>million/ul|x10\^6/ul)?",
    # ALT: 35 U/L
    r"(?P<name>alt|alanine aminotransferase)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>u/l|iu/l)?",
    # AST: 28 U/L
    r"(?P<name>ast|aspartate aminotransferase)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>u/l|iu/l)?",
    # Creatinine: 1.1 mg/dL
    r"(?P<name>creatinine)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>mg/dl)?",
    # TSH: 2.5 mIU/L
    r"(?P<name>tsh|thyroid stimulating hormone)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>miu/l|uiu/ml)?",
    # Blood glucose: 95 mg/dL
    r"(?P<name>glucose|blood sugar|fasting glucose)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>mg/dl)?",
    # Cholesterol: 180 mg/dL
    r"(?P<name>cholesterol|ldl|hdl|triglycerides)\s*[:\-]?\s*(?P<value>\d+\.?\d*)\s*(?P<unit>mg/dl)?",
]

# ── Drug Name Patterns ─────────────────────────────────────────
DRUG_PATTERNS = [
    r"\b(?P<name>ibuprofen|paracetamol|acetaminophen|aspirin|amoxicillin|"
    r"metformin|atorvastatin|lisinopril|omeprazole|cetirizine|"
    r"iron sulfate|iron gluconate|levothyroxine|metoprolol|"
    r"prednisone|dexamethasone|salbutamol|albuterol)\b"
    r"(?:\s+(?P<dosage>\d+\s*mg|\d+\s*mcg|\d+\s*g))?"
    r"(?:\s+(?P<frequency>once daily|twice daily|three times daily|"
    r"as needed|every \d+ hours))?",
]

# ── Allergen Patterns ──────────────────────────────────────────
ALLERGEN_PATTERNS = [
    r"(?:allerg(?:ic|y) to|allerg(?:en)?)\s*[:\-]?\s*"
    r"(?P<name>peanut|wheat|fish|gluten|soy|milk|shellfish|"
    r"ibuprofen|paracetamol|sulfa|penicillin|latex|"
    r"dust mite|pollen|pet dander|cockroach|"
    r"nickel|fragrance|rubber)",

    r"\b(?P<name>peanut|wheat|fish|gluten|soy|milk)\s+allerg",

    r"severity\s*[:\-]?\s*(?P<severity>mild|moderate|severe|anaphylactic)",
]

# ── Anatomical Term Patterns ───────────────────────────────────
ANATOMICAL_PATTERNS = [
    r"\b(?P<name>lung|lungs|liver|kidney|kidneys|heart|thyroid|"
    r"pancreas|spleen|bladder|colon|stomach|brain|chest|"
    r"abdomen|pelvis|spine|femur|tibia|humerus)\b",
]


def extract_entities(text: str, chunk_index: int = 0) -> List[Dict[str, Any]]:
    """
    Extract domain-specific clinical entities from a text chunk.
    Returns typed, deduplicated list linked to source positions.
    """
    entities = []
    text_lower = text.lower()

    # ── Lab Tests ──────────────────────────────────────────────
    for pattern in LAB_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            entity = {
                "type":        "lab_test",
                "name":        match.group("name").strip(),
                "value":       match.group("value") if "value" in match.groupdict() else None,
                "unit":        match.group("unit") if "unit" in match.groupdict() else None,
                "start_char":  match.start(),
                "end_char":    match.end(),
                "chunk_index": chunk_index
            }
            entities.append(entity)

    # ── Drugs ──────────────────────────────────────────────────
    for pattern in DRUG_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            entity = {
                "type":        "drug_name",
                "name":        match.group("name").strip(),
                "dosage":      match.group("dosage") if "dosage" in match.groupdict() else None,
                "frequency":   match.group("frequency") if "frequency" in match.groupdict() else None,
                "start_char":  match.start(),
                "end_char":    match.end(),
                "chunk_index": chunk_index
            }
            entities.append(entity)

    # ── Allergens ──────────────────────────────────────────────
    for pattern in ALLERGEN_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            groups = match.groupdict()
            entity = {
                "type":        "allergen",
                "name":        groups.get("name", "").strip(),
                "severity":    groups.get("severity", None),
                "start_char":  match.start(),
                "end_char":    match.end(),
                "chunk_index": chunk_index
            }
            if entity["name"]:
                entities.append(entity)

    # ── Anatomical Terms ───────────────────────────────────────
    for pattern in ANATOMICAL_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            entity = {
                "type":        "anatomical_term",
                "name":        match.group("name").strip(),
                "start_char":  match.start(),
                "end_char":    match.end(),
                "chunk_index": chunk_index
            }
            entities.append(entity)

    # ── Deduplicate ────────────────────────────────────────────
    entities = deduplicate_entities(entities)

    return entities


def deduplicate_entities(entities: List[Dict]) -> List[Dict]:
    """
    Remove duplicate entities by type + name combination.
    Keeps the first occurrence with source span.
    """
    seen = set()
    unique = []
    for entity in entities:
        key = (entity["type"], entity["name"])
        if key not in seen:
            seen.add(key)
            unique.append(entity)
    return unique