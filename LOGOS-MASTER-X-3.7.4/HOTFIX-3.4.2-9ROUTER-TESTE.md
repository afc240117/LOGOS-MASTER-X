# LOGOS MASTER X — HOTFIX 3.4.2

Correção específica do teste local do 9Router.

- O botão Testar do 9Router fica habilitado mesmo antes da chave estar configurada.
- O teste do 9Router usa o backend local do LOGOS (mesma origem do navegador), necessário para alcançar o 9Router em 127.0.0.1:20128.
- Os outros provedores continuam usando a API configurada normalmente.
- Exibe o modelo padrão `oc/deepseek-v4-flash-free` quando o backend remoto ainda não publica o modelo do 9Router.

Após extrair e substituir, reinicie o LOGOS e use Ctrl+F5.
