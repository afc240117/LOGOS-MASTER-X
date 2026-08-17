from __future__ import annotations
import os, json, time, importlib
from pathlib import Path
from typing import Any

BASE=Path("data/audio_x_cloud")
REQUIRED_DIRS=["jobs","transcriptions","segmentations","dna_k7","dna_k7_profiles","pipelines","usage"]
REQUIRED_MODULES=[
 "app.audio_x.services.audio_x_cloud_worker",
 "app.audio_x.services.audio_x_cloud_segmenter",
 "app.audio_x.services.audio_x_dna_k7_extractor",
 "app.audio_x.services.audio_x_dna_profile_store",
 "app.audio_x.services.audio_x_studio_bridge",
 "app.audio_x.services.audio_x_full_pipeline",
 "app.audio_x.services.audio_x_history",
 "app.audio_x.services.audio_x_usage_guard",
]
KEYS={"groq":"GROQ_API_KEY","deepgram":"DEEPGRAM_API_KEY","openai":"OPENAI_API_KEY"}

def _check(name,ok,detail,critical=True):
    return {"name":name,"ok":bool(ok),"detail":detail,"critical":critical}

def run_quality_gate()->dict[str,Any]:
    checks=[]
    for mod in REQUIRED_MODULES:
        try:
            importlib.import_module(mod); checks.append(_check("module:"+mod,True,"carregado"))
        except Exception as e:
            checks.append(_check("module:"+mod,False,str(e)))
    for d in REQUIRED_DIRS:
        p=BASE/d
        try:
            p.mkdir(parents=True,exist_ok=True)
            probe=p/".quality-gate-write-test"
            probe.write_text("ok",encoding="utf-8"); probe.unlink()
            checks.append(_check("storage:"+d,True,"leitura/escrita OK"))
        except Exception as e:
            checks.append(_check("storage:"+d,False,str(e)))
    providers={}
    for provider,key in KEYS.items():
        present=bool(os.getenv(key))
        providers[provider]={"configured":present,"env":key}
        checks.append(_check("provider:"+provider,present,
            "chave configurada" if present else f"{key} ausente",critical=False))
    critical=[c for c in checks if c["critical"]]
    score=round(sum(1 for c in critical if c["ok"])/max(1,len(critical))*100)
    configured=sum(1 for x in providers.values() if x["configured"])
    ready=score==100 and configured>=1
    return {
      "version":"audio-x-quality-gate-v1",
      "timestamp":time.time(),
      "ready":ready,
      "score":score,
      "providers_configured":configured,
      "providers":providers,
      "checks":checks,
      "recommendation":"PRONTO" if ready else ("CONFIGURE AO MENOS UM PROVEDOR" if score==100 else "CORRIJA OS ITENS CRÍTICOS")
    }

def validate_pipeline(job_id:str)->dict[str,Any]:
    paths={
      "job":BASE/"jobs"/f"{job_id}.json",
      "transcription":BASE/"transcriptions"/f"{job_id}.json",
      "segmentation":BASE/"segmentations"/f"{job_id}.json",
      "dna_k7":BASE/"dna_k7"/f"{job_id}.json",
      "pipeline":BASE/"pipelines"/f"{job_id}.json",
    }
    stages=[]
    for name,p in paths.items():
        ok=p.exists()
        detail="arquivo encontrado" if ok else "não encontrado"
        if ok:
            try:
                d=json.loads(p.read_text(encoding="utf-8"))
                if name=="pipeline":
                    ok=d.get("status")=="completed"
                    detail=f"status={d.get('status')}"
                elif name=="dna_k7":
                    detail=f"score={d.get('score')}"
            except Exception as e:
                ok=False;detail=f"JSON inválido: {e}"
        stages.append({"stage":name,"ok":ok,"detail":detail})
    score=round(sum(1 for x in stages if x["ok"])/len(stages)*100)
    return {"job_id":job_id,"score":score,"passed":score==100,"stages":stages}
