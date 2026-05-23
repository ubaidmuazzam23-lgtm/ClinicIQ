# FILE: clinicaliq/backend/utils/embedder.py

import logging
logger = logging.getLogger(__name__)

_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("Loading embedding model...")
        import torch
        torch.set_default_device("cpu")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        logger.info(f"Embedding model loaded — shape: {dummy.shape}")
    return _model

def get_embeddings(texts: list) -> list:
    model = get_model()
    return model.encode(texts, show_progress_bar=False, convert_to_numpy=True).tolist()

def get_single_embedding(text: str) -> list:
    model = get_model()
    return model.encode([text], show_progress_bar=False, convert_to_numpy=True)[0].tolist()
