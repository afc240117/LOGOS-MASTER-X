from __future__ import annotations
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.audio_x.services.audio_x_usage_guard import summary,choose_provider,_config,save_config

router=APIRouter(prefix="/api/audio-x/usage",tags=["audio-x-usage"])

class LimitsBody(BaseModel):
    provider:str
    enabled:bool|None=None
    priority:int|None=None
    daily_minutes:float|None=None
    monthly_minutes:float|None=None
    cost_per_minute:float|None=None

@router.get("")
def get_usage():return {"ok":True,"providers":summary()}

@router.get("/route")
def route(minutes:float=1):
    p=choose_provider(max(0.01,minutes))
    if not p:raise HTTPException(429,"Nenhum provedor disponível dentro dos limites configurados")
    return {"ok":True,"provider":p,"estimated_minutes":minutes}

@router.patch("/limits")
def limits(body:LimitsBody):
    cfg=_config()
    if body.provider not in cfg:raise HTTPException(404,"Provedor não encontrado")
    d=body.model_dump(exclude_none=True);d.pop("provider",None)
    cfg[body.provider].update(d);save_config(cfg)
    return {"ok":True,"providers":summary()}
