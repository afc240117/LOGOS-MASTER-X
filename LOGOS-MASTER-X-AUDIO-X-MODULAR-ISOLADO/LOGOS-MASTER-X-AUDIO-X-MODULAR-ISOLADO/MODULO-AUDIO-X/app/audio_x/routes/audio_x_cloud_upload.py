from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.audio_x.routes.audio_x_cloud_router import provider_registry

router = APIRouter(prefix="/api/audio-x", tags=["audio-x-cloud-upload"])

DATA_DIR = Path("data/audio_x_cloud")
UPLOAD_DIR = DATA_DIR / "uploads"
JOB_DIR = DATA_DIR / "jobs"
for d in (UPLOAD_DIR, JOB_DIR):
    d.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
MAX_MB = int(os.getenv("AUDIO_X_MAX_UPLOAD_MB", "100"))
MAX_BYTES = MAX_MB * 1024 * 1024


def _job_path(job_id: str) -> Path:
    return JOB_DIR / f"{job_id}.json"


def _save_job(data: dict[str, Any]) -> None:
    _job_path(data["id"]).write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _load_job(job_id: str) -> dict[str, Any]:
    p = _job_path(job_id)
    if not p.exists():
        raise HTTPException(404, "Job não encontrado")
    return json.loads(p.read_text(encoding="utf-8"))


def _usable_provider_names() -> list[str]:
    return [
        p.name for p in provider_registry()
        if p.enabled and p.configured
    ]


@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    language: str = Form("pt"),
    title: str = Form(""),
):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Formato não suportado. Use MP3, WAV ou M4A."
        )

    providers = _usable_provider_names()
    if not providers:
        raise HTTPException(
            status_code=503,
            detail="Nenhum provedor de transcrição está configurado."
        )

    job_id = uuid.uuid4().hex
    target = UPLOAD_DIR / f"{job_id}{suffix}"
    size = 0

    with target.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                out.close()
                target.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"Arquivo acima de {MAX_MB} MB."
                )
            out.write(chunk)

    now = time.time()
    job = {
        "id": job_id,
        "status": "uploaded",
        "stage": "upload",
        "progress": 100,
        "filename": file.filename,
        "title": title.strip() or Path(file.filename or "audio").stem,
        "language": language,
        "size_bytes": size,
        "extension": suffix,
        "file_path": str(target),
        "created_at": now,
        "updated_at": now,
        "provider_order": providers,
        "selected_provider": providers[0],
        "fallback_enabled": os.getenv(
            "AUDIO_X_FALLBACK_ENABLED", "true"
        ).lower() in {"1","true","yes","on"},
        "transcription_status": "pending",
        "error": None,
    }
    _save_job(job)

    return {
        "ok": True,
        "job": {
            k: v for k, v in job.items()
            if k != "file_path"
        }
    }


@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = _load_job(job_id)
    safe = dict(job)
    safe.pop("file_path", None)
    return safe


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    job = _load_job(job_id)
    path = Path(job.get("file_path", ""))
    try:
        if path.exists():
            path.unlink()
    except Exception:
        pass
    try:
        _job_path(job_id).unlink()
    except Exception:
        pass
    return {"ok": True, "job_id": job_id}
