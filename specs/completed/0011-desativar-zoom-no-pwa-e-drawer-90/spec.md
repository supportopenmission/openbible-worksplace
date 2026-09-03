# Especificação integrada: Desativar zoom no PWA e drawer 90%

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0011 |
| Slug | 0011-desativar-zoom-no-pwa-e-drawer-90 |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Fatia pequena: viewport, regra CSS de campos e variante do Sheet; sem backend nem dados. Perfil standard. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-03 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

No PWA mobile a página aceita pinch e duplo toque, o iPhone aplica zoom automático ao focar campo em modal e os drawers inferiores abrem em altura automática em vez de ocupar a tela como app nativo.

#### Resultado desejado

PWA com zoom travado como app nativo, sem zoom de foco em campos e modais, e drawers inferiores ocupando 90% da altura da tela.

#### Métricas de sucesso

- Pinch e duplo toque não alteram a escala no PWA mobile.
- Focar campo em modal no iPhone não move a escala.
- Drawer inferior aberto mede 90% da altura da viewport.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Viewport atual → `width=device-width, initial-scale=1, viewport-fit=cover`, sem trava; permite zoom. Impacto: adicionar `maximum-scale=1.0, user-scalable=no`.
- **R-002**: Zoom de foco do iOS → Safari amplia quando o campo focado tem fonte menor que 16px; base do app é 0.875rem e primitives shadcn usam `text-base` com `md:text-sm`. Impacto: regra global de 16px em dispositivos touch.
- **R-003**: Sheet atual → `sheet-content.svelte` com `data-[side=bottom]:h-auto`. Impacto: trocar para altura de 90% da viewport com safe-area.
- **R-004**: Editor de notas usa fonte de 1rem ou mais; checkboxes e radios nativos não disparam zoom de foco. Impacto: sem mudança nesses pontos.

#### Fontes e contexto consultados

- `apps/web/src/app.html`, `apps/web/src/app.css`, `apps/web/src/lib/components/ui/sheet/sheet-content.svelte`.
- `apps/web/src/lib/components/ui/input/input.svelte`, `apps/web/src/lib/components/ui/textarea/textarea.svelte`.
- `specs/backlog/0011-desativar-zoom-no-pwa-e-drawer-90.md`, `specs/inbox/2026-09-03-203625-desativar-zoom-no-pwa-e-drawer-90.md`.
- `specs/completed/0010-melhorar-experiencia-do-pwa/spec.md`.

#### Documentação consultada

- Nenhuma fonte externa nova; sistema atual e conversa são suficientes.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo.

#### Dúvidas respondidas

- **Q**: Como bloquear o zoom? → **A**: simular app nativo com trava total + campo em 16px (conversa atual, 2026-09-03).
- **Q**: Quais drawers? → **A**: os bottom sheets (conversa atual, 2026-09-03).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Trava de zoom no viewport do PWA.
- Fonte mínima de 16px em campos de formulário em dispositivos touch.
- Altura de 90% da viewport em Sheets `side=bottom` com safe-area.

#### Fora de escopo

- Sheets laterais, sincronização, push, mudança de layout desktop.

#### Atores

- **Pessoa usuária do PWA**: navega e preenche campos no mobile sem zoom indesejado.

### 4. Princípios e restrições do projeto

- **PR-001**: Manter SvelteKit + Svelte + shadcn-svelte local; sem React.
- **PR-002**: Trava total de zoom é decisão explícita pró app nativo, mesmo reduzindo ampliação manual.
- **PR-003**: Seguir o padrão visual shadcn já instalado no Sheet.

### 5. Histórias de usuário

#### US-001 — Zoom travado como app nativo (P1)

Como pessoa usuária do PWA, quero que pinch e duplo toque não alterem a escala, para usar o app como nativo.

**Por que P1**: zoom acidental quebra a leitura de app.
**Teste independente**: tentar pinch e duplo toque no PWA e conferir escala fixa.
**Requisitos**: FR-001

#### US-002 — Sem zoom ao focar campo ou modal (P1)

Como pessoa usuária no iPhone, quero focar campos inclusive em modal sem zoom automático, para preencher sem perder o contexto.

**Por que P1**: o salto de escala no modal é o incômodo relatado.
**Teste independente**: abrir modal com campo, focar e conferir escala estável.
**Requisitos**: FR-002

