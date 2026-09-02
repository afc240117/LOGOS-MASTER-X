LEVELS={
 1:"Expositivo suave",2:"Expositivo com leve cadência",3:"Pentecostal moderado",4:"Pentecostal progressivo",5:"K7 equilibrado",
 6:"K7 acentuado",7:"K7 forte",8:"K7 intenso",9:"K7 muito intenso",10:"K7 máximo estrutural"
}
def rules(level):
 level=max(1,min(10,int(level)))
 extra=""
 if level>=6: extra+="\nAumente a cadência, transições progressivas e chamadas congregacionais inteligíveis, sempre derivadas do texto."
 if level>=8: extra+="\nConstrua intensificação mais longa, repetição com avanço de ideia, imagens bíblicas e clímax progressivo."
 if level>=10: extra+="\nUse a intensidade estrutural máxima do DNA K7: exposição viva, cadência forte, retomadas estratégicas, clímax robusto e apelo textual; sem sacrificar exegese, prudência ou clareza."
 return f"""DNA K7 — nível {level}/10 ({LEVELS[level]})
Progressão: texto → contexto → exposição → aplicação → intensificação → clímax → apelo.
Não imitar voz ou identidade de pregador específico.
Sem glossolalia. Sem manipulação emocional. A emoção nasce da verdade bíblica.
O clímax não introduz doutrina nova e o apelo deve nascer do texto.{extra}"""
