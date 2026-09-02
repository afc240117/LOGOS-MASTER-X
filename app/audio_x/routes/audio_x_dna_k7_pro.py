from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from app.audio_x.services.audio_x_dna_k7_pro import analyze
router=APIRouter(prefix="/api/audio-x/dna-k7-pro",tags=["audio-x-dna-k7-pro"])
class Payload(BaseModel):
    transcription: dict[str,Any]
@router.post("/analyze")
def run(body:Payload):
    try:return {"ok":True,"dna_k7_pro":analyze(body.transcription)}
    except Exception as e: raise HTTPException(400,str(e))
