import importlib,os,time,threading
from collections import defaultdict,deque

PROVIDERS={"gemini":"app.ai.providers.gemini","groq":"app.ai.providers.groq","openrouter":"app.ai.providers.openrouter","huggingface":"app.ai.providers.huggingface","openai":"app.ai.providers.openai","9router":"app.ai.providers.ninerouter"}
KEYS={"gemini":"GEMINI_API_KEY","groq":"GROQ_API_KEY","openrouter":"OPENROUTER_API_KEY","huggingface":"HUGGINGFACE_API_KEY","openai":"OPENAI_API_KEY","9router":"NINEROUTER_API_KEY"}
PUBLIC_PROVIDERS=["gemini","groq","openrouter","openai","huggingface"]
FUTURE_PROVIDERS=["cerebras","together","fireworks"]
ORDERS={
 "rapido":["gemini","groq","openrouter","openai","huggingface"],
 "economico":["groq","gemini","openrouter","huggingface","openai"],
 "automatico":["gemini","groq","openrouter","openai","huggingface"],
 "qualidade":["gemini","openai","groq","openrouter","huggingface"]
}

class AIHub:
 def __init__(self):
  self._lock=threading.Lock(); self._stats=defaultdict(lambda:{"requests":0,"success":0,"errors":0,"rate_limits":0,"seconds_total":0.0,"last_error":"","last_status":"idle","last_at":0.0})
  self._recent=defaultdict(lambda:deque(maxlen=20)); self._started=time.time()
 def is_public_server(self): return bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID") or os.getenv("LOGOS_PUBLIC_SERVER","false").lower() in ("1","true","yes","on"))
 def configured(self):
  out={p:bool(os.getenv(k)) for p,k in KEYS.items()}
  if self.is_public_server(): out["9router"]=False
  return out
 def models(self): return {"openai":os.getenv("OPENAI_MODEL","gpt-5-mini"),"gemini":os.getenv("GEMINI_MODEL","gemini-3.6-flash"),"groq":os.getenv("GROQ_MODEL","llama-3.3-70b-versatile"),"openrouter":os.getenv("OPENROUTER_MODEL","openrouter/auto"),"huggingface":os.getenv("HUGGINGFACE_DEFAULT_MODEL") or os.getenv("HUGGINGFACE_MODEL","Qwen/Qwen2.5-7B-Instruct"),"9router":os.getenv("NINEROUTER_MODEL") or os.getenv("9ROUTER_MODEL","oc/deepseek-v4-flash-free")}
 def _smart_score(self,p,mode):
  s=self._stats[p]; recent=list(self._recent[p]); avg=(sum(x[1] for x in recent if x[0])/max(1,sum(1 for x in recent if x[0]))) if recent else 15.0
  error_rate=(sum(1 for x in recent if not x[0])/len(recent)) if recent else 0
  base={"gemini":0,"groq":1,"openrouter":2,"openai":3,"huggingface":4}.get(p,9)
  if mode=="rapido": return avg + error_rate*40 + base*.15
  if mode=="economico": return {"groq":0,"gemini":.5,"openrouter":1.5,"huggingface":2,"openai":4}.get(p,5)+error_rate*30+avg*.03
  if mode=="qualidade": return {"gemini":0,"openai":.5,"groq":1.5,"openrouter":2,"huggingface":3}.get(p,5)+error_rate*35+avg*.02
  return base*.35+error_rate*45+avg*.08
 def order(self,mode="automatico"):
  env_name={"rapido":"LOGOS_AI_ORDER_RAPIDO","economico":"LOGOS_AI_ORDER_ECONOMICO","automatico":"LOGOS_AI_ORDER","qualidade":"LOGOS_AI_ORDER_QUALIDADE"}.get(mode,"")
  raw=os.getenv(env_name,"").strip() if env_name else ""
  configured=self.configured()
  base=[x.strip().lower() for x in raw.split(",") if x.strip().lower() in PROVIDERS] if raw else list(ORDERS.get(mode,ORDERS["automatico"]))
  available=[p for p in base if configured.get(p)]
  # Smart Router: usa saúde/latência recente para reordenar os provedores online.
  if os.getenv("LOGOS_SMART_ROUTER","true").lower() not in ("0","false","no","off"):
   available=sorted(available,key=lambda p:self._smart_score(p,mode))
  # 9Router é sempre reserva final e apenas no ambiente local.
  if not self.is_public_server() and configured.get("9router") and "9router" not in available: available.append("9router")
  return available or [p for p in base if p!="9router"]
 def _record(self,p,ok,seconds,error=""):
  with self._lock:
   s=self._stats[p];s["requests"]+=1;s["last_at"]=time.time();s["last_status"]="online" if ok else "error"
   if ok:s["success"]+=1;s["seconds_total"]+=seconds
   else:
    s["errors"]+=1;s["last_error"]=error[:180]
    if "429" in error or "rate" in error.lower() or "limit" in error.lower():s["rate_limits"]+=1;s["last_status"]="limited"
   self._recent[p].append((ok,seconds,time.time()))
 def metrics(self):
  cfg=self.configured(); total=sum(v["success"] for v in self._stats.values()); rows={}
  for p in PUBLIC_PROVIDERS:
   s=dict(self._stats[p]);avg=round(s["seconds_total"]/s["success"],2) if s["success"] else None
   rows[p]={**s,"configured":bool(cfg.get(p)),"avg_seconds":avg,"share_pct":round((s["success"]/total*100),1) if total else 0,"status":s["last_status"] if s["requests"] else ("ready" if cfg.get(p) else "offline")}
  # Carga operacional ATUAL: janela móvel de 5 minutos. Erros/429 antigos não deixam o painel permanentemente laranja/vermelho.
  success=sum(x["success"] for x in rows.values()); errors=sum(x["errors"] for x in rows.values()); limits=sum(x["rate_limits"] for x in rows.values())
  now=time.time(); recent_events=[]
  for p in PUBLIC_PROVIDERS:
   for event in self._recent[p]:
    ts=event[2] if len(event)>2 else now
    if now-ts<=300: recent_events.append(event)
  recent_total=len(recent_events); recent_errors=sum(1 for x in recent_events if not x[0]); recent_slow=sum(1 for x in recent_events if x[0] and x[1]>=45)
  if recent_total==0: load="normal"
  elif recent_errors>=3 or (recent_total>=4 and recent_errors/recent_total>=.5): load="alta"
  elif recent_errors>=1 or recent_slow>=2 or recent_total>=12: load="moderada"
  else: load="normal"
  return {"smart_router":True,"environment":"public" if self.is_public_server() else "local","online_providers":sum(1 for p in PUBLIC_PROVIDERS if cfg.get(p)),"public_provider_total":len(PUBLIC_PROVIDERS),"providers":rows,"totals":{"requests":success+errors,"success":success,"errors":errors,"rate_limits":limits},"recent":{"window_minutes":5,"requests":recent_total,"errors":recent_errors,"slow":recent_slow},"load":load,"capacity_note":"Carga atual usa somente os últimos 5 minutos; totais históricos ficam separados. Cotas oficiais continuam sendo definidas por cada provedor.","future_slots":FUTURE_PROVIDERS,"local_reserve":{"provider":"9router","available":bool(cfg.get("9router")) and not self.is_public_server(),"label":"Reserva local"},"uptime_seconds":round(time.time()-self._started)}
 def generate(self,prompt,instructions,provider="auto",mode="automatico",model=None,max_tokens=12000):
  cfg=self.configured(); candidates=[provider] if provider not in ("auto","automatico","") else self.order(mode); errors=[]
  if self.is_public_server() and provider=="9router": candidates=[]; errors.append("9router: reserva local; indisponível no servidor público")
  for p in candidates:
   if p not in PROVIDERS: errors.append(f"{p}: desconhecido"); continue
   if not cfg.get(p): errors.append(f"{p}: não configurado"); continue
   start=time.perf_counter()
   try:
    mod=importlib.import_module(PROVIDERS[p]);r=mod.generate(prompt,instructions,model=model if len(candidates)==1 else None,max_tokens=max_tokens);elapsed=round(time.perf_counter()-start,3);self._record(p,True,elapsed)
    return {"provider":r.provider,"model":r.model,"text":r.text,"seconds":elapsed,"fallback_errors":errors,"smart_route":candidates}
   except Exception as e:
    elapsed=round(time.perf_counter()-start,3);err=f"{type(e).__name__}: {str(e)[:300]}";self._record(p,False,elapsed,err);errors.append(f"{p}: {err}")
  raise RuntimeError("Todos os provedores falharam. "+" | ".join(errors))
