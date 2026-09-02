from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import json, re, unicodedata

BASE = Path(__file__).resolve().parent
DATA = BASE / "data" / "atlas_seed.json"
BASEMAP = BASE / "data" / "natural-earth-biblical-world.geojson"
CARTOGRAPHY = BASE / "data" / "cartography.json"

def _norm(value: object) -> str:
    s = str(value or "").casefold().strip()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s)

@lru_cache(maxsize=1)
def data() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))

@lru_cache(maxsize=1)
def basemap() -> dict:
    return json.loads(BASEMAP.read_text(encoding="utf-8"))

@lru_cache(maxsize=1)
def cartography() -> dict:
    return json.loads(CARTOGRAPHY.read_text(encoding="utf-8"))

def _hay(row: dict) -> str:
    values=[]
    for key in ("name","title","summary","region","period","certainty"):
        values.append(row.get(key,""))
    for key in ("aliases","refs","people","events","tags"):
        values.extend(row.get(key,[]) or [])
    return _norm(" ".join(map(str,values)))

def _score(row: dict, q: str) -> int:
    nq=_norm(q)
    if not nq: return 1
    name=_norm(row.get("name") or row.get("title"))
    aliases=[_norm(x) for x in row.get("aliases",[]) or []]
    hay=_hay(row)
    score=0
    if nq==name: score+=120
    if nq in aliases: score+=100
    if name.startswith(nq): score+=70
    if nq in name: score+=55
    if nq in hay: score+=30
    tokens=[t for t in nq.split() if len(t)>2]
    score+=sum(6 for t in tokens if t in hay)
    return score

def _period_ok(row: dict, from_year: int|None, to_year: int|None) -> bool:
    if from_year is None and to_year is None: return True
    rf=row.get("from_year"); rt=row.get("to_year")
    if rf is None or rt is None: return True
    lo = from_year if from_year is not None else -99999
    hi = to_year if to_year is not None else 99999
    return rt >= lo and rf <= hi

def search(q: str="", kind: str="all", limit: int=40, from_year: int|None=None, to_year: int|None=None) -> dict:
    d=data(); hits=[]
    pools=[]
    if kind in ("all","place","places"): pools.append(("place",d["places"]))
    if kind in ("all","journey","route","journeys"): pools.append(("journey",d["journeys"]))
    if kind in ("all","event","events"): pools.append(("event",d["events"]))
    for typ, rows in pools:
        for row in rows:
            if not _period_ok(row,from_year,to_year): continue
            score=_score(row,q)
            if q and score<=0: continue
            hits.append({"kind":typ,"score":score,**row})
    hits.sort(key=lambda x:(-x["score"], _norm(x.get("name") or x.get("title"))))
    return {"query":q,"kind":kind,"items":hits[:max(1,min(200,limit))],"total":len(hits),"version":d["version"]}

def place(place_id: str) -> dict|None:
    p=next((x for x in data()["places"] if x["id"]==place_id),None)
    if not p:return None
    linked_events=[x for x in data()["events"] if x.get("place_id")==place_id]
    linked_journeys=[x for x in data()["journeys"] if place_id in x.get("stops",[])]
    return {**p,"linked_events":linked_events,"linked_journeys":linked_journeys}

def journey(journey_id: str) -> dict|None:
    j=next((x for x in data()["journeys"] if x["id"]==journey_id),None)
    if not j:return None
    byid={x["id"]:x for x in data()["places"]}
    stops=[byid[s] for s in j.get("stops",[]) if s in byid]
    return {**j,"stop_rows":stops}

def graph(q: str) -> dict:
    found=search(q,"all",30)["items"]
    nodes={}; links=[]
    def node(nid,label,kind,meta=None):nodes.setdefault(nid,{"id":nid,"label":label,"kind":kind,"meta":meta or {}})
    for hit in found:
        if hit["kind"]=="place":
            pid="place:"+hit["id"];node(pid,hit["name"],"place",{"lat":hit.get("lat"),"lng":hit.get("lng")})
            for person in hit.get("people",[]):
                x="person:"+_norm(person);node(x,person,"person");links.append({"source":x,"target":pid,"relation":"associated_with"})
            for ref in hit.get("refs",[]):
                x="ref:"+_norm(ref);node(x,ref,"reference");links.append({"source":pid,"target":x,"relation":"referenced_in"})
        elif hit["kind"]=="journey":
            jid="journey:"+hit["id"];node(jid,hit["name"],"journey")
            for sid in hit.get("stops",[]):
                p=place(sid)
                if p:
                    pid="place:"+sid;node(pid,p["name"],"place",{"lat":p.get("lat"),"lng":p.get("lng")});links.append({"source":jid,"target":pid,"relation":"stops_at"})
    return {"query":q,"nodes":list(nodes.values()),"links":links}
