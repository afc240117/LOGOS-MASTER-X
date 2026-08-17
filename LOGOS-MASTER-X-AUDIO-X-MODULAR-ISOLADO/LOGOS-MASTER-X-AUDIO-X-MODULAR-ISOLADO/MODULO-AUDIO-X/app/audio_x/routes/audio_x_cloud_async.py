from __future__ import annotations
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_cloud_worker import start, is_running

router=APIRouter(prefix="/api/audio-x",tags=["audio-x-cloud-async"])
JOB_DIR=Path("data/audio_x_cloud/jobs")
RESULT_DIR=Path("data/audio_x_cloud/transcriptions")

def load(job_id):
    p=JOB_DIR/f"{job_id}.json"
    if not p.exists(): raise HTTPException(404,"Job não encontrado")
    return json.loads(p.read_text(encoding="utf-8"))

def safe(j):
    d=dict(j); d.pop("file_path",None); d.pop("transcription_result_path",None); return d

@router.post("/jobs/{job_id}/start")
async def start_job(job_id:str):
    job=load(job_id)
    if job.get("transcription_status")=="completed":
        return {"ok":True,"started":False,"reason":"already_completed","job":safe(job)}
    started=start(job_id)
    return {"ok":True,"started":started,"job":safe(load(job_id))}

@router.get("/jobs/{job_id}/status")
def status(job_id:str):
    job=load(job_id)
    return {"ok":True,"running":is_running(job_id),"job":safe(job)}

@router.get("/jobs/{job_id}/result")
def result(job_id:str):
    load(job_id)
    p=RESULT_DIR/f"{job_id}.json"
    if not p.exists(): raise HTTPException(404,"Resultado ainda não disponível")
    return json.loads(p.read_text(encoding="utf-8"))
