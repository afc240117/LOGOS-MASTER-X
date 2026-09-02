# LOGOS MASTER X — HOTFIX v5.4.3.2

## Áudio X Cloud Upload Alias

Corrige definitivamente o erro:

`POST /api/audio-x/cloud/upload 404 Not Found`

A correção cria um endpoint de compatibilidade no backend:

`/api/audio-x/cloud/upload`

que chama internamente o endpoint oficial:

`/api/audio-x/upload`

Também atualiza arquivos estáticos que ainda apontem para a rota antiga, sem mexer no Atlas X, Bíblia X, Studio X, DNA K7 ou Raio X.

## Resultado esperado

Depois da aplicação, o log não deve mais mostrar 404 nesta rota. Se ainda houver problema de configuração de provider, o erro passa a ser 503 ou mensagem específica, não 404.
