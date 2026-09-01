# Inbox: Sermões e notas em Markdown com YAML e lixeira

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-01T21:15:29Z |
| Slug | sermoes-e-notas-em-markdown-com-yaml-e-lixeira |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Análise de persistência File Over Apps. |
| Turno da conversa | Pedido para atacar as prioridades sugeridas. |
| Integridade do original | SHA-256 `decec519d456b117ea16565ab69f8b4aeb952043e8977a9b6fd38c5d6e81f8b9` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Spec de sermões/notas em Markdown+YAML, com lixeira de verdade. Os dados serão salvos em sqlite e arquivos json e markdown com yaml para params. File Over Apps: Markdown é fonte primária de sermões, estudos e notas; a pasta trash já é criada no onboarding e nunca é usada.

## Contexto consultado

PROJECT.md; .specsfy/DATABASE.md; specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md; conversa atual.

## Resumo processado

**Inferência:** Criar a fatia normativa para escrever sermões e notas como Markdown com YAML frontmatter no workspace, incluindo mover para trash em vez de apagar em silêncio.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Sermões, estudos e notas só existem como pastas e templates; ainda não há spec nem escrita de domínio, e a pasta trash não é usada.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual que elabora sermões e notas no próprio workspace.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** A pessoa cria, edita e descarta sermões e notas em arquivos que ela controla, sem perder o conteúdo numa exclusão irreversível.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Markdown com YAML frontmatter; File Over Apps; pasta trash já criada; SQLite só como índice auxiliar.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Título, datas, tipo, corpo Markdown, caminho do arquivo, estado na lixeira.

### Riscos e dependências

**Análise preliminar:** Não implementar o editor nesta captura; a spec 0001 deixou reconfiguração e schema de índice fora de escopo.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Promover a backlog e spec de sermões/notas com CRUD em arquivos, lixeira e índice SQLite auxiliar.

## Pontos a revisar no futuro

**A revisar:** Definir campos YAML, fluxo da lixeira, relação com o construtor de sermões e se estudos entram na mesma fatia.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
