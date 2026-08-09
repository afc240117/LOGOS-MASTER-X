import re

REQUIRED={
    "SERMÃO":["grande ideia","contexto","aplica","conclus","apelo"],
    "ESTUDAR":["delimita","contexto","estrutura","interpreta","grande ideia","aplica","perguntas"],
    "AULA":["objetivo","tópico","conclus"]
}

def _content_only(text):
    """Ignore a model-written Quality Gate block so it cannot grade itself."""
    t=text or ""
    m=re.search(r"(?im)^#{0,3}\s*quality\s+gate\b",t)
    return t[:m.start()] if m else t

def _heading_numbers(text):
    # Markdown headings such as ## 8. APLICAÇÕES or ## 8 — APLICAÇÕES.
    nums=[]
    for line in (text or "").splitlines():
        m=re.match(r"^\s*#{1,4}\s*(\d{1,2})\s*[.\-—:]",line)
        if m: nums.append(int(m.group(1)))
    return nums

def evaluate(text,mode="SERMÃO"):
    body=_content_only(text)
    low=body.lower()
    checks=[{"name":f"presença:{m}","ok":m in low} for m in REQUIRED.get((mode or "SERMÃO").upper(),[])]

    nums=_heading_numbers(body)
    no_duplicates=len(nums)==len(set(nums))
    no_regression=all(b>a for a,b in zip(nums,nums[1:])) if len(nums)>1 else True

    checks += [
        {"name":"sem glossolalia","ok":not any(x in low for x in ("shandar","xandarai","labaxú","labassú"))},
        {"name":"conteúdo desenvolvido","ok":len(body)>1200},
        {"name":"seções sem numeração duplicada","ok":no_duplicates},
        {"name":"numeração de seções progressiva","ok":no_regression},
        {"name":"não se autoatribui nota de quality gate","ok":not bool(re.search(r"(?i)quality\s*gate\s*[:\-–—]?\s*\d{1,3}\s*%",body))},
    ]
    score=round(100*sum(c["ok"] for c in checks)/max(1,len(checks)))
    failed=[c["name"] for c in checks if not c["ok"]]
    return {"score":score,"passed":score>=80,"checks":checks,"failed":failed,"characters":len(text or ""),"evaluated_characters":len(body)}
