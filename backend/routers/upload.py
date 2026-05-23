# ─────────────────────────────────────────────────────────────
# FILE: clinicaliq/backend/routers/upload.py
# ─────────────────────────────────────────────────────────────

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from middleware.auth import get_current_user
from pipelines.ingestion import ingest_document
from services.supabase_client import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Allowed file types ────────────────────────────────────────
ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_SIZE_MB = 10

# ── POST /upload ──────────────────────────────────────────────
@router.post("/")
async def upload_document(
    file:       UploadFile = File(...),
    category:   str = Form("clinician"),
    doc_type:   str = Form("lab"),
    patient_id: str = Form(None),
    user: dict  = Depends(get_current_user),
):
    """
    Upload a clinical document (PDF or DOCX).
    Runs full ingestion pipeline:
    parse → clean → chunk → NER → embed → store ChromaDB + Supabase
    """

    # ── Validate file type ────────────────────────────────────
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Only PDF and DOCX allowed."
        )

    # ── Read file bytes ───────────────────────────────────────
    file_bytes = await file.read()
    # Save to disk for later PDF serving
    import os
    os.makedirs("uploads", exist_ok=True)

    # ── Validate file size ────────────────────────────────────
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Max is {MAX_SIZE_MB}MB."
        )

    # ── Determine patient_id ──────────────────────────────────
    # If patient uploads their own doc, use their own ID
    # If doctor uploads for a patient, patient_id must be provided
    if not patient_id:
        if user["role"] == "patient":
            patient_id = user["user_id"]
        else:
            raise HTTPException(
                status_code=400,
                detail="patient_id is required when uploading as doctor/admin"
            )

    # ── Run ingestion pipeline ────────────────────────────────
    logger.info(f"Ingesting: {filename} for patient {patient_id}")
    # Save raw file to disk
    import os, hashlib
    file_hash = hashlib.md5(file_bytes).hexdigest()[:8]
    safe_name = f"{patient_id}_{file_hash}_{filename}"
    upload_path = os.path.join("uploads", safe_name)
    with open(upload_path, "wb") as f:
        f.write(file_bytes)
    logger.info(f"Saved file to {upload_path}")
    # Convert DOCX to PDF using LibreOffice headless
    if filename.lower().endswith(".docx"):
        try:
            import subprocess
            result = subprocess.run([
                "soffice", "--headless", "--convert-to", "pdf",
                "--outdir", os.path.dirname(upload_path),
                os.path.abspath(upload_path)
            ], capture_output=True, text=True, timeout=60)
            pdf_path = upload_path.replace(".docx", ".pdf")
            if os.path.exists(pdf_path):
                upload_path = pdf_path
                logger.info(f"Converted to PDF: {pdf_path}")
        except Exception as ce:
            logger.warning(f"PDF conversion failed: {ce}")
    result = await ingest_document(
        file_bytes=file_bytes,
        filename=filename,
        patient_id=patient_id,
        category=category,
        doc_type=doc_type,
        uploaded_by=user["user_id"],
    )

    # ── Audit log ─────────────────────────────────────────────
    supabase.table("audit_logs").insert({
        "user_id":  user["user_id"],
        "action":   "UPLOAD",
        "metadata": {
            "filename":    filename,
            "category":    category,
            "doc_type":    doc_type,
            "patient_id":  patient_id,
            "chunk_count": result["chunk_count"],
            "parse_error": result["parse_error"],
        }
    }).execute()


    # Auto-assign doctor after upload
    try:
        from routers.routing import classify_specialty, score_doctor
        specialty, conf = classify_specialty(filename, [category])
        # Include radiologists for radiology documents
        is_radiology = category.lower() in ["radiology","imaging","xray","mri","ct","ultrasound"] or                        any(w in filename.lower() for w in ["xray","mri","ct","scan","radiol","imaging","echo","ultrasound"])

        if is_radiology:
            doctors = supabase.table("profiles").select("*")                .in_("role",["doctor","radiologist"])                .eq("activated",True).execute().data or []
        else:
            doctors = supabase.table("profiles").select("*")                .eq("role","doctor")                .eq("activated",True).execute().data or []

        if doctors:
            best = max(doctors, key=lambda d: score_doctor(d, specialty, "routine"))
            # Delete only same-specialty assignment, not all
            supabase.table("assignments")                .delete()                .eq("patient_id", patient_id)                .eq("specialty", specialty)                .execute()
            supabase.table("assignments").insert({
                    "patient_id": patient_id,
                    "doctor_id":  best["id"],
                    "specialty":  specialty,
                    "confidence": conf,
                    "urgency":    "routine",
                    "score":      score_doctor(best, specialty, "routine"),
                }).execute()
            logger.info(f"Auto-assigned {best['full_name']} for patient {patient_id}")
    except Exception as e:
        logger.warning(f"Auto-assign failed: {e}")
    return {
        "status":         "success" if not result["parse_error"] else "partial",
        "filename":       filename,
        "doc_id":         result["doc_id"],
        "chunk_count":    result["chunk_count"],
        "entities_found": result["entities_found"],
        "parse_error":    result["parse_error"],
        "size_mb":        round(size_mb, 2),
    }

