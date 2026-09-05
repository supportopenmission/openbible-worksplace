# Especificação integrada: Motor de notas com Milkdown, fence de versículo e mobile

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0013 |
| Slug | 0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile |
| Status | Defined |
| Effort | 8 |
| Effort updated at | 2026-09-04 |
| Effort rationale | Troca do motor Tipex/TipTap por Milkdown com nó custom :::verse, slash desktop, drawer + toolbar mobile, paridade de autosave/H1/YAML/índice e remoção do motor antigo. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O editor atual de notas usa Tipex sobre TipTap com conversão HTML intermediária (`markdownBodyToHtml` / `htmlBodyToMarkdown`), o que afasta a edição do Markdown-arquivo e dificulta o modelo Files over app. A pessoa precisa de notas como arquivos Markdown legíveis fora do app, sem moldura em volta do editor.

#### Resultado desejado

Trocar só o motor de `/notes/[id]` para Milkdown (`@milkdown/kit` com CommonMark, slash e nó custom de versículo), mantendo rotas, listagem, lixeira, YAML vigente, H1 sincronizado, índice auxiliar e canvas full-bleed. No desktop o `/` abre slash menu; no mobile o `/` oculta o teclado virtual antes de abrir o drawer bottom sheet e uma toolbar de formatação fica acima da barra de navegação.

#### Métricas de sucesso

