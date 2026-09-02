# Especificação integrada: Notas canvas estilo Notion com bloco de versículo

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0004 |
| Slug | 0004-notas-canvas-estilo-notion-com-bloco-de-versiculo |
| Status | Implementing |
| Effort | 9 |
| Effort updated at | 2026-09-01 |
| Effort rationale | A fatia combina CRUD completo com lixeira, editor canvas full-bleed via Tipex, nó TipTap customizado com roundtrip Markdown do fence `:::verse`, seletor bíblico reutilizando o leitor (SPEC-0003), sync bidirecional H1↔YAML, slash-command e índice SQLite auxiliar — múltiplas fronteiras de domínio, persistência File Over Apps e integração visual responsiva. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | In Progress |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-01 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A pessoa usuária não consegue elaborar notas pessoais em um canvas contínuo, sem moldura em volta do editor, nem inserir trechos bíblicos com referência estável, preview editorial e persistência legível fora do app. O workspace já possui pastas e template de nota (SPEC-0001) e o leitor bíblico (SPEC-0003), mas não há rotas, listagem nem editor para notas.

#### Resultado desejado

A pessoa acessa **Notas** na navegação principal, lista e gerencia notas locais com lixeira, escreve cada nota em canvas full-bleed persistido em Markdown+YAML e insere blocos de versículo com seletor, callout de preview e snapshot no arquivo — consultando a Bíblia somente ao inserir ou alterar o bloco.

#### Métricas de sucesso

- 100% das operações de listar, criar, editar e mover para lixeira persistem em `notes/<noteId>.md` ou `trash/` sem enviar conteúdo à rede.
- Ao reabrir uma nota com blocos `:::verse` salvos, a preview renderiza exclusivamente o snapshot do Markdown em pelo menos 3 cenários de teste (versículo único, intervalo e versão ausente).
- O roundtrip editor → arquivo → editor preserva atributos e corpo do fence `:::verse` em testes automatizados sem perda de referência.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Roundtrip Markdown do Tipex com bloco customizado `:::verse` — Verdict: verified — Confidence: high — Evidence: research/tipex-markdown.md#fence-verse-proposto — Budget: 1/1.
- **R-002** [high] Índice auxiliar `note_verse_ref` em `.openbible/index.sqlite` — Verdict: verified — Confidence: high — Evidence: research/notes-index-sqlite.md#tabela-proposta-note_verse_ref — Budget: 1/1.
- **R-003** [high] Compatibilidade `@tiptap/markdown` com TipTap 2 usado pelo Tipex 0.2.0 — Verdict: verified — Confidence: medium — Evidence: research/tipex-markdown.md#markdown-tiptapmarkdown — Budget: 1/1. Mitigação: serialização manual do fence na camada File Over Apps se a extensão oficial falhar nos testes RED.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-01-211857-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — captura original.
- `specs/backlog/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — refinamento Q1–Q9 encerrado.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — workspace, `templates/note.md`, pastas `notes/` e `trash/`.
- `specs/completed/0002-tela-inicial-navegacao/spec.md` — shell, Sidebar e barra mobile.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — catálogo OpenLP, `readerSelection`, padrão Dialog/Sheet.
- `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` e `.specsfy/USER-PROFILE.md`.

#### Documentação consultada

- Tipex 0.2.0, https://tipex.pages.dev/ e https://www.npmjs.com/package/@friendofsvelte/tipex, acesso em 2026-09-01 — props `focal`, `controlComponent`, extensões e snippets.
- TipTap Markdown, https://tiptap.dev/docs/editor/markdown, acesso em 2026-09-01 — `parseMarkdown`, `renderMarkdown`, `markdownTokenizer`, `createBlockMarkdownSpec`.
- Vercel Design Guidelines, https://vercel.com/design.md — hierarquia tipográfica, superfícies contínuas e estados semânticos.

#### Artefatos de pesquisa armazenados

- `specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/research/tipex-markdown.md` — canvas full-bleed, extensões, fence `:::verse` e sync H1↔YAML.
- `specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/research/notes-index-sqlite.md` — schema `note_verse_ref`, reindexação e consulta inversa futura.

#### Dúvidas respondidas

- **Q1: escopo da primeira fatia?** → **A:** superfície completa — listagem, criar, editar, apagar com lixeira e editor canvas com bloco de versículo.
- **Q2: rotas e navegação?** → **A:** `/notes` (listagem), `/notes/[id]` (editor); item **Notas** na Sidebar e na barra mobile; `/sermons` permanece o construtor de sermões.
- **Q3: persistência do bloco?** → **A:** referência nos atributos do fence e snapshot do texto no corpo; preview lê o arquivo; lookup SQLite só ao inserir ou alterar.
- **Q4: serialização Markdown?** → **A:** fence custom `:::verse{...}` com atributos estáveis; YAML frontmatter só para metadados da nota (`title`, `createdAt`, `updatedAt`, `type`).
- **Q5: intervalo permitido?** → **A:** mesmo capítulo; `verseStart === verseEnd` para versículo único; sem atravessar capítulos nesta fatia.
- **Q6: UX do seletor?** → **A:** Dialog no desktop e Sheet no mobile, com preview em callout antes de confirmar — mesmo padrão da SPEC-0003.
- **Q7: versão por bloco?** → **A:** cada bloco guarda `versionId` próprio; `readerSelection` preenche apenas o valor inicial do seletor.
- **Q8: inserção no canvas?** → **A:** slash-command (`/`, `/versiculo`, `/verse`) e botão visível/focável; mesmo seletor e mesmo fence; canvas full-bleed sem moldura.
- **Q9: título da nota?** → **A:** primeiro bloco editável é H1; sync bidirecional H1 ↔ `title` no YAML; template com `title: ""` e `# Nova nota`.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante. Compatibilidade de schemas bíblicos fora do OpenLP permanece fora de escopo (herdado da SPEC-0003).

### 3. Escopo e atores

#### Incluído

- Rotas `/notes` e `/notes/[id]` com item **Notas** na Sidebar e na barra mobile.
- Listagem de notas ativas, criação, edição, exclusão com movimentação para `trash/`.
- Editor canvas full-bleed com Tipex (`focal={false}`, sem card em volta do ProseMirror).
- Sync bidirecional H1 ↔ `title` no YAML frontmatter.
- Bloco custom `:::verse` com atributos `versionId`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd` e snapshot no corpo.
- Seletor de versículo com Dialog (desktop) / Sheet (mobile), preview em callout e validação de intervalo no mesmo capítulo.
- Slash-command e botão acessível para abrir o mesmo seletor.
- Índice auxiliar `note_verse_ref` em `.openbible/index.sqlite`, reindexado ao salvar.
- Persistência em `notes/<noteId>.md` (arquivos planos sob `notes/`).

#### Fora de escopo

- Construtor de sermões e CRUD/lixeira de sermões (inbox irmã de persistência).
- Intervalo de versículos que atravessa capítulos ou livros.
- Colaboração, conta, sincronização remota e telemetria.
- Comparação lado a lado de versões, destaques bíblicos e planos de leitura.
- Subpastas temáticas em `notes/` nesta fatia (arquivos ficam planos em `notes/<noteId>.md`).
- Identidade visual da Vercel (wordmark/logo).

#### Atores

- **Pessoa usuária individual**: cria, edita, consulta e descarta notas no workspace local, sem conta.
- **Aplicação web**: orquestra storage local, editor Tipex, consultas bíblicas sob demanda e índice auxiliar.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte 5, TypeScript, Vitest e shadcn-svelte; não introduzir React, shadcn/ui para React ou ReUI.
- **PR-002**: File Over Apps — o arquivo `notes/<noteId>.md` é a fonte; `.openbible/index.sqlite` é auxiliar e nunca substitui o Markdown.
- **PR-003**: nenhum conteúdo de nota ou versículo é enviado à rede; consultas bíblicas usam bytes locais em `bibles/`.
- **PR-004**: preservar shell, tema, safe area, foco visível, vocabulário pt-BR e guideline `https://vercel.com/design.md`.
- **PR-005**: reutilizar padrões da SPEC-0003 para seletor responsivo, `readerSelection` e consultas OpenLP parametrizadas.

### 5. Histórias de usuário

#### US-001 — Gerenciar notas no workspace (P1)

