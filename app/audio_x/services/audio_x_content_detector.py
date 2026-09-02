from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

FAMILY_META = {
    "pregador": {"label": "DNA Pregador", "icon": "🧬", "route": "dna_pregador"},
    "comunicador": {"label": "DNA Comunicador", "icon": "🎙️", "route": "dna_comunicador"},
    "musical": {"label": "DNA Musical", "icon": "🎵", "route": "dna_musical"},
    "congregacional": {"label": "DNA Congregacional", "icon": "⛪", "route": "dna_congregacional"},
}

MUSIC_FILE = {
    "hino": 4, "louvor": 4, "adoracao": 4, "adoração": 4, "harpa": 5,
    "coral": 4, "quarteto": 4, "gospel": 3, "worship": 4, "song": 3,
    "musica": 3, "música": 3, "cantor": 2, "cantora": 2, "playback": 3,
}
CONG_FILE = {
    "congregacional": 6, "culto": 3, "igreja": 3, "ao vivo": 4, "live": 3,
    "congresso": 2, "assembleia": 2, "mocidade": 2, "circulo de oracao": 2,
}
SERMON_FILE = {
    "pregacao": 5, "pregação": 5, "sermao": 5, "sermão": 5, "mensagem": 4,
    "pastor": 3, "missionario": 2, "missionário": 2, "preletor": 3, "evangelista": 3,
}
TALK_FILE = {
    "palestra": 5, "aula": 4, "curso": 4, "seminario": 4, "seminário": 4,
    "estudo": 3, "ebd": 4, "conferencia": 3, "conferência": 3, "workshop": 4,
}

SERMON_TEXT = {
    "abra sua bíblia": 5, "abra a bíblia": 5, "palavra de deus": 3, "meus irmãos": 3,
    "meus irmaos": 3, "irmãos": 2, "irmaos": 2, "texto bíblico": 4, "versículo": 3,
    "versiculo": 3, "capítulo": 3, "capitulo": 3, "jesus disse": 3, "está escrito": 4,
    "esta escrito": 4, "aleluia": 1, "amém": 1, "amem": 1, "altar": 2,
    "salvação": 2, "salvacao": 2, "arrependimento": 3, "apelo": 3,
}
TALK_TEXT = {
    "nesta aula": 5, "na aula": 3, "palestra": 5, "nosso tema": 3, "tema de hoje": 4,
    "primeiro ponto": 3, "segundo ponto": 3, "vamos aprender": 4, "conteúdo": 3,
    "conteudo": 3, "conceito": 2, "exemplo": 2, "pergunta": 1, "slide": 4,
    "material": 2, "professor": 3, "alunos": 3, "seminário": 3, "seminario": 3,
}
MUSIC_TEXT = {
    "cantarei": 2, "cantamos": 2, "adorarei": 3, "adoramos": 3, "te adoramos": 4,
    "eu te adoro": 4, "glória": 1, "gloria": 1, "santo santo": 4, "tu és": 2,
    "tu es": 2, "meu senhor": 2, "meu jesus": 2, "pra sempre": 2, "para sempre": 2,
    "hosana": 3, "digno": 2, "cordeiro": 2, "refrão": 3, "refrao": 3,
}
CONG_TEXT = {
    "cante comigo": 6, "cante com": 4, "vamos cantar": 5, "toda igreja": 5,
    "a igreja": 2, "levante as mãos": 4, "levante as maos": 4, "mais uma vez": 3,
    "repita comigo": 4, "diga comigo": 3, "vocês podem cantar": 5, "voces podem cantar": 5,
    "vamos adorar": 4, "adora igreja": 5, "igreja adore": 5,
}

SUBTYPES = {
    "pregador": [("Sermão/Pregação", SERMON_FILE), ("Mensagem cristã", {"mensagem": 2})],
    "comunicador": [("Palestra/Aula", TALK_FILE), ("Comunicação falada", {})],
    "musical": [
        ("Hino", {"hino": 4, "harpa": 4}), ("Louvor/Adoração", {"louvor": 4, "ador": 3, "worship": 3}),
        ("Coral/Quarteto", {"coral": 4, "quarteto": 4}), ("Música cristã", {}),
    ],
    "congregacional": [("Louvor congregacional", {"culto": 3, "congreg": 4, "igreja": 2, "ao vivo": 2}), ("Música em culto", {})],
}

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()

def _add_keywords(scores: dict[str, float], evidence: dict[str, list[str]], target: str, text: str, table: dict[str, int], source: str) -> None:
    for term, weight in table.items():
        if term in text:
            scores[target] += weight
            evidence[target].append(f"{source}: {term}")

def _line_repetition(text: str) -> tuple[float, int]:
    raw = [re.sub(r"[^a-záàâãéêíóôõúç0-9 ]+", "", x.lower()).strip() for x in re.split(r"[\n.!?;]+", text)]
    lines = [re.sub(r"\s+", " ", x) for x in raw if len(x.split()) >= 3]
    if len(lines) < 4:
        return 0.0, 0
    counts = Counter(lines)
    repeats = sum(v - 1 for v in counts.values() if v > 1)
    return min(1.0, repeats / max(1, len(lines))), repeats

def _segment_repetition(segments: list[dict[str, Any]]) -> tuple[float, int]:
    texts=[]
    for s in segments or []:
        t=_norm(str(s.get("text") or ""))
        t=re.sub(r"[^a-záàâãéêíóôõúç0-9 ]+", "", t)
        if len(t.split())>=2: texts.append(t)
    if len(texts)<4: return 0.0,0
    counts=Counter(texts)
    repeats=sum(v-1 for v in counts.values() if v>1)
    return min(1.0,repeats/max(1,len(texts))),repeats

