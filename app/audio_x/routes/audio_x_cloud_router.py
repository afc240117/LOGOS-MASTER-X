from __future__ import annotations
import os, time
from dataclasses import dataclass, asdict
from fastapi import APIRouter

router = APIRouter(prefix="/api/audio-x", tags=["audio-x-cloud"])

@dataclass
class ProviderStatus:
    name: str
    configured: bool
    enabled: bool
    priority: int
    note: str

def env_bool(name, default=True):
    v=os.getenv(name)
    return default if v is None else v.lower() in {"1","true","yes","on"}

def provider_registry():
    rows=[
        ProviderStatus("groq", bool(os.getenv("GROQ_API_KEY")), env_bool("AUDIO_X_GROQ_ENABLED", True), int(os.getenv("AUDIO_X_GROQ_PRIORITY","1")), "Primário"),
        ProviderStatus("deepgram", bool(os.getenv("DEEPGRAM_API_KEY")), env_bool("AUDIO_X_DEEPGRAM_ENABLED", True), int(os.getenv("AUDIO_X_DEEPGRAM_PRIORITY","2")), "Fallback 1"),
        ProviderStatus("openai", bool(os.getenv("OPENAI_API_KEY")), env_bool("AUDIO_X_OPENAI_ENABLED", True), int(os.getenv("AUDIO_X_OPENAI_PRIORITY","3")), "Fallback 2"),
    ]
    return sorted(rows,key=lambda x:x.priority)

@router.get("/router/health")
def router_health():
    rows=provider_registry()
    usable=[p for p in rows if p.enabled and p.configured]
    return {
        "ok": bool(usable),
        "architecture": "cloud-api-first",
        "local_install_required": False,
        "providers": [asdict(p) for p in rows],
        "usable_provider_count": len(usable),
        "primary_provider": usable[0].name if usable else None,
        "fallback_order": [p.name for p in usable],
        "timestamp": time.time(),
    }

@router.get("/router/providers")
def router_providers():
    rows=provider_registry()
    return {"providers":[asdict(p) for p in rows],"order":[p.name for p in rows if p.enabled and p.configured]}
