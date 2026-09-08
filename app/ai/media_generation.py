"""Geração de mídia para a Bíblia Viva.

As chaves ficam no ambiente do servidor/local. Este módulo devolve apenas o
resultado da chamada atual; não grava prompts, chaves ou arquivos enviados no
projeto. A camada web pode, portanto, usar a mesma infraestrutura local para
testes e depois trocar o provedor sem expor credenciais ao navegador.
"""

from __future__ import annotations

import base64
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class MediaGenerationError(RuntimeError):
    """Erro seguro para apresentar ao usuário sem revelar credenciais."""


VISUAL_DNA_MARKER = "LOGOS MASTER X • DNA VISUAL FIXO"


def build_visual_prompt(
    prompt: str,
    *,
    title: str = "Cena bíblica",
    reference: str = "Passagem em estudo",
    place: str = "Lugar bíblico relacionado",
    stage: str = "Leitura da passagem",
    kind: str = "image",
) -> str:
    """Append the same visual identity to every provider request.

    The prompt is also assembled in the browser for copy/paste generation, but
    keeping this guard on the server means a direct API request cannot
    accidentally lose the Bible Viva identity card.
    """
    base = re.sub(r"\s+", " ", str(prompt or "")).strip()
    if VISUAL_DNA_MARKER in base:
        return base
    title = re.sub(r"\s+", " ", str(title or "Cena bíblica")).strip()
    reference = re.sub(r"\s+", " ", str(reference or "Passagem em estudo")).strip()
    place = re.sub(r"\s+", " ", str(place or "Lugar bíblico relacionado")).strip()
    stage = re.sub(r"\s+", " ", str(stage or "Leitura da passagem")).strip()
    moving = " Para vídeo, mantenha a ficha legível nos primeiros e nos últimos dois segundos." if str(kind).lower() == "video" else ""
    dna = (
        f"{VISUAL_DNA_MARKER}: use composição cinematográfica editorial, realista e historicamente prudente, "
        "com luz natural, paisagem, arquitetura, objetos e vestimentas coerentes com o antigo Oriente. "
        "Reserve na parte inferior uma faixa semitransparente elegante, com tipografia serifada clara e divisores verticais discretos. "
        "Escreva exatamente nesta faixa, em português brasileiro, sem inventar ou alterar palavras: "
        f"{title} | {reference} | {place} | Etapa: {stage} | Reconstrução interpretativa para estudo bíblico. "
        "Não apresente a reconstrução como fotografia do século I, não invente inscrições legíveis, datas ou fatos arqueológicos, "
        "e não acrescente outros textos visíveis."
        f"{moving}"
    )
    return f"{base}\n\n{dna}".strip()


def _key(provider: str) -> str:
    if provider == "gemini":
        return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
    return (os.getenv("OPENAI_API_KEY") or "").strip()

def _key_info(provider: str) -> dict[str, Any]:
    names = ("GEMINI_API_KEY", "GOOGLE_API_KEY") if provider == "gemini" else ("OPENAI_API_KEY",)
    for name in names:
        if str(os.getenv(name) or "").strip():
            return {"present": True, "source": name, "format": "reconhecida"}
    return {"present": False, "source": names[0], "format": "ausente"}


def configured() -> dict[str, bool]:
    return {"gemini": bool(_key("gemini")), "openai": bool(_key("openai"))}


def models() -> dict[str, dict[str, str]]:
    return {
        "gemini": {
            "image": os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image"),
            "video": os.getenv("GEMINI_VIDEO_MODEL", "gemini-omni-1.1-flash"),
        },
        "openai": {
            "image": os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1"),
            "video": os.getenv("OPENAI_VIDEO_MODEL", "sora-2"),
        },
    }


def status() -> dict[str, Any]:
    cfg = configured()
    return {
        "providers": {
            provider: {
                "configured": cfg[provider],
                "key": _key_info(provider),
                "capabilities": ["image", "video"],
                "models": models()[provider],
            }
            for provider in ("gemini", "openai")
        },
        "security": "As chaves são lidas somente no servidor/local e nunca retornadas ao navegador.",
        "hint": "OPENAI_MODEL é o modelo de texto; mídia usa OPENAI_IMAGE_MODEL/OPENAI_VIDEO_MODEL.",
    }


