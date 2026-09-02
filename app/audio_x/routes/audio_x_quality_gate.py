from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_quality_gate import run_quality_gate,validate_pipeline
router=APIRouter(prefix="/api/audio-x/quality-gate",tags=["audio-x-quality-gate"])

@router.get("")
def gate(): return {"ok":True,"quality_gate":run_quality_gate()}

@router.get("/pipeline/{job_id}")
def pipeline(job_id:str):
    return {"ok":True,"validation":validate_pipeline(job_id)}
