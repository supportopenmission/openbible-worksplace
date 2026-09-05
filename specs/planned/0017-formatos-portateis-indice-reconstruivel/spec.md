# Especificação integrada: Formatos portáteis e índice reconstruível

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0017 |
| Slug | 0017-formatos-portateis-indice-reconstruivel |
| Status | Planned |
| Effort | 9 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Fatiamento de alto risco por envolver migração de formato, preservação autoral, projeções SQLite em dois runtimes e exportação externa. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | In Progress |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible atualmente serializa partes enriquecidas das notas com diretivas `:::verse`/`:::video`, extensões e embeds, enquanto destaques podem depender da projeção SQLite. Isso reduz a legibilidade fora do app e faz com que a perda do índice ameace a consulta autoral.

#### Resultado desejado

Notas, sermões, blocos de verso/vídeo e destaques terão fonte autoral local em Markdown/JSON, legível e preservável em editor simples, Obsidian, GitHub/GitHub Pages e PDF. `.openbible/index.sqlite` será somente projeção versionada e reconstruível.

#### Métricas de sucesso

- 100% das fixtures canônicas e legadas fazem round-trip sem perda do corpo, dos campos conhecidos nem das chaves desconhecidas suportadas.
- Os 14 cenários de aceite mantêm título, referência, snapshot e links legíveis sem índice, rede, player ou comentários de metadados.
- Duas reconstruções da mesma fixture, uma em `sql.js` e outra em `rusqlite`, produzem 100% das linhas lógicas equivalentes após ordenação canônica.
- 100% dos destaques da fixture autoral possuem exatamente um JSON próprio e podem ser recuperados depois de apagar o índice.
- A fixture de carga com 1.000 notas e 10.000 destaques conclui o rebuild em até 30 segundos no runner de CI, informa progresso ao menos a cada 250 arquivos e não bloqueia a abertura direta de uma nota.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] CommonMark/GFM oferecem blockquotes, links, HTML comments e fences interoperáveis; `iframe` não é fallback universal — Verdict: verified — Confidence: high — Evidence: `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md#CommonMark-e-GitHub-Flavored-Markdown` — Budget: 1/5.
- **R-002** [critical] GitHub oculta comentários HTML e não apresenta parte do HTML embutido, inclusive vídeo — Verdict: verified — Confidence: high — Evidence: `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md#GitHub` — Budget: 1/5.
- **R-003** [critical] Obsidian usa YAML no início e callouts como extensão de blockquote — Verdict: verified — Confidence: high — Evidence: `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md#Obsidian` — Budget: 1/5.
- **R-004** [critical] Jekyll/GitHub Pages processa Markdown com frontmatter e GFM/Kramdown, mas widgets dependentes de plugin não são universais — Verdict: verified — Confidence: medium — Evidence: `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md#Jekyll-e-GitHub-Pages` — Budget: 1/5.
- **R-005** [critical] `remark-directive` é apropriado quando o produtor controla as ferramentas e limitado fora delas — Verdict: verified — Confidence: high — Evidence: `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md#remark-directive` — Budget: 1/5.
- **R-006** [critical] O código atual usa fences, embeds, destaques e `.openbible/index.sqlite` nos módulos existentes — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/notes/note-markdown.ts`, `apps/web/src/lib/features/notes/note-export.ts`, `apps/web/src/lib/features/notes/note-verse-index.ts`, `apps/web/src/lib/features/bible/reader-highlights-repository.ts` — Budget: 1/2.

#### Fontes e contexto consultados

- `specs/backlog/0018-formatos-portateis-indice-reconstruivel.md`, fonte de comportamento e 14 critérios de aceitação.
- Backlogs 0016/0017 e specs 0013/0015/0005/0006, para workspace, editor, embeds, índice e destaques.
- Inspeção de `apps/web/src/lib/features/notes`, `apps/web/src/lib/features/bible`, `apps/web/src/lib/storage` e `apps/desktop/src-tauri/src/commands/workspace.rs`.

#### Documentação consultada

- CommonMark 0.31.2, https://spec.commonmark.org/0.31.2/ — sintaxe padrão.
- GitHub Flavored Markdown 0.29-gfm, https://github.github.com/gfm/ — renderização e tagfilter.
- GitHub Markdown, https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax — comentários e HTML.
- Obsidian syntax/callouts/properties, https://obsidian.md/help/syntax — YAML, links e callouts.
- Jekyll Markdown/pages, https://jekyllrb.com/docs/configuration/markdown/ — frontmatter e build.
- `remark-directive` 4.0.0, https://github.com/remarkjs/remark-directive — limitações das diretivas.
- RFC 8259, https://www.rfc-editor.org/rfc/rfc8259 — JSON; SQLite docs, https://www.sqlite.org/docs.html — projeção local.

#### Artefatos de pesquisa armazenados

- `specs/planned/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md`: notas próprias, URLs e conclusões, consultado em 2026-09-05; sem reprodução de conteúdo protegido.

#### Dúvidas respondidas

- **Q**: JSON ou XML para dados estruturados? → **A**: JSON versionado é o sidecar canônico; XML fica fora desta fatia.
- **Q**: Verso deve ser callout, fence ou iframe? → **A**: blockquote visível mais comentário HTML JSON; callout/iframe somente em exportação derivada.
- **Q**: SQLite continua fonte? → **A**: não; Markdown/JSON são autorais e o índice é reconstruível.
- **Q**: Bíblias SQLite entram no índice? → **A**: não; permanecem fontes importadas imutáveis.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante para a definição inicial.

### 3. Escopo e atores

#### Incluído

- Perfil Markdown UTF-8 com frontmatter escalar e chaves desconhecidas preservadas.
- Envelopes portáveis de verso/vídeo com fallback visível e comentários HTML JSON versionados.
- Parser tolerante, migração explícita/atômica de fences legados e fallback para `==...==`/`++...++`.
- Um JSON por destaque, IDs estáveis, índice SQLite versionado/reconstruível e PDF/Markdown offline.

#### Fora de escopo

- Múltiplos workspaces, backup/restauração, Automerge, agentes de IA, XML, novos provedores, renomeação física de pasta e pixel-identidade de widgets.
- Conversão das Bíblias SQLite importadas para Markdown/JSON.

#### Atores

- **Pessoa autora**: escreve notas/sermões, edita referências, exporta e resolve conflitos.
- **Pessoa leitora**: cria e consulta destaques bíblicos.
- **Editor externo**: Obsidian, GitHub, GitHub Pages ou editor simples que lê o conteúdo visível.
- **Índice local**: projeção descartável, nunca fonte autoral.
- **Adaptador de storage**: fornece arquivos do workspace ativo no PWA/Tauri.

### 4. Princípios e restrições do projeto

- **PR-001**: Files over apps: Markdown/JSON autorais sobrevivem à ausência do OpenBible.
- **PR-002**: Conteúdo visível usa CommonMark/GFM e não depende de `:::`, callout, wiki-link, HTML customizado ou `iframe`.
- **PR-003**: Metadado oculto é complementar; perdê-lo nunca apaga texto visível.
- **PR-004**: SQLite é projeção; Bíblias SQLite são fontes read-only distintas.
- **PR-005**: Migração ocorre somente em salvamento explícito, atômico e com rollback.
- **PR-006**: IDs estáveis são independentes de caminho, posição e texto.
- **PR-007**: Preservar Svelte 5/SvelteKit, TypeScript, Tailwind 4, Milkdown e primitives existentes.

### 5. Histórias de usuário

#### US-001 — Escrever notas portáteis e fazer round-trip (P1)

Como pessoa autora, quero salvar notas em Markdown legível com frontmatter compatível, para abrir, versionar e editar fora do OpenBible sem perder metadados.

**Por que P1**: é a fonte autoral mínima das demais saídas.
**Teste independente**: salvar fixture, abrir em CommonMark/GFM, reabrir no app e comparar corpo, frontmatter e chaves desconhecidas.
**Requisitos**: FR-001, NFR-001, NFR-002, NFR-004.

#### US-002 — Editar blocos de verso e vídeo com degradação segura (P1)

Como pessoa autora, quero editar referência, versão e vídeo em blocos ricos, para obter conveniência no app sem sacrificar a leitura externa.

**Por que P1**: esses blocos hoje dependem mais de extensões próprias.
**Teste independente**: criar, alterar, degradar, migrar e exportar verso/vídeo sem rede.
**Requisitos**: FR-002, FR-003, NFR-001, NFR-002, NFR-004.

#### US-003 — Preservar destaques e reconstruir o índice (P1)

Como pessoa leitora, quero destaques em JSON e índice recriável, para usar marcações após mover, copiar ou reparar o workspace.

**Por que P1**: evita confundir cache SQLite com autoria e prepara sincronização futura.
**Teste independente**: remover/corromper `.openbible/index.sqlite`, reconstruir em `sql.js` e `rusqlite` e comparar projeções.
**Requisitos**: FR-004, FR-005, NFR-001, NFR-003.

#### US-004 — Exportar conteúdo interoperável (P1)

Como pessoa autora, quero exportar ou imprimir notas em Markdown e PDF, para compartilhar em Obsidian, GitHub/GitHub Pages ou documento offline.

**Por que P1**: portabilidade inclui saída utilizável sem app ou rede.
**Teste independente**: gerar Markdown canônico/derivado e PDF offline, verificando títulos, links, referências e texto.
**Requisitos**: FR-002, FR-005, NFR-002, NFR-003, NFR-004.

### 6. Cenários BDD de aceite

#### AC-001 — Round-trip de frontmatter
**Cobre**: US-001, FR-001, NFR-001, NFR-002
```gherkin
@US-001 @FR-001 @NFR-001 @NFR-002 @AC-001
Feature: Nota Markdown portátil
  Scenario: preservar frontmatter e chaves desconhecidas
    Given uma nota UTF-8 com id, type, schemaVersion e uma chave YAML desconhecida
    When a pessoa abre e salva a nota no OpenBible
    Then corpo, valores escalares e chave desconhecida permanecem legíveis e equivalentes
