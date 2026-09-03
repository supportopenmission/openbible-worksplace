# Backlog: Desativar zoom no PWA e drawer 90%

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0011 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Experiência PWA |
| Funcionalidade | Comportamento de app nativo no mobile |
| Tipo | melhoria |
| Prioridade | Alta |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/defined/0011-desativar-zoom-no-pwa-e-drawer-90/spec.md |

## Ideia original

remova o zoom (ou desative no pwa - mobile, e ao abrir um modal ele da um zoom no iphone. ajuste os drawer para preencher 90% da tela de acordo com o shadui

## Problema percebido

PWA mobile permite zoom, iPhone aplica zoom automático ao abrir modal/focar campo e drawers não ocupam 90% da tela

## Pessoa afetada ou beneficiada

Pessoa que usa o OpenBible como PWA no iPhone/mobile

## Resultado ou valor esperado

App sem zoom indesejado e drawers padronizados em 90%

## Contexto

Shell SvelteKit standalone com viewport-fit=cover, Sheets shadcn-svelte locais e inputs com fonte 0.875rem

## Referências relacionadas

- `specs/inbox/2026-09-03-203625-desativar-zoom-no-pwa-e-drawer-90.md` — captura original.
- `specs/completed/0010-melhorar-experiencia-do-pwa/spec.md` — base PWA (standalone, safe-area, versão).
- `apps/web/src/app.html` — viewport atual sem trava.
- `apps/web/src/app.css` — fonte base 0.875rem (dispara zoom do iOS no foco).
- `apps/web/src/lib/components/ui/sheet/sheet-content.svelte` — bottom com `h-auto`.

## Comportamento esperado

- Viewport trava zoom como app nativo (`maximum-scale=1.0, user-scalable=no`).
- Inputs, selects e textareas com mínimo 16px para o iOS não aplicar zoom ao focar/abrir modal.
- Todos os Sheets `side=bottom` ocupam 90% da altura da tela (`90dvh`) com safe-area.

## Regras de negócio

- Trava total de zoom é decisão explícita para simular app nativo (conversa atual, 2026-09-03).
- Sem backend; só CSS, viewport e componente Sheet.

## Critérios de aceitação

- Given PWA no mobile, When tenta pinch ou duplo toque, Then a página não aplica zoom.
- Given campo com foco (inclusive em modal), When iOS avalia, Then nenhum zoom automático acontece.
- Given qualquer drawer bottom aberto, When mede, Then ocupa 90% da altura.

## Qualidades e operação

- Segurança: sem impacto. Privacidade: sem impacto.
- Acessibilidade: trava de zoom reduz ampliação manual — decisão consciente pró app nativo.
- Desempenho: sem regressão.

## Dependências

- Nenhuma.

## Situações de erro

- Navegador que ignora `user-scalable=no` → inputs 16px ainda evitam o zoom de foco.

## Escopo

- Dentro: viewport, fonte mínima de campos, Sheet bottom 90%.
- Fora: sheets laterais, sincronização, push.

## Dúvidas, decisões e riscos

- DEC-001 (2026-09-03): simular app nativo com trava total de zoom + input 16px.
- DEC-002: todos os bottom sheets em 90% da altura.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Brief pronto para `$specsfy-03-specify`.
