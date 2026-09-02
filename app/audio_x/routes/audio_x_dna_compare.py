from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from typing import Any
from app.audio_x.services.audio_x_dna_compare import compare
router=APIRouter(prefix="/api/audio-x/dna-compare",tags=["audio-x-dna-compare"])
class Body(BaseModel): profiles:list[dict[str,Any]]
@router.post("")
def run(body:Body):
    try:return {"ok":True,"comparison":compare(body.profiles)}
    except Exception as e:raise HTTPException(400,str(e))
