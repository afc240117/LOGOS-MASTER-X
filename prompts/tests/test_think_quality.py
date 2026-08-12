from app.think.engine import build_plan
from app.quality.gate import evaluate
def test_think():assert len(build_plan("SERMÃO","Isaías 6",40,3).stages)==14
def test_quality():assert evaluate("Grande ideia. Contexto. Aplicação. Conclusão. Apelo. "+"x"*400,"SERMÃO")["passed"]
