# Inbox: Motor de notas com Milkdown, markdown e bloco de versículo

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-04T06:29:31Z |
| Slug | motor-de-notas-com-milkdown-markdown-e-bloco-de-versiculo |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `1ba37028bd23a91aad4e19f0a09792dc1eea3b28f0d6d34feb54607972731d5e` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

bom vamos trabalhar uma feature complexa agora, precisamos mudar o motor das notas, iremos usar agora https://milkdown.dev/docs/guide/getting-started, pois se encaixa melhor no modelo Files over app. A ideia é que usaremos o markdown files nele, o bloco de versiculo será usado um fense no markdown. Teremos o /slash commands no desktop, no mobile ao digitar / abre um drawer com os commands, add um toolbar no mobile com os principais atalhos de formatacao, ficando em cima da barra de navegacao. Propriedades ficam em yaml no arquivo markdown. e A ideia é manter esse padrao de tela full canva sem bordas envolta do editor.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Trocar o motor das notas para Milkdown com arquivos Markdown, fence de versículo, slash commands e YAML.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Motor atual das notas não se encaixa bem no modelo Files over app

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual que cria e consulta notas bíblicas

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Notas como arquivos Markdown legíveis com versículos, propriedades e edição full canvas

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Milkdown (https://milkdown.dev/docs/guide/getting-started); Markdown files; bloco de versículo como fence; slash commands no desktop; mobile: digitar / abre drawer; toolbar mobile com atalhos de formatação acima da barra de navegação; propriedades em YAML; tela full canvas sem bordas

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Conteúdo Markdown da nota, propriedades YAML, blocos de versículo com referência e snapshot

### Riscos e dependências

**Análise preliminar:** Migração do motor atual (Tipex/TipTap) para Milkdown; paridade de fences :::verse e índice auxiliar; comportamento distinto desktop/mobile

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Backlog de migração do editor de notas para Milkdown com fence de versículo, slash e toolbar mobile

## Pontos a revisar no futuro

**A revisar:** Confirmar sintaxe exata do fence de versículo; lista de slash commands e atalhos da toolbar; formato do YAML; regras do full canvas; migração de notas existentes

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
