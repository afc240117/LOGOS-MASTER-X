from __future__ import annotations
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_dna_profile_store import create_from_job,list_profiles,get_profile,update_profile,delete_profile

router=APIRouter(prefix="/api/audio-x/dna-k7/profiles",tags=["audio-x-dna-k7-library"])

class CreateProfile(BaseModel):
    job_id:str
    name:str=""
    notes:str=""
    tags:list[str]=Field(default_factory=list)

class UpdateProfile(BaseModel):
    name:str|None=None
    notes:str|None=None
    tags:list[str]|None=None

@router.post("")
def create(body:CreateProfile):
    try:return {"ok":True,"profile":create_from_job(body.job_id,body.name,body.notes,body.tags)}
    except FileNotFoundError:raise HTTPException(404,"DNA K7 do job não encontrado")

@router.get("")
def listing():
    return {"ok":True,"profiles":list_profiles()}

@router.get("/{profile_id}")
def get(profile_id:str):
    try:return get_profile(profile_id)
    except (FileNotFoundError,ValueError):raise HTTPException(404,"Perfil não encontrado")

@router.patch("/{profile_id}")
def update(profile_id:str,body:UpdateProfile):
    try:return {"ok":True,"profile":update_profile(profile_id,body.name,body.notes,body.tags)}
    except (FileNotFoundError,ValueError):raise HTTPException(404,"Perfil não encontrado")

@router.delete("/{profile_id}")
def remove(profile_id:str):
    try:delete_profile(profile_id);return {"ok":True}
    except (FileNotFoundError,ValueError):raise HTTPException(404,"Perfil não encontrado")

@router.get("/{profile_id}/studio-x")
def studio_x(profile_id:str):
    try:
        p=get_profile(profile_id)
        return {"ok":True,"profile_id":profile_id,"name":p["name"],"studio_x":p["studio_x"]}
    except (FileNotFoundError,ValueError):raise HTTPException(404,"Perfil não encontrado")
