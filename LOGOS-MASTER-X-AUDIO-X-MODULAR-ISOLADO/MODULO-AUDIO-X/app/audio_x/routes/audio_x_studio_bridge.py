from __future__ import annotations
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_dna_profile_store import get_profile
from app.audio_x.services.audio_x_studio_bridge import build_studio_x_config, build_prompt_block

router=APIRouter(prefix="/api/audio-x/studio-x",tags=["audio-x-studio-x-bridge"])

class ApplyBody(BaseModel):
    profile_id:str
    strength:int=100

@router.post("/apply")
def apply(body:ApplyBody):
    try:p=get_profile(body.profile_id)
    except Exception:raise HTTPException(404,"Perfil DNA K7 não encontrado")
    cfg=build_studio_x_config(p,body.strength)
    return {"ok":True,"config":cfg,"prompt_block":build_prompt_block(cfg)}

@router.get("/profiles/{profile_id}/preview")
def preview(profile_id:str,strength:int=100):
    try:p=get_profile(profile_id)
    except Exception:raise HTTPException(404,"Perfil DNA K7 não encontrado")
    cfg=build_studio_x_config(p,strength)
    return {"ok":True,"config":cfg}
