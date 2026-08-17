import json,os,sqlite3,subprocess,re
from pathlib import Path
from fastapi import FastAPI,HTTPException,Header,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
from app.core.env import load_project_env
from app.biblia_x.router import router as biblia_x_router

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
app.include_router(biblia_x_router)
class Generate(BaseModel):
 mode:str="SERMÃO";text:str=Field(min_length=1);theme:str|None=None;duration:int=40;cult:str="Avivamento";audience:str="Igreja local";intensity:int=10;objective:str|None=None;notes:str|None=None;provider:str="auto";ai_mode:str="automatico";model:str|None=None
class BibleCommentAI(BaseModel):
 reference:str=Field(min_length=1)
 verse_text:str=Field(min_length=1)
 expert:str=Field(min_length=1)
 objective:str=""
 format:str="brief"
class SyncPayload(BaseModel): payload:dict
def robj(r):return PromptRequest(r.mode,r.text,r.theme or "",r.duration,r.cult,r.audience,r.intensity,r.objective or "",r.notes or "")


_BIBLE_BOOK_ALIASES={"gn":"Gênesis","ex":"Êxodo","lv":"Levítico","nm":"Números","dt":"Deuteronômio","js":"Josué","jz":"Juízes","rt":"Rute","1sm":"1 Samuel","2sm":"2 Samuel","1rs":"1 Reis","2rs":"2 Reis","1cr":"1 Crônicas","2cr":"2 Crônicas","ed":"Esdras","ne":"Neemias","et":"Ester","jó":"Jó","sl":"Salmos","pv":"Provérbios","ec":"Eclesiastes","ct":"Cantares","is":"Isaías","jr":"Jeremias","lm":"Lamentações","lam":"Lamentações","ez":"Ezequiel","dn":"Daniel","os":"Oséias","jl":"Joel","am":"Amós","ob":"Obadias","jn":"Jonas","mq":"Miquéias","na":"Naum","hc":"Habacuque","sf":"Sofonias","ag":"Ageu","zc":"Zacarias","ml":"Malaquias","mt":"Mateus","mc":"Marcos","lc":"Lucas","jo":"João","at":"Atos","rm":"Romanos","1co":"1 Coríntios","2co":"2 Coríntios","gl":"Gálatas","ef":"Efésios","fp":"Filipenses","cl":"Colossenses","1ts":"1 Tessalonicenses","2ts":"2 Tessalonicenses","1tm":"1 Timóteo","2tm":"2 Timóteo","tt":"Tito","fm":"Filemom","hb":"Hebreus","tg":"Tiago","1pe":"1 Pedro","2pe":"2 Pedro","1jo":"1 João","2jo":"2 João","3jo":"3 João","jd":"Judas","ap":"Apocalipse"}
def _normalize_bible_reference(value:str):
    raw=(value or "").strip()
    m=re.match(r"^\s*((?:[1-3]\s*)?[A-Za-zÀ-ÿ]+)\s+(\d+)(?:\s*[:.,]?\s*(\d+))?(?:\s*(?:[-–:]|\s)\s*(\d+))?\s*$",re.sub(r"\s+"," ",raw))
    if not m:return raw,None
    book=_BIBLE_BOOK_ALIASES.get(re.sub(r"\s+","",m.group(1)).lower())
    if not book:return raw,None
    n=f"{book} {m.group(2)}"
    if m.group(3):n+=f":{m.group(3)}"
    if m.group(4):n+=f"–{m.group(4)}"
    return n,{"original":raw,"normalized":n,"book":book}
def _apply_reference_normalization(r):
    n,meta=_normalize_bible_reference(str(getattr(r,"text","") or ""))
    if meta:r.text=n
    return meta

def _word_count(text:str)->int:
    return len(re.findall(r"\S+", text or ""))

def _duration_target(duration:int):
    d=max(10,min(90,int(duration or 40)))
    if d<=20:return (1800,2400,3)
    if d<=30:return (2600,3400,4)
    if d<=35:return (3000,3900,4)
    if d<=40:return (3800,5000,4)
    if d<=50:return (4500,5800,5)
    if d<=60:return (5400,7000,5)
    return (6200,8000,5)

