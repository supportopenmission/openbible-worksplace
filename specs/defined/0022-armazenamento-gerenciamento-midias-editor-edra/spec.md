# Especificação integrada: Armazenamento e gerenciamento de mídias no editor Edra

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0022 |
| Slug | 0022-armazenamento-gerenciamento-midias-editor-edra |
| Status | Defined |
| Effort | 8 |
| Effort updated at | 2026-09-10 |
| Effort rationale | Fatia transversal que combina contrato de upload do Edra, persistência binária em dois runtimes, catálogo e vínculos, recuperação, backup/restauração, tela de inventário e testes de fronteira. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-10 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

Os blocos de imagem, vídeo e áudio do editor Edra recebem arquivos durante o upload, mas não possuem um contrato único para validar, copiar e resolver esses bytes de forma durável. O bloco pode ser criado com uma URL transitória ou falhar durante a cópia, deixando a nota quebrada, uma mídia impossível de localizar ou um arquivo parcial. O problema aparece tanto no PWA, onde a persistência deve respeitar o workspace IndexedDB, quanto no desktop Tauri, onde os bytes precisam permanecer no workspace nativo.

Também não existe uma visão operacional para a pessoa descobrir quais mídias estão ocupando o workspace, quais notas as usam, nem para remover com segurança aquilo que não tem referências.

#### Resultado desejado

Ao inserir uma imagem, vídeo ou áudio, o Edra valida o arquivo, copia os bytes para o backend local do workspace e só depois grava no conteúdo da nota uma referência estável de mídia. A nota continua abrindo offline, mesmo após recarregar o PWA ou reiniciar o desktop Tauri. Em Configurações > Uso e armazenamento, a pessoa encontra um inventário das mídias, pode filtrar por tipo, consultar uso e remover somente mídias sem uso. Mídias ausentes ou corrompidas permanecem representadas por um placeholder acessível e podem ser reimportadas sem perder a nota.

#### Métricas de sucesso

- 100% dos uploads aceitos nos testes de unidade e navegador sobrevivem a recarga/reabertura offline em um fixture IndexedDB e em um fixture nativo Tauri.
- 100% dos uploads inválidos, interrompidos ou acima do limite deixam zero bloco novo, zero referência de catálogo e zero byte órfão após a limpeza transacional.
- A listagem do inventário informa tipo, tamanho, quantidade de notas e última utilização para cada mídia disponível, sem carregar o blob inteiro.
- Um backup restaurado preserva os bytes, o catálogo e as referências de todas as mídias disponíveis; uma restauração parcial mantém o bloco e abre a nota com estado `missing`.
- A suíte de aceite cobre exclusão de mídia sem uso, bloqueio de exclusão em uso e recuperação de mídia ausente/corrompida.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: identificar os backends operacionais do workspace → **Conclusão**: o PWA usa IndexedDB e o desktop usa `app.sqlite` com arquivos no workspace nativo; `.openbible` permanece legado de migração/recuperação e não será o backend ativo de mídia. **Impacto**: a solução usa adaptadores por runtime.
- **R-002**: identificar o ponto de integração do Edra → **Conclusão**: `apps/web/src/lib/edra/shadcn/openbible-editor.ts` já recebe `onFileUpload?: (file: File) => Promise<string>` e `MediaPlaceHolder.svelte`/`MediaExtended.svelte` concentram a renderização. **Impacto**: a implementação completa o callback e substitui URLs transitórias por referências resolvíveis.
- **R-003**: identificar o fluxo existente de backup e armazenamento → **Conclusão**: enumerador, archive, restore e hash já são separados em `apps/web/src/lib/storage/backup/`; `WorkspaceStorage` já abstrai leitura/escrita e o adaptador IndexedDB suporta `Blob`. **Impacto**: mídia entra nos contratos existentes, sem novo serviço remoto.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-10-125413-armazenamento-e-gerenciamento-de-midias-no-editor-edra.md`.
- `specs/backlog/0023-armazenamento-gerenciamento-midias-editor-edra.md`.
- Decisões de produto registradas pelo usuário no ciclo de backlog em 2026-09-10.
- `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md` e `.specsfy/USER-PROFILE.md`.

#### Documentação consultada

- `apps/web/src/lib/storage/types.ts`, `workspace-content-storage.ts` e `indexeddb-workspace-adapter.ts`.
- `apps/web/src/lib/storage/backup/backup-enumerator.ts`, `backup-archive.ts`, `backup-restore.ts` e `backup-contract.ts`.
- `apps/desktop/src-tauri/src/commands/workspace.rs`, `database.rs` e migrations.
- `apps/web/src/lib/features/config/ConfigPage.svelte` e `WorkspaceSettings.svelte`.
- `apps/web/src/lib/edra/shadcn/openbible-editor.ts` e componentes de mídia.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. A pesquisa foi feita apenas em fontes do repositório e no backlog/inbox local.

#### Dúvidas respondidas

- **Q**: Onde os bytes devem ser persistidos? → **A**: IndexedDB no PWA; no Tauri, metadados em `app.sqlite` e bytes em `media/` dentro do workspace nativo.
- **Q**: O conteúdo da nota deve guardar path físico? → **A**: Não. Guarda somente um identificador estável; o bloco resolve por meio do repositório.
- **Q**: Quando o bloco pode ser criado? → **A**: Somente após validação e cópia bem-sucedidas; falha não deixa bloco, referência ou arquivo órfão.
- **Q**: Como tratar exclusão? → **A**: mídia sem referências pode ser apagada manualmente; mídia em uso é bloqueada e lista as notas.
- **Q**: Como tratar ausência após restore ou corrupção? → **A**: preservar o bloco, marcar `missing`/`corrupt`, mostrar placeholder e oferecer retry/reimportação.

#### Dúvidas abertas

- Nenhuma dúvida de produto bloqueia o Draft. Os detalhes de schema, commands Tauri e versão de migration estão definidos como contratos internos abaixo e serão confirmados por testes na fase de tarefas.

### 3. Escopo e atores

#### Incluído

- Upload local de imagens, vídeos e áudios pelos caminhos já oferecidos pelo Edra.
- Validação por tipo/formato e tamanho antes de qualquer alteração na nota.
- Formatos: PNG, JPEG, WebP e GIF; MP4 e WebM; MP3, M4A e OGG.
- Limites: 10 MB por imagem, 50 MB por áudio e 200 MB por vídeo.
- Cópia durável, identificador estável, catálogo, vínculos com notas/blocos e resolução por ID.
- Inventário em Configurações > Uso e armazenamento, filtros, consulta de uso e exclusão de mídias sem referências.
- Placeholder acessível, estados `missing`/`corrupt`, retry/reimportação e inclusão em backup/restauração local.
- Testes de unidade, integração/contrato e navegador para os cenários críticos.

#### Fora de escopo

- Sincronização entre dispositivos, upload remoto, CDN, transcodificação, compressão automática e thumbnails obrigatórias.
- Limpeza automática, renomear/substituir/excluir em lote e redesign do editor fora dos estados de mídia.
- Uso de `.openbible` como backend operacional ou criação de API pública/serviço externo.

#### Atores

- **Pessoa do workspace**: insere mídia, consulta o inventário, visualiza usos, exclui sem uso e reimporta mídia ausente.
- **Editor Edra**: solicita validação/cópia, guarda a referência e renderiza estados disponíveis ou indisponíveis.
- **Storage do workspace**: fornece leitura, escrita, exclusão e listagem dentro do workspace atual.
- **Backup/restauração**: exporta e restaura catálogo, bytes e referências tolerando ausência parcial.

### 4. Princípios e restrições do projeto

- **PR-001**: backend operacional por runtime: IndexedDB no PWA e `app.sqlite` + `media/` no workspace Tauri.
- **PR-002**: conteúdo da nota guarda `mediaId` e metadados mínimos, nunca path absoluto, URL `blob:` ou localização física.
- **PR-003**: validação, cópia e registro de catálogo precedem a inserção do bloco; falhas são atômicas para a pessoa.
- **PR-004**: `unused` é condição derivada de zero referências; não há limpeza automática.
- **PR-005**: operações nativas respeitam a fronteira de path e rejeitam path controlado pelo conteúdo da nota.
- **PR-006**: recurso local/offline-first; não cria rede, sincronização implícita ou telemetria de conteúdo.
- **PR-007**: backup e restore incluem bytes e metadados, com restauração parcial tolerante à ausência.
- **PR-008**: loading, progresso, quota, permissão, ausência e corrupção são visíveis e acessíveis.

### 5. Histórias de usuário

#### US-001 — Inserir e reabrir mídias offline (P1)

Como pessoa do workspace, quero inserir imagens, vídeos e áudios no Edra e reabrir a nota offline, para não depender de uma URL transitória.

**Por que P1**: é o valor principal da correção e habilita o inventário.
**Teste independente**: upload válido em fixture PWA e Tauri, recarga/reabertura sem rede e resolução pelo mesmo `mediaId`.
**Requisitos**: FR-001, FR-002, FR-006, NFR-001, NFR-002.

#### US-002 — Inspecionar e limpar o inventário (P1)

Como pessoa do workspace, quero consultar as mídias usadas e remover somente as que não têm referências, para controlar o armazenamento sem quebrar conteúdo.

**Por que P1**: torna a persistência administrável e evita exclusão acidental.
**Teste independente**: abrir Uso e armazenamento, filtrar, consultar usos, apagar sem uso e tentar apagar mídia em uso.
**Requisitos**: FR-003, FR-004, NFR-001, NFR-003.

#### US-003 — Recuperar mídias ausentes e restaurar backups (P1)

Como pessoa do workspace, quero abrir notas mesmo quando uma mídia estiver ausente e reimportá-la ou restaurar um backup, para não perder a estrutura da nota.

**Por que P1**: ausência parcial é possível em migração/restauração e não pode bloquear a nota.
**Teste independente**: omitir bytes, abrir a nota, reimportar e executar backup/restore completo e parcial.
**Requisitos**: FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003.

### 6. Cenários BDD de aceite

#### AC-001 — Upload de imagem válido cria uma referência durável

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: Upload durável de mídia no Edra

  Scenario: Inserir imagem válida no editor
    Given uma nota aberta no Edra e um arquivo PNG de 2 MB selecionado
    When a pessoa confirma o upload
    Then o arquivo é validado e copiado para o backend do workspace
    And o bloco guarda um mediaId estável em vez de uma URL blob
    And a imagem é renderizada após recarregar o editor offline
```

