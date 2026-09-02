import os
from openai import OpenAI
from .base import ProviderResult, ProviderError


def generate(prompt, instructions, model=None, max_tokens=12000):
    key = os.getenv("NINEROUTER_API_KEY") or os.getenv("9ROUTER_API_KEY")
    if not key:
        raise ProviderError("NINEROUTER_API_KEY ausente")

    base_url = (os.getenv("NINEROUTER_BASE_URL") or os.getenv("9ROUTER_BASE_URL") or "http://127.0.0.1:20128/v1").rstrip("/")
    model = model or os.getenv("NINEROUTER_MODEL") or os.getenv("9ROUTER_MODEL") or "oc/deepseek-v4-flash-free"

    client = OpenAI(api_key=key, base_url=base_url, timeout=45.0, max_retries=1)
    r = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=.65,
    )
    text = (r.choices[0].message.content or "").strip()
    if not text:
        raise ProviderError("9Router retornou vazio")
    return ProviderResult("9router", model, text)
