import os
from openai import OpenAI
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=12000):
 key=os.getenv("MISTRAL_API_KEY")
 if not key: raise ProviderError("MISTRAL_API_KEY ausente")
 model=model or os.getenv("MISTRAL_MODEL","mistral-small-latest")
 r=OpenAI(api_key=key,base_url="https://api.mistral.ai/v1").chat.completions.create(model=model,messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],max_tokens=max_tokens,temperature=.65)
 text=(r.choices[0].message.content or "").strip()
 if not text: raise ProviderError("Mistral retornou vazio")
 return ProviderResult("mistral",model,text)
