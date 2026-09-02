# LOGOS MASTER X — HOTFIX v5.4.3.1
## Áudio X — Correção de “Not Found” no upload

## Problema
Na tela Áudio X, ao iniciar a análise do MP3/WAV/M4A, o processamento parava em **FALHA — Not Found**.

## Causa corrigida
O frontend do Áudio X estava chamando:

`/api/audio-x/cloud/upload`

mas o backend existente expõe o upload em:

`/api/audio-x/upload`

## Correção
Este hotfix faz uma alteração mínima e reversível em:

`app/web/static/audio_x/audio-x-etapa-15.js`

E atualiza o cache do script em:

`app/web/static/audio_x/audio-x-etapa-15.html`

## Segurança
O instalador cria backup automático antes de alterar arquivos.

## Depois de aplicar
1. Reinicie o servidor do LOGOS.
2. Abra o navegador.
3. Pressione **Ctrl+F5**.
4. Abra **Áudio X** e teste novamente.