```

#### AC-002 — Leitura Markdown sem aplicativo
**Cobre**: US-001, FR-001, NFR-002, NFR-004
```gherkin
@US-001 @FR-001 @NFR-002 @NFR-004 @AC-002
Feature: Leitura externa
  Scenario: ler construções comuns
    Given uma nota com títulos, parágrafos, listas, links e blockquotes
    When ela é aberta em editor simples ou renderer GFM
    Then o conteúdo permanece compreensível sem plugin do OpenBible
```

#### AC-003 — Parser tolerante e diagnóstico
**Cobre**: US-001, FR-001, FR-003, NFR-001, NFR-004
```gherkin
@US-001 @FR-001 @FR-003 @NFR-001 @NFR-004 @AC-003
Feature: Entrada parcialmente inválida
  Scenario: não destruir fonte
    Given uma nota com YAML não escalar ou comentário JSON inválido
    When a pessoa tenta salvar
    Then a fonte original fica disponível, o corpo legível e a gravação destrutiva bloqueada
```

#### AC-004 — Verso visível em blockquote
**Cobre**: US-002, FR-002, NFR-002
```gherkin
@US-002 @FR-002 @NFR-002 @AC-004
Feature: Envelope de verso
  Scenario: ler verso sem plugin
    Given um bloco de verso criado no editor
    When renderizado por CommonMark/GFM
    Then título, referência, versão e snapshot aparecem em blockquote visível
```

#### AC-005 — Edição rica e conflito
**Cobre**: US-002, FR-002, NFR-001, NFR-004
```gherkin
@US-002 @FR-002 @NFR-001 @NFR-004 @AC-005
Feature: Edição de referência
  Scenario: preservar divergência externa
    Given envelope válido com id estável e texto externo divergente
    When referência ou versão é alterada
    Then id permanece e ambas as evidências são preservadas e sinalizadas
```

#### AC-006 — Degradação segura
**Cobre**: US-002, FR-002, FR-003, NFR-002, NFR-004
```gherkin
@US-002 @FR-002 @FR-003 @NFR-002 @NFR-004 @AC-006
Feature: Comentário ausente
  Scenario: abrir blockquote sem metadados
    Given comentário HTML removido de um verso
    When a nota é aberta
    Then o conteúdo continua legível e o app informa edição rica degradada
```

#### AC-007 — Vídeo portátil
**Cobre**: US-002, US-004, FR-002, FR-005, NFR-002
```gherkin
@US-002 @US-004 @FR-002 @FR-005 @NFR-002 @AC-007
Feature: Envelope de vídeo
  Scenario: compreender vídeo sem iframe ou rede
    Given vídeo com título, provedor e URL em link Markdown
    When aberto no GitHub, Obsidian, editor simples ou modo offline
    Then título e URL ficam visíveis e player é melhoria opcional
```

#### AC-008 — Migração explícita de legacy
**Cobre**: US-002, FR-003, NFR-001, NFR-004
```gherkin
@US-002 @FR-003 @NFR-001 @NFR-004 @AC-008
Feature: Migração de diretivas
  Scenario: migrar somente em salvamento explícito
    Given `:::verse` ou `:::video` válido e uma diretiva incompleta
    When a pessoa lê e depois salva explicitamente
    Then leitura não reescreve, válido migra atomicamente e inválido permanece literal sinalizado
```

#### AC-009 — Um JSON por destaque
**Cobre**: US-003, FR-004, NFR-001, NFR-002, NFR-003
```gherkin
@US-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-009
Feature: Fonte autoral de destaque
  Scenario: salvar destaque granular
    Given destaque criado no leitor
    When o workspace é salvo
    Then existe exatamente `highlights/<highlightId>.json` e `reader_highlight` pode ser gerado
```

#### AC-010 — Reconstrução determinística
**Cobre**: US-003, FR-004, NFR-001, NFR-003
```gherkin
@US-003 @FR-004 @NFR-001 @NFR-003 @AC-010
Feature: Índice reconstruível
  Scenario: reconstruir índice ausente ou corrompido
    Given mesmo conjunto canônico e nenhum índice válido
    When reconstruído em sql.js e rusqlite
    Then ids, relações, ordenação e versão da projeção são equivalentes sem mudar autoria
```

#### AC-011 — Bíblias imutáveis
**Cobre**: US-003, FR-004, FR-005, NFR-001, NFR-003
```gherkin
@US-003 @FR-004 @FR-005 @NFR-001 @NFR-003 @AC-011
Feature: Fontes SQLite separadas
  Scenario: reconstruir sem alterar Bíblia importada
    Given Bíblia SQLite importada e índice ausente
    When a projeção é reconstruída
    Then a Bíblia permanece somente leitura e disponível
```

#### AC-012 — PDF offline
**Cobre**: US-004, FR-005, NFR-002, NFR-004
```gherkin
@US-004 @FR-005 @NFR-002 @NFR-004 @AC-012
Feature: Exportação PDF
  Scenario: imprimir sem rede
    Given nota com verso e vídeo canônicos
    When exportada para PDF sem rede
    Then título, referência, texto do verso e título/URL do vídeo aparecem
```

#### AC-013 — Exportação derivada documentada
**Cobre**: US-004, FR-003, FR-005, NFR-002, NFR-004
```gherkin
@US-004 @FR-003 @FR-005 @NFR-002 @NFR-004 @AC-013
Feature: Destinos externos
  Scenario: exportar para Obsidian ou GitHub Pages
    Given documento canônico com envelopes e extensões legadas
    When uma exportação derivada é solicitada
    Then há fallback visível, callout/iframe é opcional e a saída não substitui a fonte
```

#### AC-014 — IDs portáveis e contrato JSON
**Cobre**: US-003, US-004, FR-004, FR-005, NFR-002, NFR-003
```gherkin
@US-003 @US-004 @FR-004 @FR-005 @NFR-002 @NFR-003 @AC-014
Feature: Portabilidade de identidade
  Scenario: mover raiz e abrir em outro leitor
    Given notas, blocos e destaques com ids estáveis e JSON versionado
    When a raiz muda de caminho ou o arquivo sai do OpenBible
    Then ids continuam válidos, texto legível e nenhum XML novo é exigido
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Ler/gravar nota Markdown UTF-8 com frontmatter YAML escalar, `id`, `type`, `schemaVersion` e chaves desconhecidas preservadas.
- **FR-002**: Representar verso como blockquote visível e vídeo como link visível, usando comentário HTML JSON versionado para metadados de edição.
- **FR-003**: Aceitar formatos legados de forma tolerante, manter inválidos como texto e migrar somente em salvamento explícito atômico.
- **FR-004**: Salvar cada destaque em `highlights/<highlightId>.json` e reconstruir `reader_highlight` e outras projeções.
- **FR-005**: Manter `.openbible/index.sqlite` como índice descartável/versionado, separar Bíblias SQLite e gerar Markdown/PDF offline.

#### Não funcionais

