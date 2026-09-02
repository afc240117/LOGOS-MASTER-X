from fastapi import APIRouter, HTTPException, Query
from . import service

router = APIRouter(prefix="/api/atlas", tags=["Atlas X Vivo"])

@router.get("/health")
def health():
    d=service.data()
    return {"ok":True,"module":"atlas-x-vivo","version":d["version"],"places":len(d["places"]),"journeys":len(d["journeys"]),"events":len(d["events"]),"offline_basemap":True}

@router.get("/search")
def search(q: str=Query(default="",max_length=160), kind: str=Query(default="all",max_length=20), limit: int=Query(default=40,ge=1,le=200), from_year: int|None=None, to_year: int|None=None):
    return service.search(q,kind,limit,from_year,to_year)

@router.get("/places")
def places():
    return {"items":service.data()["places"]}

@router.get("/places/{place_id}")
def place(place_id: str):
    row=service.place(place_id)
    if not row: raise HTTPException(404,"Lugar não encontrado")
    return row

@router.get("/journeys")
def journeys():
    return {"items":service.data()["journeys"]}

@router.get("/journeys/{journey_id}")
def journey(journey_id: str):
    row=service.journey(journey_id)
    if not row: raise HTTPException(404,"Jornada não encontrada")
    return row

@router.get("/periods")
def periods():
    return {"items":service.data()["periods"]}

@router.get("/graph")
def graph(q: str=Query(min_length=2,max_length=160)):
    return service.graph(q)

@router.get("/basemap")
def basemap():
    return service.basemap()

@router.get("/cartography")
def cartography():
    return service.cartography()