def _duration_gate(quality_result:dict, material:str, duration:int, mode:str):
    q=dict(quality_result or {})
    if str(mode).upper() in {"ESBOÇO","ESBOCO","CONTEXTO","REVISAR"}:return q
    planned=max(1,int(duration or 1)); words=_word_count(material)
    estimated=max(1,round(words/127)); coverage=max(0,min(100,round(estimated/planned*100)))
    original=int(q.get("score",0) or 0); duration_score=coverage if coverage<80 else 100
    q["score"]=min(original,duration_score) if original else duration_score
    q["duration_words"]=words;q["estimated_minutes"]=estimated;q["duration_coverage_percent"]=coverage
    q["duration_passed"]=coverage>=80;q["passed"]=bool(q.get("passed",True) and q["duration_passed"] and q["score"]>=80)
    if not q["duration_passed"]:q["duration_warning"]=f"Duração insuficiente: ~{estimated} min estimados para {planned} min planejados."
    return q

def _compact_long_context(r:Generate, plan:str):
    return f"""LOGOS MASTER X — GERAÇÃO LONGA SEGMENTADA
Modo: {r.mode}
Texto/Tema: {r.text}
Tema complementar: {r.theme or "—"}
Duração planejada: {r.duration} minutos
Culto/Ocasião: {r.cult}
Público: {r.audience}
DNA K7: {r.intensity}/10
Objetivo: {r.objective or "—"}
Notas: {r.notes or "—"}

PLANO MESTRE JÁ DEFINIDO:
{plan}

REGRAS FIXAS:
- Fidelidade ao texto bíblico e prudência interpretativa.
- Não inventar fatos, etimologias, milagres, testemunhos ou referências.
- Não repetir introdução, título, grande ideia ou conclusão em todos os blocos.
- Escrever como parte de UMA ÚNICA mensagem contínua.
- Cada parágrafo deve acrescentar exposição, interpretação, aplicação ou progressão.
- DNA K7 alto significa progressão, clímax e apelo; não significa frases de efeito vazias.
"""

def _clean_segment(text:str)->str:
    """Remove cabeçalhos redundantes que o modelo possa repetir dentro de um bloco."""
    t=(text or "").strip()
    t=re.sub(r"^\s*#{1,6}\s+.*?\n+", "", t, count=1)
    t=re.sub(r"^\s*\*\*[^*\n]{2,120}\*\*\s*\n+", "", t, count=1)
    return t.strip()

def _section(title:str, body:str)->str:
    return f"### {title}\n\n{_clean_segment(body)}".strip()

def _organization_contract(r:Generate, movement_count:int)->str:
    return f"""CONTRATO DE ORGANIZAÇÃO — OBRIGATÓRIO
A saída final será organizada pelo LOGOS MASTER X e deve manter:
1. IDENTIFICAÇÃO GERAL
2. INTRODUÇÃO
3 em diante. MOVIMENTOS EXPOSITIVOS numerados e com títulos claros
Depois dos movimentos:
🔥 DNA K7 — INTENSIFICAÇÃO PROGRESSIVA
⚡ CLÍMAX HOMILÉTICO
CONCLUSÃO
🙏 APELO E ORAÇÃO
✅ REVISÃO DE ALINHAMENTO

REGRAS:
- Numeração rigorosamente crescente, sem repetir números e sem regressões.
- Cada movimento deve separar claramente: 📖 Texto de apoio, 🔎 Observação, 🧠 Interpretação e 🎯 Aplicações.
- Evite blocos soltos chamados apenas 'Observações finais', 'Se desejar' ou ofertas de continuação.
- Não use frases como 'Se desejar, posso...' no material final.
- Não transforme o sermão em checklist técnico.
- A organização deve parecer uma mensagem pronta para estudo/púlpito, semelhante a um material editorial profissional.
- Quantidade planejada de movimentos expositivos: {movement_count}.
"""


