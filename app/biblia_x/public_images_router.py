"""Fontes públicas · Pexels servido pelo NOSSO servidor.

Por que assim: a chave do Pexels é do dono do app e serve para todo mundo que
usa o LOGOS MASTER X. Se ela fosse escrita dentro do JavaScript, qualquer
visitante a leria no DevTools (ou baixando o arquivo) e poderia gastar a cota
inteira — ou queimar a chave, já que o repositório é público. Aqui ela fica SÓ
no ambiente do servidor, na variável PEXELS_API_KEY (.env local e Environment
do Render); o navegador nunca a vê, só pede a busca a este endpoint.

Sem a variável configurada o endpoint responde 503 e o app segue normalmente
com Wikimedia Commons e Openverse, que não pedem chave.

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
_TIMEOUT = 12.0

_CACHE_SEGUNDOS = 300.0
_MAX_POR_PAGINA = 24
_JANELA_SEGUNDOS = 60.0
_LIMITE_JANELA = 30          # consultas por IP a cada minuto

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
