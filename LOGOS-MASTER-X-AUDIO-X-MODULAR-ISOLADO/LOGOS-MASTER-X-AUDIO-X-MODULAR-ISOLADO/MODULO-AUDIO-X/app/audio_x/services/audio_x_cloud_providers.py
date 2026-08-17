from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from typing import Any

import httpx


class ProviderError(RuntimeError):
    def __init__(self, provider: str, message: str, status_code: int | None = None):
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code


def _mime(path: Path) -> str:
    return mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def _normalize_groq(data: dict[str, Any]) -> dict[str, Any]:
    segments = []
    for i, seg in enumerate(data.get("segments") or []):
        segments.append({
            "id": seg.get("id", i),
            "start": float(seg.get("start") or 0),
            "end": float(seg.get("end") or 0),
            "text": (seg.get("text") or "").strip(),
        })
    return {
        "text": (data.get("text") or "").strip(),
        "language": data.get("language"),
        "duration": data.get("duration"),
        "segments": segments,
        "words": data.get("words") or [],
        "raw_provider_response": data,
    }


async def transcribe_groq(path: Path, language: str = "pt") -> dict[str, Any]:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise ProviderError("groq", "GROQ_API_KEY não configurada")

    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    model = os.getenv("AUDIO_X_GROQ_MODEL", "whisper-large-v3-turbo")
    fields = {
        "model": model,
        "response_format": "verbose_json",
        "temperature": "0",
    }
    if language and language != "auto":
        fields["language"] = language

    timeout = float(os.getenv("AUDIO_X_PROVIDER_TIMEOUT_SECONDS", "240"))
    async with httpx.AsyncClient(timeout=timeout) as client:
        with path.open("rb") as fh:
            files = {"file": (path.name, fh, _mime(path))}
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {key}"},
                data=fields,
                files=files,
            )
    if not r.is_success:
        raise ProviderError("groq", _safe_error(r), r.status_code)
    return _normalize_groq(r.json())


def _normalize_deepgram(data: dict[str, Any]) -> dict[str, Any]:
    channels = ((data.get("results") or {}).get("channels") or [])
    alt = {}
    if channels:
        alternatives = channels[0].get("alternatives") or []
        if alternatives:
            alt = alternatives[0]

    words = alt.get("words") or []
    utterances = (data.get("results") or {}).get("utterances") or []

    segments = []
    if utterances:
        for i, u in enumerate(utterances):
            segments.append({
                "id": i,
                "start": float(u.get("start") or 0),
                "end": float(u.get("end") or 0),
                "text": (u.get("transcript") or "").strip(),
            })
    elif words:
        # Fallback: group words into ~12-second segments without local audio processing.
        bucket = []
        start = None
        seg_id = 0
        for w in words:
            ws = float(w.get("start") or 0)
            we = float(w.get("end") or ws)
            if start is None:
                start = ws
            bucket.append(w.get("punctuated_word") or w.get("word") or "")
            if we - start >= 12:
                segments.append({
                    "id": seg_id,
                    "start": start,
                    "end": we,
                    "text": " ".join(bucket).strip(),
                })
                seg_id += 1
                bucket = []
                start = None
        if bucket:
            end = float(words[-1].get("end") or start or 0)
            segments.append({
                "id": seg_id,
                "start": float(start or 0),
                "end": end,
                "text": " ".join(bucket).strip(),
            })

    metadata = data.get("metadata") or {}
    models = metadata.get("models") or []
    return {
        "text": (alt.get("transcript") or "").strip(),
        "language": ((channels[0].get("detected_language") if channels else None) or None),
        "duration": metadata.get("duration"),
        "segments": segments,
        "words": words,
        "model_info": models,
        "raw_provider_response": data,
    }


async def transcribe_deepgram(path: Path, language: str = "pt") -> dict[str, Any]:
    key = os.getenv("DEEPGRAM_API_KEY")
    if not key:
        raise ProviderError("deepgram", "DEEPGRAM_API_KEY não configurada")

    params = {
        "model": os.getenv("AUDIO_X_DEEPGRAM_MODEL", "nova-3"),
        "smart_format": "true",
        "punctuate": "true",
        "utterances": "true",
    }
    if language and language != "auto":
        params["language"] = language
    else:
        params["detect_language"] = "true"

    timeout = float(os.getenv("AUDIO_X_PROVIDER_TIMEOUT_SECONDS", "240"))
    async with httpx.AsyncClient(timeout=timeout) as client:
        with path.open("rb") as fh:
            r = await client.post(
                "https://api.deepgram.com/v1/listen",
                params=params,
                headers={
                    "Authorization": f"Token {key}",
                    "Content-Type": _mime(path),
                },
                content=fh.read(),
            )
    if not r.is_success:
        raise ProviderError("deepgram", _safe_error(r), r.status_code)
    return _normalize_deepgram(r.json())


def _normalize_openai(data: dict[str, Any]) -> dict[str, Any]:
    segments = []
    for i, seg in enumerate(data.get("segments") or []):
        segments.append({
            "id": seg.get("id", i),
            "start": float(seg.get("start") or 0),
            "end": float(seg.get("end") or 0),
            "text": (seg.get("text") or "").strip(),
        })
    return {
        "text": (data.get("text") or "").strip(),
        "language": data.get("language"),
        "duration": data.get("duration"),
        "segments": segments,
        "words": data.get("words") or [],
        "raw_provider_response": data,
    }


async def transcribe_openai(path: Path, language: str = "pt") -> dict[str, Any]:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise ProviderError("openai", "OPENAI_API_KEY não configurada")

    # whisper-1 is used here because verbose_json + segment/word timestamps
    # are available for this model in the Audio Transcriptions API.
    model = os.getenv("AUDIO_X_OPENAI_TRANSCRIBE_MODEL", "whisper-1")
    fields: list[tuple[str, str]] = [
        ("model", model),
        ("response_format", "verbose_json"),
        ("timestamp_granularities[]", "segment"),
        ("timestamp_granularities[]", "word"),
    ]
    if language and language != "auto":
        fields.append(("language", language))

    timeout = float(os.getenv("AUDIO_X_PROVIDER_TIMEOUT_SECONDS", "240"))
    async with httpx.AsyncClient(timeout=timeout) as client:
        with path.open("rb") as fh:
            files = {"file": (path.name, fh, _mime(path))}
            r = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {key}"},
                data=fields,
                files=files,
            )
    if not r.is_success:
        raise ProviderError("openai", _safe_error(r), r.status_code)
    return _normalize_openai(r.json())


async def transcribe_with_provider(
    provider: str,
    path: Path,
    language: str = "pt",
) -> dict[str, Any]:
    if provider == "groq":
        return await transcribe_groq(path, language)
    if provider == "deepgram":
        return await transcribe_deepgram(path, language)
    if provider == "openai":
        return await transcribe_openai(path, language)
    raise ProviderError(provider, f"Provedor desconhecido: {provider}")


def _safe_error(response: httpx.Response) -> str:
    try:
        data = response.json()
        if isinstance(data, dict):
            detail = data.get("error") or data.get("detail") or data
            if isinstance(detail, dict):
                return str(detail.get("message") or detail)
            return str(detail)
    except Exception:
        pass
    text = (response.text or "").strip()
    return text[:800] or f"HTTP {response.status_code}"
