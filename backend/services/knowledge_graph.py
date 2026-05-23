# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/services/knowledge_graph.py
# ─────────────────────────────────────────────────────────────

import networkx as nx
import logging

logger = logging.getLogger(__name__)

# ── Build Knowledge Graph once at startup ─────────────────────
_graph = None

def get_knowledge_graph() -> nx.Graph:
    """Return or build the medical knowledge graph."""
    global _graph
    if _graph is None:
        _graph = build_graph()
        logger.info(f"Knowledge graph built: {_graph.number_of_nodes()} nodes, "
                    f"{_graph.number_of_edges()} edges")
    return _graph

def build_graph() -> nx.Graph:
    """
    Build medical ontology graph using NetworkX.
    Nodes: drugs, allergens, diagnoses, symptoms
    Edges: cross-reactivities, contraindications, symptom-diagnosis links
    """
    G = nx.Graph()

    # ── Drug nodes ─────────────────────────────────────────────
    drugs = [
        "ibuprofen", "paracetamol", "aspirin", "amoxicillin",
        "iron sulfate", "iron gluconate", "metformin", "atorvastatin",
        "lisinopril", "cetirizine", "prednisone", "salbutamol",
        "levothyroxine", "sulfa", "penicillin"
    ]
    for drug in drugs:
        G.add_node(drug, node_type="drug")

    # ── Allergen nodes ─────────────────────────────────────────
    allergens = [
        "peanut", "wheat", "fish", "gluten", "soy", "milk",
        "shellfish", "latex", "dust mite", "pollen",
        "pet dander", "cockroach", "nickel"
    ]
    for allergen in allergens:
        G.add_node(allergen, node_type="allergen")

    # ── Diagnosis nodes ────────────────────────────────────────
    diagnoses = [
        "anemia", "iron deficiency anemia", "hypothyroidism",
        "hyperthyroidism", "diabetes", "hypertension",
        "asthma", "liver disease", "kidney disease",
        "allergic rhinitis", "atopic dermatitis"
    ]
    for diagnosis in diagnoses:
        G.add_node(diagnosis, node_type="diagnosis")

    # ── Cross-reactivity edges ─────────────────────────────────
    cross_reactivities = [
        # sulfa allergy → iron sulfate contraindicated
        ("sulfa", "iron sulfate", {"relation": "cross_reactive", "severity": "moderate"}),
        # ibuprofen allergy → aspirin cross-reactive
        ("ibuprofen", "aspirin", {"relation": "cross_reactive", "severity": "moderate"}),
        # penicillin allergy → amoxicillin cross-reactive
        ("penicillin", "amoxicillin", {"relation": "cross_reactive", "severity": "high"}),
        # wheat allergy → gluten cross-reactive
        ("wheat", "gluten", {"relation": "cross_reactive", "severity": "high"}),
    ]
    for source, target, attrs in cross_reactivities:
        G.add_edge(source, target, **attrs)

    # ── Drug-Diagnosis edges ───────────────────────────────────
    drug_diagnosis = [
        ("iron sulfate", "iron deficiency anemia", {"relation": "treats"}),
        ("iron gluconate", "iron deficiency anemia", {"relation": "treats"}),
        ("levothyroxine", "hypothyroidism", {"relation": "treats"}),
        ("metformin", "diabetes", {"relation": "treats"}),
        ("atorvastatin", "hypertension", {"relation": "treats"}),
        ("salbutamol", "asthma", {"relation": "treats"}),
        ("cetirizine", "allergic rhinitis", {"relation": "treats"}),
        ("prednisone", "atopic dermatitis", {"relation": "treats"}),
    ]
    for drug, diagnosis, attrs in drug_diagnosis:
        G.add_edge(drug, diagnosis, **attrs)

    # ── Symptom-Diagnosis edges ────────────────────────────────
    symptom_diagnosis = [
        ("anemia", "iron deficiency anemia", {"relation": "subtype"}),
    ]
    for source, target, attrs in symptom_diagnosis:
        G.add_edge(source, target, **attrs)

    return G


def get_cross_reactivities(allergen: str) -> list[dict]:
    """
    Given an allergen, return all cross-reactive drugs/substances.
    Used by Allergy Safety Agent.
    """
    G = get_knowledge_graph()
    allergen_lower = allergen.lower()

    if allergen_lower not in G:
        return []

    cross_reactive = []
    for neighbor in G.neighbors(allergen_lower):
        edge_data = G[allergen_lower][neighbor]
        if edge_data.get("relation") == "cross_reactive":
            cross_reactive.append({
                "substance": neighbor,
                "severity":  edge_data.get("severity", "unknown"),
                "relation":  "cross_reactive"
            })

    return cross_reactive


def check_drug_allergen_conflict(drug: str, allergens: list[str]) -> list[dict]:
    """
    Check if a prescribed drug conflicts with any of the patient's allergens.
    Used by Orchestrator for conflict reconciliation.
    """
    G = get_knowledge_graph()
    drug_lower = drug.lower()
    conflicts = []

    for allergen in allergens:
        allergen_lower = allergen.lower()
        # Direct match
        if drug_lower == allergen_lower:
            conflicts.append({
                "drug":     drug,
                "allergen": allergen,
                "type":     "direct_match",
                "severity": "high"
            })
        # Cross-reactivity via graph
        elif allergen_lower in G and drug_lower in G:
            if G.has_edge(allergen_lower, drug_lower):
                edge = G[allergen_lower][drug_lower]
                if edge.get("relation") == "cross_reactive":
                    conflicts.append({
                        "drug":     drug,
                        "allergen": allergen,
                        "type":     "cross_reactive",
                        "severity": edge.get("severity", "unknown")
                    })

    return conflicts


def get_safe_alternatives(drug: str) -> list[str]:
    """
    Return safe alternative drugs for a contraindicated drug.
    """
    alternatives = {
        "iron sulfate":  ["iron gluconate", "iron bisglycinate"],
        "ibuprofen":     ["paracetamol", "acetaminophen"],
        "aspirin":       ["paracetamol"],
        "amoxicillin":   ["azithromycin", "clarithromycin"],
        "penicillin":    ["azithromycin", "clarithromycin"],
    }
    return alternatives.get(drug.lower(), [])