#### AC-002 — Upload de áudio e vídeo válidos sobrevive à reabertura

**Cobre**: US-001, FR-001, FR-002, FR-006, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-006 @NFR-002 @AC-002
Feature: Reabertura offline de mídias

  Scenario Outline: Reabrir mídia válida após reiniciar o runtime
    Given uma nota com um arquivo <formato> aceito já persistido
    When a pessoa fecha e reabre o PWA ou o aplicativo Tauri sem rede
    Then o bloco resolve o mesmo mediaId no backend local
    And o player <tipo> fica disponível

    Examples:
      | formato | tipo  |
      | MP4     | vídeo |
      | MP3     | áudio |
```

#### AC-003 — Arquivo inválido ou acima do limite não cria bloco

**Cobre**: US-001, FR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @NFR-002 @NFR-003 @AC-003
Feature: Rejeição segura de upload

  Scenario: Rejeitar formato não permitido ou tamanho excedido
    Given uma nota aberta e um arquivo inválido ou acima do limite da categoria
    When a pessoa tenta inseri-lo no Edra
    Then o editor mostra o motivo em uma notificação acessível
    And nenhum bloco novo é inserido
    And nenhuma referência ou byte parcial permanece
```

#### AC-004 — Falha de quota ou permissão oferece retry limpo

**Cobre**: US-001, FR-001, FR-002, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-002 @NFR-003 @AC-004
Feature: Recuperação de falha de persistência

  Scenario: A cópia é interrompida por quota ou permissão
    Given um arquivo válido e um backend que falha durante a cópia
    When a pessoa tenta inserir a mídia
    Then o editor informa que a mídia não foi salva
    And o estado parcial é removido sem bloco quebrado ou mídia órfã
    And a pessoa pode tentar novamente
```

#### AC-005 — Inventário mostra os metadados essenciais

**Cobre**: US-002, FR-003, NFR-003

```gherkin
@US-002 @FR-003 @NFR-003 @AC-005
Feature: Inventário de mídias

  Scenario: Consultar mídias usadas nas notas
    Given um workspace com imagens, vídeos e áudios persistidos
    When a pessoa abre Configurações e seleciona Uso e armazenamento
    Then a lista mostra tipo, nome original, formato, tamanho, quantidade de notas e última utilização
    And a lista não carrega os bytes completos
```

#### AC-006 — Filtros e usos refletem o catálogo

**Cobre**: US-002, FR-003, NFR-003

```gherkin
@US-002 @FR-003 @NFR-003 @AC-006
Feature: Consulta filtrada de mídias

  Scenario: Filtrar por tipo e consultar notas relacionadas
    Given o inventário contém mídias de mais de um tipo e notas diferentes
    When a pessoa filtra por áudio e abre os usos de uma mídia
    Then somente os áudios aparecem
    And o painel lista cada nota e o bloco que referencia o mediaId
    And limpar o filtro restaura o inventário completo
```

#### AC-007 — Mídia sem uso pode ser removida manualmente

**Cobre**: US-002, FR-003, FR-004, NFR-001, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @NFR-001 @NFR-002 @AC-007
Feature: Remoção segura de mídia sem uso

  Scenario: Excluir uma mídia sem referências
    Given uma mídia válida que não é referenciada por nenhuma nota
    When a pessoa confirma a exclusão no inventário
    Then o sistema remove seus bytes e metadados do workspace atual
    And a mídia deixa de aparecer no inventário
    And uma consulta posterior não encontra o mediaId removido
```

#### AC-008 — Mídia em uso não pode ser apagada

**Cobre**: US-002, FR-004, NFR-001, NFR-003

```gherkin
@US-002 @FR-004 @NFR-001 @NFR-003 @AC-008
Feature: Proteção de mídia referenciada

  Scenario: Bloquear exclusão de mídia usada
    Given uma mídia referenciada por duas notas
    When a pessoa tenta excluí-la no inventário
    Then a exclusão é bloqueada antes de remover bytes ou metadados
    And a interface informa que a mídia está em uso
    And lista as duas notas relacionadas
```

#### AC-009 — Mídia ausente não impede a abertura da nota

**Cobre**: US-003, FR-004, NFR-003

```gherkin
@US-003 @FR-004 @NFR-003 @AC-009
Feature: Placeholder para mídia ausente

  Scenario: Abrir uma nota cujo arquivo não está disponível
    Given uma nota com uma referência marcada como missing
    When a pessoa abre a nota
    Then o editor abre normalmente e mantém o bloco no mesmo local
    And o bloco mostra placeholder acessível com nome e motivo
    And existe ação para tentar recuperar ou reimportar
```

#### AC-010 — Reimportação recupera o bloco existente

**Cobre**: US-003, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-004 @NFR-002 @NFR-003 @AC-010
Feature: Reimportação de mídia

  Scenario: Reimportar arquivo compatível para uma referência ausente
    Given um bloco missing e um arquivo local com formato e tamanho válidos
    When a pessoa usa Reimportar e confirma o arquivo
    Then os bytes são copiados para o backend
    And o mesmo bloco passa a resolver seu mediaId
    And a nota não ganha segundo bloco ou referência duplicada
```

#### AC-011 — Backup inclui catálogo e bytes

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-011
Feature: Backup de mídias locais

  Scenario: Exportar workspace com mídias
    Given um workspace com notas, catálogo, referências e bytes de mídia
    When a pessoa executa o backup local
    Then o manifesto inclui metadados e hashes das mídias
    And o arquivo inclui os bytes dentro do limite do contrato
    And os blocos continuam apontando para os mesmos mediaIds
```

#### AC-012 — Restore completo reconstitui as mídias

**Cobre**: US-003, FR-005, FR-006, NFR-002

```gherkin
@US-003 @FR-005 @FR-006 @NFR-002 @AC-012
Feature: Restauração de mídias

  Scenario: Restaurar backup completo em outro workspace local
    Given um backup válido com catálogo, bytes e notas que referenciam mídias
    When a pessoa restaura o backup pelo fluxo existente
    Then catálogo e bytes são gravados no backend de destino
    And abrir as notas resolve cada mediaId restaurado
    And hashes e tamanhos correspondem ao manifesto
```

#### AC-013 — PWA usa o backend IndexedDB

**Cobre**: US-001, FR-002, FR-006, NFR-001, NFR-002

```gherkin
@US-001 @FR-002 @FR-006 @NFR-001 @NFR-002 @AC-013
Feature: Persistência de mídia no PWA

  Scenario: Persistir e resolver mídia no workspace web
    Given o runtime do PWA com um workspace IndexedDB aberto
    When a pessoa conclui um upload válido
    Then os bytes são gravados no armazenamento de blobs
    And os metadados são gravados no catálogo IndexedDB
    And desligar a rede não impede a resolução posterior
```

#### AC-014 — Tauri usa SQLite e pasta confinada

**Cobre**: US-001, FR-002, FR-006, NFR-001, NFR-002

```gherkin
@US-001 @FR-002 @FR-006 @NFR-001 @NFR-002 @AC-014
Feature: Persistência de mídia no desktop

  Scenario: Persistir e resolver mídia no workspace Tauri
    Given o runtime Tauri com um workspace nativo aberto
    When a pessoa conclui um upload válido
    Then os metadados são persistidos no app.sqlite
    And os bytes são gravados na pasta media confinada ao workspace
    And path absoluto ou path fora do workspace é rejeitado
```

#### AC-015 — A solução não cria sincronização remota

**Cobre**: US-003, FR-005, FR-006, NFR-001

