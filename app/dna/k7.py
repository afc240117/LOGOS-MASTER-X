LEVELS={1:"Expositivo suave",2:"Pentecostal moderado",3:"K7 equilibrado",4:"K7 intenso",5:"K7 máximo controlado"}
def rules(level):
 level=max(1,min(5,int(level)))
 return f"""DNA K7 — nível {level}/5 ({LEVELS[level]})
Progressão: texto → contexto → exposição → aplicação → intensificação → clímax → apelo.
Não imitar voz ou identidade de pregador específico.
Sem glossolalia. Sem manipulação emocional. A emoção nasce da verdade bíblica.
O clímax não introduz doutrina nova e o apelo deve nascer do texto."""
