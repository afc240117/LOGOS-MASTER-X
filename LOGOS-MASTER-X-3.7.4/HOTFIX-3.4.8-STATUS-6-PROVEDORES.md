# LOGOS MASTER X — HOTFIX 3.4.8

Correção do AI HUB local:

- ao abrir o LOGOS em `127.0.0.1` ou `localhost`, o frontend passa a consultar sempre o backend local para `/api/health`;
- evita que uma URL antiga do Render salva no navegador esconda as chaves do `.env` local;
- os testes dos provedores, quando em uso local, também são enviados ao backend local;
- preserva o 9Router, o Studio e o Quality Gate independente já existentes;
- não contém `.env` nem chaves de API.

Após extrair sobre a pasta principal, reinicie o Uvicorn e use `Ctrl+F5` no navegador.
