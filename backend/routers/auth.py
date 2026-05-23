# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/routers/auth.py
# ─────────────────────────────────────────────────────────────

import secrets
import string
import logging
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from services.supabase_client import supabase
from services.email import send_email
from utils.jwt_utils import create_token
from middleware.auth import require_role

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Schemas ───────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ActivateRequest(BaseModel):
    email: str
    activation_code: str
    new_password: str

class CreateStaffRequest(BaseModel):
    email: str
    full_name: str
    role: str
    specialization: str = ""
    sub_specialization: str = ""
    max_patients: int = 20
    imaging_expertise: list[str] = []

class ResendRequest(BaseModel):
    email: str

# ── Helpers ───────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def generate_otp(length: int = 6) -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def generate_activation_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def fix_expiry(expires_at_str: str) -> datetime:
    """Parse Supabase timestamp safely regardless of timezone format."""
    return datetime.fromisoformat(expires_at_str.replace("+00:00", ""))

# ── Email Templates ───────────────────────────────────────────
def otp_email(full_name: str, email: str, otp: str) -> str:
    first_name = full_name.split()[0] if full_name else "there"
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a,#0d1f28);padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:linear-gradient(135deg,#D77A61,#D8B4A0);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                <span style="color:#223843;font-weight:700;font-size:16px;line-height:32px;display:block;">C</span>
              </td>
              <td style="padding-left:12px;">
                <div style="color:#F2F2F2;font-size:18px;font-weight:600;letter-spacing:0.01em;">ClinicalIQ</div>
                <div style="color:rgba(242,242,242,0.4);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;">PwC × Agentic AI</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <div style="color:rgba(242,242,242,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;margin-bottom:16px;">● Email verification</div>
            <h1 style="margin:0 0 12px;color:#F2F2F2;font-size:26px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;">Welcome, {first_name}.</h1>
            <p style="margin:0 0 32px;color:rgba(242,242,242,0.55);font-size:15px;line-height:1.65;">
              Your ClinicalIQ account is almost ready. Enter the code below to verify your email and activate your account.
            </p>

            <!-- OTP Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#1a1a1a;border:1px solid rgba(215,122,97,0.35);border-radius:10px;padding:28px;text-align:center;">
                  <div style="color:rgba(242,242,242,0.4);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;font-family:monospace;margin-bottom:14px;">Your verification code</div>
                  <div style="font-family:monospace;font-size:48px;font-weight:700;letter-spacing:14px;color:#D77A61;line-height:1;">{otp}</div>
                  <div style="margin-top:14px;color:rgba(242,242,242,0.35);font-size:12px;font-family:monospace;">Expires in 10 minutes</div>
                </td>
              </tr>
            </table>

            <!-- Info rows -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Account type</td>
                  <td style="text-align:right;color:#F2F2F2;font-size:13px;font-weight:500;">Patient</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
                  <td style="text-align:right;color:#F2F2F2;font-size:13px;font-weight:500;">{email}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:10px 0;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Platform</td>
                  <td style="text-align:right;color:#F2F2F2;font-size:13px;font-weight:500;">PwC × Agentic AI Capstone</td>
                </tr></table>
              </td></tr>
            </table>

            <p style="margin:0;color:rgba(242,242,242,0.3);font-size:12px;line-height:1.6;">
              If you didn't create a ClinicalIQ account, ignore this email. The code expires automatically.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d1f28;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:rgba(242,242,242,0.25);font-size:11px;font-family:monospace;">ClinicalIQ · Ubaid Kundlik · 2026</td>
              <td style="text-align:right;color:rgba(242,242,242,0.25);font-size:11px;font-family:monospace;">PwC × Agentic AI</td>
            </tr></table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def activation_email(full_name: str, email: str, role: str, code: str) -> str:
    first_name = full_name.split()[0] if full_name else "there"
    role_label = role.capitalize()
    code_display = f"{code[:4]} — {code[4:]}"
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a,#0d1f28);padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:linear-gradient(135deg,#D77A61,#D8B4A0);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                <span style="color:#223843;font-weight:700;font-size:16px;line-height:32px;display:block;">C</span>
              </td>
              <td style="padding-left:12px;">
                <div style="color:#F2F2F2;font-size:18px;font-weight:600;letter-spacing:0.01em;">ClinicalIQ</div>
                <div style="color:rgba(242,242,242,0.4);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;">PwC × Agentic AI</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <div style="color:rgba(242,242,242,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;margin-bottom:16px;">● Clinician activation</div>
            <h1 style="margin:0 0 12px;color:#F2F2F2;font-size:26px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;">Welcome, Dr. {first_name}.</h1>
            <p style="margin:0 0 32px;color:rgba(242,242,242,0.55);font-size:15px;line-height:1.65;">
              Your ClinicalIQ {role_label} account has been created by an admin. Use the activation code below to set your password and access the platform.
            </p>

            <!-- Code Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#1a1a1a;border:1px solid rgba(215,122,97,0.35);border-radius:10px;padding:28px;text-align:center;">
                  <div style="color:rgba(242,242,242,0.4);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;font-family:monospace;margin-bottom:14px;">Your activation code</div>
                  <div style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#D77A61;line-height:1;">{code_display}</div>
                  <div style="margin-top:14px;color:rgba(242,242,242,0.35);font-size:12px;font-family:monospace;">Valid for 24 hours · Single use</div>
                </td>
              </tr>
            </table>

            <!-- Info rows -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Role</td>
                  <td style="text-align:right;color:#F2F2F2;font-size:13px;font-weight:500;">{role_label}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
                  <td style="text-align:right;color:#F2F2F2;font-size:13px;font-weight:500;">{email}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:10px 0;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="color:rgba(242,242,242,0.35);font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">Next step</td>
                  <td style="text-align:right;color:#D77A61;font-size:13px;font-weight:500;">Go to /activate to set password</td>
                </tr></table>
              </td></tr>
            </table>

            <p style="margin:0;color:rgba(242,242,242,0.3);font-size:12px;line-height:1.6;">
              If you weren't expecting this email, contact your admin immediately. This code can only be used once.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d1f28;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:rgba(242,242,242,0.25);font-size:11px;font-family:monospace;">ClinicalIQ · Ubaid Kundlik · 2026</td>
              <td style="text-align:right;color:rgba(242,242,242,0.25);font-size:11px;font-family:monospace;">PwC × Agentic AI</td>
            </tr></table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""




