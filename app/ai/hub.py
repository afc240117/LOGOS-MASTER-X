import importlib,os,time
PROVIDERS={"gemini":"app.ai.providers.gemini","groq":"app.ai.providers.groq","openrouter":"app.ai.providers.openrouter","huggingface":"app.ai.providers.huggingface","openai":"app.ai.providers.openai","9router":"app.ai.providers.ninerouter"}
KEYS={"gemini":"GEMINI_API_KEY","groq":"GROQ_API_KEY","openrouter":"OPENROUTER_API_KEY","huggingface":"HUGGINGFACE_API_KEY","openai":"OPENAI_API_KEY","9router":"NINEROUTER_API_KEY"}
ORDERS={
# Perfis do LOGOS MASTER X 3.5.0. Nenhum perfil reduz max_tokens ou encurta o material.
# Rápido e Automático priorizam Gemini para reduzir latência; Econômico mantém 9Router em primeiro.
"rapido":["gemini","groq","openrouter","openai","huggingface","9router"],
"economico":["9router","gemini","groq","openrouter","huggingface","openai"],
"automatico":["gemini","groq","openrouter","openai","huggingface","9router"],
"qualidade":["gemini","openai","groq","openrouter","huggingface","9router"]
}
class AIHub:
 def configured(self): return {p:bool(os.getenv(k)) for p,k in KEYS.items()}
 def models(self): return {"openai":os.getenv("OPENAI_MODEL","gpt-5-mini"),"gemini":os.getenv("GEMINI_MODEL","gemini-3.6-flash"),"groq":os.getenv("GROQ_MODEL","llama-3.3-70b-versatile"),"openrouter":os.getenv("OPENROUTER_MODEL","openrouter/auto"),"huggingface":os.getenv("HUGGINGFACE_DEFAULT_MODEL") or os.getenv("HUGGINGFACE_MODEL","Qwen/Qwen2.5-7B-Instruct"),"9router":os.getenv("NINEROUTER_MODEL") or os.getenv("9ROUTER_MODEL","oc/deepseek-v4-flash-free")}
 def order(self,mode="automatico"):
  env_name={"rapido":"LOGOS_AI_ORDER_RAPIDO","economico":"LOGOS_AI_ORDER_ECONOMICO","automatico":"LOGOS_AI_ORDER","qualidade":"LOGOS_AI_ORDER_QUALIDADE"}.get(mode,"")
  raw=os.getenv(env_name,"").strip() if env_name else ""
  order=[x.strip().lower() for x in raw.split(",") if x.strip() and x.strip().lower() in PROVIDERS] if raw else list(ORDERS.get(mode,ORDERS["automatico"]))
  # Prefer 9Router only when it is actually configured. This preserves offline/tests
  # and avoids selecting an unavailable local router. Set LOGOS_PREFER_9ROUTER=false to disable.
  prefer=os.getenv("LOGOS_PREFER_9ROUTER","false").strip().lower() not in ("0","false","no","off")
  if prefer and self.configured().get("9router"):
   order=["9router"]+[x for x in order if x!="9router"]
  return order
 def generate(self,prompt,instructions,provider="auto",mode="automatico",model=None,max_tokens=12000):
  cfg=self.configured(); candidates=[provider] if provider not in ("auto","automatico","") else self.order(mode); errors=[]
  for p in candidates:
   if p not in PROVIDERS: errors.append(f"{p}: desconhecido"); continue
   if not cfg.get(p): errors.append(f"{p}: não configurado"); continue
   try:
    mod=importlib.import_module(PROVIDERS[p]); start=time.perf_counter()
    r=mod.generate(prompt,instructions,model=model if len(candidates)==1 else None,max_tokens=max_tokens)
    return {"provider":r.provider,"model":r.model,"text":r.text,"seconds":round(time.perf_counter()-start,3),"fallback_errors":errors}
   except Exception as e: errors.append(f"{p}: {type(e).__name__}: {str(e)[:300]}")
  raise RuntimeError("Todos os provedores falharam. "+" | ".join(errors))