def _looks_corrupted_generation(text:str)->bool:
    """V8.8: validação conservadora para evitar falsos positivos."""
    t=(text or "").strip()
    if len(t)<100:
        return True
    foreign=len(re.findall(r"[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]",t))
    if foreign>=12:
        return True
    return False

def _longform_primary_provider():
    """Para geração longa, prioriza qualidade estável e evita provedores já conhecidos como limitados."""
    cfg=AI.configured()
    # OpenAI primeiro: usuário possui créditos e foi o motor mais consistente.
    if cfg.get("openai"):
        return "openai"
    if cfg.get("openrouter"):
        return "openrouter"
    if cfg.get("groq"):
        return "groq"
    return "auto"

def _manual_block(prompt,system,provider,model,max_tokens):
    """Uma tentativa no provedor principal + um fallback direto, sem percorrer toda a fila."""
    candidates=[]
    for p in (provider,"openrouter","openai"):
        if p and p not in candidates and p!="auto":
            candidates.append(p)
    last=None
    for p in candidates:
        try:
            out=AI.generate(prompt,system,p,"manual",model,max_tokens)
            text=(out.get("text") or "").strip()
            if text and not _looks_corrupted_generation(text):
                return out
            last=RuntimeError(f"{p} retornou bloco vazio/corrompido")
            print(f"[AI-V8.6] {p} rejeitado: bloco vazio/corrompido")
        except Exception as exc:
            last=exc
            print(f"[AI-V8.6] {p} falhou: {type(exc).__name__}: {exc}")
    if last:raise last
    raise RuntimeError("Nenhum provedor válido respondeu.")