```gherkin
@US-003 @FR-005 @FR-006 @NFR-001 @AC-015
Feature: Limite local da persistência de mídia

  Scenario: Operar sem serviço remoto
    Given um workspace local com uma mídia válida
    When a pessoa insere, consulta, restaura ou reimporta a mídia
    Then todas as operações usam o backend local
    And nenhuma requisição de upload ou leitura remota é criada
    And a interface não promete sincronização entre dispositivos
```

#### AC-016 — Inventário é utilizável em teclado e tela pequena

**Cobre**: US-002, FR-003, FR-004, NFR-003

```gherkin
@US-002 @FR-003 @FR-004 @NFR-003 @AC-016
Feature: Acessibilidade do gerenciamento de mídias

  Scenario: Navegar pelo inventário sem mouse
    Given a tela Uso e armazenamento aberta em desktop ou mobile
    When a pessoa navega por teclado pelos filtros, usos e ações
    Then o foco permanece visível e a ordem de leitura é coerente
    And mudanças, erros e confirmações são anunciados sem depender apenas de cor
    And não há overflow horizontal que esconda a ação principal
```

#### AC-017 — Progresso e limites são informados durante o upload

**Cobre**: US-001, FR-001, FR-002, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-002 @NFR-003 @AC-017
Feature: Feedback de upload

  Scenario: Mostrar progresso e resultado de uma cópia longa
    Given um vídeo válido dentro do limite selecionado no Edra
    When a cópia assíncrona está em andamento
    Then a interface informa que a mídia está sendo salva e não duplica a ação
    And ao concluir informa sucesso e insere o bloco resolvível
    And ao exceder quota informa a falha e disponibiliza retry
```

#### AC-018 — Corrupção é detectada sem travar a nota

**Cobre**: US-003, FR-002, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-002 @FR-004 @NFR-002 @NFR-003 @AC-018
Feature: Detecção de mídia corrompida

  Scenario: Hash ou tipo do blob não corresponde ao catálogo
    Given uma referência cujo blob falha na verificação de integridade
    When a pessoa abre a nota ou o inventário verifica a mídia
    Then o asset é marcado como corrupt
    And a nota abre com placeholder acessível no lugar do player
    And a pessoa pode reimportar um arquivo válido sem perder o bloco
```

### 7. Requisitos

#### Funcionais

- **FR-001**: aceitar PNG/JPEG/WebP/GIF para imagens, MP4/WebM para vídeos e MP3/M4A/OGG para áudios, respeitando 10 MB, 200 MB e 50 MB; validar antes de alterar a nota.
- **FR-002**: copiar, catalogar e resolver bytes por `mediaId`, inserir a referência no bloco somente após commit e atualizar `lastUsedAt` quando usada.
- **FR-003**: manter catálogo por workspace com nome, tipo, formato, tamanho, importação, última utilização, estado e vínculos; inventário filtra por tipo e mostra contagem de notas.
- **FR-004**: permitir exclusão apenas sem referências, bloquear exclusão em uso com notas relacionadas e representar `missing`/`corrupt` com placeholder e reimportação.
- **FR-005**: incluir catálogo, referências, hashes e bytes disponíveis em backup e restaurá-los pelo fluxo local, mantendo referências como `missing` quando parcial.
- **FR-006**: usar IndexedDB no PWA e Tauri com metadados em `app.sqlite` e bytes em `media/`, dentro do workspace, sem `.openbible` ou rede.

#### Não funcionais

- **NFR-001**: segurança/privacidade: nenhum path absoluto ou path de conteúdo escapa do workspace; não há upload remoto. **Verificação**: testes de boundary, inspeção de commands e teste de ausência de rede.
- **NFR-002**: durabilidade/desempenho: listagem carrega apenas metadados; bytes são assíncronos, respeitam limites, limpam falha e verificam hash/tamanho no restore. **Verificação**: testes offline, quota, integridade e roundtrip.
- **NFR-003**: acessibilidade/responsividade: foco, teclado, leitura sem cor, erros, progresso e placeholder funcionam em desktop/mobile, claro/escuro, zoom e `prefers-reduced-motion`, sem overflow. **Verificação**: Playwright, inspeção de estados e revisão manual.

#### Erros e casos-limite

- Formato/tamanho inválido → Sonner com motivo e nenhum bloco novo.
- Quota, permissão, interrupção ou workspace indisponível → limpar staging, manter editor intacto e oferecer retry quando recuperável.
- Upload repetido → cada ação pode criar novo `mediaId`; deduplicação fica fora do MVP.
- Mídia ausente/corrompida → manter referência, marcar estado, placeholder e reimportação.
- Exclusão em uso → bloquear antes da remoção, listar notas/blocos e preservar asset.
- Backup sem arquivo → restaurar catálogo/referências como `missing`, sem impedir abertura.
- Hash/tamanho/tipo inconsistente → rejeitar blob, marcar `corrupt` e reportar no restore.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Monorepo SvelteKit/Svelte 5/TypeScript/Vite com Tailwind e shadcn-svelte; testes usam Vitest, browser Vitest e Playwright.
- Edra em `apps/web/src/lib/edra/`, com `openbible-editor.ts` preparado para `onFileUpload` assíncrono.
- `WorkspaceStorage` seleciona IndexedDB no PWA e SQLite no Tauri; adaptador web já suporta `Blob`.
- Tauri possui commands de workspace com validação de path e migrations; frontend não deve escrever filesystem diretamente.
- Configurações já possui `Uso e armazenamento` em `ConfigPage.svelte`/`WorkspaceSettings.svelte`.

#### Arquitetura e módulos

- Criar `apps/web/src/lib/features/notes/media/` com tipos, validação, `mediaId`, catálogo, referências, estados, serviço de upload e resolução.
- `stageMediaUpload` valida; `commitMediaUpload` grava bytes/metadados; `resolveMedia` materializa leitura local; `reimportMedia` troca bytes do mesmo ID.
- Conteúdo da nota guarda referência Edra `openbible-media` com `mediaId`, `mediaType` e `originalName`; resolver ignora path/URL persistido.
- `openbible-editor.ts` recebe o serviço por `onFileUpload`; renderização chama resolver, nunca filesystem diretamente.
- `listMediaInventory`, `findMediaUsages` e `deleteUnusedMedia` são casos de uso separados; exclusão consulta referências antes de apagar.
- Sonner cuida do feedback transitório; estado persistente `missing/corrupt` fica no bloco e inventário.

#### Migrations

- IndexedDB: incrementar a versão, criar stores/indexes `media_assets` e `media_references`, preservando notes/blobs existentes.
- Tauri: migration incremental no `app.sqlite` para catálogo/referências, com índices por workspace, tipo, estado e nota.
- Bytes nativos: criar `media/` sob o diretório do workspace; nome físico deriva do `mediaId`, nunca do nome original.
- Commit usa staging: escreve/verifica bytes antes do registro disponível; falha limpa staging/metadados incompletos.
- Rollback é aditivo: não remove notas; referências sem bytes resolvem como `missing`.
- Manifesto de backup acrescenta `role: media` e mantém versões antigas restauráveis sem mídia.

#### Models

- `MediaAsset`: `workspaceId`, `mediaId`, `originalName`, `mediaType`, `format`, `byteSize`, `importedAt`, `lastUsedAt`, `state`, `sha256`, `storageKey`.
- `MediaReference`: `workspaceId`, `mediaId`, `noteId`, `blockId`, `createdAt`, `lastSeenAt`; chave lógica `(workspaceId,noteId,blockId)`.
- `MediaBlob`: payload em Blob IndexedDB ou arquivo Tauri `media/<mediaId>`; hash/tamanho conferidos contra `MediaAsset`.
- Invariantes: ID único no workspace, tamanho dentro do limite, `available` exige payload, referência não atravessa workspace e exclusão exige zero referências.

#### Controllers e casos de uso

- `stageMediaUpload(file, context)`: retorna staging ou erro sem mutar a nota.
- `commitMediaUpload(staged, noteId, blockId)`: grava bytes, catálogo e referência de modo idempotente.
- `resolveMedia(mediaId)`: valida workspace, estado e integridade e devolve handle/stream local.
- `listMediaInventory(filter)`: metadados, uso derivado, contagem e última utilização.
- `findMediaUsages(mediaId)`: notas e blocos relacionados.
- `deleteUnusedMedia(mediaId)`: exige zero referências, remove bytes/metadados e retorna relatório.
- `reimportMedia(mediaId, file)`: valida/troca payload do mesmo asset e preserva referências.
- Commands Tauri são tipados e não devolvem path absoluto ao frontend.

#### Views e experiência

- `MediaPlaceHolder.svelte` e `MediaExtended.svelte` suportam available, progresso, erro, `missing` e `corrupt`, com retry/reimportação.
- `ConfigPage.svelte` mantém navegação e `WorkspaceSettings.svelte` compõe `MediaInventory.svelte` em `Uso e armazenamento`.
- `MediaInventory.svelte` exibe lista responsiva de metadados, filtros, usos, confirmação e Sonner.
- Estados: carregando, vazio, sem resultados, erro, quota/permissão, exclusão bloqueada/concluída e restore parcial.

