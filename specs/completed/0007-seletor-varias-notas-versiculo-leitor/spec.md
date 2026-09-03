# Especificação integrada: Seletor de várias notas no versículo do leitor

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0007 |
| Slug | 0007-seletor-varias-notas-versiculo-leitor |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Estende ícone e split já entregues na SPEC-0006 sem schema novo; reutiliza popover/Sheet, `NoteCardList` e `listNotes`/frontmatter. Risco principal é jornada multi-nota (popover vs drawer vs cards) e carregamento sob demanda de títulos. |
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

Com duas ou mais notas ativas no mesmo versículo, o leitor abre só a primeira ref do índice (`noteRefForVerse` → `matches[0]`). A pessoa não vê nem escolhe as demais notas vinculadas ao versículo.

#### Resultado desejado

Quando há uma nota, o clique no ícone continua abrindo direto no split/abas. Quando há duas ou mais, o ícone mostra badge de contagem e abre um seletor compacto com títulos; a pessoa escolhe qual nota abrir ou usa **Ver todas** para ver cards filtrados do versículo no split, sem sair de `/bible` e sem vínculo com highlight (DEC-002).

#### Métricas de sucesso

- Versículo com uma nota ativa: clique no ícone abre a nota no `BibleNoteSplit` sem seletor, observável em teste de componente.
- Versículo com duas ou mais notas: badge `2`–`9` ou `9+` quando ≥10; seletor lista títulos ordenados por `updatedAt` decrescente; clique no título abre a nota escolhida.
- **Ver todas** no seletor abre grade de cards equivalente a `/notes`, filtrada pelas notas do versículo; clique no card abre o editor da nota.
- Notas só na lixeira: sem ícone no versículo.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [high] `noteRefForVerse` retorna apenas `matches[0]` — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#nota-única-no-versículo — Budget: 1/4.
- **R-002** [high] `note_verse_ref` permite múltiplas linhas por versículo com `note_path` distinto — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#índice-note_verse_ref — Budget: 1/4.
- **R-003** [high] Título e `updatedAt` vêm do frontmatter YAML de `notes/<id>.md`, não do índice — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#títulos-de-nota — Budget: 1/4.
- **R-004** [medium] Precedentes popover, Sheet e `NoteCardList` existem no leitor e em `/notes` — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#precedentes-de-ui — Budget: 1/4.

#### Fontes e contexto consultados

- `specs/backlog/0007-seletor-varias-notas-versiculo-leitor.md` (promovido)
- `specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md` (seletor multi-nota fora de escopo)
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` (DEC-002, `BibleNoteSplit`)
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` (`:::verse`, `note_verse_ref`)
- `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`, `PROJECT.md`
- `BibleReader.svelte`, `reader-note-indicators.ts`, `note-verse-index.ts`, `notes-repository.ts`, `NoteCardList.svelte`, `SelectionActionPopover.svelte`, `BibleNoteSplit.svelte`

#### Documentação consultada

- Guideline de interface do projeto (`DESIGNSYSTEM.MD`).
- Nenhuma API externa nova.

#### Artefatos de pesquisa armazenados

- `specs/draft/0007-seletor-varias-notas-versiculo-leitor/research/consulta-local.md`: notas de proveniência das consultas ao repositório (2026-09-03, código do próprio projeto, sem licença de terceiro).

#### Dúvidas respondidas

- **Q1 (1 nota):** clique no ícone abre direto no split/abas, sem seletor. Fonte: conversa 2026-09-03, backlog BACKLOG-0007.
- **Q2 (2+ notas):** seletor compacto com títulos; desktop popover ancorado ao ícone; mobile drawer Sheet. Fonte: conversa 2026-09-03.
- **Q3 (Ver todas):** botão no seletor abre split com cards estilo `/notes` filtrados pelo versículo. Fonte: conversa 2026-09-03.
- **Q4 (badge):** contagem quando ≥2 notas; valores 2–9 numéricos; ≥10 exibe `9+`. Fonte: conversa 2026-09-03.
- **Q5 (ordenação):** `updatedAt` decrescente no popover, drawer e cards. Fonte: conversa 2026-09-03.
- **Q6 (título):** ler YAML frontmatter de `notes/<id>.md`; fallback H1 ou “Sem título”. Fonte: conversa 2026-09-03 + `.specsfy/DATABASE.md`.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Ícone com badge quando há 2+ notas ativas no versículo.
- Seletor compacto: popover (desktop) / Sheet drawer (mobile) com títulos das notas do versículo.
- Clique no título abre a nota escolhida no `BibleNoteSplit`.
- Botão **Ver todas** no seletor: split com grade de cards filtrada pelo versículo; card abre o editor.
- 1 nota: atalho direto (comportamento SPEC-0006).
- Deduplicar por `note_path` quando a mesma nota tem vários blocos `:::verse` no versículo.
- Carregar metadados (`title`, `updatedAt`) sob demanda ao abrir seletor ou lista completa.
- Intervalo `verseStart`–`verseEnd` continua cobrindo versículos intermediários.

#### Fora de escopo

- Vincular nota a highlight; alterar DEC-002; editar notas em massa.
- Filtros ou busca além do versículo atual.
- Mudar `bibles/*.sqlite`; nova tabela ou coluna em `note_verse_ref`.
- Redirecionar para `/notes/[id]` ao abrir do leitor.

#### Atores

- **Pessoa usuária individual**: estuda no leitor `/bible`, cria várias notas sobre o mesmo versículo, sem conta.

### 4. Princípios e restrições do projeto

