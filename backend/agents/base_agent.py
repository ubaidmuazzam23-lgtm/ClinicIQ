# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/agents/base_agent.py
# ─────────────────────────────────────────────────────────────

import time
import logging
from abc import ABC, abstractmethod
from openai import OpenAI
from config import settings
from services.chroma import search_chunks
from utils.embedder import get_single_embedding

logger = logging.getLogger(__name__)

# ── OpenAI client — initialized once ──────────────────────────
client = OpenAI(api_key=settings.OPENAI_API_KEY)

class BaseAgent(ABC):
    """
    Base class for all ClinicalIQ agents.
    Handles: RAG retrieval, LLM call, error handling, cost tracking.
    """
    name: str = "base_agent"
    model: str = "gpt-4o-mini"
    top_k: int = 3

    def retrieve(
        self,
        query: str,
        patient_id: str,
        doc_type: str = None
    ) -> tuple[list[dict], list[str]]:
        """
        Retrieve relevant chunks from ChromaDB.
        Returns (chunks, chunk_ids)
        """
        try:
            embedding = get_single_embedding(query)
            chunks = search_chunks(
                query_embedding=embedding,
                patient_id=patient_id,
                doc_type=doc_type,
                top_k=self.top_k
            )
            chunk_ids = [c.get("chunk_id","") for c in chunks]
            return chunks, chunk_ids
        except Exception as e:
            logger.error(f"{self.name} retrieval error: {e}")
            return [], []

    def build_context(self, chunks: list[dict]) -> str:
        """Build context string from retrieved chunks."""
        if not chunks:
            return "No relevant documents found in patient records."
        parts = []
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            parts.append(
                f"[Document {i+1} | {meta.get('source_filename','unknown')} | "
                f"Category: {meta.get('category','unknown')}]\n"
                f"{chunk.get('text','')}"
            )
        return "\n\n---\n\n".join(parts)

    def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1
    ) -> tuple[str, float]:
        """
        Call OpenAI LLM.
        Returns (response_text, estimated_cost)
        """
        start = time.time()
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=1500,
            )
            elapsed = time.time() - start
            text = response.choices[0].message.content or ""

            # Estimate cost (gpt-4o-mini pricing)
            input_tokens  = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            cost = (input_tokens * 0.00000015) + (output_tokens * 0.0000006)

            logger.info(f"{self.name} LLM call: {elapsed:.2f}s | ${cost:.5f}")
            return text, cost

        except Exception as e:
            logger.error(f"{self.name} LLM error: {e}")
            raise

    @abstractmethod
    def run(self, query: str, patient_id: str, span=None) -> dict:
        """Run the agent. Must be implemented by subclasses."""
        pass