#### Queries e repositórios

- `MediaRepository`: `putAsset`, `putBlob`, `readBlob`, `listAssets`, `listReferences`, `deleteUnused`, `markState`, `replaceBlob`.
- IndexedDB usa stores/indexes da migration e `Blob`; operações que cruzam catálogo/blob usam staging e limpeza.
- Tauri usa SQLite para metadados e commands para bytes sob `media/`; backend valida `storageKey`.
- `listAssets` retorna metadados sem `readBlob`; índices mínimos cobrem workspace/ID, tipo, estado e nota.

#### Jobs e processamento assíncrono

- Não há job remoto/worker permanente. Upload, hash, restore e reimportação são operações locais assíncronas com progresso e retry.
- Staging é idempotente; repetir retry não duplica bloco ou referência do mesmo `blockId`.

#### Estrutura de arquivos

```text
specs/draft/0022-armazenamento-gerenciamento-midias-editor-edra/
  spec.md
apps/web/src/lib/features/notes/media/
  media-types.ts
  media-validation.ts
  media-repository.ts
  media-service.ts
apps/web/src/lib/features/config/
  MediaInventory.svelte
  MediaUsagePanel.svelte
apps/web/src/lib/storage/backup/
  backup-enumerator.ts
  backup-archive.ts
  backup-restore.ts
apps/desktop/src-tauri/src/
  commands/workspace.rs
  database.rs
  migrations/<nova-migration>.sql
tests/browser/
  media-editor.spec.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `MediaAsset` | `(workspaceId, mediaId)` | nome, tipo, formato, bytes, datas, hash, storage key e estado; ID opaco | 1 asset tem 0..N referências |
| `MediaReference` | `(workspaceId, noteId, blockId)` | `mediaId`, criação e última observação; mesmo workspace | N referências apontam para 1 asset |
| `MediaBlob` | `storageKey` interno | Blob web ou arquivo Tauri; não expõe path ao conteúdo | 0..1 payload por asset disponível |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Upload | `pending` | cópia/validação concluídas | `available` | não aparece antes do commit |
| Asset | `available` | último vínculo removido | `available` + uso derivado `unused` | não apagar automaticamente |
| Asset | `available` | bytes ausentes | `missing` | bloco e referência permanecem |
| Asset | `available` | hash/tipo inválido | `corrupt` | bytes não reproduzidos |
| Asset | `missing`/`corrupt` | reimportação válida | `available` | referências preservadas |
| Asset | `available` sem referências | exclusão confirmada | ausente | bytes/metadados removidos juntos |

#### Migração e retenção

- Migração aditiva cria stores/tabelas/índices sem reescrever notas existentes.
- Blocos sem catálogo/bytes não são apagados; o resolver marca `missing` e permite reimportação.
- Mídia sem uso permanece até exclusão manual. Backup inclui disponíveis e registra missing/corrupt no manifesto.
- Retenção é local ao workspace; não há `.openbible`, cache remoto ou limpeza automática.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Afeta upload no Edra, estados dos blocos e inventário em Configurações > Uso e armazenamento.

#### Stack e convenções de interface

- SvelteKit/Svelte 5, TypeScript, Tailwind e shadcn-svelte local; preservar `ConfigPage.svelte` e `WorkspaceSettings.svelte`.
- Manter componentes de mídia Edra e o contrato de upload, sem segunda experiência de editor.
- Notificações e erros usam Sonner, com mensagem curta e retry/reimportação quando possível.
- Testes usam browser Vitest/Playwright; validar claro/escuro, mobile/desktop, zoom, teclado e reduced motion.

#### Telas e responsabilidades

- **Editor `/notes/[id]`**: upload, progresso, resultado e interação com available/missing/corrupt. Entrada: `File`; saída: bloco com ID ou erro.
- **Config `/config`, Uso e armazenamento**: inventário, filtros, usos e exclusão segura.
- **Backup/restauração existente**: sem nova rota; inclui/relata mídia, hash, ausência e restauração parcial.

#### Fluxo de informação e navegação

- Editor: abrir nota → upload → validar → copiar → catalogar/referenciar → inserir bloco → resolver; erro retorna ao estado anterior com Sonner.
- Inventário: Configurações → Uso e armazenamento → filtrar → usos → nota relacionada ou confirmação de exclusão sem uso.
- Recuperação: placeholder → retry/reimportar → validar/copiar → resolver o mesmo bloco.
- Breadcrumb da configuração: `OpenBible / Configurações / Uso e armazenamento`; editor preserva breadcrumb existente de notas.

#### Menus e navegação principal

- Manter `Configurações` no menu; `Uso e armazenamento` continua dentro de `ConfigPage`, inclusive no fluxo mobile.
- Não criar item global de mídias; usos abrem a nota no fluxo existente e reimportação é contextual.

#### Formulários e ações

- Upload usa seletor/drop/paste já oferecido pelo Edra, um arquivo por ação, com formato/limite por categoria.
- Cópia mostra progresso, impede duplicação e não bloqueia edição fora do bloco em operação.
- Inventário filtra tipo/estado/uso e não carrega bytes.
- Exclusão exige confirmação quando sem uso; em uso oferece consulta de referências.
- Reimportação é contextual, preserva `mediaId` e não altera bloco se falhar.

#### Composição e disposição

- Usar superfície contínua existente de Configurações, título/descrição, resumo e inventário; sem cards decorativos ou gradientes.
- Desktop usa lista com colunas; mobile empilha metadados e ações sem overflow horizontal.
- Detalhe de uso pode ser painel/modal shadcn-svelte com retorno e foco preservados.
- Seguir `DESIGNSYSTEM.MD`/`INTERFACE.md`: Geist, contraste monocromático, bordas e foco visível.

#### Blocos React e componentes selecionados

React não é usado; esta subseção é preenchida com componentes Svelte equivalentes.

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Editor | Não aplicável — bloco Svelte | Upload, progresso e recuperação | `apps/web/src/lib/edra/shadcn/components/MediaPlaceHolder.svelte`, `MediaExtended.svelte` | Edra + serviço de mídia + Toaster/Sonner | Local/Edra | Estende estados existentes |
| Uso e armazenamento | Não aplicável — inventário Svelte | Filtrar/listar/executar ações | `apps/web/src/lib/features/config/MediaInventory.svelte` | `ConfigPage` + `WorkspaceSettings` + lista + Select/Dialog | shadcn-svelte/local | Novo bloco na seção existente |
| Uso da mídia | Não aplicável — detalhe Svelte | Notas e blocos relacionados | `apps/web/src/lib/features/config/MediaUsagePanel.svelte` | Painel/modal acessível com links | shadcn-svelte/local | Novo detalhe contextual |

Nenhum React, ReUI ou DataGrid React será introduzido. Novos componentes devem ser registrados em `INTERFACE.md`.

#### Estados e acessibilidade

- Loading anuncia leitura; upload mostra progresso e limita duplicação.
- Vazio explica ausência de mídias ou filtro sem resultados.
- Erro usa Sonner e ação; `missing/corrupt` permanece no bloco/inventário.
- Sucesso atualiza a região sem perder foco; quota/permissão não mostra stack trace.
- Foco, teclado, Escape, Enter/Espaço, `aria-live`, nomes, tipo, tamanho e status devem ser claros; cor não é sinal único.
- Validar desktop/mobile, zoom, claro/escuro, `prefers-reduced-motion` e ausência de overflow.
- Breadcrumb mantém `OpenBible` e `Configurações` como links e a seção atual como página.

#### Contrato CRUD

- Não é CRUD completo: `list` inventário, `read` usos, `delete` condicionado a zero referências e `replace` somente por reimportação.
- A superfície reutiliza o `PageHeader` da seção de Configurações; `DataGrid` React não se aplica à stack Svelte, portanto a lista usa composição semântica responsiva equivalente.
- O `mediaId` permanece disponível como coluna/detalhe técnico identificável; não há ação de editar, e a ação de apagar só aparece para mídia sem referências, com controle independente e confirmação.
- Nome, tipo, tamanho, estado, uso e última utilização ficam visíveis; ID pode aparecer nos detalhes técnicos.
- Ações de usos, abrir nota e excluir são controles independentes; não transformar linha inteira em ação ambígua.
- Reusar cabeçalho/superfícies de Configurações e documentar composição em `INTERFACE.md`.

#### Revisão visual durante o desenvolvimento

- Revisar desktop/mobile, claro/escuro, lista longa, nome longo, vazio, erro, missing/corrupt e confirmação.
- Registrar viewport, foco, bordas, espaçamentos, margens, padding, tipografia, overflow e ajustes; tarefas sem interface anotam `Não aplicável`.

#### APIs expostas

- `MediaRepository` e serviços são APIs internas TypeScript, escopadas ao workspace.
- Commands Tauri tipados não aceitam path físico arbitrário nem devolvem raiz absoluta.
- Não há rota HTTP pública ou autenticação adicional.

#### APIs externas utilizadas

- Nenhuma. Usa IndexedDB, filesystem protegido pelo Tauri, SQLite local e Sonner já presente.

#### Documentação das APIs consultadas

- Fontes locais da seção 2: `WorkspaceStorage`, adapter IndexedDB, commands/migrations Tauri, backup contract, Edra e configuração. Nenhuma API externa foi consultada.

#### Eventos e outros contratos

- `media:committed`: após bytes/catalogação/referência; consumidor é o editor.
- `media:state-changed`: após resolve, restore ou reimportação; consumidores são bloco e inventário.
- Manifesto recebe `role=media`, `mediaId`, storage key lógico, tipo, tamanho, hash e estado; bytes entram no archive.
- Sem sincronização ou cliente remoto.

### 11. Estratégia TDD

- **Unidade**: MIME/extensão/limite, ID, storage key, estados, referências, exclusão e serialização Edra.
- **Integração/contrato**: IndexedDB migration, repositório Tauri, commands/path, staging/limpeza e backup/restore/hash.
- **BDD/aceite**: AC-001–AC-018 orientam casos focais com marcador `SPECSFY: AC-xxx` e rastreio US/FR/NFR.
- **Runner TDD**: Bun/Vitest existente para unidade/integração; browser Vitest/Playwright para editor, configuração, teclado e offline.
- **E2E**: upload por família, rejeição, reload offline, inventário/filtros, exclusão, missing/reimportação e restore completo/parcial.
- **Verificação manual**: somente revisão visual e permissionamento que o runner não simula; registrar viewport/estado/resultado.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, AC-001 | AC-001 | `apps/web/src/lib/features/notes/media/media-service.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001` | Falha histórica observada: retorno `blob:transient-upload` não atendia `^media:` | `bun run test:tdd -- src/lib/features/notes/media/media-service.test.ts` — 4 testes passaram; upload grava byte/catálogo e retorna `media:<id>` | Serviço separa validação, cópia e referência; contrato nativo também é coberto |
| US-001, FR-001, FR-002, FR-006, AC-002 | AC-002 | `media-repository.test.ts`, marcador `SPECSFY: AC-002` | Pending | Pending | Pending |
| US-001, FR-001, AC-003 | AC-003 | `media-validation.test.ts`, marcador `SPECSFY: AC-003` | RED ainda não registrado separadamente | Suíte focal de mídia — 11 testes passaram; formato e limite rejeitados | Mensagens e categorias de validação separadas |
| US-002, FR-003, FR-004, AC-005–AC-008 | AC-005–AC-008 | `media-inventory.test.ts`, marcadores correspondentes | RED ainda não registrado separadamente | Suíte focal de mídia — 11 testes passaram; filtro, uso, mídia sem uso e bloqueio de exclusão cobertos | Inventário Svelte usa o mesmo serviço e estados textuais |
| US-003, FR-004, FR-005, AC-009–AC-012 | AC-009–AC-012 | `media-runtime.test.ts`, `backup-media.test.ts` e browser, marcadores correspondentes | RED ainda não registrado separadamente | Runtime e backup focal passaram; placeholder missing e manifesto `role=media` cobertos, inclusive catálogo nativo materializado | Reimportação invalida Object URL e dispara atualização do bloco |
| US-001/003, FR-006, NFR-001, AC-013–AC-018 | AC-013–AC-018 | adapters, Tauri boundary e `tests/browser/media-editor.spec.ts` | Pending | Native SQLite migration/catalog parcial GREEN; PWA reabertura, restore e browser ainda Pending | Migration 004 e backup nativo foram materializados; fronteiras restantes ainda abertas |

Casos TDD mínimos planejados para manter três verificações executáveis por agrupamento:

| Agrupamento | Caso 1 | Caso 2 | Caso 3 |
| --- | --- | --- | --- |
| US-001 | upload de imagem válida (`AC-001`) | reabertura de áudio/vídeo (`AC-002`) | rejeição/limpeza (`AC-003`/`AC-004`) |
| US-002 | metadados e filtro (`AC-005`/`AC-006`) | exclusão sem uso (`AC-007`) | bloqueio em uso e teclado (`AC-008`/`AC-016`) |
| US-003 | placeholder missing/reimportação (`AC-009`/`AC-010`) | backup/restore completo (`AC-011`/`AC-012`) | corrupção e restore parcial (`AC-018`) |
| FR-001 | formato aceito (`AC-001`) | áudio/vídeo aceitos (`AC-002`) | formato/limite rejeitado (`AC-003`) |
| FR-002 | commit e resolve (`AC-001`) | falha sem órfão (`AC-004`) | reimportação do mesmo bloco (`AC-010`) |
| FR-003 | inventário (`AC-005`) | filtro/uso (`AC-006`) | exclusão sem uso (`AC-007`) |
| FR-004 | exclusão em uso (`AC-008`) | missing (`AC-009`) | corrupt (`AC-018`) |
| FR-005 | manifesto/bytes (`AC-011`) | restore completo (`AC-012`) | limite local sem remoto (`AC-015`) |
| FR-006 | resolver IndexedDB (`AC-013`) | boundary Tauri (`AC-014`) | restore local (`AC-012`) |
| NFR-001 | ID sem path (`AC-001`) | isolamento de exclusão (`AC-007`) | boundary/no rede (`AC-014`/`AC-015`) |
| NFR-002 | reabertura offline (`AC-002`) | falha/quota (`AC-004`) | integridade/restore (`AC-012`/`AC-018`) |
| NFR-003 | rejeição anunciada (`AC-003`) | inventário acessível (`AC-016`) | placeholder/progresso (`AC-009`/`AC-017`) |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003, AC-017 | Unidade/browser | `media-validation.test.ts`/`media-service.test.ts`, Vitest focal | RED registrado em AC-001; demais Pending |
| FR-002 | AC-001, AC-002, AC-004, AC-010, AC-017, AC-018 | Integração/browser | `media-service.test.ts`, `media-editor.spec.ts` | Pending |
| FR-003 | AC-005, AC-006, AC-007, AC-016 | Integração/browser | `media-inventory.test.ts`, `media-inventory.spec.ts` | Pending |
| FR-004 | AC-007, AC-008, AC-009, AC-010, AC-018 | Unidade/browser | `media-references.test.ts`, `media-editor.spec.ts` | Pending |
| FR-005 | AC-011, AC-012, AC-015 | Integração | `backup-media.test.ts` | Pending |
| FR-006 | AC-002, AC-013, AC-014, AC-015 | Contrato/integração | adapter tests, Tauri tests, `cargo test` focal | Pending |
| NFR-001 | AC-001, AC-007, AC-008, AC-013–AC-015 | Segurança/contrato | path boundary e isolamento por workspace | Pending |
| NFR-002 | AC-002–AC-004, AC-007, AC-010–AC-014, AC-017–AC-018 | Unidade/integração | Vitest, integrity, Tauri/IndexedDB fixtures | Pending |
| NFR-003 | AC-003, AC-004, AC-005, AC-006, AC-008–AC-010, AC-016–AC-018 | Browser/manual | Playwright/browser Vitest e revisão visual | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-10
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0022-armazenamento-gerenciamento-midias-editor-edra/spec.md --allow-draft`
- **Achados**: Nenhum BLOCKER. A validação estrutural retornou `VALID DRAFT`; a revisão semântica confirmou problema, escopo, decisões, contratos, AC, rastreabilidade e tarefas. A cobertura mínima de três AC distintos foi demonstrada para a feature, as três US, os seis FR e os três NFR.
- Findings especializados seguem `FIND-PROD|ARCH|SEC-NNN`, severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0022-armazenamento-gerenciamento-midias-editor-edra/spec.md --allow-draft`
- **Achados**: Estrutura válida: 30 tarefas, 19 predecessores TDD detectados, 30 IDs cobertos e interface nas tarefas aprovada. T001/AC-001 tem RED observado em `media-service.test.ts`; o gate permanece Pending até materializar e observar RED dos demais predecessores TDD antes de liberar implementação.

Implementação incremental iniciada por solicitação explícita da pessoa responsável,
mantendo o Plan Gate Pending até que os REDs planejados e as fronteiras PWA/Tauri
estejam materializados. A implementação efetiva usa `WorkspaceStorage`: o PWA
mantém `media/catalog.json`/`media/<mediaId>.<format>`, enquanto o Tauri usa a
migration SQLite 004 para metadados e `media/<mediaId>.<format>` para bytes. O
backup nativo materializa o catálogo SQLite no archive como `media/catalog.json`;
restore efetivo, migration IndexedDB dedicada e validação browser continuam
pendentes.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/defined/0022-armazenamento-gerenciamento-midias-editor-edra/spec.md .`
- **Achados**: `30/30 IDs cobertos em 201 arquivos de teste`; o comando ainda retorna `GAPS` por marcadores órfãos (`AC-019`–`AC-039`, `FR-007`–`FR-016`, `NFR-004`–`NFR-009`, `US-004`–`US-012`) pertencentes a outras specs já presentes no repositório. A fatia SPEC-0022 mantém o gate Pending porque restore efetivo, migration IndexedDB dedicada e validação browser ainda não foram concluídos; a migration Tauri 004 e o contrato de catálogo nativo já possuem teste focal.

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