def _segmented_generate(r:Generate):
    """
    V8.6 RÁPIDO REAL:
    - duas chamadas longas em paralelo;
    - sem chamada de mapa;
    - OpenAI como motor principal de long-form quando configurado;
    - fallback direto apenas para OpenRouter/OpenAI;
    - sem HuggingFace no meio da mensagem.
    """
    from concurrent.futures import ThreadPoolExecutor
    target_min,target_max,_=_duration_target(r.duration)
    d=int(r.duration or 40)
    base_prompt=PROMPTS.build(robj(r))
    provider=_longform_primary_provider()
    model=r.model

    editorial=f"""
PADRÃO EDITORIAL LOGOS MASTER X — OBRIGATÓRIO

Estrutura final:
### 📖 1. IDENTIFICAÇÃO GERAL
### 🎯 2. IDEIA CENTRAL
### 🧭 3. INTRODUÇÃO E CONTEXTO
### 📖 4. MOVIMENTO 1
### 📖 5. MOVIMENTO 2
### 📖 6. MOVIMENTO 3
### ✝️ 7. CRISTO NA MENSAGEM
### 🔥 8. DNA K7 — INTENSIFICAÇÃO PROGRESSIVA
### ⚡ 9. CLÍMAX HOMILÉTICO
### 📣 10. RESPOSTA DA IGREJA
### 🙏 11. APELO E ORAÇÃO
### ✅ 12. REVISÃO DE ALINHAMENTO

Dentro dos movimentos:
🔎 Observação do Texto
🧠 Interpretação
💡 Aplicação
➡️ Transição

REGRAS:
- Português brasileiro limpo e natural.
- Sem bolinhas decorativas repetidas.
- A referência normalizada é soberana; nunca trocar o livro.
- Não repetir literalmente explicações/aplicações.
- Cristo na Mensagem somente quando biblicamente responsável.
- DNA K7 intensifica; não reconta os movimentos.
- Clímax concentra; não cria doutrina nova.
- Apelo nasce do texto.
- Não escrever "Se desejar, posso...".
- Não produzir palavras quebradas, mistura de idiomas ou texto corrompido.
"""

    body_target=max(1700,round(target_min*0.63))
    finish_target=max(900,round(target_min*0.34))

    common=f"""{base_prompt}

{editorial}

REFERÊNCIA/PEDIDO NORMALIZADO:
{r.text}
Duração: {d} min
Culto: {r.cult}
Público: {r.audience}
DNA K7: {r.intensity}/10
Objetivo: {r.objective or "—"}
"""

    body_prompt=f"""{common}

BLOCO A — CORPO PRINCIPAL
Produza aproximadamente {body_target}–{body_target+300} palavras.
Entregue EXATAMENTE as seções 1 a 7:
Identificação, Ideia Central, Introdução/Contexto, 3 Movimentos e Cristo na Mensagem.
Nos três movimentos desenvolva de verdade observação, interpretação, aplicação e transição.
Não gere DNA K7, clímax, resposta, apelo ou revisão."""

    finish_prompt=f"""{common}

BLOCO B — FECHAMENTO
Produza aproximadamente {finish_target}–{finish_target+250} palavras.
Entregue EXATAMENTE as seções 8 a 12:
DNA K7, Clímax, Resposta da Igreja, Apelo/Oração e Revisão de Alinhamento.
Considere que as seções 1 a 7 já explicaram o texto em três movimentos.
Não reescreva os movimentos. Faça o fechamento avançar a mensagem."""

    system=PROMPTS.system_instructions()
    # Duas chamadas ao mesmo tempo: o tempo total tende a ser o tempo da mais lenta.
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_body=ex.submit(_manual_block,body_prompt,system,provider,model,
                         min(5200,int(os.getenv("LOGOS_MAX_OUTPUT_TOKENS","12000"))))
        f_finish=ex.submit(_manual_block,finish_prompt,system,provider,model,
                           min(4200,int(os.getenv("LOGOS_MAX_OUTPUT_TOKENS","12000"))))
        out_body=f_body.result()
        out_finish=f_finish.result()

    body=(out_body.get("text") or "").strip()
    finish=(out_finish.get("text") or "").strip()
    final_text=(body+"\n\n---\n\n"+finish).strip()
    final_text=re.sub(r"(?is)\n+\s*Se desejar[,:\s].*$","",final_text).strip()

    seconds=max(float(out_body.get("seconds",0) or 0),float(out_finish.get("seconds",0) or 0))
    providers=[out_body.get("provider",""),out_finish.get("provider","")]
    models=[out_body.get("model",""),out_finish.get("model","")]
    errors=list(out_body.get("fallback_errors",[]) or [])+list(out_finish.get("fallback_errors",[]) or [])
    cleanp=[x for x in providers if x]; cleanm=[x for x in models if x]

    return {
        "text":final_text,
        "provider":max(set(cleanp),key=cleanp.count) if cleanp else provider,
        "model":max(set(cleanm),key=cleanm.count) if cleanm else model,
        "seconds":round(seconds,3),
        "fallback_errors":errors,
        "segmented":True,
        "segments":2,
        "expansion_rounds":0,
        "target_words":{"min":target_min,"max":target_max},
        "actual_words":_word_count(final_text),
        "parallel":True
    }

@app.get("/",include_in_schema=False)
def home():return FileResponse(STATIC/"index.html",media_type="text/html; charset=utf-8",headers={"Cache-Control":"no-store, max-age=0"})
@app.get("/version.json",include_in_schema=False)
def frontend_version():return FileResponse(STATIC/"version.json",media_type="application/json",headers={"Cache-Control":"no-store, max-age=0"})
@app.get("/favicon.ico",include_in_schema=False)
def favicon():return FileResponse(STATIC/"brand"/"app-icon-fixed-192.png",media_type="image/png",headers={"Cache-Control":"public, max-age=86400"})
@app.get("/api/health")
def health():
 c=AI.configured();return {"status":"ok","version":"LOGOS-MASTER-X-3.8.2","ai":any(c.values()),"providers":c,"models":AI.models(),"modes":["rapido","economico","automatico","qualidade","manual"],"orders":{m:AI.order(m) for m in ["rapido","economico","automatico","qualidade"]},"prompt_engine":"modular-2.0","think_engine":"14-stage","dna_k7":"engine","quality_gate":True,"capabilities":["studio","ai-hub","think-engine","dna-k7","quality-gate","bible-local","library","projects","editor","pulpit","backup"]}
