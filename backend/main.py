# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/main.py
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# ── Routers ───────────────────────────────────────────────────
import traceback
try:
    from routers import auth, upload, query, routing, reports, chat, dashboard, radiologist, admin
    print("All routers imported OK")
except Exception as e:
    print(f"ROUTER IMPORT ERROR: {e}")
    traceback.print_exc()
    raise

app = FastAPI(title="ClinicalIQ API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────
app.include_router(auth.router,        prefix="/auth",        tags=["Auth"])
app.include_router(upload.router,      prefix="/upload",      tags=["Upload"])
app.include_router(query.router,       prefix="/query",       tags=["Query"])
app.include_router(routing.router,     prefix="/routing",     tags=["Routing"])
app.include_router(reports.router,     prefix="/reports",     tags=["Reports"])
app.include_router(chat.router,        prefix="/chat",        tags=["Chat"])
app.include_router(dashboard.router,   prefix="/dashboard",   tags=["Dashboard"])
app.include_router(radiologist.router, prefix="/radiologist", tags=["Radiologist"])
app.include_router(admin.router,       prefix="/admin",       tags=["Admin"])

# ── Health Check ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}