- [x] T001 [TEST] [TDD] [US-001] Criar RED do AC-001 para referência estável em `apps/web/src/lib/features/notes/media/media-service.test.ts` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Confirmar limites/formats, `mediaId`, referência Edra e storage key.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador `SPECSFY:` sem criar `.feature`.
  - [x] **VERIFY**: Executar suíte focal e observar RED por retorno de URL blob transitória.
  - [x] **VISUAL**: Não aplicável; tarefa só materializa regra/teste.
  - [x] **EVIDENCE**: Registrar `bun run test:tdd -- src/lib/features/notes/media/media-service.test.ts` com exit 1 na seção 11.
  - [x] **IMPROVE**: Usar a extensão MediaPlaceholder existente com mock mínimo da renderização Svelte para manter o RED focal.

- [ ] T002 [TEST] [TDD] [US-002] Criar RED do AC-005 para metadados do inventário em `apps/web/src/lib/features/config/media-inventory.test.ts` — Refs: US-002, FR-003, NFR-003, AC-005 — Depends: T001
  - [ ] **PREP**: Confirmar cardinalidade, filtros, vazios e bloqueio em uso.
  - [ ] **EXECUTE**: Escrever casos Vitest com marcadores `SPECSFY:` sem carregar bytes completos.
  - [ ] **VERIFY**: Executar suíte e observar RED.
  - [ ] **VISUAL**: Não aplicável; tarefa só define contrato de dados.
  - [ ] **EVIDENCE**: Registrar comando, falhas e cobertura.
  - [ ] **IMPROVE**: Remover expectativas de implementação.

