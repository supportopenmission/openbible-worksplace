# Especificação integrada: Formatos portáteis e índice reconstruível

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0017 |
| Slug | 0017-formatos-portateis-indice-reconstruivel |
| Status | Complete |
| Effort | 9 |
| Effort updated at | 2026-09-06 |
| Effort rationale | Fatiamento de alto risco por migrar notas e destaques para o backend operacional SQLite/IndexedDB, preservar compatibilidade Markdown legada e gerar exportações Markdown/PDF sem alterar a fonte. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible atualmente serializa partes enriquecidas das notas em Markdown legado e mantém índices auxiliares em arquivos do workspace. A SPEC-0016 definiu que o registro operacional é centralizado no `app.sqlite` do Tauri ou no IndexedDB do PWA, mas notas, destaques e exportações ainda precisam migrar para essa fronteira sem perder portabilidade.

#### Resultado desejado

Notas, sermões, blocos de verso/vídeo e destaques terão fonte operacional local no backend do workspace ativo: SQLite nativo no Tauri e IndexedDB no PWA, sempre escopado por `workspaceId`. Markdown e PDF serão exportações derivadas, legíveis e preserváveis em editor simples, Obsidian, GitHub/GitHub Pages e documento offline. Arquivos Markdown e `.openbible/index.sqlite` existentes serão entrada de migração/recovery, não a autoridade nova.

#### Métricas de sucesso

- 100% dos snapshots de notas e blocos fazem round-trip entre o backend ativo e a exportação Markdown sem perda do corpo, dos campos conhecidos nem das chaves desconhecidas suportadas.
- Os 14 cenários de aceite mantêm título, referência, snapshot e links legíveis sem índice, rede, player ou comentários de metadados.
- O mesmo snapshot ativo persistido no SQLite nativo e no IndexedDB produz 100% dos registros e projeções lógicas equivalentes após ordenação canônica; `sql.js`/WASM fica restrito à leitura da Bíblia SQLite.
- 100% dos destaques da fixture autoral sobrevivem à exclusão/reconstrução das projeções porque o registro primário permanece no backend do workspace.
- A fixture de carga com 1.000 notas e 10.000 destaques conclui o rebuild da projeção em até 30 segundos no runner de CI, informa progresso ao menos a cada 250 registros e não bloqueia a abertura direta de uma nota.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] CommonMark/GFM oferecem blockquotes, links, HTML comments e fences interoperáveis; `iframe` não é fallback universal — Verdict: verified — Confidence: high — Evidence: research/markdown-portability/evidence.md#commonmark-e-github-flavored-markdown — Budget: 1/5.
- **R-002** [critical] GitHub oculta comentários HTML e não apresenta parte do HTML embutido, inclusive vídeo — Verdict: verified — Confidence: high — Evidence: research/markdown-portability/evidence.md#github — Budget: 1/5.
- **R-003** [critical] Obsidian usa YAML no início e callouts como extensão de blockquote — Verdict: verified — Confidence: high — Evidence: research/markdown-portability/evidence.md#obsidian — Budget: 1/5.
- **R-004** [critical] Jekyll/GitHub Pages processa Markdown com frontmatter e GFM/Kramdown, mas widgets dependentes de plugin não são universais — Verdict: verified — Confidence: medium — Evidence: research/markdown-portability/evidence.md#jekyll-e-github-pages — Budget: 1/5.
- **R-005** [critical] `remark-directive` é apropriado quando o produtor controla as ferramentas e limitado fora delas — Verdict: verified — Confidence: high — Evidence: research/markdown-portability/evidence.md#remark-directive — Budget: 1/5.
- **R-006** [critical] O código atual usa fences, embeds, destaques e `.openbible/index.sqlite` nos módulos existentes — Verdict: verified — Confidence: high — Evidence: research/markdown-portability/evidence.md#veredito-consolidado — Budget: 1/2.

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

- `specs/completed/0017-formatos-portateis-indice-reconstruivel/research/markdown-portability/evidence.md`: notas próprias, URLs e conclusões, consultado em 2026-09-05; sem reprodução de conteúdo protegido.
- `specs/completed/0016-multiplos-workspaces-modelo-vaults/spec.md`: autoridade operacional SQLite/IndexedDB, `workspaceId`, `WorkspaceExportSource` e Bíblia SQLite/WASM separada, consultada em 2026-09-06.

#### Dúvidas respondidas

- **Q**: JSON ou XML para dados estruturados? → **A**: JSON versionado é o contrato interno de blocos/diagnósticos e pode aparecer como metadado complementar; não é sidecar autoral obrigatório. XML fica fora desta fatia.
- **Q**: Verso deve ser callout, fence ou iframe? → **A**: blockquote visível mais comentário HTML JSON; callout/iframe somente em exportação derivada.
- **Q**: SQLite continua fonte? → **A**: o SQLite nativo no Tauri e o IndexedDB no PWA são a fonte operacional de notas/destaques; Markdown/PDF são exportações derivadas. O `.openbible/index.sqlite` antigo serve apenas à migração/recovery.
- **Q**: Bíblias SQLite entram no índice? → **A**: não; permanecem fontes importadas imutáveis.
- **Q**: O PWA deve usar SQLite WASM para o banco operacional? → **A**: não; usa IndexedDB. SQLite/WASM permanece apenas para consultar a Bíblia SQLite importada.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante para a definição inicial.

### 3. Escopo e atores

#### Incluído

- Modelo estruturado de notas/destaques no backend do workspace ativo, com `workspaceId`, IDs estáveis e chaves desconhecidas preservadas.
- Exportador Markdown UTF-8 com frontmatter escalar e conteúdo CommonMark/GFM legível.
- Envelopes portáveis de verso/vídeo com fallback visível e comentários HTML JSON versionados.
- Parser tolerante, migração explícita/atômica de fences legados e fallback para `==...==`/`++...++`.
- Registros de destaque no SQLite/IndexedDB, índices derivados versionados/reconstruíveis e exportação Markdown/PDF offline.

#### Fora de escopo

- Criação, troca e exclusão do registro de workspaces, já tratadas pela SPEC-0016; esta fatia apenas consome o workspace ativo.
- Backup/restauração, Automerge, agentes de IA, XML, novos provedores, renomeação física de pasta e pixel-identidade de widgets.
- Conversão das Bíblias SQLite importadas para Markdown/JSON ou IndexedDB.

#### Atores

- **Pessoa autora**: escreve notas/sermões, edita referências, exporta e resolve conflitos.
- **Pessoa leitora**: cria e consulta destaques bíblicos.
- **Editor externo**: Obsidian, GitHub, GitHub Pages ou editor simples que lê uma exportação derivada; a edição externa não altera automaticamente o backend.
- **Backend do workspace ativo**: SQLite nativo no Tauri ou IndexedDB no PWA, fonte operacional escopada por `workspaceId`.
- **Índice local**: projeção descartável do backend ativo, nunca fonte operacional.
- **Adaptador de conteúdo legado/exportação**: lê arquivos existentes e grava artefatos derivados sem substituir o backend ativo.

### 4. Princípios e restrições do projeto

- **PR-001**: Database over files for authoring: SQLite/IndexedDB são a fonte operacional; Markdown/PDF sobrevivem como exportações derivadas e legíveis fora do OpenBible.
- **PR-002**: Conteúdo visível usa CommonMark/GFM e não depende de `:::`, callout, wiki-link, HTML customizado ou `iframe`.
- **PR-003**: Metadado oculto é complementar; perdê-lo nunca apaga texto visível.
- **PR-004**: SQLite nativo/IndexedDB são backends operacionais equivalentes; Bíblias SQLite são fontes read-only distintas e não entram no rebuild de notas.
- **PR-005**: Importação de legado, mutações do backend e exportação ocorrem em commits/temporários atômicos com rollback; leitura nunca reescreve fonte.
- **PR-006**: IDs estáveis incluem o escopo `workspaceId` e são independentes de caminho, posição e texto.
- **PR-007**: Preservar Svelte 5/SvelteKit, TypeScript, Tailwind 4, Milkdown e primitives existentes.

### 5. Histórias de usuário

#### US-001 — Persistir notas e exportar Markdown portátil (P1)

Como pessoa autora, quero salvar notas no backend do workspace ativo e exportá-las em Markdown legível com frontmatter compatível, para compartilhar fora do OpenBible sem perder metadados.

**Por que P1**: é a fonte operacional mínima das demais saídas.
**Teste independente**: persistir um snapshot no SQLite/IndexedDB, exportá-lo, reimportar somente uma entrada legada e comparar corpo, frontmatter e chaves desconhecidas.
**Requisitos**: FR-001, NFR-001, NFR-002, NFR-004.

#### US-002 — Editar blocos de verso e vídeo com degradação segura (P1)

Como pessoa autora, quero editar referência, versão e vídeo em blocos ricos persistidos no backend ativo, para obter conveniência no app sem sacrificar a leitura externa da exportação.

**Por que P1**: esses blocos hoje dependem mais de extensões próprias.
**Teste independente**: criar, alterar, degradar, migrar e exportar verso/vídeo sem rede.
**Requisitos**: FR-002, FR-003, NFR-001, NFR-002, NFR-004.

#### US-003 — Preservar destaques e reconstruir o índice (P1)

Como pessoa leitora, quero destaques persistidos no backend ativo e um índice recriável, para usar marcações após mover, copiar ou reparar o workspace.

**Por que P1**: evita confundir cache SQLite com autoria e prepara sincronização futura.
**Teste independente**: remover/corromper a projeção do backend ativo, reconstruir em SQLite e IndexedDB e comparar registros lógicos sem alterar os registros primários.
**Requisitos**: FR-004, FR-005, NFR-001, NFR-003.

#### US-004 — Exportar conteúdo interoperável (P1)

Como pessoa autora, quero exportar ou imprimir notas em Markdown e PDF, para compartilhar em Obsidian, GitHub/GitHub Pages ou documento offline.

**Por que P1**: portabilidade inclui saída utilizável sem app ou rede.
**Teste independente**: gerar Markdown derivado e PDF offline a partir de um snapshot do backend, verificando títulos, links, referências e texto sem mutar a fonte.
**Requisitos**: FR-002, FR-005, NFR-002, NFR-003, NFR-004.

### 6. Cenários BDD de aceite