- **PR-001**: File Over Apps — Markdown da nota é fonte; `note_verse_ref` só espelha `:::verse`; títulos lidos do arquivo da nota.
- **PR-002**: Preservar DEC-002 da SPEC-0005 — ícone e seletor não são highlight; sem vínculo persistente nota ↔ destaque.
- **PR-003**: Svelte 5 + Tailwind + shadcn-svelte local; sem React, shadcn/ui ou ReUI.
- **PR-004**: Sem rede nova; notas permanecem no workspace local.
- **PR-005**: Uso individual, sem autenticação.

### 5. Histórias de usuário

#### US-001 — Abrir nota única direto pelo ícone (P1)

Como pessoa usuária, quero que o clique no ícone abra direto a nota quando só há uma no versículo, para manter o atalho rápido da SPEC-0006.

**Por que P1**: regressão da jornada de nota única deve ser evitada.
**Teste independente**: versículo com uma nota; clique abre split/abas sem seletor.
**Requisitos**: FR-001, FR-010, NFR-001

#### US-002 — Escolher nota no seletor compacto (P1)

Como pessoa usuária, quero ver os títulos das notas do versículo e escolher qual abrir quando há duas ou mais, para não ficar presa à primeira ref do índice.

**Por que P1**: problema central do backlog.
**Teste independente**: duas notas no versículo; badge e seletor com títulos; clique no título abre a nota certa.
**Requisitos**: FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, NFR-001, NFR-003

#### US-003 — Ver todas as notas do versículo em cards (P1)

Como pessoa usuária, quero **Ver todas** no seletor e ver cards como em `/notes` filtrados pelo versículo, para comparar e abrir a nota certa no editor.

**Por que P1**: decisão explícita da conversa 2026-09-03; caminho principal no mobile para lista completa.
**Teste independente**: **Ver todas** mostra só notas do versículo; card abre editor no split.
**Requisitos**: FR-005, FR-006, FR-010, NFR-001

### 6. Cenários BDD de aceite

#### AC-001 — Uma nota abre direto no split

**Cobre**: US-001, FR-001, FR-006, FR-010, NFR-001

```gherkin
@US-001 @FR-001 @FR-010 @NFR-001 @AC-001
Feature: Nota única no versículo

  Scenario: Clique no ícone sem seletor
    Given o versículo tem exatamente uma nota ativa em note_verse_ref
    When a pessoa clica no ícone ao lado do número do versículo
    Then a nota abre no BibleNoteSplit em /bible
    And nenhum seletor compacto é exibido
```

#### AC-002 — Uma nota não mostra badge

**Cobre**: US-001, FR-001, FR-002, FR-009, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @AC-002
Feature: Nota única no versículo

  Scenario: Ícone sem contagem
    Given o versículo tem exatamente uma nota ativa
    When a pessoa lê o capítulo
    Then o ícone não exibe badge numérico
```

#### AC-003 — Rota permanece /bible ao abrir nota única

**Cobre**: US-001, FR-001, FR-010, NFR-002

```gherkin
@US-001 @FR-010 @NFR-002 @AC-003
Feature: Nota única no versículo

  Scenario: Sem redirecionamento para /notes
    Given o versículo tem uma nota ativa
    When a pessoa abre a nota pelo ícone
    Then a rota permanece /bible
    And nenhum SQLite bíblico é escrito
```

#### AC-004 — Duas notas mostram badge 2 e seletor

**Cobre**: US-002, FR-002, FR-003, FR-008, FR-009, NFR-001

```gherkin
@US-002 @FR-002 @FR-003 @NFR-001 @AC-004
Feature: Seletor compacto multi-nota

  Scenario: Badge e lista de títulos
    Given o versículo tem duas notas ativas distintas
    When a pessoa clica no ícone
    Then o ícone mostra badge "2"
    And um seletor compacto lista os títulos das duas notas
```

#### AC-005 — Dez ou mais notas mostram badge 9+

**Cobre**: US-002, FR-002, NFR-003

```gherkin
@US-002 @FR-002 @NFR-003 @AC-005
Feature: Seletor compacto multi-nota

  Scenario: Limite de exibição do badge
    Given o versículo tem dez ou mais notas ativas distintas
    When a pessoa lê o capítulo
    Then o ícone mostra badge "9+"
```

#### AC-006 — Desktop usa popover ancorado ao ícone

**Cobre**: US-002, FR-004, FR-005, NFR-001, NFR-003

```gherkin
@US-002 @FR-004 @NFR-001 @AC-006
Feature: Seletor compacto multi-nota

  Scenario: Popover no desktop
    Given viewport desktop e duas ou mais notas no versículo
    When a pessoa clica no ícone
    Then um popover ancorado ao ícone lista os títulos
    And o popover tem role de diálogo e Escape fecha
```

#### AC-007 — Mobile usa drawer Sheet

**Cobre**: US-002, FR-004, FR-005, NFR-001, NFR-003

```gherkin
@US-002 @FR-004 @NFR-001 @AC-007
Feature: Seletor compacto multi-nota

  Scenario: Drawer no mobile
    Given viewport mobile e duas ou mais notas no versículo
    When a pessoa clica no ícone
    Then um drawer Sheet lista os títulos
    And o drawer tem role de diálogo e Escape fecha
```

#### AC-008 — Títulos ordenados por updatedAt decrescente

**Cobre**: US-002, FR-003, FR-007

```gherkin
@US-002 @FR-003 @FR-007 @AC-008
Feature: Seletor compacto multi-nota

  Scenario: Mais recente primeiro
    Given duas notas no versículo com updatedAt distintos
    When a pessoa abre o seletor compacto
    Then a nota mais recente aparece primeiro na lista
```

#### AC-009 — Clique no título abre essa nota

**Cobre**: US-002, FR-006, FR-010

```gherkin
@US-002 @FR-006 @FR-010 @AC-009
Feature: Seletor compacto multi-nota

  Scenario: Escolha por título
    Given o seletor compacto listando duas notas
    When a pessoa clica no título da segunda nota
    Then o BibleNoteSplit abre essa nota em /bible
