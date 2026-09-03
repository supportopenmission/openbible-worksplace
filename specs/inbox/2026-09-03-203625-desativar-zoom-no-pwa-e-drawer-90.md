# Inbox: Desativar zoom no PWA e drawer 90%

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T23:36:25Z |
| Slug | desativar-zoom-no-pwa-e-drawer-90 |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `98555396b04fd09d1f84afef20ab1e5119bb49979d8f7485d1b08fa77bb00cb1` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

remova o zoom (ou desative no pwa - mobile, e ao abrir um modal ele da um zoom no iphone. ajuste os drawer para preencher 90% da tela de acordo com o shadui

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Desativar zoom no PWA mobile, corrigir zoom automático do iOS ao abrir modal/focar campo e ajustar drawers para 90% da tela no padrão shadcn.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** No PWA mobile o usuário consegue dar zoom, ao abrir modal o iPhone aplica zoom automático e os drawers não ocupam 90% da tela.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoas que usam o OpenBible como PWA no iPhone/mobile.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Experiência de app nativo sem zoom indesejado e drawers padronizados.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** desativar zoom no PWA mobile; zoom ao abrir modal no iPhone; drawer com 90% da tela seguindo shadcn

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Não identificado no texto original.

### Riscos e dependências

**Análise preliminar:** Bloquear zoom reduz acessibilidade (WCAG); zoom do iOS em foco de input some com fonte >=16px.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Refinar em backlog mobile e especificar viewport, inputs e Sheet.

## Pontos a revisar no futuro

**A revisar:** Confirmar escopo dos drawers (todos ou específicos); confirmar bloqueio total vs só foco de input.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
