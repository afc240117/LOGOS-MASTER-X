from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from typing import Any
from app.audio_x.services.audio_x_final_analysis import biblical,preaching,structure,final_extract
router=APIRouter(prefix="/api/audio-x/final-analysis",tags=["audio-x-final-analysis"])
class B(BaseModel): transcription:dict[str,Any]
@router.post("/{kind}")
def run(kind:str,body:B):
    try:
        p=body.transcription;s=p.get("segments") or [];t=p.get("text") or " ".join(str(x.get("text","")) for x in s)
        if kind=="biblical":return {"ok":True,"result":biblical(t)}
        if kind=="preaching":return {"ok":True,"result":preaching(t)}
        if kind=="structure":return {"ok":True,"result":structure(s)}
        if kind=="extract":return {"ok":True,"result":final_extract(p)}
        raise ValueError("Análise desconhecida")
    except Exception as e:raise HTTPException(400,str(e))