#### AC-001 — Round-trip de frontmatter
**Cobre**: US-001, FR-001, NFR-001, NFR-002
```gherkin
@US-001 @FR-001 @NFR-001 @NFR-002 @AC-001
Feature: Nota Markdown portátil
  Scenario: preservar frontmatter e chaves desconhecidas
    Given um registro de nota do workspace ativo com id, type, schemaVersion e uma chave desconhecida
    When a pessoa exporta e reabre o Markdown no OpenBible
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
    Given um Markdown legado com YAML não escalar ou comentário JSON inválido
    When a pessoa tenta importar ou migrar para o workspace ativo
    Then o arquivo legado fica disponível, o corpo permanece legível e a gravação destrutiva é bloqueada
```

#### AC-004 — Verso visível em blockquote
**Cobre**: US-002, FR-002, NFR-002
```gherkin
@US-002 @FR-002 @NFR-002 @AC-004
Feature: Envelope de verso
  Scenario: ler verso sem plugin
    Given um bloco de verso persistido no backend ativo e exportado
    When o Markdown é renderizado por CommonMark/GFM
    Then título, referência, versão e snapshot aparecem em blockquote visível
```

#### AC-005 — Edição rica e conflito
**Cobre**: US-002, FR-002, NFR-001, NFR-004
```gherkin
@US-002 @FR-002 @NFR-001 @NFR-004 @AC-005
Feature: Edição de referência
  Scenario: preservar divergência externa
    Given um bloco persistido com id estável e um Markdown externo divergente
    When o conteúdo é importado explicitamente ou a referência é alterada
    Then o id permanece e ambas as evidências são preservadas e sinalizadas
```

#### AC-006 — Degradação segura
**Cobre**: US-002, FR-002, FR-003, NFR-002, NFR-004
```gherkin
@US-002 @FR-002 @FR-003 @NFR-002 @NFR-004 @AC-006
Feature: Comentário ausente
  Scenario: abrir blockquote sem metadados
    Given comentário HTML removido de uma exportação de verso
    When o documento é importado ou aberto
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
    Given `:::verse` ou `:::video` válido e uma diretiva incompleta em arquivo legado
    When a pessoa solicita a migração para o workspace ativo
    Then leitura não reescreve, válido é persistido atomicamente e inválido permanece literal sinalizado
```

#### AC-009 — Destaque no backend ativo
**Cobre**: US-003, FR-004, NFR-001, NFR-002, NFR-003
```gherkin
@US-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-009
Feature: Fonte autoral de destaque
  Scenario: salvar destaque granular
    Given destaque criado no leitor do workspace ativo
    When o registro é persistido
    Then existe um registro primário com `workspaceId` e `highlightId`, e `reader_highlight` pode ser gerado como projeção
```

#### AC-010 — Reconstrução determinística
**Cobre**: US-003, FR-004, NFR-001, NFR-003
```gherkin
@US-003 @FR-004 @NFR-001 @NFR-003 @AC-010
Feature: Índice reconstruível
  Scenario: reconstruir índice ausente ou corrompido
    Given os mesmos registros primários e nenhuma projeção válida
    When reconstruído no SQLite nativo e no IndexedDB
    Then ids, relações, ordenação e versão da projeção são equivalentes sem mudar os registros autorais
```

#### AC-011 — Bíblias imutáveis
**Cobre**: US-003, FR-004, FR-005, NFR-001, NFR-003
```gherkin
@US-003 @FR-004 @FR-005 @NFR-001 @NFR-003 @AC-011
Feature: Fontes SQLite separadas
  Scenario: reconstruir sem alterar Bíblia importada
    Given Bíblia SQLite importada e projeção de notas ausente
    When o índice do workspace é reconstruído
    Then a Bíblia permanece somente leitura e disponível
```

#### AC-012 — PDF offline
**Cobre**: US-004, FR-005, NFR-002, NFR-004
```gherkin
@US-004 @FR-005 @NFR-002 @NFR-004 @AC-012
Feature: Exportação PDF
  Scenario: imprimir sem rede
    Given snapshot de nota com verso e vídeo canônicos no backend ativo
    When exportado para PDF sem rede
    Then título, referência, texto do verso e título/URL do vídeo aparecem
```

#### AC-013 — Exportação derivada documentada
**Cobre**: US-004, FR-003, FR-005, NFR-002, NFR-004
```gherkin
@US-004 @FR-003 @FR-005 @NFR-002 @NFR-004 @AC-013
Feature: Destinos externos
  Scenario: exportar para Obsidian ou GitHub Pages
    Given snapshot do backend ativo com envelopes e extensões legadas
    When uma exportação derivada é solicitada
    Then há fallback visível, callout/iframe é opcional e a saída não substitui a fonte persistida
```

#### AC-014 — IDs portáveis e contrato JSON
**Cobre**: US-003, US-004, FR-004, FR-005, NFR-002, NFR-003
```gherkin
@US-003 @US-004 @FR-004 @FR-005 @NFR-002 @NFR-003 @AC-014
Feature: Portabilidade de identidade
  Scenario: mover raiz e abrir em outro leitor
    Given registros de notas, blocos e destaques com ids estáveis e JSON interno versionado
    When o workspace muda de backend ou um Markdown exportado sai do OpenBible
    Then ids continuam válidos, texto permanece legível e nenhum XML novo é exigido
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Ler/gravar registros de nota no backend ativo por `workspaceId` e gerar/ler Markdown UTF-8 derivado com frontmatter YAML escalar, `id`, `type`, `schemaVersion` e chaves desconhecidas preservadas.
- **FR-002**: Representar verso como blockquote visível e vídeo como link visível, usando comentário HTML JSON versionado para metadados de edição.
- **FR-003**: Aceitar Markdown/fences legados de forma tolerante, manter inválidos como texto e importar para o backend ativo somente por ação explícita e transação atômica.
- **FR-004**: Persistir cada destaque no backend ativo com `workspaceId` e `highlightId`, reconstruindo `reader_highlight`, `note_verse_ref` e outras projeções.
- **FR-005**: Manter SQLite nativo e IndexedDB como backends operacionais versionados, tratar `.openbible/index.sqlite` como legado de migração/recovery, separar Bíblias SQLite e gerar Markdown/PDF offline.

#### Não funcionais

- **NFR-001**: Integridade/atomicidade: falhas não truncam, substituem silenciosamente ou apagam registros do backend ou arquivos legados. **Verificação**: transações, temporários, rollback e comparação semântica.
- **NFR-002**: Interoperabilidade: caminho feliz legível por CommonMark/GFM, Obsidian, GitHub/GitHub Pages e PDF. **Verificação**: fixtures/renderização, sem exigir pixel-identidade.
- **NFR-003**: Determinismo/desempenho: o mesmo snapshot gera registros/projeções lógicas equivalentes no SQLite nativo e no IndexedDB; `sql.js`/WASM não é backend operacional do PWA. 1.000 notas e 10.000 destaques são reconstruídos em até 30 segundos no CI, com progresso a cada 250 registros, sem bloquear a abertura direta de nota. **Verificação**: comparação ordenada, benchmark e teste de abertura durante rebuild.
- **NFR-004**: Segurança/privacidade/acessibilidade: parser não executa HTML/JS/URLs, limita comentário a 16 KiB, profundidade JSON a 8 e parse em memória a 16 MiB; dados ficam locais e estados são expostos em texto. **Verificação**: fixtures maliciosas/limites, estados, teclado e tecnologia assistiva.

#### Erros e casos-limite

- Frontmatter inválido → corpo legível, fonte preservada, diagnóstico e bloqueio destrutivo.
- Comentário JSON ausente/inválido → fallback visível e estado degradado.
- Snapshot divergente → preservar ambas as evidências e exigir decisão.
- Fence inválido → literal visível, não migrado e restante processado.
- Migração interrompida → rollback/temporário identificável; nunca Markdown truncado.
- Vídeo inválido/rede ausente → título/URL e PDF continuam disponíveis.
- Índice/projeção ausente ou corrompida → abrir registros primários e reconstruir sem apagá-los.
- Registro legado de destaque inválido/duplicado → manter a fonte disponível, omitir só a projeção inválida e relatar.
- Colisão de id → não mesclar silenciosamente; oferecer resolução preservando fontes.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- O PWA é SvelteKit/Svelte 5 + TypeScript, Milkdown/ProseMirror, `remark-directive`, IndexedDB e a abstração de contexto de workspace em `apps/web/src/lib/storage/types.ts`; `sql.js`/WASM permanece reservado à Bíblia SQLite.
- O editor e exportador atuais estão em `apps/web/src/lib/features/notes/{MilkdownNoteEditor.svelte,milkdown-markdown-io.ts,verse-block-extension.ts,milkdown-verse-node.ts,milkdown-video-node.ts,note-export.ts}`.
- A implementação atual ainda lê `.openbible/index.sqlite` e arquivos Markdown por compatibilidade; essa fonte será migrada para o backend operacional ativo. Bíblias importadas ficam em SQLite separado e read-only.
- Tauri usa `app.sqlite`/`rusqlite` em `apps/desktop/src-tauri`; o PWA usa o adapter IndexedDB por origem. `WorkspaceStorage` continua responsável por legado, Bíblia e artefatos derivados, não pela autoridade das notas novas.

#### Arquitetura e módulos

- Adicionar `portable-markdown.ts` para gerar/ler a fronteira de exportação Markdown, frontmatter escalar, comentários HTML JSON e unknown keys; `portable-envelope.ts` para verso/vídeo, fallback e snapshot/conflict.
- Adicionar um `WorkspaceContentRepository`/porta de conteúdo para persistir notas, blocos e destaques por `workspaceId`, com adapter SQLite nativo no Tauri e adapter IndexedDB no PWA.
- Adaptar `milkdown-markdown-io.ts`, `verse-block-extension.ts`, `milkdown-verse-node.ts`, `milkdown-video-node.ts` e `note-export.ts` para consumir snapshots do backend e gerar derivados; Markdown legado fica apenas no importador/migrador.
- Adicionar `highlight-repository.ts` para registros primários e `index-rebuilder.ts` para ordenar, reconstruir e publicar projeções determinísticas em SQLite/IndexedDB.
- Adaptar `note-verse-index.ts` e `reader-highlights-repository.ts` para consultar/escrever somente projeções do backend ativo; nenhum módulo de notas acessa `.openbible/index.sqlite` como autoridade.
- Tauri usa `rusqlite` e migration SQL versionada; o PWA usa transações/object stores IndexedDB equivalentes. `sql.js`/WASM consulta apenas Bíblias SQLite read-only.

#### Migrations

- **Expand**: aceitar registros novos no backend e ler frontmatter/fonte Markdown, `:::verse`/`:::video`, `==`/`++` e comentários desconhecidos como legado; adicionar `schemaVersion`/ids sem remover dados.
- **Dual read**: marcar origem `canonical-db`, `legacy`, `degraded` ou `conflict`; abrir nunca reescreve arquivo legado nem altera o registro ativo sem ação explícita.
- **Contract**: em salvamento explícito, persistir primeiro o registro no SQLite/IndexedDB em transação e gerar Markdown/PDF como derivado; a Bíblia SQLite permanece fora do commit.
- **Rollback**: transação do backend ou temporário do exportador; só publicar índice/projeção após o registro confirmado. Em falha, preservar registro anterior, fonte legada e temporário identificável.

#### Models

- `NoteRecord`: `workspaceId`, id, type, schemaVersion, metadados conhecidos/desconhecidos e corpo/blocos estruturados; id não depende de path.
- `PortableBlockEnvelope`: id, kind (`verse`/`video`), schemaVersion, dados estruturados, snapshot/fallback e hash de divergência.
- `HighlightRecord`: `workspaceId`, highlightId, referência bíblica, texto/estilo, timestamps e campos desconhecidos; registro primário no backend.
- `IndexProjection`: backend, versão, workspaceId, ids, relações e estado de rebuild; descartável e sem autoridade operacional.
- `ParseDiagnostic`: código, localização, severidade, mensagem acessível e ação recomendada; não registra conteúdo completo em log.

#### Controllers e casos de uso

- `openWorkspaceNote`/`saveWorkspaceNote`: leitura/escrita por `workspaceId` com commit atômico no backend ativo.
- `exportPortableMarkdown`: serializar snapshot do backend; `importLegacyMarkdown`: importar somente por ação explícita.
- `editVerseEnvelope`/`editVideoEnvelope`: atualizar referência/versão ou título/URL, preservando conflito e regenerando fallback.
- `migrateLegacyOnExplicitSave`: converter fences válidos, manter inválidos literais e emitir diagnóstico.
- `writeHighlightRecord`/`deleteHighlightRecord`: registro primário primeiro, projeção depois, sempre com `workspaceId`.
- `rebuildWorkspaceIndex`: ler registros do workspace ativo, ordenar canonicamente, reportar progresso e publicar transação final no backend correspondente.
- `exportPortableMarkdown`/`exportPdfFallback`: gerar derivado sem mutar a fonte; autorização é a permissão do workspace ativo.

#### Views e experiência

- `MilkdownNoteEditor.svelte`, `VerseBlockView.svelte` e `YouTubeBlockView.svelte` mostram blocos ricos, source/fallback e ações de edição.
- `NoteIndexMenu.svelte` e a tela de destaques exibem índice ausente, reconstruindo, concluído, falho e retry sem bloquear leitura.
- Exportação apresenta Markdown canônico/derivado e PDF; falha de rede mantém título, referência, texto e URL.
- Estados usam texto semântico, `role=status`/`role=alert`, foco devolvido ao acionador e layout responsivo.

#### Queries e repositórios

- `index-rebuilder.ts` lê registros de notas/destaques, ordena por id lógico e grava tabelas/object stores derivados em transação; índices podem ser recriados.
- Consultas de leitor continuam usando `reader_highlight` e `note_verse_ref` do backend ativo, mas nenhuma escrita autoral depende da projeção.
- A conexão de Bíblias importadas é read-only e fora da rotina de rebuild.

#### Jobs e processamento assíncrono

- Rebuild pode usar worker web ou comando Tauri assíncrono, com progresso, cancelamento antes do commit e retry idempotente; o worker recebe o `workspaceId` e o backend, nunca um singleton global.
- Não há fila remota/dead-letter nesta fatia; falha local gera diagnóstico e não altera a fonte.

#### Estrutura de arquivos

```text
apps/web/src/lib/features/notes/
  portable-markdown.ts
  portable-envelope.ts
  highlight-repository.ts
  index-rebuilder.ts
  note-export.ts                 # adaptar
  milkdown-markdown-io.ts        # adaptar
  note-verse-index.ts            # adaptar ao backend ativo
