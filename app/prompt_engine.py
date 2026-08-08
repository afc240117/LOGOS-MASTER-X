from dataclasses import dataclass
from app.think.engine import build_plan
from app.dna.k7 import rules
@dataclass
class PromptRequest:
 mode:str="SERMÃO";text:str="";theme:str="";duration:int=40;cult:str="Avivamento";audience:str="Igreja local";intensity:int=3;objective:str="";notes:str=""
MODE={"SERMÃO":"Entregue título, texto-base, grande ideia, objetivo, introdução, contexto, desenvolvimento proporcional ao tempo, aplicações, transições, clímax, apelo, oração e versão de púlpito.","ESTUDAR":"Entregue delimitação, contexto, estrutura, observações, interpretação, grande ideia, relações canônicas prudentes, aplicações e perguntas.","CONTEXTO":"Concentre-se em contexto histórico, cultural, literário e imediato; diferencie fatos seguros de pontos debatidos.","EXEGESE":"Observação textual, estrutura, palavras relevantes sem inventar grego/hebraico, síntese e limites interpretativos.","HERMENÊUTICA":"Do sentido no contexto ao princípio teológico e à aplicação atual, respeitando gênero e distância cultural.","ESBOÇO":"Somente estrutura homilética: título, texto, tema, objetivo, grande ideia, introdução, movimentos, aplicações, conclusão e apelo.","SÉRIE":"Planeje série coesa com propósito, mensagens, textos, grande ideia, objetivo e progressão.","REVISAR":"Avalie fidelidade, contexto, grande ideia, clareza, estrutura, aplicação, progressão, tempo, clímax e apelo.","APLICAR":"Aplicações derivadas do texto para indivíduo, família, igreja e liderança.","ILUSTRAR":"Ilustrações bíblicas, históricas verificáveis, cotidianas e natureza; não inventar testemunhos/milagres.","CONCLUIR":"Conclusão que retome a grande ideia e conduza à resposta sem manipulação.","ORAÇÃO":"Oração coerente com o texto, sem revelações inventadas.","DEVOCIONAL":"Título, texto, verdade, explicação, aplicação, pergunta, oração e ação.","AULA":"Título, texto, objetivos, introdução, tópicos, perguntas, aplicações, revisão e conclusão."}
class PromptEngine:
 def system_instructions(self):
  return "Você é o motor do LOGOS MASTER X. Responda em português do Brasil. Não invente citações, referências, fatos históricos, etimologias, grego ou hebraico. Diferencie observação, interpretação e aplicação. Não copie pregadores. Não use glossolalia. A emoção nasce do texto."
 def build(self,r):
  mode=(r.mode or "SERMÃO").upper(); p=build_plan(mode,r.text,r.duration,r.intensity)
  stages="\n".join(f"{i+1}. {x['label']}" for i,x in enumerate(p.stages))
  return f"""LOGOS MASTER X — PROMPT ENGINE 2.0
MODO: {mode}
TEXTO/TEMA: {r.text}
TEMA: {r.theme or 'não informado'}
TEMPO: {r.duration} minutos
CULTO: {r.cult}
PÚBLICO: {r.audience}
OBJETIVO: {r.objective or 'derivar do texto'}
INTENSIDADE K7: {r.intensity}/5
OBSERVAÇÕES: {r.notes or 'nenhuma'}

PERFIL DE TEMPO:
{p.time_profile}

THINK ENGINE:
{stages}

{MODE.get(mode,MODE["SERMÃO"])}

{rules(r.intensity)}

QUALITY GATE:
- texto/contexto respeitados?
- grande ideia emerge do texto?
- aplicações derivam da interpretação?
- sem fatos não verificados como certeza?
- tempo proporcional?
- clímax e apelo coerentes?
Corrija falhas essenciais antes de entregar."""
