class SermonEngine:
    def generate(self, plan):
        return {
            "type":"sermon",
            "title":plan["big_idea"],
            "sections":[
                "Título e texto base","Grande ideia","Objetivo","Introdução","Contexto",
                "Exposição","Pontos principais","Aplicações","Clímax","Conclusão","Apelo","Resumo de púlpito"
            ],
            "plan":plan
        }