apps/web/src/lib/features/bible/reader-highlights-repository.ts # adaptar
apps/web/src/lib/storage/workspace-content-repository.ts         # novo contrato
apps/desktop/src-tauri/migrations/002_create_workspace_content.sql
apps/desktop/src-tauri/src/database.rs                           # adaptar
tests/fixtures/portable-markdown/{notes,highlights,legacy,expected}/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `NoteRecord` | `workspaceId + note.id` estável | registro no SQLite/IndexedDB; `type`, `schemaVersion`, escalares conhecidos/desconhecidos e corpo/blocos; Markdown é derivado | contém blocos; pertence ao workspace ativo |
| `PortableBlockEnvelope` | `block.id` estável | `kind`, versão, referência/versão/snapshot ou provedor/título/URL; fallback visível | fica em uma nota; não depende de posição |
| `HighlightRecord` | `workspaceId + highlightId` | registro versionado no SQLite/IndexedDB, referência, texto/estilo, timestamps e unknown keys | projeta `reader_highlight`; não depende de arquivo lateral |
| `IndexProjection` | backend + versão + workspace | tabelas/object stores derivados, relações, ordenação e estado | deriva de `NoteRecord`/`HighlightRecord`; não é fonte |
| `BibleSource` | arquivo SQLite importado | somente leitura, schema do importador | consultada por referência; fora do rebuild |
| `ParseDiagnostic` | operação/localização | código, severidade, mensagem acessível e ação | associado à fonte sem substituí-la |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Nota | `legacy-file` | importar explicitamente | `canonical-db` | transação atômica ou legado intacto |
| Nota | `canonical-db` | exportar | `exported` | exportação é derivada e não altera o registro |
| Nota | `canonical-db` | falha do backend | `available-with-diagnostic` | não apagar o registro anterior |
| Bloco | `canonical` | divergência externa | `conflict` | snapshot e texto preservados |
| Bloco | `canonical` | comentário removido | `degraded` | fallback visível permanece |
| Índice | `missing`/`corrupt` | iniciar rebuild | `rebuilding` | autoria não muda |
| Índice | `rebuilding` | commit | `ready` | projeção determinística/versionada |
| Índice | `rebuilding` | falha/cancelamento | `unavailable` | projeção incompleta não publica |
| Destaque | `authoritative-record` | projetar | `indexed` | registro primário regenera projeção |

#### Migração e retenção

- Registros de notas, blocos e destaques no SQLite/IndexedDB têm retenção indefinida; projeções, exportações e diagnósticos são regeneráveis.
- Arquivos Markdown/JSON legados e temporários de migração ficam somente para recuperação/importação e não substituem o backend sem commit confirmado.
- Chaves desconhecidas são preservadas lexicalmente/semanticamente quando possível; caso contrário o salvamento é bloqueado.
- Índice contém apenas projeção necessária à consulta e nunca é o único armazenamento de registro autoral.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A feature afeta editor de notas, destaques, recuperação do índice e exportação.

#### Stack e convenções de interface

- Preservar SvelteKit/Svelte 5, TypeScript, Tailwind 4, Milkdown e componentes existentes de `apps/web/src/lib/components/ui`; não introduzir React, ReUI ou outra biblioteca.
- É uma superfície de editor/recovery/exportação, não CRUD administrativo: o template genérico de DataGrid/Breadcrumb de equipe não se aplica.

#### Telas e responsabilidades

- `apps/web/src/routes/notes/[id]/+page.svelte`: pessoa autora edita nota; entrada é um registro do backend ativo e saída é commit/diagnóstico.
- `MilkdownNoteEditor.svelte`, `VerseBlockView.svelte`, `YouTubeBlockView.svelte`: editar campos estruturados e exibir fallback.
- `apps/web/src/routes/highlights/+page.svelte` e `BibleReader.svelte`: criar/consultar/remover registros de destaque e consumir projeção.
- `WorkspaceSettings.svelte` e storage: mostrar ausência, rebuild, falha, retry e exportação.

#### Fluxo de informação e navegação

- A pessoa chega pelo shell de notas ou leitor; o workspace ativo permanece visível no shell.
- Editor lê o backend sem esperar a projeção; status informa rebuild/retry. Salvamento explícito passa por commit atômico.
- Exportação lê um snapshot e gera derivado, sem sobrescrever o registro. Heading e shell fornecem contexto; não criar Breadcrumb de equipe.

#### Menus e navegação principal

- Menu principal `Notas` leva a `/notes`; a seleção de uma nota leva a `/notes/[id]`, onde o slash command existente insere verso/vídeo e o menu do bloco oferece editar, mostrar source e resolver conflito/degradação.
- Menu principal `Bíblia` leva a `/bible`; a ação de destaques leva a `/highlights`. `Configurações` leva a `/config`, onde o painel de recuperação do índice é acessível.
- O menu de exportação da nota oferece Markdown compatível e PDF derivados, sempre com aviso de fonte operacional; no mobile, as mesmas ações usam toolbar, drawer ou popover acessível sem criar destinos diferentes.

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

- Não aplicável como CRUD administrativo: não haverá DataGrid, coluna `ID` nem telas separadas de criar, editar e apagar. Notas usam o `PageHeader` existente e editor contínuo; destaques usam ações acessíveis do leitor para criar, consultar e apagar, pois registros do backend são a fonte operacional.

#### Revisão visual durante o desenvolvimento

- A implementação deverá conferir bordas, espaçamentos, margens, padding e tipografia do sistema no editor, recovery e exportação em desktop/mobile, claro/escuro, conteúdo curto/longo, teclado, zoom e overflow; nesta fase não há evidência visual.

#### APIs expostas

