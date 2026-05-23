# FILE: clinicaliq/backend/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from services.supabase_client import supabase
from utils.audit import log_action
import logging
from datetime import datetime, timezone

router = APIRouter()
logger = logging.getLogger(__name__)

def require_admin(user: dict):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

@router.get("/overview")
async def get_overview(user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        doctors      = supabase.table("profiles").select("id,activated").eq("role","doctor").execute()
        radiologists = supabase.table("profiles").select("id,activated").eq("role","radiologist").execute()
        patients     = supabase.table("profiles").select("id").eq("role","patient").execute()
        reports      = supabase.table("reports").select("id,created_at,emergency_flag,approved,query_text,patient_id").execute()
        audit_logs   = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(20).execute()

        reports_today = [r for r in (reports.data or []) if r.get("created_at","")[:10] == today]
        emergency     = [r for r in (reports.data or []) if r.get("emergency_flag")]

        # Calculate real AI costs from response_json
        def get_report_cost(r):
            rj = r.get("response_json") or {}
            total = 0
            for agent in ["lab","radiology","allergy"]:
                cost_str = rj.get(agent,{}).get("cost","$0") or "$0"
                try:
                    total += float(cost_str.replace("$",""))
                except:
                    pass
            return total

        ai_cost_today = sum(get_report_cost(r) for r in reports_today)
        ai_cost_total = sum(get_report_cost(r) for r in (reports.data or []))
        avg_cost = ai_cost_today / len(reports_today) if reports_today else 0

        activity = []
        for log in (audit_logs.data or []):
            actor_id = log.get("user_id","")
            actor_profile = supabase.table("profiles").select("full_name,role").eq("id", actor_id).execute()
            actor_name = actor_profile.data[0]["full_name"] if actor_profile.data else "System"
            actor_role = actor_profile.data[0]["role"] if actor_profile.data else "system"
            activity.append({
                "time":    log.get("created_at","")[:16].replace("T"," "),
                "actor":   actor_name,
                "role":    actor_role,
                "action":  log.get("action",""),
                "details": log.get("details",{}),
            })

        pending = supabase.table("profiles")            .select("id,full_name,email,role,specialization,created_at")            .eq("activated", False)            .in_("role",["doctor","radiologist"])            .order("created_at", desc=True)            .execute()

        return {
            "stats": {
                "active_doctors":      len([d for d in (doctors.data or []) if d.get("activated")]),
                "active_radiologists": len([r for r in (radiologists.data or []) if r.get("activated")]),
                "total_patients":      len(patients.data or []),
                "queries_today":       len(reports_today),
                "queries_last_hour":   len(reports_today),
                "ai_cost_today":       round(ai_cost_today, 4),
                "ai_cost_total":       round(ai_cost_total, 4),
                "avg_cost_per_query":  round(avg_cost, 5),
                "emergency_flags":     len(emergency),
                "pending_activations": len(pending.data or []),
            },
            "recent_activity": activity,
            "pending_activations": pending.data or [],
            "active_emergencies": [
                {
                    "patient_id": r["patient_id"],
                    "query":      (r.get("query_text","") or "")[:60],
                    "created_at": r.get("created_at",""),
                }
                for r in (reports.data or []) if r.get("emergency_flag") and not r.get("approved")
            ][:5],
        }
    except Exception as e:
        logger.error(f"Overview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def get_all_users(user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        profiles = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        users = []
        for p in (profiles.data or []):
            load = 0
            if p["role"] in ["doctor","radiologist"]:
                assignments = supabase.table("assignments").select("id").eq("doctor_id", p["id"]).execute()
                load = len(assignments.data or [])
            users.append({**p, "current_load": load})
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/activate")
async def activate_user(user_id: str, user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        supabase.table("profiles").update({"activated": True}).eq("id", user_id).execute()
        log_action(user["user_id"], "USER_ACTIVATED", {"target_user": user_id})
        return {"activated": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-log")
async def get_audit_log(user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        logs = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(100).execute()
        enriched = []
        for log in (logs.data or []):
            actor_id = log.get("user_id","")
            actor = supabase.table("profiles").select("full_name,role").eq("id", actor_id).execute()
            enriched.append({
                **log,
                "actor_name": actor.data[0]["full_name"] if actor.data else "System",
                "actor_role": actor.data[0]["role"] if actor.data else "system",
            })
        return {"logs": enriched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routing-log")
async def get_routing_log(user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        assignments = supabase.table("assignments").select("*").order("created_at", desc=True).limit(50).execute()
        enriched = []
        for a in (assignments.data or []):
            patient = supabase.table("profiles").select("full_name,email").eq("id", a["patient_id"]).execute()
            doctor  = supabase.table("profiles").select("full_name,specialization").eq("id", a["doctor_id"]).execute()
            enriched.append({
                **a,
                "patient_name":      patient.data[0]["full_name"] if patient.data else "Unknown",
                "doctor_name":       doctor.data[0]["full_name"] if doctor.data else "Unknown",
                "doctor_specialty":  doctor.data[0].get("specialization","") if doctor.data else "",
            })
        return {"assignments": enriched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    require_admin(user)
    try:
        reports = supabase.table("reports")            .select("id,created_at,response_json,agents_used,confidence,query_text,patient_id")            .order("created_at", desc=True)            .execute()

        all_reports = reports.data or []

        # ── Per-agent stats ────────────────────────────────────
        agent_stats = {}
        for agent in ["lab", "radiology", "allergy"]:
            confs, costs, runtimes, fired = [], [], [], 0
            for r in all_reports:
                rj = r.get("response_json") or {}
                a  = rj.get(agent) or {}
                conf = a.get("confidence", 0) or 0
                cost_str = a.get("cost","$0") or "$0"
                runtime_str = a.get("runtime","0s") or "0s"
                try:
                    cost = float(cost_str.replace("$",""))
                except:
                    cost = 0
                try:
                    runtime = float(runtime_str.replace("s",""))
                except:
                    runtime = 0
                confs.append(conf)
                costs.append(cost)
                runtimes.append(runtime)
                if conf > 0.5:
                    fired += 1

            total = len(all_reports) or 1
            agent_stats[agent] = {
                "avg_confidence": round(sum(confs)/total, 3),
                "avg_cost":       round(sum(costs)/total, 6),
                "avg_runtime":    round(sum(runtimes)/total, 2),
                "total_cost":     round(sum(costs), 4),
                "fired_count":    fired,
                "accuracy_pct":   round(fired/total*100, 1),
                "total_queries":  total,
            }

        # ── Cost by day ────────────────────────────────────────
        from collections import defaultdict
        daily_costs = defaultdict(float)
        daily_counts = defaultdict(int)
        for r in all_reports:
            day = r.get("created_at","")[:10]
            if not day:
                continue
            rj = r.get("response_json") or {}
            total_cost = 0
            for agent in ["lab","radiology","allergy"]:
                a = rj.get(agent) or {}
                cost_str = a.get("cost","$0") or "$0"
                try:
                    total_cost += float(cost_str.replace("$",""))
                except:
                    pass
            daily_costs[day] += total_cost
            daily_counts[day] += 1

        cost_trend = [
            {"date": day, "cost": round(daily_costs[day], 4), "queries": daily_counts[day]}
            for day in sorted(daily_costs.keys(), reverse=True)[:14]
        ]
        cost_trend.reverse()

        # ── Slowest queries ────────────────────────────────────
        slowest = []
        for r in all_reports:
            rj = r.get("response_json") or {}
            total_runtime = 0
            for agent in ["lab","radiology","allergy"]:
                a = rj.get(agent) or {}
                try:
                    total_runtime += float((a.get("runtime","0s") or "0s").replace("s",""))
                except:
                    pass
            slowest.append({
                "id":           r["id"],
                "query":        (r.get("query_text","") or "")[:60],
                "total_runtime": round(total_runtime, 2),
                "confidence":   r.get("confidence", 0),
                "date":         r.get("created_at","")[:10],
                "agents":       r.get("agents_used",[]),
            })
        slowest.sort(key=lambda x: x["total_runtime"], reverse=True)
        slowest = slowest[:10]

        # ── Langfuse trace links ───────────────────────────────
        # Each report has an id which maps to Langfuse trace id
        trace_links = [
            {
                "id":       r["id"],
                "query":    (r.get("query_text","") or "")[:50],
                "date":     r.get("created_at","")[:16].replace("T"," "),
                "conf":     r.get("confidence",0),
                "url":      f"https://cloud.langfuse.com/trace/{r['id']}",
            }
            for r in all_reports[:20]
        ]

        return {
            "agent_stats":  agent_stats,
            "cost_trend":   cost_trend,
            "slowest":      slowest,
            "trace_links":  trace_links,
            "total_reports": len(all_reports),
        }
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
