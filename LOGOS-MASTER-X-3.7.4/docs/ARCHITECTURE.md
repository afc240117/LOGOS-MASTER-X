# Arquitetura LOGOS MASTER 7.0

Frontend/PWA
- app/web/static/index.html
- app/web/static/app.js
- app/web/static/style.css
- manifest.webmanifest
- sw.js

Núcleo
- app/services.py
- app/engine/think.py
- app/dna/k7.py
- app/review/
- app/bible/
- app/rag/
- app/knowledge/

Conhecimento
- knowledge/dna/
- knowledge/themes/
- knowledge/doctrines/
- knowledge/homiletics/
- prompts/

Backend opcional
- app/main.py
- app/api/routes.py

Fluxo
Usuário → módulo → Prompt Mestre/DNA → modo local (ChatGPT) OU backend → revisão/quality gate → resultado.
