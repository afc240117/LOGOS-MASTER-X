from __future__ import annotations
import json, time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE=Path("data/audio_x_cloud")
USAGE=BASE/"usage"
USAGE.mkdir(parents=True,exist_ok=True)
EVENTS=USAGE/"events.jsonl"
CONFIG=USAGE/"limits.json"

DEFAULTS={
 "groq":{"enabled":True,"priority":1,"monthly_minutes":600,"daily_minutes":120,"cost_per_minute":0.0},
 "deepgram":{"enabled":True,"priority":2,"monthly_minutes":300,"daily_minutes":90,"cost_per_minute":0.0},
 "openai":{"enabled":True,"priority":3,"monthly_minutes":300,"daily_minutes":120,"cost_per_minute":0.006}
}

def _config():
    if not CONFIG.exists():
        CONFIG.write_text(json.dumps(DEFAULTS,ensure_ascii=False,indent=2),encoding="utf-8")
        return DEFAULTS.copy()
    try:return json.loads(CONFIG.read_text(encoding="utf-8"))
    except Exception:return DEFAULTS.copy()

def save_config(cfg): CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding="utf-8")

def record(provider:str,minutes:float,status:str="completed",job_id:str|None=None,cost:float|None=None):
    cfg=_config().get(provider,{})
    event={"ts":time.time(),"provider":provider,"minutes":round(max(0,minutes),3),"status":status,"job_id":job_id,
           "cost":round(cost if cost is not None else max(0,minutes)*float(cfg.get("cost_per_minute") or 0),6)}
    with EVENTS.open("a",encoding="utf-8") as f:f.write(json.dumps(event,ensure_ascii=False)+"\n")
    return event

def _events():
    if not EVENTS.exists():return []
    out=[]
    for line in EVENTS.read_text(encoding="utf-8").splitlines():
        try:out.append(json.loads(line))
        except Exception:pass
    return out

def summary():
    now=datetime.now(timezone.utc); month=(now.year,now.month); day=(now.year,now.month,now.day)
    cfg=_config(); ev=_events(); result={}
    for provider,c in cfg.items():
        daily=monthly=cost=0.0
        for e in ev:
            if e.get("provider")!=provider or e.get("status")!="completed":continue
            dt=datetime.fromtimestamp(float(e.get("ts") or 0),timezone.utc)
            mins=float(e.get("minutes") or 0)
            if (dt.year,dt.month)==month: monthly+=mins;cost+=float(e.get("cost") or 0)
            if (dt.year,dt.month,dt.day)==day:daily+=mins
        dl=float(c.get("daily_minutes") or 0); ml=float(c.get("monthly_minutes") or 0)
        result[provider]={**c,"daily_used":round(daily,2),"monthly_used":round(monthly,2),
          "daily_remaining":round(max(0,dl-daily),2) if dl else None,
          "monthly_remaining":round(max(0,ml-monthly),2) if ml else None,
          "monthly_cost":round(cost,4),
          "daily_percent":round(daily/dl*100,1) if dl else 0,
          "monthly_percent":round(monthly/ml*100,1) if ml else 0}
    return result

def choose_provider(estimated_minutes:float,requested:list[str]|None=None):
    s=summary(); candidates=requested or list(s)
    ranked=[]
    for p in candidates:
        x=s.get(p)
        if not x or not x.get("enabled"):continue
        dr=x.get("daily_remaining");mr=x.get("monthly_remaining")
        if dr is not None and dr < estimated_minutes:continue
        if mr is not None and mr < estimated_minutes:continue
        ranked.append((float(x.get("cost_per_minute") or 0),int(x.get("priority") or 99),p))
    ranked.sort()
    return ranked[0][2] if ranked else None