# ── POST /auth/register ───────────────────────────────────────
@router.post("/register")
async def register(body: RegisterRequest):
    """Patient self-registration. Sends 6-digit OTP via Gmail SMTP."""

    # Check if email already exists
    existing = supabase.table("profiles").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = hash_password(body.password)

    # Insert profile
    result = supabase.table("profiles").insert({
        "email":     body.email,
        "full_name": body.full_name,
        "password":  hashed,
        "role":      "patient",
        "activated": False,
    }).execute()
    profile = result.data[0]

    # Generate and store OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    supabase.table("activation_tokens").insert({
        "email":      body.email,
        "token":      otp,
        "role":       "patient",
        "used":       False,
        "expires_at": expires_at.isoformat(),
    }).execute()

    # Send styled OTP email
    send_email(
        to=body.email,
        subject="Your ClinicalIQ verification code",
        body=otp_email(body.full_name, body.email, otp)
    )

    logger.info(f"Registered patient: {body.email}")
    return {"status": "otp_sent", "email": body.email, "user_id": profile["id"]}


# ── POST /auth/verify-otp ─────────────────────────────────────
@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPRequest):
    """Verify 6-digit OTP. Activates account and returns JWT."""

    result = supabase.table("activation_tokens")\
        .select("*")\
        .eq("email", body.email)\
        .eq("token", body.otp)\
        .eq("used", False)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    token = result.data[0]

    # Check expiry
    expires_at = fix_expiry(token["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="OTP expired — request a new one")

    # Activate profile
    supabase.table("profiles").update({"activated": True}).eq("email", body.email).execute()

    # Mark token used
    supabase.table("activation_tokens").update({"used": True}).eq("id", token["id"]).execute()

    # Get profile
    profile = supabase.table("profiles").select("*").eq("email", body.email).execute().data[0]

    # Audit log
    supabase.table("audit_logs").insert({
        "user_id":  profile["id"],
        "action":   "ACTIVATE_ACCOUNT",
        "metadata": {"email": body.email, "role": "patient"},
    }).execute()

    jwt_token = create_token(profile["id"], profile["email"], profile["role"])
    return {
        "token": jwt_token,
        "role":  profile["role"],
        "user":  {"id": profile["id"], "email": profile["email"], "full_name": profile["full_name"]},
    }


# ── POST /auth/login ──────────────────────────────────────────
@router.post("/login")
async def login(body: LoginRequest):
    """Email + password login. Returns JWT on success."""

    result = supabase.table("profiles").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    profile = result.data[0]

    if not profile.get("activated"):
        raise HTTPException(status_code=403, detail="Account not yet activated. Check your email for the OTP.")

    if not verify_password(body.password, profile.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Audit log
    supabase.table("audit_logs").insert({
        "user_id":  profile["id"],
        "action":   "LOGIN",
        "metadata": {"email": body.email, "role": profile["role"]},
    }).execute()

    jwt_token = create_token(profile["id"], profile["email"], profile["role"])
    return {
        "token": jwt_token,
        "role":  profile["role"],
        "user":  {"id": profile["id"], "email": profile["email"], "full_name": profile["full_name"]},
    }


# ── POST /auth/activate ───────────────────────────────────────
@router.post("/activate")
async def activate(body: ActivateRequest):
    """Clinician account activation with 8-char code."""

    result = supabase.table("activation_tokens")\
        .select("*")\
        .eq("email", body.email)\
        .eq("token", body.activation_code)\
        .eq("used", False)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Invalid activation code")

    token = result.data[0]

    expires_at = fix_expiry(token["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Activation code expired")

    # Hash password and activate
    hashed = hash_password(body.new_password)
    supabase.table("profiles")\
        .update({"activated": True, "password": hashed})\
        .eq("email", body.email)\
        .execute()

    supabase.table("activation_tokens").update({"used": True}).eq("id", token["id"]).execute()

    profile = supabase.table("profiles").select("*").eq("email", body.email).execute().data[0]

    supabase.table("audit_logs").insert({
        "user_id":  profile["id"],
        "action":   "ACTIVATE_ACCOUNT",
        "metadata": {"email": body.email, "role": profile["role"]},
    }).execute()

    jwt_token = create_token(profile["id"], profile["email"], profile["role"])
    return {
        "token": jwt_token,
        "role":  profile["role"],
        "user":  {"id": profile["id"], "email": profile["email"], "full_name": profile["full_name"]},
    }


# ── POST /auth/create-staff ───────────────────────────────────
@router.post("/create-staff")
async def create_staff(body: CreateStaffRequest, user: dict = Depends(require_role("admin"))):
    """Admin only — create doctor or radiologist account."""

    existing = supabase.table("profiles").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = supabase.table("profiles").insert({
        "email":              body.email,
        "full_name":          body.full_name,
        "role":               body.role,
        "activated":          False,
        "specialization":     body.specialization,
        "sub_specialization": body.sub_specialization,
        "max_patients":       body.max_patients,
        "imaging_expertise":  body.imaging_expertise,
    }).execute()
    profile = result.data[0]

    code = generate_activation_code()
    expires_at = datetime.utcnow() + timedelta(hours=24)
    supabase.table("activation_tokens").insert({
        "email":      body.email,
        "token":      code,
        "role":       body.role,
        "used":       False,
        "expires_at": expires_at.isoformat(),
    }).execute()

    # Send styled activation email
    send_email(
        to=body.email,
        subject=f"Activate your ClinicalIQ {body.role.capitalize()} account",
        body=activation_email(body.full_name, body.email, body.role, code)
    )

    supabase.table("audit_logs").insert({
        "user_id":  user["user_id"],
        "action":   "CREATE_STAFF",
        "metadata": {"email": body.email, "role": body.role},
    }).execute()

    return {
        "status":     "pending_activation",
        "profile_id": profile["id"],
        "email":      body.email,
        "code":       code,
    }


# ── POST /auth/resend-otp ─────────────────────────────────────
@router.post("/resend-otp")
async def resend_otp(body: ResendRequest):
    """Resend OTP for patient email verification."""

    supabase.table("activation_tokens")\
        .update({"used": True})\
        .eq("email", body.email)\
        .eq("used", False)\
        .execute()

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    supabase.table("activation_tokens").insert({
        "email":      body.email,
        "token":      otp,
        "role":       "patient",
        "used":       False,
        "expires_at": expires_at.isoformat(),
    }).execute()

    # Get full name for email
    profile = supabase.table("profiles").select("full_name").eq("email", body.email).execute()
    full_name = profile.data[0]["full_name"] if profile.data else "there"

    send_email(
        to=body.email,
        subject="Your new ClinicalIQ verification code",
        body=otp_email(full_name, body.email, otp)
    )

    return {"status": "otp_resent"}