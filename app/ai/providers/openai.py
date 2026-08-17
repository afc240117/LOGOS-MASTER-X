import os
from openai import OpenAI
from .base import ProviderResult, ProviderError

def _extract_response_text(response):
    text=getattr(response,"output_text",None)
    if text and str(text).strip():return str(text).strip()
    chunks=[]
    for item in getattr(response,"output",[]) or []:
        for content in getattr(item,"content",[]) or []:
            t=getattr(content,"text",None)
            if t:chunks.append(str(t))
    return "\n".join(chunks).strip()

def generate(prompt,instructions,model=None,max_tokens=12000):
    key=os.getenv("OPENAI_API_KEY")
    if not key:raise ProviderError("OPENAI_API_KEY ausente")
    model=model or os.getenv("OPENAI_MODEL","gpt-5-mini")

    # V8.6: uma única tentativa. Evita 45s + retry = ~90s.
    timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS","55"))
    client=OpenAI(api_key=key,timeout=timeout,max_retries=0)

    # Respeita o orçamento pedido pelo bloco; não força 16k em toda chamada.
    cap=int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS","8000"))
    budget=max(2500,min(int(max_tokens),cap))

    response=client.responses.create(
        model=model,
        instructions=instructions,
        input=prompt,
        max_output_tokens=budget,
    )
    text=_extract_response_text(response)
    if not text:
        status=getattr(response,"status","unknown")
        incomplete=getattr(response,"incomplete_details",None)
        raise ProviderError(f"OpenAI sem texto final (status={status}, incomplete={incomplete})")
    return ProviderResult("openai",model,text)
