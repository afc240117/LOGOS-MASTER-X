class LogosService:
    def system_instructions(self):
        return 'Você é o motor do LOGOS MASTER 7.1. Responda em português. Seja fiel ao contexto bíblico, não invente referências, use linguagem inteligível, sem glossolalia e sem imitar identidade vocal.'
    def build_prompt(self,mode,text,theme=None):
        return f"LOGOS MASTER 7.1\nModo: {mode}\nTema: {text}\nObservações: {theme or 'Nenhuma'}\nFidelidade bíblica; contexto; exposição; aplicação; conclusão. Para sermão/esboço/DNA: abertura → contexto → exposição → aplicação → intensificação → clímax → convite."
    def generate(self,mode,text,theme=None):
        return {'mode':mode,'text':text,'theme':theme,'status':'PASS','structure':self.local_structure(mode)}
    def local_structure(self,mode):
        if mode in ('sermon','outline','dna'): return ['Abertura','Contexto','Exposição','Aplicação','Intensificação','Clímax','Convite']
        if mode=='ebd': return ['Texto áureo','Verdade prática','Objetivos','Introdução','3 tópicos','Aplicações','Revisão','Conclusão']
        if mode=='bible': return ['Contexto','Explicação','Referências cruzadas','Interpretações','Aplicações','Cuidados']
        return ['Objetivo','Contexto','Estrutura','Explicação','Referências','Aplicações','Conclusão']
    def local_render(self,mode,text,theme=None):
        st=' → '.join(self.local_structure(mode))
        return f"LOGOS MASTER 7.1 — MODO LOCAL\nModo: {mode}\nTema: {text}\nObservações: {theme or 'Nenhuma'}\n\nEstrutura funcional: {st}\n\nPara texto completo por IA, configure OPENAI_API_KEY no servidor ou use o botão Abrir no ChatGPT no aplicativo."
