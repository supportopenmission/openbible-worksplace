# Especificação integrada: Lista de highlights e indicador de nota no leitor

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0006 |
| Slug | 0006-lista-highlights-indicador-nota-leitor |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Três superfícies (sheet no leitor, rota `/highlights` no menu, ícone no versículo) reutilizam persistência já entregue (`reader_highlight`, `note_verse_ref`, `BibleNoteSplit`); sem schema novo nem vínculo persistente. Risco principal é consistência das duas listas e coexistência visual com o highlight da 0005. |
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

Depois da SPEC-0005 a pessoa destaca versículos e cria notas no leitor `/bible`, mas não consulta os destaques numa lista e não percebe no texto bíblico que o trecho já tem nota. O painel Highlighting permanente ficou fora da 0005.

#### Resultado desejado

A pessoa vê todos os destaques do workspace num sheet aberto pelos controles de `/bible` e na mesma lista numa página `/highlights` no menu, junto de Bíblia e Notas. No capítulo aberto, um ícone discreto ao lado do número do versículo indica nota ativa; o clique abre essa nota em split no desktop e em abas no mobile, sem vincular highlight a nota.

#### Métricas de sucesso

- Abrir o sheet em `/bible` e a rota `/highlights` mostra o mesmo conjunto de `reader_highlight` do workspace, inclusive de outra versão, livro ou capítulo, observável em teste de repositório e de componente.
- Um versículo com uma nota ativa em `note_verse_ref` exibe ícone ao lado do número; o clique abre essa nota no `BibleNoteSplit` já existente, observável em teste de componente.
- Versículo só com highlight não ganha ícone; versículo com highlight e nota mostra os dois sem gravar vínculo; `bibles/*.sqlite` permanece sem escrita.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [high] listChapterHighlights so le o capitulo aberto; nao existe listagem workspace-wide — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#listagem-de-highlights — Budget: 1/4.
- **R-002** [high] Nao ha rota /highlights nem item de menu para destaques — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#navegacao — Budget: 1/4.
- **R-003** [high] note_verse_ref ja espelha verse e some na lixeira; o reader nao marca o versiculo — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#indice-de-notas — Budget: 1/4.
- **R-004** [medium] BibleNoteSplit ja abre nota em split desktop / abas mobile sem sair de /bible — Verdict: verified — Confidence: high — Evidence: research/consulta-local.md#split-da-nota — Budget: 1/4.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-03-013346-sheet-pagina-de-highlights-e-indicador-de-nota-no-leitor.md`
- `specs/backlog/0006-lista-highlights-indicador-nota-leitor.md`
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` (DEC-002)
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md`
- `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`, `PROJECT.md`
- `BibleReader.svelte`, `AppSidebar.svelte`, `reader-highlights-repository.ts`, `note-verse-index.ts`

#### Documentação consultada

- Guideline de interface do projeto (`DESIGNSYSTEM.MD`; qualidade Vercel design.md sem marca Vercel).
- Nenhuma API externa nova.

#### Artefatos de pesquisa armazenados

- `specs/planned/0006-lista-highlights-indicador-nota-leitor/research/consulta-local.md`: notas de proveniência das consultas ao repositório (2026-09-03, código do próprio projeto, sem licença de terceiro). Nenhuma API externa.

#### Dúvidas respondidas

- **Q1 (escopo da lista):** todos os destaques do workspace, em qualquer versão, livro ou capítulo; sheet e página mostram o mesmo conjunto. Fonte: conversa atual, resposta `3`, 2026-09-03.
- **Q2 (jornada):** sheet abre pelos controles do leitor em `/bible`; a página é uma rota nova `/highlights` no menu lateral, junto de Bíblia e Notas. Fonte: conversa atual, resposta `1`, 2026-09-03.
- **Q3 (indicativo):** ícone discreto ao lado do número do versículo; o clique abre a nota em split no desktop e em abas no mobile (padrão SPEC-0005). Não reabre DEC-002. Fonte: conversa atual, resposta `1`, 2026-09-03.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Sheet pelos controles de `/bible` listando todos os `reader_highlight` do workspace.
- Rota `/highlights` e item “Destaques” no mesmo array de links do `AppSidebar` (menu lateral e barra mobile), junto de Bíblia e Notas.
- Mesmo conjunto nas duas superfícies, sem filtro silencioso por capítulo ou versão.
- Ícone discreto ao lado do número do versículo quando uma nota ativa referencia aquele versículo via `note_verse_ref`.
- Clique no ícone abre essa nota no `BibleNoteSplit` (split desktop, abas mobile), sem sair de `/bible`.
- Coexistência visual de highlight e ícone sem vínculo persistente.

#### Fora de escopo

- Bugs de seleção de vários versículos e underline/wavy só na última linha (correção paralela, não desta fatia).
- Vincular nota a highlight; painel Highlighting permanente estilo Logos; alterar `bibles/*.sqlite`.
- Navegar da linha da lista para o capítulo ou versículo.
- Seletor quando várias notas ativas referenciam o mesmo versículo (ícone aparece se ≥1; o clique desta fatia é especificado para uma única nota).
- Filtros, busca ou ordenação avançada na lista.
- Highlight TipTap do canvas como markup do reader.

#### Atores

- **Pessoa usuária individual**: lê, consulta destaques e abre notas no workspace local, sem conta.

### 4. Princípios e restrições do projeto

- **PR-001**: File Over Apps — Markdown da nota é fonte da nota; SQLite auxiliar (`reader_highlight`, `note_verse_ref`) só consulta e já persiste; `bibles/*.sqlite` somente leitura.
- **PR-002**: Preservar DEC-002 da SPEC-0005 — destacar não cria nota; criar nota não aplica highlight; sem vínculo persistente. O ícone não é um `style_id` de highlight.
- **PR-003**: Interface Svelte 5 + Tailwind + shadcn-svelte local; sem React, shadcn/ui ou ReUI.
- **PR-004**: Nenhum texto bíblico, destaque ou nota é enviado à rede por esta fatia.
- **PR-005**: Uso individual, sem autenticação.

### 5. Histórias de usuário

#### US-001 — Consultar destaques no sheet do leitor (P1)

Como pessoa usuária, quero abrir um sheet pelos controles de `/bible` e ver todos os destaques do workspace, para consultar o que já marquei sem ficar só no capítulo aberto.