#### US-003 — Drawer inferior com 90% da tela (P1)

Como pessoa usuária, quero drawers inferiores ocupando 90% da altura, para o padrão de app.

**Por que P1**: altura automática parece web, não app.
**Teste independente**: abrir cada bottom sheet e medir 90% da viewport.
**Requisitos**: FR-003

### 6. Cenários BDD de aceite

#### AC-001 — Pinch não altera a escala

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: Trava de zoom do PWA

  Scenario: Pinch mantém a escala
    Given o PWA aberto no mobile
    When a pessoa faz pinch para ampliar
    Then a escala permanece 1 sem reflow
```

#### AC-002 — Duplo toque não amplia

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Trava de zoom do PWA

  Scenario: Duplo toque mantém a escala
    Given o PWA aberto no mobile
    When a pessoa dá duplo toque no conteúdo
    Then nenhum zoom é aplicado
```

#### AC-003 — Foco em campo não aplica zoom

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-003
Feature: Zoom de foco no iPhone

  Scenario: Focar campo de texto
    Given um campo de texto com fonte de 16px em dispositivo touch
    When a pessoa foca o campo
    Then o iOS não aplica zoom automático
```

#### AC-004 — Modal com campo não aplica zoom

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-004
Feature: Zoom de foco no iPhone

  Scenario: Focar campo dentro de modal
    Given um modal aberto com campo de texto
    When a pessoa foca o campo
    Then a escala permanece 1 e o modal não desloca
```

#### AC-005 — Select e textarea seguem o mínimo

**Cobre**: US-002, FR-002, NFR-002

```gherkin
@US-002 @FR-002 @NFR-002 @AC-005
Feature: Zoom de foco no iPhone

  Scenario: Campos variados em 16px no touch
    Given select e textarea em dispositivo touch
    When inspeciono a fonte computada
    Then cada campo tem ao menos 16px e o desktop preserva o desenho atual
```

#### AC-006 — Bottom sheet ocupa 90% da altura

**Cobre**: US-003, FR-003, NFR-001

```gherkin
@US-003 @FR-003 @NFR-001 @AC-006
Feature: Drawer inferior padrão app

  Scenario: Abrir drawer inferior
    Given qualquer Sheet side=bottom aberto no mobile
    When meço sua altura
    Then ocupa 90% da altura da viewport
```

#### AC-007 — Sheet respeita safe-area inferior

**Cobre**: US-003, FR-003, NFR-001

```gherkin
@US-003 @FR-003 @NFR-001 @AC-007
Feature: Drawer inferior padrão app

  Scenario: Drawer sobre a barra do sistema
    Given o drawer inferior aberto com notch ou barra de gestos
    When observo a base do drawer
    Then o conteúdo respeita env(safe-area-inset-bottom) sem corte
```

#### AC-008 — Desktop preserva sheets atuais

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-008
Feature: Drawer inferior padrão app

  Scenario: Comportamento no desktop
    Given viewport desktop
    When abro diálogos e sheets
    Then o desenho atual é preservado sem regressão
```

#### AC-009 — Viewport declara a trava nativa

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-009
Feature: Trava de zoom do PWA

  Scenario: Meta viewport com escala fixa
    Given o head do app
    When inspeciono a meta viewport
    Then ela declara maximum-scale 1 e bloqueio de escala do usuário
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve declarar no viewport `maximum-scale=1.0` e `user-scalable=no`, mantendo `width`, `initial-scale` e `viewport-fit`.
- **FR-002**: O sistema deve aplicar fonte mínima de 16px em `input`, `select` e `textarea` em dispositivos touch, sem alterar o desenho no desktop com mouse.
- **FR-003**: O sistema deve renderizar Sheets `side=bottom` com 90% da altura da viewport e respeito a `env(safe-area-inset-bottom)`.

#### Não funcionais

- **NFR-001**: Comportamento de app nativo consistente nos drawers e campos do mobile. **Verificação**: testes Vitest de marcação + inspeção mobile.
- **NFR-002**: Sem regressão visual no desktop. **Verificação**: suíte existente + inspeção em 1280px.

#### Erros e casos-limite

- Navegador que ignora `user-scalable=no` → campos em 16px ainda evitam o zoom de foco.
- Teclado aberto reduz a viewport → drawer usa `dvh` para acompanhar a altura visível.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit 2 + Svelte 5 + Tailwind 4 + shadcn-svelte local; viewport com `viewport-fit=cover` e `theme-color` por esquema; Sheet com variante `side=bottom` em `h-auto`; Vitest com projetos node e browser.

#### Arquitetura e módulos

- `app.html`: viewport passa a `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- `app.css`: regra global `@media (pointer: coarse)` com `input, select, textarea { font-size: 16px; }`; mantém `md:text-sm` do shadcn no desktop.
- `sheet-content.svelte`: variante bottom troca `h-auto` por `h-[90dvh]` com fallback `h-[90vh]` e `pb-[env(safe-area-inset-bottom)]`.

