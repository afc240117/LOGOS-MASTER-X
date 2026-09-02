# Bíblia local

Este pacote não redistribui uma tradução bíblica completa protegida por direitos autorais.

O LOGOS MASTER X aceita importação local em JSON/CSV/TXT.

JSON recomendado:
[
  {"book":"João","chapter":3,"verse":16,"text":"..."}
]

CSV:
book,chapter,verse,text

TXT:
João 3:16 texto do versículo

Depois da importação, o navegador armazena os versículos em IndexedDB e ativa:
- navegação por referência;
- pesquisa;
- concordância;
- envio ao Studio/Sermão/Estudo/EBD.
