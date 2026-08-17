from __future__ import annotations
import asyncio, json, time
from pathlib import Path
from typing import Any

from app.audio_x.services.audio_x_cloud_worker import process as transcribe_process
from app.audio_x.services.audio_x_cloud_segmenter import segment_sermon
from app.audio_x.services.audio_x_dna_k7_extractor import extract_dna_k7
from app.audio_x.services.audio_x_dna_profile_store import create_from_job
from app.audio_x.services.audio_x_studio_bridge import build_studio_x_config, build_prompt_block

BASE=Path("data/audio_x_cloud")
JOBS=BASE/"jobs"
TRANS=BASE/"transcriptions"
SEG=BASE/"segmentations"
DNA=BASE/"dna_k7"
PIPE=BASE/"pipelines"
PIPE.mkdir(parents=True,exist_ok=True)

_running: dict[str,asyncio.Task]={}

def _jp(job_id): return JOBS/f"{job_id}.json"
def _pp(job_id): return PIPE/f"{job_id}.json"

def _load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def _save(state):
    state["updated_at"]=time.time()
    _pp(state["job_id"]).write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding="utf-8")

def _stage(state,name,progress,message):
    state.update(stage=name,progress=progress,message=message)
    _save(state)

async def run_pipeline(job_id:str, profile_name:str="", strength:int=100):
    state={
      "job_id":job_id,"status":"running","stage":"starting","progress":1,
      "message":"Iniciando pipeline Áudio X","created_at":time.time(),
      "profile_id":None,"error":None
    }
    _save(state)
    try:
        if not _jp(job_id).exists():
            raise FileNotFoundError("Job não encontrado")

        _stage(state,"transcription",8,"Transcrevendo áudio na nuvem")
        if not (TRANS/f"{job_id}.json").exists():
            await transcribe_process(job_id)
        job=_load(_jp(job_id))
        if job.get("transcription_status")!="completed":
            raise RuntimeError(job.get("error") or "Transcrição falhou")
        _stage(state,"transcription",40,f"Transcrição concluída com {job.get('provider_used','cloud')}")

        _stage(state,"segmentation",48,"Detectando estrutura, transições, clímax e apelo")
        tr=_load(TRANS/f"{job_id}.json")
        segmentation=segment_sermon(tr.get("segments") or [])
        segmentation["job_id"]=job_id
        segmentation["provider"]=tr.get("provider")
        SEG.mkdir(parents=True,exist_ok=True)
        (SEG/f"{job_id}.json").write_text(json.dumps(segmentation,ensure_ascii=False,indent=2),encoding="utf-8")
        _stage(state,"segmentation",65,"Segmentação inteligente concluída")

        _stage(state,"dna_k7",70,"Extraindo características DNA K7")
        dna=extract_dna_k7(segmentation)
        dna["job_id"]=job_id
        dna["provider"]=tr.get("provider")
        DNA.mkdir(parents=True,exist_ok=True)
        (DNA/f"{job_id}.json").write_text(json.dumps(dna,ensure_ascii=False,indent=2),encoding="utf-8")
        _stage(state,"dna_k7",82,f"DNA K7 extraído: {dna.get('score',0)}%")

        _stage(state,"profile",86,"Salvando perfil na Biblioteca DNA K7")
        name=(profile_name or job.get("title") or job.get("filename") or dna.get("profile") or "Perfil DNA K7")
        profile=create_from_job(job_id,name=name,tags=["audio-x","pipeline"])
        state["profile_id"]=profile["id"]
        state["profile_name"]=profile["name"]
        _stage(state,"studio_x",93,"Preparando perfil para o Studio X")

        config=build_studio_x_config(profile,strength)
        prompt=build_prompt_block(config)
        state.update(
          status="completed",stage="completed",progress=100,
          message="Pipeline concluído. Perfil pronto para o Studio X.",
          dna_score=dna.get("score"),dna_profile=dna.get("profile"),
          studio_x_config=config,studio_x_prompt_block=prompt,
          completed_at=time.time()
        )
        _save(state)
    except Exception as e:
        state.update(status="failed",stage="failed",message="Pipeline interrompido",error=str(e))
        _save(state)

def start(job_id:str,profile_name:str="",strength:int=100):
    task=_running.get(job_id)
    if task and not task.done(): return False
    task=asyncio.create_task(run_pipeline(job_id,profile_name,strength))
    _running[job_id]=task
    task.add_done_callback(lambda _: _running.pop(job_id,None))
    return True

def running(job_id):
    t=_running.get(job_id)
    return bool(t and not t.done())
