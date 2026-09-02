# Inbox: Notas canvas estilo Notion com bloco de versículo

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-02T00:18:57Z |
| Slug | notas-canvas-estilo-notion-com-bloco-de-versiculo |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Pedido explícito de specsfy-planner para capturar Inbox e continuar o fluxo. |
| Turno da conversa | Pedido original do usuário sobre notas canvas estilo Notion com bloco de versículo. |
| Integridade do original | SHA-256 `6c25e17b4956e96a41676577c628df7d7c394c120fad440676f82c2000dbde72` |
| Backlog derivado | `specs/backlog/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` |
| Spec derivada | Nenhuma |

## Texto original

funcionalidade de notas like notion app. A ideia é ser um app full canva ou seja nao é para ter um borda e dentro o editor, podemos usar o https://tipex.pages.dev/. Verificar como salvar em markdown, a ideia é que tenhamos um bloco chamado versiculo ou texto biblico, na qual vai abrir um modal/drawer para selecionar o versiculo e a versao deve mostrar a preview do versiculo (criar algo bem bonito) talvez um callout. Ver como podemos criar as relacoes com os textos biblicos.

## Contexto consultado

Pedido original do usuário; specs/inbox/2026-09-01-181529-sermoes-e-notas-em-markdown-com-yaml-e-lixeira.md (não alterada); PROJECT.md; .specsfy/USER-PROFILE.md.

## Resumo processado

**Inferência:** Editor de notas em canvas full-bleed, estilo Notion, usando Tipex, com persistência em Markdown e um bloco de versículo ou texto bíblico.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** A pessoa precisa escrever notas como um app canvas, sem moldura em volta do editor, com bloco de versículo/texto bíblico, preview bonita e relações com os textos bíblicos.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Não identificado no texto original.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Notas em canvas contínuo, salvas em Markdown, com bloco de versículo selecionável e preview editorial.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** App de notas like Notion; full canvas sem borda em volta do editor; https://tipex.pages.dev/; salvar em Markdown; bloco versículo ou texto bíblico; modal/drawer para selecionar versículo e versão; preview do versículo, talvez callout; relações com textos bíblicos.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Conteúdo da nota em Markdown; referência de versículo e versão; preview do texto bíblico; relações nota↔textos bíblicos.

### Riscos e dependências

**Análise preliminar:** Tipex não serializa Markdown nativamente; captura irmã já cobre persistência File Over Apps, YAML e lixeira; construtor de sermões não deve misturar-se a esta ideia sem recorte.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Promover a backlog/spec do editor de notas canvas com nó de versículo; persistência Markdown+YAML reusa a captura de sermões e notas; relações File Over Apps com índice SQLite auxiliar.

## Pontos a revisar no futuro

**A revisar:** Escopo da fatia (só editor vs CRUD/lixeira); rota /notes vs /sermons; formato Markdown do bloco; snapshot vs lookup ao vivo; drawer vs dialog; slash-command vs botão; título H1 no canvas vs só YAML.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
