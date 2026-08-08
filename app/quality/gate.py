REQUIRED={"SERMÃO":["grande ideia","contexto","aplica","conclus","apelo"],"ESTUDAR":["contexto","ideia","aplica"],"AULA":["objetivo","tópico","conclus"]}
def evaluate(text,mode="SERMÃO"):
 low=(text or "").lower(); checks=[{"name":f"presença:{m}","ok":m in low} for m in REQUIRED.get(mode.upper(),[])]
 checks += [{"name":"sem glossolalia","ok":"shandar" not in low},{"name":"conteúdo não vazio","ok":len(text or "")>300}]
 score=round(100*sum(c["ok"] for c in checks)/max(1,len(checks)))
 return {"score":score,"passed":score>=75,"checks":checks,"characters":len(text or "")}
