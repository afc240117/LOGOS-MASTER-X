# LOGOS MASTER X 3.6.6 — PWA Auto Update

- Corrige os caminhos `/static/*` no Netlify por redirect para os arquivos publicados na raiz.
- Desativa cache persistente do shell principal no Netlify.
- Limpa service workers/caches antigos ao iniciar.
- Adiciona `version.json` e aviso de nova versão com botão **Atualizar agora**.
- Atualiza os identificadores de assets para `v=366`.
- Mantém o funcionamento local FastAPI em `/static/*`.