- [ ] T003 [TEST] [TDD] [US-003] Criar RED do AC-009 para placeholder de mídia ausente em `apps/web/src/lib/features/notes/media/media-placeholder.test.ts` — Refs: US-003, FR-004, NFR-003, AC-009 — Depends: T001
  - [ ] **PREP**: Confirmar manifesto, hash, restore parcial e estados.
  - [ ] **EXECUTE**: Escrever testes de integridade e restore com marcadores.
  - [ ] **VERIFY**: Executar suíte focal e observar RED válido.
  - [ ] **VISUAL**: Não aplicável; tarefa cobre persistência e backup.
  - [ ] **EVIDENCE**: Registrar comando, falhas e relação com AC.
  - [ ] **IMPROVE**: Garantir que ausência não vire exclusão silenciosa.

- [ ] T010 [TEST] [TDD] [US-001] Derivar RED do AC-002 para reabertura de áudio e vídeo em `apps/web/src/lib/features/notes/media/media-repository.test.ts` — Refs: US-001, FR-001, FR-002, FR-006, NFR-002, AC-002 — Depends: none
  - [ ] **PREP**: Confirmar formatos de áudio/vídeo e cenário offline.
  - [ ] **EXECUTE**: Escrever o contrato Vitest `SPECSFY: AC-002` sem `.feature`.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de persistência.
  - [ ] **EVIDENCE**: Registrar comando, falha e IDs.
  - [ ] **IMPROVE**: Separar resolução local de URL transitória.

- [ ] T011 [TEST] [TDD] [US-001] Derivar RED do AC-004 para quota, permissão e limpeza em `apps/web/src/lib/features/notes/media/media-service.test.ts` — Refs: US-001, FR-001, FR-002, NFR-002, NFR-003, AC-004 — Depends: none
  - [ ] **PREP**: Confirmar falhas recuperáveis e ausência de órfãos.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-004` com backend que interrompe a cópia.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de serviço.
  - [ ] **EVIDENCE**: Registrar comando, falha e IDs.
  - [ ] **IMPROVE**: Cobrir retry sem mutação da nota.

- [ ] T012 [TEST] [TDD] [US-002] Derivar RED do AC-006 para filtro e uso de mídia em `apps/web/src/lib/features/config/media-inventory.test.ts` — Refs: US-002, FR-003, NFR-003, AC-006 — Depends: T002
  - [ ] **PREP**: Confirmar filtro por tipo e notas relacionadas.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-006` sem carregar blobs.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; contrato de consulta.
  - [ ] **EVIDENCE**: Registrar comando e cobertura.
  - [ ] **IMPROVE**: Garantir limpeza/restauração do filtro.

- [ ] T013 [TEST] [TDD] [US-002] Derivar RED do AC-007 para exclusão de mídia sem uso em `apps/web/src/lib/features/config/media-inventory.test.ts` — Refs: US-002, FR-003, FR-004, NFR-001, NFR-002, AC-007 — Depends: T002
  - [ ] **PREP**: Confirmar cardinalidade zero e remoção de bytes/metadados.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-007` para exclusão explícita.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; regra de repositório.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Evitar limpeza automática implícita.

- [ ] T014 [TEST] [TDD] [US-002] Derivar RED do AC-008 para bloqueio de mídia em uso em `apps/web/src/lib/features/config/media-inventory.test.ts` — Refs: US-002, FR-004, NFR-001, NFR-003, AC-008 — Depends: T002
  - [ ] **PREP**: Confirmar duas notas relacionadas e erro observável.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-008` para recusar a exclusão.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; regra de integridade.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Cobrir consulta das notas sem apagar payload.

- [ ] T015 [TEST] [TDD] [US-003] Derivar RED do AC-010 para reimportação do mesmo bloco em `apps/web/src/lib/features/notes/media/media-service.test.ts` — Refs: US-003, FR-004, NFR-002, NFR-003, AC-010 — Depends: T003
  - [ ] **PREP**: Confirmar preservação de `mediaId`, bloco e referências.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-010` para reimportação válida.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de recuperação.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Garantir que retry não duplique bloco.

- [ ] T016 [TEST] [TDD] [US-003] Derivar RED do AC-011 para manifesto e bytes de mídia no backup em `apps/web/src/lib/storage/backup/backup-media.test.ts` — Refs: US-003, FR-005, NFR-002, AC-011 — Depends: T003
  - [ ] **PREP**: Confirmar role, hash, tamanho e limites do archive.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-011` para exportação completa.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de archive.
  - [ ] **EVIDENCE**: Registrar manifesto esperado, comando e IDs.
  - [ ] **IMPROVE**: Evitar duplicação de bytes no inventário de backup.

- [ ] T017 [TEST] [TDD] [US-003] Derivar RED do AC-012 para roundtrip de restore em `apps/web/src/lib/storage/backup/backup-media.test.ts` — Refs: US-003, FR-005, FR-006, NFR-002, AC-012 — Depends: T003
  - [ ] **PREP**: Confirmar workspace de destino e verificação de hash.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-012` para restore completo.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de restore.
  - [ ] **EVIDENCE**: Registrar comando, hash e IDs.
  - [ ] **IMPROVE**: Diferenciar restore completo de parcial.

- [ ] T018 [TEST] [TDD] [US-001] Derivar RED do AC-013 para persistência IndexedDB em `apps/web/src/lib/storage/indexeddb-workspace-adapter.test.ts` — Refs: US-001, FR-002, FR-006, NFR-001, NFR-002, AC-013 — Depends: T001
  - [ ] **PREP**: Confirmar versão do object store e isolamento por workspace.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-013` para Blob e catálogo PWA.
  - [ ] **VERIFY**: Executar adapter test e observar RED.
  - [ ] **VISUAL**: Não aplicável; contrato IndexedDB.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Cobrir reabertura sem rede.

- [ ] T019 [TEST] [TDD] [US-001] Derivar RED do AC-014 para path boundary Tauri em `apps/desktop/src-tauri/src/commands/workspace.rs` — Refs: US-001, FR-002, FR-006, NFR-001, NFR-002, AC-014 — Depends: T001
  - [ ] **PREP**: Confirmar raiz nativa, storage key e rejeição de path externo.
  - [ ] **EXECUTE**: Escrever teste Rust `SPECSFY: AC-014` para SQLite/media.
  - [ ] **VERIFY**: Executar teste Tauri focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de segurança de filesystem.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Não expor path absoluto no retorno.

