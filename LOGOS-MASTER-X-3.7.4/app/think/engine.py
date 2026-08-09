from dataclasses import dataclass
STAGES=[("biblical_analysis","Analista Bíblico"),("historical_context","Contexto Histórico"),("literary_context","Contexto Literário"),("exegesis","Exegese"),("hermeneutics","Hermenêutica"),("big_idea","Grande Ideia"),("objective","Objetivo"),("structure","Estrutura"),("applications","Aplicações"),("illustrations","Ilustrações"),("rhythm","Controle de Ritmo"),("dna_k7","DNA K7"),("climax","Clímax"),("quality_gate","Quality Gate")]
@dataclass
class ThinkPlan: mode:str;text:str;duration:int;intensity:int;stages:list;time_profile:str
def time_profile(m):
 if m<=20:return "2 movimentos; contexto essencial; aplicações diretas; clímax curto."
 if m<=35:return "3 movimentos; contexto suficiente; aplicações desenvolvidas."
 if m<=50:return "3–4 movimentos; exposição ampliada; aplicações variadas."
 return "4–5 movimentos; exposição profunda; sínteses; aplicações variadas; clímax progressivo."
def build_plan(mode,text,duration=40,intensity=3):
 return ThinkPlan(mode,text,duration,intensity,[{"id":a,"label":b,"status":"required"} for a,b in STAGES],time_profile(duration))
