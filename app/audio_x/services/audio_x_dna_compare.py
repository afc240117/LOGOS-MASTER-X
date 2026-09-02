from __future__ import annotations
from typing import Any
AXES=("ritmo","pausas","progressao","climax","apelo","densidade_biblica","aplicacao","contexto","estrutura","expressividade")
def compare(profiles:list[dict[str,Any]])->dict[str,Any]:
    if len(profiles)<2: raise ValueError("Envie pelo menos 2 perfis DNA K7 Pro.")
    rows=[]
    for i,p in enumerate(profiles):
        a=p.get("axes") or {}
        rows.append({"name":p.get("name") or p.get("profile_name") or f"DNA {i+1}","score":p.get("score",0),"axes":{k:float(a.get(k,0)) for k in AXES}})
    averages={k:round(sum(r["axes"][k] for r in rows)/len(rows),1) for k in AXES}
    spreads={k:round(max(r["axes"][k] for r in rows)-min(r["axes"][k] for r in rows),1) for k in AXES}
    common={k:v for k,v in averages.items() if v>=65 and spreads[k]<=25}
    strongest=max(averages,key=averages.get); most_consistent=min(spreads,key=spreads.get)
    similarity=round(sum(max(0,100-spreads[k]) for k in AXES)/len(AXES),1)
    return {"count":len(rows),"profiles":rows,"averages":averages,"spreads":spreads,"common_patterns":common,
            "similarity_score":similarity,"strongest_common_axis":strongest,"most_consistent_axis":most_consistent}