**Por que P1**: o pedido original pede o sheet como superfície de consulta.
**Teste independente**: abrir o sheet com destaques em outro capítulo/versão e ver todos na lista; workspace vazio mostra lista vazia.
**Requisitos**: FR-001, FR-006, NFR-001, NFR-002

#### US-002 — Consultar a mesma lista na página /highlights (P1)

Como pessoa usuária, quero uma página `/highlights` no menu, junto de Bíblia e Notas, para ver o mesmo conjunto de destaques fora do capítulo.

**Por que P1**: o pedido original pede a página além do sheet.
**Teste independente**: o item Destaques leva a `/highlights` e a lista coincide com a do sheet.
**Requisitos**: FR-002, FR-006, NFR-001

#### US-003 — Ver e abrir a nota pelo ícone no texto (P1)

Como pessoa usuária, quero um ícone discreto ao lado do número do versículo quando houver nota, e abrir essa nota em split/abas ao clicar, para perceber e retomar o estudo sem sair do leitor.

**Por que P1**: terceiro comportamento declarado; reutiliza o split da 0005.
**Teste independente**: versículo com uma nota mostra ícone; clique abre a nota; versículo sem nota não mostra ícone.
**Requisitos**: FR-003, FR-004, FR-005, NFR-001, NFR-003

### 6. Cenários BDD de aceite

#### AC-001 — Sheet lista os destaques do workspace

**Cobre**: US-001, FR-001, FR-006, NFR-001

```gherkin
@US-001 @FR-001 @FR-006 @NFR-001 @AC-001
Feature: Lista de highlights no sheet

  Scenario: Abrir o sheet pelos controles do leitor
    Given o workspace tem destaques persistidos em reader_highlight
    When a pessoa aciona Destaques nos controles de /bible
    Then um sheet mostra esses destaques
    And o sheet tem papel de diálogo e título visível
```

#### AC-002 — A lista não recorta por capítulo ou versão

**Cobre**: US-001, FR-001, FR-006

```gherkin
@US-001 @FR-001 @FR-006 @AC-002
Feature: Lista de highlights no sheet

  Scenario: Destaques de outra versão, livro ou capítulo aparecem
    Given o capítulo aberto é Gênesis 1 na versão atual
    And existe um destaque em outro livro, capítulo ou versão no mesmo workspace
    When a pessoa abre o sheet de destaques
    Then a lista inclui esse destaque além dos do capítulo aberto
```

#### AC-003 — Sheet vazio quando não há destaques

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: Lista de highlights no sheet

  Scenario: Workspace sem reader_highlight
    Given o workspace não tem destaques do reader
    When a pessoa abre o sheet de destaques
    Then a lista aparece vazia de forma observável
    And nenhum SQLite bíblico é escrito
```

#### AC-004 — Página /highlights mostra a lista

**Cobre**: US-002, FR-002

```gherkin
@US-002 @FR-002 @AC-004
Feature: Página de highlights

  Scenario: Abrir /highlights pelo menu
    Given o workspace tem destaques persistidos
    When a pessoa abre Destaques no menu e chega em /highlights
    Then a página lista esses destaques com título visível
```

#### AC-005 — Sheet e página têm o mesmo conjunto

**Cobre**: US-002, FR-006

```gherkin
@US-002 @FR-006 @AC-005
Feature: Mesmo conjunto nas duas superfícies

  Scenario: Pertinência idêntica
    Given o workspace tem um conjunto conhecido de reader_highlight
    When a pessoa consulta o sheet e a página /highlights
    Then os dois mostram exatamente os mesmos destaques
```

#### AC-006 — Página vazia quando não há destaques

**Cobre**: US-002, FR-002, NFR-002

```gherkin
@US-002 @FR-002 @NFR-002 @AC-006
Feature: Página de highlights

  Scenario: /highlights sem destaques
    Given o workspace não tem destaques do reader
    When a pessoa abre /highlights
    Then a página mostra estado vazio observável
```

#### AC-007 — Ícone ao lado do número quando há uma nota ativa

**Cobre**: US-003, FR-003, NFR-001

```gherkin
@US-003 @FR-003 @NFR-001 @AC-007
Feature: Indicativo de nota no leitor

  Scenario: Uma nota ativa referencia o versículo
    Given uma nota ativa tem fence :::verse que cobre Gênesis 1.3
    And o índice note_verse_ref contém essa referência
    When a pessoa lê Gênesis 1 no leitor
    Then um ícone discreto aparece ao lado do número do versículo 3
    And o ícone tem nome acessível de nota
```

#### AC-008 — Clique no ícone abre a nota em split no desktop

**Cobre**: US-003, FR-004

```gherkin
@US-003 @FR-004 @AC-008
Feature: Indicativo de nota no leitor

  Scenario: Abrir a nota no desktop
    Given o ícone de uma única nota está visível ao lado do versículo
    And a viewport é desktop
    When a pessoa aciona o ícone
    Then a nota abre ao lado do leitor em split
    And a rota permanece /bible
```

#### AC-009 — Clique no ícone abre a nota em abas no mobile

**Cobre**: US-003, FR-004, NFR-003

```gherkin
@US-003 @FR-004 @NFR-003 @AC-009
Feature: Indicativo de nota no leitor

  Scenario: Abrir a nota no mobile
    Given o ícone de uma única nota está visível ao lado do versículo
    And a viewport é mobile
    When a pessoa aciona o ícone
    Then a nota abre nas abas Bíblia e Nota
    And a rota permanece /bible
```

#### AC-010 — Sem ícone quando o versículo não tem nota ativa

**Cobre**: US-003, FR-003

```gherkin
@US-003 @FR-003 @AC-010
Feature: Indicativo de nota no leitor

  Scenario: Capítulo sem nota no versículo
    Given Gênesis 1.3 não aparece em note_verse_ref de nota ativa
    When a pessoa lê Gênesis 1
    Then o versículo 3 não mostra ícone de nota
```

#### AC-011 — Nota na lixeira não gera ícone

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-011
Feature: Indicativo de nota no leitor

  Scenario: Ref removida com a lixeira
    Given a nota que referenciava o versículo foi para trash/
    And note_verse_ref já não contém essa ref
    When a pessoa lê o capítulo
    Then o versículo não mostra ícone de nota
```