def _subtype(family: str, haystack: str) -> str:
    for label, cues in SUBTYPES[family]:
        if not cues: return label
        if any(k in haystack for k in cues): return label
    return SUBTYPES[family][-1][0]

def detect_content(job: dict[str, Any] | None = None, transcription: dict[str, Any] | None = None) -> dict[str, Any]:
    job=job or {}; transcription=transcription or {}
    filename=_norm(str(job.get("filename") or job.get("title") or ""))
    text=_norm(str(transcription.get("text") or ""))
    segments=list(transcription.get("segments") or [])
    scores={k:0.0 for k in FAMILY_META}
    evidence={k:[] for k in FAMILY_META}

    _add_keywords(scores,evidence,"musical",filename,MUSIC_FILE,"arquivo")
    _add_keywords(scores,evidence,"congregacional",filename,CONG_FILE,"arquivo")
    _add_keywords(scores,evidence,"pregador",filename,SERMON_FILE,"arquivo")
    _add_keywords(scores,evidence,"comunicador",filename,TALK_FILE,"arquivo")
    _add_keywords(scores,evidence,"pregador",text,SERMON_TEXT,"transcrição")
    _add_keywords(scores,evidence,"comunicador",text,TALK_TEXT,"transcrição")
    _add_keywords(scores,evidence,"musical",text,MUSIC_TEXT,"transcrição")
    _add_keywords(scores,evidence,"congregacional",text,CONG_TEXT,"transcrição")

    line_rep,line_n=_line_repetition(str(transcription.get("text") or ""))
    seg_rep,seg_n=_segment_repetition(segments)
    repetition=max(line_rep,seg_rep)
    if repetition>=0.08:
        bonus=min(8.0, 2.0 + repetition*18)
        scores["musical"]+=bonus
        evidence["musical"].append(f"repetição textual: {round(repetition*100)}%")
    if repetition>=0.16:
        scores["congregacional"]+=min(5.0,1.0+repetition*10)
        evidence["congregacional"].append("repetições compatíveis com refrão/resposta")

    # A transcript with many long prose segments leans toward spoken content.
    lengths=[len(_norm(str(s.get("text") or "")).split()) for s in segments if s.get("text")]
    avg_words=(sum(lengths)/len(lengths)) if lengths else 0
    if avg_words>=18:
        scores["pregador"]+=1.5; scores["comunicador"]+=1.5
    elif lengths and avg_words<=8 and repetition>=0.05:
        scores["musical"]+=2.5

    # Biblical reference patterns strengthen preaching but are not enough alone.
    bible_refs=len(re.findall(r"\b(?:jo[aã]o|mateus|marcos|lucas|romanos|salmos?|isa[ií]as|g[eê]nesis|apocalipse|cor[ií]ntios|ef[eé]sios)\s+\d+", text))
    if bible_refs:
        scores["pregador"]+=min(6,bible_refs*1.5)
        evidence["pregador"].append(f"referências bíblicas detectadas: {bible_refs}")

    # Congregational is a specialization of music: require some musical signal.
    musical_signal=scores["musical"]
    if scores["congregacional"]>0 and musical_signal>0:
        scores["congregacional"] += min(5.0, musical_signal*0.25)
    elif scores["congregacional"]>0 and musical_signal==0:
        scores["congregacional"] *= 0.55

    # Sensible fallback: normal prose with no cue is communication, not music.
    if max(scores.values())<=0:
        scores["comunicador"]=1.0
        evidence["comunicador"].append("fallback: conteúdo falado sem sinais musicais suficientes")

    ranked=sorted(scores.items(),key=lambda kv:kv[1],reverse=True)
    family=ranked[0][0]
    top=ranked[0][1]; second=ranked[1][1]
    total=sum(max(0,v) for v in scores.values()) or 1
    share=top/total
    gap=max(0,top-second)
    confidence=round(max(52,min(98,52 + share*30 + min(16,gap*2))),1)
    normalized={k:round((v/max(1,top))*100) for k,v in scores.items()}
    meta=FAMILY_META[family]
    subtype=_subtype(family, filename+" "+text[:4000])
    route_status="ready" if family in {"pregador","comunicador"} else "recognized_music_branch"
    return {
        "family":family,
        "family_label":meta["label"],
        "icon":meta["icon"],
        "content_type":subtype,
        "confidence":confidence,
        "scores":normalized,
        "raw_scores":{k:round(v,2) for k,v in scores.items()},
        "evidence":evidence[family][:8],
        "repetition_percent":round(repetition*100,1),
        "average_segment_words":round(avg_words,1),
        "route":meta["route"],
        "route_status":route_status,
        "recommended_analyzers": (
            ["estrutura","ritmo","progressão","clímax","apelo","densidade_bíblica"] if family=="pregador" else
            ["estrutura","clareza","progressão","didática","ritmo","ênfase"] if family=="comunicador" else
            ["estrutura_musical","repetição","emoção","crescimento","clímax","instrumentação"] if family=="musical" else
            ["estrutura_musical","congregacionalidade","repetição","crescimento","clímax","participação"]
        ),
        "limitations": "Reconhecimento baseado em metadados + transcrição. BPM, tonalidade e instrumentos exigem a próxima camada de análise acústica." if family in {"musical","congregacional"} else None,
    }
