from __future__ import annotations

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.audio_x.services.audio_x_cloud_segmenter import segment_sermon

router=APIRouter(prefix="/api/audio-x",tags=["audio-x-cloud-segmentation"])

DATA_DIR=Path("data/audio_x_cloud")
TRANS_DIR=DATA_DIR/"transcriptions"
SEG_DIR=DATA_DIR/"segmentations"
SEG_DIR.mkdir(parents=True,exist_ok=True)

@router.post("/jobs/{job_id}/segment")
def segment_job(job_id:str):
    source=TRANS_DIR/f"{job_id}.json"
    if not source.exists():
        raise HTTPException(404,"Transcrição não encontrada")
    data=json.loads(source.read_text(encoding="utf-8"))
    result=segment_sermon(data.get("segments") or [])
    result["job_id"]=job_id
    result["provider"]=data.get("provider")
    out=SEG_DIR/f"{job_id}.json"
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    return {"ok":True,"segmentation":result}

@router.get("/jobs/{job_id}/segmentation")
def get_segmentation(job_id:str):
    p=SEG_DIR/f"{job_id}.json"
    if not p.exists():
        raise HTTPException(404,"Segmentação ainda não disponível")
    return json.loads(p.read_text(encoding="utf-8"))
