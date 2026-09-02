from __future__ import annotations
from typing import Any

AXIS_MAP = {
    "intensidade": ("intensity", 1.0),
    "progressao": ("progression", 1.0),
    "densidade_biblica": ("biblical_density", 1.0),
    "aplicacao": ("application", 1.0),
    "apelo": ("appeal", 1.0),
    "ritmo": ("rhythm", 1.0),
    "climax": ("climax", 1.0),
    "expressividade": ("expressiveness", 1.0),
    "estrutura": ("structure", 1.0),
    "contexto": ("context", 1.0),
}

def build_studio_x_config(profile: dict[str, Any], strength: int = 100) -> dict[str, Any]:
    sx = profile.get("studio_x") or {}
    axes = sx.get("axes") or {}
    sig = sx.get("signature") or {}
    strength=max(0,min(100,int(strength)))
    factor=strength/100.0

    controls={}
    for src,(dst,mul) in AXIS_MAP.items():
        raw=float(axes.get(src,50))
        # blend toward neutral 50 according to requested strength
        controls[dst]=round(50 + (raw-50)*factor*mul)

    return {
      "schema":"logos-master-x/studio-x-applied-dna-v1",
      "source":"audio-x-dna-k7",
      "profile_id":profile.get("id"),
      "profile_name":profile.get("name"),
      "dna_score":sx.get("dna_score",0),
      "strength":strength,
      "controls":controls,
      "signature":sig,
      "generation_directives":{
        "opening_style":sig.get("opening_style","progressiva"),
        "development_weight":sig.get("development_weight",50),
        "application_weight":sig.get("application_weight",50),
        "appeal_weight":sig.get("appeal_weight",50),
        "climax_position":sig.get("climax_position",80),
      },
      "safety":{
        "copy_source_text":False,
        "imitate_voice":False,
        "use_structural_characteristics_only":True
      }
    }

def build_prompt_block(config: dict[str, Any]) -> str:
    c=config["controls"]; d=config["generation_directives"]
    return f"""[DNA K7 ESTRUTURAL]
Perfil: {config.get('profile_name')}
Força de aplicação: {config.get('strength')}%
Intensidade: {c['intensity']}/100
Progressão: {c['progression']}/100
Densidade bíblica: {c['biblical_density']}/100
Aplicação: {c['application']}/100
Apelo: {c['appeal']}/100
Ritmo: {c['rhythm']}/100
Clímax: {c['climax']}/100
Expressividade: {c['expressiveness']}/100
Estrutura: {c['structure']}/100
Contexto: {c['context']}/100
Abertura: {d['opening_style']}
Peso desenvolvimento: {d['development_weight']}/100
Peso aplicação: {d['application_weight']}/100
Peso apelo: {d['appeal_weight']}/100
Posição-alvo do clímax: {d['climax_position']}% da mensagem
REGRA: reproduzir somente dinâmica e estrutura. Não copiar frases, texto ou voz do áudio-fonte.
[/DNA K7 ESTRUTURAL]"""
