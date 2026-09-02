from __future__ import annotations
import re, math
from collections import Counter
from typing import Any

BIBLE_BOOKS = ("gênesis","êxodo","levítico","números","deuteronômio","josué","juízes","rute","samuel","reis","crônicas","esdras","neemias","ester","jó","salmos","provérbios","eclesiastes","isaías","jeremias","lamentações","ezequiel","daniel","oseias","joel","amós","obadias","jonas","miqueias","naum","habacuque","sofonias","ageu","zacarias","malaquias","mateus","marcos","lucas","joão","atos","romanos","coríntios","gálatas","efésios","filipenses","colossenses","tessalonicenses","timóteo","tito","filemom","hebreus","tiago","pedro","judas","apocalipse")
APPEAL=("venha","altar","oração","ore","entregue","decida","hoje","agora","jesus","salvação","arrepend")
APPLICATION=("você precisa","nós precisamos","devemos","pratique","faça","aplique","vida","casa","família","igreja")
CLIMAX=("glória","poder","fogo","espírito santo","aleluia","vitória","milagre","deus vai","senhor vai")
CONTEXT=("contexto","época","naquele tempo","história","jerusalém","israel","cultura","costume")

def _clamp(x): return max(0,min(100,round(x)))
def _hits(text, words): return sum(text.count(w) for w in words)
def _segments(payload):
    return payload.get("segments") or []
def analyze(payload:dict[str,Any])->dict[str,Any]:
    segs=_segments(payload)
    text=(payload.get("text") or " ".join(str(s.get("text","")) for s in segs)).lower()
    words=re.findall(r"\b[\wÀ-ÿ]+\b",text)
    wc=max(1,len(words))
    duration=float(payload.get("duration") or (max([float(s.get("end",0)) for s in segs],default=0)))
    minutes=max(duration/60,1)
    wpm=wc/minutes
    refs=sum(len(re.findall(rf"\b{re.escape(b)}\s+\d+(?::\d+(?:-\d+)?)?",text,re.I)) for b in BIBLE_BOOKS)
    pauses=[]
    for a,b in zip(segs,segs[1:]):
        gap=max(0,float(b.get("start",0))-float(a.get("end",0)))
        if gap>=.35: pauses.append(gap)
    lengths=[len(re.findall(r"\b[\wÀ-ÿ]+\b",str(s.get("text","")))) for s in segs] or [wc]
    avg=sum(lengths)/len(lengths)
    variation=(sum((x-avg)**2 for x in lengths)/len(lengths))**.5 if lengths else 0
    punct=text.count("!")+text.count("?")
    scores={
      "ritmo":_clamp(70-abs(wpm-135)*.35 + min(variation,25)),
      "pausas":_clamp(35+len(pauses)*3+min(sum(pauses),25)),
      "progressao":_clamp(48+min(punct*2,20)+min(_hits(text,CLIMAX)*2,30)),
      "climax":_clamp(35+_hits(text,CLIMAX)*5+punct*1.2),
      "apelo":_clamp(30+_hits(text,APPEAL)*4),
      "densidade_biblica":_clamp(30+refs*8),
      "aplicacao":_clamp(35+_hits(text,APPLICATION)*4),
      "contexto":_clamp(30+_hits(text,CONTEXT)*5),
      "estrutura":_clamp(45+min(len(segs)/3,25)+min(refs*2,15)),
      "expressividade":_clamp(40+punct*2+_hits(text,CLIMAX)*2),
    }
    overall=_clamp(sum(scores.values())/len(scores))
    thirds=[text[:len(text)//3],text[len(text)//3:2*len(text)//3],text[2*len(text)//3:]]
    energy=[_clamp(25+_hits(t,CLIMAX)*5+(t.count("!")+t.count("?"))*2) for t in thirds]
    return {
      "version":"dna-k7-pro-1","score":overall,"axes":scores,
      "metrics":{"words":wc,"duration_seconds":round(duration,2),"words_per_minute":round(wpm,1),
                 "biblical_references":refs,"detected_pauses":len(pauses),
                 "average_pause_seconds":round(sum(pauses)/len(pauses),2) if pauses else 0,
                 "average_segment_words":round(avg,1)},
      "energy_curve":{"inicio":energy[0],"desenvolvimento":energy[1],"final":energy[2]},
      "diagnosis":{
        "strongest":max(scores,key=scores.get),"weakest":min(scores,key=scores.get),
        "summary":f"DNA K7 Pro {overall}/100; eixo dominante: {max(scores,key=scores.get).replace('_',' ')}."
      }
    }
