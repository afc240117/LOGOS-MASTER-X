"""Mídia X · Nuvem sincronizada entre aparelhos (celular ⇄ PC / Render).

Catálogo persistente POR ESPAÇO (código do dono, 4–32 letras/números). Qualquer
aparelho com o mesmo código pode:
  • ENVIAR itens (multipart: arquivo + metadados) — a chave é o sha256 do
    CONTEÚDO, então o mesmo arquivo enviado de dois aparelhos vira UMA linha
    (deduplicação natural). Envio é idempotente (repetir não duplica).
  • LISTAR e BAIXAR tudo o que já está na nuvem do espaço.

Assim, se o celular tem 10 imagens e o PC tem 10 (outras), os dois ENVIAM e
RECEBEM e ambos convergem para as 20. No celular o app filtra imagens+vídeos;
no PC ele envia todos os tipos — aqui o servidor não discrimina tipo.

Persistência: arquivos em data/mediacloud/{WS}/{sha[:2]}/{sha}{ext} e um SQLite
leve (data/mediacloud.sqlite3) com os metadados. Disco efêmero do Render: dura
enquanto a instância está de pé e sobrevive a redeploys do código SÓ se o disco
persistir; para backup duradouro, reenviar da Mídia X local após um redeploy.

Uso pessoal do dono do app — o código do espaço é a credencial (igual sharebox).
"""

import hashlib
import json
import re
import sqlite3
import threading
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/bible/mediacloud", tags=["Mídia X · nuvem"])

_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "mediacloud"
_DB = Path(__file__).resolve().parent.parent.parent / "data" / "mediacloud.sqlite3"
_WS_RE = re.compile(r"^[A-Za-z0-9]{4,32}$")
_SHA_RE = re.compile(r"^[0-9a-f]{64}$")
_MIME_BY_EXT = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "avif": "image/avif",
    "mp4": "video/mp4", "webm": "video/webm", "mov": "video/quicktime",
    "m4v": "video/mp4", "mp3": "audio/mpeg", "wav": "audio/wav",
    "ogg": "audio/ogg", "oga": "audio/ogg", "m4a": "audio/mp4",
    "pdf": "application/pdf", "txt": "text/plain", "json": "application/json",
}
_LOCK = threading.Lock()
_MAX_META = 64 * 1024


def _norm_ws(ws: str) -> str:
    ws = (ws or "").strip()
    if not _WS_RE.match(ws):
        raise HTTPException(400, "Código de espaço inválido: use 4 a 32 letras/números.")
    return ws.upper()


def _db() -> sqlite3.Connection:
    _DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB), timeout=30)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS items ("
        " ws TEXT NOT NULL, sha TEXT NOT NULL, meta TEXT NOT NULL,"
        " size INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL,"
        " PRIMARY KEY (ws, sha))"
    )
    return conn


def _ext_of(mime: str) -> str:
    mime = (mime or "").lower()
    if "png" in mime:
        return ".png"
    if "webp" in mime:
        return ".webp"
    if "gif" in mime:
        return ".gif"
    if "avif" in mime:
        return ".avif"
    if "webm" in mime:
        return ".webm"
    if "mp4" in mime or "quicktime" in mime or "m4v" in mime or "m4a" in mime:
        return ".mp4"
    if "mpeg" in mime or mime.startswith("audio") or mime == "audio/mp4":
        return ".mp3"
    if "pdf" in mime:
        return ".pdf"
    if "text/plain" in mime or "text" in mime:
        return ".txt"
    return ".bin"


def _path_for(ws: str, sha: str, ext: str) -> Path:
    d = _ROOT / ws / sha[:2]
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{sha}{ext}"


def _safe_meta(raw: str) -> dict:
    try:
        meta = json.loads(raw or "{}")
    except ValueError:
        raise HTTPException(400, "meta deve ser um JSON válido.")
    if not isinstance(meta, dict):
        raise HTTPException(400, "meta deve ser um objeto.")
    return meta


