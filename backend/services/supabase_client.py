# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/services/supabase_client.py
# ─────────────────────────────────────────────────────────────

from supabase import create_client, Client
from config import settings

# ── Initialize Supabase client once ───────────────────────────
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY
)