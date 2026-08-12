import os
from openai import OpenAI
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=12000):
 key=os.getenv("GROQ_API_KEY")
 if not key: raise ProviderError("GROQ_API_KEY ausente")
 model=model or os.getenv("GROQ_MODEL","llama-3.3-70b-versatile")
 r=OpenAI(api_key=key,base_url="https://api.groq.com/openai/v1").chat.completions.create(model=model,messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],max_tokens=min(max_tokens,32768),temperature=.65)
 text=(r.choices[0].message.content or "").strip()
 if not text: raise ProviderError("Groq retornou vazio")
 return ProviderResult("groq",model,text)
