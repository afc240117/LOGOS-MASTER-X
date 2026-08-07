class DNAK7Engine:
    PROFILE = {
        "name":"DNA Pentecostal K7",
        "base_reference":"Lamentações 5:21-22",
        "progression":["abertura","contexto","exposição","aplicação","intensificação","clímax","convite"],
        "marks":[
            "fidelidade bíblica",
            "imagética verbal responsável",
            "repetição estratégica",
            "chamadas congregacionais",
            "ênfase em restauração quando textual",
            "apelo inteligível"
        ],
        "restrictions":["sem glossolalia","sem imitação vocal","sem referências inventadas"]
    }
    def apply(self, plan: dict):
        plan["dna_k7"]=self.PROFILE.copy()
        return plan
