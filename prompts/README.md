# LOGOS MASTER X

Projeto único e oficial.

## Dois modos no mesmo aplicativo

### LOCAL / OFFLINE
Funciona sem backend para:
- LOGOS Studio e comandos;
- estruturação local de sermão/estudo/EBD/esboço;
- Prompt Mestre e DNA K7;
- Laboratório K7;
- Bíblia importada localmente;
- pesquisa e concordância local;
- Editor;
- Biblioteca;
- Projetos;
- Modo Púlpito;
- Backup;
- exportação TXT/Markdown/Word-compatible (.doc);
- impressão / salvar em PDF pelo navegador.

### ONLINE / API
Quando uma URL de backend é configurada:
- testa `/api/health`;
- usa `/api/generate-ai` quando a IA estiver configurada;
- backend pode ser hospedado no Render;
- chave de IA permanece somente no servidor.

## O que NÃO está embutido
- uma tradução bíblica completa protegida por direitos autorais;
- um modelo generativo completo para rodar dentro de HTML offline.

A Bíblia pode ser importada pelo usuário em JSON/CSV/TXT.
A IA pode ser usada via backend/API ou abrindo o ChatGPT com o Prompt Mestre.

## Web local
Na raiz:
`python -m http.server 8080`
Abra:
`http://127.0.0.1:8080/app/web/static/`

## Backend
`pip install -r requirements.txt`
`uvicorn app.main:app --host 0.0.0.0 --port 8000`

## GitHub
Suba o projeto inteiro, exceto arquivos ignorados pelo `.gitignore`.

## Netlify
Base no repositório. `netlify.toml` publica `app/web/static`.

## Render
Use `render.yaml` para o backend.

## Android
`cd mobile/android`
`npm install`
`npx cap add android` (somente na primeira vez)
`npx cap sync android`
`npx cap open android`

## Desktop
`cd desktop/electron`
`npm install`
`npm start`
