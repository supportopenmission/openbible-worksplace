# Backlog: Repensar a página inicial como entrada operacional

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0012 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Entrada e navegação do produto |
| Funcionalidade | Página inicial operacional |
| Tipo | Funcionalidade de interface |
| Prioridade | P1 |
| Milestones | |
| Criado em | 2026-09-04 |
| Spec promovida | `specs/draft/0012-pagina-inicial-operacional-do-openbible/spec.md` |

## Ideia original

Repense a pagina Inicial

## Problema percebido

A página inicial atual atua apenas como seletor/redirecionamento sem continuidade do trabalho da pessoa.

## Pessoa afetada ou beneficiada

Pessoa usuária individual que lê a Bíblia, estuda e prepara sermões e notas. Uso local sem conta.

## Resultado ou valor esperado

Entrada que orienta o próximo passo e retoma o trabalho em andamento: continuar leitura, ações rápidas e recentes reais.

## Contexto

Rota `/` sobre onboarding existente; `InitialScreenPicker` com Bíblia/sermões/estudo (em breve); preferência `initialRoute` com redirecionamento; módulos `/bible`, `/sermons`, `/study`, `/notes`, `/highlights`, `/config`; continuidade via `readerSelection`, notas recentes e destaques. Descoberta com 8 perguntas concluída em 2026-09-04; decisões abaixo autorizadas pela pessoa usuária.

## Referências relacionadas

- `specs/inbox/2026-09-04-022722-repensar-a-pagina-inicial.md` — origem da ideia.
- `specs/backlog/0002-tela-inicial-navegacao.md` — backlog relacionado; define o seletor atual, não é duplicata.
- `specs/completed/0002-tela-inicial-navegacao/spec.md` — spec relacionada; limita redirect por `initialRoute` e Sidebar condicional (será substituída no comportamento).
- `PROJECT.md` — documentação relacionada; finalidade e uso individual.
- `INTERFACE.md` e `DESIGNSYSTEM.MD` — documentação relacionada; stack Svelte, shell, PageHeader e padrões de estados.
- `.specsfy/DATABASE.md` — dado relacionado; `readerSelection`, notas Markdown, `reader_highlight`, `preferences.json`.
- `apps/web/src/routes/+page.svelte` — implementação atual da `/` (onboarding, redirect, seletor).
- `apps/web/src/lib/features/navigation/InitialScreenPicker.svelte` — composição atual a substituir na `/`.
- `apps/web/src/lib/navigation/home-preference.ts` — preferência a remover.

## Comportamento esperado

1. Com workspace pronto, `/` não redireciona e exibe a home operacional com `PageHeader`, seção Continuar leitura, ações rápidas (Ler a Bíblia, Nova nota, Novo sermão) e recentes reais (notas, destaques).
2. Continuar leitura usa `readerSelection` de `.openbible/preferences.json` (cache `localStorage`) com fallback para o último destaque; sem seleção mostra CTA Abrir a Bíblia.
3. Recentes mostram somente dados reais; Sermões/Estudos aparecem só como atalhos até os módulos existirem.
4. Sem workspace configurado, `/` mantém o onboarding atual; a home só aparece após o workspace pronto. Sem Bíblia, Continuar/recentes caem em vazio orientado.
5. Shell persistente (Sidebar desktop + barra mobile) sempre visível após workspace pronto, com Início (`/`) como primeiro item.
6. Preferência `initialRoute`, redirecionamento automático e seção Tela inicial em `/config` são removidos; valor salvo passa a ser tratado como ausente.
7. Composição responsiva com `PageHeader`, Continuar, grade de ações e listas recentes empilhadas no mobile; loading com skeleton, vazio com orientação, erro com retry e navegação por teclado.

## Regras de negócio

- Uso individual local, sem autenticação; nenhum dado sai do dispositivo por causa da home.
- `/` é home operacional, não seletor; `InitialScreenPicker` deixa de ser usado na `/` (pode permanecer em `/config` apenas até a remoção da seção, a definir na spec).
- `/study` segue em breve; a home não simula capacidade pronta.
- Migração: `initialRoute` existente é ignorada/tratada como ausente após a mudança.