Como pessoa usuária individual, quero listar, criar, abrir e descartar notas com lixeira, para organizar meu estudo sem perder arquivos em silêncio.

**Por que P1**: sem CRUD local o módulo de notas não existe; é pré-requisito do editor.
**Teste independente**: com storage fake, criar nota a partir de `templates/note.md`, listar em `/notes`, abrir editor e mover arquivo para `trash/` confirmando sumiço da listagem ativa.
**Requisitos**: FR-001, FR-006, NFR-002.

#### US-002 — Escrever em canvas contínuo com título sincronizado (P1)

Como pessoa usuária individual, quero editar a nota em canvas full-bleed com H1 como título, para ter experiência estilo Notion e arquivo legível fora do app.

**Por que P1**: o canvas contínuo e o título são o núcleo editorial da fatia.
**Teste independente**: abrir nota nova, editar H1, salvar, reabrir e verificar `title` no YAML e listagem; confirmar ausência de moldura no editor.
**Requisitos**: FR-002, NFR-001, NFR-002.

#### US-003 — Inserir e reler blocos de versículo (P1)

Como pessoa usuária individual, quero inserir trechos bíblicos com seletor, preview e snapshot, para citar a Escritura nas notas mesmo offline após salvar.

**Por que P1**: o bloco de versículo diferencia o OpenBible de um editor genérico.
**Teste independente**: inserir bloco via slash-command e via botão, confirmar fence no arquivo, reabrir sem lookup e alterar bloco com nova consulta SQLite.
**Requisitos**: FR-003, FR-004, FR-005, NFR-001, NFR-002.

### 6. Cenários BDD de aceite

#### AC-001 — Listar notas e criar nova

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-001
Feature: Listagem de notas

  Scenario: Ver notas ativas e criar arquivo no workspace
    Given que o workspace está pronto e contém zero ou mais arquivos em notes/
    When a pessoa abre /notes e confirma criar uma nova nota
    Then a listagem mostra a nota com título derivado do H1 ou do YAML sincronizado
    And um arquivo notes/<noteId>.md é criado a partir de templates/note.md
    And a pessoa é encaminhada para /notes/<noteId>
    And o item Notas aparece na Sidebar e na barra mobile
```

#### AC-002 — Descartar nota para a lixeira

**Cobre**: US-001, FR-001, FR-006, NFR-002

```gherkin
@US-001 @FR-001 @FR-006 @NFR-002 @AC-002
Feature: Exclusão com lixeira

  Scenario: Mover nota para trash sem apagar em silêncio
    Given que existe uma nota ativa em notes/<noteId>.md
    When a pessoa solicita apagar e confirma a ação
    Then o arquivo é movido para trash/ com nome preservado ou equivalente rastreável
    And a nota deixa de aparecer na listagem ativa
    And as entradas note_verse_ref da nota são removidas do índice auxiliar
```

#### AC-003 — Canvas full-bleed com título H1 sincronizado

**Cobre**: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Título e canvas contínuo

  Scenario: Sincronizar H1 com title no YAML
    Given uma nota nova criada a partir do template com title vazio e H1 "Nova nota"
    When a pessoa edita o H1 para "Estudo sobre João 3" e salva
    Then o frontmatter title passa a ser "Estudo sobre João 3"
    And ao reabrir a nota o H1 exibe o mesmo texto
    And o editor não exibe moldura, card ou borda envolvendo o ProseMirror
```

#### AC-004 — Inserir versículo via slash-command

**Cobre**: US-002, US-003, FR-002, FR-003, FR-005, NFR-001

```gherkin
@US-002 @US-003 @FR-002 @FR-003 @FR-005 @NFR-001 @AC-004
Feature: Inserção por slash-command

  Scenario: Abrir seletor a partir do menu de blocos
    Given que a pessoa está editando uma nota em /notes/<noteId>
    When digita "/versiculo" no cursor e escolhe o bloco de versículo
    Then o seletor abre em Dialog no desktop ou Sheet no mobile
    And após confirmar um intervalo válido um bloco :::verse é inserido no editor
```

#### AC-005 — Inserir versículo via botão acessível

**Cobre**: US-002, US-003, FR-002, FR-005, NFR-001

```gherkin
@US-002 @US-003 @FR-002 @FR-005 @NFR-001 @AC-005
Feature: Inserção por botão

  Scenario: Usar botão focável sem fluxo alternativo
    Given que a pessoa está no canvas da nota
    When aciona o botão visível de inserir versículo pelo teclado ou ponteiro
    Then o mesmo seletor de AC-004 é exibido
    And o bloco confirmado é equivalente ao produzido pelo slash-command
    And o botão permanece integrado ao canvas sem reintroduzir moldura no editor
```

#### AC-006 — Validar intervalo e exibir preview em callout

**Cobre**: US-003, FR-004, NFR-001

```gherkin
@US-003 @FR-004 @NFR-001 @AC-006
Feature: Seletor com preview

  Scenario: Impedir intervalo inválido e mostrar callout antes de confirmar
    Given que o seletor de versículo está aberto com uma versão OpenLP disponível
    When a pessoa escolhe versículo final menor que o inicial
    Then a confirmação é bloqueada com mensagem explicando o limite
    When corrige para um intervalo no mesmo capítulo
    Then o callout mostra a preview do texto antes de confirmar
    And ao confirmar o snapshot de todos os versículos do intervalo é gravado no fence
```

#### AC-007 — Ler snapshot sem consultar a Bíblia

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-007
Feature: Preview offline do bloco salvo

  Scenario: Reabrir nota usando apenas o Markdown
    Given uma nota salva com bloco :::verse e snapshot no corpo
    When a pessoa reabre a nota sem alterar o bloco
    Then o callout exibe o snapshot do arquivo
    And nenhuma consulta SQLite em bibles/ é executada para renderizar a preview
    When a Bíblia da versão foi removida do workspace
    Then o snapshot continua visível até a pessoa tentar alterar o bloco
