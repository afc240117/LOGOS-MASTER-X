# PWA INSTALÁVEL — ANDROID

## Teste no próprio Android com Termux

1. No Termux, entre na pasta do projeto.
2. Execute:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. No Chrome do mesmo celular, abra:

`http://127.0.0.1:8000`

4. Toque no menu `⋮`.
5. Escolha `Instalar aplicativo` ou `Adicionar à tela inicial`.
6. O ícone `LOGOS` aparecerá na tela inicial.

## Observação

Para uso permanente e instalação mais confiável em outros aparelhos, publique o projeto em HTTPS.
A PWA já contém:
- Manifest
- Ícones 192x192 e 512x512
- Service Worker
- Cache
- Página offline
