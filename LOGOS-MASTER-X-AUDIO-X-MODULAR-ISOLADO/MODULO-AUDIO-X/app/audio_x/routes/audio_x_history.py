from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_history import list_history,get_detail,remove_history

router=APIRouter(prefix="/api/audio-x/history",tags=["audio-x-history"])

@router.get("")
def listing():
    return {"ok":True,"items":list_history()}

@router.get("/{job_id}")
def detail(job_id:str):
    try:return {"ok":True,"item":get_detail(job_id)}
    except FileNotFoundError:raise HTTPException(404,"Histórico não encontrado")

@router.delete("/{job_id}")
def delete(job_id:str,remove_profile:bool=False):
    try:return {"ok":True,**remove_history(job_id,remove_profile)}
    except FileNotFoundError:raise HTTPException(404,"Histórico não encontrado")
