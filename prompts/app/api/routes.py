import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import LogosService
router=APIRouter(); service=LogosService()
class Req(BaseModel):
    mode:str='sermon'; text:str; theme:str|None=None; prompt:str|None=None
@router.get('/health')
def health(): return {'status':'ok','version':'7.1-tudo-funcional','ai_configured':bool(os.getenv('OPENAI_API_KEY'))}
@router.post('/generate')
def generate(r:Req): return service.generate(r.mode,r.text,r.theme)
@router.post('/generate-ai')
def generate_ai(r:Req):
    key=os.getenv('OPENAI_API_KEY')
    if not key: return {'text':service.local_render(r.mode,r.text,r.theme),'engine':'local'}
    try:
        from openai import OpenAI
        c=OpenAI(api_key=key); p=r.prompt or service.build_prompt(r.mode,r.text,r.theme)
        x=c.responses.create(model=os.getenv('OPENAI_MODEL','gpt-5-mini'),instructions=service.system_instructions(),input=p)
        return {'text':x.output_text,'engine':'openai'}
    except Exception as e: raise HTTPException(500,str(e))
