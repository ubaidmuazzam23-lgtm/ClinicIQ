# FILE: clinicaliq/backend/services/langfuse_client.py

import logging
from config import settings

logger = logging.getLogger(__name__)

try:
    from langfuse import Langfuse
    langfuse = Langfuse(
        public_key=settings.LANGFUSE_PUBLIC_KEY,
        secret_key=settings.LANGFUSE_SECRET_KEY,
        host=settings.LANGFUSE_HOST
    )
    LANGFUSE_OK = True
    logger.info("Langfuse initialized")
except Exception as e:
    langfuse = None
    LANGFUSE_OK = False
    logger.warning(f"Langfuse init failed: {e}")

class FakeSpan:
    id = "no-trace"
    def span(self, **kwargs): return self
    def end(self, **kwargs): pass

class FakeTrace:
    id = "no-trace"
    def span(self, **kwargs): return FakeSpan()
    def end(self, **kwargs): pass

def get_trace(name: str, user_id: str, metadata: dict = {}):
    if not LANGFUSE_OK or not langfuse:
        return FakeTrace()
    try:
        return langfuse.trace(name=name, user_id=user_id, metadata=metadata)
    except Exception:
        try:
            from langfuse.decorators import langfuse_context
            return FakeTrace()
        except Exception:
            return FakeTrace()

def score_trace(trace_id: str, name: str, value: float):
    if not LANGFUSE_OK or not langfuse or trace_id == "no-trace":
        return
    try:
        langfuse.score(trace_id=trace_id, name=name, value=value)
    except Exception as e:
        logger.error(f"Langfuse score error: {e}")
