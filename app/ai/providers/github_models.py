import os
from openai import OpenAI
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=12000):
 key=os.getenv("GITHUB_MODELS_TOKEN")
 if not key: raise ProviderError("GITHUB_MODELS_TOKEN ausente")
 model=model or os.getenv("GITHUB_MODEL","openai/gpt-4.1-mini")
 r=OpenAI(api_key=key,base_url="https://models.github.ai/inference").chat.completions.create(model=model,messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],max_tokens=max_tokens,temperature=.65)
 text=(r.choices[0].message.content or "").strip()
 if not text: raise ProviderError("GitHub Models retornou vazio")
 return ProviderResult("github",model,text)
