# FILE: clinicaliq/backend/services/chroma.py

import chromadb
from config import settings
import logging
import threading

logger = logging.getLogger(__name__)
_lock = threading.Lock()
_client = None
_collection = None
COLLECTION_NAME = "clinical_documents"

def get_chroma_collection():
    global _client, _collection
    with _lock:
        if _collection is None:
            _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_PATH)
            _collection = _client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB ready: {_collection.count()} chunks")
    return _collection

def search_chunks(query_embedding: list, patient_id: str, doc_type: str = None, top_k: int = 5) -> list:
    try:
        collection = get_chroma_collection()
        count = collection.count()
        if count == 0:
            return []

        # ONLY search patient-specific documents
        # Training data is NEVER returned as patient results
        if doc_type:
            where = {"$and": [
                {"patient_id": {"$eq": patient_id}},
                {"doc_type":   {"$eq": doc_type}},
            ]}
        else:
            where = {"patient_id": {"$eq": patient_id}}

        # Check if patient has any documents
        try:
            check = collection.get(where={"patient_id": {"$eq": patient_id}}, limit=1, include=[])
            if len(check["ids"]) == 0:
                logger.info(f"No documents found for patient {patient_id[:8]} — returning empty")
                return []
        except Exception:
            return []

        n = min(top_k, count)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n,
            where=where,
            include=["documents", "metadatas", "distances"]
        )

        chunks = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                chunks.append({
                    "text":     doc,
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i],
                    "chunk_id": f"chunk_{i}",
                })

        logger.info(f"Found {len(chunks)} chunks for patient {patient_id[:8]}")
        return chunks

    except Exception as e:
        logger.error(f"ChromaDB search error: {e}")
        return []
