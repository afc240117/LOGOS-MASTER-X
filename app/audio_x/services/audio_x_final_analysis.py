from __future__ import annotations
import re
BOOKS=["Gênesis","Êxodo","Salmos","Provérbios","Isaías","Jeremias","Ezequiel","Daniel","Mateus","Marcos","Lucas","João","Atos","Romanos","Coríntios","Gálatas","Efésios","Filipenses","Hebreus","Tiago","Pedro","Apocalipse"]
def biblical(t):
    refs=[]
    for b in BOOKS: refs += re.findall(rf"\b{b}\s+\d+(?::\d+(?:-\d+)?)?",t,re.I)
    themes={k:len(re.findall(k,t,re.I)) for k in ["fé","graça","salvação","oração","missão","santidade","espírito santo","igreja","cruz","ressurreição"]}
    return {"references":refs,"themes":dict(sorted(themes.items(),key=lambda x:-x[1])),"reference_count":len(refs)}
def preaching(t):
    low=t.lower()
    return {"questions":t.count("?"),"exclamations":t.count("!"),"repetitions":sum(1 for w in set(re.findall(r"\b\w{5,}\b",low)) if low.count(w)>=4),"appeal_hits":sum(low.count(x) for x in ["venha","ore","decida","altar","entregue","arrepend"]),"application_hits":sum(low.count(x) for x in ["devemos","precisamos","você precisa","aplique","pratique"])}
def structure(s):
    n=len(s)
    if not n:return []
    cuts=[0,max(1,n//6),max(2,n//3),max(3,2*n//3),max(4,5*n//6),n]
    cuts=[min(n,x) for x in cuts]
    names=["Introdução","Contexto / texto","Desenvolvimento","Clímax","Conclusão / apelo"];out=[]
    for i,name in enumerate(names):
        ss=s[cuts[i]:cuts[i+1]]
        if ss:out.append({"section":name,"start":ss[0].get("start",0),"end":ss[-1].get("end",0),"text":" ".join(x.get("text","") for x in ss)})
    return out
def final_extract(p):
    s=p.get("segments") or [];t=p.get("text") or " ".join(x.get("text","") for x in s)
    return {"version":"dna-k7-final-1","biblical":biblical(t),"preaching":preaching(t),"message_structure":structure(s),"text_words":len(re.findall(r"\b\w+\b",t))}
