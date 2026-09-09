"""Mídia X · Transferência entre aparelhos (celular → PC / Render).

Caixa de transferência por CÓDIGO (token de 4–12 letras/números). O aparelho
que envia grava arquivos (imagens/vídeos) + um manifest.json com os metadados
das linhas da Mídia X; o aparelho que recebe informa o mesmo código e importa
tudo para a Mídia X local (IndexedDB) de novo.

Voltado ao uso pessoal do dono do app — o próprio código é a credencial de
acesso. O conteúdo vive no diretório local/efêmero data/sharebox (some num
redeploy do Render; basta reenviar).
"""

import json
import re
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter(prefix="/api/bible/sharebox", tags=["Mídia X · transferência"])

_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "sharebox"
_CODE_RE = re.compile(r"^[A-Za-z0-9]{4,12}$")
_SAFE = re.compile(r"[^A-Za-z0-9._\-]+")
_MIME_BY_EXT = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "avif": "image/avif",
    "mp4": "video/mp4", "webm": "video/webm", "mov": "video/quicktime",
    "m4v": "video/mp4", "mp3": "audio/mpeg", "wav": "audio/wav",
    "ogg": "audio/ogg", "oga": "audio/ogg", "m4a": "audio/mp4",
    "pdf": "application/pdf", "txt": "text/plain", "json": "application/json",
}
_MAX_ITEMS = 300
_MANIFEST = "manifest.json"


def _normalize(code: str) -> str:
    code = (code or "").strip()
    if not _CODE_RE.match(code):
        raise HTTPException(400, "Código inválido: use 4 a 12 letras/números.")
    return code.upper()


def _dir(code: str) -> Path:
    d = _ROOT / _normalize(code)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _ext_of(mime: str) -> str:
    mime = (mime or "").lower()
    if "png" in mime:
        return ".png"
    if "webp" in mime:
        return ".webp"
    if "gif" in mime:
        return ".gif"
    if "webm" in mime:
        return ".webm"
    if "mp4" in mime or "quicktime" in mime:
        return ".mp4"
    if "mpeg" in mime or mime.startswith("audio"):
        return ".mp3"
    if "pdf" in mime:
        return ".pdf"
    return ".jpg"


@router.post("/{code}")
async def share_upload(
    code: str,
    files: list[UploadFile] = File(default=[]),
    manifest: str = Form(default=""),
):
    """Grava (substituindo) a caixa do código.

    Corpo multipart:
      • manifest: JSON — array de N entradas (metadados de cada item),
        ordem igual à dos itens selecionados;
      • file + idx: para cada item COM arquivo local — idx é a posição
        da entrada correspondente no manifest (0-based).
    """
    directory = _dir(code)
    # Substituição limpa: cada envio novo refaz a caixa inteira.
    shutil.rmtree(directory, ignore_errors=True)
    directory.mkdir(parents=True, exist_ok=True)

    try:
        entries = json.loads(manifest or "[]")
    except ValueError:
        raise HTTPException(400, "manifest deve ser um JSON válido (array).")
    if not isinstance(entries, list):
        raise HTTPException(400, "manifest deve ser um array.")
    entries = entries[:_MAX_ITEMS]
    by_idx: dict[int, bytes] = {}
    names: dict[int, str] = {}
    for i, f in enumerate(files or []):
        try:
            data = await f.read()
        except Exception:
            data = b""
        if not data:
            continue
        pos = None
        try:
            pos = int((f.filename or "").split("_", 1)[0])
        except (ValueError, TypeError):
            pass
        pos = pos if (pos is not None and 0 <= pos < len(entries)) else len(by_idx)
        by_idx[pos] = data
        names[pos] = _SAFE.sub("_", Path(f.filename or f"f{pos}.bin").name)[:60]

    for k, entry in enumerate(entries):
        if not isinstance(entry, dict):
            continue
        entry["file"] = ""
        if k in by_idx and by_idx[k]:
            mime = str(entry.get("mime") or _MIME_BY_EXT.get("")).lower()
            stored = f"{k}{_ext_of(mime)}"
            (directory / stored).write_bytes(by_idx[k])
            entry["file"] = stored
            entry["size"] = len(by_idx[k])

    (directory / _MANIFEST).write_text(
        json.dumps({"created": entries}, ensure_ascii=False), encoding="utf-8"
    )
    local_count = sum(1 for e in entries if e.get("file"))
    return {"ok": True, "code": code.upper(), "items": len(entries), "files": local_count}


@router.get("/{code}")
def share_list(code: str):
    directory = _dir(code)
    manifest_file = directory / _MANIFEST
    if not manifest_file.exists():
        return {"ok": True, "code": code.upper(), "count": 0, "items": []}
    try:
        data = json.loads(manifest_file.read_text(encoding="utf-8"))
    except ValueError:
        return {"ok": True, "code": code.upper(), "count": 0, "items": []}
    items = data.get("created", []) if isinstance(data, dict) else data
    for e in items:
        fname = e.get("file") or ""
        e["url"] = f"/api/bible/sharebox/{code.upper()}/files/{fname}" if fname else ""
    return {"ok": True, "code": code.upper(), "count": len(items), "items": items}


@router.get("/{code}/files/{name}")
def share_file(code: str, name: str):
    directory = _dir(code)
    safe = _SAFE.sub("_", name)
    target = directory / safe
    if not target.is_file():
        raise HTTPException(404, "Arquivo não encontrado na caixa.")
    ext = target.suffix.lower().lstrip(".")
    media_type = _MIME_BY_EXT.get(ext, "application/octet-stream")
    return FileResponse(target, media_type=media_type, filename=safe)


@router.delete("/{code}")
def share_clear(code: str):
    directory = _ROOT / _normalize(code)
    if directory.exists():
        shutil.rmtree(directory, ignore_errors=True)
    return {"ok": True, "code": code.upper(), "cleared": True}