- **NFR-001**: Integridade/atomicidade: falhas não truncam, substituem silenciosamente ou apagam a fonte. **Verificação**: fixtures de falha, rollback e comparação semântica.
- **NFR-002**: Interoperabilidade: caminho feliz legível por CommonMark/GFM, Obsidian, GitHub/GitHub Pages e PDF. **Verificação**: fixtures/renderização, sem exigir pixel-identidade.
- **NFR-003**: Determinismo/desempenho: mesma entrada gera as mesmas linhas lógicas em `sql.js`/`rusqlite`; 1.000 notas e 10.000 destaques são reconstruídos em até 30 segundos no CI, com progresso a cada 250 arquivos, sem bloquear a abertura direta de nota. **Verificação**: comparação ordenada, benchmark e teste de abertura durante rebuild.
- **NFR-004**: Segurança/privacidade/acessibilidade: parser não executa HTML/JS/URLs, limita comentário a 16 KiB, profundidade JSON a 8 e parse em memória a 16 MiB; dados ficam locais e estados são expostos em texto. **Verificação**: fixtures maliciosas/limites, estados, teclado e tecnologia assistiva.

#### Erros e casos-limite

- Frontmatter inválido → corpo legível, fonte preservada, diagnóstico e bloqueio destrutivo.
- Comentário JSON ausente/inválido → fallback visível e estado degradado.
- Snapshot divergente → preservar ambas as evidências e exigir decisão.
- Fence inválido → literal visível, não migrado e restante processado.
- Migração interrompida → rollback/temporário identificável; nunca Markdown truncado.
- Vídeo inválido/rede ausente → título/URL e PDF continuam disponíveis.
- Índice ausente/corrompido → abrir autoria e reconstruir sem apagar arquivos.
- JSON de destaque inválido/duplicado → manter fonte, omitir só projeção inválida e relatar.
- Colisão de id → não mesclar silenciosamente; oferecer resolução preservando fontes.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- O PWA é SvelteKit/Svelte 5 + TypeScript, Milkdown/ProseMirror, `remark-directive`, `sql.js`/WASM e a abstração `WorkspaceStorage` em `apps/web/src/lib/storage/types.ts`.
- O editor e exportador atuais estão em `apps/web/src/lib/features/notes/{MilkdownNoteEditor.svelte,milkdown-markdown-io.ts,verse-block-extension.ts,milkdown-verse-node.ts,milkdown-video-node.ts,note-export.ts}`.
- A projeção atual é `.openbible/index.sqlite`, lida por `note-verse-index.ts` e `reader-highlights-repository.ts`; Bíblias importadas ficam em SQLite separado.
- Tauri usa `apps/desktop/src-tauri/src/commands/workspace.rs` com `rusqlite`; OPFS, storage local e ponte Tauri são adaptadores existentes.

#### Arquitetura e módulos

- Adicionar `portable-markdown.ts` para frontmatter escalar, comentários HTML JSON, unknown keys e round-trip; `portable-envelope.ts` para verso/vídeo, fallback e snapshot/conflict.
- Adaptar `milkdown-markdown-io.ts`, `verse-block-extension.ts`, `milkdown-verse-node.ts`, `milkdown-video-node.ts` e `note-export.ts` para criar fonte canônica, mantendo legacy apenas no leitor/migrador.
- Adicionar `highlight-file-repository.ts` para `highlights/<id>.json` e `index-rebuilder.ts` para varredura, ordenação e projeção determinísticas.
- Adaptar `note-verse-index.ts` e `reader-highlights-repository.ts` para escrever somente projeções derivadas; `WorkspaceStorage` fornece arquivos do workspace ativo.
- Web usa `sql.js`/WASM em worker quando necessário; Tauri usa `rusqlite` com contrato de tabelas equivalente, sem confundir Bíblias read-only com índice.

#### Migrations

- **Expand**: aceitar leitura de frontmatter/fonte canônica, `:::verse`/`:::video`, `==`/`++` e comentários desconhecidos; adicionar `schemaVersion`/ids sem remover dados.
- **Dual read**: marcar origem `canonical`, `legacy`, `degraded` ou `conflict`; abrir nunca reescreve.
- **Contract**: em salvamento explícito, escrever envelope canônico e sidecar JSON por arquivo, depois atualizar SQLite.
- **Rollback**: temporário no mesmo storage, flush/rename ou equivalente atômico; só publicar a projeção após a fonte confirmada. Em falha, preservar fonte anterior e temporário identificável.

#### Models

- `PortableNote`: id, type, schemaVersion, frontmatter conhecido/desconhecido e corpo; id não depende de path.
- `PortableBlockEnvelope`: id, kind (`verse`/`video`), schemaVersion, dados estruturados, snapshot/fallback e hash de divergência.
- `HighlightRecord`: highlightId, referência bíblica, texto/estilo, timestamps e campos desconhecidos; um JSON por id.
- `IndexProjection`: versão, origem, ids, relações e estado de rebuild; descartável e sem autoridade autoral.
- `ParseDiagnostic`: código, localização, severidade, mensagem acessível e ação recomendada; não registra conteúdo completo em log.

#### Controllers e casos de uso

- `openPortableNote`/`savePortableNote`: parse tolerante e commit atômico, em módulo de notas.
- `editVerseEnvelope`/`editVideoEnvelope`: atualizar referência/versão ou título/URL, preservando conflito e regenerando fallback.
- `migrateLegacyOnExplicitSave`: converter fences válidos, manter inválidos literais e emitir diagnóstico.
- `writeHighlightRecord`/`deleteHighlightRecord`: sidecar autoral primeiro, projeção depois.
- `rebuildWorkspaceIndex`: varrer apenas workspace ativo, ordenar canonicamente, reportar progresso e publicar transação final.
- `exportPortableMarkdown`/`exportPdfFallback`: gerar derivado sem mutar a fonte; autorização é a permissão do workspace ativo.

#### Views e experiência

- `MilkdownNoteEditor.svelte`, `VerseBlockView.svelte` e `YouTubeBlockView.svelte` mostram blocos ricos, source/fallback e ações de edição.
- `NoteIndexMenu.svelte` e a tela de destaques exibem índice ausente, reconstruindo, concluído, falho e retry sem bloquear leitura.
- Exportação apresenta Markdown canônico/derivado e PDF; falha de rede mantém título, referência, texto e URL.
- Estados usam texto semântico, `role=status`/`role=alert`, foco devolvido ao acionador e layout responsivo.

#### Queries e repositórios

- `index-rebuilder.ts` lê notas e sidecars, ordena por id/path lógico e grava tabelas derivadas em transação; índices podem ser recriados.
- Consultas de leitor continuam usando `reader_highlight` e `note_verse_ref`, mas nenhuma escrita autoral depende da linha SQLite.
- A conexão de Bíblias importadas é read-only e fora da rotina de rebuild.

#### Jobs e processamento assíncrono

- Rebuild pode usar worker web ou comando Tauri assíncrono, com progresso, cancelamento antes do commit e retry idempotente.
- Não há fila remota/dead-letter nesta fatia; falha local gera diagnóstico e não altera a fonte.

#### Estrutura de arquivos

