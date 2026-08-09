# HOTFIX 3.4.6 — QUALITY GATE INDEPENDENTE

- Mantém Studio + AI HUB + 9Router funcionando.
- Após a geração, executa uma SEGUNDA chamada de IA, separada, apenas para revisão.
- O revisor não escreve o material e não pode simplesmente aceitar a nota do gerador.
- Nota em cinco critérios de 0–20: fidelidade textual, contexto/interpretação, aplicações, estrutura e prudência.
- Observações classificadas como TEXTO_BIBLICO, INTERPRETACAO, APLICACAO_HOMILETICA ou VERIFICAR.
- A nota final combina 80% da revisão independente com 20% do gate estrutural local.
- Se a segunda chamada falhar, o LOGOS não perde a geração: usa o gate local como fallback e informa a origem.
- A revisão adicional pode aumentar o tempo total de processamento, especialmente em modelos gratuitos.
