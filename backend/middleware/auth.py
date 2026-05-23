# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/middleware/auth.py
# ─────────────────────────────────────────────────────────────

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt_utils import decode_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Verify JWT and return user info. Use as FastAPI dependency."""
    return decode_token(credentials.credentials)

def require_role(*roles: str):
    """Role guard — restrict endpoint to specific roles."""
    async def role_checker(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ) -> dict:
        user = decode_token(credentials.credentials)
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required: {roles}"
            )
        return user
    return role_checker