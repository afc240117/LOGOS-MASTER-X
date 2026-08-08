import os
from openai import OpenAI
from .base import ProviderResult, ProviderError

def _extract_response_text(response):
    text = getattr(response, "output_text", None)
    if text and str(text).strip():
        return str(text).strip()

    chunks = []
    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            t = getattr(content, "text", None)
            if t:
                chunks.append(str(t))
    return "\n".join(chunks).strip()

def generate(prompt, instructions, model=None, max_tokens=12000):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise ProviderError("OPENAI_API_KEY ausente")

    model = model or os.getenv("OPENAI_MODEL", "gpt-5-mini")
    client = OpenAI(api_key=key)

    # Responses API is supported by gpt-5-mini.
    # Keep enough output budget for reasoning + final answer.
    response = client.responses.create(
        model=model,
        instructions=instructions,
        input=prompt,
        max_output_tokens=max(800, int(max_tokens)),
    )

    text = _extract_response_text(response)
    if not text:
        status = getattr(response, "status", "unknown")
        incomplete = getattr(response, "incomplete_details", None)
        raise ProviderError(
            f"OpenAI sem texto final (status={status}, incomplete={incomplete})"
        )

    return ProviderResult("openai", model, text)
