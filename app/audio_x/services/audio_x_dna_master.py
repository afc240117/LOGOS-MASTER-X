from __future__ import annotations
from typing import Any
AXES=("ritmo","pausas","progressao","climax","apelo","densidade_biblica","aplicacao","contexto","estrutura","expressividade")
def build_master(profiles:list[dict[str,Any]],name:str="DNA Mestre",weights:list[float]|None=None)->dict[str,Any]:
    if len(profiles)<2: raise ValueError("Selecione pelo menos 2 perfis DNA.")
    if weights is None: weights=[1.0]*len(profiles)
    if len(weights)!=len(profiles): raise ValueError("Quantidade de pesos inválida.")
    weights=[max(0,float(x)) for x in weights]
    total=sum(weights)
    if total<=0: raise ValueError("Ao menos um perfil deve ter peso maior que zero.")
    axes={}
    for k in AXES:
        axes[k]=round(sum(float((p.get("axes") or {}).get(k,0))*w for p,w in zip(profiles,weights))/total,1)
    score=round(sum(float(p.get("score",0))*w for p,w in zip(profiles,weights))/total,1)
    source_names=[p.get("name") or p.get("profile_name") or f"DNA {i+1}" for i,p in enumerate(profiles)]
    strongest=max(axes,key=axes.get); weakest=min(axes,key=axes.get)
    return {"version":"dna-master-1","name":name,"score":score,"axes":axes,
            "sources":[{"name":n,"weight":w} for n,w in zip(source_names,weights)],
            "strongest_axis":strongest,"weakest_axis":weakest,
            "studio_x":{"type":"dna_master","profile_name":name,"strength":100,"controls":axes},
            "prompt_guidance":"Use os padrões estruturais agregados como orientação de composição original; não reproduza identidade vocal, frases exclusivas ou texto de terceiros."}