@router.post("/{ws}/items")
async def cloud_upload(ws: str, file: UploadFile = File(...), meta: str = Form(default="{}")):
    """Envia UM item para a nuvem do espaço. Chave = sha256 do conteúdo.

    Idempotente: se o sha já existe, retorna a linha atual sem duplicar.
    """
    ws = _norm_ws(ws)
    try:
        data = await file.read()
    except Exception:
        raise HTTPException(400, "Falha ao ler o arquivo enviado.")
    if not data:
        raise HTTPException(400, "Arquivo vazio.")
    meta_obj = _safe_meta(meta)
    if len(json.dumps(meta_obj, ensure_ascii=False)) > _MAX_META:
        raise HTTPException(400, "Metadados grandes demais.")
    sha = hashlib.sha256(data).hexdigest()
    ext = _ext_of(str(meta_obj.get("mime") or ""))
    with _LOCK:
        conn = _db()
        try:
            cur = conn.execute(
                "SELECT meta, size, created FROM items WHERE ws=? AND sha=?", (ws, sha)
            )
            row = cur.fetchone()
            if row:
                stored_meta = json.loads(row[0])
                return {
                    "ok": True,
                    "sha": sha,
                    "exists": True,
                    "size": row[1],
                    "created": row[2],
                    "item": {**stored_meta, "sha": sha, "url": f"/api/bible/mediacloud/{ws}/files/{sha}"},
                }
            target = _path_for(ws, sha, ext)
            target.write_bytes(data)
            created = meta_obj.get("createdAt") or __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ).isoformat()
            meta_obj["createdAt"] = created
            conn.execute(
                "INSERT OR IGNORE INTO items (ws, sha, meta, size, created) VALUES (?,?,?,?,?)",
                (ws, sha, json.dumps(meta_obj, ensure_ascii=False), len(data), created),
            )
            conn.commit()
            return {
                "ok": True,
                "sha": sha,
                "exists": False,
                "size": len(data),
                "created": created,
                "item": {**meta_obj, "sha": sha, "url": f"/api/bible/mediacloud/{ws}/files/{sha}"},
            }
        finally:
            conn.close()


@router.get("/{ws}/items")
def cloud_list(ws: str):
    ws = _norm_ws(ws)
    with _LOCK:
        conn = _db()
        try:
            rows = conn.execute(
                "SELECT sha, meta, size, created FROM items WHERE ws=? ORDER BY created, sha", (ws,)
            ).fetchall()
        finally:
            conn.close()
    items = []
    for sha, meta, size, created in rows:
        try:
            m = json.loads(meta)
        except ValueError:
            m = {}
        items.append(
            {**m, "sha": sha, "size": size, "created": created,
             "url": f"/api/bible/mediacloud/{ws}/files/{sha}"}
        )
    return {"ok": True, "ws": ws, "count": len(items), "items": items}


@router.get("/{ws}/files/{sha}")
def cloud_file(ws: str, sha: str):
    ws = _norm_ws(ws)
    sha = (sha or "").lower().strip()
    if not _SHA_RE.match(sha):
        raise HTTPException(400, "sha inválido.")
    with _LOCK:
        conn = _db()
        try:
            row = conn.execute(
                "SELECT meta FROM items WHERE ws=? AND sha=?", (ws, sha)
            ).fetchone()
        finally:
            conn.close()
    if not row:
        raise HTTPException(404, "Item não encontrado na nuvem.")
    try:
        mime = json.loads(row[0]).get("mime") or ""
    except ValueError:
        mime = ""
    ext = _ext_of(mime)
    target = _path_for(ws, sha, ext)
    if not target.is_file():
        raise HTTPException(404, "Arquivo ausente no disco.")
    media_type = _MIME_BY_EXT.get(ext.lstrip(".").lower(), "application/octet-stream")
    return FileResponse(target, media_type=media_type, filename=f"{sha}{ext}")


@router.delete("/{ws}/items/{sha}")
def cloud_delete(ws: str, sha: str):
    """Apaga UM item do espaço (e o arquivo, se sobrar sem referência)."""
    ws = _norm_ws(ws)
    sha = (sha or "").lower().strip()
    if not _SHA_RE.match(sha):
        raise HTTPException(400, "sha inválido.")
    with _LOCK:
        conn = _db()
        try:
            conn.execute("DELETE FROM items WHERE ws=? AND sha=?", (ws, sha))
            conn.commit()
        finally:
            conn.close()
    return {"ok": True, "ws": ws, "sha": sha, "deleted": True}