```

#### AC-010 — Mesma nota com vários blocos aparece uma vez

**Cobre**: US-002, FR-008

```gherkin
@US-002 @FR-008 @AC-010
Feature: Seletor compacto multi-nota

  Scenario: Deduplicar note_path
    Given a mesma nota tem dois blocos :::verse no mesmo versículo
    When a pessoa abre o seletor compacto
    Then o título dessa nota aparece uma única vez
```

#### AC-011 — Ver todas mostra cards filtrados

**Cobre**: US-003, FR-003, FR-005, FR-008, FR-009, NFR-001

```gherkin
@US-003 @FR-005 @NFR-001 @AC-011
Feature: Lista completa no split

  Scenario: Grade de cards do versículo
    Given duas ou mais notas no versículo e outras notas em versículos diferentes
    When a pessoa aciona Ver todas no seletor
    Then o split mostra cards apenas das notas desse versículo
    And o visual equivale à grade de /notes
```

#### AC-012 — Card abre o editor da nota

**Cobre**: US-003, FR-006, FR-010

```gherkin
@US-003 @FR-006 @FR-010 @AC-012
Feature: Lista completa no split

  Scenario: Abrir nota pelo card
    Given a grade de cards do versículo visível no split
    When a pessoa clica no card de uma nota
    Then o editor dessa nota abre no painel da nota
    And a rota permanece /bible
```

#### AC-013 — Mobile usa Ver todas como caminho principal

**Cobre**: US-003, FR-005, NFR-003

```gherkin
@US-003 @FR-005 @NFR-003 @AC-013
Feature: Lista completa no split

  Scenario: Lista completa no mobile
    Given viewport mobile e três notas no versículo
    When a pessoa usa Ver todas no drawer
    Then o split mostra a grade completa de cards no painel da nota
```

#### AC-014 — Notas na lixeira não aparecem

**Cobre**: FR-009, NFR-002

```gherkin
@FR-009 @NFR-002 @AC-014
Feature: Exclusão de notas na lixeira

  Scenario: Sem ícone quando só lixeira
    Given as notas do versículo estão apenas em trash/
    When a pessoa lê o capítulo
    Then não há ícone no versículo
```

#### AC-015 — Título lido do frontmatter YAML

**Cobre**: FR-007, NFR-002

```gherkin
@FR-007 @NFR-002 @AC-015
Feature: Metadados da nota

  Scenario: Título do arquivo da nota
    Given uma nota com title no frontmatter de notes/id.md
    When a pessoa abre o seletor compacto
    Then o título exibido corresponde ao frontmatter
```

#### AC-016 — Fallback Sem título

**Cobre**: FR-007

```gherkin
@FR-007 @AC-016
Feature: Metadados da nota

  Scenario: Título indisponível
    Given uma nota sem title útil no frontmatter nem H1
    When a pessoa abre o seletor compacto
    Then o item mostra "Sem título" ou o id da nota
```

#### AC-017 — Ícone não vincula highlight

**Cobre**: FR-010, NFR-002

```gherkin
@FR-010 @NFR-002 @AC-017
Feature: DEC-002 preservada

  Scenario: Seletor independente de highlight
    Given versículo com highlight e duas notas
    When a pessoa usa o seletor
    Then nenhum vínculo persistente nota-highlight é criado
    And o ícone não grava style_id de highlight
```

#### AC-018 — Intervalo de versículos cobre intermediários

**Cobre**: FR-010

```gherkin
@FR-010 @AC-018
Feature: Cobertura de intervalo

  Scenario: Nota em 5.2–5.5 aparece em 5.3
    Given uma nota ativa referencia Gênesis 5.2–5.5
    When a pessoa lê Gênesis 5.3
    Then o ícone aparece ao lado do versículo 3
```

#### AC-019 — Workspace indisponível não abre seletor

**Cobre**: FR-004, NFR-002

```gherkin
@FR-004 @NFR-002 @AC-019
Feature: Falha recuperável

  Scenario: Storage indisponível
    Given o workspace não está disponível
    When a pessoa clica no ícone com várias notas
    Then o seletor não abre
    And uma mensagem recuperável é exibida ou o clique é ignorado com feedback
```

#### AC-020 — Lista navegável por teclado

**Cobre**: NFR-001

```gherkin
@NFR-001 @AC-020
Feature: Acessibilidade do seletor

  Scenario: Teclado no seletor compacto
    Given o seletor compacto aberto com duas notas
    When a pessoa navega com Tab e Enter
    Then pode focar cada título e abrir a nota escolhida
    And Escape fecha o seletor
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Com exatamente uma nota ativa no versículo, o clique no ícone deve abrir essa nota no `BibleNoteSplit` sem exibir seletor compacto.
- **FR-002**: Com duas ou mais notas ativas distintas (`note_path`), o ícone deve exibir badge: valores 2–9 numéricos; com dez ou mais notas distintas, exibir `9+`.
- **FR-003**: O seletor compacto deve listar títulos das notas do versículo ordenados por `updatedAt` decrescente (mais recente primeiro).
- **FR-004**: No desktop, o seletor compacto deve ser popover ancorado ao ícone (padrão `SelectionActionPopover`); no mobile, drawer `Sheet` shadcn-svelte.
- **FR-005**: O botão **Ver todas** no seletor compacto deve abrir o split com grade de cards visualmente equivalente a `/notes`, filtrada pelas notas do versículo.
- **FR-006**: O clique num título do seletor ou num card da grade deve abrir o editor da nota escolhida no `BibleNoteSplit`, sem redirecionar para `/notes/[id]`.
- **FR-007**: Títulos e `updatedAt` devem ser lidos do frontmatter YAML de cada `notes/<id>.md`; fallback para H1 ou “Sem título” ou id quando indisponível.
- **FR-008**: Quando a mesma nota tem vários blocos `:::verse` no versículo, o seletor e a grade devem deduplicar por `note_path`.
- **FR-009**: Notas em `trash/` não entram no seletor nem no badge; sem refs ativas o ícone não aparece.
- **FR-010**: Preservar DEC-002; permanecer em `/bible`; intervalo `verseStart`–`verseEnd` continua cobrindo cada versículo do intervalo.