@app.get("/api/ai-metrics")
def ai_metrics(): return AI.metrics()



def _local_dev(request:Request):
    if request.client and request.client.host not in {"127.0.0.1","::1","localhost"}:
        raise HTTPException(403,"Update Center disponível somente na máquina local")

PROJECT_ROOT=BASE.parent
GIT_REMOTE_URL=os.getenv("LOGOS_GIT_REMOTE","https://github.com/afc240117/LOGOS-MASTER-X.git").strip()

def _git_process(*args,timeout=120):
    try:
        return subprocess.run(["git",*args],cwd=PROJECT_ROOT,text=True,capture_output=True,timeout=timeout)
    except FileNotFoundError:
        raise HTTPException(503,"Git não está instalado ou não está disponível no PATH do Windows.")
    except subprocess.TimeoutExpired:
        raise HTTPException(504,"O Git demorou demais para responder. Verifique sua internet e tente novamente.")

def _git_text(value):
    # Python/subprocess normalmente devolve string com capture_output=True,
    # mas alguns ambientes Windows podem devolver None para comandos sem saída.
    # O Update Center nunca deve cair por tentar executar .strip() em None.
    return (value or "").strip()

def _git(*args,timeout=120):
    r=_git_process(*args,timeout=timeout)
    if r.returncode!=0:
        raise HTTPException(500,_git_text(r.stderr) or _git_text(r.stdout) or "Falha Git")
    return _git_text(r.stdout)

def _git_repo_ready():
    r=_git_process("rev-parse","--is-inside-work-tree",timeout=15)
    return r.returncode==0 and _git_text(r.stdout).lower()=="true"

def _git_origin_url():
    if not _git_repo_ready(): return ""
    r=_git_process("remote","get-url","origin",timeout=15)
    return _git_text(r.stdout) if r.returncode==0 else ""

def _ensure_git_identity():
    name=_git_process("config","user.name",timeout=15)
    email=_git_process("config","user.email",timeout=15)
    if name.returncode!=0 or not _git_text(name.stdout):
        _git("config","user.name","LOGOS MASTER X")
    if email.returncode!=0 or not _git_text(email.stdout):
        _git("config","user.email","logos-master-x@localhost")

def _repair_git_repository():
    """Reconecta uma cópia local que perdeu .git sem alterar seus arquivos.

    O reset --mixed move apenas HEAD/index para origin/main e mantém o working
    tree exatamente como está. Assim as diferenças locais reaparecem no status
    e podem ser commitadas normalmente pelo Update Center.
    """
    if _git_repo_ready():
        if not _git_origin_url():
            _git("remote","add","origin",GIT_REMOTE_URL)
        return {"repaired":False,"origin":_git_origin_url()}

    # Nunca usamos clone/checkout/reset --hard aqui: eles poderiam substituir
    # a cópia local que o usuário está desenvolvendo.
    init=_git_process("init","-b","main")
    if init.returncode!=0:
        # Compatibilidade com versões antigas do Git sem suporte a init -b.
        _git("init")
        _git_process("symbolic-ref","HEAD","refs/heads/main")

    origin=_git_origin_url()
    if not origin:
        _git("remote","add","origin",GIT_REMOTE_URL)
    elif origin!=GIT_REMOTE_URL:
        # Em um repositório recém-reconstruído não deve ocorrer, mas mantemos
        # o remoto configurado explicitamente para evitar publicar no destino errado.
        _git("remote","set-url","origin",GIT_REMOTE_URL)

    try:
        _git("fetch","origin","main",timeout=180)
    except HTTPException as exc:
        # Se a conexão falhar, removemos apenas o .git recém-criado para não
        # deixar um repositório parcial que pareça saudável na próxima tentativa.
        import shutil
        git_dir=PROJECT_ROOT/".git"
        if git_dir.exists(): shutil.rmtree(git_dir,ignore_errors=True)
        raise HTTPException(exc.status_code,"Não foi possível reconectar ao GitHub. Seus arquivos locais não foram alterados. "+str(exc.detail))

    # FUNDAMENTAL: --mixed preserva todos os arquivos locais.
    _git("reset","--mixed","origin/main")
    _git_process("branch","--set-upstream-to=origin/main","main",timeout=15)
    return {"repaired":True,"origin":_git_origin_url() or GIT_REMOTE_URL}

