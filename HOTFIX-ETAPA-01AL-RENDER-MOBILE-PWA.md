# LOGOS MASTER X 3.7.6 — ETAPA 01AL

Pacote consolidado com:

- Home mobile 01AK preservada.
- Páginas internas com respiro lateral consistente no celular.
- Update Center apontando para o Render (não mais Netlify).
- Verificação da versão publicada em `/static/version.json`.
- Publicação local → GitHub → Render com verificação automática do deploy.
- Splash/loading mobile integrado à abertura do aplicativo.
- Quatro ícones PWA selecionados: DNA + Bíblia, Púlpito, K7 e LOGOS X.
- Service Worker reativado em modo network-first para PWA sem manter CSS antigo.
- Cache-busting do CSS/JS na build 376.

## Observação sobre o ícone PWA
O ícone escolhido em Aparência é gravado para a próxima instalação. Em atalhos já instalados, o Android pode manter o ícone anterior; nesse caso remova o atalho/app e instale novamente.
