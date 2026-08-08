import os
from openai import OpenAI
from .base import ProviderResult,ProviderError
def generate(prompt,instructions,model=None,max_tokens=12000):
 key=os.getenv("OPENAI_API_KEY")
 if not key: raise ProviderError("OPENAI_API_KEY ausente")
 model=model or os.getenv("OPENAI_MODEL","gpt-5-mini")
 r=OpenAI(api_key=key).responses.create(model=model,instructions=instructions,input=prompt,max_output_tokens=max_tokens)
 text=getattr(r,"output_text","") or ""
 if not text.strip(): raise ProviderError("OpenAI retornou vazio")
 return ProviderResult("openai",model,text)
