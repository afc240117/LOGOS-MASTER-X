from __future__ import annotations

import time
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_homologation import probe_provider, validate_artifacts, save_report

router=APIRouter(prefix="/api/audio-x/homologation",tags=["audio-x-homologation"])

@router.get("/providers")
async def providers():
    results=[]
    for name in ("groq","deepgram","openai"):
        results.append(await probe_provider(name))
    score=round(sum(1 for x in results if x["reachable"])/3*100)
    report={
        "type":"provider_probe",
        "timestamp":time.time(),
        "score":score,
        "providers":results,
        "note":"Este teste apenas verifica autenticação/conectividade e não envia áudio."
    }
    report["report_path"]=save_report(report)
    return {"ok":True,**report}

@router.get("/job/{job_id}")
def job(job_id:str):
    result=validate_artifacts(job_id)
    result["report_path"]=save_report({"type":"job_validation","timestamp":time.time(),**result})
    return {"ok":True,"validation":result}

@router.get("/ready")
async def ready():
    results=[]
    for name in ("groq","deepgram","openai"):
        results.append(await probe_provider(name))
    configured=[x for x in results if x["configured"]]
    reachable=[x for x in results if x["reachable"]]
    return {
        "ok": bool(reachable),
        "configured_count": len(configured),
        "reachable_count": len(reachable),
        "all_three_ready": len(reachable)==3,
        "providers": results,
        "message": "Áudio X pronto para MP3 real" if reachable else "Nenhum provedor autenticado/reachável"
    }
