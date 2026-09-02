from __future__ import annotations

"""Compatibilidade Áudio X Cloud.

Mantém funcionando telas antigas que ainda chamam:
POST /api/audio-x/cloud/upload

O endpoint oficial atual é:
POST /api/audio-x/upload

Este módulo NÃO duplica lógica. Ele redireciona internamente para a função
original de upload, preservando validações, providers e formato de resposta.
"""

from fastapi import APIRouter, File, Form, UploadFile

from app.audio_x.routes.audio_x_cloud_upload import upload_audio

router = APIRouter(prefix="/api/audio-x/cloud", tags=["audio-x-cloud-compat"])


@router.post("/upload")
async def upload_audio_cloud_alias(
    file: UploadFile = File(...),
    language: str = Form("pt"),
    title: str = Form(""),
):
    return await upload_audio(file=file, language=language, title=title)


@router.get("/health")
def cloud_compat_health():
    return {
        "ok": True,
        "module": "audio-x-cloud-compat",
        "version": "5.4.3.2",
        "alias": "/api/audio-x/cloud/upload -> /api/audio-x/upload",
    }
