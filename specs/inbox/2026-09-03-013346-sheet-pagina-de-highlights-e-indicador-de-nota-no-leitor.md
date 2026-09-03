# Inbox: Sheet, página de highlights e indicador de nota no leitor

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T04:33:46Z |
| Slug | sheet-pagina-de-highlights-e-indicador-de-nota-no-leitor |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Pedido explícito de trabalhar agora nos acréscimos ao leitor /bible após SPEC-0005 completed. |
| Turno da conversa | Captura imediata do texto original; transição automática pedida para backlog. |
| Integridade do original | SHA-256 `79dba2dcee0aab0e212f495008e4c2239eea6dc34dd39e2b94341fe2b84b6c5d` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

E sheet para mostrar todos os highlighs, e uma pagina que mostre eles tbm. E quando houver uma nota precisa ter um indicativo no texto bilico na pagina do leitor

## Contexto consultado

Conversa atual; specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md; .specsfy/DATABASE.md; INTERFACE.md; USER-PROFILE.md. MCP ai-memory indisponível (servidor 127.0.0.1:49375 sem conexão).

## Resumo processado

**Inferência:** Depois da seleção e dos destaques do leitor, a pessoa quer um sheet e uma página que mostrem os highlights, e um indicativo no texto bíblico do leitor quando existir nota naquele trecho.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Os highlights persistidos e as notas criadas a partir do leitor não têm uma lista consultável nem um sinal visível no texto bíblico quando há nota no trecho.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Não identificado no texto original.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Ver todos os highlights em um sheet e também em uma página; perceber no texto bíblico do leitor quando houver nota.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Sheet para mostrar todos os highlights; uma página que também os mostre; indicativo no texto bíblico na página do leitor quando houver nota. O 'E' do pedido continua a SPEC-0005 recém completed.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Highlights já persistidos; existência de nota associada a trecho bíblico no leitor. Sem schema novo declarado no texto.

### Riscos e dependências

**Análise preliminar:** SPEC-0005 DEC-002: destacar não cria nota e nota não aplica highlight, sem vínculo persistente. Sheet shadcn-svelte já existe no BibleReader. Bugs de seleção múltipla e underline/wavy em paralelo não entram nesta fatia. Indicador de nota pode coexistir com highlight sem reabrir vínculo persistente.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Refinar em backlog a lista de highlights (sheet + página) e o indicativo de nota no reader; só specify quando o brief estiver testável.

## Pontos a revisar no futuro

**A revisar:** Escopo da lista: capítulo aberto vs versão vs todos os destaques do workspace. Sheet vs página: rota nova, aba/seção, e de onde o sheet abre. Indicador de nota vs DEC-002: descoberta via note_verse_ref / :::verse, forma visual, coexistência com highlight. Clique no indicador: abre nota em split/abas ou só sinaliza. Não misturar bugs de seleção/underline desta sessão.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
