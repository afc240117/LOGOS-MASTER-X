import json,os,sqlite3,subprocess
from pathlib import Path
from fastapi import FastAPI,HTTPException,Header,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
from app.core.env import load_project_env

# Load project .env before AIHub is instantiated, so provider keys/models are available.
# Local project .env is authoritative when present. This fixes Windows/session variables
# (including empty/stale values) masking keys restored into the project .env.
ENV_FILE = load_project_env(override=True)
from app.ai.hub import AIHub
from app.prompt_engine import PromptEngine,PromptRequest
from app.think.engine import build_plan
from app.quality.gate import evaluate
from app.quality.reviewer import independent_review
BASE=Path(__file__).resolve().parent;STATIC=BASE/"web"/"static";DB=BASE.parent/"data"/"sync.sqlite3";AI=AIHub();PROMPTS=PromptEngine()
app=FastAPI(title="LOGOS MASTER X API",version="3.8.2");app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"]);app.mount("/static",StaticFiles(directory=STATIC),name="static")
class Generate(BaseModel):
 mode:str="SERMÃO";text:str=Field(min_length=1);theme:str|None=None;duration:int=40;cult:str="Avivamento";audience:str="Igreja local";intensity:int=10;objective:str|None=None;notes:str|None=None;provider:str="auto";ai_mode:str="automatico";model:str|None=None
class SyncPayload(BaseModel): payload:dict
def robj(r):return PromptRequest(r.mode,r.text,r.theme or "",r.duration,r.cult,r.audience,r.intensity,r.objective or "",r.notes or "")
@app.get("/",include_in_schema=False)
def home():return FileResponse(STATIC/"index.html",media_type="text/html; charset=utf-8",headers={"Cache-Control":"no-store, max-age=0"})
@app.get("/version.json",include_in_schema=False)
def frontend_version():return FileResponse(STATIC/"version.json",media_type="application/json",headers={"Cache-Control":"no-store, max-age=0"})
@app.get("/api/health")
def health():
 c=AI.configured();return {"status":"ok","version":"LOGOS-MASTER-X-3.8.1","ai":any(c.values()),"providers":c,"models":AI.models(),"modes":["rapido","economico","automatico","qualidade","manual"],"orders":{m:AI.order(m) for m in ["rapido","economico","automatico","qualidade"]},"prompt_engine":"modular-2.0","think_engine":"14-stage","dna_k7":"engine","quality_gate":True,"capabilities":["studio","ai-hub","think-engine","dna-k7","quality-gate","bible-local","library","projects","editor","pulpit","backup"]}
@app.get("/api/ai-metrics")
def ai_metrics(): return AI.metrics()



def _local_dev(request:Request):
    if request.client and request.client.host not in {"127.0.0.1","::1","localhost"}:
        raise HTTPException(403,"Update Center disponível somente na máquina local")

def _git(*args):
    r=subprocess.run(["git",*args],cwd=BASE.parent,text=True,capture_output=True,timeout=60)
    if r.returncode!=0: raise HTTPException(500,(r.stderr or r.stdout or "Falha Git").strip())
    return r.stdout.strip()

@app.get("/api/dev/status")
def dev_status(request:Request):
    _local_dev(request)
    status=_git("status","--porcelain")
    return {"ok":True,"branch":_git("branch","--show-current") or "main","dirty":bool(status),"files":[x for x in status.splitlines() if x],"commit":_git("rev-parse","--short","HEAD")}

@app.post("/api/dev/publish")
def dev_publish(request:Request):
    _local_dev(request)

    # Atualiza a referência do GitHub antes de publicar. Isso evita tentar
    # um push com origin/main antigo e também permite publicar commits locais
    # já existentes mesmo quando não há arquivos modificados no momento.
    _git("fetch","origin","main")

    status=_git("status","--porcelain")
    if status:
        _git("add","-A")
        # Nunca publique segredos locais mesmo se uma configuração Git externa mudar.
        subprocess.run(["git","reset","--",".env"],cwd=BASE.parent,text=True,capture_output=True)
        # Pode acontecer de só .env estar alterado; nesse caso não há nada para commit.
        staged=subprocess.run(["git","diff","--cached","--quiet"],cwd=BASE.parent).returncode
        if staged!=0:
            _git("commit","-m","LOGOS MASTER X - Atualizacao pelo Update Center")

    # Publicação segura: nunca usa force. Se o GitHub estiver à frente ou o
    # histórico divergir, interrompe e explica em vez de sobrescrever dados.
    local=_git("rev-parse","HEAD")
    remote=_git("rev-parse","origin/main")
    if local==remote:
        return {"ok":True,"message":"Local e GitHub já estão sincronizados","commit":_git("rev-parse","--short","HEAD"),"target":"https://logos-master-x-api.onrender.com"}

    is_remote_ancestor=subprocess.run(
        ["git","merge-base","--is-ancestor","origin/main","HEAD"],
        cwd=BASE.parent,text=True,capture_output=True
    ).returncode==0
    if not is_remote_ancestor:
        raise HTTPException(409,"GitHub possui alterações que não estão no projeto local. Sincronização manual necessária antes de publicar; nenhum arquivo foi sobrescrito.")

    _git("push","origin","main")
    return {"ok":True,"message":"GitHub atualizado; o Render deve iniciar o deploy automático","commit":_git("rev-parse","--short","HEAD"),"target":"https://logos-master-x-api.onrender.com"}

