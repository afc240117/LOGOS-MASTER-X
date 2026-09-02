from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from typing import Any
from app.audio_x.services.audio_x_dna_master import build_master
router=APIRouter(prefix="/api/audio-x/dna-master",tags=["audio-x-dna-master"])
class Body(BaseModel):
    profiles:list[dict[str,Any]]
    name:str="DNA Mestre"
    weights:list[float]|None=None
@router.post("")
def run(body:Body):
    try:return {"ok":True,"dna_master":build_master(body.profiles,body.name,body.weights)}
    except Exception as e:raise HTTPException(400,str(e))
