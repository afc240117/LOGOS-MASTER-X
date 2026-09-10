"""Fontes públicas · Pexels servido pelo NOSSO servidor.

Por que assim: a chave do Pexels é do dono do app e serve para todo mundo que
usa o LOGOS MASTER X. Se ela fosse escrita dentro do JavaScript, qualquer
visitante a leria no DevTools (ou baixando o arquivo) e poderia gastar a cota
inteira — ou queimar a chave, já que o repositório é público. Aqui ela fica SÓ
no ambiente do servidor, na variável PEXELS_API_KEY (.env local e Environment
do Render); o navegador nunca a vê, só pede a busca a este endpoint.

Sem a variável configurada o endpoint responde 503 e o app segue normalmente
com Wikimedia Commons e Openverse, que não pedem chave.

O /geo é a única parte que não depende de chave nenhuma: converte "Muro das
Lamentações" em coordenadas (OpenStreetMap), para o mapa e o Street View do
Google abrirem no lugar certo dentro da nossa galeria.

Proteções do endpoint aberto: limite por IP e cache curto da mesma consulta,
para o app não virar proxy de graça para terceiros.
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from app.core.env import load_project_env

router = APIRouter(prefix="/api/bible/public-images", tags=["Fontes públicas"])

_PEXELS_FOTOS = "https://api.pexels.com/v1/search"
_PEXELS_VIDEOS = "https://api.pexels.com/videos/search"
# Geocodificação aberta (OpenStreetMap/Nominatim) para o "🗺 Google View" do
# app: o usuário digita o lugar e a gente descobre as coordenadas, porque o
# Street View do Google só aceita posição (lat,lon), não nome de lugar.
_NOMINATIM = "https://nominatim.openstreetmap.org/search"
_UA = "LOGOS-MASTER-X/5.4.249 (+https://logos-master-x-api.onrender.com)"
_TIMEOUT = 12.0

_CACHE_SEGUNDOS = 300.0
_MAX_POR_PAGINA = 24
_JANELA_SEGUNDOS = 60.0
_LIMITE_JANELA = 30          # consultas por IP a cada minuto

# O mapa aberto conhece estes lugares pelo nome em inglês: quem digita em
# português ("muro das lamentações") não achava nada. Chave sem acento e em
# minúsculas; o valor é o nome que o mapa entende.
_ALIASES = {
    "muro das lamentacoes": "Western Wall",
    "muro ocidental": "Western Wall",
    "monte das oliveiras": "Mount of Olives",
    "mar vermelho": "Red Sea",
    "mar morto": "Dead Sea",
    "mar da galileia": "Sea of Galilee",
    "santo sepulcro": "Church of the Holy Sepulchre",
    "via dolorosa": "Via Dolorosa",
    "cidade de davi": "City of David",
    "monte do templo": "Temple Mount",
    "rio jordao": "Jordan River",
    "rio jordão": "Jordan River",
    "monte sinai": "Mount Sinai",
    "monte sinaí": "Mount Sinai",
}


def _sem_acento(texto: str) -> str:
    import unicodedata

    return "".join(
        c for c in unicodedata.normalize("NFKD", texto or "") if not unicodedata.combining(c)
    ).lower()


def _em_ingles(consulta: str) -> str:
    """Troca o nome português pelo que o mapa conhece ("muro das lamentações"
    -> "Western Wall"), mantendo o resto da frase como o usuário escreveu."""
    alvo = _sem_acento(consulta)
    for pt, en in _ALIASES.items():
        chave = _sem_acento(pt)
        if chave and chave in alvo:
            return en
    return ""


_cache: dict[str, tuple[float, Any]] = {}
_janelas: dict[str, list[float]] = {}


def _chave() -> str:
    """Lê a chave do ambiente; se faltar, tenta o .env do projeto uma vez."""
    chave = (os.getenv("PEXELS_API_KEY") or "").strip()
    if chave:
        return chave
    if load_project_env() is not None:
        return (os.getenv("PEXELS_API_KEY") or "").strip()
    return ""


def _liberado(ip: str) -> bool:
    agora = time.time()
    marcas = [t for t in _janelas.get(ip, []) if agora - t < _JANELA_SEGUNDOS]
    if len(marcas) >= _LIMITE_JANELA:
        _janelas[ip] = marcas
        return False
    marcas.append(agora)
    _janelas[ip] = marcas
    if len(_janelas) > 512:
        for antigo in sorted(_janelas, key=lambda k: max(_janelas[k] or [0]))[:128]:
            _janelas.pop(antigo, None)
    return True


@router.get("/geo")
async def geo(request: Request, q: str = Query(..., min_length=2, max_length=120)):
    """Nome do lugar -> coordenadas, para o mapa e o Street View do Google.

    Feito AQUI e não no navegador porque o Nominatim exige um User-Agent que o
    identifique (o navegador não deixa definir esse cabeçalho) e porque assim a
    mesma consulta vale para todos, com cache.
    """
    consulta = " ".join((q or "").split())
    if not consulta:
        raise HTTPException(status_code=400, detail="consulta vazia")

    marca = "g|" + consulta.lower()
    agora = time.time()
    guardado = _cache.get(marca)
    if guardado and agora - guardado[0] < _CACHE_SEGUNDOS:
        return JSONResponse(guardado[1], headers={"X-Logos-Cache": "hit"})

    ip = (request.client.host if request.client else "") or "?"
    if not _liberado(ip):
        raise HTTPException(status_code=429, detail="muitas consultas seguidas; tente daqui a pouco")

    headers = {"User-Agent": _UA, "Accept": "application/json", "Accept-Language": "pt-BR,pt;q=0.9"}
    # "Muro das Lamentações, Jerusalém" não existe com esse nome no mapa aberto,
    # mas "Jerusalém" existe: se a consulta inteira não achar nada, tenta o que
    # vem antes da vírgula. Duas tentativas no máximo, para não abusar do serviço.
    tentativas = [consulta]
    em_ingles = _em_ingles(consulta)
    if em_ingles:
        tentativas.append(em_ingles)
    antes = consulta.split(",")[0].strip()
    if antes:
        tentativas.append(antes)
    vistas = set()
    tentativas = [t for t in tentativas if t and not (t.lower() in vistas or vistas.add(t.lower()))]

    achados: list = []
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cliente:
            for texto in tentativas:
                resposta = await cliente.get(
                    _NOMINATIM,
                    params={"q": texto, "format": "jsonv2", "limit": 1, "addressdetails": 0},
                    headers=headers,
                )
                if resposta.status_code >= 400:
                    raise HTTPException(status_code=502, detail=f"mapa respondeu {resposta.status_code}")
                try:
                    achados = resposta.json() or []
                except ValueError:
                    achados = []
                if achados:
                    break
    except httpx.HTTPError as erro:
        raise HTTPException(status_code=502, detail=f"mapa inacessível: {erro}") from erro

    if not achados:
        raise HTTPException(status_code=404, detail=f"não encontrei \"{consulta}\" no mapa")

    primeiro = achados[0]
    dados = {
        "lat": float(primeiro.get("lat")),
        "lon": float(primeiro.get("lon")),
        "nome": str(primeiro.get("display_name") or consulta)[:180],
    }
    _cache[marca] = (agora, dados)
    return JSONResponse(dados, headers={"X-Logos-Cache": "miss"})


@router.get("/status")
def status() -> dict:
    """O app pergunta isto para saber se o Pexels já vem pronto do servidor."""
    return {"pexels": bool(_chave()), "limitePorMinuto": _LIMITE_JANELA}


@router.get("/pexels")
async def pexels(
    request: Request,
    q: str = Query("", max_length=120),
    tipo: str = Query("foto"),
    per_page: int = Query(18, ge=1, le=_MAX_POR_PAGINA),
    orientacao: str = Query("landscape", max_length=24),
    pagina: int = Query(1, ge=1, le=50),   # o "carregar mais" do app desce as páginas
):
    chave = _chave()
    if not chave:
        raise HTTPException(status_code=503, detail="PEXELS_API_KEY não configurada no servidor")

    consulta = " ".join((q or "").split())
    if not consulta:
        raise HTTPException(status_code=400, detail="consulta vazia")

    videos = tipo == "video"
    marca = f"{'v' if videos else 'f'}|{per_page}|{orientacao}|{pagina}|{consulta.lower()}"
    agora = time.time()
    guardado = _cache.get(marca)
    if guardado and agora - guardado[0] < _CACHE_SEGUNDOS:
        return JSONResponse(guardado[1], headers={"X-Logos-Cache": "hit"})

    ip = (request.client.host if request.client else "") or "?"
    if not _liberado(ip):
        raise HTTPException(status_code=429, detail="muitas consultas seguidas; tente daqui a pouco")

    params = {"query": consulta, "per_page": per_page, "orientation": orientacao}
    if pagina > 1:
        params["page"] = pagina
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cliente:
            resposta = await cliente.get(
                _PEXELS_VIDEOS if videos else _PEXELS_FOTOS,
                params=params,
                headers={"Authorization": chave, "Accept": "application/json"},
            )
    except httpx.HTTPError as erro:
        raise HTTPException(status_code=502, detail=f"Pexels inacessível: {erro}") from erro

    if resposta.status_code == 401:
        raise HTTPException(status_code=401, detail="a chave do Pexels foi recusada")
    if resposta.status_code == 429:
        raise HTTPException(status_code=429, detail="cota do Pexels esgotada por agora")
    if resposta.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Pexels respondeu {resposta.status_code}")

    dados = resposta.json()
    _cache[marca] = (agora, dados)
    if len(_cache) > 64:
        for velho in sorted(_cache, key=lambda k: _cache[k][0])[:16]:
            _cache.pop(velho, None)
    return JSONResponse(dados, headers={"X-Logos-Cache": "miss"})