@app.get("/api/diagnostics")
def diagnostics():
    cfg=AI.configured()
    return {
        "status":"ok",
        "version":"LOGOS-MASTER-X-3.8.1",
        "configured_providers":[k for k,v in cfg.items() if v],
        "provider_count":sum(1 for v in cfg.values() if v),
        "default_models":AI.models(),
        "router_orders":{m:AI.order(m) for m in ["rapido","economico","automatico","qualidade"]},
        "prompt_engine":"modular-2.0",
        "think_engine":"14-stage",
        "dna_k7":True,
        "quality_gate":True
    }

@app.post("/api/think-plan")
def think_plan(r:Generate):return build_plan(r.mode,r.text,r.duration,r.intensity).__dict__
@app.post("/api/prompt-preview")
def prompt_preview(r:Generate):
 p=PROMPTS.build(robj(r));return {"prompt":p,"characters":len(p)}
@app.post("/api/quality")
def quality(b:dict):return evaluate(str(b.get("text","")),str(b.get("mode","SERMÃO")))

@app.post("/api/provider-test/{provider}")
def provider_test(provider:str):
 try:
  out=AI.generate("Responda somente: LOGOS OK", "Teste técnico de conectividade. Seja breve.", provider=provider, mode="manual", max_tokens=800)
  return {"ok":True,"provider":out["provider"],"model":out["model"],"seconds":out["seconds"],"preview":out["text"][:180]}
 except Exception as e:
  raise HTTPException(502,detail=str(e))

@app.post("/api/generate-ai")
def generate(r:Generate):
 try:
  out=AI.generate(PROMPTS.build(robj(r)),PROMPTS.system_instructions(),r.provider,r.ai_mode,r.model,int(os.getenv("LOGOS_MAX_OUTPUT_TOKENS","12000")))
  quality_result=independent_review(AI,out["text"],r.mode,out.get("provider"))
  # Autocorreção 3.5.1: aplica somente trocas exatas e seguras sugeridas pelo revisor independente.
  final_text=quality_result.pop("corrected_text",out["text"])
  return {"engine":"logos-ai-hub","prompt_engine":"modular-2.0","think_engine":"14-stage",**out,"text":final_text,"quality":quality_result}
 except Exception as e: raise HTTPException(502,detail=f"AI HUB: {e}")
def db():
 DB.parent.mkdir(parents=True,exist_ok=True);c=sqlite3.connect(DB);c.execute("create table if not exists sync(workspace text primary key,payload text not null,updated text default current_timestamp)");return c
def auth(t):
 c=os.getenv("LOGOS_SYNC_TOKEN")
 if not c:raise HTTPException(503,"Sincronização cloud não configurada")
 if t!=c:raise HTTPException(401,"Token inválido")
@app.put("/api/sync/{workspace}")
def put(workspace:str,b:SyncPayload,x_sync_token:str|None=Header(default=None)):
 auth(x_sync_token);c=db();c.execute("insert into sync(workspace,payload,updated) values(?,?,datetime('now')) on conflict(workspace) do update set payload=excluded.payload,updated=datetime('now')",(workspace,json.dumps(b.payload,ensure_ascii=False)));c.commit();c.close();return {"ok":True}
@app.get("/api/sync/{workspace}")
def get(workspace:str,x_sync_token:str|None=Header(default=None)):
 auth(x_sync_token);c=db();r=c.execute("select payload,updated from sync where workspace=?",(workspace,)).fetchone();c.close();return {"payload":json.loads(r[0]),"updated":r[1]} if r else {"payload":{},"updated":None}
