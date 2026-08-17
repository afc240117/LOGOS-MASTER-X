from __future__ import annotations
import json
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_full_pipeline import start,running

router=APIRouter(prefix="/api/audio-x/pipeline",tags=["audio-x-one-click-pipeline"])
BASE=Path("data/audio_x_cloud")
JOBS=BASE/"jobs"
PIPE=BASE/"pipelines"

class StartBody(BaseModel):
    job_id:str
    profile_name:str=""
    strength:int=100

@router.post("/start")
async def start_pipeline(body:StartBody):
    if not (JOBS/f"{body.job_id}.json").exists():
        raise HTTPException(404,"Job não encontrado")
    started=start(body.job_id,body.profile_name,body.strength)
    return {"ok":True,"started":started,"job_id":body.job_id}

@router.get("/{job_id}/status")
def status(job_id:str):
    p=PIPE/f"{job_id}.json"
    if not p.exists():
        raise HTTPException(404,"Pipeline ainda não iniciado")
    d=json.loads(p.read_text(encoding="utf-8"))
    return {"ok":True,"running":running(job_id),"pipeline":d}

@router.get("/{job_id}/result")
def result(job_id:str):
    p=PIPE/f"{job_id}.json"
    if not p.exists():
        raise HTTPException(404,"Pipeline não encontrado")
    d=json.loads(p.read_text(encoding="utf-8"))
    if d.get("status")!="completed":
        raise HTTPException(409,"Pipeline ainda não concluído")
    return {"ok":True,"pipeline":d}