def _request_json(url: str, *, method: str = "POST", payload: dict[str, Any] | None = None,
                 headers: dict[str, str] | None = None, timeout: float = 120) -> dict[str, Any]:
    body = json.dumps(payload or {}, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if body is not None:
        request_headers.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(url, data=body, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw).get("error", {}).get("message") or json.loads(raw).get("message")
        except Exception:
            detail = None
        raise MediaGenerationError(f"{error.code}: {str(detail or raw)[:360]}") from error
    except urllib.error.URLError as error:
        raise MediaGenerationError(f"Serviço de mídia indisponível: {error.reason}") from error
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise MediaGenerationError("O provedor retornou uma resposta inválida.") from error
    if not isinstance(payload, dict):
        raise MediaGenerationError("O provedor retornou um formato inesperado.")
    return payload


def _data_url(data: str, mime_type: str) -> str:
    return f"data:{mime_type or 'application/octet-stream'};base64,{data}"


def _reference_parts(data_url: str | None) -> tuple[str, str] | None:
    value = str(data_url or "")
    match = re.match(r"^data:(image/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$", value, re.I)
    if not match:
        if value:
            raise MediaGenerationError("O anexo precisa ser uma imagem PNG, JPEG ou WebP.")
        return None
    encoded = match.group(2)
    if len(encoded) > 12_000_000:
        raise MediaGenerationError("A imagem de referência é grande demais para este teste (máximo aproximado: 9 MB).")
    return match.group(1).lower(), encoded


def _output_from_steps(payload: dict[str, Any], kind: str) -> dict[str, Any] | None:
    convenience = payload.get("output_image" if kind == "image" else "output_video")
    if isinstance(convenience, dict) and convenience.get("data"):
        return convenience
    for step in payload.get("steps", []) or []:
        for content in step.get("content", []) if isinstance(step, dict) else []:
            if isinstance(content, dict) and content.get("type") == kind and content.get("data"):
                return content
    return None


def _generate_gemini(kind: str, prompt: str, *, model: str | None, aspect_ratio: str,
                     image_size: str, resolution: str, reference_image: str | None) -> dict[str, Any]:
    key = _key("gemini")
    if not key:
        raise MediaGenerationError("GEMINI_API_KEY/GOOGLE_API_KEY não configurada no ambiente.")
    selected_model = model or models()["gemini"][kind]
    input_value: Any = prompt
    reference = _reference_parts(reference_image)
    if reference:
        mime_type, encoded = reference
        input_value = [
            {"type": "image", "data": encoded, "mime_type": mime_type},
            {"type": "text", "text": prompt},
        ]
    response_format: dict[str, Any] = {"type": kind}
    if kind == "image":
        response_format.update({"aspect_ratio": aspect_ratio, "image_size": image_size})
    else:
        response_format.update({"aspect_ratio": aspect_ratio if aspect_ratio in {"16:9", "9:16"} else "16:9", "resolution": resolution})
    payload = _request_json(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        payload={"model": selected_model, "input": input_value, "response_format": response_format},
        headers={"x-goog-api-key": key},
        timeout=float(os.getenv("GEMINI_MEDIA_TIMEOUT_SECONDS", "180")),
    )
    output = _output_from_steps(payload, kind)
    if not output:
        raise MediaGenerationError("Gemini concluiu sem devolver o arquivo de mídia.")
    data = str(output.get("data") or "")
    mime_type = str(output.get("mime_type") or ("image/png" if kind == "image" else "video/mp4"))
    return {
        "ok": True,
        "provider": "gemini",
        "model": selected_model,
        "kind": kind,
        "status": payload.get("status", "completed"),
        "mime_type": mime_type,
        "data_url": _data_url(data, mime_type),
        "source": "api",
    }


def _generate_openai_image(prompt: str, *, model: str | None, size: str, aspect_ratio: str) -> dict[str, Any]:
    key = _key("openai")
    if not key:
        raise MediaGenerationError("OPENAI_API_KEY não configurada no ambiente.")
    selected_model = model or models()["openai"]["image"]
    valid_sizes = {"1024x1024", "1536x1024", "1024x1536"}
    selected_size = size if size in valid_sizes else {"9:16": "1024x1536", "1:1": "1024x1024"}.get(aspect_ratio, "1536x1024")
    payload = _request_json(
        "https://api.openai.com/v1/images/generations",
        payload={
            "model": selected_model,
            "prompt": prompt,
            "size": selected_size,
            "quality": os.getenv("OPENAI_IMAGE_QUALITY", "auto"),
        },
        headers={"Authorization": f"Bearer {key}"},
        timeout=float(os.getenv("OPENAI_MEDIA_TIMEOUT_SECONDS", "180")),
    )
    item = (payload.get("data") or [{}])[0]
    if item.get("b64_json"):
        mime_type = "image/png"
        data_url = _data_url(item["b64_json"], mime_type)
    elif item.get("url"):
        mime_type = "image/png"
        data_url = item["url"]
    else:
        raise MediaGenerationError("OpenAI concluiu sem devolver a imagem.")
    return {"ok": True, "provider": "openai", "model": selected_model, "kind": "image",
            "status": "completed", "mime_type": mime_type, "data_url": data_url, "source": "api"}


def _generate_openai_video(prompt: str, *, model: str | None, size: str, seconds: int) -> dict[str, Any]:
    key = _key("openai")
    if not key:
        raise MediaGenerationError("OPENAI_API_KEY não configurada no ambiente.")
    selected_model = model or models()["openai"]["video"]
    payload = _request_json(
        "https://api.openai.com/v1/videos",
        payload={"model": selected_model, "prompt": prompt, "size": size, "seconds": str(seconds)},
        headers={"Authorization": f"Bearer {key}"},
        timeout=float(os.getenv("OPENAI_VIDEO_CREATE_TIMEOUT_SECONDS", "90")),
    )
    video_id = str(payload.get("id") or "")
    if not video_id:
        raise MediaGenerationError("OpenAI não devolveu o identificador do vídeo.")
    return {
        "ok": True,
        "provider": "openai",
        "model": selected_model,
        "kind": "video",
        "status": payload.get("status", "queued"),
        "job_id": video_id,
        "poll_url": f"/api/bible/ai/media/video/{urllib.parse.quote(video_id, safe='')}",
        "content_url": f"/api/bible/ai/media/video/{urllib.parse.quote(video_id, safe='')}/content",
        "source": "api",
    }


def generate(*, provider: str, kind: str, prompt: str, model: str | None = None,
             aspect_ratio: str = "16:9", image_size: str = "1K", resolution: str = "720p",
             size: str = "1280x720", seconds: int = 8,
             reference_image: str | None = None, visual_title: str = "Cena bíblica",
             visual_reference: str = "Passagem em estudo", visual_place: str = "Lugar bíblico relacionado",
             visual_stage: str = "Leitura da passagem") -> dict[str, Any]:
    clean_kind = str(kind or "image").strip().lower()
    if clean_kind not in {"image", "video"}:
        raise MediaGenerationError("Tipo de mídia inválido; use image ou video.")
    clean_prompt = build_visual_prompt(
        prompt,
        title=visual_title,
        reference=visual_reference,
        place=visual_place,
        stage=visual_stage,
        kind=clean_kind,
    )
    if len(clean_prompt) < 3:
        raise MediaGenerationError("Informe um prompt com pelo menos 3 caracteres.")
    if len(clean_prompt) > 8000:
        raise MediaGenerationError("O prompt ultrapassa o limite de 8.000 caracteres.")
    requested = str(provider or "auto").strip().lower()
    cfg = configured()
    if requested == "auto":
        order = [item.strip().lower() for item in os.getenv("LOGOS_MEDIA_PROVIDER_ORDER", "gemini,openai").split(",")]
        candidates = [item for item in order if item in cfg and cfg[item]]
    else:
        candidates = [requested] if requested in cfg and cfg[requested] else []
    if not candidates:
        raise MediaGenerationError("Nenhum provedor selecionado está configurado no ambiente do Logos.")
    errors: list[str] = []
    for candidate in candidates:
        try:
            if candidate == "gemini":
                return _generate_gemini(clean_kind, clean_prompt, model=model, aspect_ratio=aspect_ratio,
                                        image_size=image_size, resolution=resolution, reference_image=reference_image)
            if clean_kind == "image":
                if reference_image:
                    raise MediaGenerationError("O anexo de referência nesta primeira versão é enviado ao Gemini; para OpenAI use o prompt ou abra o ChatGPT Plus.")
                return _generate_openai_image(clean_prompt, model=model, size=size, aspect_ratio=aspect_ratio)
            return _generate_openai_video(clean_prompt, model=model, size=size, seconds=max(1, min(int(seconds), 20)))
        except MediaGenerationError as error:
            errors.append(f"{candidate}: {error}")
    raise MediaGenerationError("Os provedores falharam. " + " | ".join(errors))


def video_status(video_id: str) -> dict[str, Any]:
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,160}", video_id or ""):
        raise MediaGenerationError("Identificador de vídeo inválido.")
    key = _key("openai")
    if not key:
        raise MediaGenerationError("OPENAI_API_KEY não configurada no ambiente.")
    payload = _request_json(
        f"https://api.openai.com/v1/videos/{urllib.parse.quote(video_id, safe='')}",
        method="GET",
        headers={"Authorization": f"Bearer {key}"},
        timeout=float(os.getenv("OPENAI_VIDEO_STATUS_TIMEOUT_SECONDS", "45")),
    )
    status_value = payload.get("status", "unknown")
    return {
        "ok": True,
        "provider": "openai",
        "kind": "video",
        "job_id": video_id,
        "status": status_value,
        "progress": payload.get("progress", 0),
        "model": payload.get("model"),
        "content_url": f"/api/bible/ai/media/video/{urllib.parse.quote(video_id, safe='')}/content" if status_value == "completed" else None,
    }


def video_content(video_id: str) -> tuple[bytes, str]:
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,160}", video_id or ""):
        raise MediaGenerationError("Identificador de vídeo inválido.")
    key = _key("openai")
    if not key:
        raise MediaGenerationError("OPENAI_API_KEY não configurada no ambiente.")
    request = urllib.request.Request(
        f"https://api.openai.com/v1/videos/{urllib.parse.quote(video_id, safe='')}/content",
        headers={"Authorization": f"Bearer {key}", "Accept": "video/mp4"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=float(os.getenv("OPENAI_VIDEO_CONTENT_TIMEOUT_SECONDS", "180"))) as response:
            return response.read(), response.headers.get_content_type() or "video/mp4"
    except urllib.error.HTTPError as error:
        raise MediaGenerationError(f"OpenAI não liberou o conteúdo do vídeo (HTTP {error.code}).") from error
    except urllib.error.URLError as error:
        raise MediaGenerationError(f"Download do vídeo indisponível: {error.reason}") from error
