class ThinkEngine:
    def analyze(self, text: str, theme: str | None = None):
        idea = theme or text
        return {
            "big_idea": idea,
            "structure":[
                "O que o texto diz",
                "O que o texto significa no contexto",
                "Como essa verdade alcança o ouvinte",
                "Resposta prática e pastoral"
            ],
            "quality_rules":[
                "não inventar referências",
                "aplicação derivada do texto",
                "distinguir certeza de inferência",
                "linguagem inteligível"
            ]
        }
