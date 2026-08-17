from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

import httpx

BASE = Path("data/audio_x_cloud")
REPORTS = BASE / "homologation"
REPORTS.mkdir(parents=True, exist_ok=True)

PROVIDERS = {
    "groq": {
        "env": "GROQ_API_KEY",
        "probe_url": "https://api.groq.com/openai/v1/models",
        "auth": lambda key: {"Authorization": f"Bearer {key}"},
    },
    "deepgram": {
        "env": "DEEPGRAM_API_KEY",
        "probe_url": "https://api.deepgram.com/v1/projects",
        "auth": lambda key: {"Authorization": f"Token {key}"},
    },
    "openai": {
        "env": "OPENAI_API_KEY",
        "probe_url": "https://api.openai.com/v1/models",
        "auth": lambda key: {"Authorization": f"Bearer {key}"},
    },
}

async def probe_provider(name: str) -> dict[str, Any]:
    cfg = PROVIDERS[name]
    key = os.getenv(cfg["env"])
    if not key:
        return {
            "provider": name,
            "configured": False,
            "reachable": False,
            "status": "missing_key",
            "http_status": None,
            "detail": f"{cfg['env']} ausente",
        }

    try:
        timeout = float(os.getenv("AUDIO_X_PROVIDER_PROBE_TIMEOUT", "15"))
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(cfg["probe_url"], headers=cfg["auth"](key))
        return {
            "provider": name,
            "configured": True,
            "reachable": r.is_success,
            "status": "ok" if r.is_success else "auth_or_api_error",
            "http_status": r.status_code,
            "detail": "API respondeu" if r.is_success else f"HTTP {r.status_code}",
        }
    except Exception as e:
        return {
            "provider": name,
            "configured": True,
            "reachable": False,
            "status": "network_error",
            "http_status": None,
            "detail": str(e),
        }

def _read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None

def validate_artifacts(job_id: str) -> dict[str, Any]:
    files = {
        "job": BASE/"jobs"/f"{job_id}.json",
        "transcription": BASE/"transcriptions"/f"{job_id}.json",
        "segmentation": BASE/"segmentations"/f"{job_id}.json",
        "dna_k7": BASE/"dna_k7"/f"{job_id}.json",
        "pipeline": BASE/"pipelines"/f"{job_id}.json",
    }
    checks=[]
    for name,p in files.items():
        exists=p.exists()
        detail="presente" if exists else "ausente"
        if exists:
            data=_read_json(p)
            if data is None:
                exists=False
                detail="JSON inválido"
            elif name=="pipeline":
                detail=f"status={data.get('status')}"
            elif name=="dna_k7":
                detail=f"score={data.get('score')}"
            elif name=="transcription":
                detail=f"provider={data.get('provider')}, segments={len(data.get('segments') or [])}"
        checks.append({"name":name,"ok":exists,"detail":detail})
    score=round(sum(1 for c in checks if c["ok"])/len(checks)*100)
    return {"job_id":job_id,"score":score,"passed":score==100,"checks":checks}

def save_report(report: dict[str, Any]) -> str:
    stamp=time.strftime("%Y%m%d-%H%M%S")
    path=REPORTS/f"homologation-{stamp}.json"
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    return str(path)