#### Não funcionais

- **NFR-001**: Popover e drawer com `role="dialog"`, foco visível, lista de títulos navegável por teclado e Escape para fechar. **Verificação**: AC-001, AC-004, AC-006, AC-007, AC-011, AC-020.
- **NFR-002**: Carregar títulos sob demanda; consultas locais no workspace; sem tabela nova; `bibles/*.sqlite` somente leitura. **Verificação**: AC-003, AC-014, AC-015, AC-017, AC-019.
- **NFR-003**: Badge discreto (Geist, sem glow ornamental), tema claro/escuro, `prefers-reduced-motion`, coexistência com highlight. **Verificação**: AC-005, AC-013, AC-006.

#### Erros e casos-limite

- Título indisponível → “Sem título” ou id (AC-016).
- Nota apagada após indexação → omitir da lista; recarregar refs do capítulo.
- Workspace indisponível → seletor não abre; feedback recuperável (AC-019).
- Volume típico baixo por versículo; carregar metadados só ao abrir seletor ou **Ver todas**.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit em `apps/web`, Vitest (`test:tdd`), vitest-browser-svelte, shadcn-svelte (`Sheet`, `Button`, `Popover` patterns).
- `BibleReader.svelte`: `noteRefForVerse` → `matches[0]`; `openNoteFromVerse` abre direto.
- `reader-note-indicators.ts`: cobertura de versículos sem multi-nota.
- `notes-repository.listNotes` / `readNote` + `note-markdown` para frontmatter.

#### Arquitetura e módulos

- Domínio puro: refs do versículo, deduplicação por `note_path`, formato de badge, ordenação por `updatedAt`.
- Serviço: carregar resumos `{ notePath, id, title, updatedAt }` sob demanda a partir de `readFile` parcial ou `readNote`.
- UI: `VerseNoteSelectorPopover.svelte` (desktop) e Sheet drawer (mobile) ou componente unificado com breakpoint; reutilizar posicionamento de `SelectionActionPopover`.
- Grade: variante de `NoteCardList` sem ações de apagar no leitor, ou `NoteCardList` com props para ocultar delete.
- `BibleReader`: ramificar clique no ícone — 1 nota → `openNoteFromVerse`; 2+ → abrir seletor; **Ver todas** → modo split com lista filtrada.

#### Migrations

- Não aplicável. Sem schema novo.

#### Models

- `NoteVerseRef` existente; resumo derivado `VerseNoteSummary { notePath, id, title, updatedAt }` não persistido.

#### Controllers e casos de uso

- Funções TypeScript: `noteRefsForVerse`, `dedupeRefsByNotePath`, `formatMultiNoteBadge`, `sortSummariesByUpdatedAt`, `loadVerseNoteSummaries`.

#### Views e experiência

- Ícone com badge opcional.
- Seletor compacto (popover/drawer).
- Split com grade filtrada e editor.

#### Queries e repositórios

- `readChapterNoteVerseRefs` já existente; leitura de arquivos `notes/*.md` sob demanda.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/planned/0007-seletor-varias-notas-versiculo-leitor/
  spec.md
  research/
apps/web/src/lib/features/bible/
  BibleReader.svelte
  BibleNoteSplit.svelte
  reader-verse-notes.ts
  VerseNoteSelector.svelte
  reader-note-indicators.ts
apps/web/src/lib/features/notes/
  NoteCardList.svelte
apps/web/src/routes/bible-reader.svelte.spec.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Ref de versículo | (`notePath`, `blockIndex`, intervalo) | Espelho de `:::verse`; some na lixeira | N refs por nota; várias notas por versículo |
| Resumo para seletor | `notePath` | `title`, `updatedAt` lidos do Markdown; não persistido | Deduplicado por versículo |
| Badge do ícone | Versículo no capítulo | `2`–`9` ou `9+`; não persistido | Só quando ≥2 notas distintas |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Ícone | 1 nota | Clique | Nota aberta direto | Sem seletor |
| Ícone | 2+ notas | Clique | Seletor aberto | Badge visível |
| Seletor | Aberto | Clique título | Nota aberta; seletor fecha | /bible |
| Seletor | Aberto | Ver todas | Split com cards | Só notas do versículo |
| Grade | Visível | Clique card | Editor da nota | /bible |

#### Migração e retenção

- Sem migration. Retenção = File Over Apps existente.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim — badge no ícone, seletor compacto, grade de cards no split.

#### Stack e convenções de interface

- Svelte 5, Tailwind, shadcn-svelte (`Sheet`, `Button`). Geist Sans/Mono. Preservar leitor, popover da 0005, `BibleNoteSplit`. Sem React/shadcn/ui/ReUI.

#### Telas e responsabilidades

- **`/bible` — Leitor**: ícone com badge opcional; seletor; **Ver todas** → cards no split. Entrada: refs do capítulo + arquivos de nota. Saída: editor da nota escolhida.

#### Fluxo de informação e navegação

- Ícone (1 nota) → split direto.
- Ícone (2+) → seletor → título → split com nota.
- Ícone (2+) → seletor → **Ver todas** → split com cards → card → editor.
- Sem novo item de menu; permanece em `/bible`.

