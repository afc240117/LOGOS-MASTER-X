# LOGOS MASTER X 3.4.9 — Quality Gate Multiprovedor

- A geração continua usando o roteamento/provedor escolhido no Studio.
- O Quality Gate não repete o provedor que gerou o material.
- Prioridade de revisão: Gemini → Groq → OpenAI → OpenRouter → Hugging Face → 9Router.
- Se um revisor falhar, tenta automaticamente o próximo configurado.
- Se todos falharem, preserva o material e usa o gate local.
- O modelo manual da geração não é reaproveitado indevidamente na revisão.
- Nenhum `.env` ou chave está incluído neste hotfix.
