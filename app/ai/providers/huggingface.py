import os
from openai import OpenAI
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=6000):
 key=os.getenv("HUGGINGFACE_API_KEY")
 if not key: raise ProviderError("HUGGINGFACE_API_KEY ausente")
 model=model or os.getenv("HUGGINGFACE_DEFAULT_MODEL") or os.getenv("HUGGINGFACE_MODEL","Qwen/Qwen2.5-7B-Instruct")
 r=OpenAI(api_key=key,base_url="https://router.huggingface.co/v1",timeout=45.0,max_retries=1).chat.completions.create(model=model,messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],max_tokens=max_tokens,temperature=.65)
 text=(r.choices[0].message.content or "").strip()
 if not text: raise ProviderError("Hugging Face retornou vazio")
 return ProviderResult("huggingface",model,text)