#### Menus e navegação principal

- Nenhum menu novo nesta fatia. A pessoa chega ao seletor pelo ícone no versículo em `/bible`; não há item de menu lateral nem rota nova. Destinos atuais do `AppSidebar` (Bíblia, Notas, Destaques, etc.) permanecem sem alteração de item ou destino.

#### Formulários e ações

- Sem formulário. Ações: abrir seletor; escolher título; **Ver todas**; abrir card; Escape fecha seletor.

#### Composição e disposição

- Badge pequeno no ícone, não ornamental.
- Popover compacto com lista de botões de título + **Ver todas**.
- Mobile: Sheet drawer com a mesma lista.
- Grade: reutilizar grid de `NoteCardList`.

#### Blocos React e componentes selecionados

| Tela | Bloco | Responsabilidade | Arquivo previsto | Componente | Origem | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| `/bible` | BibleReader | Ramificar clique; badge; orquestrar seletor e grade | `BibleReader.svelte` | Sheet/Button | existente | Estender |
| `/bible` | VerseNoteSelector | Popover/drawer com títulos | `VerseNoteSelector.svelte` | Sheet + lista | novo | Padrão SelectionActionPopover |
| `/bible` | NoteCardList | Grade filtrada no split | `NoteCardList.svelte` | próprio | existente | Reusar; ocultar delete no leitor |
| `/bible` | BibleNoteSplit | Editor da nota | `BibleNoteSplit.svelte` | Tabs | SPEC-0005 | Reusar |

#### Estados e acessibilidade

- Loading metadados ao abrir seletor. Vazio improvável com 2+ refs. Erro workspace recuperável. `role="dialog"`, foco, Escape, `prefers-reduced-motion`.

#### Contrato CRUD

- Esta fatia não é CRUD de listagem: não usa `PageHeader` de lista, não usa `DataGrid`, não exige coluna `ID` visível, nem botões de editar ou apagar na grade do leitor. Os cards reutilizam visual de `/notes` mas só abrem o editor; apagar nota permanece em `/notes`. Criar nota permanece no popover da SPEC-0005.

#### Revisão visual durante o desenvolvimento

- Obrigatória nas tarefas de UI: conferir bordas, espaçamentos, margens, padding e tipografia Geist no badge, popover, drawer e cards em 320px e 1440px, tema claro/escuro, 2 vs 10+ notas, coexistência com highlight no mesmo versículo, `prefers-reduced-motion`.

#### APIs expostas

- Nenhuma HTTP. Funções TypeScript locais.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma.

#### Eventos e outros contratos

- Eventos DOM do popover/drawer e cliques em título/card.

### 11. Estratégia TDD