@app.get("/api/dev/status")
def dev_status(request:Request):
    _local_dev(request)
    if not _git_repo_ready():
        return {"ok":True,"repository":False,"repairable":True,"branch":"main","dirty":True,"files":[],"commit":"—","origin":GIT_REMOTE_URL,"message":"Vínculo Git ausente. Clique em Publicar para reconectar ao GitHub sem apagar os arquivos locais."}
    status=_git("status","--porcelain")
    commit=_git_process("rev-parse","--short","HEAD",timeout=15)
    return {"ok":True,"repository":True,"repairable":False,"branch":_git("branch","--show-current") or "main","dirty":bool(status),"files":[x for x in status.splitlines() if x],"commit":_git_text(commit.stdout) if commit.returncode==0 else "—","origin":_git_origin_url()}

@app.post("/api/dev/publish")
def dev_publish(request:Request):
    _local_dev(request)
    repair=_repair_git_repository()
    _ensure_git_identity()

    # Atualiza a referência do GitHub antes de publicar. Isso evita tentar
    # um push com origin/main antigo e também permite publicar commits locais
    # já existentes mesmo quando não há arquivos modificados no momento.
    _git("fetch","origin","main",timeout=180)

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
        return {"ok":True,"message":("Vínculo Git restaurado. " if repair.get("repaired") else "")+"Local e GitHub já estão sincronizados","commit":_git("rev-parse","--short","HEAD"),"target":"https://logos-master-x-api.onrender.com","git_repaired":bool(repair.get("repaired"))}

    is_remote_ancestor=subprocess.run(
        ["git","merge-base","--is-ancestor","origin/main","HEAD"],
        cwd=BASE.parent,text=True,capture_output=True
    ).returncode==0
    if not is_remote_ancestor:
        raise HTTPException(409,"GitHub possui alterações que não estão no projeto local. Sincronização manual necessária antes de publicar; nenhum arquivo foi sobrescrito.")

    _git("push","origin","main")
    return {"ok":True,"message":("Vínculo Git restaurado. " if repair.get("repaired") else "")+"GitHub atualizado; o Render deve iniciar o deploy automático","commit":_git("rev-parse","--short","HEAD"),"target":"https://logos-master-x-api.onrender.com","git_repaired":bool(repair.get("repaired"))}