# ── GET /upload/documents ─────────────────────────────────────
@router.get("/documents")
async def get_documents(user: dict = Depends(get_current_user)):
    """
    Get all documents for the current patient.
    Doctors see documents for all their assigned patients.
    """
    try:
        if user["role"] == "patient":
            result = supabase.table("documents")\
                .select("*")\
                .eq("patient_id", user["user_id"])\
                .order("created_at", desc=True)\
                .execute()
        elif user["role"] in ("doctor", "admin"):
            result = supabase.table("documents")\
                .select("*")\
                .order("created_at", desc=True)\
                .execute()
        else:
            result = supabase.table("documents")\
                .select("*")\
                .eq("uploaded_by", user["user_id"])\
                .order("created_at", desc=True)\
                .execute()

        return {"documents": result.data}

    except Exception as e:
        logger.error(f"get_documents error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── DELETE /upload/documents/{doc_id} ─────────────────────────
@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Delete a document record from Supabase."""
    try:
        supabase.table("documents")\
            .delete()\
            .eq("id", doc_id)\
            .eq("uploaded_by", user["user_id"])\
            .execute()
        return {"status": "deleted", "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient-documents/{patient_id}")
async def get_patient_documents(patient_id: str, user: dict = Depends(get_current_user)):
    """Doctor fetches a specific patient's documents."""
    if user["role"] not in ["doctor", "radiologist", "admin"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        result = supabase.table("documents")            .select("*")            .eq("patient_id", patient_id)            .order("created_at", desc=True)            .execute()
        return {"documents": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/read-document/{doc_id}")
async def read_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Read full document content from ChromaDB chunks."""
    try:
        # Get document metadata
        doc = supabase.table("documents").select("*").eq("id", doc_id).execute()
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_data = doc.data[0]
        patient_id = doc_data["patient_id"]

        # Check access
        if user["role"] == "patient" and user["user_id"] != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Doctors and radiologists can access any patient doc

        # Get chunks from ChromaDB
        from services.chroma import get_chroma_collection
        collection = get_chroma_collection()
        
        results = collection.get(
            where={"patient_id": {"$eq": patient_id}},
            include=["documents", "metadatas"]
        )

        # Filter chunks for this document
        chunks = []
        for i, meta in enumerate(results["metadatas"]):
            src = meta.get("source_filename","")
            if src == doc_data["filename"] or doc_data["filename"] in src:
                chunks.append({
                    "text":     results["documents"][i],
                    "chunk_idx": meta.get("chunk_index", i),
                    "category": meta.get("category",""),
                })

        # Sort by chunk index
        chunks.sort(key=lambda x: x["chunk_idx"])
        full_text = "\n\n".join(c["text"] for c in chunks)

        return {
            "document": doc_data,
            "content":  full_text,
            "chunks":   len(chunks),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/serve-pdf/{doc_id}")
async def serve_pdf(doc_id: str, user: dict = Depends(get_current_user)):
    """Serve document as PDF inline."""
    from fastapi.responses import Response
    import glob, os

    try:
        doc = supabase.table("documents").select("*").eq("id", doc_id).execute()
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found")
        doc_data  = doc.data[0]
        storage_url = doc_data.get("storage_url") or ""
        pid       = doc_data["patient_id"]
        fname     = doc_data["filename"]

        # Look for PDF version first
        def find_file(ext):
            base = fname.rsplit(".", 1)[0]
            matches = [
                f for f in glob.glob(f"uploads/{pid}*")
                if f.endswith(ext) and not os.path.basename(f).startswith("~$")
            ]
            return matches[0] if matches else None

        pdf_path = find_file(".pdf")
        if not pdf_path:
            # Try converting now
            docx_path = find_file(".docx")
            if docx_path:
                import subprocess
                subprocess.run([
                    "soffice", "--headless", "--convert-to", "pdf",
                    "--outdir", "uploads", os.path.abspath(docx_path)
                ], capture_output=True, timeout=60)
                pdf_path = docx_path.replace(".docx", ".pdf")

        if not pdf_path or not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF not available. Please re-upload.")

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={fname.replace('.docx','.pdf')}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Serve PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