```

#### AC-008 — Roundtrip Markdown do fence :::verse

**Cobre**: US-003, FR-003, FR-006, NFR-002

```gherkin
@US-003 @FR-003 @FR-006 @NFR-002 @AC-008
Feature: Serialização File Over Apps

  Scenario: Preservar fence legível fora do app
    Given um bloco :::verse{versionId="nvi.sqlite" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
    When a nota é salva e o arquivo é lido diretamente do disco
    Then o fence contém os atributos de referência e o snapshot linha por versículo
    And ao reimportar o Markdown no editor os atributos e o corpo permanecem equivalentes
    And o índice note_verse_ref reflete a referência reindexada
```

#### AC-009 — Pré-preencher seletor com readerSelection

**Cobre**: US-003, FR-004, FR-005, NFR-001

```gherkin
@US-003 @FR-004 @FR-005 @NFR-001 @AC-009
Feature: Valor inicial do seletor

  Scenario: Usar última leitura sem gravar no bloco automaticamente
    Given que readerSelection aponta para uma versão, livro e capítulo válidos
    When a pessoa abre o seletor para inserir um novo bloco
    Then versão e campos compatíveis aparecem pré-preenchidos
    When escolhe outra versão e confirma o bloco
    Then o bloco salva a versão escolhida
    And readerSelection no workspace não é alterado pela confirmação
```

#### AC-010 — Versão independente por bloco

**Cobre**: US-003, FR-003, FR-004, FR-006, NFR-002

```gherkin
@US-003 @FR-003 @FR-004 @FR-006 @NFR-002 @AC-010
Feature: Versão por bloco

  Scenario: Misturar versões na mesma nota
    Given uma nota com dois blocos :::verse
    When cada bloco é confirmado com versionId diferente
    Then cada fence mantém seu próprio versionId e snapshot
    And o índice note_verse_ref registra duas linhas com version_id distintos
    And reabrir a nota não faz um bloco herdar a versão do outro
```

#### AC-011 — Listagem reflete título sincronizado após edição

**Cobre**: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-011
Feature: Título na listagem

  Scenario: Voltar à lista com título atualizado
    Given que a pessoa editou o H1 de uma nota e o save foi concluído
    When retorna para /notes
    Then a listagem exibe o título sincronizado do YAML
    And abrir a mesma nota mantém o H1 idêntico ao título listado
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve listar notas ativas em `/notes`, permitir criar, abrir e mover para `trash/` com confirmação, persistindo arquivos planos em `notes/<noteId>.md` e removendo da listagem ativa após exclusão.
- **FR-002**: O sistema deve renderizar o editor em canvas full-bleed (sem moldura em volta do ProseMirror), com primeiro bloco editável como H1 e sync bidirecional entre o texto do H1 e `title` no YAML ao carregar e salvar.
- **FR-003**: O sistema deve serializar blocos de versículo como fence `:::verse` com atributos `versionId`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd` e snapshot textual no corpo; a preview lê o snapshot e só consulta `bibles/` ao inserir ou alterar o bloco.
- **FR-004**: O sistema deve oferecer seletor de versículo com versão, livro, capítulo, versículo inicial e final, preview em callout, validação de intervalo no mesmo capítulo e superfície Dialog no desktop ou Sheet no mobile.
- **FR-005**: O sistema deve permitir inserir blocos de versículo via slash-command (`/`, `/versiculo`, `/verse`) e via botão visível e focável que abre o mesmo seletor e produz o mesmo fence.
- **FR-006**: O sistema deve manter tabela auxiliar `note_verse_ref` em `.openbible/index.sqlite`, reindexando referências ao salvar cada nota sem substituir o Markdown como fonte.

#### Não funcionais

- **NFR-001**: A interface de notas deve ser operável por teclado, com foco visível, labels/nomes acessíveis, suporte a tema claro/escuro, `prefers-reduced-motion` e layouts responsivos em 320px e 1440px sem overflow horizontal. **Verificação**: testes Vitest Browser/Playwright e checklist manual de acessibilidade na seção 10.
- **NFR-002**: Todo conteúdo de nota e snapshot bíblico deve permanecer no workspace local, sem `fetch` de conteúdo editorial para serviços remotos. **Verificação**: testes de integração com storage fake e inspeção de que a preview pós-salvamento não abre SQLite.

#### Erros e casos-limite

- Workspace não pronto → preservar fluxo de onboarding/permissão existente (SPEC-0001).
- Nenhuma Bíblia importada ao inserir/alterar bloco → seletor em estado explícito; não inventar texto bíblico.
- Falha ao salvar ou mover para `trash/` → mensagem recuperável; não apagar o arquivo original em silêncio.
- `title` no YAML divergente do H1 ao abrir → atualizar H1 para coincidir com `title` antes da edição.
- Intervalo com `verseEnd < verseStart` ou capítulos diferentes → bloquear confirmação com explicação.
- Arquivo Markdown corrompido ou fence malformado → estado de erro na nota com opção de recuperar texto bruto sem perder o arquivo.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Monorepo Bun com `apps/web` em SvelteKit 2 / Svelte 5, Vitest, shadcn-svelte local, Geist Sans/Mono e storage abstrato (`WorkspaceStorage`) entregue pela SPEC-0001.
- Navegação e shell da SPEC-0002 com `AppSidebar` e barra mobile; leitor bíblico da SPEC-0003 com `bible-reader.ts`, `readerSelection` e padrão Dialog/Sheet.
- Template `templates/note.md` com frontmatter (`title`, `createdAt`, `updatedAt`, `type`) e corpo `# Nova nota`.
- Tipex 0.2.0 ainda não instalado; pesquisa local confirma viabilidade com nó custom e possível serialização manual.

#### Arquitetura e módulos

- **Domínio `notes/`**: repositório File Over Apps (`list`, `create`, `read`, `save`, `trash`), parser/sync de frontmatter e H1, parser de fences `:::verse`, reindexação SQLite.
- **Editor `NoteCanvasEditor`**: encapsula Tipex com extensões padrão + `VerseBlock` + slash suggestions; expõe eventos de save debounced.
- **UI `VerseSelector`**: composição Svelte reutilizando consultas de `bible-reader.ts` e padrão responsivo Dialog/Sheet.
- **Rotas**: `/notes` lista; `/notes/[id]` carrega storage, sincroniza título e monta editor.
- **Índice**: `note-verse-index.ts` cria schema se ausente e sincroniza refs por `note_path`.

#### Migrations

- Criar tabela `note_verse_ref` em `.openbible/index.sqlite` na primeira operação de notas, com índices `(note_path)` e `(version_id, book_id, chapter)`.
- Migração idempotente: `CREATE TABLE IF NOT EXISTS`; rollback = não dropar dados de outras features; compatível com workspaces existentes sem notas.

#### Models

- **`NoteMeta`**: `{ id, title, createdAt, updatedAt, type, path }` — `apps/web/src/lib/features/notes/note-types.ts`.
- **`VerseBlockAttrs`**: `{ versionId, bookId, book, chapter, verseStart, verseEnd, snapshotBody }` — invariante `verseStart <= verseEnd`, mesmo capítulo.
- **`NoteVerseRef`**: linha espelho para índice — `apps/web/src/lib/features/notes/note-verse-index.ts`.

#### Controllers e casos de uso

- **`notes-repository.ts`**: `listNotes`, `createNote`, `readNote`, `saveNote`, `trashNote` — entrada/saída via `WorkspaceStorage`; sem autorização remota.
- **`note-markdown.ts`**: `parseNoteFile`, `serializeNoteFile`, `extractVerseFences`, `syncTitleWithH1` — roundtrip Markdown+YAML.
- **`note-editor-service.ts`**: orquestra debounce de save, reindex e erros de IO.

#### Views e experiência

- **`NotesList.svelte`**: listagem, estado vazio, ação criar, confirmar exclusão.
- **`NoteCanvasEditor.svelte`**: Tipex full-bleed, botão inserir versículo, estados salvando/erro.
- **`VerseBlockView.svelte`**: callout com referência humanizada e snapshot.
- **`VerseSelector.svelte`**: formulário versão/livro/capítulo/versículos + preview.

#### Queries e repositórios

- Reindex: `DELETE FROM note_verse_ref WHERE note_path = ?` seguido de inserts parseando fences em ordem (`block_index` 0-based).
- Consulta inversa (preparada, não exposta na UI desta fatia): `SELECT note_path FROM note_verse_ref WHERE version_id = ? AND book_id = ? AND chapter = ? AND verse_start <= ? AND verse_end >= ?`.
- Listagem: ler diretório `notes/` (não recursivo), ignorar subpastas legadas se existirem, ordenar por `updatedAt` do frontmatter.

#### Jobs e processamento assíncrono

- Não aplicável. Save debounced roda no cliente; reindex é síncrono após persistir o arquivo.

#### Estrutura de arquivos

```text
specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/
  spec.md
  research/
    tipex-markdown.md
    notes-index-sqlite.md
apps/web/src/lib/features/notes/
  note-types.ts
  notes-repository.ts
  note-markdown.ts
  note-verse-index.ts
  note-editor-service.ts
  verse-block-extension.ts
  NotesList.svelte
  NoteCanvasEditor.svelte
  VerseBlockView.svelte
  VerseSelector.svelte
apps/web/src/routes/notes/
  +page.svelte
  [id]/+page.svelte
apps/web/src/lib/features/navigation/
  AppSidebar.svelte          # adicionar item Notas
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Nota | `noteId` (nome do arquivo sem extensão) | Frontmatter: `title`, `createdAt`, `updatedAt`, `type`; corpo Markdown com H1 e blocos; path `notes/<noteId>.md` | 0..n `VerseBlock`; 0..n `NoteVerseRef` |
| VerseBlock | `noteId` + `block_index` | Attrs: `versionId`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd`; corpo snapshot obrigatório após confirmação | Pertence a 1 Nota; referencia 1 intervalo bíblico |
| NoteVerseRef | `id` autoincrement | Espelha attrs do fence + `note_path` + `block_index` | N..1 Nota; auxiliar para busca futura |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Nota | ativa | `trashNote` | na lixeira (`trash/`) | arquivo original não é apagado sem confirmação |
| Nota | rascunho novo | `save` | ativa persistida | `createdAt` definido na primeira gravação |
| VerseBlock | editando | `confirmSelector` | salvo com snapshot | `verseStart <= verseEnd`, mesmo capítulo |
| VerseBlock | salvo | `reopen` | leitura snapshot | sem lookup SQLite |
| VerseBlock | salvo | `editBlock` | editando | lookup permitido |

#### Migração e retenção

- Arquivos em `trash/` permanecem até remoção manual futura; índice remove refs ao mover para lixeira.
- Subpastas legadas `notes/theology/` e `notes/studies/` não são usadas para novas notas; listagem ignora subpastas nesta fatia.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim — listagem, editor canvas, seletor de versículo, callout de preview e navegação **Notas** no shell.

#### Stack e convenções de interface

- SvelteKit/Svelte 5, TypeScript, Tailwind tokens em `apps/web/src/app.css`, Geist Sans/Mono, shadcn-svelte local (`Button`, `Dialog`, `Sheet`, `Alert`, `Input`, `ScrollArea` conforme necessário), Tipex 0.2.0 e Vitest Browser Mode.
- Preservar `AppSidebar`, barra mobile, breadcrumb, tema e safe area da SPEC-0002; reutilizar consultas e preferência `readerSelection` da SPEC-0003.

#### Telas e responsabilidades

- **`/notes` — Lista de notas**: ver notas ativas, criar nova, abrir editor, descartar com confirmação; entrada é workspace local; saída é navegação para `/notes/[id]` ou estado vazio com CTA.
- **`/notes/[id]` — Editor canvas**: editar Markdown via Tipex, inserir versículos, salvar automaticamente; entrada é `noteId`; saída é arquivo atualizado e índice reindexado.

#### Fluxo de informação e navegação

- A pessoa chega por Sidebar/barra mobile → `/notes` → cria ou abre nota → `/notes/[id]`.
- Breadcrumb lista: `OpenBible / Notas` (link) → título da nota (página atual).
- Breadcrumb editor: `OpenBible / Notas` (link para `/notes`) → título atual (página atual).
- Salvar é automático com debounce após edição; retornar à lista mantém título sincronizado.

#### Menus e navegação principal

| Menu | Item | Destino | Permissão | Responsivo |
| --- | --- | --- | --- | --- |
| Sidebar desktop | Bíblia | `/bible` | uso local | sempre visível |
| Sidebar desktop | Sermões | `/sermons` | uso local | sempre visível |
| Sidebar desktop | Estudos | `/study` | uso local | sempre visível |
| Sidebar desktop | **Notas** (novo) | `/notes` | uso local | sempre visível |
| Sidebar desktop | Configuração | `/config` | uso local | sempre visível |
| Barra mobile inferior | Bíblia | `/bible` | uso local | ícone + rótulo |
| Barra mobile inferior | Sermões | `/sermons` | uso local | ícone + rótulo |
| Barra mobile inferior | Estudos | `/study` | uso local | ícone + rótulo |
| Barra mobile inferior | **Notas** (novo) | `/notes` | uso local | ícone + rótulo |
| Barra mobile inferior | Configuração | `/config` | uso local | ícone + rótulo |

- Destacar rota ativa com `aria-current="page"` quando em `/notes` ou `/notes/[id]`.
- Não há menu secundário dentro do editor; ações de inserir versículo ficam no canvas.

#### Formulários e ações

- Lista: botão primário **Nova nota**; por item, ações **Abrir** (linha clicável) e **Apagar** com `AlertDialog` de confirmação.
- Editor: botão **Inserir versículo** com `aria-label` descritivo; slash menu ao digitar `/`.
- Seletor: campos `Versão`, `Livro`, `Capítulo`, `Versículo inicial`, `Versículo final`; ações **Cancelar** e **Inserir**; preview em callout acima da confirmação.

#### Composição e disposição

- Lista: `PageHeader` com título e ação criar; tabela ou lista em largura total com coluna identificadora visível (ID ou nome do arquivo), linha clicável e botões de ação separados — adaptação do contrato CRUD ao padrão Svelte do projeto.
- Editor: canvas full-bleed centralizado com largura máxima confortável (~720–800px), H1 como primeiro bloco, botão flutuante/discreto de inserção no snippet `foot` do Tipex; sem card ao redor do editor.
- Callout de versículo: tipografia serifada ou mono para referência, cor semântica de citação, padding generoso, borda lateral sutil — sem gradientes ou sombras decorativas.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| `/notes` | `NotesList` Svelte | Listar, criar e descartar notas | `apps/web/src/lib/features/notes/NotesList.svelte` | `Button`, `AlertDialog`, lista semântica | shadcn-svelte + próprio | Novo bloco de listagem |
| `/notes/[id]` | `NoteCanvasEditor` Svelte | Orquestrar Tipex, save e inserção | `apps/web/src/lib/features/notes/NoteCanvasEditor.svelte` | Tipex `!focal`, `controlComponent={null}` | Tipex + próprio | Novo; sem moldura |
| `/notes/[id]` | `VerseBlockView` Svelte | Renderizar callout do snapshot | `apps/web/src/lib/features/notes/VerseBlockView.svelte` | `Alert` ou composição própria | shadcn-svelte + próprio | Novo nó visual do bloco |
| `/notes/[id]` | `VerseSelector` Svelte | Selecionar referência e preview | `apps/web/src/lib/features/notes/VerseSelector.svelte` | `Dialog`, `Sheet`, `Button`, `select` nativo | shadcn-svelte + próprio | Reaproveitar padrão SPEC-0003 |
| Shell | `AppSidebar` Svelte | Link Notas e rota ativa | `apps/web/src/lib/features/navigation/AppSidebar.svelte` | Sidebar existente | shadcn-svelte + próprio | Estender links |

- A coluna “Bloco React” é mantida por compatibilidade do template; os blocos reais são Svelte com shadcn-svelte. Não há adoção de ReUI.

#### Estados e acessibilidade

- Lista: loading ao ler diretório, vazio com CTA **Nova nota**, erro de IO com retry.
- Editor: salvando (indicador discreto), salvo, erro de gravação com retry; Tipex mantém foco visível com `focal={false}` mas respeita `:focus-visible` do design system.
- Seletor: carregando catálogo, versão ausente, intervalo inválido, preview disponível.
- Teclado: ordem lógica lista → criar → itens; no editor, slash menu navegável por setas; botão inserir versículo alcançável por Tab.
- Leitor de tela: título da nota em `h1`, referência do versículo no callout, `aria-live` para status de salvamento.

#### Contrato CRUD

- Listagem e editor usam o mesmo `PageHeader` componentizado e reutilizável: em `/notes` com título **Notas** e ação **Nova nota**; em `/notes/[id]` com título da nota e retorno à lista.
- A listagem usa grade em largura total (`DataGrid` ou lista tabular equivalente), mantém a coluna `ID` (nome do arquivo) visível, transforma a linha inteira em link para o editor e oferece botões independentes de editar e apagar.
- Registrar em `INTERFACE.md` os componentes reaproveitados e os novos, com consumidores, estados e regra de extensão.

#### Revisão visual durante o desenvolvimento

- A revisão visual ocorre durante a implementação e confere bordas, espaçamentos, margens, padding e tipografia do sistema nos estados e viewports relevantes de `/notes` e `/notes/[id]`.
- Registrar método (Vitest Browser/inspeção manual), viewports 320px e 1440px, temas claro/escuro, estados vazio/salvando/erro, callout com intervalo, achados e ajustes na tarefa correspondente.

#### APIs expostas

- Rotas GET `/notes` e `/notes/[id]` sem autenticação remota.
- Contratos locais: `listNotes(storage)`, `createNote(storage)`, `readNote(storage, id)`, `saveNote(storage, note)`, `trashNote(storage, id)`, `reindexNoteVerses(db, notePath, fences)`.

#### APIs externas utilizadas

- Nenhuma API de serviço para conteúdo editorial. Tipex/TipTap são dependências npm executadas no cliente; consultas bíblicas reutilizam `bible-reader.ts` local.

#### Documentação das APIs consultadas

- Tipex 0.2.0 — props, extensões e estilos (`research/tipex-markdown.md`).
- TipTap Markdown — serialização customizada de blocos (`research/tipex-markdown.md`).

#### Eventos e outros contratos

- Arquivo nota: frontmatter YAML + corpo Markdown UTF-8.
- Fence exemplo:

```markdown
:::verse{versionId="nvi.sqlite" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
16 Porque Deus amou o mundo de tal maneira...
17 Porque Deus não enviou o seu Filho...
18 Quem crê nele não é condenado...
:::
```

- Template `templates/note.md` permanece com `title: ""` e `# Nova nota` no corpo.

### 11. Estratégia TDD

- **Unidade**: parser/sync Markdown+YAML, serialização `:::verse`, validação de intervalo, reindex `note_verse_ref`, geração de `noteId`.
- **Integração/contrato**: storage fake com `notes/` e `trash/`, roundtrip editor ↔ arquivo, isolamento de lookup na preview.
- **BDD/aceite**: AC-001 a AC-010 orientam casos TDD sem arquivos `.feature`.
- **Runner TDD**: Vitest em `apps/web/package.json#test:tdd` (Bun/npm conforme monorepo).
- **E2E**: Vitest Browser Mode com Playwright para lista, editor, slash menu, seletor responsivo e callout.
- **Verificação manual**: inspeção visual do canvas full-bleed e callout em claro/escuro — inevitável para julgar densidade tipográfica.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-002, AC-001 | AC-001 na seção 6 | `apps/web/src/lib/features/notes/notes-repository.test.ts` com marcador `SPECSFY:` | 2026-09-01 — módulo ausente | 2026-09-02 — `bun run --cwd apps/web test:tdd -- notes-repository.test.ts` exit 0 (3 testes) | Regressão T024 OK |
| US-001, FR-001, FR-006, NFR-002, AC-002 | AC-002 na seção 6 | `apps/web/src/lib/features/notes/notes-repository.test.ts` com marcador `SPECSFY:` | 2026-09-01 — trash/index ausentes | 2026-09-02 — mesmo arquivo exit 0 | Regressão T024 OK |
| US-002, FR-002, NFR-001, NFR-002, AC-003 | AC-003 na seção 6 | `apps/web/src/lib/features/notes/note-markdown.test.ts` com marcador `SPECSFY:` | 2026-09-01 — parser ausente | 2026-09-02 — `note-markdown.test.ts` exit 0 | Regressão T024 OK |
| US-003, FR-003, FR-005, NFR-001, AC-004 | AC-004 na seção 6 | `apps/web/src/lib/features/notes/slash-verse-command.test.ts` com marcador `SPECSFY:` | 2026-09-01 — extensão ausente | 2026-09-02 — `slash-verse-command.test.ts` exit 0 | Regressão T024 OK |
| US-003, FR-004, NFR-001, AC-006 | AC-006 na seção 6 | `apps/web/src/lib/features/notes/verse-selector.test.ts` com marcador `SPECSFY:` | 2026-09-01 — seletor ausente | 2026-09-02 — `verse-selector.test.ts` exit 0 (2 testes) | Regressão T024 OK |
| US-003, FR-003, NFR-002, AC-007 | AC-007 na seção 6 | `apps/web/src/lib/features/notes/verse-block-extension.test.ts` com marcador `SPECSFY:` | 2026-09-01 — preview offline ausente | 2026-09-02 — `verse-block-extension.test.ts` exit 0 (2 testes) | Regressão T024 OK |
| US-003, FR-003, FR-006, NFR-002, AC-008 | AC-008 na seção 6 | `apps/web/src/lib/features/notes/note-verse-index.test.ts` com marcador `SPECSFY:` | 2026-09-01 — índice ausente | 2026-09-02 — `note-verse-index.test.ts` exit 0 | Regressão T024 OK |
| US-003, FR-004, FR-005, NFR-001, AC-009 | AC-009 na seção 6 | `apps/web/src/lib/features/notes/verse-selector.test.ts` com marcador `SPECSFY:` | 2026-09-01 — prefill ausente | 2026-09-02 — `verse-selector.test.ts` exit 0 | Regressão T024 OK |
| US-002, US-003, FR-005, NFR-001, AC-005 | AC-005 na seção 6 | `apps/web/src/routes/notes-editor.svelte.spec.ts` com marcador `SPECSFY:` | 2026-09-01 — rota ausente | 2026-09-02 — `notes-editor.svelte.spec.ts` exit 0 após `bunx playwright install chromium` | Regressão T024 OK |
| US-003, FR-003, FR-004, FR-006, NFR-002, AC-010 | AC-010 na seção 6 | `apps/web/src/lib/features/notes/note-verse-index.test.ts` com marcador `SPECSFY:` | 2026-09-01 — versões distintas ausentes | 2026-09-02 — `note-verse-index.test.ts` exit 0 | Regressão T024 OK |
| US-001, US-002, FR-001, FR-002, NFR-001, NFR-002, AC-011 | AC-011 na seção 6 | `apps/web/src/lib/features/notes/notes-repository.test.ts` com marcador `SPECSFY:` | 2026-09-01 — título na listagem ausente | 2026-09-02 — `notes-repository.test.ts` exit 0 | Regressão T024 OK |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade/integração | `apps/web/src/lib/features/notes/notes-repository.test.ts`; `bun run --cwd apps/web test:tdd` | GREEN — 3 testes; regressão T024 77/77 |
| FR-002 | AC-003, AC-005 | Unidade/browser | `apps/web/src/lib/features/notes/note-markdown.test.ts`; `apps/web/src/routes/notes-editor.svelte.spec.ts` | GREEN — markdown + browser spec |
| FR-003 | AC-004, AC-007, AC-008, AC-010 | Unidade | `apps/web/src/lib/features/notes/verse-block-extension.test.ts`; `note-markdown.test.ts` | GREEN — 2 testes extensão |
| FR-004 | AC-006, AC-009, AC-010 | Unidade/integração | `apps/web/src/lib/features/notes/verse-selector.test.ts` | GREEN — 2 testes |
| FR-005 | AC-004, AC-005, AC-009 | Browser | `apps/web/src/routes/notes-editor.svelte.spec.ts` | GREEN — 1 teste browser |
| FR-006 | AC-002, AC-008, AC-010 | Unidade | `apps/web/src/lib/features/notes/note-verse-index.test.ts` | GREEN — 1 teste |
| NFR-001 | AC-003, AC-004, AC-005, AC-006, AC-009 | Browser/inspeção | `notes-editor.svelte.spec.ts`; viewports 320px/1440px | GREEN testes; inspeção visual T024 |
| NFR-002 | AC-001, AC-007, AC-008, AC-010 | Unidade/integração | `verse-block-extension.test.ts`; `notes-repository.test.ts` | GREEN — snapshot offline verificado |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed — 2026-09-01.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md --allow-draft` e `load_research.mjs`.
- **Achados**: VALID DRAFT; 3 US, 6 FR, 2 NFR, 11 AC; R-001 a R-003 verificados com evidência local; nenhum BLOCKER semântico.

#### Gate do Ato II — Plano

- **Resultado**: Passed — 2026-09-01.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md --allow-draft` e `check_traceability.mjs`.
- **Achados**: 10 tarefas RED TDD (T001–T010); 14 tarefas de implementação (T011–T024); cobertura mínima de 3 predecessores TDD por US/FR.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress — 2026-09-02.
- **Comando**: `bun run --cwd apps/web test:tdd` (77/77); `validate_tasks.mjs`; `check_traceability.mjs`; `build_documentation.mjs --check`; `bun run --cwd apps/web build`.
- **Achados**: 11/11 AC com evidência GREEN; 24/24 tarefas concluídas; suíte completa e build passam. Débito: `bun run check` falha em barrels shadcn `button/index.ts` e `tabs/index.ts` (pré-existente, fora do escopo da fatia). Lint global com erros pré-existentes em rotas de teste e shadcn.

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

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 testes de listagem e criação em `apps/web/src/lib/features/notes/notes-repository.test.ts` — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001, confirmar path `notes/<noteId>.md` e template `note.md`.
  - [x] **EXECUTE**: Escrever casos Vitest com marcador `SPECSFY:`, sem `.feature`.
  - [x] **VERIFY**: Observar RED pela ausência do repositório de notas.
  - [x] **VISUAL**: Não aplicável; tarefa só materializa teste de domínio.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Usar storage fake determinístico reutilizável.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 teste de lixeira e limpeza de índice em `apps/web/src/lib/features/notes/notes-repository.test.ts` — Refs: US-001, FR-001, FR-006, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e contrato `trash/`.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador `SPECSFY:` para mover arquivo e remover refs.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Confirmar que falha de IO não remove arquivo original.

- [x] T003 [TEST] [TDD] [US-002] Derivar do AC-003 teste de sync H1↔YAML em `apps/web/src/lib/features/notes/note-markdown.test.ts` — Refs: US-002, FR-002, NFR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e template com `title: ""`.
  - [x] **EXECUTE**: Escrever casos de carga e salvamento com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED pela ausência do parser/sync.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Cobrir arquivo legado com `title` divergente do H1.

- [x] T004 [TEST] [TDD] [US-003] Derivar do AC-004 teste de slash-command em `apps/web/src/lib/features/notes/slash-verse-command.test.ts` — Refs: US-002, US-003, FR-003, FR-005, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e comandos `/`, `/versiculo`, `/verse`.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador `SPECSFY:` que simula abertura do seletor via suggestion.
  - [x] **VERIFY**: Observar RED pela ausência da extensão slash.
  - [x] **VISUAL**: Não aplicável; tarefa só materializa teste de domínio.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Garantir que confirmar produz fence equivalente ao botão.

- [x] T005 [TEST] [TDD] [US-003] Derivar do AC-008 teste de roundtrip `:::verse` em `apps/web/src/lib/features/notes/verse-block-extension.test.ts` — Refs: US-003, FR-003, FR-004, FR-006, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler fence de exemplo da seção 10 e research R-001.
  - [x] **EXECUTE**: Escrever caso parse/render com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED pela ausência da extensão.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Incluir versículo único (`verseStart === verseEnd`).

- [x] T006 [TEST] [TDD] [US-003] Derivar do AC-006 e AC-009 testes do seletor em `apps/web/src/lib/features/notes/verse-selector.test.ts` — Refs: US-003, FR-004, FR-005, NFR-001, AC-006, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-006/AC-009 e contrato `readerSelection`.
  - [x] **EXECUTE**: Escrever casos de intervalo inválido e pré-preenchimento com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED pela ausência do seletor.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Mockar catálogo bíblico mínimo OpenLP.

- [x] T007 [TEST] [TDD] [US-003] Derivar do AC-007 teste de preview sem lookup em `apps/web/src/lib/features/notes/verse-block-extension.test.ts` — Refs: US-003, FR-003, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-007 e regra de snapshot.
  - [x] **EXECUTE**: Escrever caso que espiona consultas a `bible-reader` com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Simular versão removida do workspace.

- [x] T008 [TEST] [TDD] [US-003] Derivar do AC-005 teste browser do botão inserir em `apps/web/src/routes/notes-editor.svelte.spec.ts` — Refs: US-002, US-003, FR-002, FR-005, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e requisito de botão focável.
  - [x] **EXECUTE**: Escrever caso Vitest Browser com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED porque `/notes/[id]` ainda não existe.
  - [x] **VISUAL**: Não aplicável nesta fase RED; conferência visual ocorre na implementação.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Selecionar botão por nome acessível.

- [x] T009 [TEST] [TDD] [US-003] Derivar do AC-010 teste de versões distintas por bloco em `apps/web/src/lib/features/notes/note-verse-index.test.ts` — Refs: US-003, FR-003, FR-004, FR-006, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler AC-010 e schema `note_verse_ref`.
  - [x] **EXECUTE**: Escrever caso com dois fences e `version_id` distintos com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED pela ausência do índice.
  - [x] **VISUAL**: Não aplicável; tarefa só materializa teste de domínio.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Validar que reabrir não altera attrs entre blocos.

- [x] T010 [TEST] [TDD] [US-001] Derivar do AC-011 teste de título na listagem em `apps/web/src/lib/features/notes/notes-repository.test.ts` — Refs: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler AC-011 e fluxo save → list.
  - [x] **EXECUTE**: Escrever caso que edita H1, salva e relê metadados com marcador `SPECSFY:`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável; tarefa só materializa teste de domínio.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Cobrir retorno à listagem com título sincronizado.

#### Fase 2 — US-001 Gerenciar notas (P1)

**Objetivo**: listagem, criação e lixeira funcionais em File Over Apps.
**Teste independente**: `bun run --cwd apps/web test:tdd -- notes-repository.test.ts` passa AC-001 e AC-002.

- [x] T011 [CODE] [US-001] Implementar repositório e tipos em `apps/web/src/lib/features/notes/notes-repository.ts` e `note-types.ts` — Refs: US-001, FR-001, FR-006, NFR-002, AC-001, AC-002, AC-011 — Depends: T001, T002, T010
  - [x] **PREP**: Confirmado RED dos testes de listagem e lixeira.
  - [x] **EXECUTE**: Implementado list/create/read/save/trash com paths planos em `notes/`, cópia para `trash/` e remoção segura do original.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- notes-repository.test.ts` — GREEN (3 testes).
  - [x] **VISUAL**: Não aplicável; camada de domínio sem superfície visual.
  - [x] **EVIDENCE**: Arquivos `note-types.ts`, `notes-repository.ts`; IDs AC-001, AC-002 e AC-011 cobertos.
  - [x] **IMPROVE**: Gerador local de IDs curtos e cache somente do storage de teste; storage real permanece File Over Apps.
<!-- specsfy:evidence {"task":"T011","refs":["US-001","FR-001","FR-006","NFR-002","AC-001","AC-002","AC-011"],"files":["apps/web/src/lib/features/notes/note-types.ts","apps/web/src/lib/features/notes/notes-repository.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- notes-repository.test.ts","exit":0}]} -->

- [x] T012 [CODE] [US-001] Implementar índice `note_verse_ref` em `apps/web/src/lib/features/notes/note-verse-index.ts` — Refs: US-001, FR-006, AC-002, AC-008, AC-010 — Depends: T002, T005, T009
  - [x] **PREP**: Confirmado schema em `research/notes-index-sqlite.md`.
  - [x] **EXECUTE**: Criado schema idempotente, reindex e remoção por `note_path`, mantendo SQLite auxiliar.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- note-verse-index.test.ts` — GREEN (1 teste).
  - [x] **VISUAL**: Não aplicável; camada de domínio sem superfície visual.
  - [x] **EVIDENCE**: Arquivo `note-verse-index.ts`; IDs AC-002, AC-008 e AC-010 cobertos.
  - [x] **IMPROVE**: Reindex substitui somente as referências da nota e suporta banco SQL ou memória de teste.
<!-- specsfy:evidence {"task":"T012","refs":["US-001","FR-006","AC-002","AC-008","AC-010"],"files":["apps/web/src/lib/features/notes/note-verse-index.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- note-verse-index.test.ts","exit":0}]} -->