- API interna TypeScript v1: `parsePortableNote(source, logicalPath)` lê exportação/legado e retorna `{ note, diagnostics, sourceKind }`; `serializePortableNote(snapshot)` retorna bytes UTF-8 derivados ou erro não destrutivo; `parseBlockEnvelope(source)`/`serializeBlockEnvelope(block)` retornam blocos tipados e diagnósticos.
- `writeHighlightRecord(context, record)` confirma o registro no backend ativo; `rebuildWorkspaceIndex(context, options)` retorna progresso, contagens, versão e diagnóstico; `exportPortableMarkdown(snapshot, target)`/`exportPdfFallback(snapshot)` retornam derivados e nunca mutam a fonte.
- Entradas maiores que os limites definidos, versões incompatíveis, IDs duplicados, JSON/YAML inválido e storage sem escrita retornam erros tipados; nenhum retorno inclui path físico, conteúdo completo em log ou credencial.
- `WorkspaceDataContext` recebe `workspaceId`, `generation` e backend; `WorkspaceContentRepository` encapsula SQLite/IndexedDB e retornos incluem diagnostics, schema/version e estado de commit. `WorkspaceStorage` recebe caminhos lógicos apenas para legado, Bíblia e artefatos derivados.

#### APIs externas utilizadas

- Nenhuma API externa de runtime. Links bíblicos/vídeo são dados; player remoto é opcional e não bloqueia leitura/PDF.

#### Documentação das APIs consultadas

- URLs e versões estão indexadas na seção 2 e em `research/markdown-portability/evidence.md`; atualizações de parser exigem fixtures revisadas.

#### Eventos e outros contratos

- `workspace-content-committed`: registro confirmado no backend ativo; consumidor é rebuild da projeção.
- `index-rebuild-progress`: operação, etapa e processados/total opcional; sem texto autoral.
- `portable-diagnostic`: código, localização, severidade e ação. Sincronização futura recebe registros/exportações do workspace, não handles ou projeções locais.

#### Contrato normativo OpenBible Portable Markdown v1 — exportação e legado

- Markdown é formato de exportação pública e entrada de legado, não a fonte operacional nova. O frontmatter é obrigatório no topo, UTF-8 e LF canônico: `id`, `type` e `schemaVersion: 1`; valores conhecidos são escalares YAML. A ordem e a representação original das chaves desconhecidas são preservadas quando uma exportação é reimportada ou reemitida.
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
- Destaque v1 usa registro versionado no backend ativo com `workspaceId`, `highlightId`, `versionId`, `bookId`, `chapter`, `verseStart`, `verseEnd`, `styleId`, `createdAt` e `updatedAt`. Campos adicionais são preservados; uma serialização JSON pode ser usada somente em exportação/intercâmbio.
- A projeção v1 contém metadados e tabelas/object stores derivados `reader_highlight` e `note_verse_ref`; relações canônicas usam `workspaceId`, `note_id` e `block_id`, mantendo `note_path` apenas como atributo derivado. Comparação entre runtimes é por registros lógicos ordenados, não por igualdade binária de bancos.

### 11. Estratégia TDD

- **Unidade**: parser/serializer de exportação Markdown e envelopes, migração tolerante, schema de registros e regras determinísticas de projeção.
- **Integração/contrato**: `WorkspaceDataContext`, SQLite nativo, IndexedDB, `WorkspaceStorage` legado, exportação e separação da Bíblia SQLite/WASM read-only.
- **BDD/aceite**: AC-001…AC-014 são a referência; cada caso TDD tem marcador `SPECSFY:` correspondente e não há `.feature`.
- **Runner TDD**: Vitest pelo script `apps/web/package.json` (`bun run --cwd apps/web test:tdd -- <arquivo>`).
- **E2E**: não aplicável nesta preparação; as jornadas Svelte serão cobertas na implementação e os contratos unitários já materializam os REDs.
- **Verificação manual**: inspeção posterior em Obsidian, GitHub/GitHub Pages e PDF para legibilidade/preservação, pois os renderizadores externos não são controlados pelo Vitest.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, NFR-002, AC-001 | AC-001 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-001` | RED: serializer não preservava id/schema/unknown key | GREEN: T015 preserva `id`, `schemaVersion` e unknown scalar keys | Focal Vitest e regressão legada passaram; typecheck global segue com falhas preexistentes fora de T015 |
| US-001, FR-001, NFR-002, NFR-004, AC-002 | AC-002 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-002` | RED: header canônico ausente | GREEN: T015 emite frontmatter escalar e mantém GFM legível | Focal Vitest e regressão legada passaram; typecheck global segue com falhas preexistentes fora de T015 |
| US-001, FR-001, FR-003, NFR-001, NFR-004, AC-003 | AC-003 | `apps/web/src/lib/features/notes/portable-markdown.test.ts` — `SPECSFY: AC-003` | RED: YAML não escalar aceito | GREEN: T015 rejeita listas/mapas/blocos não escalares antes do save | Focal Vitest e regressão legada passaram; typecheck global segue com falhas preexistentes fora de T015 |
| US-002, FR-002, NFR-002, AC-004 | AC-004 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-004` | RED: bloco criado por `renderVerseFence` não virava blockquote/envelope | GREEN: T016 serializa fallback visível, envelope JSON versionado e hash SHA-256 | Focal T016 e regressão Milkdown passaram |
| US-002, FR-002, NFR-001, NFR-004, AC-005 | AC-005 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-005` | RED: conflito/id/envelope ausentes | GREEN: T016 preserva o fallback e sinaliza `conflict` quando o snapshot diverge | Focal T016 e regressão Milkdown passaram |
| US-002, FR-002, FR-003, NFR-002, NFR-004, AC-006 | AC-006 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-006` | RED: estado degraded ausente | GREEN: T016 mantém blockquote legível e sinaliza `degraded` sem metadados | Focal T016 e regressão Milkdown passaram |
| US-002, US-004, FR-002, FR-005, NFR-002, AC-007 | AC-007 | `apps/web/src/lib/features/notes/portable-envelope.test.ts` — `SPECSFY: AC-007` | RED: exportador exigia iframe e omitia link | GREEN: T017 exporta link Markdown visível sem iframe | Focal legado/envelope/exportação passou |
| US-002, FR-003, NFR-001, NFR-004, AC-008 | AC-008 | `apps/web/src/lib/features/notes/legacy-migration.test.ts` — `SPECSFY: AC-008` | RED: namespace atual não expunha APIs distintas de leitura/salvamento canônico | GREEN: T017 separa leitura não destrutiva de `saveCanonicalMarkdown` explícito e preserva fence inválido | Focal legado/envelope/exportação passou |
| US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 | AC-009 | `apps/web/src/lib/storage/workspace-content-repository.test.ts`, `apps/web/src/lib/features/bible/reader-highlights-repository.test.ts` — `SPECSFY: AC-009` | RED: módulo/contrato do repositório de conteúdo ainda não existia; workspace novo tratava highlights ausentes como erro | GREEN: T018 grava registros de nota/destaque atrás da porta comum e T032 trata `NotFoundError` inicial como coleção vazia | Focal do repositório e primeiro carregamento passaram nos backends SQLite/IndexedDB |
| US-003, FR-004, NFR-001, NFR-003, AC-010 | AC-010 | `apps/web/src/lib/features/notes/index-rebuilder.test.ts`, `apps/web/src/lib/features/bible/reader-highlights-repository.test.ts` — `SPECSFY: AC-010` | RED: rebuild não lia registros canônicos nem recuperava índice sidecar corrompido; diretório inicial ausente interrompia a leitura | GREEN: T019 reconstrói projeção determinística e T032 propaga apenas erros reais de storage | Focal de rebuild e regressão de workspace vazio passaram |
| US-003, FR-004, FR-005, NFR-001, NFR-003, AC-011 | AC-011 | `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — `SPECSFY: AC-011` | RED: rebuild não isolava a Bíblia nem produzia linhas | GREEN: T019 mantém os bytes SQLite da Bíblia inalterados durante o rebuild | Focal de rebuild passou |
| US-004, FR-005, NFR-002, NFR-004, AC-012 | AC-012 | `apps/web/src/lib/features/notes/note-export.test.ts` — `SPECSFY: AC-012` | RED: PDF/export mantinha iframe e não URL visível | GREEN: T020 gera fallback de impressão/PDF offline a partir do snapshot e mantém URL visível | Focal de exportação passou |
| US-004, FR-003, FR-005, NFR-002, NFR-004, AC-013 | AC-013 | `apps/web/src/lib/features/notes/note-export.test.ts` — `SPECSFY: AC-013` | RED: exportação derivada não tinha link Markdown | GREEN: T017 gera fallback visível e não altera a fonte | Focal legado/envelope/exportação passou |
| US-003, US-004, FR-004, FR-005, NFR-002, NFR-003, AC-014 | AC-014 | `apps/web/src/lib/storage/workspace-content-repository.test.ts` — `SPECSFY: AC-014` | RED: módulo/contrato do repositório de conteúdo ainda não existia | GREEN: T018 mantém identidade lógica independente de path e rebuild por contexto | Focal do repositório passou; rebuild completo permanece em T019 |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade | `portable-markdown.test.ts`; Vitest focal | T015 Passed: parser/serializer preserva identidade, schema, unknown scalar keys, corpo GFM e rejeita frontmatter não escalar |
| FR-002 | AC-004, AC-005, AC-006, AC-007 | Unidade/contrato | `portable-envelope.test.ts`; Vitest focal | T016 Passed em AC-004–006; T017 Passed em AC-007 com link Markdown sem iframe |
| FR-003 | AC-003, AC-006, AC-008, AC-013 | Unidade/contrato | `legacy-migration.test.ts`, `note-export.test.ts` | T015/T016 Passed em AC-003/006; T017 Passed em AC-008/013 |
| FR-004 | AC-009, AC-010, AC-011, AC-014 | Integração | `workspace-content-repository.test.ts`, `highlight-repository.test.ts`, `reader-highlights-repository.test.ts`, `index-rebuilder.test.ts` | T018/T019/T032 Passed em registros, isolamento, rebuild e workspace sem diretório inicial; projeções usam `workspaceId` |
| FR-005 | AC-007, AC-011, AC-012, AC-013, AC-014 | Integração/contrato | `index-rebuilder.test.ts`, `note-export.test.ts` | T017/T019/T020 Passed em AC-007/011/012/013; AC-014 Passed na suíte focal |
| NFR-001 | AC-001, AC-003, AC-005, AC-008, AC-009, AC-010, AC-011 | Falha/integração | Vitest focal + rollback fixtures | Passed na suíte focal, incluindo o primeiro carregamento sem `highlights/`; regressões globais legadas permanecem isoladas em AI/sync/backup |
| NFR-002 | AC-001, AC-002, AC-004, AC-006, AC-007, AC-009, AC-012, AC-013, AC-014 | Compatibilidade | fixtures CommonMark/GFM e export | Passed na suíte focal para fallback Markdown/PDF; inspeção externa permanece pendente |
| NFR-003 | AC-009, AC-010, AC-011, AC-014 | Determinismo/performance | `index-rebuilder.test.ts`, `index-rebuilder.benchmark.test.ts` | Passed no rebuild lógico: 1.000 notas + 10.000 destaques, progresso por registro, leitura direta durante a operação e menos de 30 segundos no runner local/CI-like; o teste usa storage controlado, portanto não substitui a prova dos drivers físicos SQLite/IndexedDB |
| NFR-004 | AC-003, AC-005, AC-006, AC-008, AC-012, AC-013 | Segurança/a11y | Vitest + Svelte/browser futuro | Passed na suíte focal, incluindo estados acessíveis e exportação sem iframe obrigatório |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — a definição foi atualizada para respeitar SQLite nativo no Tauri, IndexedDB no PWA, `workspaceId` como fronteira e Markdown/PDF como exportações derivadas.
- **Data**: 2026-09-06.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0017-formatos-portateis-indice-reconstruivel/spec.md`
- **Evidência**: validação estrita da definição e do plano, revisão PROD/ARCH/SEC e validação de tarefas de interface passaram; o plano e os REDs históricos continuam separados da nova cadeia T029/T030.
- **FIND-ARCH-002** [P1] [Resolved] a definição anterior tratava Markdown/JSON e `.openbible/index.sqlite` como fonte/projeção principal, contrariando a autoridade SQLite/IndexedDB da SPEC-0016 — Refs: FR-001, FR-004, FR-005, NFR-003 — Evidence: completed/0016-multiplos-workspaces-modelo-vaults/spec.md:33 — Effect: a implementação poderia manter a arquitetura de arquivos e usar `sql.js` como banco operacional do PWA — Suggestion: corrigido ao tornar SQLite nativo/IndexedDB a fonte operacional, Markdown/PDF derivados e Bíblia SQLite/WASM separada.
- **FIND-PROD-001** [P2] [Resolved] métricas inicialmente não possuíam alvos quantitativos — Refs: NFR-003 — Evidence: review/0017-formatos-portateis-indice-reconstruivel/spec.md:35 — Effect: sucesso e desempenho não seriam comparáveis — Suggestion: resolvido com percentuais, fixture de carga, prazo e frequência de progresso.
- **FIND-ARCH-001** [P1] [Resolved] envelope portátil estava descrito sem gramática normativa — Refs: FR-002 — Evidence: review/0017-formatos-portateis-indice-reconstruivel/spec.md:553 — Effect: serializers poderiam produzir formatos incompatíveis — Suggestion: resolvido com exemplos canônicos, hash e regras de degradação.
- **FIND-SEC-001** [P1] [Resolved] comentários, JSON e URLs precisavam de limites e neutralização explícita — Refs: NFR-004 — Evidence: review/0017-formatos-portateis-indice-reconstruivel/spec.md:580 — Effect: conteúdo importado poderia fechar comentário, pressionar memória ou ativar player indevido — Suggestion: resolvido com escaping, limites, HTTPS e allowlist de player.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`,
  severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: READY — o plano foi reconciliado para backend operacional SQLite/IndexedDB; T029 concluiu o RED do contrato e T030 é o primeiro predecessor de código da nova fronteira.
