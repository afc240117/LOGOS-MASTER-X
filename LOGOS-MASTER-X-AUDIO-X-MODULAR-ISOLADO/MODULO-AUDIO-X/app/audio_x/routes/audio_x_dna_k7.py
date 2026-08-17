from __future__ import annotations
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_dna_k7_extractor import extract_dna_k7

router=APIRouter(prefix="/api/audio-x",tags=["audio-x-dna-k7"])
BASE=Path("data/audio_x_cloud")
SEG=BASE/"segmentations"
DNA=BASE/"dna_k7"
DNA.mkdir(parents=True,exist_ok=True)

@router.post("/jobs/{job_id}/dna-k7")
def build(job_id:str):
    src=SEG/f"{job_id}.json"
    if not src.exists(): raise HTTPException(404,"Segmentação não encontrada")
    data=json.loads(src.read_text(encoding="utf-8"))
    result=extract_dna_k7(data)
    result["job_id"]=job_id
    result["provider"]=data.get("provider")
    (DNA/f"{job_id}.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    return {"ok":True,"dna_k7":result}

@router.get("/jobs/{job_id}/dna-k7")
def get(job_id:str):
    p=DNA/f"{job_id}.json"
    if not p.exists(): raise HTTPException(404,"DNA K7 ainda não disponível")
    return json.loads(p.read_text(encoding="utf-8"))