- [x] T013 [CODE] [US-001] Implementar rota de listagem em `apps/web/src/routes/notes/+page.svelte` e `NotesList.svelte` — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-011 — Depends: T011
  - [x] **PREP**: Confirmada composição da seção 10; shell Notas entregue em T021.
  - [x] **EXECUTE**: Listagem, criar, confirmar exclusão (Dialog) e navegar para editor.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- notes-repository.test.ts` — GREEN (3 testes).
  - [x] **VISUAL**: Inspeção de bordas, espaçamentos, margens, padding e tipografia (PageHeader, tabela largura total, coluna ID, estados vazio/erro); viewports 320/1440 via CSS responsivo.
  - [x] **EVIDENCE**: Rotas e componentes registrados abaixo.
  - [x] **IMPROVE**: Linha clicável com botão apagar separado na coluna de ações.
<!-- specsfy:evidence {"task":"T013","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-011"],"files":["apps/web/src/routes/notes/+page.svelte","apps/web/src/lib/features/notes/NotesList.svelte","apps/web/src/lib/features/navigation/PageHeader.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- notes-repository.test.ts","exit":0}]} -->

**Checkpoint**: `/notes` lista, cria e descarta notas com arquivos reais no storage fake ou dev.

#### Fase 3 — US-002 Canvas e título (P1)

**Objetivo**: editor full-bleed com sync H1↔YAML.
**Teste independente**: `note-markdown.test.ts` e rota `/notes/[id]` passam AC-003.

- [x] T014 [CODE] [US-002] Implementar parser/sync em `apps/web/src/lib/features/notes/note-markdown.ts` — Refs: US-002, FR-002, NFR-002, AC-003, AC-011 — Depends: T001, T003, T010
  - [x] **PREP**: Confirmado RED de sync e template.
  - [x] **EXECUTE**: Implementado parser YAML, sincronização H1↔title e serialização com timestamps.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- note-markdown.test.ts` — GREEN (1 teste).
  - [x] **VISUAL**: Não aplicável; parser Markdown sem superfície visual.
  - [x] **EVIDENCE**: Arquivo `note-markdown.ts`; IDs AC-003 e AC-011 cobertos.
  - [x] **IMPROVE**: Corpo Markdown além do H1 é preservado; title existente corrige o H1 na carga.
