from __future__ import annotations
from typing import Any

def _clamp(v): return max(0, min(100, round(v)))
def _avg(values): return sum(values)/len(values) if values else 0

def extract_dna_k7(seg: dict[str, Any]) -> dict[str, Any]:
    segments=seg.get("segments") or []
    sections=seg.get("sections") or []
    transitions=seg.get("transitions") or []
    intensity=seg.get("intensity") or []

    kinds={s.get("kind"):s for s in sections}
    total=max(1,float((seg.get("stats") or {}).get("duration") or 1))

    intro_pct=float((kinds.get("intro") or {}).get("percent") or 0)
    context_pct=float((kinds.get("context") or {}).get("percent") or 0)
    dev_pct=float((kinds.get("development") or {}).get("percent") or 0)
    app_pct=float((kinds.get("application") or {}).get("percent") or 0)
    climax_pct=float((kinds.get("climax") or {}).get("percent") or 0)
    appeal_pct=float((kinds.get("appeal") or {}).get("percent") or 0)

    avg_int=_avg(intensity)
    peak=max(intensity) if intensity else 0
    late=intensity[int(len(intensity)*.65):] if intensity else []
    early=intensity[:max(1,int(len(intensity)*.35))] if intensity else []
    progression=_avg(late)-_avg(early)

    text=" ".join((s.get("text") or "") for s in segments).lower()
    bible=sum(text.count(x) for x in ["bíblia","versículo","passagem","está escrito","palavra de deus","capítulo"])
    appeal=sum(text.count(x) for x in ["venha","altar","ore comigo","aceite","decida","salvação","arrepend"])
    emotion=sum(text.count(x) for x in ["glória","aleluia","amém","poder","fogo","milagre","vitória","unção","receba"])
    questions=text.count("?")
    exclam=text.count("!")

    axes={
      "intensidade": _clamp(avg_int*.65 + peak*.35),
      "progressao": _clamp(50 + progression*1.5),
      "densidade_biblica": _clamp(20 + bible*7 + context_pct*.6),
      "aplicacao": _clamp(25 + app_pct*2 + questions*1.5),
      "apelo": _clamp(appeal_pct*3 + appeal*8 + climax_pct*.6),
      "ritmo": _clamp(30 + len(transitions)*3 + exclam*1.2),
      "climax": _clamp(peak*.75 + climax_pct*1.5),
      "expressividade": _clamp(20 + emotion*5 + exclam*2),
      "estrutura": _clamp(35 + min(7,len({s.get("kind") for s in sections}))*8 + dev_pct*.35),
      "contexto": _clamp(20 + context_pct*3 + bible*2),
    }

    score=_clamp(
        axes["intensidade"]*.12 + axes["progressao"]*.12 +
        axes["densidade_biblica"]*.13 + axes["aplicacao"]*.10 +
        axes["apelo"]*.12 + axes["ritmo"]*.09 +
        axes["climax"]*.12 + axes["expressividade"]*.08 +
        axes["estrutura"]*.07 + axes["contexto"]*.05
    )

    if score>=85: profile="K7 Intenso"
    elif score>=70: profile="K7 Forte"
    elif score>=55: profile="K7 Equilibrado"
    elif score>=40: profile="K7 Moderado"
    else: profile="K7 Suave"

    return {
      "version":"audio-x-dna-k7-v1",
      "score":score,
      "profile":profile,
      "axes":axes,
      "source":{
        "duration":total,
        "section_count":len(sections),
        "transition_count":len(transitions),
        "segment_count":len(segments),
      },
      "signature":{
        "opening_style":"direta" if intro_pct<10 else "progressiva",
        "development_weight":_clamp(dev_pct*2),
        "application_weight":_clamp(app_pct*3),
        "appeal_weight":axes["apelo"],
        "climax_position":round(float((seg.get("climax") or {}).get("start") or 0)/total*100,1),
      }
    }
