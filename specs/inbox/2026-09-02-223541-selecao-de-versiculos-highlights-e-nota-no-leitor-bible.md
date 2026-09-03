# Inbox: Seleção de versículos, highlights e nota no leitor /bible

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T01:35:41Z |
| Slug | selecao-de-versiculos-highlights-e-nota-no-leitor-bible |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Pedido explícito de trabalhar agora na feature do leitor /bible. |
| Turno da conversa | Captura imediata do texto original; duas imagens de referência do Logos anexadas. |
| Integridade do original | SHA-256 `17b679347c971de439e1acedf883f98308fa815fdefdda490eac46ce9bfe47c2` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

quero trabalhar em feature na biblia (/bible):
- Funcionalidade de Selecionar versiculos um ou mais ao selecionar teremos a possibilidade de highlights, copiar (referencia e/ou texto + referencia), criar nota com o texto selecionado (ao criar a nota vai abrir a tela da biblai vai ficar com split view no desktop e com abas no mobile, de um lado a view do reader da biblia, de outro lado a pagina de criação da nota.
- O highlight deve funcionar semelhando ao highlighs do app da biblia logos com diversas opções de highlights veja a imagem. só que a ideia é ter um popover com as opcoes e a ideia é ter alem das cores opcoes de highligts com riscos e etc.

## Contexto consultado

Input do usuário; duas capturas do Logos Bible Software (painel Highlighting e leitor João 15); setup Specsfy CURRENT; MCP ai-memory indisponível.

## Resumo processado

**Inferência:** Na rota /bible, selecionar um ou mais versículos deve abrir ações de highlight, copiar referência e/ou texto+referência, e criar nota sem sair do reader: split view no desktop e abas no mobile, com paleta de destaques inspirada no Logos via popover.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** O leitor /bible ainda não permite selecionar versículos para destacar, copiar ou criar nota sem abandonar a leitura.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual que lê a Bíblia e elabora os próprios estudos e notas.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Destacar, copiar e anotar o texto selecionado sem perder o reader: nota ao lado no desktop e em aba no mobile.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Rota /bible; seleção de um ou mais versículos; ações highlight, copiar (referência e/ou texto + referência) e criar nota com o texto selecionado; split view desktop e abas mobile (reader de um lado, criação da nota do outro); highlight semelhante ao Logos com cores e riscos; popover com as opções; imagens de referência do Logos anexadas.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Destaques aplicados ao texto bíblico, versículos selecionados, texto e referência da seleção, estilo visual do highlight, e a nota criada a partir da seleção. O perfil do projeto já prevê SQLite local para índices e destaques.

### Riscos e dependências

**Análise preliminar:** Confundir highlight do leitor com highlight TipTap do canvas de notas (spec 0004); working tree sujo em BibleReader e notas; persistência de destaques ainda sem schema de domínio; onboarding 0001 em andamento; File Over Apps sem backend.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Refinar em backlog a seleção de versículos com popover de ações; especificar markup persistente do reader separado do canvas; reutilizar criação de nota e bloco :::verse.

## Pontos a revisar no futuro

**A revisar:** Granularidade da seleção (versículo inteiro vs palavra/trecho); paleta mínima de estilos nesta fatia; persistência (SQLite vs arquivo); sobreposição de highlights; relação highlight com nota; apagar ou alterar highlight; formato exato do copiar; criar nota nova vs reutilizar existente.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