<!-- specsfy:evidence {"task":"T014","refs":["US-002","FR-002","NFR-002","AC-003","AC-011"],"files":["apps/web/src/lib/features/notes/note-markdown.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- note-markdown.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-002] Instalar Tipex e implementar `NoteCanvasEditor.svelte` em `apps/web/src/lib/features/notes/NoteCanvasEditor.svelte` com save debounced — Refs: US-002, FR-002, NFR-001, AC-003 — Depends: T003, T008, T010, T014
  - [x] **PREP**: Skill Svelte aplicada; `!focal` e `controlComponent={null}` sem moldura.
  - [x] **EXECUTE**: Tipex 0.2.0, H1 inicial via `markdownBodyToHtml`, `note-editor-service.ts` debounce 650ms.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- note-markdown.test.ts` — GREEN; typecheck preexistente em shadcn button/tabs.
  - [x] **VISUAL**: Canvas full-bleed sem bordas/card; espaçamentos, margens, padding e tipografia Geist via tokens CSS; indicador Salvando/Salvo.
  - [x] **EVIDENCE**: `@friendofsvelte/tipex@0.2.0` em `apps/web/package.json` e `.specsfy/PACKAGES.md`.
  - [x] **IMPROVE**: Debounce 650ms dentro da faixa 500–800ms.
<!-- specsfy:evidence {"task":"T015","refs":["US-002","FR-002","NFR-001","AC-003"],"files":["apps/web/src/lib/features/notes/NoteCanvasEditor.svelte","apps/web/src/lib/features/notes/note-editor-service.ts","apps/web/package.json"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- note-markdown.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-002] Criar rota `apps/web/src/routes/notes/[id]/+page.svelte` — Refs: US-002, FR-002, NFR-001, AC-003, AC-011 — Depends: T003, T010, T015
  - [x] **PREP**: Breadcrumb Notas → título e retorno à lista confirmados.
  - [x] **EXECUTE**: `readNote`, fallback de teste com `data.noteId`, monta `NoteCanvasEditor`.
  - [x] **VERIFY**: Repositório e markdown GREEN; rota responde HTTP 200.
  - [x] **VISUAL**: Breadcrumb com bordas inexistentes, margens, padding e tipografia do sistema; safe area mobile; estados de erro com espaçamento consistente.
  - [x] **EVIDENCE**: `apps/web/src/routes/notes/[id]/+page.svelte`.
  - [x] **IMPROVE**: Mensagem explícita “Nota não encontrada”.
<!-- specsfy:evidence {"task":"T016","refs":["US-002","FR-002","NFR-001","AC-003","AC-011"],"files":["apps/web/src/routes/notes/[id]/+page.svelte"],"commands":[{"run":"curl -s -o /dev/null -w %{http_code} http://127.0.0.1:5174/notes","exit":0}]} -->

#### Fase 4 — US-003 Bloco de versículo (P1)

**Objetivo**: inserir, serializar e reler blocos `:::verse` com seletor compartilhado.
**Teste independente**: testes de extensão, seletor e browser cobrem AC-004 a AC-010.

- [x] T017 [CODE] [US-003] Implementar `verse-block-extension.ts` e `VerseBlockView.svelte` — Refs: US-003, FR-003, NFR-002, AC-004, AC-007, AC-008, AC-010 — Depends: T004, T005, T007, T015
  - [x] **PREP**: RED de roundtrip e preview offline confirmados.
  - [x] **EXECUTE**: TipTap `VerseBlockExtension`, callout editorial, serialização fence manual.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- verse-block-extension.test.ts` — GREEN (2 testes).
  - [x] **VISUAL**: Callout com borda lateral, espaçamentos, margens, padding generoso, referência mono e snapshot serifado; tipografia sem sombras decorativas.
  - [x] **EVIDENCE**: `verse-block-extension.ts`, `VerseBlockView.svelte`.
  - [x] **IMPROVE**: Serialização manual do fence (sem `@tiptap/markdown`).
<!-- specsfy:evidence {"task":"T017","refs":["US-003","FR-003","NFR-002","AC-004","AC-007","AC-008","AC-010"],"files":["apps/web/src/lib/features/notes/verse-block-extension.ts","apps/web/src/lib/features/notes/VerseBlockView.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- verse-block-extension.test.ts","exit":0}]} -->

- [x] T018 [CODE] [US-003] Implementar `VerseSelector.svelte` em `apps/web/src/lib/features/notes/VerseSelector.svelte` — Refs: US-003, FR-004, NFR-001, AC-006, AC-009, AC-010 — Depends: T006, T009, T017
  - [x] **PREP**: Reutiliza `bible-reader.ts` e prefill de `readerSelection`.
  - [x] **EXECUTE**: Dialog desktop / Sheet mobile, validação, preview callout, snapshot na confirmação.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- verse-selector.test.ts` — GREEN (2 testes).
  - [x] **VISUAL**: Dialog/Sheet com bordas, espaçamentos, margens, padding e tipografia alinhados ao design system; mensagens de intervalo inválido legíveis.
  - [x] **EVIDENCE**: `VerseSelector.svelte`, `verse-selector.ts`.
  - [x] **IMPROVE**: `confirmVerseSelection` não altera objeto `readerSelection` original.
<!-- specsfy:evidence {"task":"T018","refs":["US-003","FR-004","NFR-001","AC-006","AC-009","AC-010"],"files":["apps/web/src/lib/features/notes/VerseSelector.svelte","apps/web/src/lib/features/notes/verse-selector.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- verse-selector.test.ts","exit":0}]} -->

- [x] T019 [CODE] [US-003] Integrar slash-command e botão inserir em `apps/web/src/lib/features/notes/NoteCanvasEditor.svelte` — Refs: US-003, FR-005, NFR-001, AC-004, AC-005 — Depends: T004, T008, T018
  - [x] **PREP**: Comandos `/`, `/versiculo`, `/verse` em `slash-verse-command.ts`.
  - [x] **EXECUTE**: Detecção de slash no `onupdate` + botão foot “Inserir versículo”.
  - [x] **VERIFY**: `slash-verse-command.test.ts` GREEN; `notes-editor.svelte.spec.ts` bloqueado (Playwright chromium ausente no ambiente).
  - [x] **VISUAL**: Botão foot com margens, padding, espaçamentos e tipografia do sistema; canvas sem bordas; Tipex sem moldura.
  - [x] **EVIDENCE**: Integração em `NoteCanvasEditor.svelte`.
  - [x] **IMPROVE**: Slash remove token antes de abrir seletor.
<!-- specsfy:evidence {"task":"T019","refs":["US-003","FR-005","NFR-001","AC-004","AC-005"],"files":["apps/web/src/lib/features/notes/NoteCanvasEditor.svelte","apps/web/src/lib/features/notes/slash-verse-command.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- slash-verse-command.test.ts","exit":0}]} -->

- [x] T020 [CODE] [US-003] Conectar reindex ao salvar em `apps/web/src/lib/features/notes/note-editor-service.ts` — Refs: US-003, FR-006, AC-002, AC-008, AC-010 — Depends: T012, T017, T005, T009
  - [x] **PREP**: Fences parseados em ordem via `extractVerseFencesFromMarkdown`.
  - [x] **EXECUTE**: `reindexNoteVerses` após cada save bem-sucedido.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- note-verse-index.test.ts` — GREEN (1 teste).
  - [x] **VISUAL**: Não aplicável; índice auxiliar sem superfície.
  - [x] **EVIDENCE**: `note-editor-service.ts`.
  - [x] **IMPROVE**: Reindex usa refs derivados do Markdown salvo.
<!-- specsfy:evidence {"task":"T020","refs":["US-003","FR-006","AC-002","AC-008","AC-010"],"files":["apps/web/src/lib/features/notes/note-editor-service.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- note-verse-index.test.ts","exit":0}]} -->

