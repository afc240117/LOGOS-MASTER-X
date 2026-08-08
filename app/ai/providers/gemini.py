import os,json,urllib.request,urllib.parse,urllib.error
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=12000):
 key=os.getenv("GEMINI_API_KEY")
 if not key: raise ProviderError("GEMINI_API_KEY ausente")
 model=model or os.getenv("GEMINI_MODEL","gemini-3.6-flash")
 url="https://generativelanguage.googleapis.com/v1beta/models/"+urllib.parse.quote(model,safe="-._")+":generateContent"
 body={"system_instruction":{"parts":[{"text":instructions}]},"contents":[{"role":"user","parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":max_tokens,"temperature":.65}}
 req=urllib.request.Request(url,data=json.dumps(body).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key},method="POST")
 try:
  with urllib.request.urlopen(req,timeout=180) as r: payload=json.loads(r.read().decode())
 except urllib.error.HTTPError as e: raise ProviderError(f"Gemini HTTP {e.code}: "+e.read().decode(errors="ignore")[:400])
 parts=payload.get("candidates",[{}])[0].get("content",{}).get("parts",[])
 text="\n".join(p.get("text","") for p in parts if isinstance(p,dict)).strip()
 if not text: raise ProviderError("Gemini retornou vazio")
 return ProviderResult("gemini",model,text)
