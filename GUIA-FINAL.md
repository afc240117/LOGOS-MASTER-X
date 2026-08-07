# GUIA FINAL — O QUE FAZER

1. Extraia o ZIP.
2. Não junte com versões antigas.
3. Use apenas a pasta `LOGOS-MASTER-X`.
4. Teste no PC com:
   `python -m http.server 8080`
5. Abra:
   `http://127.0.0.1:8080/app/web/static/`
6. Crie no GitHub um repositório `LOGOS-MASTER-X` e envie todo o conteúdo.
7. No Netlify, conecte o repositório. O `netlify.toml` já aponta para a interface.
8. No Render, crie o serviço usando `render.yaml`.
9. Depois informe no menu Configurações do LOGOS a URL HTTPS gerada pelo Render.
10. Para IA dentro do LOGOS, configure no Render `OPENAI_API_KEY` como segredo.
11. Para Bíblia offline, importe uma tradução autorizada em JSON/CSV/TXT.
12. Para Android, use a pasta `mobile/android`.
13. Para Desktop, use `desktop/electron`.

O mesmo projeto serve para local, Web/PWA, backend/API, Android e Desktop.