```text
apps/web/src/lib/features/notes/
  portable-markdown.ts
  portable-envelope.ts
  highlight-file-repository.ts
  index-rebuilder.ts
  note-export.ts                 # adaptar
  milkdown-markdown-io.ts        # adaptar
  note-verse-index.ts            # adaptar
apps/web/src/lib/features/bible/reader-highlights-repository.ts # adaptar
apps/desktop/src-tauri/src/commands/workspace.rs                 # adaptar
tests/fixtures/portable-markdown/{notes,highlights,legacy,expected}/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `PortableNote` | `note.id` estável | arquivo `.md` UTF-8; `type`, `schemaVersion`, escalares conhecidos e unknown keys; corpo GFM | contém blocos; pertence ao workspace ativo |
| `PortableBlockEnvelope` | `block.id` estável | `kind`, versão, referência/versão/snapshot ou provedor/título/URL; fallback visível | fica em uma nota; não depende de posição |
| `HighlightRecord` | `highlightId` | JSON versionado, referência, texto/estilo, timestamps e unknown keys | um `highlights/<id>.json`; projeta `reader_highlight` |
| `IndexProjection` | versão + workspace | tabelas derivadas, relações, ordenação e estado | deriva de Markdown/JSON; não é fonte |
| `BibleSource` | arquivo SQLite importado | somente leitura, schema do importador | consultada por referência; fora do rebuild |
| `ParseDiagnostic` | operação/localização | código, severidade, mensagem acessível e ação | associado à fonte sem substituí-la |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Nota | `legacy` | abrir | `readable-legacy` | abrir não reescreve |
| Nota | `readable-legacy` | salvar explicitamente | `canonical` | migração atômica ou fonte intacta |
| Bloco | `canonical` | divergência externa | `conflict` | snapshot e texto preservados |
| Bloco | `canonical` | comentário removido | `degraded` | fallback visível permanece |
| Índice | `missing`/`corrupt` | iniciar rebuild | `rebuilding` | autoria não muda |
| Índice | `rebuilding` | commit | `ready` | projeção determinística/versionada |
| Índice | `rebuilding` | falha/cancelamento | `unavailable` | SQLite incompleto não publica |
| Destaque | `authoritative-file` | projetar | `indexed` | JSON regenera linha |

#### Migração e retenção

- Markdown/JSON autorais têm retenção indefinida; índice e diagnósticos são descartáveis/regeneráveis.
- Temporários de migração ficam somente para recuperação e não substituem a fonte sem commit confirmado.
- Chaves desconhecidas são preservadas lexicalmente/semanticamente quando possível; caso contrário o salvamento é bloqueado.
- Índice contém apenas projeção necessária à consulta e nunca é o único armazenamento de snapshot autoral.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A feature afeta editor de notas, destaques, recuperação do índice e exportação.

#### Stack e convenções de interface

- Preservar SvelteKit/Svelte 5, TypeScript, Tailwind 4, Milkdown e componentes existentes de `apps/web/src/lib/components/ui`; não introduzir React, ReUI ou outra biblioteca.
- É uma superfície de editor/recovery/exportação, não CRUD administrativo: o template genérico de DataGrid/Breadcrumb de equipe não se aplica.

#### Telas e responsabilidades

- `apps/web/src/routes/notes/[id]/+page.svelte`: pessoa autora edita nota; entrada é fonte canônica e saída é commit/diagnóstico.
- `MilkdownNoteEditor.svelte`, `VerseBlockView.svelte`, `YouTubeBlockView.svelte`: editar campos estruturados e exibir fallback.
- `apps/web/src/routes/highlights/+page.svelte` e `BibleReader.svelte`: criar/consultar/remover sidecars e consumir projeção.
- `WorkspaceSettings.svelte` e storage: mostrar ausência, rebuild, falha, retry e exportação.

#### Fluxo de informação e navegação

- A pessoa chega pelo shell de notas ou leitor; o workspace ativo permanece visível no shell.
- Parser lê a fonte sem esperar índice; status informa rebuild/retry. Salvamento explícito passa por commit atômico.
- Exportação lê a fonte e gera derivado, sem sobrescrever o original. Heading e shell fornecem contexto; não criar Breadcrumb de equipe.

#### Menus e navegação principal

- Menu principal `Notas` leva a `/notes`; a seleção de uma nota leva a `/notes/[id]`, onde o slash command existente insere verso/vídeo e o menu do bloco oferece editar, mostrar source e resolver conflito/degradação.
- Menu principal `Bíblia` leva a `/bible`; a ação de destaques leva a `/highlights`. `Configurações` leva a `/config`, onde o painel de recuperação do índice é acessível.
- O menu de exportação da nota oferece Markdown canônico, derivado e PDF, sempre com aviso de fonte autoral; no mobile, as mesmas ações usam toolbar, drawer ou popover acessível sem criar destinos diferentes.

#### Formulários e ações

- Verso: referência, versão, snapshot, atualizar, manter texto externo e resolver conflito. Vídeo: título, provedor, URL e abrir link.
- Rebuild: progresso, cancelar antes do commit, retry e relatório. Exportação: formato, destino, derivação e aviso; erros em `role=alert`.

#### Composição e disposição

- Manter canvas do editor como região principal, toolbar contextual e status discreto; fallback legível em largura estreita.
- Estados não dependem apenas de cor/ícone. Validar desktop/mobile, claro/escuro, zoom, teclado, conteúdo longo e `prefers-reduced-motion`.

#### Blocos React e componentes selecionados

| Tela | Bloco Svelte | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- |
| Editor | `PortableBlockStatus` | fallback/degradação/conflito | `apps/web/src/lib/features/notes/PortableBlockStatus.svelte` | Alert/status existente | próprio + UI local | novo |
| Editor | `VerseBlockView` | referência, snapshot e edição | `apps/web/src/lib/features/notes/VerseBlockView.svelte` | bloco Milkdown existente | próprio | adaptar |
| Editor | `YouTubeBlockView` | título, URL e player opcional | `apps/web/src/lib/features/notes/YouTubeBlockView.svelte` | link + iframe derivado | próprio | adaptar para link canônico |
| Recovery | `IndexRecoveryPanel` | progresso, erro e retry | `apps/web/src/lib/storage/IndexRecoveryPanel.svelte` | Alert/Progress/Button/Dialog locais | shadcn-svelte local | novo |
| Exportação | `NoteExportMenu` | formato e aviso | `apps/web/src/lib/features/notes/NoteExportMenu.svelte` | DropdownMenu/Dialog locais | shadcn-svelte local | adaptar |

- A stack é Svelte, não Laravel/React; ReUI e blocos React não se aplicam. Os componentes Svelte acima correspondem ao shell existente.

#### Estados e acessibilidade

- Loading: status textual “Lendo/Reconstruindo” e progresso quando mensurável; vazio explica ausência sem sugerir perda.
- Erro: `role=alert`, código amigável, fonte preservada e retry. Degradado/conflito: texto explícito e ação de decisão.
- Teclado: menus/dialogs com Tab, Enter, Escape; foco retorna ao bloco. URLs/referências têm nomes acessíveis; iframe derivado tem título e fallback.
- Breadcrumb de equipe não é aplicável; heading e shell identificam a tela atual.

#### Contrato CRUD

- Não aplicável como CRUD administrativo: não haverá DataGrid, coluna `ID` nem telas separadas de criar, editar e apagar. Notas usam o `PageHeader` existente e editor contínuo; destaques usam ações acessíveis do leitor para criar, consultar e apagar, pois arquivos são a fonte autoral.

#### Revisão visual durante o desenvolvimento

- A implementação deverá conferir bordas, espaçamentos, margens, padding e tipografia do sistema no editor, recovery e exportação em desktop/mobile, claro/escuro, conteúdo curto/longo, teclado, zoom e overflow; nesta fase não há evidência visual.

#### APIs expostas

- API interna TypeScript v1: `parsePortableNote(source, logicalPath)` retorna `{ note, diagnostics, sourceKind }`; `serializePortableNote(note, originalSource)` retorna bytes UTF-8 ou erro não destrutivo; `parseBlockEnvelope(source)`/`serializeBlockEnvelope(block)` retornam blocos tipados e diagnósticos.
- `writeHighlightRecord(storage, record)` confirma primeiro `highlights/<id>.json`; `rebuildWorkspaceIndex(storage, options)` retorna progresso, contagens, versão e diagnóstico; `exportPortableMarkdown(note, target)`/`exportPdfFallback(note)` retornam um derivado e nunca mutam a fonte.
- Entradas maiores que os limites definidos, versões incompatíveis, IDs duplicados, JSON/YAML inválido e storage sem escrita retornam erros tipados; nenhum retorno inclui path físico, conteúdo completo em log ou credencial.
- `WorkspaceStorage` recebe caminhos lógicos, bytes e operação atômica equivalente; retornos incluem diagnostics, schema/version e estado de commit.

#### APIs externas utilizadas

- Nenhuma API externa de runtime. Links bíblicos/vídeo são dados; player remoto é opcional e não bloqueia leitura/PDF.

#### Documentação das APIs consultadas

- URLs e versões estão indexadas na seção 2 e em `research/markdown-portability/evidence.md`; atualizações de parser exigem fixtures revisadas.

#### Eventos e outros contratos

- `portable-source-committed`: fonte confirmada; consumidor é rebuild do índice.
- `index-rebuild-progress`: operação, etapa e processados/total opcional; sem texto autoral.
- `portable-diagnostic`: código, localização, severidade e ação. Sincronização futura recebe arquivos/sidecars, não handles ou índice local.

#### Contrato normativo OpenBible Portable Markdown v1

- Frontmatter obrigatório no topo, UTF-8 e LF canônico: `id`, `type` e `schemaVersion: 1`; valores conhecidos são escalares YAML. A ordem e a representação original das chaves desconhecidas são preservadas quando o documento é regravado.
- Um verso usa exatamente um envelope com marcador inicial, fallback visível e marcador final. O JSON é compacto; o serializer escapa `<`, `>` e sequências com hífen como escapes Unicode antes de inseri-lo no comentário, impedindo fechamento/injeção de comentário:

```markdown
<!-- openbible:block {"schemaVersion":1,"id":"block-uuid","kind":"verse","versionId":"nvi.sqlite","version":"NVI","bookId":43,"book":"João","chapter":3,"verseStart":16,"verseEnd":18,"snapshotHash":"sha256:..."} -->
> **João 3:16–18 · NVI**
>
> 16 Porque Deus amou o mundo...
<!-- /openbible:block -->
```

- `snapshotHash` é SHA-256 do fallback visível normalizado para LF. Divergência entre hash e fallback produz `conflict`; ausência/invalidade do comentário produz `degraded`. O app não regenera o texto até decisão explícita.
- Um vídeo usa o mesmo envelope, com `kind: "video"`, `provider`, `title` e `url`; o fallback obrigatório é um link Markdown com provedor visível:

```markdown
<!-- openbible:block {"schemaVersion":1,"id":"block-uuid","kind":"video","provider":"youtube","title":"Contexto histórico","url":"https://www.youtube.com/watch?v=..."} -->
[Vídeo: Contexto histórico — YouTube](https://www.youtube.com/watch?v=...)
<!-- /openbible:block -->
```

- O parser trata comentários e URLs como dados. Somente `https:` e provedores explicitamente suportados podem ativar player; qualquer outra URL permanece link/fallback sem execução. Profundidade JSON máxima 8, comentário de metadados máximo 16 KiB e arquivo individual máximo 16 MiB para parse em memória; acima disso, o sistema preserva a fonte e informa limite excedido.
- Destaque autoral v1 usa JSON UTF-8 em `highlights/<highlightId>.json` com `schemaVersion`, `highlightId`, `versionId`, `bookId`, `chapter`, `verseStart`, `verseEnd`, `styleId`, `createdAt` e `updatedAt`. Campos adicionais são preservados; `highlightId` do conteúdo deve coincidir com o nome lógico do arquivo.
- O índice v1 contém uma tabela de metadados da projeção e tabelas derivadas `reader_highlight` e `note_verse_ref`; relações canônicas usam `note_id` e `block_id`, mantendo `note_path` apenas como atributo atualizável. Comparação entre runtimes é por linhas lógicas ordenadas, não por igualdade binária do arquivo SQLite.

### 11. Estratégia TDD

- **Unidade**: parser/serializer de frontmatter e envelopes, migração tolerante, sidecars JSON, schema e regras determinísticas de projeção.
- **Integração/contrato**: `WorkspaceStorage`, `sql.js`/WASM, projeção `.openbible/index.sqlite`, exportação e separação da Bíblia SQLite read-only.
- **BDD/aceite**: AC-001…AC-014 são a referência; cada caso TDD tem marcador `SPECSFY:` correspondente e não há `.feature`.
- **Runner TDD**: Vitest pelo script `apps/web/package.json` (`bun run --cwd apps/web test:tdd -- <arquivo>`).
- **E2E**: não aplicável nesta preparação; as jornadas Svelte serão cobertas na implementação e os contratos unitários já materializam os REDs.
- **Verificação manual**: inspeção posterior em Obsidian, GitHub/GitHub Pages e PDF para legibilidade/preservação, pois os renderizadores externos não são controlados pelo Vitest.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, NFR-002, AC-001 | AC-001 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-001` | RED: serializer não preserva id/schema/unknown key | Pending | Pending |
| US-001, FR-001, NFR-002, NFR-004, AC-002 | AC-002 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-002` | RED: header canônico ausente | Pending | Pending |
| US-001, FR-001, FR-003, NFR-001, NFR-004, AC-003 | AC-003 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-003` | RED: YAML não escalar aceito | Pending | Pending |
| US-002, FR-002, NFR-002, AC-004 | AC-004 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-004` | RED: bloco criado por `renderVerseFence` não vira blockquote/envelope | Pending | Pending |
| US-002, FR-002, NFR-001, NFR-004, AC-005 | AC-005 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-005` | RED: conflito/id/envelope ausentes | Pending | Pending |
| US-002, FR-002, FR-003, NFR-002, NFR-004, AC-006 | AC-006 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-006` | RED: estado degraded ausente | Pending | Pending |
| US-002, US-004, FR-002, FR-005, NFR-002, AC-007 | AC-007 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-007` | RED: exportador exige iframe e omite link | Pending | Pending |
| US-002, FR-003, NFR-001, NFR-004, AC-008 | AC-008 | `apps/web/src/lib/features/notes/legacy-migration.test.ts` — `SPECSFY: AC-008` | RED: namespace atual não expõe APIs distintas de leitura/salvamento canônico | Pending | Pending |
| US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 | AC-009 | `apps/web/src/lib/features/notes/highlight-file-repository.test.ts` — `SPECSFY: AC-009` | RED: `persistHighlight` só projeta SQLite e não cria `highlights/<id>.json` | Pending | Pending |
| US-003, FR-004, NFR-001, NFR-003, AC-010 | AC-010 | `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — `SPECSFY: AC-010` | RED: `prepareWorkspace` recria índice, mas não reconstrói linhas dos Markdown/JSON | Pending | Pending |
| US-003, FR-004, FR-005, NFR-001, NFR-003, AC-011 | AC-011 | `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — `SPECSFY: AC-011` | RED: rebuild não gera projeção, embora preserve bytes de `bibles/*.sqlite` | Pending | Pending |
| US-004, FR-005, NFR-002, NFR-004, AC-012 | AC-012 | `apps/web/src/lib/features/notes/note-export.test.ts` — `SPECSFY: AC-012` | RED: PDF/export mantém iframe e não URL visível | Pending | Pending |
| US-004, FR-003, FR-005, NFR-002, NFR-004, AC-013 | AC-013 | `apps/web/src/lib/features/notes/note-export.test.ts` — `SPECSFY: AC-013` | RED: exportação derivada não tem link Markdown | Pending | Pending |
| US-003, US-004, FR-004, FR-005, NFR-002, NFR-003, AC-014 | AC-014 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-014` | RED: id é perdido no roundtrip | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade | `portable-markdown.test.ts`; Vitest focal | RED observado; GREEN Pending |
| FR-002 | AC-004, AC-005, AC-006, AC-007 | Unidade/contrato | `portable-envelope.test.ts`; Vitest focal | RED observado; GREEN Pending |
| FR-003 | AC-003, AC-006, AC-008, AC-013 | Unidade/contrato | `legacy-migration.test.ts`, `note-export.test.ts` | RED observado; GREEN Pending |
| FR-004 | AC-009, AC-010, AC-011, AC-014 | Integração | `highlight-file-repository.test.ts`, `index-rebuilder.test.ts` | RED observado; GREEN Pending |
| FR-005 | AC-007, AC-011, AC-012, AC-013, AC-014 | Integração/contrato | `index-rebuilder.test.ts`, `note-export.test.ts` | RED observado; GREEN Pending |
| NFR-001 | AC-001, AC-003, AC-005, AC-008, AC-009, AC-010, AC-011 | Falha/integração | Vitest focal + rollback fixtures | RED observado; GREEN Pending |
| NFR-002 | AC-001, AC-002, AC-004, AC-006, AC-007, AC-009, AC-012, AC-013, AC-014 | Compatibilidade | fixtures CommonMark/GFM e export | RED observado; manual Pending |
| NFR-003 | AC-009, AC-010, AC-011, AC-014 | Determinismo/performance | `index-rebuilder.test.ts`; benchmark futuro | RED observado; GREEN Pending |
| NFR-004 | AC-003, AC-005, AC-006, AC-008, AC-012, AC-013 | Segurança/a11y | Vitest + Svelte/browser futuro | RED observado; GREEN Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed em 2026-09-05 — READY; estrutura Specsfy/2.0 válida e cobertura mínima confirmada para 4 US, 5 FR e 4 NFR, cada qual ligado a pelo menos 3 AC distintos.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md`
- **Achados**: nenhum P1 aberto. Revisão de produto, arquitetura e segurança concluída.
- **FIND-PROD-001** [P2] [Resolved] métricas inicialmente não possuíam alvos quantitativos — Refs: NFR-003 — Evidence: specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md:33 — Effect: sucesso e desempenho não seriam comparáveis — Suggestion: resolvido com percentuais, fixture de carga, prazo e frequência de progresso.
- **FIND-ARCH-001** [P1] [Resolved] envelope portátil estava descrito sem gramática normativa — Refs: FR-002 — Evidence: specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md:532 — Effect: serializers poderiam produzir formatos incompatíveis — Suggestion: resolvido com exemplos canônicos, hash e regras de degradação.
- **FIND-SEC-001** [P1] [Resolved] comentários, JSON e URLs precisavam de limites e neutralização explícita — Refs: NFR-004 — Evidence: specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md:559 — Effect: conteúdo importado poderia fechar comentário, pressionar memória ou ativar player indevido — Suggestion: resolvido com escaping, limites, HTTPS e allowlist de player.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`,
  severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: Passed em 2026-09-05 — 28 tarefas, 14 predecessores TDD concluídos em RED, 10 tarefas de código abertas, 3 de documentação e 1 de regressão; 27/27 IDs cobertos e dependências acíclicas.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md`
- **Achados**: `validate_tasks` e `validate_interface_tasks` passaram; 15 casos novos falham pelo comportamento ausente e 9 testes legados passam. GREEN/refactor pertencem à fase 7 e permanecem pendentes.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress — fase 6 prepare; 14 REDs válidos observados, sem implementação de produção.
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md .`
- **Achados**: T001–T014 concluídos como testes RED; 15 testes novos falharam por comportamento canônico ausente, enquanto 9 testes legados da mesma execução passaram. GREEN/refactor permanecem Pending; Delivery Gate não pode ser Passed.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-001 em `apps/web/src/lib/features/notes/portable-markdown.test.ts` — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Confirmar o Gherkin AC-001, fixture UTF-8, frontmatter escalar e chave desconhecida.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador `SPECSFY: AC-001`, sem `.feature`.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-markdown.test.ts -t 'SPECSFY: AC-001'` e observar RED por parser canônico ausente.
  - [x] **VISUAL**: Não aplicável: materializa regra de serialização sem tela.
  - [x] **EVIDENCE**: Registrar comando, RED e IDs AC-001/FR-001/NFR-001/NFR-002.
  - [x] **IMPROVE**: Fixar fixture mínima que diferencie perda de unknown key de perda de corpo.

- [x] T002 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-002 em `apps/web/src/lib/features/notes/portable-markdown.test.ts` — Refs: US-001, FR-001, NFR-002, NFR-004, AC-002 — Depends: none
  - [x] **PREP**: Confirmar leitura externa de títulos, listas, links e blockquotes em GFM.
  - [x] **EXECUTE**: Escrever caso com marcador `SPECSFY: AC-002`, sem alterar o parser de produção.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-markdown.test.ts -t 'SPECSFY: AC-002'` e observar RED.
  - [x] **VISUAL**: Não aplicável: o teste verifica texto serializado, não UI.
  - [x] **EVIDENCE**: Registrar saída RED e vínculo AC-002/FR-001/NFR-002/NFR-004.
  - [x] **IMPROVE**: Usar fixture que não dependa de plugin OpenBible.

- [x] T003 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-003 em `apps/web/src/lib/features/notes/portable-markdown.test.ts` — Refs: US-001, FR-001, FR-003, NFR-001, NFR-004, AC-003 — Depends: none
  - [x] **PREP**: Confirmar YAML não escalar, comentário JSON inválido e bloqueio destrutivo.
  - [x] **EXECUTE**: Escrever caso com marcador `SPECSFY: AC-003` e bytes originais como oráculo.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-markdown.test.ts -t 'SPECSFY: AC-003'` e observar RED.
  - [x] **VISUAL**: Não aplicável: cobre diagnóstico de parser.
  - [x] **EVIDENCE**: Registrar diagnóstico esperado, comando e RED.
  - [x] **IMPROVE**: Separar erro de parse de erro de commit para tornar rollback observável.

- [x] T004 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-004 em `apps/web/src/lib/features/notes/portable-envelope.test.ts` — Refs: US-002, FR-002, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Confirmar blockquote visível com título, referência, versão e snapshot.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-004` para serialização sem fence canônico.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'SPECSFY: AC-004'` e observar RED.
  - [x] **VISUAL**: Não aplicável: valida fonte Markdown.
  - [x] **EVIDENCE**: Registrar `renderVerseFence` de criação, saída canônica esperada e RED AC-004/FR-002/NFR-002.
  - [x] **IMPROVE**: Fixar newline e escaping como parte da fixture.

- [x] T005 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-005 em `apps/web/src/lib/features/notes/portable-envelope.test.ts` — Refs: US-002, FR-002, NFR-001, NFR-004, AC-005 — Depends: none
  - [x] **PREP**: Confirmar id estável, snapshot divergente e decisão explícita.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-005` sem sobrescrever texto externo.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'SPECSFY: AC-005'` e observar RED.
  - [x] **VISUAL**: Não aplicável: cobre conflito de dados.
  - [x] **EVIDENCE**: Registrar as duas evidências preservadas e o RED.
  - [x] **IMPROVE**: Usar hash explícito para tornar conflito determinístico.

- [x] T006 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-006 em `apps/web/src/lib/features/notes/portable-envelope.test.ts` — Refs: US-002, FR-002, FR-003, NFR-002, NFR-004, AC-006 — Depends: none
  - [x] **PREP**: Confirmar comportamento quando comentário HTML é removido.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-006` exigindo fallback e estado degraded.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'SPECSFY: AC-006'` e observar RED.
  - [x] **VISUAL**: Não aplicável: estado será testado no modelo antes da tela.
  - [x] **EVIDENCE**: Registrar fallback esperado, diagnóstico e RED.
  - [x] **IMPROVE**: Garantir que ausência de metadado nunca resulte em string vazia.

- [x] T007 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-007 em `apps/web/src/lib/features/notes/portable-envelope.test.ts` — Refs: US-002, US-004, FR-002, FR-005, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Confirmar link Markdown visível e player remoto opcional.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-007` exigindo ausência de iframe na fonte.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'SPECSFY: AC-007'` e observar RED.
  - [x] **VISUAL**: Não aplicável: valida contrato de arquivo.
  - [x] **EVIDENCE**: Registrar título/URL e RED do contrato.
  - [x] **IMPROVE**: Cobrir URL de provedor desconhecido sem descarte.

- [x] T008 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-008 em `apps/web/src/lib/features/notes/legacy-migration.test.ts` — Refs: US-002, FR-003, NFR-001, NFR-004, AC-008 — Depends: none
  - [x] **PREP**: Separar leitura sem escrita, migration explícita, fence válido e fence inválido.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-008` contra arquivo temporário controlado.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/legacy-migration.test.ts -t 'SPECSFY: AC-008'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa atomicidade/migração.
  - [x] **EVIDENCE**: Registrar leitura intacta, ausência das APIs distintas no namespace e resultado RED.
  - [x] **IMPROVE**: Incluir fence incompleto para evitar parser guloso.

- [x] T009 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-009 em `apps/web/src/lib/features/notes/highlight-file-repository.test.ts` — Refs: US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Confirmar um arquivo JSON por `highlightId` e projeção separada.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-009` com storage fake realista.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/highlight-file-repository.test.ts -t 'SPECSFY: AC-009'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa persistência autoral.
  - [x] **EVIDENCE**: Registrar chamada a `persistHighlight`, caminho esperado `highlights/<id>.json`, projeção observada e RED.
  - [x] **IMPROVE**: Fixar ordenação e id independente do path.

- [x] T010 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-010 em `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — Refs: US-003, FR-004, NFR-001, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Confirmar entradas idênticas, índice ausente/corrupto e projeção determinística.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-010` comparando linhas ordenadas.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/index-rebuilder.test.ts -t 'SPECSFY: AC-010'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa rebuild.
  - [x] **EVIDENCE**: Registrar Markdown/JSON preparados, índice ausente/corrupto, linhas consultadas e RED.
  - [x] **IMPROVE**: Separar leitura de fonte do commit final do SQLite.

- [x] T011 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-011 em `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Confirmar Bíblia SQLite read-only fora da varredura autoral.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-011` comparando bytes antes/depois.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/index-rebuilder.test.ts -t 'SPECSFY: AC-011'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa isolamento de fontes.
  - [x] **EVIDENCE**: Registrar bytes de `bibles/nvi.sqlite` antes/depois, projeção esperada e RED.
  - [x] **IMPROVE**: Usar conexão read-only explícita na fixture.

- [x] T012 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-012 em `apps/web/src/lib/features/notes/note-export.test.ts` — Refs: US-004, FR-005, NFR-002, NFR-004, AC-012 — Depends: none
  - [x] **PREP**: Confirmar fallback local de verso/vídeo sem rede.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-012` para Markdown de impressão/PDF.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/note-export.test.ts -t 'SPECSFY: AC-012'` e observar RED.
  - [x] **VISUAL**: Não aplicável: o PDF visual será verificado na fase de implementação.
  - [x] **EVIDENCE**: Registrar fallback esperado e RED.
  - [x] **IMPROVE**: Manter título/URL mesmo com resolver remoto indisponível.

- [x] T013 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-013 em `apps/web/src/lib/features/notes/note-export.test.ts` — Refs: US-004, FR-003, FR-005, NFR-002, NFR-004, AC-013 — Depends: none
  - [x] **PREP**: Confirmar exportação derivada, fallback visível e aviso de não substituição.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-013` para Obsidian/GitHub Pages.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/note-export.test.ts -t 'SPECSFY: AC-013'` e observar RED.
  - [x] **VISUAL**: Não aplicável: valida contrato derivado.
  - [x] **EVIDENCE**: Registrar destino e RED.
  - [x] **IMPROVE**: Proibir exportador de mutar a fonte canônica.

- [x] T014 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-014 em `apps/web/src/lib/features/notes/portable-markdown.test.ts` — Refs: US-003, US-004, FR-004, FR-005, NFR-002, NFR-003, AC-014 — Depends: none
  - [x] **PREP**: Confirmar ids estáveis, sidecar JSON e XML fora do contrato.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-014` após mover a raiz lógica.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-markdown.test.ts -t 'SPECSFY: AC-014'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa portabilidade de identidade.
  - [x] **EVIDENCE**: Registrar ids antes/depois e RED.
  - [x] **IMPROVE**: Fixar que path físico não participa da identidade.

#### Fase 2 — Código por fatia vertical

- [ ] T015 [CODE] [US-001] Implementar parser e serializer canônicos em `apps/web/src/lib/features/notes/portable-markdown.ts` — Refs: US-001, FR-001, NFR-001, NFR-002, NFR-004, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [ ] **PREP**: Confirmar os três REDs, limites de parser e executar `$specsfy-documentator` antes do código.
  - [ ] **EXECUTE**: Implementar frontmatter escalar, unknown keys, comentários limitados e round-trip.
  - [ ] **VERIFY**: Rodar os três testes focais e `npm run check` em `apps/web`.
  - [ ] **VISUAL**: Não aplicável: módulo de persistência sem tela.
  - [ ] **EVIDENCE**: Registrar arquivos, comandos, GREEN e IDs cobertos.
  - [ ] **IMPROVE**: Preservar representação lexical desconhecida sem normalização destrutiva.

- [ ] T016 [CODE] [US-002] Implementar envelopes e conflitos em `apps/web/src/lib/features/notes/portable-envelope.ts` — Refs: US-002, FR-002, NFR-001, NFR-002, NFR-004, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [ ] **PREP**: Confirmar REDs AC-004..006 e executar `$specsfy-documentator` antes do código.
  - [ ] **EXECUTE**: Implementar blockquote, comentário JSON, snapshot/hash, degraded e conflict.
  - [ ] **VERIFY**: Rodar testes focais, parser e typecheck.
  - [ ] **VISUAL**: Não aplicável: contrato de envelope; UI ficará na fase de interface.
  - [ ] **EVIDENCE**: Registrar GREEN, fallback e diagnostics.
  - [ ] **IMPROVE**: Centralizar escaping e limites em função compartilhada.

- [ ] T017 [CODE] [US-002] Migrar legacy e vídeo em `apps/web/src/lib/features/notes/{legacy-migration.ts,note-export.ts}` — Refs: US-002, US-004, FR-002, FR-003, FR-005, NFR-002, NFR-004, AC-007, AC-008, AC-013 — Depends: T007, T008, T013
  - [ ] **PREP**: Confirmar REDs de vídeo, fence inválido e exportação, e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Implementar dual-read, migração explícita atômica e links/fallbacks derivados.
  - [ ] **VERIFY**: Rodar testes de legacy/exportação e `npm run check`.
  - [ ] **VISUAL**: Não aplicável: exportador e migrador; tela será coberta na fase de interface.
  - [ ] **EVIDENCE**: Registrar GREEN, rollback e fonte não alterada na leitura.
  - [ ] **IMPROVE**: Separar fonte canônica de qualquer saída iframe/callout.

- [ ] T018 [CODE] [US-003] Implementar sidecars autorais em `apps/web/src/lib/features/notes/highlight-file-repository.ts` — Refs: US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009, AC-014 — Depends: T009, T011, T014
  - [ ] **PREP**: Confirmar REDs de sidecar/IDs e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Implementar um JSON por id, escrita atômica e unknown keys preservadas.
  - [ ] **VERIFY**: Rodar testes de sidecar e typecheck.
  - [ ] **VISUAL**: Não aplicável: repositório de arquivos.
  - [ ] **EVIDENCE**: Registrar caminhos, GREEN e compatibilidade de cópia.
  - [ ] **IMPROVE**: Evitar duplicação de lógica de escrita do `WorkspaceStorage`.

- [ ] T019 [CODE] [US-003] Implementar rebuild e separação SQLite em `apps/web/src/lib/features/notes/index-rebuilder.ts` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-010, AC-011, AC-014 — Depends: T010, T011, T014
  - [ ] **PREP**: Confirmar REDs de determinismo/Bíblia e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Implementar varredura ordenada, transação, progresso, projeção e exclusão de Bíblia da fonte.
  - [ ] **VERIFY**: Rodar testes rebuild, benchmark definido e `npm run check`.
  - [ ] **VISUAL**: Não aplicável: processamento de índice.
  - [ ] **EVIDENCE**: Registrar linhas equivalentes, bytes da Bíblia e GREEN.
  - [ ] **IMPROVE**: Isolar regras determinísticas em funções puras testáveis.

- [ ] T020 [CODE] [US-004] Implementar exportação offline em `apps/web/src/lib/features/notes/note-export.ts` — Refs: US-004, FR-005, NFR-002, NFR-004, AC-012, AC-013, AC-014 — Depends: T012, T013, T014
  - [ ] **PREP**: Confirmar REDs de PDF/fallback/exportação e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Implementar Markdown canônico/derivado e fallback de impressão sem mutar a fonte.
  - [ ] **VERIFY**: Rodar testes de exportação e `npm run check`.
  - [ ] **VISUAL**: Não aplicável no módulo; visual do PDF será conferido pela tarefa de interface.
  - [ ] **EVIDENCE**: Registrar artefatos gerados, GREEN e ausência de rede necessária.
  - [ ] **IMPROVE**: Tornar aviso “exportação derivada” parte do contrato de saída.

#### Fase de interface

Os blocos Svelte e seus consumidores serão registrados em `INTERFACE.md` pela tarefa T026 após a implementação das telas.

- [ ] T021 [CODE] [US-002] Integrar blocos ricos e estados no editor Svelte em `apps/web/src/lib/features/notes/{MilkdownNoteEditor.svelte,VerseBlockView.svelte,YouTubeBlockView.svelte}` — Refs: US-002, FR-002, FR-003, NFR-002, NFR-004, AC-004, AC-005, AC-006, AC-008 — Depends: T004, T005, T006, T008
  - [ ] **PREP**: Confirmar fluxos da seção 10, REDs e executar `$specsfy-documentator` antes do código.
  - [ ] **EXECUTE**: Integrar edição de referência/URL, source, degraded/conflict e fallback usando Svelte existente.
  - [ ] **VERIFY**: Exercitar teclado, validação, foco, retry e testes Svelte/Vitest.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em desktop/mobile e claro/escuro.
  - [ ] **EVIDENCE**: Registrar estados, screenshots/viewport, comandos e GREEN.
  - [ ] **IMPROVE**: Reusar toolbar e componentes atuais, sem criar fluxo paralelo.

- [ ] T022 [CODE] [US-003] Integrar destaque e recovery em `apps/web/src/routes/highlights/+page.svelte` — Refs: US-003, FR-004, NFR-001, NFR-003, AC-009, AC-010, AC-011 — Depends: T009, T010, T011
  - [ ] **PREP**: Confirmar REDs de sidecar/rebuild e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Exibir ausência, progresso, sucesso, erro, retry e consulta da projeção sem perder fonte.
  - [ ] **VERIFY**: Exercitar navegação, teclado, recuperação e estados com Vitest/Svelte.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nos estados vazio/loading/error/success.
  - [ ] **EVIDENCE**: Registrar viewport, foco, comandos e GREEN.
  - [ ] **IMPROVE**: Manter mensagem de recuperação orientada à ação e sem alarmismo.

- [ ] T023 [CODE] [US-003] Integrar recovery no painel de workspace em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-010, AC-011, AC-014 — Depends: T010, T011, T014
  - [ ] **PREP**: Confirmar estados de storage e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Adicionar painel de rebuild/retry/cancelamento antes do commit e indicação de versão.
  - [ ] **VERIFY**: Exercitar permissão/erro, foco, teclado e mobile com Vitest/Svelte.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em desktop/mobile e zoom.
  - [ ] **EVIDENCE**: Registrar estados e comandos, sem marcar a tarefa concluída.
  - [ ] **IMPROVE**: Reusar `Alert`, `Progress`, `Button` e `Dialog` locais.

- [ ] T024 [CODE] [US-004] Integrar menu de exportação em `apps/web/src/routes/notes/[id]/+page.svelte` — Refs: US-004, FR-005, NFR-002, NFR-004, AC-012, AC-013, AC-014 — Depends: T012, T013, T014
  - [ ] **PREP**: Confirmar REDs de exportação e executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Adicionar menu Markdown/PDF, aviso de derivação, fallback e feedback acessível.
  - [ ] **VERIFY**: Exercitar menu, download/impressão, rede ausente, teclado e foco.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em conteúdo longo e mobile.
  - [ ] **EVIDENCE**: Registrar viewport, artefatos e comandos.
  - [ ] **IMPROVE**: Manter a ação de exportar separada de salvar a fonte.

#### Fase de documentação e fechamento

- [ ] T025 [DOC] [US-003] Atualizar persistência em `.specsfy/DATABASE.md` — Refs: FR-004, FR-005, NFR-001, NFR-003, AC-009, AC-010, AC-011 — Depends: T018, T019
  - [ ] **PREP**: Conferir tabelas/projeções e separar sidecars autorais de SQLite.
  - [ ] **EXECUTE**: Registrar entidade, campos, relações, índices, versionamento e rebuild no inventário oficial.
  - [ ] **VERIFY**: Comparar documentação com `index-rebuilder.ts` e `reader-highlights-repository.ts`.
  - [ ] **VISUAL**: Não aplicável: documentação de persistência.
  - [ ] **EVIDENCE**: Registrar caminhos e diff da documentação.
  - [ ] **IMPROVE**: Declarar explicitamente que Bíblias importadas são read-only.

- [ ] T026 [DOC] [US-002] Atualizar contrato de interface em `INTERFACE.md` — Refs: US-002, US-003, US-004, NFR-004, AC-005, AC-009, AC-012 — Depends: T021, T022, T023, T024
  - [ ] **PREP**: Inventariar telas, blocos Svelte, estados e consumidores alterados.
  - [ ] **EXECUTE**: Registrar finalidade, arquivo, API, acessibilidade e regra de reuso de cada bloco.
  - [ ] **VERIFY**: Conferir correspondência com seção 10 e telas reais.
  - [ ] **VISUAL**: Não aplicável: registro documental da revisão visual já feita nas tarefas de interface.
  - [ ] **EVIDENCE**: Registrar diff e referências de telas.
  - [ ] **IMPROVE**: Remover linguagem React/ReUI incompatível com a stack Svelte.

- [ ] T027 [DOC] [US-001] Reconstruir documentação técnica e revisar `PROJECT.md`/`docs/` — Refs: US-001, US-004, NFR-002, AC-002, AC-013, AC-014 — Depends: T015, T017, T020, T026
  - [ ] **PREP**: Confirmar arquivos e impacto no fluxo local-first; executar `$specsfy-documentator`.
  - [ ] **EXECUTE**: Atualizar `PROJECT.md` e documentação técnica gerada em `docs/`, sem criar fonte paralela.
  - [ ] **VERIFY**: Executar o documentator e conferir links/caminhos reais.
  - [ ] **VISUAL**: Não aplicável: documentação técnica.
  - [ ] **EVIDENCE**: Registrar comando, arquivos e justificativa de impacto.
  - [ ] **IMPROVE**: Documentar content-preserving e não pixel-identidade.

- [ ] T028 [TEST] [US-001] Fechar regressão e rastreabilidade em `apps/web/src/lib/features/notes/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027
  - [ ] **PREP**: Conferir todos os REDs, suites Vitest, documentação e rastreabilidade.
  - [ ] **EXECUTE**: Executar `cd apps/web && npm run test:tdd` e os checks de rastreabilidade definidos pela fase 6.
  - [ ] **VERIFY**: Confirmar cobertura de todos os AC/US/FR/NFR e ausência de regressão.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nas telas alteradas; registrar achados finais.
  - [ ] **EVIDENCE**: Registrar contagens, comandos e resultados nas seções 11–13.
  - [ ] **IMPROVE**: Registrar uma melhoria de processo ou justificar ausência com evidência.

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003 → T015 → T021 → T026 → T027 → T028; em paralelo, T004/T005/T006 → T016 → T021, T007/T008/T013 → T017 → T020/T024 e T009/T010/T011/T014 → T018/T019 → T022/T023.
- Tarefas paralelas: T001–T014 podem materializar REDs em arquivos distintos; T001–T003 compartilham fixture/parser e devem ser executadas em sequência. T025 pode iniciar após T018/T019; T026 aguarda todas as telas.
- Estratégia de MVP: primeiro US-001 e US-002 com fallback/round-trip; depois US-003 com sidecars/rebuild; por fim US-004 com exportação e PDF offline. T028 fecha a fatia completa.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016: workspace ativo, identidade e isolamento da raiz.
- Specs/backlogs do editor Milkdown, embeds e highlights existentes.
- `WorkspaceStorage`, `sql.js` e `rusqlite` disponíveis no projeto.
- Futura fatia de backup deve copiar Markdown/JSON e não tratar SQLite como conteúdo único.

#### Riscos

- Parsers divergirem em YAML/comentários → perfil escalar, fixtures e preservação lexical.
- Regeneração destruir texto externo → hash/snapshot, conflito e confirmação.
- Rebuild bloquear PWA → worker, progresso e cancelamento antes do commit.
- Cópia gerar IDs duplicados → detectar colisão e não mesclar automaticamente.
- GitHub/Obsidian/PDF não terem widgets equivalentes → fallback visível e promessa content-preserving.
- URL/HTML malicioso ser executado → tratar como dado, sanitizar preview e exigir ação explícita.

#### Suposições

- `schemaVersion` canônico inicial é `1` e só muda com migração documentada.
- IDs são UUID/string opaca e não derivam apenas de path, posição ou texto.
- Cada adapter oferece escrita atômica equivalente ou bloqueia migração segura.
- Unknown keys não serializáveis são preservadas lexicalmente ou bloqueiam salvamento, nunca descartadas.
- Compatibilidade significa leitura/preservação, sem garantia de estilo ou player idêntico.

### 17. Decisões

- **DEC-001**: CommonMark/GFM + frontmatter escalar — maximiza leitura externa; extensões ficam em metadados/derivações.
- **DEC-002**: verso como blockquote + comentário HTML JSON — texto sobrevive quando comentário é ignorado.
- **DEC-003**: vídeo como link Markdown, sem `iframe` canônico — GitHub/editor simples não garantem HTML embutido.
- **DEC-004**: callout/iframe somente em exportação derivada — ergonomia do alvo sem corromper fonte.
- **DEC-005**: migração só em salvamento explícito e atômico — leitura nunca altera autoria.
- **DEC-006**: parser tolerante preserva unknown keys e literais inválidos — compatibilidade não justifica perda.
- **DEC-007**: um JSON por highlight — facilita diff, cópia e merge futuro.
- **DEC-008**: SQLite do workspace é projeção; Bíblias são read-only — separa cache de fonte.
- **DEC-009**: rebuild determinístico em `sql.js` e `rusqlite` — contrato comum sem impor FFI.
- **DEC-010**: XML fora do escopo — JSON atende TypeScript/WASM/Automerge.
- **DEC-011**: promessa pública content-preserving — evita prometer paridade visual impossível.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os 14 cenários `AC` aplicáveis passam.
- [ ] Todos os US, FR e NFR têm cobertura e evidência de verificação.
- [ ] Parser, serializer, migração, sidecars, rebuild, exportação e recovery têm evidência TDD/BDD.
- [ ] `sql.js` e `rusqlite` produzem projeções equivalentes e Bíblias não são alteradas.
- [ ] Compatibilidade externa foi inspecionada como legibilidade/preservação, sem pixel-identidade.
- [ ] `.specsfy/DATABASE.md`, documentação técnica e inventário de pacotes foram atualizados após implementação.
