# HOTFIX ETAPA 01A — Inicialização da interface

Corrige o erro `NotFoundError: insertBefore` causado pelo status estar dentro de `.top-actions`, e não como filho direto de `.top`.

- Inserção segura dos controles no topo.
- Mantém Update Center, Sobre, Instalar e Aparência.
- Cache-bust de `app.js` para `classic1a`.
- Não altera Studio, IA, prompts ou demais funções.