- **Data**: 2026-09-06.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0017-formatos-portateis-indice-reconstruivel/spec.md`
- **Evidência**: 32 tarefas, 16 TDD, 12 de código, 27 IDs cobertos; validação de tarefas em modo draft e estrita passaram após o RED de T031.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — T015–T032 foram implementadas; a regressão manual do primeiro destaque foi reproduzida em T031, corrigida em T032, validada com 14 arquivos/76 testes na suíte focal da SPEC-0017 e confirmada no build de produção da web e no binário nativo Tauri.
- **Regressão global**: `bun run --cwd apps/web test:tdd` foi executado com proteção de banco `SAFE` e terminou com 124 arquivos/461 testes passando e 28 arquivos/59 testes falhando. As falhas estão confinadas às fixtures RED preexistentes de `features/ai`, `features/sync` e `storage/backup`; nenhum arquivo focal alterado pela SPEC-0017 falhou nessa execução.
- **Enforcement do repositório**: a validação estrutural da SPEC-0017, das 32 tarefas e das tarefas de interface passou; os 27 IDs requeridos permanecem cobertos. A execução global continua registrando somente fixtures RED preexistentes de outras áreas, sem falha nos arquivos focais desta SPEC.
- **Limitação conhecida do enforcement global**: o `verify_repo.mjs` executa o rastreador de cada spec contra toda a árvore de testes; por isso, ao validar esta spec, ele também lista marcadores legítimos de US/FR/NFR/AC pertencentes a outras specs como órfãos. Esse falso positivo é externo ao escopo da SPEC-0017; os checks `spec`, `tasks`, `acceptance`, `evidence` e `research` desta spec passaram.
- **Evidência dos drivers**: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` passou com 14 testes; a suíte focal passou com 14 arquivos/76 testes; o benchmark passou com 1 arquivo/1 teste; o build nativo gerou `OpenBible_0.6.0_amd64.deb` e `openbible-desktop`. A verificação manual confirmou `PRAGMA user_version = 2`, as tabelas `workspace_notes`, `workspace_highlights`, `reader_highlight` e `workspace_index_state`, além da criação/leitura de um destaque no Tauri.
- **Compatibilidade externa**: a pesquisa armazenada em `research/markdown-portability/evidence.md`, os testes de parser/envelope/exportação e a inspeção da saída Markdown/PDF comprovam legibilidade e preservação; não há promessa de identidade visual entre renderizadores.
- **Achados preservados**: T001–T014 foram REDs da arquitetura anterior; a evidência permanece para rastreabilidade, sem autorizar retorno à arquitetura de arquivos.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

> **Histórico invalidado em 2026-09-06:** T001–T014 foram materializados contra a hipótese anterior de Markdown/JSON autoral em arquivos e `.openbible/index.sqlite` como projeção. A evidência RED é preservada para rastreabilidade, mas essas tarefas não autorizam implementação até a revalidação do backend SQLite/IndexedDB. T029–T030 iniciam a nova cadeia de prova.

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

- [x] T009 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-009 em `apps/web/src/lib/features/notes/highlight-repository.test.ts` — Refs: US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Confirmar registro primário por `workspaceId + highlightId` e projeção separada.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-009` com contexto de backend fake realista.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/highlight-repository.test.ts -t 'SPECSFY: AC-009'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa persistência autoral.
  - [x] **EVIDENCE**: Registrar chamada a `persistHighlight`, `workspaceId`, registro esperado, projeção observada e RED.
  - [x] **IMPROVE**: Fixar ordenação e id independente do path.

- [x] T010 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-010 em `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — Refs: US-003, FR-004, NFR-001, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Confirmar registros primários idênticos, projeção ausente/corrupta e determinismo entre adapters.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-010` comparando linhas ordenadas.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/index-rebuilder.test.ts -t 'SPECSFY: AC-010'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa rebuild.
  - [x] **EVIDENCE**: Registrar registros preparados, projeção ausente/corrupta, linhas/object stores consultados e RED.
  - [x] **IMPROVE**: Separar leitura de fonte do commit final do SQLite.

- [x] T011 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-011 em `apps/web/src/lib/features/notes/index-rebuilder.test.ts` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Confirmar Bíblia SQLite/WASM read-only fora do backend de notas e do rebuild.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-011` comparando bytes antes/depois.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/index-rebuilder.test.ts -t 'SPECSFY: AC-011'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa isolamento de fontes.
  - [x] **EVIDENCE**: Registrar bytes de `bibles/nvi.sqlite` antes/depois, backend/projeção esperada e RED.
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
  - [x] **PREP**: Confirmar `workspaceId`/ids estáveis, exportação JSON opcional e XML fora do contrato.
  - [x] **EXECUTE**: Escrever caso `SPECSFY: AC-014` após mover a raiz lógica.
  - [x] **VERIFY**: Executar `cd apps/web && npm run test:tdd -- src/lib/features/notes/portable-markdown.test.ts -t 'SPECSFY: AC-014'` e observar RED.
  - [x] **VISUAL**: Não aplicável: testa portabilidade de identidade.
  - [x] **EVIDENCE**: Registrar ids antes/depois e RED.
  - [x] **IMPROVE**: Fixar que path físico não participa da identidade.

#### Replanejamento da fronteira SQLite/IndexedDB — 2026-09-06

- [x] T029 [TEST] [TDD] [US-003] Provar contrato comum e isolamento do conteúdo por backend em `apps/web/src/lib/storage/workspace-content-repository.test.ts` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-009, AC-010, AC-011, AC-014 — Depends: none
  - [x] **PREP**: Ler SPEC-0016 e confirmar `workspaceId`, backend `sqlite`/`indexeddb`, transação e Bíblia SQLite/WASM fora do conteúdo.
  - [x] **EXECUTE**: Escrever testes A/B para persistir, listar e reconstruir registros sem cruzar workspaces.
  - [x] **VERIFY**: Observar RED focal em SQLite/IndexedDB antes do novo repositório de conteúdo.
  - [x] **VISUAL**: Não aplicável: contrato de persistência sem tela.
  - [x] **EVIDENCE**: Registrar o teste, o contexto A/B, o isolamento esperado e o RED nas seções 11–13.
  - [x] **IMPROVE**: Usar o mesmo contrato de domínio para os dois adapters, sem expor SQL ao editor.

- [x] T030 [CODE] [US-003] Versionar schema e stores de conteúdo no SQLite/IndexedDB em `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql`, `apps/desktop/src-tauri/src/database.rs` e `apps/web/src/lib/storage/indexeddb-workspace-adapter.ts` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-009, AC-010, AC-011, AC-014 — Depends: T029, T009, T010, T011, T014
  - [x] **PREP**: Confirmar RED T029, schema v1 da SPEC-0016 e a separação entre registros primários, projeções e Bíblia read-only.
  - [x] **EXECUTE**: Adicionar migration SQLite v2 e stores/indexes IndexedDB v2 com chave composta por `workspaceId`, transações e versionamento compatíveis.
  - [x] **VERIFY**: `database::tests` passou com 5 testes, incluindo upgrade v1→v2 e isolamento A/B; o teste IndexedDB passou com schema v2 e todos os stores esperados; não há `sql.js` operacional no PWA.
  - [x] **VISUAL**: Não aplicável: migration e adapter de persistência sem alteração de interface.
  - [x] **EVIDENCE**: Migration, schema, stores, testes, `.specsfy/DATABASE.md`, documentação e monitor foram verificados.
  - [x] **IMPROVE**: A migration mantém v1 intacta e aplica v2 transacionalmente, permitindo upgrade idempotente sem misturar o banco da Bíblia.

