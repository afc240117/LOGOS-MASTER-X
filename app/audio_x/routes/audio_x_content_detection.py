from __future__ import annotations
import json
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.audio_x.services.audio_x_content_detector import detect_content

router=APIRouter(prefix="/api/audio-x/detect",tags=["audio-x-content-detection"])
BASE=Path("data/audio_x_cloud")
JOBS=BASE/"jobs"; TRANS=BASE/"transcriptions"; DET=BASE/"detections"
DET.mkdir(parents=True,exist_ok=True)

class AnalyzeBody(BaseModel):
    filename:str=""
    title:str=""
    text:str=""
    segments:list[dict[str,Any]]=Field(default_factory=list)

@router.post("/analyze")
def analyze(body:AnalyzeBody):
    d=detect_content({"filename":body.filename,"title":body.title},{"text":body.text,"segments":body.segments})
    return {"ok":True,"detection":d}

@router.get("/{job_id}")
def detect_job(job_id:str):
    jp=JOBS/f"{job_id}.json"; tp=TRANS/f"{job_id}.json"
    if not jp.exists(): raise HTTPException(404,"Job não encontrado")
    if not tp.exists(): raise HTTPException(409,"Transcrição ainda não disponível")
    job=json.loads(jp.read_text(encoding="utf-8")); tr=json.loads(tp.read_text(encoding="utf-8"))
    d=detect_content(job,tr); d["job_id"]=job_id
    (DET/f"{job_id}.json").write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
    return {"ok":True,"detection":d}