## Critérios de aceitação

- **AC-001:** Dado workspace pronto, quando a pessoa abre `/`, então vê a home operacional sem redirecionamento automático.
- **AC-002:** Dado que existe `readerSelection` ou destaque, quando a pessoa usa Continuar leitura, então abre a passagem correspondente em `/bible`.
- **AC-003:** Dado que não há seleção nem destaque, quando a pessoa vê Continuar, então recebe CTA para abrir a Bíblia.
- **AC-004:** Dado workspace pronto, quando a pessoa usa ações rápidas, então navega para Ler (`/bible`), Nova nota (`/notes`) e Novo sermão (`/sermons`).
- **AC-005:** Dado que existem notas/destaques, quando a pessoa abre Recentes, então vê itens reais que levam ao destino; sem dados, vê vazio orientado.
- **AC-006:** Dado workspace ausente, quando a pessoa abre `/`, então passa pelo onboarding antes de ver a home.
- **AC-007:** Dado workspace pronto, quando a pessoa navega, então Sidebar/barra estão visíveis com Início primeiro e rota atual identificada.
- **AC-008:** Dado qualquer valor antigo de `initialRoute`, quando a pessoa abre `/`, então não há redirect e `/config` não oferece Tela inicial.

## Qualidades e operação

- Segurança: sem segredos na home; atalhos respeitam estado local.
- Privacidade: leitura, notas e destaques permanecem locais; nenhum envio remoto.
- Desempenho e volume: decisão de render no cliente; listas recentes limitadas; skeleton sem bloqueio remoto.
- Auditoria e observabilidade: sem conta; falhas de leitura caem em erro recuperável com retry.
- Acessibilidade: foco visível, ordem coerente, `aria-live` em feedback, teclado completo, `prefers-reduced-motion`, claro/escuro, 320px/1440px, zoom sem overflow.

## Dependências

- Onboarding e workspace existentes (`WorkspaceProvider`, `AppFrame`).
- Fontes de continuidade: `readerSelection`, repositório de notas Markdown, `reader_highlight` workspace-wide.
- Shell `AppSidebar` + barra mobile para incluir Início.
- shadcn-svelte e tokens em `app.css`; sem nova biblioteca de UI.

## Situações de erro

- Storage indisponível → erro recuperável com retry, sem quebrar shell.
- `readerSelection` ilegível → tratar como ausente, fallback destaque ou CTA Bíblia.
- Falha ao listar recentes → seção em erro com retry, demais seções preservadas.
- `initialRoute` legada inválida → ignorar e mostrar home.

## Escopo

- Dentro: nova `/` operacional; Continuar leitura; ações rápidas; recentes reais; shell persistente com Início; remoção de `initialRoute`/redirect/seção em `/config`; estados loading/vazio/erro; responsivo e acessível; testes Vitest.
- Fora: construtor de sermões, conteúdo funcional de estudos, autenticação, sincronização/backup, dados remotos, mudança no leitor além de deep-link de Continuar.

## Dúvidas, decisões e riscos

- Decisão (P1): `/` vira home operacional sem redirecionamento automático.
- Decisão (P2): blocos de Continuar + ações rápidas + recentes reais.
- Decisão (P3): manter onboarding antes da home sem workspace.
- Decisão (P4): remover preferência, redirect e seção em `/config`.
- Decisão (P5): shell persistente com Início primeiro.
- Decisão (P6): `PageHeader` + Continuar + ações + recentes, com skeleton/vazio/erro.
- Decisão (P7): recentes só com dados reais; sermões/estudos como atalhos.
- Decisão (P8): Continuar via `readerSelection` com fallback último destaque.
- Risco: remover `InitialScreenPicker` da `/` e `initialRoute` afeta testes e docs existentes; cobrir com regressão e atualizar `INTERFACE.md`, `DATABASE.md` e `PROJECT.md` onde aplicável.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify` e consolidar a spec normativa.
