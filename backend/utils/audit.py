
def log_action(user_id: str, action: str, details: dict = {}):
    """Log an action to audit_logs table."""
    try:
        from services.supabase_client import supabase
        from datetime import datetime
        supabase.table("audit_logs").insert({
            "user_id":    user_id,
            "action":     action,
            "details":    details,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Audit log failed: {e}")
