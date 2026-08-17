from __future__ import annotations

import re
from typing import Any

STRUCTURE_TERMS = {
    "intro": [
        "vamos começar","quero falar","hoje vamos","nesta noite","nesta manhã",
        "abra sua bíblia","tema de hoje","eu quero compartilhar","quero pregar"
    ],
    "text": [
        "está escrito","o texto diz","versículo","passagem","bíblia diz",
        "palavra de deus","capítulo","vamos ler","leitura"
    ],
    "context": [
        "contexto","naquela época","naquele tempo","história","histórico",
        "cenário","cultura","situação","aconteceu"
    ],
    "development": [
        "primeiro","segundo","terceiro","observe","perceba","entenda",
        "isso significa","agora veja","preste atenção"
    ],
    "application": [
        "na sua vida","na nossa vida","você precisa","nós precisamos",
        "devemos","aplicação","hoje","família","igreja","coração"
    ],
    "climax": [
        "agora","chegou a hora","eu vim dizer","receba","deus está",
        "é agora","hoje é o dia","preste atenção","escute"
    ],
    "appeal": [
        "venha","altar","frente","aceite","entregue","decida","ore comigo",
        "levante sua mão","faça uma decisão","salvação","arrependa"
    ],
}

TRANSITION_TERMS = [
    "agora","então","por isso","portanto","contudo","depois","em seguida",
    "primeiro","segundo","terceiro","finalmente","observe","preste atenção"
]

EMOTION_TERMS = [
    "glória","aleluia","amém","poder","fogo","milagre","cura",
    "vitória","libertação","unção","presença","receba","santo"
]

def _count_terms(text: str, terms: list[str]) -> int:
    lower=text.lower()
    return sum(lower.count(t) for t in terms)

def _classify(text: str, idx: int, total: int) -> tuple[str, dict[str,int]]:
    scores={k:0 for k in STRUCTURE_TERMS}
    lower=text.lower()

    for kind,terms in STRUCTURE_TERMS.items():
        scores[kind]+=sum(3 for t in terms if t in lower)

    ratio=idx/max(1,total-1)
    if ratio < .10: scores["intro"] += 3
    if .07 <= ratio < .22: scores["text"] += 2
    if .15 <= ratio < .34: scores["context"] += 2
    if .28 <= ratio < .78: scores["development"] += 3
    if .38 <= ratio < .82: scores["application"] += 1
    if .72 <= ratio < .94: scores["climax"] += 3
    if ratio >= .88: scores["appeal"] += 3

    if _count_terms(text, EMOTION_TERMS) >= 2:
        scores["climax"] += 2
    if text.count("?") > 0:
        scores["application"] += 1
    if text.count("!") >= 2:
        scores["climax"] += 1

    kind=max(scores,key=scores.get)
    return kind,scores

def _intensity(text:str, ratio:float)->int:
    score=18
    score += min(24,text.count("!")*4 + text.count("?")*2)
    score += min(24,_count_terms(text,EMOTION_TERMS)*4)
    score += min(16,_count_terms(text,STRUCTURE_TERMS["appeal"])*4)
    score += min(12,round(ratio*12))
    return max(0,min(100,score))

def segment_sermon(segments:list[dict[str,Any]])->dict[str,Any]:
    if not segments:
        return {"sections":[],"transitions":[],"intensity":[],"stats":{}}

    enriched=[]
    transitions=[]
    total=len(segments)

    for i,s in enumerate(segments):
        text=(s.get("text") or "").strip()
        kind,scores=_classify(text,i,total)
        ratio=i/max(1,total-1)
        intensity=_intensity(text,ratio)
        trans=[t for t in TRANSITION_TERMS if t in text.lower()]
        if trans:
            transitions.append({
                "segment_id":s.get("id",i),
                "start":float(s.get("start") or 0),
                "terms":trans,
                "text":text,
            })
        enriched.append({
            **s,
            "kind":kind,
            "classification_scores":scores,
            "intensity":intensity,
        })

    sections=[]
    current_kind=enriched[0]["kind"]
    current=[enriched[0]]

    for item in enriched[1:]:
        if item["kind"] == current_kind:
            current.append(item)
        else:
            sections.append(_section_from(current,current_kind,len(sections)))
            current_kind=item["kind"]
            current=[item]
    sections.append(_section_from(current,current_kind,len(sections)))

    # Merge very short single-segment sections into neighbour when safe.
    merged=[]
    for sec in sections:
        if sec["segment_count"] == 1 and merged and sec["duration"] < 6:
            prev=merged[-1]
            prev["end"]=sec["end"]
            prev["duration"]=round(prev["end"]-prev["start"],2)
            prev["segment_ids"]+=sec["segment_ids"]
            prev["segment_count"]+=sec["segment_count"]
            prev["text_preview"]=(prev["text_preview"]+" "+sec["text_preview"])[:260]
            prev["avg_intensity"]=round((prev["avg_intensity"]+sec["avg_intensity"])/2)
        else:
            merged.append(sec)

    duration=float(segments[-1].get("end") or 0)
    for sec in merged:
        sec["percent"]=round((sec["duration"]/duration)*100,1) if duration>0 else 0

    climax=max(enriched,key=lambda x:x["intensity"])
    return {
        "version":"audio-x-cloud-segmentation-v1",
        "sections":merged,
        "segments":enriched,
        "transitions":transitions,
        "intensity":[x["intensity"] for x in enriched],
        "climax":{
            "segment_id":climax.get("id"),
            "start":climax.get("start"),
            "end":climax.get("end"),
            "text":climax.get("text"),
            "intensity":climax.get("intensity"),
        },
        "stats":{
            "segment_count":len(enriched),
            "section_count":len(merged),
            "transition_count":len(transitions),
            "duration":duration,
        }
    }

def _section_from(items:list[dict[str,Any]], kind:str, idx:int)->dict[str,Any]:
    labels={
        "intro":"Introdução",
        "text":"Texto Bíblico",
        "context":"Contexto",
        "development":"Desenvolvimento",
        "application":"Aplicação",
        "climax":"Clímax",
        "appeal":"Apelo",
    }
    start=float(items[0].get("start") or 0)
    end=float(items[-1].get("end") or start)
    avg=round(sum(i["intensity"] for i in items)/len(items))
    return {
        "id":idx,
        "kind":kind,
        "name":labels.get(kind,kind.title()),
        "start":start,
        "end":end,
        "duration":round(end-start,2),
        "segment_ids":[i.get("id") for i in items],
        "segment_count":len(items),
        "avg_intensity":avg,
        "text_preview":" ".join(i.get("text") or "" for i in items)[:260],
    }
