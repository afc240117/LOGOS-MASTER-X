# ETAPA 01F — Ícones laterais persistentes

Correção específica para o efeito "pisca e volta aos ícones antigos".

Causa: o HTML carregava os SVGs dourados corretos, mas `app.js` executava `updateNavIcons()` logo depois e substituía os SVGs por emojis/ícones clássicos antigos.

Correção:
- no tema clássico, `app.js` preserva os SVGs já definidos no HTML;
- no tema moderno, a rotina dinâmica continua disponível para etapa futura;
- nenhum destino ou função foi alterado;
- cache-bust do JS alterado para `classic1f`.
