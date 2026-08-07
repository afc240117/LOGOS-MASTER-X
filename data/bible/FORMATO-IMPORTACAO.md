# Formato de importação da Bíblia

O LOGOS MASTER X não inclui uma tradução bíblica completa nesta etapa por questão de licença/distribuição.

Você pode importar uma tradução que possua e tenha permissão para usar.

## JSON
```json
[
  {"book":"João","chapter":3,"verse":16,"text":"..."},
  {"book":"João","chapter":3,"verse":17,"text":"..."}
]
```

Também aceita chaves em português:
`livro`, `capitulo`, `versiculo`, `texto`.

## CSV
Cabeçalho:
`book,chapter,verse,text`

ou:
`livro,capitulo,versiculo,texto`

## TXT
Uma linha por versículo:
`João 3:16 texto do versículo`

Após importar:
- Bíblia → navegação e referência;
- Pesquisa Bíblica → busca textual;
- Concordância → índice local;
- Referências Cruzadas → banco local;
- Sermão/Estudo/EBD/Studio → recebem a passagem selecionada.