#### AC-012 — Highlight e ícone coexistem sem vínculo persistente

**Cobre**: US-003, FR-005, NFR-003

```gherkin
@US-003 @FR-005 @NFR-003 @AC-012
Feature: Independência highlight e nota

  Scenario: Mesmo versículo com destaque e nota
    Given Gênesis 1.3 tem reader_highlight e uma nota ativa
    When a pessoa lê Gênesis 1
    Then o markup do highlight permanece
    And o ícone de nota aparece ao lado do número
    And nenhum campo novo liga highlight a nota
```

#### AC-013 — Destacar não cria nota e criar nota não aplica highlight

**Cobre**: FR-005

```gherkin
@FR-005 @AC-013
Feature: Independência highlight e nota

  Scenario: DEC-002 da SPEC-0005 permanece
    Given uma seleção no leitor
    When a pessoa aplica um highlight
    Then nenhuma nota nova é criada
    When a pessoa cria uma nota pela ação já existente
    Then nenhum reader_highlight novo é aplicado por essa criação
```

#### AC-014 — Teclado no sheet e no ícone

**Cobre**: FR-004, NFR-001

```gherkin
@FR-004 @NFR-001 @AC-014
Feature: Acesso por teclado

  Scenario: Sheet e ícone operáveis
    Given o leitor está em /bible
    When a pessoa abre o sheet de destaques pelo teclado
    Then o foco entra no diálogo e Escape fecha o sheet
    And o ícone de nota, quando presente, é acionável por teclado
```

#### AC-015 — Sem escrita nos SQLite bíblicos e sem tabela nova

**Cobre**: NFR-002

```gherkin
@NFR-002 @AC-015
Feature: Persistência File Over Apps

  Scenario: Consulta só no índice auxiliar
    Given o workspace tem reader_highlight e note_verse_ref
    When a pessoa abre a lista ou o ícone no leitor
    Then bibles/*.sqlite não recebe CREATE nem INSERT de destaque ou nota
    And nenhuma tabela nova é criada no índice
```

#### AC-016 — Menu Destaques ao lado de Bíblia e Notas

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-016
Feature: Navegação para /highlights

  Scenario: Item no menu lateral e na barra mobile
    Given a pessoa usa o shell OpenBible
    When ela consulta a navegação principal
    Then existe o destino Destaques para /highlights
    And o item convive com Bíblia e Notas no menu lateral e na barra mobile
    And o destino ativo recebe aria-current
```

#### AC-017 — O ícone não é um estilo de highlight

**Cobre**: FR-005, NFR-003

```gherkin
@FR-005 @NFR-003 @AC-017
Feature: Independência highlight e nota

  Scenario: Ícone distinto da paleta Q6
    Given um versículo tem nota e não tem reader_highlight
    When a pessoa lê o capítulo
    Then o ícone aparece
    And o versículo não recebe markup de caneta, sublinhado, ondulado ou caixa
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve abrir um sheet pelos controles do leitor em `/bible` que lista todos os `reader_highlight` do workspace.
- **FR-002**: O sistema deve expor a rota `/highlights` e o item “Destaques” no menu principal (lateral e mobile), junto de Bíblia e Notas, listando o mesmo conjunto.
- **FR-003**: O sistema deve mostrar um ícone discreto ao lado do número do versículo quando ao menos uma nota ativa referencia aquele versículo em `note_verse_ref`.
- **FR-004**: Ao acionar o ícone de uma única nota, o sistema deve abrir essa nota no `BibleNoteSplit` (split desktop, abas mobile) sem sair de `/bible`.
- **FR-005**: O ícone não é highlight: não grava `style_id`, não cria vínculo persistente com `reader_highlight` e não reabre a DEC-002 da SPEC-0005.
- **FR-006**: Sheet e página devem mostrar exatamente o mesmo conjunto, sem recortar por versão, livro ou capítulo aberto.

#### Não funcionais

- **NFR-001**: Sheet, página `/highlights` e ícone devem ser operáveis por teclado, com título ou nome acessível, foco visível e Escape para fechar o sheet. **Verificação**: AC-001, AC-007, AC-014, AC-016.
- **NFR-002**: Consultas permanecem no workspace local; `bibles/*.sqlite` somente leitura; sem tabela nova; lixeira continua sem ref. **Verificação**: AC-003, AC-006, AC-011, AC-015.
- **NFR-003**: Ícone discreto (Geist, sem glow), tema claro/escuro, `prefers-reduced-motion`, coexistência com markup de highlight, sem marca Logos/Vercel. **Verificação**: AC-009, AC-012, AC-017 e item VISUAL das tarefas.

#### Erros e casos-limite

- Workspace sem destaques → lista vazia observável no sheet e na página (AC-003, AC-006).
- Versículo sem `note_verse_ref` ativo → sem ícone (AC-010).
- Nota na lixeira → sem ícone (AC-011).
- Várias notas no mesmo versículo → ícone se ≥1; seletor fora de escopo; clique especificado só para uma nota (AC-007, AC-008).
- Índice ou workspace indisponível → estado vazio ou erro recuperável; sem escrita em `bibles/*.sqlite`.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit em `apps/web`, Vitest (`test:tdd`), Playwright via vitest-browser-svelte, shadcn-svelte (`Sheet`, `Button`, `Tabs`, `Sidebar`).
- `BibleReader.svelte` orquestra capítulo, busca (já usa `Sheet`), seleção, highlights e `BibleNoteSplit`.
- `listChapterHighlights` filtra por versão+capítulo; `note_verse_ref` existe e não é consultado pelo reader.

#### Arquitetura e módulos

- Repositório: acrescentar listagem workspace-wide de `reader_highlight` sem mudar schema.
- Domínio: função pura que, dado o capítulo aberto e as refs ativas, decide quais números de versículo mostram ícone (intervalo `verse_start`–`verse_end` cobre o número).
- UI compartilhada da lista (referência + nome do estilo) usada pelo sheet do reader e pela página `/highlights`.
- Reader: botão Destaques nos controles (pílula de ações ao lado de versão/busca); ícone no `BibleVerseList`; clique chama `readNote` e preenche o `note` já usado pelo `BibleNoteSplit`.
- Navegação: um item no array `links` de `AppSidebar.svelte`; rota `apps/web/src/routes/highlights/+page.svelte`; incluir `/highlights` no app shell PWA.

