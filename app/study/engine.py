class StudyEngine:
    def generate(self, plan):
        return {
            "type":"study",
            "title":plan["big_idea"],
            "sections":[
                "Objetivo","Texto base","Contexto","Estrutura","Explicação",
                "Referências cruzadas","Doutrinas relacionadas","Aplicações","Perguntas","Conclusão"
            ],
            "plan":plan
        }
