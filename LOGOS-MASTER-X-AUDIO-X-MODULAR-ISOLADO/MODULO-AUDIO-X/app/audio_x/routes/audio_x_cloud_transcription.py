from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

from app.audio_x.services.audio_x_cloud_providers import ProviderError, transcribe_with_provider

router = APIRouter(prefix="/api/audio-x", tags=["audio-x-cloud-transcription"])

DATA_DIR = Path("data/audio_x_cloud")
JOB_DIR = DATA_DIR / "jobs"
RESULT_DIR = DATA_DIR / "transcriptions"
RESULT_DIR.mkdir(parents=True, exist_ok=True)


def _job_path(job_id: str) -> Path:
    return JOB_DIR / f"{job_id}.json"


def _result_path(job_id: str) -> Path:
    return RESULT_DIR / f"{job_id}.json"


def _load_job(job_id: str) -> dict[str, Any]:
    p = _job_path(job_id)
    if not p.exists():
        raise HTTPException(404, "Job não encontrado")
    return json.loads(p.read_text(encoding="utf-8"))


def _save_job(job: dict[str, Any]) -> None:
    job["updated_at"] = time.time()
    _job_path(job["id"]).write_text(
        json.dumps(job, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _safe_job(job: dict[str, Any]) -> dict[str, Any]:
    x = dict(job)
    x.pop("file_path", None)
    return x


@router.post("/jobs/{job_id}/transcribe")
async def transcribe_job(job_id: str):
    job = _load_job(job_id)
    path = Path(job.get("file_path") or "")
    if not path.exists():
        raise HTTPException(410, "Arquivo do job não está mais disponível")

    provider_order = list(job.get("provider_order") or [])
    if not provider_order:
        raise HTTPException(503, "Job sem provedor configurado")

    fallback_enabled = bool(job.get("fallback_enabled", True))
    if not fallback_enabled:
        provider_order = provider_order[:1]

    job.update({
        "status": "transcribing",
        "stage": "transcription",
        "progress": 10,
        "transcription_status": "running",
        "provider_attempts": [],
        "error": None,
    })
    _save_job(job)

    errors = []
    for idx, provider in enumerate(provider_order):
        attempt = {
            "provider": provider,
            "started_at": time.time(),
            "status": "running",
        }
        job["selected_provider"] = provider
        job["progress"] = min(90, 15 + idx * 20)
        job["provider_attempts"].append(attempt)
        _save_job(job)

        try:
            result = await transcribe_with_provider(
                provider,
                path,
                job.get("language") or "pt",
            )
            attempt["status"] = "completed"
            attempt["finished_at"] = time.time()

            payload = {
                "job_id": job_id,
                "provider": provider,
                "fallback_used": idx > 0,
                "provider_attempts": job["provider_attempts"],
                "text": result.get("text") or "",
                "language": result.get("language") or job.get("language"),
                "duration": result.get("duration"),
                "segments": result.get("segments") or [],
                "words": result.get("words") or [],
                "completed_at": time.time(),
            }
            _result_path(job_id).write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            job.update({
                "status": "transcribed",
                "stage": "transcription",
                "progress": 100,
                "transcription_status": "completed",
                "provider_used": provider,
                "fallback_used": idx > 0,
                "segment_count": len(payload["segments"]),
                "word_count": len(payload["words"]),
                "transcription_result_path": str(_result_path(job_id)),
                "error": None,
            })
            _save_job(job)

            # Raw provider response is deliberately NOT persisted in the normalized
            # result, reducing unnecessary data retention.
            return {
                "ok": True,
                "job": _safe_job(job),
                "transcription": payload,
            }

        except ProviderError as exc:
            attempt["status"] = "failed"
            attempt["finished_at"] = time.time()
            attempt["status_code"] = exc.status_code
            attempt["error"] = str(exc)
            errors.append({
                "provider": provider,
                "status_code": exc.status_code,
                "message": str(exc),
            })
            _save_job(job)

        except Exception as exc:
            attempt["status"] = "failed"
            attempt["finished_at"] = time.time()
            attempt["error"] = str(exc)
            errors.append({
                "provider": provider,
                "status_code": None,
                "message": str(exc),
            })
            _save_job(job)

    job.update({
        "status": "failed",
        "progress": 0,
        "transcription_status": "failed",
        "error": "Todos os provedores falharam",
        "provider_errors": errors,
    })
    _save_job(job)
    raise HTTPException(
        status_code=502,
        detail={
            "message": "Todos os provedores de transcrição falharam",
            "attempts": errors,
        }
    )


@router.get("/jobs/{job_id}/transcription")
def get_transcription(job_id: str):
    _load_job(job_id)
    p = _result_path(job_id)
    if not p.exists():
        raise HTTPException(404, "Transcrição ainda não disponível")
    return json.loads(p.read_text(encoding="utf-8"))