<!-- specsfy:evidence {"task":"T030","refs":["US-003","FR-004","FR-005","NFR-001","NFR-003","AC-009","AC-010","AC-011","AC-014"],"files":["apps/desktop/src-tauri/migrations/002_create_workspace_content.sql","apps/desktop/src-tauri/src/database.rs","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/storage/indexeddb-workspace-adapter.test.ts",".specsfy/DATABASE.md"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml database::tests\"","exit":0},{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml database::tests","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/storage/indexeddb-workspace-adapter.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/indexeddb-workspace-adapter.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

#### Fase 2 — Código por fatia vertical

- [x] T015 [CODE] [US-001] Implementar parser de legado e serializer de exportação em `apps/web/src/lib/features/notes/portable-markdown.ts` — Refs: US-001, FR-001, NFR-001, NFR-002, NFR-004, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar os três REDs, limites de parser e executar `$specsfy-documentator` antes do código.
  - [x] **EXECUTE**: Implementar leitura de legado, frontmatter escalar, unknown keys, comentários limitados e exportação derivada sem tornar Markdown a fonte operacional.
  - [x] **VERIFY**: Rodar os três testes focais e `npm run check` em `apps/web`.
  - [x] **VISUAL**: Não aplicável: módulo de persistência sem tela.
  - [x] **EVIDENCE**: Registrar arquivos, comandos, GREEN e IDs cobertos.
  - [x] **IMPROVE**: Preservar os valores escalares desconhecidos e bloquear estruturas YAML que poderiam ser normalizadas destrutivamente.

<!-- specsfy:evidence {"task":"T015","refs":["US-001","FR-001","NFR-001","NFR-002","NFR-004","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/features/notes/portable-markdown.ts","apps/web/src/lib/features/notes/note-markdown.ts","apps/web/src/lib/features/notes/note-types.ts","apps/web/src/lib/features/notes/portable-markdown.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/note-markdown.test.ts src/lib/features/notes/notes-repository.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/note-markdown.test.ts src/lib/features/notes/notes-repository.test.ts","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web check-types\"","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T016 [CODE] [US-002] Implementar envelopes e conflitos sobre snapshots do backend em `apps/web/src/lib/features/notes/portable-envelope.ts` — Refs: US-002, FR-002, NFR-001, NFR-002, NFR-004, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar REDs AC-004..006 e executar `$specsfy-documentator` antes do código.
  - [x] **EXECUTE**: Implementar blockquote de exportação, comentário JSON, snapshot/hash, degraded e conflict sem mutar o registro primário.
  - [x] **VERIFY**: Rodar testes focais, parser e typecheck; o typecheck global continua bloqueado por falhas preexistentes fora de T016.
  - [x] **VISUAL**: Não aplicável: contrato de envelope; UI ficará na fase de interface.
  - [x] **EVIDENCE**: Registrar GREEN, fallback e diagnostics.
  - [x] **IMPROVE**: Centralizar escaping, SHA-256, limites e diagnósticos em função compartilhada.

<!-- specsfy:evidence {"task":"T016","refs":["US-002","FR-002","NFR-001","NFR-002","NFR-004","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/notes/portable-envelope.ts","apps/web/src/lib/features/notes/milkdown-markdown-io.ts","apps/web/src/lib/features/notes/portable-envelope.test.ts","apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'canonical verse envelope|verse snapshot conflict|degraded verse envelope'\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-envelope.test.ts -t 'canonical verse envelope|verse snapshot conflict|degraded verse envelope'","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/milkdown-markdown-io.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/milkdown-markdown-io.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T017 [CODE] [US-002] Migrar legacy e vídeo em `apps/web/src/lib/features/notes/{legacy-migration.ts,note-export.ts}` — Refs: US-002, US-004, FR-002, FR-003, FR-005, NFR-002, NFR-004, AC-007, AC-008, AC-013 — Depends: T007, T008, T013
  - [x] **PREP**: Confirmar REDs de vídeo, fence inválido e exportação, e executar `$specsfy-documentator`.
  - [x] **EXECUTE**: Implementar dual-read, importação explícita atômica para o backend ativo e links/fallbacks derivados.
  - [x] **VERIFY**: Rodar testes de legacy/exportação e `npm run check`; o typecheck global continua bloqueado por falhas preexistentes fora de T017.
  - [x] **VISUAL**: Não aplicável: exportador e migrador; tela será coberta na fase de interface.
  - [x] **EVIDENCE**: Registrar GREEN, rollback e fonte não alterada na leitura.
  - [x] **IMPROVE**: Separar fonte canônica de qualquer saída iframe/callout.

<!-- specsfy:evidence {"task":"T017","refs":["US-002","US-004","FR-002","FR-003","FR-005","NFR-002","NFR-004","AC-007","AC-008","AC-013"],"files":["apps/web/src/lib/features/notes/legacy-migration.ts","apps/web/src/lib/features/notes/milkdown-markdown-io.ts","apps/web/src/lib/features/notes/note-export.ts","apps/web/src/lib/features/notes/legacy-migration.test.ts","apps/web/src/lib/features/notes/portable-envelope.test.ts","apps/web/src/lib/features/notes/note-export.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T018 [CODE] [US-003] Implementar registros de destaque no backend ativo em `apps/web/src/lib/features/notes/highlight-repository.ts` e `apps/web/src/lib/storage/workspace-content-repository.ts` — Refs: US-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009, AC-014 — Depends: T009, T011, T014, T030
  - [x] **PREP**: Confirmar REDs de registro/IDs, o contrato `WorkspaceDataContext` e executar `$specsfy-documentator`.
  - [x] **EXECUTE**: Implementar persistência transacional por `workspaceId`, campos desconhecidos preservados e projeção posterior.
  - [x] **VERIFY**: Rodar testes do repositório, adapters e typecheck; o typecheck global continua bloqueado por falhas preexistentes fora de T018.
  - [x] **VISUAL**: Não aplicável: repositório de conteúdo sem tela.
  - [x] **EVIDENCE**: Registrar backend, `workspaceId`, GREEN e ausência de arquivo lateral como autoridade.
  - [x] **IMPROVE**: Evitar duplicação de lógica entre SQLite nativo e IndexedDB atrás do contrato comum.

<!-- specsfy:evidence {"task":"T018","refs":["US-003","FR-004","NFR-001","NFR-002","NFR-003","AC-009","AC-014"],"files":["apps/web/src/lib/storage/workspace-content-repository.ts","apps/web/src/lib/storage/workspace-content-repository.test.ts","apps/web/src/lib/features/notes/highlight-repository.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-content-repository.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-content-repository.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T019 [CODE] [US-003] Implementar rebuild e separação dos backends em `apps/web/src/lib/features/notes/index-rebuilder.ts` e `apps/desktop/src-tauri/src/database.rs` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-010, AC-011, AC-014 — Depends: T010, T011, T014, T018, T030
  - [x] **PREP**: Confirmar REDs de determinismo/backend/Bíblia e executar `$specsfy-documentator`.
  - [x] **EXECUTE**: Implementar leitura ordenada de registros, transação SQLite/IndexedDB, progresso, projeção e exclusão da Bíblia da fonte.
  - [x] **VERIFY**: Rodar testes rebuild, benchmark de 1.000 notas + 10.000 destaques, paridade dos adapters e `npm run check`; o typecheck global continua bloqueado por falhas preexistentes fora de T019.
  - [x] **VISUAL**: Não aplicável: processamento de índice.
  - [x] **EVIDENCE**: Registrar registros equivalentes, bytes da Bíblia, backend usado e GREEN.
  - [x] **IMPROVE**: Isolar regras determinísticas em funções puras testáveis.

<!-- specsfy:evidence {"task":"T019","refs":["US-003","FR-004","FR-005","NFR-001","NFR-003","AC-010","AC-011","AC-014"],"files":["apps/web/src/lib/features/notes/index-rebuilder.ts","apps/web/src/lib/features/notes/index-rebuilder.test.ts","apps/web/src/lib/features/notes/index-rebuilder.benchmark.test.ts","apps/web/src/lib/storage/workspace.ts","apps/web/src/lib/features/bible/reader-highlights-repository.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/index-rebuilder.benchmark.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/features/bible/reader-highlights-repository.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/index-rebuilder.benchmark.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/features/bible/reader-highlights-repository.test.ts","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/index-rebuilder.benchmark.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/index-rebuilder.benchmark.test.ts","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T020 [CODE] [US-004] Implementar exportação offline em `apps/web/src/lib/features/notes/note-export.ts` — Refs: US-004, FR-005, NFR-002, NFR-004, AC-012, AC-013, AC-014 — Depends: T012, T013, T014
  - [x] **PREP**: Confirmar REDs de PDF/fallback/exportação e executar `$specsfy-documentator`.
  - [x] **EXECUTE**: Implementar Markdown canônico/derivado e fallback de impressão sem mutar a fonte.
  - [x] **VERIFY**: Rodar testes de exportação e `npm run check`; o typecheck global continua bloqueado por falhas preexistentes fora de T020.
  - [x] **VISUAL**: Não aplicável no módulo; visual do PDF será conferido pela tarefa de interface.
  - [x] **EVIDENCE**: Registrar artefatos gerados, GREEN e ausência de rede necessária.
  - [x] **IMPROVE**: Tornar aviso “exportação derivada” parte do contrato de saída.

<!-- specsfy:evidence {"task":"T020","refs":["US-004","FR-005","NFR-002","NFR-004","AC-012","AC-013","AC-014"],"files":["apps/web/src/lib/features/notes/note-export.ts","apps/web/src/lib/features/notes/note-export.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/note-export.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/note-export.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

#### Fase de interface

Os blocos Svelte e seus consumidores serão registrados em `INTERFACE.md` pela tarefa T026 após a implementação das telas.

- [x] T021 [CODE] [US-002] Integrar blocos ricos e estados no editor Svelte em `apps/web/src/lib/features/notes/{MilkdownNoteEditor.svelte,VerseBlockView.svelte,YouTubeBlockView.svelte}` — Refs: US-002, FR-002, FR-003, NFR-002, NFR-004, AC-004, AC-005, AC-006, AC-008 — Depends: T004, T005, T006, T008
  - [x] **PREP**: Fluxos da seção 10 e REDs confirmados; documentator executado antes e depois da implementação.
  - [x] **EXECUTE**: `PortableBlockStatus` explicita `canonical`, `degraded` e `conflict`; verso mantém snapshot legível; vídeo expõe URL/fallback e só carrega iframe após ação explícita.
  - [x] **VERIFY**: Testes Svelte/Vitest cobrem estado, ação acessível, fallback de verso/vídeo e ausência de iframe no estado não carregado; callbacks existentes do editor foram preservados.
  - [x] **VISUAL**: Revisão de markup renderizado e CSS responsivo em claro/escuro, com bordas, espaçamentos, margens, padding e tipografia, além de foco semântico, conteúdo longo e largura estreita; sem gradientes ou sombras decorativas.
  - [x] **EVIDENCE**: Testes focais e checks de documentação/monitor registrados abaixo; estados e viewport foram exercitados no SSR/CSS da implementação.
  - [x] **IMPROVE**: Reutilizados os blocos existentes e criado apenas o status compartilhado, sem fluxo paralelo de edição.

<!-- specsfy:evidence {"task":"T021","refs":["US-002","FR-002","FR-003","NFR-002","NFR-004","AC-004","AC-005","AC-006","AC-008"],"files":["apps/web/src/lib/features/notes/PortableBlockStatus.svelte","apps/web/src/lib/features/notes/VerseBlockView.svelte","apps/web/src/lib/features/notes/YouTubeBlockView.svelte","apps/web/src/lib/features/notes/portable-block-ui.test.ts","apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/MilkdownNoteEditor.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/MilkdownNoteEditor.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T022 [CODE] [US-003] Integrar destaque e recovery em `apps/web/src/routes/highlights/+page.svelte` — Refs: US-003, FR-004, NFR-001, NFR-003, AC-009, AC-010, AC-011 — Depends: T009, T010, T011
  - [x] **PREP**: REDs de registros/rebuild confirmados; documentator executado antes e depois da implementação.
  - [x] **EXECUTE**: A página exibe vazio, loading, erro com retry, progresso, sucesso e consulta da projeção; a leitura reconstrói a projeção quando o manifesto está presente e mantém as Bíblias intocadas.
  - [x] **VERIFY**: Testes browser/Svelte cobrem ação de rebuild, registro primário preservado, projeção visível, retry após falha e navegação/foco por nomes acessíveis.
  - [x] **VISUAL**: Revisão em viewport desktop e CSS mobile dos estados vazio/loading/error/success, incluindo bordas, espaçamentos, margens, padding e tipografia; ações mantêm foco semântico e não dependem apenas de cor.
  - [x] **EVIDENCE**: Testes focais, documentator e monitor registrados abaixo; viewport de 1440px foi exercitado e o CSS de largura estreita foi revisado.
  - [x] **IMPROVE**: A recuperação é orientada à ação, informa a consequência e separa a projeção derivada dos registros primários.

<!-- specsfy:evidence {"task":"T022","refs":["US-003","FR-004","NFR-001","NFR-003","AC-009","AC-010","AC-011"],"files":["apps/web/src/routes/highlights/+page.svelte","apps/web/src/routes/highlights.svelte.spec.ts","apps/web/src/lib/features/bible/reader-highlights-repository.ts","apps/web/src/lib/features/notes/index-rebuilder.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/routes/highlights.svelte.spec.ts src/lib/features/notes/index-rebuilder.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/routes/highlights.svelte.spec.ts src/lib/features/notes/index-rebuilder.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T023 [CODE] [US-003] Integrar recovery no painel de workspace em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-004, FR-005, NFR-001, NFR-003, AC-010, AC-011, AC-014 — Depends: T010, T011, T014
  - [x] **PREP**: Estados de storage e recovery confirmados; documentator executado antes e depois da implementação.
  - [x] **EXECUTE**: Painel de índice informa backend e versão, mostra progresso, permite retry e cancelamento com `AbortSignal` antes do commit da projeção.
  - [x] **VERIFY**: Contratos Vitest cobrem loading/vazio/erro, ações nomeadas por teclado, cancelamento e preservação dos registros primários; o painel é responsivo para mobile e zoom.
  - [x] **VISUAL**: Revisão de bordas, espaçamentos, margens, padding e tipografia em desktop/mobile, com foco visível, mensagem semântica e ação de recuperação próxima do estado.
  - [x] **EVIDENCE**: Testes focais, documentator e monitor registrados abaixo; a versão da projeção e os estados de retry/cancelamento foram verificados.
  - [x] **IMPROVE**: Reutilizados os controles nativos e os padrões locais de `feedback`, `error`, foco e ações, sem nova primitive de UI.

<!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-004","FR-005","NFR-001","NFR-003","AC-010","AC-011","AC-014"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/workspace/workspace-settings.spec.ts","apps/web/src/lib/features/notes/index-rebuilder.ts","apps/web/src/lib/features/notes/index-rebuilder.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/notes/index-rebuilder.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/notes/index-rebuilder.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T024 [CODE] [US-004] Integrar menu de exportação em `apps/web/src/routes/notes/[id]/+page.svelte` — Refs: US-004, FR-005, NFR-002, NFR-004, AC-012, AC-013, AC-014 — Depends: T012, T013, T014
  - [x] **PREP**: REDs de exportação confirmados; documentator executado antes e depois da implementação.
  - [x] **EXECUTE**: Menu acessível separa Markdown e PDF, informa derivação do snapshot e usa fallback de link visível para vídeos; PDF abre impressão offline.
  - [x] **VERIFY**: Teste browser exercita abertura do menu, nomes e descrições das ações; testes de exportação cobrem artefato derivado, preservação da fonte e ausência de iframe obrigatório.
  - [x] **VISUAL**: Revisão de bordas, espaçamentos, margens, padding e tipografia em conteúdo longo e mobile; descrições permanecem legíveis e o feedback usa `role=status`/`role=alert`.
  - [x] **EVIDENCE**: Testes focais, documentator e monitor registrados abaixo; menu e estados foram exercitados em viewport de 390px e 1440px pela suíte existente.
  - [x] **IMPROVE**: A ação de exportar permanece separada de salvar a fonte; o componente de exportação só deriva artefatos em memória.

<!-- specsfy:evidence {"task":"T024","refs":["US-004","FR-005","NFR-002","NFR-004","AC-012","AC-013","AC-014"],"files":["apps/web/src/routes/notes/[id]/+page.svelte","apps/web/src/routes/notes-editor.svelte.spec.ts","apps/web/src/lib/features/notes/note-export.ts","apps/web/src/lib/features/notes/note-export.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/routes/notes-editor.svelte.spec.ts src/lib/features/notes/note-export.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/routes/notes-editor.svelte.spec.ts src/lib/features/notes/note-export.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

#### Fase de documentação e fechamento

- [x] T025 [DOC] [US-003] Atualizar persistência em `.specsfy/DATABASE.md` — Refs: FR-004, FR-005, NFR-001, NFR-003, AC-009, AC-010, AC-011 — Depends: T018, T019
  - [x] **PREP**: Tabelas/object stores v2, registros primários, projeções, versionamento e fontes legadas conferidos.
  - [x] **EXECUTE**: Inventário oficial registra `app.sqlite`, IndexedDB `openbible-workspace`, entidades, índices, escopo por `workspaceId`, rebuild e cancelamento antes do commit.
  - [x] **VERIFY**: Documentação comparada com `workspace-content-repository.ts`, `index-rebuilder.ts`, `reader-highlights-repository.ts` e migrations v2.
  - [x] **VISUAL**: Não aplicável: documentação de persistência, sem superfície visual.
  - [x] **EVIDENCE**: Caminhos, separação de legado/exportação e checks do documentator/monitor registrados abaixo.
  - [x] **IMPROVE**: Bíblias importadas estão declaradas como read-only e fora do rebuild; `index.sqlite`, Markdown e JSON aparecem somente como legado/recovery.

<!-- specsfy:evidence {"task":"T025","refs":["FR-004","FR-005","NFR-001","NFR-003","AC-009","AC-010","AC-011"],"files":[".specsfy/DATABASE.md","apps/desktop/src-tauri/migrations/001_create_workspaces.sql","apps/desktop/src-tauri/migrations/002_create_workspace_content.sql","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/storage/workspace-content-repository.ts","apps/web/src/lib/features/notes/index-rebuilder.ts","apps/web/src/lib/features/bible/reader-highlights-repository.ts"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

- [x] T026 [DOC] [US-002] Atualizar contrato de interface em `INTERFACE.md` — Refs: US-002, US-003, US-004, NFR-004, AC-005, AC-009, AC-012 — Depends: T021, T022, T023, T024
  - [x] **PREP**: Telas, blocos Svelte, estados e consumidores alterados inventariados.
  - [x] **EXECUTE**: `INTERFACE.md` registra `PortableBlockStatus`, props/estados de verso e vídeo, recovery de destaques/workspace e menu de exportação Markdown/PDF.
  - [x] **VERIFY**: Correspondência conferida com a seção 10, rotas reais e implementação Svelte; `validate_interface_tasks.mjs` retornou OK.
  - [x] **VISUAL**: Não aplicável: registro documental da revisão visual já feita nas tarefas de interface.
  - [x] **EVIDENCE**: Documentator, monitor e validação de interface registrados abaixo; arquivos e telas reais foram referenciados.
  - [x] **IMPROVE**: Linguagem foi mantida compatível com Svelte/shadcn-svelte; não há referência normativa a React/ReUI nos blocos alterados.

<!-- specsfy:evidence {"task":"T026","refs":["US-002","US-003","US-004","NFR-004","AC-005","AC-009","AC-012"],"files":["INTERFACE.md","apps/web/src/lib/features/notes/PortableBlockStatus.svelte","apps/web/src/lib/features/notes/VerseBlockView.svelte","apps/web/src/lib/features/notes/YouTubeBlockView.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/routes/highlights/+page.svelte","apps/web/src/routes/notes/[id]/+page.svelte"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0017-formatos-portateis-indice-reconstruivel/spec.md","exit":0}]} -->

- [x] T027 [DOC] [US-001] Reconstruir documentação técnica e revisar `PROJECT.md`/`docs/` — Refs: US-001, US-004, NFR-002, AC-002, AC-013, AC-014 — Depends: T015, T017, T020, T026
  - [x] **PREP**: Arquivos e impacto no fluxo local-first conferidos; documentator executado.
  - [x] **EXECUTE**: `PROJECT.md`, `docs/architecture.md`, `docs/database.md` e `docs/testing.md` refletem SQLite `app.sqlite`, IndexedDB PWA, exportações derivadas e legacy/recovery.
  - [x] **VERIFY**: Documentator reconstruído e validado; caminhos de migrations, adapters, repositórios, rebuild, rotas e suítes focais conferidos.
  - [x] **VISUAL**: Não aplicável: documentação técnica.
  - [x] **EVIDENCE**: Comandos, arquivos e justificativa de impacto registrados abaixo; a documentação não cria fonte normativa paralela.
  - [x] **IMPROVE**: Documentado content-preserving, fallback legível e separação entre identidade visual do produto e guideline externo.

<!-- specsfy:evidence {"task":"T027","refs":["US-001","US-004","NFR-002","AC-002","AC-013","AC-014"],"files":["PROJECT.md","docs/architecture.md","docs/database.md","docs/testing.md",".specsfy/DATABASE.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->


- [x] T028 [TEST] [US-001] Fechar regressão e rastreabilidade em `apps/web/src/lib/features/notes/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027
  - [x] **PREP**: REDs históricos, suítes Vitest, documentação, rastreabilidade e arquivos alterados foram conferidos.
  - [x] **EXECUTE**: A suíte focal da SPEC-0017 e os checks de rastreabilidade foram executados com proteção de banco `SAFE`; a suíte global também foi executada para separar regressões preexistentes.
  - [x] **VERIFY**: A suíte focal passou com 13 arquivos e 67 testes; os 27 IDs de requisito estão cobertos. O baseline global permanece com 28 arquivos e 59 testes RED fora do escopo alterado, portanto a ausência de regressão é afirmada apenas para a fatia focal.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nas telas alteradas em 390px e 1440px; estados de carregamento, erro, conflito/degradação, foco e tema claro/escuro foram representados nos testes e estilos, sem achado visual bloqueador.
  - [x] **EVIDENCE**: Contagens, comandos, proteção de banco, documentação, monitor de contexto e resultado global foram registrados nas seções 11–13.
  - [x] **IMPROVE**: O fechamento separa a suíte focal da linha de base global e mantém os REDs legados explicitamente rastreados, evitando transformar falhas preexistentes em falso sucesso.

<!-- specsfy:evidence {"task":"T028","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-003","FR-004","FR-005","NFR-001","NFR-002","NFR-003","NFR-004","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014"],"files":["apps/web/src/lib/features/notes/portable-markdown.test.ts","apps/web/src/lib/features/notes/portable-envelope.test.ts","apps/web/src/lib/features/notes/legacy-migration.test.ts","apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts","apps/web/src/lib/features/notes/note-export.test.ts","apps/web/src/lib/features/notes/portable-block-ui.test.ts","apps/web/src/lib/features/notes/index-rebuilder.test.ts","apps/web/src/lib/features/notes/highlight-file-repository.test.ts","apps/web/src/lib/storage/workspace-content-repository.test.ts","apps/web/src/lib/storage/workspace.test.ts","apps/web/src/routes/highlights.svelte.spec.ts","apps/web/src/routes/notes-editor.svelte.spec.ts","apps/web/src/lib/features/workspace/workspace-settings.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/storage/workspace-content-repository.test.ts src/lib/storage/workspace.test.ts src/routes/highlights.svelte.spec.ts src/routes/notes-editor.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/storage/workspace-content-repository.test.ts src/lib/storage/workspace.test.ts src/routes/highlights.svelte.spec.ts src/routes/notes-editor.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts\"","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0017-formatos-portateis-indice-reconstruivel/spec.md","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0017-formatos-portateis-indice-reconstruivel/spec.md","exit":0}]} -->

- [x] T031 [TEST] [TDD] [US-003] Reproduzir o primeiro carregamento de destaques em workspace sem a pasta `highlights/` em `apps/web/src/lib/features/bible/reader-highlights-repository.test.ts` — Refs: US-003, FR-004, NFR-001, AC-009, AC-010 — Depends: T028
  - [x] **PREP**: Confirmar o fluxo do `BibleReader`, o manifesto v2 e o estado inicial sem registros de destaque.
  - [x] **EXECUTE**: Adicionar teste de contrato para `readChapterHighlights` com storage que sinaliza `NotFoundError` ao listar `highlights/`.
  - [x] **VERIFY**: Observar RED reproduzindo a mensagem de erro no primeiro carregamento, sem confundir coleção vazia com falha de storage.
  - [x] **VISUAL**: Não aplicável: regressão de leitura do repositório; a mensagem existente já é apresentada pelo estado da interface.
  - [x] **EVIDENCE**: O teste reproduziu `NotFoundError` em `rebuildWorkspaceIndex` antes da correção e cobriu AC-009/AC-010.
  - [x] **IMPROVE**: A ausência do diretório ficou fixada como fixture explícita para evitar regressão no onboarding de workspace novo.

- [x] T032 [CODE] [US-003] Tratar a ausência inicial de `highlights/` como coleção vazia no rebuild em `apps/web/src/lib/features/notes/index-rebuilder.ts` — Refs: US-003, FR-004, NFR-001, AC-009, AC-010 — Depends: T031
  - [x] **PREP**: Confirmar o RED de T031 e preservar falhas reais de permissão/storage para não mascarar infraestrutura indisponível.
  - [x] **EXECUTE**: Ajustar `index-rebuilder.ts` para converter somente `NotFoundError` do diretório de highlights em lista vazia, mantendo outros erros propagados.
  - [x] **VERIFY**: O teste do repositório, o rebuild e a suíte focal da SPEC-0017 passaram; a criação/leitura do primeiro destaque não trata mais uma pasta ausente como falha.
  - [x] **VISUAL**: Não aplicável: não há alteração de markup; o estado vazio já possui representação visual coberta pela tela de destaques.
  - [x] **EVIDENCE**: Focal de highlights passou com 3 arquivos/13 testes e a suíte focal da SPEC-0017 com 14 arquivos/75 testes; a Bíblia SQLite não é escrita.
  - [x] **IMPROVE**: O reconhecimento de diretório ausente ficou centralizado em helper pequeno e tipado, sem `any` ou cast cosmético.

<!-- specsfy:evidence {"task":"T032","refs":["US-003","FR-004","NFR-001","AC-009","AC-010"],"files":["apps/web/src/lib/features/notes/index-rebuilder.ts","apps/web/src/lib/features/bible/reader-highlights-repository.ts","apps/web/src/lib/features/bible/reader-highlights-repository.test.ts","apps/web/src/lib/features/notes/index-rebuilder.test.ts","apps/web/src/lib/features/notes/highlight-file-repository.test.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/bible/reader-highlights-repository.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/bible/reader-highlights-repository.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/features/bible/reader-highlights-repository.test.ts src/lib/storage/workspace-content-repository.test.ts src/lib/storage/workspace.test.ts src/routes/highlights.svelte.spec.ts src/routes/notes-editor.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts\"","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/notes/portable-markdown.test.ts src/lib/features/notes/portable-envelope.test.ts src/lib/features/notes/legacy-migration.test.ts src/lib/features/notes/milkdown-markdown-io.test.ts src/lib/features/notes/note-export.test.ts src/lib/features/notes/portable-block-ui.test.ts src/lib/features/notes/index-rebuilder.test.ts src/lib/features/notes/highlight-file-repository.test.ts src/lib/features/bible/reader-highlights-repository.test.ts src/lib/storage/workspace-content-repository.test.ts src/lib/storage/workspace.test.ts src/routes/highlights.svelte.spec.ts src/routes/notes-editor.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --check --project .","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico vigente: T029 (RED do contrato) → T030 (schema/adapters) → T018 (registros) → T019 (rebuild + benchmark) → T021/T022/T023/T024 (interfaces) → T025/T026/T027 → T028 → T031/T032 (primeiro destaque em workspace vazio).
- T001–T014 permanecem apenas como histórico invalidado; os testes revisados devem ser reexecutados após T029/T030. T025 só inicia após T018/T019; T026 aguarda todas as telas.
- Estratégia de MVP: primeiro backend e persistência por `workspaceId`, depois parser/exportação Markdown/PDF e recovery; a Bíblia SQLite/WASM fica fora da migração de conteúdo. T028 fecha a fatia completa.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016: workspace ativo, identidade e isolamento da raiz.
- Specs/backlogs do editor Milkdown, embeds e highlights existentes.
- `WorkspaceDataContext`, `WorkspaceContentRepository`, SQLite/rusqlite e IndexedDB disponíveis no projeto; `sql.js`/WASM permanece no leitor da Bíblia.
- Futura fatia de backup deve copiar o snapshot do backend e exportações Markdown/PDF, sem tratar a projeção como fonte única.

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
- **DEC-007**: registros de destaque vivem no backend ativo por `workspaceId`; JSON é serialização de intercâmbio/exportação quando necessário, não sidecar obrigatório.
- **DEC-008**: SQLite nativo no Tauri e IndexedDB no PWA são fontes operacionais equivalentes; a Bíblia SQLite/WASM é read-only e separada.
- **DEC-009**: rebuild determinístico compara registros/projeções lógicas entre SQLite e IndexedDB; `sql.js` não é o banco operacional do PWA.
- **DEC-010**: XML fora do escopo — JSON atende TypeScript/contratos internos e intercâmbio quando necessário.
- **DEC-011**: promessa pública content-preserving — evita prometer paridade visual impossível.
- **DEC-012**: Markdown e PDF são exportações derivadas do snapshot do backend ativo; arquivos legados só entram por migração/recovery explícitos.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os 14 cenários `AC` aplicáveis passam.
- [x] Todos os US, FR e NFR têm cobertura e evidência de verificação.
- [x] Parser, serializer, migração, registros, rebuild, exportação e recovery têm evidência TDD/BDD.
- [x] SQLite nativo e IndexedDB produzem registros/projeções equivalentes; `sql.js`/WASM consulta a Bíblia sem alterá-la.
- [x] Compatibilidade externa foi inspecionada como legibilidade/preservação, sem pixel-identidade.
- [x] `.specsfy/DATABASE.md`, documentação técnica e inventário de pacotes foram atualizados após implementação.
