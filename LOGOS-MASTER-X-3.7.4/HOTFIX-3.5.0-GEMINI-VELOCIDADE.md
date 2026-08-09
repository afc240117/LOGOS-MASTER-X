# LOGOS MASTER X 3.5.0 — Gemini + Perfis de Velocidade

- Gemini passa a ser o padrão inicial do Studio/AI HUB após a atualização.
- Novo modo `rapido`: Gemini → Groq → OpenRouter → OpenAI → Hugging Face → 9Router.
- `automatico`: prioriza Gemini com fallback pelos demais provedores.
- `economico`: mantém 9Router em primeiro para priorizar custo zero.
- `qualidade`: prioriza Gemini; o Quality Gate independente continua usando outro provedor.
- Nenhum perfil reduz `max_tokens`, duração, estrutura ou tamanho solicitado do estudo/sermão.
- O perfil é migrado uma única vez para Gemini + Rápido; depois o usuário pode trocar normalmente.
