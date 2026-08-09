# LOGOS MASTER X 3.4.0 — 9Router

## Alterações
- Mantidos: Gemini, Groq, Hugging Face, OpenAI e OpenRouter.
- Removidos: GitHub Models e Mistral (não configurados).
- Adicionado: 9Router como sexto provedor.
- Endpoint local padrão: `http://127.0.0.1:20128/v1`.
- Modelo padrão 9Router: `oc/deepseek-v4-flash-free`.
- Preparado para futura troca do endpoint local por um 9Router hospedado em cloud/VPS.

## Configuração
Copie `.env.example` para `.env` e preencha `NINEROUTER_API_KEY`.
Enquanto o 9Router estiver no PC, mantenha `NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1`.

Os modelos gratuitos testados foram GLM 5.2 NVIDIA, Nemotron 3 Ultra Free, DeepSeek V4 Flash Free, MiMo V2.5 Free e North Mini Code Free. Para os modelos cujo ID pode variar por catálogo/versão, use no campo Modelo manual o ID exato mostrado no 9Router/OpenCode.
