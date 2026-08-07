import os, sqlite3, json, secrets
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE=Path(__file__).resolve().parent
STATIC=BASE/"web"/"static"
DB=BASE.parent/"data"/"sync.sqlite3"

app=FastAPI(title="LOGOS MASTER X API",version="1.0")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
app.mount("/static",StaticFiles(directory=STATIC),name="static")

def db():
    DB.parent.mkdir(parents=True,exist_ok=True)
    c=sqlite3.connect(DB)
    c.execute("create table if not exists sync(workspace text primary key, payload text not null, updated text default current_timestamp)")
    return c

class Generate(BaseModel):
    mode:str="sermão"
    text:str
    theme:str|None=None
    prompt:str|None=None

class SyncPayload(BaseModel):
    payload:dict

@app.get("/",include_in_schema=False)
def home(): return FileResponse(STATIC/"index.html")

@app.get("/api/health")
def health():
    return {"status":"ok","version":"LOGOS-MASTER-X","ai":bool(os.getenv("OPENAI_API_KEY"))}

@app.post("/api/generate-ai")
def generate_ai(req:Generate):
    if not os.getenv("OPENAI_API_KEY"):
        return {"engine":"local-fallback","text":f"LOGOS MASTER X — {req.mode.upper()}\\n\\nTexto/Tema: {req.text}\\n\\nA API está online, mas a IA ainda não foi configurada no servidor. O aplicativo pode continuar em modo local ou abrir o ChatGPT com o Prompt Mestre."}
    try:
        from openai import OpenAI
        client=OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        rsp=client.responses.create(
            model=os.getenv("OPENAI_MODEL","gpt-5-mini"),
            instructions="Você é o motor do LOGOS MASTER X. Responda em português do Brasil. Preserve fidelidade bíblica, contexto e linguagem inteligível. Não invente citações, etimologias ou fatos. Não use glossolalia.",
            input=req.prompt or f"Modo: {req.mode}\\nTexto: {req.text}\\nTema: {req.theme or ''}"
        )
        return {"engine":"openai","text":rsp.output_text}
    except Exception as e:
        raise HTTPException(500,str(e))

def auth(x_sync_token:str|None):
    configured=os.getenv("LOGOS_SYNC_TOKEN")
    if not configured: raise HTTPException(503,"Sincronização cloud não configurada")
    if x_sync_token!=configured: raise HTTPException(401,"Token inválido")

@app.put("/api/sync/{workspace}")
def sync_put(workspace:str, body:SyncPayload, x_sync_token:str|None=Header(default=None)):
    auth(x_sync_token); c=db()
    c.execute("insert into sync(workspace,payload,updated) values(?,?,datetime('now')) on conflict(workspace) do update set payload=excluded.payload,updated=datetime('now')",(workspace,json.dumps(body.payload,ensure_ascii=False)))
    c.commit(); c.close(); return {"ok":True}

@app.get("/api/sync/{workspace}")
def sync_get(workspace:str,x_sync_token:str|None=Header(default=None)):
    auth(x_sync_token); c=db(); row=c.execute("select payload,updated from sync where workspace=?",(workspace,)).fetchone(); c.close()
    if not row:return {"payload":{},"updated":None}
    return {"payload":json.loads(row[0]),"updated":row[1]}
