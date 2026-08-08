import json
import os
import sqlite3
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.prompt_engine import PromptEngine, PromptRequest

BASE = Path(__file__).resolve().parent
STATIC = BASE / "web" / "static"
DB = BASE.parent / "data" / "sync.sqlite3"
PROMPTS = PromptEngine()

app = FastAPI(title="LOGOS MASTER X API", version="1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def db():
    DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB)
    conn.execute(
        "create table if not exists sync("
        "workspace text primary key, payload text not null, "
        "updated text default current_timestamp)"
    )
    return conn


class Generate(BaseModel):
    mode: str = "SERMÃO"
    text: str = Field(min_length=1)
    theme: str | None = None
    duration: int = 40
    cult: str = "Avivamento"
    audience: str = "Igreja local"
    intensity: int = 3
    objective: str | None = None
    notes: str | None = None
    # Compatibilidade com clientes antigos. O novo frontend não precisa mandar
    # o Prompt Mestre inteiro, porque o servidor o monta sozinho.
    prompt: str | None = None


class SyncPayload(BaseModel):
    payload: dict


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(STATIC / "index.html")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "LOGOS-MASTER-X-1.1",
        "ai": bool(os.getenv("OPENAI_API_KEY")),
        "model": os.getenv("OPENAI_MODEL", "gpt-5-mini"),
        "prompt_engine": "server-side-k7",
    }


@app.post("/api/prompt-preview")
def prompt_preview(req: Generate):
    built = PROMPTS.build(
        PromptRequest(
            mode=req.mode,
            text=req.text,
            theme=req.theme or "",
            duration=req.duration,
            cult=req.cult,
            audience=req.audience,
            intensity=req.intensity,
            objective=req.objective or "",
            notes=req.notes or "",
        )
    )
    return {"prompt": built, "characters": len(built)}


@app.post("/api/generate-ai")
def generate_ai(req: Generate):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "engine": "local-fallback",
            "text": (
                f"LOGOS MASTER X — {req.mode.upper()}\n\n"
                f"Texto/Tema: {req.text}\n\n"
                "A API está online, mas a IA ainda não foi configurada no servidor."
            ),
        }

    request_data = PromptRequest(
        mode=req.mode,
        text=req.text,
        theme=req.theme or "",
        duration=req.duration,
        cult=req.cult,
        audience=req.audience,
        intensity=req.intensity,
        objective=req.objective or "",
        notes=req.notes or "",
    )

    # Clientes antigos podem ainda enviar um prompt pronto. No cliente atual,
    # o backend sempre monta o prompt a partir dos arquivos oficiais.
    input_prompt = req.prompt.strip() if req.prompt and req.prompt.strip() else PROMPTS.build(request_data)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
            instructions=PROMPTS.system_instructions(),
            input=input_prompt,
            max_output_tokens=int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "12000")),
        )
        return {
            "engine": "openai",
            "model": os.getenv("OPENAI_MODEL", "gpt-5-mini"),
            "mode": req.mode,
            "text": response.output_text,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Falha na geração: {exc}")


def auth(x_sync_token: str | None):
    configured = os.getenv("LOGOS_SYNC_TOKEN")
    if not configured:
        raise HTTPException(503, "Sincronização cloud não configurada")
    if x_sync_token != configured:
        raise HTTPException(401, "Token inválido")


@app.put("/api/sync/{workspace}")
def sync_put(workspace: str, body: SyncPayload, x_sync_token: str | None = Header(default=None)):
    auth(x_sync_token)
    conn = db()
    conn.execute(
        "insert into sync(workspace,payload,updated) values(?,?,datetime('now')) "
        "on conflict(workspace) do update set payload=excluded.payload,updated=datetime('now')",
        (workspace, json.dumps(body.payload, ensure_ascii=False)),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/sync/{workspace}")
def sync_get(workspace: str, x_sync_token: str | None = Header(default=None)):
    auth(x_sync_token)
    conn = db()
    row = conn.execute("select payload,updated from sync where workspace=?", (workspace,)).fetchone()
    conn.close()
    if not row:
        return {"payload": {}, "updated": None}
    return {"payload": json.loads(row[0]), "updated": row[1]}