#### Migrations

- Não aplicável.

#### Models

- Não aplicável; só marcação e estilo.

#### Controllers e casos de uso

- Não aplicável; sem lógica nova.

#### Views e experiência

- Modais e drawers mantêm conteúdo e foco; só escala e altura mudam. Sheet bottom com rolagem interna quando o conteúdo exceder 90%.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0011-desativar-zoom-no-pwa-e-drawer-90/
  spec.md
  research/
apps/web/src/app.html
apps/web/src/app.css
apps/web/src/lib/components/ui/sheet/sheet-content.svelte
apps/web/src/lib/pwa/mobile-viewport.test.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Nenhuma | — | Fatia só de marcação e estilo | — |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

#### Migração e retenção

- Não aplicável.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Escala do viewport, campos de formulário e drawers no mobile.

#### Stack e convenções de interface

- SvelteKit + Svelte 5, Tailwind 4, primitive Sheet shadcn-svelte local em `apps/web/src/lib/components/ui/sheet/`, testes Vitest. Telas afetadas: shell global, campos em modais e drawers bottom (Destaques, seletores, ações).

#### Telas e responsabilidades

- Shell mobile: viewport travado, sem zoom por gesto, usado pela pessoa em todas as rotas.
- Campos e modais: fonte de 16px no touch para foco sem salto de escala.
- Drawers bottom: 90% da altura com safe-area, rolagem interna quando necessário.

#### Fluxo de informação e navegação

- A pessoa navega e preenche campos como antes; só a escala e a altura do drawer mudam. Sem nova rota ou menu.

#### Menus e navegação principal

- Menus existentes permanecem: a Sidebar do desktop e a barra inferior do mobile mantêm itens, rotas e destinos; a entrega não cria nem remove navegação, só estabiliza escala e drawers.

#### Formulários e ações

- Campos mantêm rótulos, validações e ações; a única mudança é a fonte mínima de 16px em dispositivos touch, aplicada na página global sem modal novo.

#### Composição e disposição

- Sheet `side=bottom` passa a `90dvh` com `safe-area-inset-bottom`; laterais e desktop inalterados; hierarquia e densidade preservadas.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | Projeto Svelte, sem React | — | — | — | Não aplicável; blocos Svelte abaixo |

Blocos Svelte: `Sheet` (`sheet-content.svelte`, variante bottom 90%), campos nativos via regra global em `app.css`, viewport em `app.html`.

#### Estados e acessibilidade

- Trava de zoom reduz ampliação manual: decisão consciente pró app nativo registrada em DEC-001. Foco visível, teclado e contraste preservados; drawer com rolagem e `prefers-reduced-motion` respeitado nas animações existentes.

#### Revisão visual durante o desenvolvimento

- Conferir bordas, espaçamentos, margens, padding e tipografia do sistema nos drawers e campos em 360px e 1280px, claro e escuro, com e sem notch.

#### APIs expostas

