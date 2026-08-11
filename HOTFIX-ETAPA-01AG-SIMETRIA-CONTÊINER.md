ETAPA 01AG — SIMETRIA DO CONTÊINER

Base: 01AF estável.

Alteração única:
- não altera a imagem;
- não move elementos internos;
- remove o translateX(-10px) herdado da 01AC;
- aplica 8px de respiro real e igual à esquerda/direita da área central;
- impede overflow horizontal da área central;
- mantém width:100%, height:auto e object-fit:contain.

Teste:
1. Substitua os arquivos.
2. Reinicie o servidor.
3. Ctrl+F5.
4. Teste também 90%, 100% e 110% de zoom.