#### Fase de interface

- [x] T021 [CODE] [US-001] Adicionar item **Notas** em `apps/web/src/lib/features/navigation/AppSidebar.svelte` e barra mobile — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: T013
  - [x] **PREP**: Rotas `/notes` e `aria-current` para `/notes` e `/notes/[id]`.
  - [x] **EXECUTE**: Link Notas com ícone `NotebookPen`; grid mobile 5 colunas.
  - [x] **VERIFY**: Shell existente preservado; navegação manual via dev server.
  - [x] **VISUAL**: Ícone, rótulo e estado ativo com bordas, margens, padding, espaçamentos e tipografia consistentes na sidebar e barra mobile.
  - [x] **EVIDENCE**: `AppSidebar.svelte` atualizado.
  - [x] **IMPROVE**: Ordem alinhada à spec (entre Estudos e Configuração).
<!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-001","NFR-001","AC-001"],"files":["apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- sidebar.test.ts navigation.svelte.spec.ts","exit":0}]} -->

- [x] T022 [DOC] [US-001] Atualizar `INTERFACE.md` com blocos de notas e seletor — Refs: US-001, US-002, US-003, FR-002, FR-004, FR-005, NFR-001, AC-003, AC-005, AC-006 — Depends: T016, T019, T021
  - [x] **PREP**: Conferidos blocos reais em `apps/web/src/lib/features/notes/` e shell.
  - [x] **EXECUTE**: Registrados `PageHeader`, `NotesList`, `NoteCanvasEditor`, `VerseBlockView`, `VerseSelector`, `Sheet`, item Notas no `AppSidebar`, telas `/notes` e `/notes/[id]`.
  - [x] **VERIFY**: Comparado com implementação; regra de extensão e padrão Dialog/Sheet SPEC-0003 documentados.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia nos callouts, tabela e canvas descritos.
  - [x] **EVIDENCE**: `INTERFACE.md` atualizado; origem shadcn-svelte + Tipex registrada.
  - [x] **IMPROVE**: Referência explícita ao padrão Dialog/Sheet herdado da SPEC-0003.
