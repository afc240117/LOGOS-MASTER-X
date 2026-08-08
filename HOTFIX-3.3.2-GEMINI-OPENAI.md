# HOTFIX 3.3.2

## Gemini
Modelo padrão atualizado:
`gemini-3.6-flash`

No Render, altere:
`GEMINI_MODEL=gemini-3.6-flash`

## OpenAI
- Mantém `gpt-5-mini`.
- Provider test passa a permitir 800 tokens.
- Extração de texto da Responses API ficou mais robusta.
- Erro agora mostra status/incomplete_details se não houver texto final.