@app.get("/api/diagnostics")
def diagnostics():
    cfg=AI.configured()
    return {
        "status":"ok",
        "version":"LOGOS-MASTER-X-3.8.2",
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


@app.post("/api/bible-comment-ai")
def bible_comment_ai(r:BibleCommentAI):
    """Complemento bíblico curto. Não usa pipeline de sermão nem revisor longo."""
    import time
    mode=(r.format or "brief").strip().lower()
    if mode not in {"brief","topics"}: mode="brief"
    if mode=="brief":
        format_rule="Entregue 3 a 5 linhas objetivas, no máximo 110 palavras."
    else:
        format_rule="Entregue 4 a 6 tópicos objetivos, no máximo 130 palavras."
    instructions="""Você é um comentarista bíblico conciso do LOGOS MASTER X.
Responda em português brasileiro. Trabalhe somente o texto fornecido.
Não gere sermão, introdução homilética, clímax, apelo, oração ou conclusão longa.
Não invente dados históricos, arqueológicos ou dos idiomas originais.
Quando algum dado exigir confirmação externa, escreva 'confirmar em fonte'.
Seja complementar: o usuário já está lendo o versículo."""
    prompt=f"""BÍBLIA X — COMENTÁRIO CURTO
Passagem: {r.reference}
Texto: {r.verse_text}
Especialista: {r.expert}
Objetivo: {r.objective or 'Complementar a leitura a partir desta perspectiva.'}
Formato: {format_rule}

Responda imediatamente no formato pedido."""
    errors=[]
    # 1) OpenAI direto: uma chamada pequena, sem Smart Router e sem Quality Gate.
    if os.getenv("OPENAI_API_KEY"):
        started=time.perf_counter()
        try:
            from openai import OpenAI
            client=OpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=float(os.getenv("BIBLE_COMMENT_OPENAI_TIMEOUT","28")), max_retries=0)
            model=os.getenv("BIBLE_COMMENT_OPENAI_MODEL") or os.getenv("OPENAI_MODEL","gpt-5-mini")
            resp=client.responses.create(
                model=model,
                instructions=instructions,
                input=prompt,
                max_output_tokens=int(os.getenv("BIBLE_COMMENT_MAX_OUTPUT_TOKENS","900"))
            )
            text=(getattr(resp,"output_text",None) or "").strip()
            if not text:
                chunks=[]
                for item in getattr(resp,"output",[]) or []:
                    for content in getattr(item,"content",[]) or []:
                        t=getattr(content,"text",None)
                        if t: chunks.append(str(t))
                text="\n".join(chunks).strip()
            if text:
                return {"ok":True,"provider":"openai","model":model,"text":text,"seconds":round(time.perf_counter()-started,3),"format":mode}
            errors.append("openai: resposta vazia")
        except Exception as e:
            errors.append(f"openai: {type(e).__name__}: {str(e)[:180]}")
    # 2) OpenRouter direto e curto.
    if os.getenv("OPENROUTER_API_KEY"):
        started=time.perf_counter()
        try:
            from openai import OpenAI
            client=OpenAI(api_key=os.getenv("OPENROUTER_API_KEY"), base_url="https://openrouter.ai/api/v1",
                          timeout=float(os.getenv("BIBLE_COMMENT_OPENROUTER_TIMEOUT","24")), max_retries=0)
            model=os.getenv("BIBLE_COMMENT_OPENROUTER_MODEL") or os.getenv("OPENROUTER_MODEL","openrouter/auto")
            resp=client.chat.completions.create(
                model=model,
                messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],
                max_tokens=int(os.getenv("BIBLE_COMMENT_MAX_OUTPUT_TOKENS","900")),
                temperature=.35
            )
            text=(resp.choices[0].message.content or "").strip()
            if text:
                return {"ok":True,"provider":"openrouter","model":model,"text":text,"seconds":round(time.perf_counter()-started,3),"format":mode}
            errors.append("openrouter: resposta vazia")
        except Exception as e:
            errors.append(f"openrouter: {type(e).__name__}: {str(e)[:180]}")
    raise HTTPException(502,detail="Comentário IA curto indisponível. "+" | ".join(errors))

@app.post("/api/generate-ai")
def generate(r:Generate):
 reference_meta=_apply_reference_normalization(r)
 try:
  # V7: mensagens completas longas são segmentadas para evitar respostas-resumo.
  use_segmented=str(r.mode).upper() in {"SERMÃO","SERMAO","ESTUDAR","AULA"} and int(r.duration or 0)>=30
  out=_segmented_generate(r) if use_segmented else AI.generate(PROMPTS.build(robj(r)),PROMPTS.system_instructions(),r.provider,r.ai_mode,r.model,int(os.getenv("LOGOS_MAX_OUTPUT_TOKENS","12000")))
  quality_result=independent_review(AI,out["text"],r.mode,out.get("provider"))
  # Autocorreção segura sugerida pelo revisor independente.
  final_text=quality_result.pop("corrected_text",out["text"])
  quality_result=_duration_gate(quality_result,final_text,r.duration,r.mode)
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