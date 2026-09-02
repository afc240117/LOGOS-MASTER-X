from __future__ import annotations
import json, re, time, uuid
from pathlib import Path
from typing import Any

BASE=Path("data/audio_x_cloud")
DNA=BASE/"dna_k7"
LIB=BASE/"dna_k7_profiles"
LIB.mkdir(parents=True,exist_ok=True)

def _safe_name(v:str)->str:
    v=re.sub(r"\s+"," ",(v or "").strip())
    return v[:100] or "Perfil DNA K7"

def _path(profile_id:str)->Path:
    if not re.fullmatch(r"[a-f0-9]{32}",profile_id or ""):
        raise ValueError("ID de perfil inválido")
    return LIB/f"{profile_id}.json"

def create_from_job(job_id:str,name:str="",notes:str="",tags:list[str]|None=None)->dict[str,Any]:
    src=DNA/f"{job_id}.json"
    if not src.exists(): raise FileNotFoundError("DNA K7 do job não encontrado")
    dna=json.loads(src.read_text(encoding="utf-8"))
    now=time.time()
    p={
      "id":uuid.uuid4().hex,
      "name":_safe_name(name or dna.get("profile") or "Perfil DNA K7"),
      "notes":(notes or "").strip()[:1000],
      "tags":[str(x).strip()[:40] for x in (tags or []) if str(x).strip()][:20],
      "source_job_id":job_id,
      "created_at":now,"updated_at":now,
      "dna_k7":dna,
      "studio_x":{
        "schema":"logos-master-x/studio-x-dna-k7-v1",
        "dna_score":dna.get("score",0),
        "profile":dna.get("profile"),
        "axes":dna.get("axes") or {},
        "signature":dna.get("signature") or {},
        "instruction":"Use apenas características estruturais e dinâmicas. Não copie texto, frases ou voz do áudio-fonte."
      }
    }
    _path(p["id"]).write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding="utf-8")
    return p

def list_profiles()->list[dict[str,Any]]:
    out=[]
    for p in LIB.glob("*.json"):
        try:
            d=json.loads(p.read_text(encoding="utf-8"))
            out.append({
              "id":d["id"],"name":d["name"],"tags":d.get("tags",[]),
              "updated_at":d.get("updated_at"),"source_job_id":d.get("source_job_id"),
              "score":(d.get("dna_k7") or {}).get("score"),
              "profile":(d.get("dna_k7") or {}).get("profile")
            })
        except Exception: pass
    return sorted(out,key=lambda x:x.get("updated_at") or 0,reverse=True)

def get_profile(profile_id:str)->dict[str,Any]:
    p=_path(profile_id)
    if not p.exists(): raise FileNotFoundError
    return json.loads(p.read_text(encoding="utf-8"))

def update_profile(profile_id:str,name:str|None=None,notes:str|None=None,tags:list[str]|None=None)->dict[str,Any]:
    d=get_profile(profile_id)
    if name is not None: d["name"]=_safe_name(name)
    if notes is not None: d["notes"]=notes.strip()[:1000]
    if tags is not None: d["tags"]=[str(x).strip()[:40] for x in tags if str(x).strip()][:20]
    d["updated_at"]=time.time()
    _path(profile_id).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
    return d

def delete_profile(profile_id:str):
    p=_path(profile_id)
    if not p.exists(): raise FileNotFoundError
    p.unlink()
