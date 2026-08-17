from __future__ import annotations
import asyncio, json, time
from pathlib import Path
from typing import Any
from app.audio_x.services.audio_x_cloud_providers import ProviderError, transcribe_with_provider
from app.audio_x.services.audio_x_usage_guard import choose_provider, record

DATA_DIR=Path("data/audio_x_cloud")
JOB_DIR=DATA_DIR/"jobs"
RESULT_DIR=DATA_DIR/"transcriptions"
RESULT_DIR.mkdir(parents=True,exist_ok=True)

_running: dict[str, asyncio.Task] = {}

def job_path(job_id): return JOB_DIR/f"{job_id}.json"
def result_path(job_id): return RESULT_DIR/f"{job_id}.json"

def load_job(job_id:str)->dict[str,Any]:
    return json.loads(job_path(job_id).read_text(encoding="utf-8"))

def save_job(job):
    job["updated_at"]=time.time()
    job_path(job["id"]).write_text(json.dumps(job,ensure_ascii=False,indent=2),encoding="utf-8")

def safe_job(job):
    d=dict(job); d.pop("file_path",None); d.pop("transcription_result_path",None); return d

async def process(job_id:str):
    job=load_job(job_id)
    audio=Path(job["file_path"])
    order=list(job.get("provider_order") or [])
    if not job.get("fallback_enabled",True): order=order[:1]
    # Cost guard: prefer a provider that fits local daily/monthly limits.
    estimated=float(job.get("estimated_minutes") or 60)
    preferred=choose_provider(estimated, order)
    if preferred and preferred in order:
        order=[preferred]+[p for p in order if p!=preferred]
    job.update(status="transcribing",stage="transcription",progress=8,transcription_status="running",provider_attempts=[],error=None)
    save_job(job)

    errors=[]
    total=max(1,len(order))
    for i,provider in enumerate(order):
        attempt={"provider":provider,"status":"running","started_at":time.time()}
        job["selected_provider"]=provider
        job["progress"]=min(85,15+int((i/total)*60))
        job["provider_attempts"].append(attempt); save_job(job)
        try:
            result=await transcribe_with_provider(provider,audio,job.get("language") or "pt")
            attempt.update(status="completed",finished_at=time.time())
            payload={
                "job_id":job_id,"provider":provider,"fallback_used":i>0,
                "provider_attempts":job["provider_attempts"],
                "text":result.get("text") or "","language":result.get("language") or job.get("language"),
                "duration":result.get("duration"),"segments":result.get("segments") or [],
                "words":result.get("words") or [],"completed_at":time.time()
            }
            result_path(job_id).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
            actual_seconds=float(payload.get("duration") or 0)
            if actual_seconds>0:
                record(provider,actual_seconds/60,"completed",job_id)
            job.update(status="transcribed",stage="completed",progress=100,transcription_status="completed",
                       provider_used=provider,fallback_used=i>0,segment_count=len(payload["segments"]),
                       word_count=len(payload["words"]),error=None)
            save_job(job); return
        except ProviderError as e:
            attempt.update(status="failed",finished_at=time.time(),status_code=e.status_code,error=str(e))
            errors.append({"provider":provider,"status_code":e.status_code,"message":str(e)}); save_job(job)
        except Exception as e:
            attempt.update(status="failed",finished_at=time.time(),error=str(e))
            errors.append({"provider":provider,"status_code":None,"message":str(e)}); save_job(job)

    job.update(status="failed",stage="failed",progress=0,transcription_status="failed",
               error="Todos os provedores falharam",provider_errors=errors)
    save_job(job)

def start(job_id:str):
    task=_running.get(job_id)
    if task and not task.done(): return False
    task=asyncio.create_task(process(job_id))
    _running[job_id]=task
    task.add_done_callback(lambda _: _running.pop(job_id,None))
    return True

def is_running(job_id:str)->bool:
    t=_running.get(job_id)
    return bool(t and not t.done())