#### Migrations

- Não aplicável. Sem `CREATE TABLE` novo. `CREATE TABLE IF NOT EXISTS` de `reader_highlight` e `note_verse_ref` permanece o já entregue.

#### Models

- `ReaderHighlightRecord` já existe; a lista workspace-wide reutiliza o mesmo tipo.
- Indicador: `{ verseNumber, noteId }` derivado de `NoteVerseRef` + `notes/<id>.md` ativo; sem entidade persistida nova.

#### Controllers e casos de uso

- Funções TypeScript locais, sem HTTP: `listAllReaderHighlights`, `versesWithActiveNote`, abrir nota por `notePath` via `readNote`.

#### Views e experiência

- `BibleReader`: sheet + ícone.
- `HighlightsPage` / lista compartilhada em `/highlights`.
- Estados: loading, vazio, sucesso, erro recuperável de workspace.

#### Queries e repositórios

- `SELECT` em `reader_highlight` sem filtro de capítulo (ordem por versão, livro, capítulo, versículo).
- `SELECT` em `note_verse_ref` do capítulo aberto (já indexado por `version_id, book_id, chapter`); não reindexar nesta fatia.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/planned/0006-lista-highlights-indicador-nota-leitor/
  spec.md
apps/web/src/lib/features/bible/
  BibleReader.svelte
  BibleNoteSplit.svelte
  reader-highlights-repository.ts
  reader-note-indicators.ts
  HighlightsList.svelte
apps/web/src/lib/features/navigation/AppSidebar.svelte
apps/web/src/routes/highlights/+page.svelte
apps/web/src/routes/navigation.svelte.spec.ts
apps/web/src/routes/bible-reader.svelte.spec.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Anotação de highlight | (`versionId`, `bookId`, `chapter`, `verseStart`, `verseEnd`) | `styleId` da paleta Q6; já persistida | Lista workspace-wide; não aponta para nota |
| Ref de versículo da nota | (`notePath`, `blockIndex`, intervalo) | Espelho de `:::verse`; some na lixeira | N refs por nota; alimenta o ícone |
| Indicador visual | Número do versículo no capítulo aberto | Não persistido; derivado das refs ativas que cobrem o número | Clique abre a nota de `notePath` quando há uma só |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Lista | Fechada | Abrir sheet ou `/highlights` | Visível com o conjunto persistido | Mesma pertinência nas duas superfícies |
| Lista | Visível | Workspace sem linhas | Vazia | Sem recorte silencioso |
| Ícone | Ausente | Capítulo com ref ativa no versículo | Visível | Não grava `reader_highlight` |
| Ícone | Visível | Clique (uma nota) | Nota aberta no split/abas | Rota `/bible`; DEC-002 |
| Ícone | Visível | Nota vai para lixeira | Ausente | Índice sem a ref |

#### Migração e retenção

- Sem migration. Retenção = a já definida para `reader_highlight` e notas File Over Apps.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim — sheet no leitor, página `/highlights`, ícone no texto bíblico e item no menu.

#### Stack e convenções de interface

- Svelte 5, SvelteKit, Tailwind, primitives shadcn-svelte (`Sheet`, `Button`, `Sidebar`, `Tabs` já no `BibleNoteSplit`). Geist Sans/Mono. Telas atuais a preservar: navegação de livro/capítulo/versão/busca do `BibleReader`; popover da 0005; listagem `/notes`. Não introduzir React, shadcn/ui nem ReUI.

#### Telas e responsabilidades

- **`/bible` — Leitor**: acionar Destaques nos controles (pílula de ações), ver sheet com a lista, ver ícone ao lado do número, abrir nota em split/abas. Entrada: workspace. Saída: nenhuma escrita nova além da já existente ao editar a nota aberta.
- **`/highlights` — Destaques**: consultar o mesmo conjunto em página própria com `PageHeader` (título Destaques). Entrada: workspace. Saída: só leitura da lista nesta fatia.
- **Menu**: item Destaques em `AppSidebar` (desktop e mobile).

#### Fluxo de informação e navegação

- Controles de `/bible` → sheet (consulta no contexto da leitura).
- Menu Destaques → `/highlights` (consulta fora do capítulo).
- Ícone no versículo → `BibleNoteSplit` na própria `/bible`.
- Breadcrumb: shell OpenBible; em `/highlights` o `PageHeader` é o título da tela atual. A linha da lista não navega para o capítulo.

#### Menus e navegação principal

- Array `links` de `AppSidebar.svelte`: incluir `{ label: 'Destaques', href: '/highlights' }` junto de Bíblia e Notas (depois de Bíblia ou Notas, na mesma lista que já alimenta o menu lateral e a barra mobile). Destinos atuais (Sermões, Estudos, Configurações) permanecem. `aria-current="page"` em `/highlights`.

#### Formulários e ações

- Sem formulário. Ações: abrir/fechar sheet; ir a `/highlights`; acionar ícone da nota. Sem campos novos. Validação: conjunto vazio é estado válido.

#### Composição e disposição

- Sheet: drawer/painel da primitive já usada na busca do reader; lista simples (referência em mono + nome do estilo); desktop e mobile com o mesmo conteúdo.
- `/highlights`: `AppFrame` + cabeçalho de tela + a mesma lista; desktop em largura contínua; mobile com a barra existente.
- Ícone: ao lado do número do versículo, discreto, não pill ornamental; não substitui o número.

#### Blocos React e componentes selecionados

Esta entrega é Svelte, não React. A tabela registra blocos Svelte equivalentes.

| Tela | Bloco | Responsabilidade | Arquivo previsto | Componente | Origem | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| `/bible` | BibleReader | Controles, sheet, ícone, orquestração | `BibleReader.svelte` | Sheet/Button shadcn-svelte | existente | Estender |
| `/bible` | HighlightsList | Renderizar o conjunto workspace-wide | `HighlightsList.svelte` | próprio | novo | Compartilhar com a página |
| `/bible` | BibleNoteSplit | Split/abas ao abrir nota pelo ícone | `BibleNoteSplit.svelte` | Tabs | SPEC-0005 | Reusar; não recriar |
| `/highlights` | HighlightsPage | Página de consulta | `routes/highlights/+page.svelte` | cabeçalho de tela existente | novo | Mesma lista |
| Shell | AppSidebar | Item Destaques | `AppSidebar.svelte` | Sidebar | existente | Estender `links` |