- [ ] T020 [TEST] [TDD] [US-003] Derivar RED do AC-015 para ausência de rede em `apps/web/src/lib/features/notes/media/media-service.test.ts` — Refs: US-003, FR-005, FR-006, NFR-001, AC-015 — Depends: T003
  - [ ] **PREP**: Confirmar que o serviço recebe somente adapters locais.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-015` com rede indisponível.
  - [ ] **VERIFY**: Executar teste focal e observar RED se houver chamada remota.
  - [ ] **VISUAL**: Não aplicável; teste de boundary.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Tornar o contrato local explícito.

- [ ] T021 [TEST] [TDD] [US-002] Derivar RED do AC-016 para teclado e mobile em `apps/web/src/lib/features/config/media-inventory.svelte.spec.ts` — Refs: US-002, FR-003, FR-004, NFR-003, AC-016 — Depends: T002
  - [ ] **PREP**: Confirmar foco, aria-live, modal/painel e viewport.
  - [ ] **EXECUTE**: Escrever teste browser `SPECSFY: AC-016` sem depender de cor.
  - [ ] **VERIFY**: Executar browser test e observar RED.
  - [ ] **VISUAL**: Não aplicável; a revisão visual ocorre na tarefa de tela.
  - [ ] **EVIDENCE**: Registrar viewport, comando e IDs.
  - [ ] **IMPROVE**: Cobrir retorno de foco após confirmação.

- [ ] T022 [TEST] [TDD] [US-003] Derivar RED do AC-018 para hash/tipo corrompido em `apps/web/src/lib/storage/backup/backup-media.test.ts` — Refs: US-003, FR-002, FR-004, NFR-002, NFR-003, AC-018 — Depends: T003
  - [ ] **PREP**: Confirmar transição para `corrupt` e placeholder.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-018` para mismatch de integridade.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; teste de integridade.
  - [ ] **EVIDENCE**: Registrar comando e IDs.
  - [ ] **IMPROVE**: Garantir reimportação sem perda do bloco.

- [ ] T029 [TEST] [TDD] [US-001] Derivar RED do AC-003 para formato/limite inválido em `apps/web/src/lib/features/notes/media/media-validation.test.ts` — Refs: US-001, FR-001, NFR-002, NFR-003, AC-003 — Depends: T001
  - [ ] **PREP**: Confirmar formatos aceitos, limites por categoria e mensagem de rejeição.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-003` para arquivo inválido ou excedente.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; validação de domínio.
  - [ ] **EVIDENCE**: Registrar comando, falha e IDs.
  - [ ] **IMPROVE**: Separar erro de formato de erro de quota.

- [ ] T030 [TEST] [TDD] [US-001] Derivar RED do AC-017 para progresso e quota no upload em `apps/web/src/lib/features/notes/media/media-service.test.ts` — Refs: US-001, FR-001, FR-002, NFR-002, NFR-003, AC-017 — Depends: T001
  - [ ] **PREP**: Confirmar estado de progresso, bloqueio de duplicação e retry.
  - [ ] **EXECUTE**: Escrever teste `SPECSFY: AC-017` para cópia longa e quota.
  - [ ] **VERIFY**: Executar teste focal e observar RED.
  - [ ] **VISUAL**: Não aplicável; contrato assíncrono do serviço.
  - [ ] **EVIDENCE**: Registrar comando, falha e IDs.
  - [ ] **IMPROVE**: Garantir que quota não deixe staging disponível.

#### Fase 2 — Persistência e contrato de domínio

- [ ] T004 [CODE] [US-001] Implementar migration IndexedDB versionada, tipos, validação, referências e serviço de staging/commit/resolve em `apps/web/src/lib/features/notes/media/` e `apps/web/src/lib/storage/migration.ts` — Refs: US-001, FR-001, FR-002, FR-006, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-013, AC-017 — Depends: T001, T010, T011, T018, T029, T030
  - [ ] **PREP**: Confirmar RED, `WorkspaceStorage`, versão IndexedDB e Sonner.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar e criar a migration/store, camada comum, staging, limpeza e catálogo sem blobs na listagem.
  - [ ] **VERIFY**: Executar unidade, adapter e reabertura offline PWA.
  - [ ] **VISUAL**: Não aplicável; domínio e persistência sem superfície visual nesta tarefa.
  - [ ] **EVIDENCE**: Registrar GREEN, migration web, arquivos e IDs.
  - [ ] **IMPROVE**: Extrair somente abstrações com teste de contrato.

- [ ] T005 [CODE] [US-001] Implementar migration SQLite versionada, commands Tauri e armazenamento `media/` em `apps/desktop/src-tauri/migrations/004_create_media_catalog.sql` e `apps/desktop/src-tauri/src/commands/workspace.rs` — Refs: US-001, US-003, FR-002, FR-005, FR-006, NFR-001, NFR-002, AC-012, AC-014, AC-015, AC-018 — Depends: T003, T017, T019, T020, T022
  - [ ] **PREP**: Confirmar migration, raiz do workspace e `workspace.rs`.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar e criar o schema versionado, commands, staging/limpeza e testes de path/hash.
  - [ ] **VERIFY**: Executar `cargo test` focal e fixture Tauri.
  - [ ] **VISUAL**: Não aplicável; tarefa altera backend nativo.
  - [ ] **EVIDENCE**: Registrar migration, commands, testes e IDs.
  - [ ] **IMPROVE**: Verificar mensagens acionáveis de permissionamento.

#### Fase 3 — Integração do editor e recuperação

- [ ] T006 [CODE] [US-001] Integrar serviço ao callback do Edra e blocos de imagem/vídeo/áudio em `apps/web/src/lib/edra/shadcn/openbible-editor.ts` e componentes de mídia — Refs: US-001, US-003, FR-001, FR-002, FR-004, NFR-003, AC-001, AC-002, AC-004, AC-009, AC-010, AC-017, AC-018 — Depends: T004, T005
  - [ ] **PREP**: Confirmar `onFileUpload`, serialização e strings de erro.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar e conectar validate/copy/resolve, progresso, placeholder e retry sem bloco pré-commit.
  - [ ] **VERIFY**: Executar testes Edra, notas e browser para os três tipos.
  - [ ] **VISUAL**: Revisar bordas, espaçamentos, margens, padding e tipografia, além de foco, Sonner, placeholder, progresso, erro, claro/escuro e mobile.
  - [ ] **EVIDENCE**: Registrar viewport/screenshots, comandos e AC.
  - [ ] **IMPROVE**: Ajustar copy, aria-live e retorno de foco.

#### Fase 4 — Inventário e backup

- [ ] T007 [CODE] [US-002] Implementar casos de uso de inventário, usos e exclusão em `apps/web/src/lib/features/notes/media/media-service.ts` — Refs: US-002, FR-003, FR-004, NFR-003, AC-005, AC-006, AC-007, AC-008, AC-016 — Depends: T002, T004, T012, T013, T014, T021
  - [ ] **PREP**: Confirmar seção, navegação mobile e componentes disponíveis.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar listagem de metadados, filtros, usos e exclusão segura.
  - [ ] **VERIFY**: Executar testes de serviço, inventário e referências.
  - [ ] **VISUAL**: Não aplicável; casos de uso sem superfície visual nesta tarefa.
  - [ ] **EVIDENCE**: Registrar GREEN, comandos e IDs; a tela será entregue na fase de interface.
  - [ ] **IMPROVE**: Simplificar ação principal e detalhes técnicos.

- [ ] T008 [CODE] [US-003] Estender enumeração, archive, restore, relatório e integridade em `apps/web/src/lib/storage/backup/` — Refs: US-003, FR-005, FR-006, NFR-002, AC-011, AC-012, AC-015, AC-018 — Depends: T003, T004, T005, T016, T017, T020, T022
  - [ ] **PREP**: Confirmar roles, limites e restore parcial.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar inclusão de assets, referências, hashes e bytes preservando compatibilidade.
  - [ ] **VERIFY**: Executar archive, restore, hash, limite e roundtrip completo/parcial.
  - [ ] **VISUAL**: Não aplicável; validar apenas mensagens de relatório se expostas.
  - [ ] **EVIDENCE**: Registrar manifesto, comandos e roundtrip.
  - [ ] **IMPROVE**: Garantir que falha isolada não invalide notas não relacionadas.

#### Fase de interface

- [ ] T023 [CODE] [US-001] Implementar os estados visuais dos blocos de mídia e upload no Edra em `apps/web/src/lib/edra/shadcn/components/MediaPlaceHolder.svelte` e `MediaExtended.svelte` — Refs: US-001, US-003, FR-002, FR-004, NFR-003, AC-001, AC-004, AC-009, AC-010, AC-017, AC-018 — Depends: T006, T011, T015, T022
  - [ ] **PREP**: Confirmar fluxo do editor, strings, Sonner, retry/reimportação e retorno de foco.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar available, progresso, erro, missing/corrupt e ações acessíveis.
  - [ ] **VERIFY**: Executar testes Edra/browser para upload, erro e recuperação.
  - [ ] **VISUAL**: Revisar bordas, espaçamentos, margens, padding e tipografia nos estados de progresso, erro, placeholder, claro/escuro e mobile.
  - [ ] **EVIDENCE**: Registrar screenshots/viewport, comandos e IDs.
  - [ ] **IMPROVE**: Ajustar aria-live, copy e foco após retry.

- [ ] T024 [CODE] [US-002] Implementar a tela de inventário e o painel de usos em `apps/web/src/lib/features/config/MediaInventory.svelte` e `MediaUsagePanel.svelte` — Refs: US-002, FR-003, FR-004, NFR-003, AC-005, AC-006, AC-007, AC-008, AC-016 — Depends: T007, T012, T013, T014, T021
  - [ ] **PREP**: Confirmar `PageHeader`, composição de Configurações, Select/Dialog/Sheet e navegação mobile.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar filtros, lista responsiva, usos, confirmação e estados vazios/erro; registrar os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar testes de componente/browser, teclado, foco e viewports.
  - [ ] **VISUAL**: Revisar bordas, espaçamentos, margens, padding e tipografia em desktop/mobile, claro/escuro, nomes longos e sem overflow.
  - [ ] **EVIDENCE**: Registrar comandos, revisão visual e IDs.
  - [ ] **IMPROVE**: Manter a ação principal clara e o detalhe técnico secundário.

- [ ] T025 [CODE] [US-003] Integrar o relatório de mídia do backup/restauração na superfície existente em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-003, FR-005, FR-006, NFR-002, NFR-003, AC-011, AC-012, AC-015, AC-018 — Depends: T008, T016, T017, T020, T022
  - [ ] **PREP**: Confirmar painel existente, estados completo/parcial e mensagens de restore.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` antes de implementar resumo de mídias, missing/corrupt, hash inválido e sucesso.
  - [ ] **VERIFY**: Executar testes de componente/browser para backup completo, parcial e falha.
  - [ ] **VISUAL**: Revisar bordas, espaçamentos, margens, padding e tipografia no painel, estados de erro, progresso e mobile.
  - [ ] **EVIDENCE**: Registrar comandos, estados verificados e IDs.
  - [ ] **IMPROVE**: Separar erro de mídia da falha geral do workspace.

