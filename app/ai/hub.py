import importlib,os,time
PROVIDERS={"gemini":"app.ai.providers.gemini","groq":"app.ai.providers.groq","openrouter":"app.ai.providers.openrouter","huggingface":"app.ai.providers.huggingface","openai":"app.ai.providers.openai"}
KEYS={"gemini":"GEMINI_API_KEY","groq":"GROQ_API_KEY","openrouter":"OPENROUTER_API_KEY","huggingface":"HUGGINGFACE_API_KEY","openai":"OPENAI_API_KEY"}
ORDERS={
"economico":["gemini","groq","openrouter","huggingface","openai"],
"automatico":["gemini","groq","openrouter","huggingface","openai"],
"qualidade":["openai","gemini","groq","openrouter","huggingface"]
}
class AIHub:
 def configured(self): return {p:bool(os.getenv(k)) for p,k in KEYS.items()}
 def models(self): return {"openai":os.getenv("OPENAI_MODEL","gpt-5-mini"),"gemini":os.getenv("GEMINI_MODEL","gemini-3.6-flash"),"groq":os.getenv("GROQ_MODEL","llama-3.3-70b-versatile"),"openrouter":os.getenv("OPENROUTER_MODEL","openrouter/auto"),"huggingface":os.getenv("HUGGINGFACE_DEFAULT_MODEL") or os.getenv("HUGGINGFACE_MODEL","Qwen/Qwen2.5-7B-Instruct")}
 def order(self,mode="automatico"):
  raw=os.getenv("LOGOS_AI_ORDER","").strip() if mode=="automatico" else ""
  return [x.strip().lower() for x in raw.split(",") if x.strip() and x.strip().lower() in PROVIDERS] if raw else ORDERS.get(mode,ORDERS["automatico"])
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
