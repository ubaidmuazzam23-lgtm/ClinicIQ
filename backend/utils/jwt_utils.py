#─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/utils/jwt_utils.py
# ─────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException

SECRET_KEY  = "clinicaliq-secret-key-change-in-prod-2026"
ALGORITHM   = "HS256"
EXPIRE_DAYS = 7

def create_token(user_id: str, email: str, role: str) -> str:
    """Create a signed JWT token for the user."""
    payload = {
        "sub":   user_id,
        "email": email,
        "role":  role,
        "exp":   datetime.utcnow() + timedelta(days=EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises 401 if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "user_id": payload["sub"],
            "email":   payload["email"],
            "role":    payload["role"],
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")