#### Fase 5 — Documentação e qualidade

- [ ] T026 [DOC] [US-001] Atualizar o inventário persistente de catálogo, referências, stores, tabelas, índices e migrations em `.specsfy/DATABASE.md` — Refs: US-001, US-003, FR-002, FR-003, FR-005, FR-006, NFR-002, AC-011, AC-012, AC-013, AC-014 — Depends: T004, T005
  - [ ] **PREP**: Conferir schema implementado, nomes reais e política de retenção.
  - [ ] **EXECUTE**: Registrar stores/tabelas/campos/relações e migration aplicada sem apagar conteúdo humano.
  - [ ] **VERIFY**: Comparar o inventário com IndexedDB, SQLite e testes de migration.
  - [ ] **VISUAL**: Não aplicável; documentação de persistência.
  - [ ] **EVIDENCE**: Registrar arquivos, consulta de estado e IDs.
  - [ ] **IMPROVE**: Eliminar divergências entre schema e documentação.

- [ ] T027 [DOC] [US-001] Reconstruir documentação técnica e dependências após a entrega em `docs/` e `.specsfy/PACKAGES.md` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001–AC-018 — Depends: T006, T007, T008, T023, T024, T025
  - [ ] **PREP**: Confirmar comandos e escopo do `$specsfy-documentator`.
  - [ ] **EXECUTE**: Executar `$specsfy-documentator` para reconstruir `docs/` e `.specsfy/PACKAGES.md` a partir do repositório.
  - [ ] **VERIFY**: Conferir que caminhos, contratos e dependências refletem a implementação.
  - [ ] **VISUAL**: Não aplicável; tarefa documental.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs.
  - [ ] **IMPROVE**: Remover documentação obsoleta sem alterar conteúdo humano fora dos blocos gerenciados.

- [ ] T028 [DOC] [US-002] Registrar os blocos e composições de interface criados ou alterados em `INTERFACE.md` e revisar impacto de produto em `PROJECT.md` — Refs: US-001, US-002, US-003, FR-003, FR-004, NFR-003, AC-005, AC-008, AC-016 — Depends: T023, T024, T025
  - [ ] **PREP**: Conferir arquivos reais, consumidores, estados e regra de reuso.
  - [ ] **EXECUTE**: Documentar Edra media states, inventário, painel de uso, backup/restore e registrar se a finalidade do produto mudou.
  - [ ] **VERIFY**: Comparar a documentação com a seção 10 e os componentes entregues.
  - [ ] **VISUAL**: Não aplicável; documentação de interface e produto.
  - [ ] **EVIDENCE**: Registrar diff, comandos e IDs.
  - [ ] **IMPROVE**: Consolidar nomes para evitar componentes duplicados.

#### Fase 5 — Qualidade e rastreabilidade

- [ ] T009 [TEST] [US-001] Executar unidade, integração, Tauri, browser, regressão e rastreabilidade em `apps/web/vitest.config.ts` e `tests/browser/media-editor.spec.ts` para AC-001–AC-018 — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001–AC-018 — Depends: T006, T007, T008, T023, T024, T025, T026, T027, T028
  - [ ] **PREP**: Confirmar scripts, cobertura e critérios dos três gates.
  - [ ] **EXECUTE**: Executar focais, regressão, browser, `cargo test` e traceability.
  - [ ] **VERIFY**: Confirmar ausência de falhas, gaps e regressões de notas.
  - [ ] **VISUAL**: Revisar bordas, espaçamentos, margens, padding e tipografia nos estados e viewports finais; registrar ajustes.
  - [ ] **EVIDENCE**: Atualizar seções 11–13, tarefas, docs e packages.
  - [ ] **IMPROVE**: Registrar retrospectiva e riscos residuais aceitos.

**Checkpoint de US-001**: upload válido de cada tipo persiste e reabre offline em PWA/Tauri; upload inválido não altera a nota.
**Checkpoint de US-002**: inventário lista/filtra, mostra usos, remove sem uso e bloqueia em uso com teclado/mobile.
**Checkpoint de US-003**: missing/corrupt mantém nota aberta, reimportação recupera o bloco e backup/restore preserva o contrato.

### 15. Ordem de execução

- Caminho crítico: T001/T010/T011/T018 → T004 → T006 → T023 → T027 → T009.
- Trilha paralela: T002/T012/T013/T014/T021 → T007 → T024; T003/T016/T017/T020/T022 → T005/T008 → T025.
- Documentação: T004/T005 → T026; T023/T024/T025 → T028; T027 consolida a reconstrução técnica antes da regressão final.
- Estratégia MVP: persistência/upload offline (US-001), inventário/exclusão segura (US-002), missing/reimportação/backup (US-003).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Edra mantém callback assíncrono e blocos atuais de imagem, vídeo e áudio.
- `WorkspaceStorage` continua fronteira de PWA e workspace nativo.
- Backup/restauração aceita novos itens `role=media` e relatório de estado.
- `Uso e armazenamento` permanece ponto de entrada de Configurações.
- Sonner permanece disponível no shell.

#### Riscos

- Quota PWA → validar antes, mostrar progresso/erro e limpar staging.
- Permissões/filesystem Tauri → commands tipados e testes de boundary.
- Restore parcial → hash/tamanho, `missing/corrupt` e relatório sem apagar referências.
- MIME falsificado → validar extensão/MIME/assinatura quando disponível e marcar corrupção.
- Catálogo divergente de notas → reconciliar para placeholder sem excluir conteúdo.
- Arquivos grandes → async, listagem sem bytes, progresso e limites.

#### Suposições

- Workspace local é unidade de privacidade; não há compartilhamento multiusuário nesta fatia.
- `lastUsedAt` pode mudar ao resolver/abrir sem alterar conteúdo.
- Duplicatas físicas são aceitáveis no MVP; deduplicação fica para depois.
- A pessoa pode fornecer manualmente arquivo equivalente na reimportação.

### 17. Decisões

- **DEC-001**: IndexedDB no PWA e `app.sqlite` + `media/` no Tauri — alinha aos backends existentes e evita `.openbible` concorrente.
- **DEC-002**: persistir `mediaId`, não path/URL — desacopla nota da plataforma e permite backup/restore.
- **DEC-003**: copiar antes de inserir — evita blocos sem payload persistido.
- **DEC-004**: bloquear exclusão com referências — prioriza integridade das notas.
- **DEC-005**: conservar mídia sem uso até ação explícita — evita perda silenciosa.
- **DEC-006**: não transcodificar — reduz risco e dependências; formatos são declarados.
- **DEC-007**: placeholder em missing/corrupt — preserva estrutura e recuperação.
- **DEC-008**: mídia em backup/restore — bytes locais são conteúdo autoral, não cache.
- **DEC-009**: Sonner para feedback transitório e estado no componente para falha persistente.
- **DEC-010**: não criar rota global de mídias — Uso e armazenamento é o contexto natural.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC-001` a `AC-018` passam.
- [ ] Todos os requisitos `FR-001` a `FR-006` e `NFR-001` a `NFR-003` possuem evidência.
- [ ] Todas as tarefas da seção 14 e checkpoints de US-001/US-002/US-003 estão concluídos.
- [ ] Testes de unidade, integração, browser, Tauri, estáticos e rastreabilidade passam.
- [ ] `INTERFACE.md`, `docs/`, `.specsfy/PACKAGES.md`, `.specsfy/DATABASE.md`, regras e stack refletem a entrega.
- [ ] Revisão visual cobriu desktop/mobile, temas, teclado, zoom, conteúdo longo, vazios/erros e reduced motion.
