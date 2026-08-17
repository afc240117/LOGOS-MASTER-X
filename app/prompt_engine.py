from dataclasses import dataclass
from app.think.engine import build_plan
from app.dna.k7 import rules
@dataclass
class PromptRequest:
 mode:str="SERMÃO";text:str="";theme:str="";duration:int=40;cult:str="Avivamento";audience:str="Igreja local";intensity:int=10;objective:str="";notes:str=""
MODE={"SERMÃO":"Entregue uma MENSAGEM COMPLETA, não um resumo: título, texto-base, grande ideia, objetivo, introdução, contexto, desenvolvimento proporcional ao tempo, exposição bíblica amplamente desenvolvida em cada movimento, aplicações, transições naturais, clímax, apelo, oração e versão de púlpito. Cada movimento principal deve conter explicação, interpretação e aplicação suficientes para sustentar oralmente a duração solicitada.","ESTUDAR":"Entregue delimitação, contexto, estrutura, observações, interpretação, grande ideia, relações canônicas prudentes, aplicações e perguntas.","CONTEXTO":"Concentre-se em contexto histórico, cultural, literário e imediato; diferencie fatos seguros de pontos debatidos.","EXEGESE":"Observação textual, estrutura, palavras relevantes sem inventar grego/hebraico, síntese e limites interpretativos.","HERMENÊUTICA":"Do sentido no contexto ao princípio teológico e à aplicação atual, respeitando gênero e distância cultural.","ESBOÇO":"Somente estrutura homilética: título, texto, tema, objetivo, grande ideia, introdução, movimentos, aplicações, conclusão e apelo.","SÉRIE":"Planeje série coesa com propósito, mensagens, textos, grande ideia, objetivo e progressão.","REVISAR":"Avalie fidelidade, contexto, grande ideia, clareza, estrutura, aplicação, progressão, tempo, clímax e apelo.","APLICAR":"Aplicações derivadas do texto para indivíduo, família, igreja e liderança.","ILUSTRAR":"Ilustrações bíblicas, históricas verificáveis, cotidianas e natureza; não inventar testemunhos/milagres.","CONCLUIR":"Conclusão que retome a grande ideia e conduza à resposta sem manipulação.","ORAÇÃO":"Oração coerente com o texto, sem revelações inventadas.","DEVOCIONAL":"Título, texto, verdade, explicação, aplicação, pergunta, oração e ação.","AULA":"Título, texto, objetivos, introdução, tópicos, perguntas, aplicações, revisão e conclusão."}
class PromptEngine:
 def normalize_duration(self,value):
  try: value=int(value)
  except Exception: value=40
  return max(20,min(70,value))
 def normalize_intensity(self,value):
  try: value=int(value)
  except Exception: value=10
  return max(1,min(10,value))
 def long_form_profile(self,mode,duration):
  """Transforma minutos em uma meta concreta de desenvolvimento."""
  d=self.normalize_duration(duration)
  # Faixas pensadas para pregação falada, com pausas, leitura bíblica e interação.
  if d<=20: words=(1800,2400); depth="2–3 movimentos bem desenvolvidos"
  elif d<=30: words=(2600,3400); depth="3 movimentos bem desenvolvidos"
  elif d<=35: words=(3000,3900); depth="3–4 movimentos bem desenvolvidos"
  elif d<=40: words=(3800,5000); depth="4 movimentos amplamente desenvolvidos"
  elif d<=50: words=(4500,5800); depth="4 movimentos profundos"
  elif d<=60: words=(5400,7000); depth="4–5 movimentos profundos"
  else: words=(6200,8000); depth="5 movimentos profundos"
  if str(mode).upper()=="ESBOÇO":
   return "Modo ESBOÇO: seja estrutural e conciso; não tente atingir a meta de palavras de uma mensagem completa."
  return f"""GERAÇÃO LONGA — DURAÇÃO REAL
- Esta saída deve sustentar aproximadamente {d} minutos de exposição/pregação, não apenas citar o tempo no cabeçalho.
- Meta de desenvolvimento: aproximadamente {words[0]}–{words[1]} palavras, com {depth}.
- NÃO entregue resumo, sinopse, roteiro curto nem apenas tópicos.
- Desenvolva integralmente cada seção em vários parágrafos quando necessário.
- Distribua o conteúdo proporcionalmente: introdução e contexto sem dominar a mensagem; maior espaço para exposição, interpretação, aplicações e progressão.
- Inclua transições naturais entre os movimentos para que o texto possa ser pregado de forma contínua.
- Não aumente tamanho com repetição vazia. Cada parágrafo deve acrescentar explicação, conexão bíblica prudente, aplicação ou progressão homilética.
- Se houver limite técnico de saída, priorize completar a mensagem com densidade e coerência em vez de encerrar abruptamente."""
 def system_instructions(self):
  return "Você é o motor do LOGOS MASTER X. Responda em português do Brasil. Não invente citações, referências, fatos históricos, etimologias, grego ou hebraico. Diferencie observação, interpretação e aplicação. Não copie pregadores. Não use glossolalia. A emoção nasce do texto. Quando houver dúvida histórica, textual ou cronológica, use linguagem prudente e não apresente hipótese como certeza. Mantenha numeração de seções estritamente sequencial, sem repetir nem regredir números.  Não atribua nota ou percentual ao próprio Quality Gate; o sistema calcula isso depois da resposta. FORMATAÇÃO VISUAL: organize o conteúdo em seções curtas e bem separadas; use títulos claros e listas quando ajudarem a leitura; pode usar ícones sem exagero para sinalizar 📖 texto, 🧭 contexto, 🔎 observação, 🧠 interpretação, 💡 grande ideia, 🎯 aplicação, 🔥 DNA K7/intensificação, ⚡ clímax, 🙏 apelo/oração e ✅ revisão. Sempre que o DNA K7 entrar na construção, identifique explicitamente a seção ou movimento como DNA K7. Evite paredes de texto e hashtags soltas como decoração."
 def build(self,r):
  mode=(r.mode or "SERMÃO").upper(); duration=self.normalize_duration(r.duration); intensity=self.normalize_intensity(r.intensity); p=build_plan(mode,r.text,duration,intensity)
  stages="\n".join(f"{i+1}. {x['label']}" for i,x in enumerate(p.stages))
  return f"""LOGOS MASTER X — PROMPT ENGINE 2.0
MODO: {mode}
TEXTO/TEMA: {r.text}
TEMA: {r.theme or 'não informado'}
TEMPO: {duration} minutos
CULTO: {r.cult}
PÚBLICO: {r.audience}
OBJETIVO: {r.objective or 'derivar do texto'}
INTENSIDADE K7: {intensity}/10
OBSERVAÇÕES: {r.notes or 'nenhuma'}

PERFIL DE TEMPO:
{p.time_profile}

{self.long_form_profile(mode,duration)}

THINK ENGINE:
{stages}

{MODE.get(mode,MODE["SERMÃO"])}

{rules(intensity)}

APRESENTAÇÃO DA RESPOSTA:
- entregue em blocos visuais claros e fáceis de escanear;
- identifique explicitamente onde entra o 🔥 DNA K7 e sua progressão;
- use ícones funcionais com moderação;
- evite paredes de texto e Markdown usado apenas como decoração.

QUALITY GATE — revise silenciosamente antes de entregar:
- texto/contexto respeitados?
- grande ideia emerge do texto?
- aplicações derivam da interpretação?
- fatos históricos/cronológicos tratados com prudência?
- sem citações, etimologias ou detalhes inventados?
- títulos e seções numerados em ordem, sem números duplicados ou regressivos?
- tempo proporcional?
- clímax e apelo coerentes?
Corrija falhas essenciais antes de entregar. Não inclua uma nota percentual de Quality Gate na resposta."""