- Nenhuma.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma fonte externa consultada.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: marcação do viewport, regra de campos e variante do Sheet.
- **Integração/contrato**: estilos computados do Sheet bottom.
- **BDD/aceite**: Gherkin da seção 6 orienta os testes TDD abaixo, sem `.feature`.
- **Runner TDD**: Vitest (`bun run test:tdd` em `apps/web`).
- **E2E**: Não aplicável; verificação manual de pinch no dispositivo cobre gestos.
- **Verificação manual**: pinch/duplo toque e foco em modal no iPhone.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: trava pinch` (T001) | RED 2026-09-03 | GREEN 2026-09-03: viewport travado | Pending |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: trava duplo toque` (T002) | RED 2026-09-03 | GREEN 2026-09-03: sem zoom por gesto | Pending |
| US-002, FR-002, NFR-001, AC-003 | AC-003 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: campo 16px` (T003) | RED 2026-09-03 | GREEN 2026-09-03: campo 16px no touch | Pending |
| US-002, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: modal sem zoom` (T004) | RED 2026-09-03 | GREEN 2026-09-03: regra cobre modal | Pending |
| US-002, FR-002, NFR-002, AC-005 | AC-005 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: campos variados` (T005) | GREEN imediato (caracterização): desktop preservado | Pending | Pending |
| US-003, FR-003, NFR-001, AC-006 | AC-006 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: sheet 90` (T006) | RED 2026-09-03 | GREEN 2026-09-03: bottom em 90dvh | Pending |
| US-003, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: sheet safe-area` (T007) | RED 2026-09-03 | GREEN 2026-09-03: safe-area no drawer | Pending |
| US-003, FR-003, NFR-002, AC-008 | AC-008 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: desktop preservado` (T008) | GREEN imediato (caracterização): laterais intactas | Pending | Pending |
| US-001, FR-001, NFR-002, AC-009 | AC-009 na seção 6 | `mobile-viewport.test.ts` — `SPECSFY: meta viewport` (T009) | RED 2026-09-03 | GREEN 2026-09-03: meta declara trava | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-001 | AC-002 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-001 | AC-009 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-002 | AC-003 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-002 | AC-004 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-002 | AC-005 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-003 | AC-006 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-003 | AC-007 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| FR-003 | AC-008 | Unidade | `apps/web/src/lib/pwa/mobile-viewport.test.ts` / `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-001 | AC-001 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-001 | AC-004 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-001 | AC-006 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-002 | AC-005 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-002 | AC-008 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |
| NFR-002 | AC-009 | Unidade | `vitest run mobile-viewport` | GREEN 2026-09-03: suíte 205/205 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0011-desativar-zoom-no-pwa-e-drawer-90/spec.md --allow-draft`
- **Achados**: VALID DRAFT; cobertura US/FR/NFR com 3+ ACs; sem lacunas (zoom total e drawer 90% decididos).

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `validate_tasks.mjs` + `validate_interface_tasks.mjs`
- **Achados**: 14 tarefas (9 TDD, 3 CODE, 1 DOC, 1 TEST); 17/17 IDs; TDD concluídos com RED válido em 2026-09-03 (7 RED por gap, 2 GREEN-caracterização).

#### Gate do Ato III — Entrega

- **Resultado**: Passed
- **Comando**: `check_traceability.mjs` no escopo da fatia + suíte completa
- **Achados**: 17/17 IDs com casos TDD; suíte 205/205; build verde; check/lint com falhas provadas preexistentes fora da fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Cada tarefa possui exatamente este checklist, atualizado durante a execução:

```markdown
  - [ ] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [ ] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [ ] **VERIFY**: Executar a verificação focal adequada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema; se não houver interface, registrar `Não aplicável` e o motivo.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e confirmar trava de pinch, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e confirmar trava de duplo toque, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T003 [TEST] [TDD] [US-002] Derivar de AC-003 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-002, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e confirmar campo em 16px, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T004 [TEST] [TDD] [US-002] Derivar de AC-004 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-002, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e confirmar modal sem zoom, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T005 [TEST] [TDD] [US-002] Derivar de AC-005 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-002, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e confirmar campos variados, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T006 [TEST] [TDD] [US-003] Derivar de AC-006 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-003, FR-003, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e confirmar sheet em 90%, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T007 [TEST] [TDD] [US-003] Derivar de AC-007 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-003, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e confirmar safe-area do sheet, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T008 [TEST] [TDD] [US-003] Derivar de AC-008 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-003, FR-003, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e confirmar desktop preservado, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T009 [TEST] [TDD] [US-001] Derivar de AC-009 caso Vitest falhando em `apps/web/src/lib/pwa/mobile-viewport.test.ts` — Refs: US-001, FR-001, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e confirmar meta viewport, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

#### Fase de interface

**Objetivo**: viewport travado, campos sem zoom de foco e drawers em 90%.
**Teste independente**: pinch, foco em modal e abertura de drawer no mobile.

- [x] T010 [CODE] [US-001] Travar zoom no viewport em `apps/web/src/app.html` — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-009 — Depends: T001, T002, T009
  - [x] **PREP**: Confirmar RED TDD de T001, T002 e T009; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Declarar `maximum-scale=1.0, user-scalable=no` mantendo largura, escala inicial e `viewport-fit`.
  - [x] **VERIFY**: Executar `vitest run mobile-viewport` e inspecionar a meta.
  - [x] **VISUAL**: Não aplicável porque a tarefa só altera meta do head, sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-009"],"files":["apps/web/src/app.html"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/mobile-viewport.test.ts -t trava","exit":0}]} -->

- [x] T011 [CODE] [US-002] Fonte mínima de campos no touch em `apps/web/src/app.css` — Refs: US-002, FR-002, NFR-001, NFR-002, AC-003, AC-004, AC-005 — Depends: T003, T004, T005
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T005; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Aplicar 16px em `input, select, textarea` sob `(pointer: coarse)` sem tocar o desktop.
  - [x] **VERIFY**: Executar `vitest run mobile-viewport` e conferir a regra nos dois contextos.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema nos campos em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T011","refs":["US-002","FR-002","NFR-001","NFR-002","AC-003","AC-004","AC-005"],"files":["apps/web/src/app.css"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/mobile-viewport.test.ts -t campo","exit":0}]} -->

- [x] T012 [CODE] [US-003] Drawer bottom em 90% em `apps/web/src/lib/components/ui/sheet/sheet-content.svelte` — Refs: US-003, FR-003, NFR-001, NFR-002, AC-006, AC-007, AC-008 — Depends: T006, T007, T008
  - [x] **PREP**: Confirmar RED TDD de T006, T007 e T008; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Trocar `h-auto` por altura de 90% da viewport com `safe-area-inset-bottom`, preservando laterais e desktop.
  - [x] **VERIFY**: Executar `vitest run mobile-viewport` e medir o drawer em 360px.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema no drawer em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T012","refs":["US-003","FR-003","NFR-001","NFR-002","AC-006","AC-007","AC-008"],"files":["apps/web/src/lib/components/ui/sheet/sheet-content.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/mobile-viewport.test.ts -t drawer","exit":0}]} -->

- [x] T013 [DOC] [US-003] Atualizar `INTERFACE.md` com trava de zoom e drawer 90% — Refs: US-003, FR-003, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Confirmar viewport, campos e Sheet alterados e o mapa atual de `INTERFACE.md`.
  - [x] **EXECUTE**: Registrar em `INTERFACE.md` a trava de zoom, a fonte mínima touch e o Sheet bottom em 90%.
  - [x] **VERIFY**: Conferir que cada bloco alterado tem arquivo, estados e regra de reuso.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação, sem superfície visual.
  - [x] **EVIDENCE**: Registrar arquivos e revisão aplicados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.

**Checkpoint**: mobile sem zoom e drawers em 90%.

#### Fase final — Qualidade

- [x] T014 [TEST] Executar regressão e rastreabilidade em `apps/web/vitest.config.ts` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T010, T011, T012, T013
  - [x] **PREP**: Identificar suites, checks e gates a partir de `apps/web/vitest.config.ts`.
  - [x] **EXECUTE**: Executar regressão e rastreabilidade.
  - [x] **VERIFY**: Confirmar ausência de gaps.
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia na conferência visual final ou registrar `Não aplicável` com motivo concreto.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T009 → T010–T013 → T014.
- Tarefas paralelas: T001–T009 entre si; T010, T011 e T012 após o RED.
- Estratégia de MVP: trava de zoom e campos primeiro; drawer fecha o padrão app.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Sheet shadcn-svelte local; sem backend.

#### Riscos

- Trava de zoom reduz ampliação manual → decisão consciente pró app nativo.
- `90dvh` sem suporte em navegador antigo → fallback `90vh` na mesma regra.

#### Suposições

- iOS aplica zoom de foco abaixo de 16px; `pointer: coarse` cobre touch Apple e Android.

### 17. Decisões

- **DEC-001**: Trava total de zoom para simular app nativo — alternativa de manter pinch acessível recusada pela pessoa em 2026-09-03.
- **DEC-002**: Os bottom sheets ocupam 90% da altura — laterais e desktop preservados.
- **DEC-003**: Fonte mínima via `(pointer: coarse)` em vez de largura fixa — cobre iPhone e iPad sem tocar o desktop.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam (`test:tdd` 205/205 e `build` verdes; `check`/`lint` com falhas provadas preexistentes fora da fatia).