#### Estados e acessibilidade

- Loading: enquanto lê o índice. Vazio: mensagem visível sem fingir dados. Erro de workspace: recuperável. Sucesso: lista ou ícone. Teclado: gatilho do sheet, diálogo, Escape, ícone como botão. Nome acessível do ícone (ex.: “Abrir nota”). `prefers-reduced-motion` no sheet.

#### Contrato CRUD

- `/highlights` é consulta, não CRUD: a página reutiliza `PageHeader` só como título. Não usa `DataGrid`, não exige coluna `ID` visível, nem botões de editar ou apagar na lista. Apagar destaque permanece no popover da SPEC-0005. Sem criar destaque nesta tela.

#### Revisão visual durante o desenvolvimento

- Obrigatória nas tarefas de UI: conferir bordas, espaçamentos, margens, padding e tipografia Geist em 320px e 1440px, tema claro/escuro, lista curta e longa, ícone com e sem highlight no mesmo versículo, barra mobile com o item extra, `prefers-reduced-motion`.

#### APIs expostas

- Nenhuma HTTP. Contratos são funções TypeScript locais.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma API remota.

#### Eventos e outros contratos

- Não aplicável além de eventos DOM do sheet e do botão do ícone.

### 11. Estratégia TDD

- **Unidade**: `listAllReaderHighlights` (conjunto workspace-wide, vazio, sem recorte); `versesWithActiveNote` (cobre intervalo, ignora lixeira/ausência).
- **Integração/contrato**: repositório sql.js em memória; `note_verse_ref` sem escrever em SQLite bíblico.
- **BDD/aceite**: Gherkin da seção 6 como referência; sem arquivos `.feature`.
- **Runner TDD**: Vitest (`bun run --cwd apps/web test:tdd`), já confirmado no perfil e materializado.
- **E2E**: vitest-browser-svelte em `navigation.svelte.spec.ts`, `bible-reader.svelte.spec.ts` e spec da rota `/highlights`.
- **Verificação manual**: só conferência visual do ícone discreto ao lado do número com highlight por baixo, se o teste automático não capturar o pixel.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-006, AC-001 | AC-001 | `reader-highlights-repository.test.ts` `SPECSFY: US-001 FR-001 FR-006 AC-001` | RED 2026-09-03: `listAllReaderHighlights` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-001, FR-001, FR-006, AC-002 | AC-002 | `reader-highlights-repository.test.ts` `SPECSFY: US-001 FR-001 FR-006 AC-002` | RED 2026-09-03: `listAllReaderHighlights` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-001, FR-001, NFR-002, AC-003 | AC-003 | `reader-highlights-repository.test.ts` `SPECSFY: US-001 FR-001 NFR-002 AC-003` | RED 2026-09-03: `listAllReaderHighlights` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-002, FR-002, AC-004 | AC-004 | `highlights-page.test.ts` `SPECSFY: US-002 FR-002 AC-004` | RED 2026-09-03: `highlights/+page.svelte` ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-002, FR-006, AC-005 | AC-005 | `reader-highlights-repository.test.ts` `SPECSFY: US-002 FR-006 AC-005` | RED 2026-09-03: `listAllReaderHighlights` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-002, FR-002, NFR-002, AC-006 | AC-006 | `highlights-page.test.ts` `SPECSFY: US-002 FR-002 NFR-002 AC-006` | RED 2026-09-03: `highlights/+page.svelte` ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-003, NFR-001, AC-007 | AC-007 | `reader-note-indicators.test.ts` `SPECSFY: US-003 FR-003 NFR-001 AC-007` | RED 2026-09-03: `versesCoveredByActiveNotes` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-004, AC-008 | AC-008 | `bible-reader.svelte.spec.ts` `SPECSFY: US-003 FR-004 AC-008` | RED 2026-09-03: botão Abrir nota ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-004, NFR-003, AC-009 | AC-009 | `bible-reader.svelte.spec.ts` `SPECSFY: US-003 FR-004 NFR-003 AC-009` | RED 2026-09-03: botão Abrir nota ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-003, AC-010 | AC-010 | `reader-note-indicators.test.ts` `SPECSFY: US-003 FR-003 AC-010` | RED 2026-09-03: `versesCoveredByActiveNotes` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-003, NFR-002, AC-011 | AC-011 | `reader-note-indicators.test.ts` `SPECSFY: US-003 FR-003 NFR-002 AC-011` | RED 2026-09-03: `versesCoveredByActiveNotes` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-003, FR-005, NFR-003, AC-012 | AC-012 | `reader-note-indicators.test.ts` `SPECSFY: US-003 FR-005 NFR-003 AC-012` | RED 2026-09-03: `versesCoveredByActiveNotes` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| FR-005, AC-013 | AC-013 | `reader-note-indicators.test.ts` `SPECSFY: FR-005 AC-013` | RED 2026-09-03: `noteIndicatorAppliesHighlightStyle` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| FR-004, NFR-001, AC-014 | AC-014 | `bible-reader.svelte.spec.ts` `SPECSFY: FR-004 NFR-001 AC-014` | RED 2026-09-03: botão Destaques ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| NFR-002, AC-015 | AC-015 | `reader-highlights-repository.test.ts` `SPECSFY: NFR-002 AC-015` | RED 2026-09-03: `listAllReaderHighlights` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| US-002, FR-002, NFR-001, AC-016 | AC-016 | `navigation.svelte.spec.ts` `SPECSFY: US-002 FR-002 NFR-001 AC-016` | RED 2026-09-03: link Destaques ausente | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |
| FR-005, NFR-003, AC-017 | AC-017 | `reader-note-indicators.test.ts` `SPECSFY: FR-005 NFR-003 AC-017` | RED 2026-09-03: `isNoteIndicatorHighlightStyle` é `undefined` | GREEN 2026-09-03: T018–T027 | GREEN 2026-09-03: bun run --cwd apps/web test:tdd — 136 passed; 1 falha pré-existente (intervalo popover) |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| FR-001 | AC-002 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| FR-001 | AC-003 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| FR-002 | AC-004 | Unidade | `highlights-page.test.ts` | RED 2026-09-03 |
| FR-002 | AC-006 | Unidade | `highlights-page.test.ts` | RED 2026-09-03 |
| FR-002 | AC-016 | Browser | `navigation.svelte.spec.ts` | RED 2026-09-03 |
| FR-003 | AC-007 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-003 | AC-010 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-003 | AC-011 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-004 | AC-008 | Browser | `bible-reader.svelte.spec.ts` | RED 2026-09-03 |
| FR-004 | AC-009 | Browser | `bible-reader.svelte.spec.ts` | RED 2026-09-03 |
| FR-004 | AC-014 | Browser | `bible-reader.svelte.spec.ts` | RED 2026-09-03 |
| FR-005 | AC-012 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-005 | AC-013 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-005 | AC-017 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| FR-006 | AC-001 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| FR-006 | AC-002 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| FR-006 | AC-005 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| NFR-001 | AC-001 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| NFR-001 | AC-007 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| NFR-001 | AC-014 | Browser | `bible-reader.svelte.spec.ts` | RED 2026-09-03 |
| NFR-002 | AC-003 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| NFR-002 | AC-011 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| NFR-002 | AC-015 | Unidade | `reader-highlights-repository.test.ts` | RED 2026-09-03 |
| NFR-003 | AC-009 | Browser | `bible-reader.svelte.spec.ts` | RED 2026-09-03 |
| NFR-003 | AC-012 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |
| NFR-003 | AC-017 | Unidade | `reader-note-indicators.test.ts` | RED 2026-09-03 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md`
- **Achados**: Formato Specsfy/2.0 válido; 3 US, 6 FR, 3 NFR e 17 AC; cada US/FR/NFR tem ≥3 AC em **Cobre**; interface Svelte completa na seção 10; research local verificado. Sem BLOCKER. Findings abaixo, nenhum P1 Open.
- **FIND-PROD-001** [P2] [Resolved] Lista vazia precisa ser observável — Refs: US-001, US-002, FR-001, FR-002, AC-003, AC-006 — Evidence: specs/backlog/0006-lista-highlights-indicador-nota-leitor.md — Effect: sem estado vazio a consulta fingiria dados — Suggestion: AC-003 e AC-006 cobrem sheet e página vazios
- **FIND-ARCH-001** [P1] [Resolved] Consulta workspace-wide não pode gravar em `bibles/*.sqlite` nem criar tabela — Refs: NFR-002, AC-015, DEC-004 — Evidence: .specsfy/DATABASE.md — Effect: schema novo ou escrita bíblica viola File Over Apps — Suggestion: só SELECT em `reader_highlight` e `note_verse_ref`
- **FIND-SEC-001** [P2] [Resolved] Destaques e notas permanecem locais — Refs: NFR-002, PR-004 — Evidence: .specsfy/USER-PROFILE.md — Effect: rede nova vazaria texto bíblico e notas — Suggestion: NFR-002 sem HTTP nesta fatia

#### Gate do Ato II — Plano

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md`
- **Achados**: 27 tarefas; T001–T017 [TEST][TDD] concluídas com RED observado; T018–T027 abertas para o implementador. Predecessores TDD das tarefas [CODE] estão concluídos. Sem BLOCKER.

#### Gate do Ato III — Entrega

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md .`
- **Achados**: T018–T027 concluídas; bun run --cwd apps/web test:tdd 136/137 (falha pré-existente fora da fatia); rastreabilidade 29/29 IDs da spec.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-001, FR-001, FR-006, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001 e confirmar que `listAllReaderHighlights` ainda não lista o workspace.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-001 FR-001 FR-006 NFR-001 AC-001`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido (`bun run --cwd apps/web test:tdd`).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-001, FR-001, FR-006, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002 e confirmar o recorte indevido por capítulo.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-001 FR-001 FR-006 AC-002`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T003 [TEST] [TDD] [US-001] Derivar do AC-003 caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003 (lista vazia, sem escrita bíblica).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-001 FR-001 NFR-002 AC-003`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T004 [TEST] [TDD] [US-002] Derivar do AC-004 caso Vitest falhando em apps/web/src/lib/features/bible/highlights-page.test.ts — Refs: US-002, FR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004 e confirmar que a rota `/highlights` não existe.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-002 FR-002 AC-004`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T005 [TEST] [TDD] [US-002] Derivar do AC-005 caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-002, FR-006, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005 (mesmo conjunto nas duas superfícies).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-002 FR-006 AC-005`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T006 [TEST] [TDD] [US-002] Derivar do AC-006 caso Vitest falhando em apps/web/src/lib/features/bible/highlights-page.test.ts — Refs: US-002, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-006 (página vazia).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-002 FR-002 NFR-002 AC-006`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T007 [TEST] [TDD] [US-003] Derivar do AC-007 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: US-003, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007 (ícone quando há uma nota ativa).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-003 NFR-001 AC-007`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T008 [TEST] [TDD] [US-003] Derivar do AC-008 caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-003, FR-004, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-008 (split desktop).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-004 AC-008`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T009 [TEST] [TDD] [US-003] Derivar do AC-009 caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-003, FR-004, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-009 (abas mobile).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-004 NFR-003 AC-009`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T010 [TEST] [TDD] [US-003] Derivar do AC-010 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: US-003, FR-003, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-010 (sem ícone sem nota).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-003 AC-010`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T011 [TEST] [TDD] [US-003] Derivar do AC-011 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: US-003, FR-003, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-011 (lixeira sem ícone).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-003 NFR-002 AC-011`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T012 [TEST] [TDD] [US-003] Derivar do AC-012 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: US-003, FR-005, NFR-003, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-012 (coexistência sem vínculo).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-003 FR-005 NFR-003 AC-012`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T013 [TEST] [TDD] Derivar do AC-013 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: FR-005, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-013 (DEC-002 da 0005).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: FR-005 AC-013`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T014 [TEST] [TDD] Derivar do AC-014 caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: FR-004, NFR-001, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-014 (teclado no sheet e no ícone).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: FR-004 NFR-001 AC-014`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T015 [TEST] [TDD] Derivar do AC-015 caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: NFR-002, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-015 (sem tabela nova, sem escrita bíblica).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: NFR-002 AC-015`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T016 [TEST] [TDD] [US-002] Derivar do AC-016 caso Vitest falhando em apps/web/src/routes/navigation.svelte.spec.ts — Refs: US-002, FR-002, NFR-001, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-016 (item Destaques no menu).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: US-002 FR-002 NFR-001 AC-016`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T017 [TEST] [TDD] Derivar do AC-017 caso Vitest falhando em apps/web/src/lib/features/bible/reader-note-indicators.test.ts — Refs: FR-005, NFR-003, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-017 (ícone ≠ paleta Q6).
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY: FR-005 NFR-003 AC-017`, sem `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste TDD, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

#### Fase 2 — Fundação da lista e do indicador

**Objetivo**: Consultar `reader_highlight` do workspace e decidir quais versículos mostram ícone, sem schema novo.
**Teste independente**: `bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights-repository.test.ts src/lib/features/bible/reader-note-indicators.test.ts`

- [x] T018 [CODE] [US-001] Implementar `listAllReaderHighlights` em apps/web/src/lib/features/bible/reader-highlights-repository.ts — Refs: US-001, US-002, FR-001, FR-006, NFR-002, AC-001, AC-002, AC-003, AC-005, AC-015 — Depends: T001, T002, T003, T005, T015
  - [x] **PREP**: Confirmar RED dos T001–T003/T005/T015; carregar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Acrescentar SELECT workspace-wide sem `CREATE TABLE` novo e sem escrever em `bibles/*.sqlite`.
  - [x] **VERIFY**: GREEN dos testes de repositório da Fase 1.
  - [x] **VISUAL**: Não aplicável porque a tarefa só altera o repositório SQLite auxiliar, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos; comentário specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria de consulta ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T018","refs":["US-001","US-002","FR-001","FR-006","NFR-002","AC-001","AC-002","AC-003","AC-005","AC-015"],"files":["apps/web/src/lib/features/bible/reader-highlights-repository.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights-repository.test.ts","exit":0}]} -->

- [x] T019 [CODE] [US-003] Implementar `versesCoveredByActiveNotes` em apps/web/src/lib/features/bible/reader-note-indicators.ts — Refs: US-003, FR-003, FR-005, NFR-002, AC-007, AC-010, AC-011, AC-012, AC-013, AC-017 — Depends: T007, T010, T011, T012, T013, T017
  - [x] **PREP**: Confirmar RED dos indicadores; carregar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Derivar números de versículo cobertos por `note_verse_ref` ativo; sem vínculo com `reader_highlight`.
  - [x] **VERIFY**: GREEN de `reader-note-indicators.test.ts`.
  - [x] **VISUAL**: Não aplicável porque a tarefa só altera funções de domínio, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos; comentário specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria de cobertura de intervalo ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T019","refs":["US-003","FR-003","FR-005","NFR-002","AC-007","AC-010","AC-011","AC-012","AC-013","AC-017"],"files":["apps/web/src/lib/features/bible/reader-note-indicators.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-note-indicators.test.ts","exit":0}]} -->

#### Fase de interface

- [x] T020 [CODE] [US-001] Implementar o sheet de destaques nos controles de apps/web/src/lib/features/bible/BibleReader.svelte e apps/web/src/lib/features/bible/HighlightsList.svelte — Refs: US-001, FR-001, FR-006, NFR-001, AC-001, AC-002, AC-003, AC-014 — Depends: T001, T002, T003, T014, T018
  - [x] **PREP**: Confirmar seção 10 (sheet pelos controles, primitive `Sheet`); stack Svelte 5; `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Botão Destaques na pílula de ações; sheet com `HighlightsList`; estados vazio/sucesso; Escape.
  - [x] **VERIFY**: Exercitar abertura, teclado e conjunto workspace-wide.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist do sheet em 320px e 1440px, tema claro/escuro.
  - [x] **EVIDENCE**: Registrar arquivos, comando e resultado; specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria de sheet ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","FR-001","FR-006","NFR-001","AC-001","AC-002","AC-003","AC-014"],"files":["apps/web/src/lib/features/bible/BibleReader.svelte","apps/web/src/lib/features/bible/HighlightsList.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T021 [CODE] [US-002] Implementar a página de destaques em apps/web/src/routes/highlights/+page.svelte — Refs: US-002, FR-002, FR-006, NFR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006, T018
  - [x] **PREP**: Confirmar seção 10 da página `/highlights`; `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Rota com `AppFrame`, cabeçalho Destaques e a mesma `HighlightsList`; estado vazio; incluir `/highlights` no PWA se o app shell listar rotas.
  - [x] **VERIFY**: Página lista o mesmo conjunto do sheet.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist da página em 320px e 1440px, lista curta e longa.
  - [x] **EVIDENCE**: Registrar arquivos, comando e resultado; specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria de página ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T021","refs":["US-002","FR-002","FR-006","NFR-002","AC-004","AC-005","AC-006"],"files":["apps/web/src/routes/highlights/+page.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/highlights-page.test.ts","exit":0}]} -->

- [x] T022 [CODE] [US-003] Implementar o ícone de nota e a abertura no split em apps/web/src/lib/features/bible/BibleReader.svelte — Refs: US-003, FR-003, FR-004, FR-005, NFR-001, NFR-003, AC-007, AC-008, AC-009, AC-010, AC-014 — Depends: T007, T008, T009, T010, T014, T019
  - [x] **PREP**: Confirmar DEC-003 e reuso de `BibleNoteSplit`; `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Ícone discreto ao lado do número; clique chama `readNote` e preenche `note` do split; sem markup de highlight.
  - [x] **VERIFY**: Ícone, split desktop, abas mobile e teclado.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do ícone ao lado do número, com e sem highlight, 320px e 1440px.
  - [x] **EVIDENCE**: Registrar arquivos, comando e resultado; specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria do ícone ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T022","refs":["US-003","FR-003","FR-004","FR-005","NFR-001","NFR-003","AC-007","AC-008","AC-009","AC-010","AC-014"],"files":["apps/web/src/lib/features/bible/BibleReader.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T023 [CODE] [US-002] Incluir Destaques em apps/web/src/lib/features/navigation/AppSidebar.svelte — Refs: US-002, FR-002, NFR-001, AC-016 — Depends: T016, T004, T006
  - [x] **PREP**: Confirmar o array `links` compartilhado; `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Item Destaques → `/highlights` junto de Bíblia e Notas no menu lateral e na barra mobile; `aria-current`.
  - [x] **VERIFY**: `navigation.svelte.spec.ts` encontra o destino.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da barra mobile com o destino extra em 320px.
  - [x] **EVIDENCE**: Registrar arquivos, comando e resultado; specsfy:evidence ao concluir.
  - [x] **IMPROVE**: Aplicar melhoria de navegação ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T023","refs":["US-002","FR-002","NFR-001","AC-016"],"files":["apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/navigation.svelte.spec.ts","exit":0}]} -->

- [x] T024 [DOC] [US-002] Registrar sheet, página, ícone e menu em INTERFACE.md — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, AC-001, AC-004, AC-007, AC-016 — Depends: T020, T021, T022, T023
  - [x] **PREP**: Inventariar blocos criados ou estendidos na seção 10.
  - [x] **EXECUTE**: Atualizar `INTERFACE.md` com finalidade, arquivo, estados, consumidores e regra de reaproveitamento.
  - [x] **VERIFY**: Cada bloco da seção 10 aparece na tabela.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação de interface.
  - [x] **EVIDENCE**: Registrar o diff de `INTERFACE.md`.
  - [x] **IMPROVE**: Aplicar melhoria editorial ou justificar nenhuma.

#### Fase final — Qualidade

- [x] T025 [DOC] Revisar PROJECT.md com a rota `/highlights` em PROJECT.md — Refs: US-002, FR-002, AC-004, AC-016 — Depends: T021, T023
  - [x] **PREP**: Comparar a capacidade nova com o texto atual de `PROJECT.md`.
  - [x] **EXECUTE**: Mencionar consulta de destaques em `/highlights` e o ícone no leitor, ou justificar ausência de impacto material.
  - [x] **VERIFY**: `PROJECT.md` não contradiz a spec.
  - [x] **VISUAL**: Não aplicável porque a tarefa só revisa documentação de produto.
  - [x] **EVIDENCE**: Registrar o diff ou a justificativa.
  - [x] **IMPROVE**: Aplicar melhoria editorial ou justificar nenhuma.

- [x] T026 [DOC] Registrar a consulta workspace-wide em .specsfy/DATABASE.md — Refs: FR-001, FR-006, NFR-002, AC-002, AC-015 — Depends: T018
  - [x] **PREP**: Ler o inventário atual de `reader_highlight`.
  - [x] **EXECUTE**: Documentar a listagem workspace-wide de `reader_highlight` sem tabela nova.
  - [x] **VERIFY**: Nenhuma coluna ou tabela inventada.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza o inventário de persistência.
  - [x] **EVIDENCE**: Registrar o diff de `.specsfy/DATABASE.md`.
  - [x] **IMPROVE**: Aplicar melhoria editorial ou justificar nenhuma.

- [x] T027 [TEST] Executar regressão e rastreabilidade em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-002, AC-001, AC-007, AC-016 — Depends: T018, T019, T020, T021, T022, T023
  - [x] **PREP**: Identificar suites TDD, navegação e leitor.
  - [x] **EXECUTE**: `bun run --cwd apps/web test:tdd` e `check_traceability.mjs` da spec.
  - [x] **VERIFY**: Sem gaps de `SPECSFY:` e suites existentes da 0005 ainda passam.
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia no fluxo sheet + página + ícone, ou registrar se a suíte browser já cobriu.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T017 (RED) → T018/T019 → T020/T021/T022/T023 → T024–T026 → T027.
- Tarefas paralelas: T001–T017 podem avançar em paralelo; T018 e T019 em paralelo após seus RED; T020–T023 após a fundação correspondente.
- Estratégia de MVP: lista workspace-wide no sheet e na página já entrega US-001 e US-002; o ícone (US-003) completa a fatia.


## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0005 completed (`reader_highlight`, popover, `BibleNoteSplit`).
- SPEC-0004 (`:::verse`, `note_verse_ref`, lixeira remove refs).
- Primitive `Sheet` e `PageHeader` já no produto.

#### Riscos

- Tratar o ícone como highlight → mitigação: FR-005, AC-012, AC-017, DEC-002 da 0005.
- Lista recortar pelo capítulo aberto por reusar `listChapterHighlights` → mitigação: FR-006, AC-002, AC-005.
- Barra mobile com um destino a mais → mitigação: VISUAL em 320px; mesmo array `links` já compartilhado.
- Misturar bugs de seleção/underline → mitigação: fora de escopo explícito.

#### Suposições

- Rótulo do item e do gatilho: “Destaques”.
- Cada linha da lista mostra a referência bíblica e o nome do estilo já persistidos.
- O mesmo array `links` alimenta menu lateral e barra mobile.
- Clique no ícone com várias notas no mesmo versículo fica fora; os testes usam uma nota.

### 17. Decisões

- **DEC-001**: A lista (sheet e página) cobre todos os destaques do workspace, qualquer versão/livro/capítulo; as duas superfícies mostram o mesmo conjunto. Alternativa rejeitada: só o capítulo ou só a versão atual.
- **DEC-002**: Sheet pelos controles de `/bible`; página `/highlights` no menu junto de Bíblia e Notas. Alternativa rejeitada: seção em `/notes` ou só vista interna do leitor. Não é o painel permanente excluído na SPEC-0005.
- **DEC-003**: Ícone discreto ao lado do número; clique abre a nota no `BibleNoteSplit`. Alternativa rejeitada: só sinalizar, ou sair para `/notes/[id]`.
- **DEC-004**: Sem schema novo e sem vínculo persistente highlight–nota (preserva DEC-002 da SPEC-0005).

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [x] `INTERFACE.md` registra sheet, página `/highlights`, ícone e item de menu.
- [x] `PROJECT.md` menciona a rota `/highlights` se a capacidade for material.
- [x] `.specsfy/DATABASE.md` registra o uso workspace-wide de `reader_highlight` se a documentação de consulta mudar; sem tabela nova.
- [x] `$specsfy-documentator` reconstrói `docs/` após as tarefas `[CODE]`.
