import os
from openai import OpenAI
from .base import ProviderResult,ProviderError

def generate(prompt,instructions,model=None,max_tokens=12000):
    key=os.getenv("OPENROUTER_API_KEY")
    if not key:raise ProviderError("OPENROUTER_API_KEY ausente")
    model=model or os.getenv("OPENROUTER_MODEL","openrouter/auto")
    timeout=float(os.getenv("OPENROUTER_TIMEOUT_SECONDS","55"))
    r=OpenAI(api_key=key,base_url="https://openrouter.ai/api/v1",timeout=timeout,max_retries=0).chat.completions.create(
        model=model,
        messages=[{"role":"system","content":instructions},{"role":"user","content":prompt}],
        max_tokens=min(int(max_tokens),int(os.getenv("OPENROUTER_MAX_OUTPUT_TOKENS","7000"))),
        temperature=.65
    )
    text=(r.choices[0].message.content or "").strip()
    if not text:raise ProviderError("OpenRouter retornou vazio")
    return ProviderResult("openrouter",model,text)