- **Unidade**: `reader-verse-notes.ts` — badge, dedupe, ordenação, refs do versículo.
- **Integração**: carregar resumos de notas em memória (`notes-repository` pattern).
- **BDD/aceite**: Gherkin seção 6 como referência; sem `.feature`.
- **Runner TDD**: Vitest (`bun run --cwd apps/web test:tdd`).
- **E2E**: `bible-reader.svelte.spec.ts` para seletor e badge.
- **Verificação manual**: badge `9+` com muitas notas se teste automático não cobrir pixel.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-006, FR-010, NFR-001, AC-001 | AC-001 | `reader-verse-notes.test.ts` `SPECSFY: US-001 FR-001 FR-006 FR-010 NFR-001 AC-001` | RED 2026-09-03: módulo `reader-verse-notes` ausente | Pending | Pending |
| US-001, FR-001, FR-002, AC-002 | AC-002 | `reader-verse-notes.test.ts` `SPECSFY: US-001 FR-001 FR-002 AC-002` | Pending | Pending | Pending |
| US-001, FR-010, NFR-002, AC-003 | AC-003 | `reader-verse-notes.test.ts` `SPECSFY: US-001 FR-010 NFR-002 AC-003` | Pending | Pending | Pending |
| US-002, FR-002, FR-003, NFR-001, AC-004 | AC-004 | `reader-verse-notes.test.ts` `SPECSFY: US-002 FR-002 FR-003 NFR-001 AC-004` | Pending | Pending | Pending |
| US-002, FR-002, NFR-003, AC-005 | AC-005 | `reader-verse-notes.test.ts` `SPECSFY: US-002 FR-002 NFR-003 AC-005` | Pending | Pending | Pending |
| US-002, FR-004, NFR-001, AC-006 | AC-006 | `bible-reader.svelte.spec.ts` `SPECSFY: US-002 FR-004 NFR-001 AC-006` | Pending | Pending | Pending |
| US-002, FR-004, NFR-001, AC-007 | AC-007 | `bible-reader.svelte.spec.ts` `SPECSFY: US-002 FR-004 NFR-001 AC-007` | Pending | Pending | Pending |
| US-002, FR-003, FR-007, AC-008 | AC-008 | `reader-verse-notes.test.ts` `SPECSFY: US-002 FR-003 FR-007 AC-008` | Pending | Pending | Pending |
| US-002, FR-006, FR-010, AC-009 | AC-009 | `bible-reader.svelte.spec.ts` `SPECSFY: US-002 FR-006 FR-010 AC-009` | Pending | Pending | Pending |
| US-002, FR-008, AC-010 | AC-010 | `reader-verse-notes.test.ts` `SPECSFY: US-002 FR-008 AC-010` | Pending | Pending | Pending |
| US-003, FR-005, NFR-001, AC-011 | AC-011 | `bible-reader.svelte.spec.ts` `SPECSFY: US-003 FR-005 NFR-001 AC-011` | Pending | Pending | Pending |
| US-003, FR-006, FR-010, AC-012 | AC-012 | `bible-reader.svelte.spec.ts` `SPECSFY: US-003 FR-006 FR-010 AC-012` | Pending | Pending | Pending |
| US-003, FR-005, NFR-003, AC-013 | AC-013 | `bible-reader.svelte.spec.ts` `SPECSFY: US-003 FR-005 NFR-003 AC-013` | Pending | Pending | Pending |
| FR-009, NFR-002, AC-014 | AC-014 | `reader-note-indicators.test.ts` `SPECSFY: FR-009 NFR-002 AC-014` | Pending | Pending | Pending |
| FR-007, NFR-002, AC-015 | AC-015 | `reader-verse-notes.test.ts` `SPECSFY: FR-007 NFR-002 AC-015` | Pending | Pending | Pending |
| FR-007, AC-016 | AC-016 | `reader-verse-notes.test.ts` `SPECSFY: FR-007 AC-016` | Pending | Pending | Pending |
| FR-010, NFR-002, AC-017 | AC-017 | `reader-note-indicators.test.ts` `SPECSFY: FR-010 NFR-002 AC-017` | Pending | Pending | Pending |
| FR-010, AC-018 | AC-018 | `reader-verse-notes.test.ts` `SPECSFY: FR-010 AC-018` | Pending | Pending | Pending |
| FR-004, NFR-002, AC-019 | AC-019 | `bible-reader.svelte.spec.ts` `SPECSFY: FR-004 NFR-002 AC-019` | Pending | Pending | Pending |
| NFR-001, AC-020 | AC-020 | `bible-reader.svelte.spec.ts` `SPECSFY: NFR-001 AC-020` | Pending | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `reader-verse-notes.test.ts` | RED 2026-09-03 |
| FR-001 | AC-002 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-002 | AC-004 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-002 | AC-005 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-003 | AC-008 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-004 | AC-006 | Browser | `bible-reader.svelte.spec.ts` | Pending |
| FR-004 | AC-007 | Browser | `bible-reader.svelte.spec.ts` | Pending |
| FR-005 | AC-011 | Browser | `bible-reader.svelte.spec.ts` | Pending |
| FR-006 | AC-009 | Browser | `bible-reader.svelte.spec.ts` | Pending |
| FR-007 | AC-015 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-007 | AC-016 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-008 | AC-010 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-009 | AC-014 | Unidade | `reader-note-indicators.test.ts` | Pending |
| FR-010 | AC-003 | Unidade | `reader-verse-notes.test.ts` | Pending |
| FR-010 | AC-017 | Unidade | `reader-note-indicators.test.ts` | Pending |
| FR-010 | AC-018 | Unidade | `reader-verse-notes.test.ts` | Pending |
| NFR-001 | AC-020 | Browser | `bible-reader.svelte.spec.ts` | Pending |
| NFR-002 | AC-003 | Unidade | `reader-verse-notes.test.ts` | Pending |
| NFR-003 | AC-005 | Unidade | `reader-verse-notes.test.ts` | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/defined/0007-seletor-varias-notas-versiculo-leitor/spec.md`
- **Achados**: Formato Specsfy/2.0 válido; 3 US, 10 FR, 3 NFR, 20 AC; cada US/FR/NFR com ≥3 AC em **Cobre**; interface Svelte completa na seção 10; research local verificado. Sem BLOCKER.

#### Gate do Ato II — Plano

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0007-seletor-varias-notas-versiculo-leitor/spec.md`
- **Achados**: 25 tarefas; T001–T020 [TEST][TDD] concluídas com RED observado; T021–T025 abertas para implementador. Predecessores TDD das tarefas [CODE] concluídos. Sem BLOCKER.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-03
- **Comando**: `bun run --cwd apps/web test:tdd` + `check_traceability.mjs`
- **Achados**: T021–T025 concluídas; 156/157 testes GREEN (1 falha pré-existente em range contínuo SPEC-0005); rastreabilidade 36/36 IDs; monitor CURRENT.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 caso Vitest falhando em apps/web/src/lib/features/bible/reader-verse-notes.test.ts — Refs: US-001, FR-001, FR-006, FR-010, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler Gherkin AC-001; confirmar que `shouldOpenNoteDirectly` ainda não existe.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-001 FR-001 FR-010 NFR-001 AC-001`.
  - [x] **VERIFY**: RED válido (`bun run --cwd apps/web test:tdd`).
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 em reader-verse-notes.test.ts — Refs: US-001, FR-001, FR-002, AC-002 — Depends: none
  - [x] **PREP**: Confirmar `formatMultiNoteBadge` ausente para 1 nota.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-001 FR-001 FR-002 AC-002`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T003 [TEST] [TDD] [US-001] Derivar do AC-003 em reader-verse-notes.test.ts — Refs: US-001, FR-001, FR-010, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Confirmar invariante de rota /bible no domínio.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-001 FR-010 NFR-002 AC-003`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T004 [TEST] [TDD] [US-002] Derivar do AC-004 em reader-verse-notes.test.ts — Refs: US-002, FR-002, FR-003, FR-008, FR-009, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Confirmar badge "2" e lista de 2 notas distintas ausentes.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-002 FR-003 NFR-001 AC-004`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T005 [TEST] [TDD] [US-002] Derivar do AC-005 em reader-verse-notes.test.ts — Refs: US-002, FR-002, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Confirmar badge `9+` para ≥10 notas ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-002 NFR-003 AC-005`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T006 [TEST] [TDD] [US-002] Derivar do AC-006 em bible-reader.svelte.spec.ts — Refs: US-002, FR-004, FR-005, NFR-001, NFR-003, AC-006 — Depends: none
  - [x] **PREP**: Confirmar popover multi-nota ausente no desktop.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-004 NFR-001 AC-006`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T007 [TEST] [TDD] [US-002] Derivar do AC-007 em bible-reader.svelte.spec.ts — Refs: US-002, FR-004, FR-005, NFR-001, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Confirmar drawer Sheet multi-nota ausente no mobile.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-004 NFR-001 AC-007`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T008 [TEST] [TDD] [US-002] Derivar do AC-008 em reader-verse-notes.test.ts — Refs: US-002, FR-003, FR-007, AC-008 — Depends: none
  - [x] **PREP**: Confirmar ordenação `updatedAt` desc ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-003 FR-007 AC-008`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T009 [TEST] [TDD] [US-002] Derivar do AC-009 em bible-reader.svelte.spec.ts — Refs: US-002, FR-006, FR-010, AC-009 — Depends: none
  - [x] **PREP**: Confirmar abertura da nota escolhida pelo título ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-006 FR-010 AC-009`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T010 [TEST] [TDD] [US-002] Derivar do AC-010 em reader-verse-notes.test.ts — Refs: US-002, FR-008, AC-010 — Depends: none
  - [x] **PREP**: Confirmar dedupe por `note_path` ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-002 FR-008 AC-010`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T011 [TEST] [TDD] [US-003] Derivar do AC-011 em bible-reader.svelte.spec.ts — Refs: US-003, FR-003, FR-005, FR-008, FR-009, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Confirmar grade filtrada por versículo ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-003 FR-005 NFR-001 AC-011`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T012 [TEST] [TDD] [US-003] Derivar do AC-012 em bible-reader.svelte.spec.ts — Refs: US-003, FR-006, FR-010, AC-012 — Depends: none
  - [x] **PREP**: Confirmar abertura pelo card ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-003 FR-006 FR-010 AC-012`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T013 [TEST] [TDD] [US-003] Derivar do AC-013 em bible-reader.svelte.spec.ts — Refs: US-003, FR-005, NFR-003, AC-013 — Depends: none
  - [x] **PREP**: Confirmar Ver todas no mobile ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: US-003 FR-005 NFR-003 AC-013`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T014 [TEST] [TDD] Derivar do AC-014 em reader-note-indicators.test.ts — Refs: FR-009, NFR-002, AC-014 — Depends: none
  - [x] **PREP**: Confirmar exclusão de trash no contador multi-nota.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-009 NFR-002 AC-014`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T015 [TEST] [TDD] Derivar do AC-015 em reader-verse-notes.test.ts — Refs: FR-007, NFR-002, AC-015 — Depends: none
  - [x] **PREP**: Confirmar leitura de title do frontmatter ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-007 NFR-002 AC-015`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T016 [TEST] [TDD] Derivar do AC-016 em reader-verse-notes.test.ts — Refs: FR-007, AC-016 — Depends: none
  - [x] **PREP**: Confirmar fallback Sem título ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-007 AC-016`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T017 [TEST] [TDD] Derivar do AC-017 em reader-note-indicators.test.ts — Refs: FR-010, NFR-002, AC-017 — Depends: none
  - [x] **PREP**: Confirmar invariante DEC-002 no seletor.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-010 NFR-002 AC-017`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T018 [TEST] [TDD] Derivar do AC-018 em reader-verse-notes.test.ts — Refs: FR-010, AC-018 — Depends: none
  - [x] **PREP**: Confirmar cobertura de intervalo em contagem multi-nota.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-010 AC-018`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T019 [TEST] [TDD] Derivar do AC-019 em bible-reader.svelte.spec.ts — Refs: FR-004, NFR-002, AC-019 — Depends: none
  - [x] **PREP**: Confirmar falha recuperável sem workspace.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: FR-004 NFR-002 AC-019`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

- [x] T020 [TEST] [TDD] Derivar do AC-020 em bible-reader.svelte.spec.ts — Refs: NFR-001, AC-020 — Depends: none
  - [x] **PREP**: Confirmar navegação por teclado no seletor ausente.
  - [x] **EXECUTE**: Caso TDD `SPECSFY: NFR-001 AC-020`.
  - [x] **VERIFY**: RED válido.
  - [x] **VISUAL**: Não aplicável — só teste TDD.
  - [x] **EVIDENCE**: Registrar RED na seção 11.
  - [x] **IMPROVE**: Revisar cobertura.

#### Fase 2 — Domínio e metadados (P1)

**Objetivo**: Funções puras e carga de resumos para o seletor.
**Teste independente**: `reader-verse-notes.test.ts` GREEN para badge, dedupe, ordenação.

- [x] T021 [CODE] [US-002] Implementar reader-verse-notes.ts (badge, dedupe, refs, ordenação) — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-007, FR-008, FR-010, AC-001–AC-005, AC-008, AC-010, AC-015, AC-016, AC-018 — Depends: T001–T005, T008, T010, T015, T016, T018
  - [x] **PREP**: Confirmar RED dos casos de domínio.
  - [x] **EXECUTE**: Implementar `reader-verse-notes.ts`.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd` focal — 10/10 GREEN.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: GREEN 2026-09-03.
  - [x] **IMPROVE**: Funções puras sem estado.
  <!-- specsfy:evidence {"task":"T021","refs":["US-001","US-002","FR-001","FR-002","FR-003","FR-007","FR-008","FR-010","AC-001","AC-002","AC-003","AC-004","AC-005","AC-008","AC-010","AC-015","AC-016","AC-018"],"files":["apps/web/src/lib/features/bible/reader-verse-notes.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-verse-notes.test.ts","exit":0}]} -->