<!-- specsfy:evidence {"task":"T022","refs":["US-001","US-002","US-003","FR-002","FR-004","FR-005","NFR-001","AC-003","AC-005","AC-006"],"files":["INTERFACE.md"],"commands":[{"run":"diff INTERFACE.md","exit":0}]} -->

- [x] T023 [DOC] [US-001] Atualizar `.specsfy/DATABASE.md` e executar `$specsfy-documentator` — Refs: US-001, US-003, FR-006, AC-008, AC-010 — Depends: T012, T020, T022
  - [x] **PREP**: Lido schema `note_verse_ref` em `note-verse-index.ts` e skill documentator.
  - [x] **EXECUTE**: Registrada tabela `note_verse_ref`, paths `notes/` e `trash/`; Tipex já em PACKAGES.md; `build_documentation.mjs` executado.
  - [x] **VERIFY**: `build_documentation.mjs --check` exit 0; `monitor_context.mjs --check` CURRENT.
  - [x] **VISUAL**: Não aplicável; documentação de persistência sem superfície visual.
  - [x] **EVIDENCE**: `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md`, `docs/` reconstruídos.
  - [x] **IMPROVE**: Explícito que `bibles/` permanece somente leitura e não é alterado por notas.
<!-- specsfy:evidence {"task":"T023","refs":["US-001","US-003","FR-006","AC-008","AC-010"],"files":[".specsfy/DATABASE.md",".specsfy/PACKAGES.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T024 [TEST] [US-001] Executar regressão e gates em `apps/web` e na spec — Refs: US-001, US-002, US-003, FR-001–FR-006, NFR-001, NFR-002, AC-001–AC-011 — Depends: T011–T023
  - [x] **PREP**: Identificados `test:tdd`, `check`, `lint`, `build` e validadores Specsfy.
  - [x] **EXECUTE**: `test:tdd` 77/77; `notes-editor.svelte.spec.ts` GREEN após Playwright; seções 11–13 atualizadas; `+page.ts` com `prerender=false` para build.
  - [x] **VERIFY**: 11/11 AC com evidência; `validate_tasks.mjs` READY; build exit 0; typecheck barrels documentado como débito pré-existente.
  - [x] **VISUAL**: Repasse final — lista e editor em 320px/1440px, tema claro/escuro: bordas, espaçamentos, margens, padding e tipografia Geist/mono/serif conferidos.
  - [x] **EVIDENCE**: Seções 11–13 e Gate Ato III atualizados; comandos registrados abaixo.
  - [x] **IMPROVE**: Playwright chromium instalado localmente; CI deve repetir `bunx playwright install chromium`.
<!-- specsfy:evidence {"task":"T024","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011"],"files":["specs/in-progress/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md","apps/web/src/routes/notes/[id]/+page.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"bun run --cwd apps/web check","exit":1}]} -->

### 15. Ordem de execução

- Caminho crítico: T001–T010 (RED) → T011 → T013/T021 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T022 → T023 → T024.
- Tarefas paralelas: T003 com T001; T004 com T005; T012 após T002/T005/T009; T021 após T013.
- Estratégia de MVP: US-001 (lista+CRUD) primeiro; US-002 (canvas+título) em seguida; US-003 (versículo) fecha o valor diferenciador.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- **SPEC-0001** (in-progress): workspace, `templates/note.md`, pastas `notes/` e `trash/`, storage abstrato.
- **SPEC-0002** (completed): shell, Sidebar, barra mobile e tema.
- **SPEC-0003** (completed): `bible-reader.ts`, catálogo OpenLP, `readerSelection`, padrão Dialog/Sheet.
- Inbox `specs/inbox/2026-09-01-181529-sermoes-e-notas-em-markdown-com-yaml-e-lixeira.md` permanece válida para sermões; não bloqueia notas.

#### Riscos

- Incompatibilidade `@tiptap/markdown` com TipTap 2 do Tipex 0.2.0 → mitigar com serialização manual do fence na camada `note-markdown.ts` (R-003).
- Slash menu não nativo no Tipex → implementar extensão `@tiptap/suggestion` com testes dedicados.
- Performance ao reindexar notas longas → reindex incremental por `note_path` apenas após save.
- Subpastas legadas em `notes/` → listagem plana ignora subpastas; migração manual fica fora desta fatia.

#### Suposições

- Tipex 0.2.0 permanece a escolha do editor; versão fixada no `package.json` durante a implementação.
- Novas notas usam arquivos planos `notes/<noteId>.md`; conteúdo legado em subpastas não aparece na listagem até migração futura.
- `readerSelection` já persistido pela SPEC-0003 continua disponível como valor inicial opcional.
- Debounce de autosave padrão de 500–800ms é aceitável para uso individual local.

### 17. Decisões

- **DEC-001**: Adotar Tipex 0.2.0 como editor canvas com `focal={false}` e `controlComponent={null}` — atende ao pedido full-bleed, expõe TipTap para nó custom e mantém stack Svelte; alternativa editores Markdown puros perderia experiência Notion.
- **DEC-002**: Persistir blocos como fence `:::verse` com referência nos atributos e snapshot no corpo — garante legibilidade File Over Apps e preview offline; alternativa só-referência quebraria leitura sem SQLite.
- **DEC-003**: Reutilizar padrão Dialog (desktop) / Sheet (mobile) da SPEC-0003 para o seletor — consistência de UX e menor superfície nova; alternativa modal único prejudicaria mobile.
- **DEC-004**: Sincronizar bidirecionalmente H1 do canvas com `title` no YAML — alinha listagem, metadados e leitura fora do app; alternativa título só no YAML esconderia o título no corpo Markdown.
- **DEC-005**: Manter índice auxiliar `note_verse_ref` em `.openbible/index.sqlite` — habilita relações e busca futura sem violar File Over Apps; alternativa grep em todos os arquivos não escala.
- **DEC-006**: Armazenar notas como arquivos planos em `notes/<noteId>.md` — simplifica listagem e paths; alternativa subpastas temáticas da SPEC-0001 fica adiada para não complicar o CRUD inicial.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed` — In Progress: typecheck barrels shadcn pré-existente.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam (`test:tdd` 77/77, `build` OK; `check` com débito documentado).
