from __future__ import annotations
import json
from pathlib import Path
from typing import Any

BASE=Path("data/audio_x_cloud")
JOBS=BASE/"jobs"
TRANS=BASE/"transcriptions"
SEG=BASE/"segmentations"
DNA=BASE/"dna_k7"
PIPE=BASE/"pipelines"
PROFILES=BASE/"dna_k7_profiles"

def _read(path:Path):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except Exception:return None

def list_history()->list[dict[str,Any]]:
    rows=[]
    if not JOBS.exists(): return rows
    for jp in JOBS.glob("*.json"):
        job=_read(jp)
        if not job: continue
        job_id=job.get("id") or jp.stem
        pipeline=_read(PIPE/f"{job_id}.json") if PIPE.exists() else None
        dna=_read(DNA/f"{job_id}.json") if DNA.exists() else None
        tr=_read(TRANS/f"{job_id}.json") if TRANS.exists() else None
        seg=_read(SEG/f"{job_id}.json") if SEG.exists() else None
        profile_id=(pipeline or {}).get("profile_id")
        rows.append({
          "job_id":job_id,
          "title":job.get("title") or job.get("filename") or job_id,
          "filename":job.get("filename"),
          "created_at":job.get("created_at"),
          "updated_at":job.get("updated_at"),
          "status":(pipeline or {}).get("status") or job.get("status"),
          "pipeline_progress":(pipeline or {}).get("progress"),
          "provider":(pipeline or {}).get("provider_used") or job.get("provider_used") or (tr or {}).get("provider"),
          "dna_score":(pipeline or {}).get("dna_score") or (dna or {}).get("score"),
          "dna_profile":(pipeline or {}).get("dna_profile") or (dna or {}).get("profile"),
          "profile_id":profile_id,
          "has_transcription":tr is not None,
          "has_segmentation":seg is not None,
          "has_dna":dna is not None,
          "has_pipeline":pipeline is not None,
        })
    return sorted(rows,key=lambda x:x.get("updated_at") or x.get("created_at") or 0,reverse=True)

def get_detail(job_id:str)->dict[str,Any]:
    jp=JOBS/f"{job_id}.json"
    if not jp.exists(): raise FileNotFoundError
    return {
      "job":_read(jp),
      "transcription":_read(TRANS/f"{job_id}.json"),
      "segmentation":_read(SEG/f"{job_id}.json"),
      "dna_k7":_read(DNA/f"{job_id}.json"),
      "pipeline":_read(PIPE/f"{job_id}.json"),
    }

def remove_history(job_id:str,remove_profile:bool=False):
    detail=get_detail(job_id)
    profile_id=(detail.get("pipeline") or {}).get("profile_id")
    for folder in (TRANS,SEG,DNA,PIPE):
        p=folder/f"{job_id}.json"
        if p.exists(): p.unlink()
    jp=JOBS/f"{job_id}.json"
    if jp.exists():
        job=_read(jp) or {}
        fp=Path(job.get("file_path") or "")
        try:
            if fp.exists(): fp.unlink()
        except Exception: pass
        jp.unlink()
    if remove_profile and profile_id:
        p=PROFILES/f"{profile_id}.json"
        if p.exists(): p.unlink()
    return {"removed":True,"profile_removed":bool(remove_profile and profile_id)}