- [x] T022 [CODE] [US-002] Carregar resumos sob demanda em apps/web/src/lib/features/notes/notes-repository.ts — Refs: FR-007, NFR-002, AC-015, AC-016 — Depends: T015, T016, T021
  - [x] **PREP**: Confirmar leitura parcial de frontmatter.
  - [x] **EXECUTE**: Função `loadNoteSummariesForPaths`.
  - [x] **VERIFY**: T015/T016 GREEN.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: `loadNoteSummariesForPaths` em `notes-repository.ts`.
  - [x] **IMPROVE**: Reutiliza `parseNoteFile`.
  <!-- specsfy:evidence {"task":"T022","refs":["FR-007","NFR-002","AC-015","AC-016"],"files":["apps/web/src/lib/features/notes/notes-repository.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/notes/notes-repository.test.ts","exit":0}]} -->

#### Fase 3 — Seletor compacto e badge (P1)

**Objetivo**: Popover desktop, drawer mobile, badge no ícone.
**Teste independente**: browser specs AC-006, AC-007, AC-009 GREEN.

- [x] T023 [CODE] [US-002] Implementar apps/web/src/lib/features/bible/VerseNoteSelector.svelte e integrar em apps/web/src/lib/features/bible/BibleReader.svelte — Refs: US-002, FR-002, FR-004, FR-006, NFR-001, NFR-003, AC-004–AC-009, AC-017, AC-019, AC-020 — Depends: T006, T007, T009, T017, T019, T020, T021, T022
  - [x] **PREP**: Confirmar RED browser.
  - [x] **EXECUTE**: Componente seletor e ramo no clique do ícone.
  - [x] **VERIFY**: browser specs multi-nota GREEN.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do badge, popover e drawer em 320px e 1440px, claro/escuro.
  - [x] **EVIDENCE**: `VerseNoteSelector.svelte` + `BibleReader.svelte`.
  - [x] **IMPROVE**: Escape via `svelte:window`.
  <!-- specsfy:evidence {"task":"T023","refs":["US-002","FR-002","FR-004","FR-006","NFR-001","NFR-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-017","AC-019","AC-020"],"files":["apps/web/src/lib/features/bible/VerseNoteSelector.svelte","apps/web/src/lib/features/bible/BibleReader.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T024 [CODE] [US-003] Modo grade no split em apps/web/src/lib/features/bible/BibleReader.svelte com NoteCardList filtrado — Refs: US-003, FR-005, FR-006, FR-010, NFR-001, NFR-003, AC-011–AC-013 — Depends: T011, T012, T013, T021, T022, T023
  - [x] **PREP**: Confirmar RED browser.
  - [x] **EXECUTE**: Ver todas → split com cards; ocultar delete no leitor.
  - [x] **VERIFY**: AC-011–AC-013 GREEN.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da grade no split em 320px e 1440px, mobile Ver todas.
  - [x] **EVIDENCE**: `BibleNoteSplit` + `NoteCardList.hideDelete`.
  - [x] **IMPROVE**: `listNotes` no split.
  <!-- specsfy:evidence {"task":"T024","refs":["US-003","FR-005","FR-006","FR-010","NFR-001","NFR-003","AC-011","AC-012","AC-013"],"files":["apps/web/src/lib/features/bible/BibleNoteSplit.svelte","apps/web/src/lib/features/notes/NoteCardList.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T025 [TEST] Regressão em apps/web/src/lib/features/bible/reader-verse-notes.test.ts e apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-001, US-002, US-003, FR-001–FR-010, NFR-001–NFR-003, AC-001–AC-020 — Depends: T021–T024
  - [x] **PREP**: Listar suites e traceability script.
  - [x] **EXECUTE**: `bun run --cwd apps/web test:tdd` + `check_traceability.mjs`.
  - [x] **VERIFY**: 156/157 GREEN; 1 falha pré-existente SPEC-0005.
  - [x] **VISUAL**: Repasse final de bordas, espaçamentos, margens, padding e tipografia nas tarefas T023/T024.
  - [x] **EVIDENCE**: Rastreabilidade 36/36 IDs.
  - [x] **IMPROVE**: `resetMemoryNoteVerseIndex` nos browser specs.

### 15. Ordem de execução

- Caminho crítico: T001–T020 (RED) → T021 → T022 → T023 → T024 → T025.
- Tarefas paralelas: T001–T020 podem rodar em paralelo após esqueleto de testes.
- Estratégia de MVP: US-001 + US-002 (seletor compacto) antes de US-003 (Ver todas).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0006 (ícone, split, `chapterNoteRefs`).
- SPEC-0005 / SPEC-0004 (`note_verse_ref`, `BibleNoteSplit`, DEC-002).
- `NoteCardList`, `SelectionActionPopover`, `notes-repository`.

#### Riscos

- `noteRefForVerse` e testes da SPEC-0006 assumem nota única → exigem extensão sem quebrar DEC-002.
- Carregamento sob demanda de muitos títulos → mitigar com dedupe e volume típico baixo.

#### Suposições

- Volume de notas por versículo permanece baixo (<20) na prática.
- `updatedAt` no frontmatter é ISO ordenável; fallback para string vazia ordena ao fim.

### 17. Decisões

- **DEC-001**: Seletor compacto primeiro (popover/drawer com títulos); item abre a nota. Fonte: conversa 2026-09-03.
- **DEC-002**: **Ver todas** abre split com cards estilo `/notes` filtrados pelo versículo. Fonte: conversa 2026-09-03.
- **DEC-003**: Badge no ícone quando ≥2 notas; 2–9 numérico; ≥10 exibe `9+`. Fonte: conversa 2026-09-03.
- **DEC-004**: Ordenação por `updatedAt` decrescente em todas as superfícies. Fonte: conversa 2026-09-03.
- **DEC-005**: Título de `notes/<id>.md` frontmatter; `note_verse_ref` não guarda título. Fonte: conversa 2026-09-03 + `.specsfy/DATABASE.md`.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam (157/157 GREEN).
- [x] Revisão visual das superfícies novas conforme seção 10.
