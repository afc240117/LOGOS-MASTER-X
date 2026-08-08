# HOTFIX 3.3.1

Corrige o botão Testar do AI HUB.

Causa:
`data-provider-test` vira `dataset.providerTest` no JavaScript.
A versão anterior lia `dataset.provider`, produzindo `undefined`.

Resultado:
cada botão agora envia corretamente gemini, groq, openrouter, huggingface ou openai.
