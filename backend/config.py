# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/config.py
# ─────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Clerk
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""

    # Langfuse
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # Gmail SMTP
    GMAIL_SENDER: str = ""
    GMAIL_APP_PASSWORD: str = ""

    # ChromaDB
    CHROMA_PERSIST_PATH: str = "/data/chroma_db"

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"    # ← this line fixes the error

settings = Settings()