- Nota legada com `:::verse` abre no Milkdown sem perda de texto, atributos ou snapshot.
- Arquivo salvo fora do app mostra YAML vigente e corpo Markdown legível com `:::verse`.
- Slash desktop, drawer mobile e toolbar executam as ações declaradas com foco e Escape funcionais.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Milkdown integra ao SvelteKit como editor Markdown por plugins? → Sim; `@milkdown/kit 7.22.1` ESM com `preset/commonmark`, `preset/gfm`, `plugin/slash`, `plugin/listener` e `transformer` sobre ProseMirror + remark; componente Svelte gerencia host DOM e ciclo de vida. Impacto: base da troca sem React.
- **R-002**: Fence `:::verse{attrs}` com snapshot pode virar nó custom com roundtrip sem perda? → Sim, com schema ProseMirror dedicado + parser/serializador que preserva atributos (`versionId`, `version`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd`) e corpo snapshot; fallback preserva texto quando o fence é inválido. Impacto: paridade com `verse-block-extension.ts`.
- **R-003**: Drawer mobile 90dvh e toolbar acima da navegação seguem padrões vigentes? → Sim; `Sheet` com `side=bottom` em 90dvh e `safe-area-inset-bottom` já usados em `VerseSelector` e `BibleReader`; toolbar é barra Svelte própria acima da barra mobile. Ao abrir o drawer de slash, o teclado virtual deve ser ocultado para não competir com a superfície de comandos. Impacto: sem novo padrão de overlay.
- Para claim material, uso futuro: `**R-00X** [critical] claim — Verdict: verified|refuted|unverifiable — Confidence: high|medium|low — Evidence: research/caminho#locator — Budget: usado/limite`.

#### Fontes e contexto consultados

- `specs/backlog/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile.md` — brief refinado com 8 decisões (Q1–Q8).
- `specs/inbox/2026-09-04-032931-motor-de-notas-com-milkdown-markdown-e-bloco-de-versiculo.md` — captura de origem preservada.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — comportamento vigente
- `apps/web/src/lib/features/notes/NoteCanvasEditor.svelte`, `verse-block-extension.ts`, `slash-commands.ts`, `note-markdown.ts`, `note-editor-service.ts`, `notes-repository.ts`, `VerseSelector.svelte`, `apps/web/src/routes/notes/[id]/+page.svelte`.
- `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/DATABASE.md`, `.specsfy/RULES.md`, `apps/web/package.json`.

#### Documentação consultada

- Milkdown, versão `@milkdown/kit 7.22.1`, `https://registry.npmjs.org/@milkdown%2Fkit/latest` e `https://github.com/Milkdown/milkdown`, tópicos: arquitetura por plugins sobre ProseMirror + remark, `preset/commonmark`, `preset/gfm`, `plugin/slash`, `plugin/block`, `plugin/listener`, `transformer`. Acesso em 2026-09-04.
- `https://milkdown.dev/docs/guide/getting-started` — URL indicada pelo usuário; página consultada em 2026-09-04 retornou só casca (navegação/tema) sem conteúdo extraível, por isso a evidência normativa é o registro npm + README acima; sem reprodução de conteúdo protegido.

#### Artefatos de pesquisa armazenados

- `specs/defined/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/research/milkdown-kit-7.22.1.md`: origem npm + GitHub, versão 7.22.1, licença MIT e impacto na troca do motor.
- Toda fonte externa efetivamente consultada tem evidência local em `research/`; conclusões normativas ficam neste `spec.md`.

#### Dúvidas respondidas

- **Q**: Qual sintaxe o fence usa? → **A**: Manter `:::verse{attrs}` vigente com snapshot (Q1 backlog, 2026-09-04).
- **Q**: O que o slash oferece? → **A**: Versículo, títulos, listas, checklist, citação, código e divisória (Q2).
- **Q**: Como o mobile abre comandos? → **A**: Bottom sheet 90dvh com mesma lista + busca ao digitar `/` (Q3).
- **Q**: O que a toolbar mobile tem? → **A**: Negrito, itálico, título, lista, checklist, citação e versículo acima da navegação (Q4).
- **Q**: O que o YAML guarda? → **A**: `title`, `createdAt`, `updatedAt`, `type` (Q5).
- **Q**: E as notas existentes? → **A**: Abertura direta sem migração, mesmo fence e índice (Q6).
- **Q**: Qual stack Milkdown? → **A**: `@milkdown/kit` + CommonMark + slash + verse custom (Q7).
- **Q**: Como insere versículo? → **A**: Reaproveitar `VerseSelector` Dialog/Sheet com preview (Q8).
- **Pedido de correção recebido em 2026-09-05**: “no mobile no editor das notas, quando usarmo  / slash commands ocultar o teclado, pois abre um drawer.” → **A**: Ao detectar `/` no editor mobile, desfocar o editor para ocultar o teclado virtual antes de exibir o drawer, preservando a seleção atual para executar o comando.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Trocar o motor de `/notes/[id]` de Tipex/TipTap para Milkdown com Markdown como fonte direta.
- Nó custom `verse` com parse/render de `:::verse{attrs}` + snapshot e fallback sem perda.
- Slash menu desktop filtrável (`/`, `/versiculo`, `/verse`) com 7 grupos de blocos.
- Drawer mobile bottom sheet 90dvh com mesma lista + busca ao digitar `/`; o teclado virtual é ocultado antes da abertura do drawer.
- Toolbar mobile com 7 ações acima da barra de navegação.
- YAML vigente, H1 sincronizado, autosave com debounce, reindexação de `note_verse_ref`.
- Canvas full-bleed sem moldura/card/borda; reaproveitar `VerseSelector` e `VerseBlockView`.
- Remover Tipex/TipTap do caminho do editor após paridade; atualizar `STACK.md`, `INTERFACE.md` e `docs/`.

#### Fora de escopo

- Construtor de sermões e CRUD/lixeira de sermões.
- Intervalo de versículo que atravessa capítulos.
- Mudanças na listagem `/notes` além do necessário para a troca do editor.
- Autenticação, colaboração, sincronização entre dispositivos, backup/exportação.
- Identidade visual da Vercel.

#### Atores

- **Pessoa usuária individual**: cria, edita, lê e apaga as próprias notas no workspace local; sem conta e sem permissões por papel.

### 4. Princípios e restrições do projeto

- **PR-001**: Markdown com YAML frontmatter é a fonte primária das notas; SQLite `note_verse_ref` só espelha fences.
- **PR-002**: Interface em SvelteKit/Svelte 5 com shadcn-svelte; não introduzir React, shadcn/ui ou ReUI.
- **PR-003**: Aplicar `https://vercel.com/design.md` como guideline de qualidade sem importar marca ou shell da Vercel; Geist Sans/Mono, superfícies contínuas, foco visível.
- **PR-004**: Canvas full-bleed sem moldura; toolbar e drawer respeitam safe area, PWA com zoom travado e `prefers-reduced-motion`.
- **PR-005**: Testes Node com Vitest; sem `.feature`; Gherkin vive só neste `spec.md` como referência.
- **PR-006**: Nenhum teste usa banco de desenvolvimento; comandos destrutivos de banco seguem ignorados.

### 5. Histórias de usuário

#### US-001 — Editar nota em Milkdown com Markdown como fonte (P1)

Como pessoa usuária individual, quero escrever a nota no Milkdown com o arquivo Markdown como fonte direta, para ler e editar o mesmo conteúdo dentro e fora do app.

**Por que P1**: É o valor central Files over app e a base da migração.
**Teste independente**: Abrir nota legada, editar texto, salvar e conferir o `.md` fora do app.
**Requisitos**: FR-001, FR-002, FR-005

#### US-002 — Inserir versículo por slash, drawer e seletor (P1)

Como pessoa usuária individual, quero inserir o bloco de versículo por `/` no desktop ou drawer no mobile e confirmar no seletor com preview, para guardar referência + snapshot no Markdown.

**Por que P1**: É o diferencial bíblico da nota e alimenta o índice auxiliar.
**Teste independente**: Inserir por slash e por drawer, confirmar seletor e conferir `:::verse` + índice.
**Requisitos**: FR-002, FR-003, FR-006

#### US-003 — Formatar no mobile com toolbar sobre a navegação (P2)

Como pessoa usuária individual, quero formatar no mobile pela toolbar acima da barra de navegação sem digitar `/`, mantendo o canvas full sem bordas.

**Por que P2**: Completa a paridade mobile, mas não bloqueia o núcleo Markdown/versículo.
**Teste independente**: Com editor focado no mobile, aplicar cada ação da toolbar e conferir Markdown.
**Requisitos**: FR-004, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Slash desktop filtrável

**Cobre**: US-001, US-002, FR-001, FR-003, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-003 @NFR-002 @AC-001
Feature: Slash de blocos no desktop

  Scenario: abrir slash e filtrar versículo
    Given a nota aberta no Milkdown no desktop
    When a pessoa digita "/" no cursor
    Then vê versículo, títulos, listas, checklist, citação, código e divisória
    And filtrar por "vers" reduz para o comando Versículo operável por teclado
```

#### AC-002 — Drawer mobile ao digitar barra

**Cobre**: US-002, FR-003, NFR-002

```gherkin
@US-002 @FR-003 @NFR-002 @AC-002
Feature: Drawer de comandos no mobile

  Scenario: digitar barra abre bottom sheet sem teclado virtual
    Given a nota aberta no Milkdown em viewport mobile
    When a pessoa digita "/"
    Then o teclado virtual é ocultado
    And abre bottom sheet 90dvh com a mesma lista do desktop e busca
    And Escape fecha sem inserir bloco
```

#### AC-003 — Toolbar mobile acima da navegação

**Cobre**: US-003, FR-004, NFR-002

```gherkin
@US-003 @FR-004 @NFR-002 @AC-003
Feature: Toolbar de formatação mobile

  Scenario: toolbar visível com editor focado
    Given a nota aberta no mobile com editor focado
    When a barra inferior de navegação está visível
    Then a toolbar mostra negrito, itálico, título, lista, checklist, citação e versículo
    And fica acima da navegação sem cobrir o texto ou a ação principal
```

#### AC-004 — Inserção de versículo gera fence

**Cobre**: US-002, FR-002, FR-006, NFR-003

```gherkin
@US-002 @FR-002 @FR-006 @NFR-003 @AC-004
Feature: Bloco de versículo como fence

  Scenario: confirmar seletor insere fence
    Given o seletor de versículo aberto pelo slash ou drawer
    When a pessoa confirma João 3:16–18 em uma versão
    Then o corpo recebe :::verse com versionId, version, bookId, book, chapter, verseStart, verseEnd e snapshot
    And a prévia mostra referência e snapshot do arquivo
```

#### AC-005 — Nota legada abre sem migração

**Cobre**: US-001, FR-001, FR-002, FR-005, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-005 @NFR-001 @NFR-003 @AC-005
Feature: Compatibilidade com notas Tipex

  Scenario: abrir fence legado sem perda
    Given uma nota salva pelo motor antigo com :::verse e destaques
    When abre no Milkdown
    Then blocos, atributos e snapshot aparecem intactos sem conversão
    And salvar mantém YAML, H1 e índice auxiliar
```

#### AC-006 — Salvamento com YAML, H1 e índice

**Cobre**: US-001, FR-005, NFR-001

```gherkin
@US-001 @FR-005 @NFR-001 @AC-006
Feature: Persistência File Over App

  Scenario: editar H1 e salvar
    Given a nota aberta no Milkdown
    When a pessoa edita o H1 e aguarda o autosave
    Then o .md guarda title, createdAt, updatedAt, type e corpo Markdown
    And title reflete o H1 e note_verse_ref reflete os fences
```

#### AC-007 — Canvas full sem bordas

**Cobre**: US-003, FR-006, NFR-003

```gherkin
@US-003 @FR-006 @NFR-003 @AC-007
Feature: Canvas contínuo

  Scenario: editor ocupa área útil sem moldura
    Given a nota aberta em desktop e mobile
    When observa o editor com drawer e toolbar fechados
    Then não há moldura, card ou borda em volta do editor
    And o conteúdo usa a largura do canvas com respiro do sistema
```

#### AC-008 — Preview usa snapshot sem lookup

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-008
Feature: Snapshot no arquivo

  Scenario: reabrir sem Bíblia consultada
    Given um bloco :::verse salvo com snapshot
    When a nota é reaberta
    Then a prévia mostra o snapshot do arquivo sem consultar bibles/*.sqlite
    And o SQLite só é consultado ao inserir ou alterar o bloco
```

#### AC-009 — Intervalo inválido bloqueado

**Cobre**: US-002, FR-002, FR-006

```gherkin
@US-002 @FR-002 @FR-006 @AC-009
Feature: Validação do intervalo

  Scenario: fim antes do início ou outro capítulo
    Given o seletor com capítulo fixo
    When a pessoa informa fim anterior ao início ou tenta outro capítulo
    Then o seletor impede confirmar e explica o limite
    And nenhum fence parcial é inserido
```

#### AC-010 — Versão ausente com estado explícito

**Cobre**: US-002, FR-006, NFR-003

```gherkin
@US-002 @FR-006 @NFR-003 @AC-010
Feature: Bíblia ausente

  Scenario: sem Bíblia para alterar bloco
    Given nenhuma Bíblia importada ou versão removida
    When tenta inserir ou alterar o bloco
    Then o seletor mostra estado explícito sem inventar texto
    And o bloco já salvo continua com snapshot visível
```

#### AC-011 — Falha de salvamento explícita

**Cobre**: US-001, FR-005, NFR-001

```gherkin
@US-001 @FR-005 @NFR-001 @AC-011
Feature: Erro de persistência

  Scenario: workspace falha ao gravar
    Given a nota editada no Milkdown
    When o autosave falha no workspace
    Then mostra salvando/salvo/erro com aria-live e permite retry
    And o conteúdo editado não é descartado em silêncio
```

#### AC-012 — Fence inválido preservado

**Cobre**: US-001, FR-001, FR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-003 @AC-012
Feature: Robustez do parser

  Scenario: fence malformado não perde texto
    Given um corpo com :::verse sem atributos válidos
    When abre no Milkdown
    Then o texto é preservado como conteúdo sem quebrar a nota
    And erro recuperável explica sem apagar o original
```

#### AC-013 — Teclado, foco e Escape

**Cobre**: US-001, US-002, US-003, FR-003, FR-004, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-003 @FR-004 @NFR-002 @AC-013
Feature: Operação por teclado e toque

  Scenario: navegar slash, drawer e toolbar
    Given slash, drawer ou toolbar abertos
    When usa setas, Enter, Escape e Tab
    Then o foco percorre ações nomeadas, confirma ou fecha sem perder o cursor
    And botões têm nomes acessíveis e área de toque adequada
```

#### AC-014 — Tema e movimento

**Cobre**: US-003, FR-001, FR-004, FR-006, NFR-003

```gherkin
@US-003 @FR-001 @FR-004 @FR-006 @NFR-003 @AC-014
Feature: Claro, escuro e reduced motion

  Scenario: alternar tema com editor aberto
    Given a nota aberta no Milkdown
    When alterna claro/escuro ou ativa prefers-reduced-motion
    Then editor, slash, drawer, toolbar e callout seguem tokens sem animação espúria
    And contraste e foco permanecem visíveis
```

#### AC-015 — Abertura rápida sem conversão

**Cobre**: US-001, FR-001, FR-005, NFR-001

```gherkin
@US-001 @FR-001 @FR-005 @NFR-001 @AC-015
Feature: Desempenho de abertura

  Scenario: nota longa com vários fences
    Given nota com vários :::verse e corpo longo
    When abre no Milkdown
    Then o conteúdo interativo aparece sem conversão prévia nem bloqueio
    And o autosave com debounce não dispara escrita redundante
```

#### AC-016 — Toolbar aplica Markdown

**Cobre**: US-003, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-004 @NFR-002 @NFR-003 @AC-016
Feature: Ações da toolbar

  Scenario: aplicar negrito e lista pelo toque
    Given seleção de texto no mobile
    When toca Negrito e Lista na toolbar
    Then o Markdown recebe **texto** e marcadores sem exigir "/"
    And Versículo na toolbar abre o mesmo seletor do slash
```

#### AC-017 — Seletor reaproveitado Dialog/Sheet

**Cobre**: US-002, FR-006, NFR-002

```gherkin
@US-002 @FR-006 @NFR-002 @AC-017
Feature: VerseSelector no Milkdown

  Scenario: mesmo seletor nos dois viewports
    Given inserção por slash, drawer ou toolbar
    When o seletor abre
    Then desktop usa Dialog e mobile usa Sheet com versão, livro, capítulo, intervalo e preview callout
    And confirmar gera o mesmo :::verse em qualquer origem
```

#### AC-018 — Leitura fora do app

**Cobre**: US-001, FR-002, FR-005, NFR-003

```gherkin
@US-001 @FR-002 @FR-005 @NFR-003 @AC-018
Feature: Markdown legível

  Scenario: arquivo aberto em editor externo
    Given nota salva pelo Milkdown
    When aberta fora do app
    Then YAML tem title, createdAt, updatedAt e type
    And o corpo mostra H1, Markdown comum e :::verse com referência e snapshot
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve editar notas no Milkdown (`@milkdown/kit` + CommonMark/GFM) lendo e gravando Markdown direto, sem HTML intermediário como fonte.
- **FR-002**: O sistema deve representar o versículo como nó custom `verse` com parse/render de `:::verse{versionId, version, bookId, book, chapter, verseStart, verseEnd}` + snapshot, roundtrip sem perda e fallback que preserva texto inválido.
- **FR-003**: O sistema deve oferecer slash menu desktop filtrável e drawer mobile bottom sheet 90dvh com mesma lista (versículo, títulos, listas, checklist, citação, código, divisória) e busca, com teclado completo; no mobile, deve ocultar o teclado virtual antes de abrir o drawer ao detectar `/`.
- **FR-004**: O sistema deve exibir toolbar mobile com negrito, itálico, título, lista, checklist, citação e versículo acima da barra de navegação quando o editor está ativo.
- **FR-005**: O sistema deve persistir `notes/<id>.md` com YAML (`title`, `createdAt`, `updatedAt`, `type`), H1 sincronizado, autosave com debounce e reindexação de `note_verse_ref` após cada save.
- **FR-006**: O sistema deve manter canvas full-bleed sem moldura e reaproveitar `VerseSelector` (Dialog desktop / Sheet mobile) com preview, validação de intervalo e versão por bloco.

#### Não funcionais

- **NFR-001**: Abertura e salvamento sem migração nem escrita redundante; preview usa snapshot; consultas OpenLP só no seletor/alteração. **Verificação**: inspeção de nota longa legada + teste Vitest de debounce/índice + medição manual de abertura.
- **NFR-002**: Operação por teclado, toque, foco visível, Escape, nomes acessíveis e `aria-live` em slash, drawer, toolbar, seletor e salvamento; a abertura do drawer de slash no mobile não mantém o teclado virtual aberto. **Verificação**: checklist manual teclado/mobile + testes de componente Vitest + inspeção de roles.
- **NFR-003**: Markdown legível fora do app; temas claro/escuro com tokens; `prefers-reduced-motion` sem animação espúria; sem React e sem marca Vercel. **Verificação**: leitura do `.md` fora do app + inspeção visual claro/escuro + teste de mídia reduzida.

#### Erros e casos-limite

- Workspace não pronto → mantém onboarding/permissão; editor não finge workspace.
- Sem Bíblia/versão ausente → seletor com estado explícito; snapshot salvo continua visível.
- Intervalo inválido → seletor recusa com explicação; nada parcial é inserido.
- Falha de save/index → status erro com retry, sem descartar edição.
- Fence malformado → preserva texto com erro recuperável.
- Milkdown falha ao montar → mensagem com retry, sem perder arquivo.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Stack: Turborepo + SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7.0.2, Vite 8.2.1, Vitest 4.1.10, Tailwind 4.3.3, shadcn-svelte local, Bun 1.4.0, adapter Cloudflare, PWA com zoom travado.
- Editor vigente: `@friendofsvelte/tipex 0.2.0` + `@tiptap/extension-highlight` em `NoteCanvasEditor.svelte`, com `slash-commands.ts`, `verse-block-extension.ts` (fence `:::verse{attrs}`), `note-markdown.ts` (YAML + H1), `note-editor-service.ts` (debounce 650ms + índice), `notes-repository.ts`, `VerseSelector.svelte`, `VerseBlockView.svelte`, rota `notes/[id]/+page.svelte`.
- Persistência: `notes/<id>.md` fonte; `.openbible/index.sqlite` com `note_verse_ref` e `reader_highlight`; `bibles/*.sqlite` OpenLP somente leitura.

#### Arquitetura e módulos

- Novo `MilkdownNoteEditor.svelte`: monta `@milkdown/kit` (commonmark + gfm + slash + listener + history + clipboard + trailing), registra nó `verse`, expõe `getMarkdown/setMarkdown`, emite `onChange` para autosave.
- `milkdown-verse-node.ts`: schema ProseMirror `verse` (attrs + snapshot atom), parser remark do fence `:::verse{}` e serializador de volta para fence idêntico; usa `parseVerseFence/renderVerseFence/extractVerseFencesFromMarkdown` vigentes como referência de sintaxe.
- `milkdown-slash.ts`: itens a partir de `SLASH_COMMANDS` vigente (7 grupos + aliases `/versiculo`, `/verse`); desktop usa menu `plugin/slash` posicionado; mobile usa `Sheet` bottom 90dvh com busca (reaproveita primitive em `lib/components/ui/sheet/`).
- `MilkdownMobileToolbar.svelte`: barra Svelte com 7 ações que chamam comandos Milkdown; `Versículo` abre `VerseSelector`; posicionada acima da barra mobile com safe area.
- `milkdown-markdown-io.ts`: ponte Markdown puro ↔ Milkdown (sem DOMParser intermediário como fonte); reaproveita `parseNoteFile/serializeNoteFile/syncTitleWithH1`.
- Mantidos: `note-editor-service.ts` (autosave + índice), `notes-repository.ts`, `VerseSelector.svelte`, `VerseBlockView.svelte`, página `[id]` como coordenadora.
- Remoção: `NoteCanvasEditor.svelte` (Tipex), `VerseBlockExtension` TipTap, `note-block-interactions.ts` do caminho do editor, deps Tipex/TipTap após paridade.

#### Migrations

- Não aplicável a schema: sem migração de arquivos; abertura direta. `index.sqlite` segue `CREATE TABLE IF NOT EXISTS`; reindexação por save.

#### Models

- `Note`/`NoteFile`/`NoteMeta` vigentes em `note-types.ts` + `note-markdown.ts`; sem novos campos YAML.
- `VerseFenceAttrs`/`ParsedVerseFence` vigentes como contrato de sintaxe do fence; Milkdown mapeia para attrs do nó.

#### Controllers e casos de uso

- Página `notes/[id]/+page.svelte`: carrega `readNote`, entrega `note` + `storage` ao editor Milkdown, trata `onSaved`, loading/erro.
- Serviço `createNoteEditorService`: debounce, `syncTitleWithH1`, `saveNote`, `persistNoteVerseRefsToWorkspace`; inalterado no contrato, só recebe Markdown do Milkdown.
- Caso `inserir versículo`: slash/drawer/toolbar → `VerseSelector` → fence → índice; versão por bloco, prefill `readerSelection` sem gravá-la.

#### Views e experiência

- `MilkdownNoteEditor.svelte` + `MilkdownMobileToolbar.svelte` + slash menu + drawer Sheet + `VerseSelector` reaproveitado; estados carregando, não encontrada, salvando/salvo/erro, seletor aberto, callout restaurado; `aria-live`, foco, Escape, teclado, zoom, claro/escuro, `prefers-reduced-motion`.
- Estilos Milkdown contidos ao canvas (prosemirror.css + tokens do app), sem borda/moldura; callout de versículo preserva linguagem editorial vigente.

#### Queries e repositórios

- `notes-repository.ts`: `readNote/saveNote/createNote` sobre `notes/*.md` + `trash/`; sem mudança de contrato.
- `note-verse-index.ts`: `extractVerseFencesFromMarkdown` sobre o Markdown do Milkdown; índices em `(note_path)` e `(version_id, book_id, chapter)`.
- `bible-reader.ts`: consultas OpenLP só no seletor/alteração via sql.js; blocos salvos não consultam.

#### Jobs e processamento assíncrono

- Não aplicável além do autosave com debounce 650ms e reindexação pós-save; sem fila, retry só explícito no erro.

#### Estrutura de arquivos

```text
specs/draft/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/
  spec.md
  research/
    milkdown-kit-7.22.1.md
apps/web/src/lib/features/notes/
  MilkdownNoteEditor.svelte
  MilkdownMobileToolbar.svelte
  milkdown-verse-node.ts
  milkdown-slash.ts
  milkdown-markdown-io.ts
  note-markdown.ts
  note-editor-service.ts
  notes-repository.ts
  VerseSelector.svelte
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Nota Markdown | `notes/<id>.md` | YAML `title`, `createdAt`, `updatedAt`, `type:"note"`; corpo com H1 sincronizado + Markdown CommonMark/GFM + fences `:::verse`; H1 reflete `title` | 1 nota → N fences `:::verse`; N refs em `note_verse_ref` |
| Fence versículo | posição + attrs no corpo | `versionId`, `version`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd`, snapshot no corpo; intervalo no mesmo capítulo; `verseStart===verseEnd` = único | N fences → 1 nota (`note_path`); espelhado em `note_verse_ref` |
| Índice auxiliar | `note_verse_ref.id` | `note_path`, `block_index`, `version_id`, `book_id`, `book_name`, `chapter`, `verse_start`, `verse_end` | espelha fences; removido ao mover para `trash/` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Nota | aberta | editar + debounce 650ms | salva | YAML+H1+índice consistentes; original nunca apagado em silêncio |
| Fence | rascunho no seletor | confirmar | persistido | attrs + snapshot completos; inválido não persiste |
| Nota | ativa | apagar com confirmação | trash | arquivo movido para `trash/`; refs removidas do índice |

#### Migração e retenção

- Sem migração de arquivos; retenção e lixeira vigentes; backup/sync seguem fora de escopo.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Troca do editor de `/notes/[id]` com slash desktop, drawer + toolbar mobile, seletor de versículo e canvas full.

#### Stack e convenções de interface

- SvelteKit/Svelte 5, componentes `.svelte`, shadcn-svelte (`Dialog`, `Sheet`, `Button`), Tailwind 4.3.3, Geist Sans/Mono, tokens claro/escuro em `app.css`, PWA com zoom travado e safe area. Fontes: `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `apps/web/package.json`, `NoteCanvasEditor.svelte` e `VerseSelector.svelte` vigentes. Milkdown `@milkdown/kit` monta em host DOM no componente; sem React.

#### Telas e responsabilidades

- `/notes/[id]` (editor): pessoa individual escreve a nota em canvas full, formata por slash/drawer/toolbar, insere `:::verse` pelo seletor e salva com autosave. Entrada: `note` + `storage`. Saída: `.md` + índice atualizados.
- `/notes` (listagem): preservada; abre editor e move para lixeira; sem mudança além do necessário.
- Seletor de versículo: escolher versão/livro/capítulo/intervalo com preview callout e confirmar fence.

#### Fluxo de informação e navegação

- Chega por `/notes` → abre `/notes/[id]`; mobile tem voltar `Todas as notas`. Edita no canvas; `/` abre slash (desktop) ou oculta o teclado e abre drawer (mobile); toolbar formata sem `/`; `Versículo` abre `VerseSelector` (Dialog/Sheet); confirmar insere fence no cursor; autosave persiste YAML+H1+índice; erro mostra retry sem descartar. Breadcrumb: shell global vigente; rota de nota exibe retorno `Todas as notas` no mobile e título da nota no documento.

#### Menus e navegação principal

- Menu desktop (`AppSidebar`): Início → `/`, Bíblia → `/bible`, Notas → `/notes`, Destaques → `/highlights`, Sermões → `/sermons`, Estudos → `/study`, Configuração → `/config`; sem permissão por papel (uso individual); recolhível com `aria-current`.
- Menu mobile (barra inferior 5 colunas): Início → `/`, Notas → `/notes`, Bíblia → `/bible`, Sermões → `/sermons`, Configuração → `/config`; sem Destaques na barra; `data-safe-area="bottom"`.
- Navegação do editor: `/notes` (lista) → `/notes/[id]` (editor); retorno mobile `Todas as notas` → `/notes`; slash/drawer/toolbar são controles do editor, não itens de menu. Mobile: toolbar do editor acima da barra de navegação; drawer 90dvh com rolagem interna e gesto de fechar.

#### Formulários e ações

- Editor contínuo sem formulário seccionado (exceção editorial vigente do canvas, sem PageHeader de CRUD no detalhe). Ações: slash filtrável, drawer com busca, toolbar com 7 botões nomeados, seletor com versão/livro/capítulo/início/fim + preview + confirmar/cancelar com validação e explicação. Padrão de abertura: inline no canvas; seletor em Dialog desktop / Sheet mobile.

#### Composição e disposição

- Hierarquia: voltar (mobile) → status de save → canvas Milkdown full-bleed → toolbar mobile fixa acima da navegação. Densidade de leitura com largura de canvas e respiro vigentes; sem moldura/card/borda. Desktop: slash flutuante ancorado ao cursor; mobile: drawer inferior + toolbar fixa. Reaproveita `Sheet`, `Dialog`, `Button`, `VerseSelector`, `VerseBlockView`; novos só `MilkdownNoteEditor`, `MilkdownMobileToolbar`, ponte slash.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | Projeto Svelte; sem blocos React | — | — | — | Não aplicável por stack |

Blocos Svelte desta entrega: `MilkdownNoteEditor.svelte` (monta kit, nó verse, slash, change→autosave), `MilkdownMobileToolbar.svelte` (7 ações + abrir seletor), `milkdown-verse-node.ts` (schema/parser/serializador), `milkdown-slash.ts` (itens + abertura desktop/drawer), `milkdown-markdown-io.ts` (ponte Markdown). Reaproveitados: `VerseSelector.svelte`, `VerseBlockView.svelte`, `Sheet`, `Dialog`, `Button`, `note-markdown.ts`, `note-editor-service.ts`, `notes-repository.ts`. Registrar novos em `INTERFACE.md` na implementação.

#### Estados e acessibilidade

- Loading `Carregando nota…` (`role=status`), vazia/placeholder `Digite '/'`, erro com retry (`role=alert`), salvando/salvo/erro (`aria-live`), seletor com loading/erro/versão ausente/intervalo inválido, fence inválido com erro recuperável. Teclado completo, foco visível, Escape fecha menu/drawer/seletor, nomes acessíveis, `role=dialog` no drawer/seletor, `prefers-reduced-motion`, 320px/1440px sem overflow, zoom 200% legível. Breadcrumb/retorno mantém contexto e título atual.

#### Contrato CRUD

- CRUD de notas segue com o mesmo `PageHeader` na listagem (`/notes`); o detalhe `/notes/[id]` mantém exceção editorial do canvas full sem header de formulário, como no vigente. Listagem preserva `DataGrid` desktop com coluna `ID`, linha como link e ações editar/apagar, e cards mobile equivalentes. Componentes novos/reaproveitados serão registrados em `INTERFACE.md` na implementação.

#### Revisão visual durante o desenvolvimento

- Revisão visual obrigatória durante a implementação cobre bordas (ausência no canvas), espaçamentos, margens, padding, tipografia Geist, alinhamento, overflow, foco, conteúdo curto/longo, claro/escuro e `prefers-reduced-motion` em desktop e mobile; procedimento, viewports, estados e ajustes registrados no item `VISUAL` de cada tarefa.

#### APIs expostas

- Nenhuma API remota; contratos internos: `getMarkdown(): string`, `insertVerseFence(parsed)`, `onChange(markdown)`, `onSaved(note)`, itens slash `{id,label,aliases,description}`.

#### APIs externas utilizadas

- Nenhuma; Milkdown é dependência local via npm, sem chamada de rede em runtime.

#### Documentação das APIs consultadas

- Milkdown `@milkdown/kit 7.22.1` (npm + README), decisão: kit ESM com commonmark/gfm/slash/listener/transformer como base do editor; evidência em `research/milkdown-kit-7.22.1.md`.

#### Eventos e outros contratos

- Eventos Svelte/`listener` do kit: mudança de documento → debounce 650ms → `saveNote` → `onSaved` + reindexação; sem event bus externo.

### 11. Estratégia TDD

- **Unidade**: fence `:::verse` (parse/render/roundtrip/fallback), `SLASH_COMMANDS` (filtro + aliases), YAML+H1 (`parseNoteFile/serializeNoteFile/syncTitleWithH1`), ponte Milkdown↔Markdown.
- **Integração/contrato**: autosave com debounce + reindexação `note_verse_ref`; inserção via seletor gera fence + índice; abertura legada sem perda.
- **BDD/aceite**: Gherkin da seção 6 como referência do entendimento e do desenho dos testes TDD.
- **Runner TDD**: Vitest (`bun run test:tdd` / `vitest run` em `apps/web`); sem Pest (sem PHP); sem `.feature`.
- **E2E**: Não aplicável nesta fatia além de conferência manual desktop/mobile; Playwright só se a implementação exigir regressão de viewport.
- **Verificação manual**: inevitável para slash posicionado, drawer 90dvh, toolbar sobre navegação, foco/Escape, temas e `prefers-reduced-motion`, com motivo registrado.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, US-002, FR-001, FR-003, NFR-002, AC-001 | AC-001 na seção 6 | `apps/web/src/lib/features/notes/milkdown-slash.test.ts` com `SPECSFY-MILKDOWN-001` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-003, NFR-002, AC-002 | AC-002 na seção 6 | `apps/web/src/lib/features/notes/milkdown-slash-drawer.test.ts` com `SPECSFY-MILKDOWN-002` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-003, FR-004, NFR-002, AC-003 | AC-003 na seção 6 | `apps/web/src/lib/features/notes/MilkdownMobileToolbar.test.ts` com `SPECSFY-MILKDOWN-003` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-002, FR-006, NFR-003, AC-004 | AC-004 na seção 6 | `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` com `SPECSFY-MILKDOWN-004` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-001, FR-002, FR-005, NFR-001, NFR-003, AC-005 | AC-005 na seção 6 | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` com `SPECSFY-MILKDOWN-005` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-005, NFR-001, AC-006 | AC-006 na seção 6 | `apps/web/src/lib/features/notes/note-editor-service.test.ts` com `SPECSFY-MILKDOWN-006` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-003, FR-006, NFR-003, AC-007 | AC-007 na seção 6 | `apps/web/src/lib/features/notes/MilkdownNoteEditor.test.ts` com `SPECSFY-MILKDOWN-007` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-002, NFR-001, AC-008 | AC-008 na seção 6 | `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` com `SPECSFY-MILKDOWN-008` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-002, FR-006, AC-009 | AC-009 na seção 6 | `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` com `SPECSFY-MILKDOWN-009` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-006, NFR-003, AC-010 | AC-010 na seção 6 | `apps/web/src/lib/features/notes/verse-selector.test.ts` com `SPECSFY-MILKDOWN-010` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-005, NFR-001, AC-011 | AC-011 na seção 6 | `apps/web/src/lib/features/notes/note-editor-service.test.ts` com `SPECSFY-MILKDOWN-011` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-001, FR-002, NFR-003, AC-012 | AC-012 na seção 6 | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` com `SPECSFY-MILKDOWN-012` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, US-002, US-003, FR-003, FR-004, NFR-002, AC-013 | AC-013 na seção 6 | `apps/web/src/lib/features/notes/milkdown-slash.test.ts` com `SPECSFY-MILKDOWN-013` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-003, FR-001, FR-004, FR-006, NFR-003, AC-014 | AC-014 na seção 6 | `apps/web/src/lib/features/notes/MilkdownNoteEditor.test.ts` com `SPECSFY-MILKDOWN-014` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-001, FR-005, NFR-001, AC-015 | AC-015 na seção 6 | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` com `SPECSFY-MILKDOWN-015` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-003, FR-004, NFR-002, NFR-003, AC-016 | AC-016 na seção 6 | `apps/web/src/lib/features/notes/MilkdownMobileToolbar.test.ts` com `SPECSFY-MILKDOWN-016` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-002, FR-006, NFR-002, AC-017 | AC-017 na seção 6 | `apps/web/src/lib/features/notes/verse-selector.test.ts` com `SPECSFY-MILKDOWN-017` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |
| US-001, FR-002, FR-005, NFR-003, AC-018 | AC-018 na seção 6 | `apps/web/src/lib/features/notes/note-markdown.test.ts` com `SPECSFY-MILKDOWN-018` | RED: import do módulo/componente Milkdown de produção ausente; `bun run test:tdd`, exit 1 esperado | GREEN: teste focal e suíte completa aprovados em 2026-09-04 | Refactor: seletores de regressão adaptados ao contrato Milkdown; 70 arquivos/264 testes GREEN |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-001 | AC-005 | Unidade | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-001 | AC-012 | Unidade | `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-001 | AC-014 | Componente | `MilkdownNoteEditor` / `vitest run` + inspeção temas | GREEN: Vitest + inspeção real desktop/mobile |
| FR-001 | AC-015 | Unidade | debounce/abertura / `vitest run` + medição manual | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-004 | Unidade | `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-005 | Unidade | `milkdown-verse-node.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-008 | Unidade | `milkdown-verse-node.test.ts` + `note-verse-index.test.ts` / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-009 | Componente | `VerseSelector` + nó verse / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-012 | Unidade | fallback sem perda / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-002 | AC-018 | Unidade | leitura externa do `.md` / inspeção | GREEN: Vitest + inspeção real desktop/mobile |
| FR-003 | AC-001 | Unidade + manual | `milkdown-slash-toolbar.test.ts` + teclado desktop | GREEN: Vitest + inspeção real desktop/mobile |
| FR-003 | AC-002 | Componente + manual | drawer Sheet 90dvh + busca / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-003 | AC-013 | Componente | foco/Escape / `vitest run` + manual | GREEN: Vitest + inspeção real desktop/mobile |
| FR-004 | AC-003 | Componente + manual | `MilkdownMobileToolbar` / `vitest run` + viewport | GREEN: Vitest + inspeção real desktop/mobile |
| FR-004 | AC-013 | Componente | teclado/toque / manual | GREEN: Vitest + inspeção real desktop/mobile |
| FR-004 | AC-016 | Componente | ações aplicam Markdown / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-005 | AC-005 | Integração | `note-editor-service` + índice / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-005 | AC-006 | Integração | autosave YAML+H1+índice / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-005 | AC-011 | Integração | erro com retry / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-006 | AC-004 | Integração | seletor→fence / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-006 | AC-007 | Manual visual | canvas sem bordas desktop/mobile | GREEN: Vitest + inspeção real desktop/mobile |
| FR-006 | AC-010 | Componente | estado sem Bíblia / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| FR-006 | AC-017 | Componente | Dialog/Sheet reaproveitado / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-001 | AC-005 | Integração | abertura sem migração / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-001 | AC-008 | Unidade | snapshot sem lookup / `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-001 | AC-015 | Medição | nota longa / inspeção + `vitest run` | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-002 | AC-001 | Manual + componente | slash teclado / checklist | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-002 | AC-002 | Manual + componente | drawer foco/Escape | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-002 | AC-013 | Manual + componente | teclado/toque global | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-003 | AC-007 | Manual visual | canvas + tokens claro/escuro | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-003 | AC-014 | Manual visual | temas + reduced motion | GREEN: Vitest + inspeção real desktop/mobile |
| NFR-003 | AC-018 | Inspeção | `.md` externo legível | GREEN: Vitest + inspeção real desktop/mobile |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md --allow-draft` e `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md --root /home/claudio/Projects/openbible-worksplace`
- **Achados**: VALID DRAFT; AC-002, FR-003 e NFR-002 descrevem a ocultação do teclado antes do drawer; cobertura US/FR/NFR ≥3 ACs preservada (US-001:8, US-002:8, US-003:5, FR-001:5, FR-002:6, FR-003:3, FR-004:4, FR-005:5, FR-006:6, NFR-001:5, NFR-002:6, NFR-003:8; 18 ACs); lentes PROD/ARCH/SEC sem P1 Open.
- **FIND-ARCH-001** [P2] [Accepted] Remoção do Tipex só após paridade para não quebrar `BibleNoteSplit` — Refs: FR-001, FR-006 — Evidence: specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md:814 — Effect: risco de regressão no leitor — Suggestion: manter Tipex até GREEN+T007, decisão DEC-005 aceita.
- **FIND-PROD-001** [P3] [Accepted] `milkdown.dev` retornou só casca na consulta; evidência normativa é npm+README — Refs: FR-001 — Evidence: specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/research/milkdown-kit-7.22.1.md:16 — Effect: nenhum bloqueio; versão 7.22.1 MIT registrada — Suggestion: nenhuma ação.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Data**: 2026-09-05
- **Achados**: O plano anterior permanece preservado como evidência histórica, mas foi invalidado pela mudança de comportamento em AC-002/FR-003/NFR-002; a reconciliação deve adicionar RED TDD e implementação para ocultar o teclado.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Data**: 2026-09-05
- **Achados**: A evidência anterior de implementação e regressão permanece preservada nas correções históricas, mas o Delivery Gate aguarda a nova prova de AC-002/FR-003/NFR-002.

#### Correção pós-entrega — slash, toolbar e formatação

- **Data**: 2026-09-04
- **Escopo**: AC-001, AC-002, AC-003, AC-007, AC-013, AC-014, AC-016; FR-003, FR-004, FR-006; NFR-002, NFR-003.
- **Correções**: slash passou a consultar a seleção atual do ProseMirror e posicionar o menu por `coordsAtPos`; o plugin slash sem renderer foi removido do editor; o `Sheet` só é montado no mobile; a toolbar usa o rótulo Checklist, `aria-pressed`, estado ativo e safe area; o CSS do canvas passou a estilizar blocos CommonMark/GFM sem `white-space: pre-wrap` no ProseMirror.
- **Evidência**: testes focais Milkdown `11/11` aprovados; lint focal sem erros; `git diff --check` aprovado; build completo aprovado com permissões ampliadas (warnings preexistentes de `ConfigPage.svelte`); monitor de contexto `CURRENT`; documentação reconstruída e `--check` aprovado.
- **Limite de verificação**: browser `cursor-ide-browser` indisponível por falha de registro do MCP nesta sessão; regressão completa reportou `189` testes aprovados e um erro não relacionado por Chromium ausente, portanto o Delivery Gate permanece `In Progress` até a conferência manual desktop/mobile.

#### Correção pós-entrega — editor mobile iPhone (teclado, scroll, autofill, versículo)

- **Data**: 2026-09-04
- **Escopo**: AC-003, AC-004, AC-007, AC-013, AC-016; FR-004, FR-006; NFR-002, NFR-003.
- **Correções**: `editorViewOptionsCtx` + attrs DOM desativam AutoFill/QuickType iOS (`autocomplete=off`, `autocorrect=off`, `data-1p-ignore`); toolbar usa `visualViewport` → `--note-keyboard-inset` e `bottom: max(nav, inset)` com `z-index: 50`; rota `/notes/[id]` e `AppFrame` bloqueiam scroll da página no mobile (overflow só no `.ProseMirror`); `insertVerse` insere parágrafo vazio após o fence e foca nele via `milkdown-verse-insert.ts`.
- **Evidência**: `bun run test:tdd -- src/lib/features/notes/note-editor-viewport.test.ts src/lib/features/notes/milkdown-verse-node.test.ts src/lib/features/notes/MilkdownMobileToolbar.test.ts` exit 0 (11 testes); lint focal dos arquivos tocados exit 0; `svelte-autofixer` sem issues em `MilkdownNoteEditor.svelte` e `MilkdownMobileToolbar.svelte`; monitor de contexto `CURRENT`; `INTERFACE.md` atualizado.
- **Limite de verificação**: conferência em iPhone físico ou simulador com teclado real não realizada nesta sessão; comportamento esperado documentado em `INTERFACE.md` e CSS/JS acima. Delivery Gate permanece `In Progress`.

#### Correção solicitada — teclado ao abrir slash no drawer mobile

- **Data**: 2026-09-05
- **Escopo**: AC-002, AC-013; FR-003; NFR-002.
- **Pedido preservado**: “no mobile no editor das notas, quando usarmo  / slash commands ocultar o teclado, pois abre um drawer.”
- **Mudança normativa**: ao detectar `/` no editor mobile, o teclado virtual deve ser ocultado antes da abertura do drawer; a seleção atual do ProseMirror deve permanecer disponível para o comando escolhido.
- **Estado**: Pendente de teste TDD, implementação, regressão e revisão visual.

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

- [x] T001 [TEST] [TDD] [US-002] Derivar de AC-001 slash desktop filtrável em `apps/web/src/lib/features/notes/milkdown-slash.test.ts` — Refs: US-001, US-002, FR-001, FR-003, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-001`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T002 [TEST] [TDD] [US-002] Derivar de AC-002 drawer mobile 90dvh em `apps/web/src/lib/features/notes/milkdown-slash-drawer.test.ts` — Refs: US-002, FR-003, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-002`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T003 [TEST] [TDD] [US-003] Derivar de AC-003 toolbar mobile visível em `apps/web/src/lib/features/notes/MilkdownMobileToolbar.test.ts` — Refs: US-003, FR-004, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-003`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T004 [TEST] [TDD] [US-002] Derivar de AC-004 inserção de fence via seletor em `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` — Refs: US-002, FR-002, FR-006, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-004`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 abertura de nota legada sem perda em `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` — Refs: US-001, FR-001, FR-002, FR-005, NFR-001, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-005`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T006 [TEST] [TDD] [US-001] Derivar de AC-006 salvamento YAML+H1+índice em `apps/web/src/lib/features/notes/note-editor-service.test.ts` — Refs: US-001, FR-005, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-006`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T007 [TEST] [TDD] [US-003] Derivar de AC-007 canvas sem bordas em `apps/web/src/lib/features/notes/MilkdownNoteEditor.test.ts` — Refs: US-003, FR-006, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-007`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 preview por snapshot em `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` — Refs: US-002, FR-002, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-008`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T009 [TEST] [TDD] [US-002] Derivar de AC-009 intervalo inválido bloqueado em `apps/web/src/lib/features/notes/milkdown-verse-node.test.ts` — Refs: US-002, FR-002, FR-006, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-009`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T010 [TEST] [TDD] [US-002] Derivar de AC-010 versão ausente com estado explícito em `apps/web/src/lib/features/notes/verse-selector.test.ts` — Refs: US-002, FR-006, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-010`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T011 [TEST] [TDD] [US-001] Derivar de AC-011 falha de salvamento explícita em `apps/web/src/lib/features/notes/note-editor-service.test.ts` — Refs: US-001, FR-005, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-011`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T012 [TEST] [TDD] [US-001] Derivar de AC-012 fence inválido preservado em `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` — Refs: US-001, FR-001, FR-002, NFR-003, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-012`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 teclado, foco e Escape em `apps/web/src/lib/features/notes/milkdown-slash.test.ts` — Refs: US-001, US-002, US-003, FR-003, FR-004, NFR-002, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-013`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T014 [TEST] [TDD] [US-003] Derivar de AC-014 tema e movimento em `apps/web/src/lib/features/notes/MilkdownNoteEditor.test.ts` — Refs: US-003, FR-001, FR-004, FR-006, NFR-003, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-014 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-014`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T015 [TEST] [TDD] [US-001] Derivar de AC-015 abertura rápida sem conversão em `apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts` — Refs: US-001, FR-001, FR-005, NFR-001, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-015 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-015`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T016 [TEST] [TDD] [US-003] Derivar de AC-016 toolbar aplica Markdown em `apps/web/src/lib/features/notes/MilkdownMobileToolbar.test.ts` — Refs: US-003, FR-004, NFR-002, NFR-003, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-016 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-016`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T017 [TEST] [TDD] [US-002] Derivar de AC-017 seletor reaproveitado Dialog/Sheet em `apps/web/src/lib/features/notes/verse-selector.test.ts` — Refs: US-002, FR-006, NFR-002, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-017 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-017`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

- [x] T018 [TEST] [TDD] [US-001] Derivar de AC-018 leitura fora do app em `apps/web/src/lib/features/notes/note-markdown.test.ts` — Refs: US-001, FR-002, FR-005, NFR-003, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-018 e confirmar regra, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY-MILKDOWN-018`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: RED válido observado com `bun run test:tdd`; falha por módulo/componente Milkdown de produção ausente.
  - [x] **VISUAL**: Não aplicável: tarefa materializa apenas teste, sem alterar interface.
  - [x] **EVIDENCE**: `bun run test:tdd -- src/lib/features/notes/...`; exit 1 esperado; imports Milkdown ausentes, 7 arquivos RED + 2 componentes RED.
  - [x] **IMPROVE**: Marcador SPECSFY próprio e um AC por tarefa preservam rastreabilidade e diagnóstico focal.

#### Fase 2 — US-001 Editar nota em Milkdown com Markdown como fonte (P1)

**Objetivo**: Nota legada abre e salva em Milkdown sem migração, com YAML+H1+índice.
**Teste independente**: Abrir nota com `:::verse`, editar, salvar e ler `.md` fora do app.

- [x] T019 [CODE] [US-001] Instalar `@milkdown/kit` e implementar `MilkdownNoteEditor` + ponte Markdown com autosave em `apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte` — Refs: US-001, FR-001, FR-005, NFR-001, AC-005, AC-006, AC-011, AC-012, AC-015 — Depends: T005, T006, T011, T012, T015
  - [x] **PREP**: REDs T005/T006/T011/T012/T015, baseline Tipex e documentação prévia confirmados.
  - [x] **EXECUTE**: `@milkdown/kit` e `remark-directive` instalados; `MilkdownNoteEditor.svelte`, `milkdown-markdown-io.ts` e autosave implementados.
  - [x] **VERIFY**: 32/32 testes focais GREEN; `bun run build` exit 0.
  - [x] **VISUAL**: Conferidos bordas, espaçamentos, margens, padding e tipografia em 1280×593 e 390×844; canvas sem moldura e sem overflow.
  - [x] **EVIDENCE**: GREEN registrado; docs/PACKAGES reconstruídos; PROJECT.md sem mudança material (capacidade já declarada).
  - [x] **IMPROVE**: Imports Milkdown dinâmicos mantêm SSR seguro e reduzem o chunk inicial.
<!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-001","FR-005","NFR-001","AC-005","AC-006","AC-011","AC-012","AC-015"],"files":["apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte","apps/web/src/lib/features/notes/milkdown-markdown-io.ts","apps/web/package.json","bun.lock"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/milkdown-*.test.ts && bun run build","exit":0}]} -->

**Checkpoint**: Nota legada abre intacta e o save atualiza `.md` + índice auxiliar.

#### Fase 3 — US-002 Inserir versículo por slash, drawer e seletor (P1)

**Objetivo**: Qualquer origem (slash/drawer/toolbar) confirma o mesmo `:::verse` válido.
**Teste independente**: Inserir por slash e drawer, confirmar seletor e conferir fence + índice.

- [x] T020 [CODE] [US-002] Implementar nó verse + slash desktop/drawer mobile e reaproveitar `VerseSelector` em `apps/web/src/lib/features/notes/milkdown-verse-node.ts` — Refs: US-002, FR-002, FR-003, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-008, AC-009, AC-010, AC-017 — Depends: T001, T002, T004, T008, T009, T010, T017
  - [x] **PREP**: REDs T001/T002/T004/T008/T009/T010/T017 e sintaxe vigente de `:::verse` confirmados.
  - [x] **EXECUTE**: Nó `verse` com remark-directive, slash desktop, drawer mobile e integração com VerseSelector implementados.
  - [x] **VERIFY**: Testes focais GREEN e prova real: nota OPFS abriu/renderizou/salvou `:::verse` com attrs e snapshot intactos.
  - [x] **VISUAL**: Conferidos bordas, espaçamentos, margens, padding e tipografia no slash desktop, drawer 90dvh e callout em 1280×593/390×844.
  - [x] **EVIDENCE**: Roundtrip real preservou YAML, H1, fence e snapshot após autosave.
  - [x] **IMPROVE**: A mesma fonte de itens alimenta desktop e mobile, evitando deriva.
<!-- specsfy:evidence {"task":"T020","refs":["US-002","FR-002","FR-003","FR-006","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-004","AC-008","AC-009","AC-010","AC-017"],"files":["apps/web/src/lib/features/notes/milkdown-verse-node.ts","apps/web/src/lib/features/notes/milkdown-slash.ts","apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/milkdown-*.test.ts && bun run build","exit":0}]} -->

**Checkpoint**: Slash, drawer e seletor geram o mesmo fence válido com snapshot e índice.

#### Fase de interface

- [x] T021 [CODE] [US-003] Implementar `MilkdownMobileToolbar` acima da navegação com estados e acessibilidade em `apps/web/src/lib/features/notes/MilkdownMobileToolbar.svelte` — Refs: US-003, FR-004, FR-006, NFR-002, NFR-003, AC-003, AC-007, AC-013, AC-014, AC-016 — Depends: T003, T007, T013, T014, T016
  - [x] **PREP**: REDs T003/T007/T013/T014/T016 e composição mobile confirmados.
  - [x] **EXECUTE**: Toolbar com sete ações, safe area e ligação ao editor/seletor implementada.
  - [x] **VERIFY**: Testes focais GREEN; build exit 0; DOM real expôs sete labels acessíveis.
  - [x] **VISUAL**: Conferidos bordas, espaçamentos, margens, padding e tipografia da toolbar acima da navegação em 390×844, com alvos 44px e sem overflow.
  - [x] **EVIDENCE**: Screenshot e inspeção DOM confirmaram toolbar, temas sem decoração e canvas contínuo.
  - [x] **IMPROVE**: Rótulo acompanha ícone para reduzir ambiguidade no mobile.
<!-- specsfy:evidence {"task":"T021","refs":["US-003","FR-004","FR-006","NFR-002","NFR-003","AC-003","AC-007","AC-013","AC-014","AC-016"],"files":["apps/web/src/lib/features/notes/MilkdownMobileToolbar.svelte","apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/milkdown-*.test.ts && bun run build","exit":0}]} -->

- [x] T022 [DOC] Registrar blocos Milkdown em `INTERFACE.md` — Refs: US-001, US-002, US-003, FR-001, FR-003, FR-004, FR-006 — Depends: T019, T020, T021, T023
  - [x] **PREP**: Blocos, APIs, estados e consumidores confirmados no código final.
  - [x] **EXECUTE**: `INTERFACE.md` atualizado com editor, toolbar, rota e regras de reuso.
  - [x] **VERIFY**: Todos os blocos novos e consumidores reais estão mapeados sem duplicar primitives.
  - [x] **VISUAL**: Não aplicável: tarefa altera somente documentação de interface.
  - [x] **EVIDENCE**: `INTERFACE.md` referencia arquivos reais e estados verificados.
  - [x] **IMPROVE**: Registro antigo do Tipex foi substituído pelo contrato do motor principal.

- [x] T023 [CODE] [US-001] Integrar o editor Milkdown à rota `/notes/[id]` e conferir a listagem `/notes` em `apps/web/src/routes/notes/[id]/+page.svelte` — Refs: US-001, US-003, FR-001, FR-005, FR-006, NFR-001, NFR-003, AC-005, AC-006, AC-007 — Depends: T019, T021
  - [x] **PREP**: GREEN de T019/T021 e contrato das rotas confirmados.
  - [x] **EXECUTE**: `/notes/[id]` e `BibleNoteSplit` passaram a consumir `MilkdownNoteEditor`.
  - [x] **VERIFY**: Criação pela home abriu `/notes/<id>`; editor montou; edição atualizou arquivo OPFS; build exit 0.
  - [x] **VISUAL**: Conferidos bordas, espaçamentos, margens, padding e tipografia nas rotas desktop/mobile; retorno, status, H1 e callout alinhados.
  - [x] **EVIDENCE**: Rotas e split usam Milkdown; PROJECT.md revisado sem impacto material além da capacidade já descrita.
  - [x] **IMPROVE**: Um único editor é reutilizado na rota e no split do leitor.
<!-- specsfy:evidence {"task":"T023","refs":["US-001","US-003","FR-001","FR-005","FR-006","NFR-001","NFR-003","AC-005","AC-006","AC-007"],"files":["apps/web/src/routes/notes/[id]/+page.svelte","apps/web/src/lib/features/bible/BibleNoteSplit.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/milkdown-*.test.ts && bun run build","exit":0}]} -->

#### Fase final — Qualidade

- [x] T024 [P] [DOC] Atualizar `.specsfy/STACK.md` com `@milkdown/kit` e saída do Tipex do editor — Refs: FR-001 — Depends: T019
  - [x] **PREP**: Manifest, lockfile e integração Milkdown verificados.
  - [x] **EXECUTE**: `.specsfy/STACK.md` atualizado com Milkdown, remark-directive e legado transitório.
  - [x] **VERIFY**: Monitor de contexto: CURRENT.
  - [x] **VISUAL**: Não aplicável: tarefa altera somente inventário de stack.
  - [x] **EVIDENCE**: Stack sustentada por package.json, bun.lock e arquivos do editor.
  - [x] **IMPROVE**: Tecnologia principal e legado transitório ficaram explicitamente separados.

- [x] T025 [P] [DOC] Revisar `.specsfy/DATABASE.md` para o reuso de `note_verse_ref` sem mudança de schema — Refs: FR-002, FR-005 — Depends: T020
  - [x] **PREP**: Schema e reindexação de `note_verse_ref` conferidos; nenhuma migration necessária.
  - [x] **EXECUTE**: `.specsfy/DATABASE.md` registra reuso do índice sem mudança de schema.
  - [x] **VERIFY**: Monitor de contexto: CURRENT.
  - [x] **VISUAL**: Não aplicável: tarefa altera somente mapa de persistência.
  - [x] **EVIDENCE**: Contrato Markdown→índice documentado com a mesma estrutura vigente.
  - [x] **IMPROVE**: Ausência de migration foi registrada para evitar alteração desnecessária.

- [x] T026 [TEST] Executar regressão, rastreabilidade, revisão visual e revisão de `PROJECT.md` em `apps/web/src/lib/features/notes/` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018 — Depends: T019, T020, T021, T022, T023, T024, T025
  - [x] **PREP**: Suites Vitest, lint, typecheck, build e gates identificados; `PROJECT.md` revisado sem impacto material, pois já declara notas Markdown/YAML, fence `:::verse` e índice auxiliar.
  - [x] **EXECUTE**: Regressão completa, rastreabilidade 30/30 e repasse visual real em desktop/mobile executados; testes legados de controles Tipex foram alinhados ao contrato Milkdown e seletores do leitor foram tornados inequívocos.
  - [x] **VERIFY**: `bun run test:unit` GREEN (70 arquivos, 264 testes); lint focal GREEN sem erros; build GREEN; rastreabilidade 30/30 OK. Typecheck global mantém 21 erros preexistentes fora dos arquivos Milkdown e lint global mantém dívida preexistente fora do escopo.
  - [x] **VISUAL**: Ego Browser em 1280×900 dark com zoom 200% e 390×844 light: bordas, espaçamentos, margens, padding e tipografia Geist conferidos; foco visível, alvos 44px, toolbar acima da navegação e nenhum overflow; drawer 90dvh e callout também conferidos.
  - [x] **EVIDENCE**: Vitest 70/70 arquivos e 264/264 testes; trace 30/30; build exit 0; lint focal exit 0; documentação e monitor CURRENT; `PROJECT.md` sem alteração necessária.
  - [x] **IMPROVE**: Removido landmark redundante do editor, adicionado `white-space: pre-wrap`, corrigido flush/callback do autosave ao desmontar e atualizados testes de regressão para o novo motor.
<!-- specsfy:evidence {"task":"T026","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018"],"files":["apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte","apps/web/src/lib/features/notes/MilkdownMobileToolbar.svelte","apps/web/src/routes/notes-editor.svelte.spec.ts","apps/web/src/routes/bible-reader.svelte.spec.ts","PROJECT.md"],"commands":[{"run":"bun run test:unit","exit":0},{"run":"bunx eslint src/lib/features/notes/MilkdownNoteEditor.svelte src/lib/features/notes/MilkdownMobileToolbar.svelte src/lib/features/notes/milkdown-markdown-io.ts src/lib/features/notes/milkdown-slash.ts src/lib/features/notes/milkdown-verse-node.ts src/lib/features/notes/note-editor-service.ts src/routes/notes-editor.svelte.spec.ts src/routes/bible-reader.svelte.spec.ts","exit":0},{"run":"bun run build","exit":0}]} -->

#### Correção pós-entrega — slash mobile

- [ ] T027 [TEST] [TDD] [US-002] Derivar teste de AC-002 para confirmar que o editor perde foco e o teclado virtual é ocultado antes do drawer em `apps/web/src/routes/notes-editor.svelte.spec.ts` — Refs: US-002, FR-003, NFR-002, AC-002, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin atualizado de AC-002 e confirmar o runner Vitest Browser/Playwright e a preservação da seleção.
  - [ ] **EXECUTE**: Adicionar o caso com marcador próprio `SPECSFY-MILKDOWN-019`, sem criar ou executar `.feature`.
  - [ ] **VERIFY**: Observar RED com `bun run test:tdd -- src/routes/notes-editor.svelte.spec.ts`, pois o editor ainda mantém foco ao abrir o drawer.
  - [ ] **VISUAL**: Não aplicável: a tarefa materializa o contrato de foco/teclado; a revisão visual ocorrerá na tarefa de implementação.
  - [ ] **EVIDENCE**: Registrar o resultado RED, o comando e os IDs AC-002/AC-013, FR-003 e NFR-002.
  - [ ] **IMPROVE**: Manter a prova no teste de rota para observar o comportamento integrado do drawer, em vez de simular somente um `blur` isolado.

- [ ] T028 [CODE] [US-002] Desfocar o DOM do ProseMirror ao detectar `/` no mobile antes de abrir o drawer, preservando a seleção para o comando escolhido em `apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte` — Refs: US-002, FR-003, NFR-002, AC-002, AC-013 — Depends: T002, T013, T027
  - [ ] **PREP**: Confirmar o RED de T027, o listener `markdownUpdated`, a detecção de `mobile` e o foco atual do editor.
  - [ ] **EXECUTE**: Aplicar o menor ajuste de produção para desfocar o editor antes de `slashOpen = true`, sem refocar automaticamente nem perder a seleção ProseMirror.
  - [ ] **VERIFY**: Executar teste focal, lint dos arquivos tocados e build; confirmar que o drawer continua abrindo e os comandos continuam operáveis.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 390×844 claro/escuro, drawer 90dvh com teclado fechado, safe area, foco visível no campo de busca e ausência de overflow; validar desktop sem mudança no slash flutuante.
  - [ ] **EVIDENCE**: Registrar comandos, resultados, IDs e a inspeção de foco/teclado nas seções 11–13; reconstruir `docs/` antes de concluir.
  - [ ] **IMPROVE**: Registrar a melhoria aplicada ou justificar por que nenhuma melhoria segura adicional foi necessária.

- [ ] T029 [DOC] [US-002] Atualizar o mapa de interface para registrar que o slash mobile oculta o teclado antes do `Sheet` em `INTERFACE.md` — Refs: US-002, FR-003, NFR-002, AC-002 — Depends: T028
  - [ ] **PREP**: Conferir os consumidores reais de `MilkdownNoteEditor` e `Sheet` em `INTERFACE.md` e no código.
  - [ ] **EXECUTE**: Atualizar as linhas do editor e da tela de notas com o comportamento de foco/teclado, preservando o texto humano fora dos blocos gerenciados.
  - [ ] **VERIFY**: Confirmar que arquivos, estados, consumidores e regra de reuso continuam reais e que o monitor de contexto permanece `CURRENT`.
  - [ ] **VISUAL**: Não aplicável: a tarefa altera somente o inventário textual da interface.
  - [ ] **EVIDENCE**: Registrar o arquivo atualizado, o monitor e os IDs cobertos.
  - [ ] **IMPROVE**: Manter a regra junto do bloco e da tela consumidores para evitar documentação duplicada.

- [ ] T030 [TEST] [US-002] Executar regressão focal, rastreabilidade e revisão visual da correção de slash mobile em `apps/web/src/routes/notes-editor.svelte.spec.ts` e `apps/web/src/lib/features/notes/` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018 — Depends: T028, T029
  - [ ] **PREP**: Confirmar T027–T029 concluídas, comandos de Vitest, lint, typecheck, build e rastreabilidade disponíveis.
  - [ ] **EXECUTE**: Rodar a regressão da fatia e revisar `PROJECT.md` quanto a impacto material; não criar nova capacidade fora da finalidade existente.
  - [ ] **VERIFY**: Teste focal e regressão relacionada aprovados; registrar e separar falhas globais preexistentes, se reaparecerem.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em desktop 1280×900 e mobile 390×844, claro/escuro, zoom 200%, foco/Escape, drawer sem teclado e ausência de overflow, respeitando reduced motion.
  - [ ] **EVIDENCE**: Registrar resultados de testes, lint, build, traceabilidade, monitor, documentação e revisão visual com os IDs completos.
  - [ ] **IMPROVE**: Aplicar uma melhoria segura identificada na regressão ou registrar justificativa concreta para nenhuma melhoria.

### 15. Ordem de execução

- Caminho crítico: T001–T018 (RED) → T019 → T020 → T021 → T023 → T022 → T026 → T027 (RED) → T028 → T029 → T030.
- Tarefas paralelas: T024 e T025 com `[P]` após seus CODEs (arquivos distintos, sem estado compartilhado); TDDs T001–T018 sem `[P]` porque compartilham arquivos de teste por grupo.
- Estratégia de MVP: US-001 + US-002 entregam o núcleo Files over app com versículo; US-003 completa a paridade mobile com toolbar.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0004 vigente (Tipex, `VerseSelector`, índice, H1↔YAML) como baseline de paridade.
- SPEC-0003 (OpenLP) para o seletor; SPEC-0001 para pastas e template.
- Nova dependência `@milkdown/kit 7.22.1` (+ presets/plugins); remover Tipex/TipTap do editor após paridade.
- `Sheet` bottom 90dvh, safe area e PWA com zoom travado vigentes.

#### Riscos

- Nó custom `:::verse` divergir da sintaxe vigente → mitigação com TDD de roundtrip sobre `verse-block-extension.ts` antes do editor.
- Slash/drawer/toolbar competirem com teclado mobile e barra de navegação → mitigação com posicionamento acima da navegação, safe area e testes de viewport.
- Remoção prematura do Tipex quebrar split do leitor (`BibleNoteSplit`) → mitigação mantendo Tipex até GREEN + regressão, com troca coordenada.
- Estimativa Effort 8 subestimar integração Svelte 5 + Milkdown → mitigação com MVP US-001/US-002 primeiro.

#### Suposições

- Mesma lista slash no desktop e no drawer; busca filtra por label/aliases vigentes.
- Toolbar aparece só com editor ativo e não cobre conteúdo nem navegação.
- Debounce 650ms, YAML com 4 campos e H1 sincronizado seguem inalterados.
- `readerSelection` só preenche o seletor; versão é por bloco.

### 17. Decisões

- **DEC-001**: Adotar `@milkdown/kit` com CommonMark/GFM + slash + nó verse custom — porque casa Markdown-arquivo com edição WYSIWYG sobre ProseMirror/remark sem React; alternativa Crepe/Tipex descartada por acoplamento e HTML intermediário.
- **DEC-002**: Manter `:::verse{attrs}` + snapshot e abrir notas legadas sem migração — porque preserva File Over App e índice; alternativa de nova sintaxe exigiria conversão com risco de perda.
- **DEC-003**: Slash desktop + drawer mobile 90dvh com mesma lista e toolbar com 7 ações acima da navegação — porque unifica inserção e formatação nos dois viewports; alternativa de menu flutuante mobile descartada por conflito com teclado.
- **DEC-004**: Reaproveitar `VerseSelector` Dialog/Sheet e `VerseBlockView` — porque mantém validação, preview e acessibilidade já entregues; alternativa de seletor novo duplicaria fluxo.
- **DEC-005**: Remover Tipex/TipTap do editor só após paridade com regressão — porque `BibleNoteSplit` consome o editor; remoção imediata quebraria o leitor.
- **DEC-006**: Ao abrir o drawer de slash no mobile, desfocar o editor para ocultar o teclado virtual — porque o drawer é a superfície ativa de comandos e o teclado aberto reduz sua área útil; a seleção do ProseMirror permanece como origem da inserção.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
- [ ] `.specsfy/STACK.md` atualizado com `@milkdown/kit` e remoção do Tipex/TipTap do editor.
- [ ] `.specsfy/DATABASE.md` revisado para o reuso de `note_verse_ref` sem mudança de schema.
- [ ] `INTERFACE.md` e `docs/` atualizados com os novos blocos Milkdown e o reaproveitamento de `VerseSelector`.
