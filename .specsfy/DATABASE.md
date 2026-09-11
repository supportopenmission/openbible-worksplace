# Banco de dados

Mapa de persistência do sistema. A leitura bíblica usa arquivos SQLite importados
como fontes locais somente leitura; o banco operacional de workspaces é separado
do conteúdo autoral e do índice reconstruível.

## Fontes de dados

<!-- specsfy:database:start -->
| Fonte | Tecnologia/forma | Evidência |
| --- | --- | --- |
| Estrutura | Schema/migration | `apps/desktop/src-tauri/migrations/001_create_workspaces.sql` |
| Estrutura | Schema/migration | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| Estrutura | Schema/migration | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| Estrutura | Schema/migration | `apps/desktop/src-tauri/migrations/004_create_media_catalog.sql` |
| Estrutura | Schema/migration | `apps/sync-api/migrations/0001_sync.sql` |
| Estrutura | Schema/migration | `apps/sync-server/drizzle/0000_skinny_puck.sql` |

## Estruturas detectadas

| Estrutura | Tipo | Campos | Relações | Fonte |
| --- | --- | --- | --- | --- |
| workspaces | Tabela SQL | workspace_id:TEXT, name:TEXT, status:TEXT, schema_version:INTEGER, created_at:TEXT, updated_at:TEXT, last_opened_at:TEXT, metadata_json:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/001_create_workspaces.sql` |
| active_workspace_pointer | Tabela SQL | pointer_id:INTEGER, workspace_id:TEXT, generation:INTEGER, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/001_create_workspaces.sql` |
| legacy_workspace_migrations | Tabela SQL | migration_key:TEXT, source_type:TEXT, source_ref:TEXT, workspace_id:TEXT, state:TEXT, cursor:TEXT, error_code:TEXT, created_at:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/001_create_workspaces.sql` |
| workspace_notes | Tabela SQL | workspace_id:TEXT, note_id:TEXT, note_type:TEXT, schema_version:INTEGER, payload_json:TEXT, created_at:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| workspace_highlights | Tabela SQL | workspace_id:TEXT, highlight_id:TEXT, version_id:TEXT, book_id:INTEGER, chapter:INTEGER, verse_start:INTEGER, verse_end:INTEGER, style_id:TEXT, schema_version:INTEGER, payload_json:TEXT, created_at:TEXT, updated_at:TEXT, CHECK:(chapter, CHECK:(verse_start, CHECK:(verse_end | Não detectadas | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| workspace_index_state | Tabela SQL | workspace_id:TEXT, projection_version:INTEGER, status:TEXT, record_count:INTEGER, error_code:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| note_verse_ref | Tabela SQL | workspace_id:TEXT, note_id:TEXT, block_id:TEXT, version_id:TEXT, book_id:INTEGER, chapter:INTEGER, verse_start:INTEGER, verse_end:INTEGER, updated_at:TEXT, CHECK:(chapter, CHECK:(verse_start, CHECK:(verse_end | Não detectadas | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| reader_highlight | Tabela SQL | workspace_id:TEXT, highlight_id:TEXT, version_id:TEXT, book_id:INTEGER, chapter:INTEGER, verse_start:INTEGER, verse_end:INTEGER, style_id:TEXT, updated_at:TEXT, CHECK:(chapter, CHECK:(verse_start, CHECK:(verse_end | Não detectadas | `apps/desktop/src-tauri/migrations/002_create_workspace_content.sql` |
| sync_documents | Tabela SQL | workspace_id:TEXT, document_id:TEXT, kind:TEXT, backend_record_id:TEXT, export_relative_path:TEXT, schema_version:INTEGER, status:TEXT, created_at:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_snapshots | Tabela SQL | workspace_id:TEXT, document_id:TEXT, snapshot_version:INTEGER, state_json:TEXT, heads_json:TEXT, created_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_changes | Tabela SQL | workspace_id:TEXT, document_id:TEXT, change_id:TEXT, change_blob:BLOB, byte_size:INTEGER, applied:INTEGER, created_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_queue | Tabela SQL | workspace_id:TEXT, document_id:TEXT, pending_count:INTEGER, bytes:INTEGER, retry_at:TEXT, last_error_code:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_peers | Tabela SQL | workspace_id:TEXT, peer_id:TEXT, scope_json:TEXT, status:TEXT, created_at:TEXT, revoked_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_endpoints | Tabela SQL | workspace_id:TEXT, endpoint_id:TEXT, transport:TEXT, url:TEXT, status:TEXT, created_at:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| sync_conflicts | Tabela SQL | workspace_id:TEXT, conflict_id:TEXT, document_id:TEXT, local_generation:INTEGER, external_generation:INTEGER, status:TEXT, recovery_ref:TEXT, created_at:TEXT, updated_at:TEXT | Não detectadas | `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` |
| media_assets | Tabela SQL | workspace_id:TEXT, media_id:TEXT, original_name:TEXT, media_type:TEXT, format:TEXT, byte_size:INTEGER, imported_at:TEXT, last_used_at:TEXT, state:TEXT, sha256:TEXT, storage_key:TEXT | `workspace_id` referencia `workspaces`; chave `(workspace_id, media_id)`; estados `available/missing/corrupt` | `apps/desktop/src-tauri/migrations/004_create_media_catalog.sql` |
| media_references | Tabela SQL | workspace_id:TEXT, media_id:TEXT, reference_id:TEXT, note_id:TEXT, block_id:TEXT, created_at:TEXT, last_seen_at:TEXT | FK `(workspace_id, media_id)` para `media_assets`; índices por workspace/nota e workspace/mídia | `apps/desktop/src-tauri/migrations/004_create_media_catalog.sql` |
| sync_documents | Tabela SQL | workspace_id:TEXT, document_id:TEXT, kind:TEXT, revision:INTEGER, payload_json:TEXT, deleted_at:TEXT, updated_at:TEXT, updated_by:TEXT | Não detectadas | `apps/sync-api/migrations/0001_sync.sql` |
| sync_changes | Tabela SQL | id:INTEGER, workspace_id:TEXT, document_id:TEXT, kind:TEXT, revision:INTEGER, operation_id:TEXT, payload_json:TEXT, deleted_at:TEXT, updated_by:TEXT, created_at:TEXT, UNIQUE:(workspace_id | Não detectadas | `apps/sync-api/migrations/0001_sync.sql` |
| sync_conflicts | Tabela SQL | id:INTEGER, workspace_id:TEXT, document_id:TEXT, operation_id:TEXT, base_revision:INTEGER, current_revision:INTEGER, payload_json:TEXT, deleted_at:TEXT, device_id:TEXT, created_at:TEXT, UNIQUE:(workspace_id | Não detectadas | `apps/sync-api/migrations/0001_sync.sql` |
| account | Tabela SQL | id:text, account_id:text, provider_id:text, user_id:text, access_token:text, refresh_token:text, id_token:text, access_token_expires_at:integer, refresh_token_expires_at:integer, scope:text, password:text, created_at:integer, updated_at:integer | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| session | Tabela SQL | id:text, expires_at:integer, token:text, created_at:integer, updated_at:integer, ip_address:text, user_agent:text, user_id:text | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| sync_changes | Tabela SQL | id:integer, workspace_id:text, document_id:text, kind:text, revision:integer, operation_id:text, payload_json:text, deleted_at:text, updated_by:text, created_at:text | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| sync_conflicts | Tabela SQL | id:integer, workspace_id:text, document_id:text, operation_id:text, base_revision:integer, current_revision:integer, payload_json:text, deleted_at:text, device_id:text, created_at:text | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| sync_documents | Tabela SQL | workspace_id:text, document_id:text, kind:text, revision:integer, payload_json:text, deleted_at:text, updated_at:text, updated_by:text | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| sync_workspaces | Tabela SQL | workspace_id:text, owner_id:text, name:text, created_at:text, updated_at:text | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| user | Tabela SQL | id:text, name:text, email:text, email_verified:integer, image:text, created_at:integer, updated_at:integer | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
| verification | Tabela SQL | id:text, identifier:text, value:text, expires_at:integer, created_at:integer, updated_at:integer | Não detectadas | `apps/sync-server/drizzle/0000_skinny_puck.sql` |
<!-- specsfy:database:end -->

### D1 remoto da API de sincronização

`apps/sync-api/migrations/0001_sync.sql` define o banco D1 remoto do Worker
`openbible-sync`. Ele é uma réplica de transporte, não substitui as notas no
`app.sqlite` ou no IndexedDB local.

| Estrutura | Onde vive | Campos/forma | Relações, chaves e ownership |
| --- | --- | --- | --- |
| `sync_documents` | Cloudflare D1 | `workspace_id`, `document_id`, `kind`, `revision`, `payload_json`, `deleted_at`, `updated_at`, `updated_by` | chave primária `(workspace_id, document_id)`; estado atual por documento |
| `sync_changes` | Cloudflare D1 | cursor `id`, documento, revisão, `operation_id`, payload/tombstone e timestamps | `UNIQUE(workspace_id, operation_id)`; índice `(workspace_id, id)` sustenta pull incremental |
| `sync_conflicts` | Cloudflare D1 | operação divergente, revisão base/atual, payload/tombstone, dispositivo e timestamp | `UNIQUE(workspace_id, operation_id)`; índice por workspace/documento; conflito é preservado para decisão explícita |

O D1 remoto recebe somente documentos escopados ao `workspaceId`; paths,
handles, catálogo, credenciais e o banco bruto local ficam fora do contrato.
Retenção, compactação e resolução automática de conflitos ainda não foram
definidas para esta primeira fatia.

## Persistência operacional de workspaces (SPEC-0016 revisada)

O Tauri mantém um único `app.sqlite` por instalação em
`~/.openbible/app.sqlite`; o PWA mantém um banco IndexedDB por origem. O
registro de cada workspace é escopado por `workspace_id`; não existe um banco
operacional separado por workspace nesta fatia. O SQLite da Bíblia continua
sendo um recurso somente leitura e não é importado relacionalmente para o
IndexedDB nesta fatia.

| Banco/estrutura | Onde vive | Campos/escopo | Relações e regras |
| --- | --- | --- | --- |
| `app.sqlite` | `~/.openbible/app.sqlite` na instalação Tauri | `workspaces`, `active_workspace_pointer`, `legacy_workspace_migrations`, `workspace_notes`, `workspace_highlights`, `workspace_index_state`, `note_verse_ref`, `reader_highlight`, `sync_documents`, `sync_snapshots`, `sync_changes`, `sync_queue`, `sync_peers`, `sync_endpoints`, `sync_conflicts`, `media_assets`, `media_references`; schema v4 | abertura e migrations transacionais; conteúdo autoral, catálogo de mídias, estado CRDT, fila e projeções são escopados por `workspace_id`; bytes de mídia continuam em `media/` |
| `workspaces` | `app.sqlite` | `workspace_id`, `name`, `status`, `schema_version`, timestamps, `metadata_json` | `workspace_id` é a identidade única e a chave de escopo das operações |
| `active_workspace_pointer` | `app.sqlite` | ponteiro único, `workspace_id`, `generation`, `updated_at` | aponta para `workspaces`; geração invalida resultados assíncronos antigos |
| `legacy_workspace_migrations` | `app.sqlite` | origem, cursor, estado, erro e workspace associado | somente progresso/recovery; não transforma a fonte legada em backend ativo |
| IndexedDB operacional | origem PWA, banco `openbible-workspace` | stores `workspaces`, `active_workspace_pointer`, `legacy_workspace_migrations`, `workspace_blobs`, `workspace_notes`, `workspace_highlights`, `workspace_index_state`, `note_verse_ref`, `reader_highlight`, `sync_documents`, `sync_snapshots`, `sync_changes`, `sync_queue`, `sync_peers`, `sync_endpoints`, `sync_conflicts`; schema v3 | adapter versionado implementado na T032; uma origem, vários `workspaceId`, chaves compostas, transações e exclusão por escopo |

Na instalação nativa, o workspace interno padrão vive em
`~/.openbible/workspace/`, com as Bíblias em `bibles/*.sqlite` e os arquivos
compatíveis do workspace na mesma raiz. Na primeira abertura após esta mudança,
o aplicativo copia o `app.sqlite` legado para a nova raiz e transfere o
workspace padrão que estava em `app_data_dir/workspace`; a origem legada do
banco é mantida para recovery quando a cópia é usada. Workspaces escolhidos
manualmente não são movidos. O PWA permanece no backend IndexedDB/OPFS já
selecionado pelo navegador.

### Persistência operacional de sincronização (SPEC-0019)

`workspace_notes`/`workspace_highlights` são os registros primários das notas e
destaques. As estruturas `sync_*` guardam somente o estado operacional de
replicação e suas projeções; não substituem o conteúdo nem autorizam o banco
bruto/projeção local no payload. O desenho é equivalente nos dois backends:
SQLite usa tabelas na migration 003; IndexedDB usa object stores na versão 3.

| Estrutura | `app.sqlite` | IndexedDB `openbible-workspace` | Relações, chaves e ownership |
| --- | --- | --- | --- |
| Registro de documento | `sync_documents(workspace_id, document_id, kind, backend_record_id, export_relative_path, schema_version, status, timestamps)` | `sync_documents` com keyPath `[workspaceId, documentId]`, índices `workspaceId` e `[workspaceId,status]` | 1 registro por documento/workspace; liga o documento CRDT ao registro primário; status `clean/pending/converged/conflict` |
| Snapshot e heads | `sync_snapshots(workspace_id, document_id, snapshot_version, state_json, heads_json, created_at)` | `sync_snapshots` com keyPath `[workspaceId, documentId, snapshotVersion]`, índice `document` | FK para `sync_documents`; histórico versionado, fonte local recuperável para compactação/rebuild |
| Changes | `sync_changes(workspace_id, document_id, change_id, change_blob, byte_size, applied, created_at)` | `sync_changes` com keyPath `[workspaceId, documentId, changeId]`, índices `document` e `pending` | Deltas por documento; `applied` e `byte_size` sustentam retry/backpressure; nunca contém path absoluto |
| Fila | `sync_queue(workspace_id, document_id, pending_count, bytes, retry_at, last_error_code, updated_at)` | `sync_queue` com keyPath `[workspaceId, documentId]`, índice `workspaceId` | 1 estado de fila por documento; rede pode pausar sem apagar nota/changes |
| Peers | `sync_peers(workspace_id, peer_id, scope_json, status, created_at, revoked_at)` | `sync_peers` com keyPath `[workspaceId, peerId]`, índices `workspaceId` e `[workspaceId,status]` | Pairing e revogação por workspace; não contém segredo exportável |
| Endpoints | `sync_endpoints(workspace_id, endpoint_id, transport, url, status, timestamps)` | `sync_endpoints` com keyPath `[workspaceId, endpointId]`, índice `workspaceId` | Política de transporte; tokens/credenciais não entram nessa estrutura |
| Conflitos | `sync_conflicts(workspace_id, conflict_id, document_id, local_generation, external_generation, status, recovery_ref, timestamps)` | `sync_conflicts` com keyPath `[workspaceId, conflictId]`, índices `workspaceId` e `[workspaceId,status]` | FK para documento; `needs-review/resolved/recovered`; recovery externo é referência, não autoridade autoral |

### Implementação da fonte e das projeções de conteúdo

- `apps/web/src/lib/storage/workspace-content-repository.ts` define o contrato
  único de registro por `workspaceId`, backend (`sqlite` ou `indexeddb`), tipo,
  ID e `schemaVersion`; drivers persistentes devem implementar esse contrato
  sobre as tabelas/stores versionados atuais, sem misturar workspaces.
- `apps/web/src/lib/features/notes/index-rebuilder.ts` produz a projeção
  reconstruível e nunca lê ou escreve `bibles/*.sqlite`. Durante migração, ele
  pode ler `highlights/*.json`; esse sidecar é fonte legada/recovery, não a
  fonte primária do workspace novo.
- `apps/web/src/lib/features/notes/highlight-repository.ts` registra o payload
  de destaque no contrato de conteúdo. `reader_highlight` e
  `workspace_index_state` permanecem derivados e podem ser refeitos sem perda
  de registros primários.
- A UI de `/highlights` e de `WorkspaceSettings` expõe progresso, erro, retry e
  cancelamento antes do commit da projeção; uma falha não autoriza apagar ou
  reescrever a fonte autoral.

## Catálogo legado e manifesto de workspaces (histórico da arquitetura anterior)

O conteúdo autoral legado continua nas raízes (Markdown/SQLite por workspace). O
catálogo abaixo é uma projeção local de reencontro por dispositivo: pode ser
reconstruído por recadastro, nunca entra em sync/backup de conteúdo e não é a
fonte normativa do registro. Handles do File System Access vivem só na sessão;
só referências em string (caminho nativo, ref OPFS) persistem. Nesta revisão,
manifesto, catálogo e raízes servem para migração/recovery; o backend operacional
é `app.sqlite` no Tauri ou IndexedDB no PWA.

| Estrutura | Onde vive | Campos | Relações e regras |
| --- | --- | --- | --- |
| `WorkspaceManifest` | `.openbible/config.json` da raiz (portátil) | `workspaceId`, `formatVersion: 2`, `name`, `managedRoot`, compat legada (`version: 1`, `storage`, `configuredAt`, `bibleImportStatus`, `label`) | 1 raiz possui exatamente 1 manifesto válido; validação rejeita ID ausente, versão incompatível e marcador inconsistente; `managedRoot` só é `true` em raiz dedicada preparada pelo app |
| `WorkspaceCatalogEntry` | `localStorage:openbible:workspace-catalog` + memória (projeção só dispositivo) | `workspaceId`, `nameCache`, `storageKind`, `backend`, `localRef` (só string persiste), `lastOpenedAt`, `status` | No máximo 1 referência local por ID; remoção vira `detached` e não toca arquivos; o registro do banco é a autoridade |
| `ActiveWorkspacePointer` | memória da janela (+ espelho do ID em `localStorage`) | `workspaceId`, `generation` monotônica | 1 por janela; sem conteúdo; `generation` invalida operações assíncronas antigas |
| `StorageCapabilities` | código por adapter (`capabilitiesForKind`) | `selectFolder`, `createLogicalRoot`, `reconnect`, `writeManifest`, `scan`, `deleteManagedRoot` | 1 entrada resolve 1 adapter; ausência vira erro explícito, sem fallback |

Migração idempotente (`ensureManifest`/`migrateLegacyWorkspace` em
`workspace-catalog.ts`): converte o registro singular sem mover conteúdo,
chaveada pelo próprio ID; repetição é no-op; falha parcial restaura o ponteiro
anterior e abre recovery. Exclusão integral só via `deleteManagedRootEntry` (cadeia
manifesto→gerenciada→capability→varredura→apagamento pelo backend) ou comando
nativo `delete_managed_workspace` (lock da sessão + guardas no Rust), seguida da
remoção transacional do registro em `app.sqlite` ou IndexedDB.

## Estruturas de leitura bíblica

| Fonte             | Estrutura                    | Campos mínimos                                          | Relação e uso                                                                          |
| ----------------- | ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `bibles/*.sqlite` | `book`                       | `id`, `name`; `abbreviation` e `testament_id` opcionais | Um arquivo contém muitos livros; validada antes de entrar no catálogo                  |
| `bibles/*.sqlite` | `verse`                      | `book_id`, `chapter`, `verse`, `text`                   | `verse.book_id` referencia `book.id`; consultas de capítulo e busca são parametrizadas |
| `bibles/*.sqlite` | `metadata` (opcional)        | `key`, `value`                                          | `key = 'name'` fornece o nome da versão; o nome do arquivo é o fallback                |
| Pasta/OPFS        | `.openbible/preferences.json` | `theme`, `readerSelection` | Fonte File Over Apps das preferências; `localStorage` é cache para o primeiro paint (`initialRoute` removida em SPEC-0012) |
| Pasta/OPFS        | `.openbible/index.sqlite`     | `note_verse_ref`, `reader_highlight` e índices auxiliares | Fonte legada de migração/recovery; não é o backend operacional novo nem substitui o SQLite bíblico |
| Pasta/OPFS        | `notes/<noteId>.md`           | frontmatter YAML + corpo Markdown                      | Caminho virtual de exportação; arquivos existentes são somente recuperação legada; notas novas não criam essa pasta |
| Pasta/OPFS        | `trash/<noteId>.md`           | mesmo formato de `notes/`                              | Estrutura legada de lixeira; não é criada nem usada pelo backend operacional novo |
| IndexedDB         | `openbible-workspace`         | handle da pasta                                        | Só no modo `local`; permissão `readwrite` é revalidada a cada visita                  |

## Decisões, ownership e retenção

### Informações confirmadas do produto

- Notas, sermões e estudos são persistidos no backend operacional do workspace:
  SQLite nativo no Tauri e IndexedDB no PWA; Markdown/PDF são exportações
  derivadas e Markdown legado é usado somente para migração/recovery.
- O SQLite local mantém registros primários e projeções derivadas no `app.sqlite`;
  a Bíblia SQLite/WASM permanece separada e somente leitura.
- Bancos SQLite bíblicos poderão ser importados por arrastar e soltar quando
  seguirem o padrão do OpenLP, ou acessados por uma URL de distribuição como
  Cloudflare R2.
- O `.openbible/index.sqlite`, `notes/<noteId>.md` e `highlights/<id>.json`
  existentes são fontes legadas de migração/recovery. Os registros primários
  novos vivem em `workspace_notes` e `workspace_highlights` no backend ativo;
  `note_verse_ref`, `reader_highlight` e `workspace_index_state` são projeções
  reconstruíveis. A Bíblia **não** é copiada para essas estruturas: o leitor usa
  SQLite/WASM nos arquivos importados de `bibles/`, somente leitura, e fecha cada
  instância após a consulta.
- A validação funcional do leitor exige as tabelas `book` e `verse` e as colunas
  mínimas listadas acima; arquivos incompatíveis são diagnosticados sem remover
  fontes válidas nem modificar qualquer SQLite.
- Tema e última leitura ficam em `.openbible/preferences.json`.
  A preferência de tela inicial (`initialRoute`) foi removida em SPEC-0012: a
  rota `/` é sempre a home operacional e valores legados são tratados como
  ausentes.
  O `localStorage` (`openbible.theme`, `openbible.initial-route`,
  `openbible.reader-selection`) é cache de primeiro paint e não substitui o arquivo.
- No modo pasta local, o handle fica no IndexedDB e a permissão `readwrite` é
  consultada de novo após o reload; se voltar a `prompt`, a UI pede acesso sem
  fingir que o workspace sumiu. No OPFS e no origin, `navigator.storage.persist()`
  tenta reduzir eviction.
- O cache offline do app shell é gerenciado pelo Cache Storage do service worker;
  ele não é fonte de dados de domínio nem substitui o SQLite local.
- Backup, exportação e sincronização seguem as decisões registradas nas
  SPEC-0018, SPEC-0019 e SPEC-0020; a retenção detalhada de outros artefatos
  permanece pendente quando não estiver descrita abaixo.
- A SPEC-0013 troca somente o motor visual das notas por Milkdown. A
  representação Markdown `notes/<noteId>.md` permanece o formato portátil de
  exportação, enquanto a reindexação após autosave continua escrevendo
  `note_verse_ref` sem migration ou mudança de schema.

### SPEC-0019 e SPEC-0020 — Sincronização local e agentes

As estruturas abaixo são decisões de persistência aprovadas para a próxima
implementação. Elas não autorizam transformar projeções ou credenciais locais
em fonte portátil, nem introduzem servidor central obrigatório.

| Estrutura | Onde vive | Campos/forma | Relações e exclusões | Ownership e retenção |
| --- | --- | --- | --- | --- |
| Estado operacional CRDT por documento | `sync_documents`, `sync_snapshots` e `sync_changes` em `app.sqlite`/IndexedDB | Estado CRDT versionado por documento, snapshots, heads e changes; o formato do documento permanece sob o contrato da SPEC-0019 | Escopado por `workspaceId`/`workspace_id`, excluído do `.openbible/index.sqlite` e sem substituir `workspace_notes`; não é a única fonte do conteúdo | Mantido localmente pelo workspace e pela sincronização; snapshots/changes podem ser compactados ou reconstruídos conforme o protocolo do documento |
| Política de endpoint/peer | Metadado operacional local da sincronização | Endpoint e política de peer sem segredo embutido | Pode ser sincronizado somente como política pública; não contém token, senha, chave ou segredo | Pessoa usuária do dispositivo; substituível ao reconfigurar a sincronização |
| Token de acesso PWA | Apenas memória do processo web | Token efêmero, não persistido em arquivo, IndexedDB, localStorage, workspace ou backup | Não se relaciona a arquivos portáteis nem ao estado CRDT persistente | Vive somente durante a sessão; sai ao recarregar/encerrar o PWA |
| Credencial Tauri | Credential store seguro do sistema operacional | Referência/credencial gerenciada pelo shell nativo; nenhum valor secreto no workspace | Não entra em Markdown, JSON portátil, sync ou backup | Controlada pelo sistema operacional e removida pelo fluxo de credenciais do dispositivo |
| `PortableAgentProfile` | Arquivo JSON legível dentro do workspace | Perfil versionado e editável; não contém `provider`, `endpoint`, `model` nem `secretRef` | Pode acompanhar o workspace e ser versionado; não concede credencial nem aponta para segredo persistido | Pessoa usuária e ferramentas locais; alterável ou removível junto da configuração do agente |
| `DeviceAgentBinding` | Registro local reservado do aparelho | Associação do workspace/agente ao dispositivo e estado local de autorização | Excluído do workspace autoral, sincronização, backup e exportação; não deve ser inferido do `PortableAgentProfile` | Apenas o dispositivo atual; removido ao desvincular ou limpar credenciais locais |
| Runs e propostas de agente | Armazenamento operacional transitório local | Identificador, status, timestamps e resultado mínimo necessário para a sessão | Não são fonte autoral, não entram em backup/sync e não carregam segredo | Retenção transitória; limpeza após conclusão, cancelamento ou expiração da sessão |
| Diagnóstico sanitizado | Log operacional local limitado | No máximo 200 eventos e janela máxima de sete dias; sem conteúdo completo, token, endpoint secreto ou caminho sensível | Não entra em workspace autoral, backup ou sync; somente códigos, fases e próximos passos sanitizados | Retido localmente apenas para recuperação/observabilidade; expira ao atingir limite de eventos ou idade |

Essas decisões preservam a separação entre dados portáteis do workspace,
projeções descartáveis, credenciais do dispositivo e estado transitório de
agentes.

### Persistência efetiva das mídias do Edra

Na implementação atual, a mídia usa a fronteira `WorkspaceStorage`. No PWA, o
catálogo descritivo fica em `media/catalog.json`; no Tauri, os metadados ficam
em `media_assets`/`media_references` do `app.sqlite`. Em ambos os runtimes cada
payload fica em `media/<mediaId>.<format>`. O conteúdo da nota guarda somente
`media:<mediaId>` no registro primário de nota, e URLs `blob:` são criadas e
revogadas apenas durante a renderização. O catálogo registra hash SHA-256,
estado, tamanho e referências por `noteId`; a exclusão exige zero referências.
O enumerador de backup inclui `media/` como papel `media`; para o Tauri ele
materializa o catálogo SQLite em `media/catalog.json` dentro do archive, sem
criar esse arquivo no workspace. O conteúdo não é enviado para a rede.

<!-- specsfy:conversation-data:start -->
## Informações a guardar confirmadas

| Informação | Para que serve | O que guardar | Formato sugerido | Ligações | Quem usa | Quando muda ou sai | Fontes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configuração do espaço de trabalho | Permitir que o OpenBible reencontre o armazenamento escolhido e abra o projeto sem repetir o onboarding. | Tipo de armazenamento usado, referência ao local escolhido quando aplicável, versão da configuração e situação da importação de Bíblias: pendente, concluída ou parcial. | Registro local persistente com valores de configuração e situação; os detalhes de conexão não são enviados para servidor. | A configuração identifica um único espaço de trabalho e se relaciona aos arquivos SQLite existentes na pasta bibles. | Somente a pessoa usuária individual do dispositivo pode consultar ou alterar. | É criada ao concluir o onboarding, permanece entre visitas, muda quando o armazenamento ou o estado da importação muda e pode ser substituída ao reconfigurar o espaço de trabalho; não há política de remoção definida nesta feature. | specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md; specs/backlog/0001-onboarding-configuracao-armazenamento.md; conversa atual, resposta à Pergunta 2 e à Pergunta 4 |
| Tela inicial preferida             | Abrir automaticamente a área escolhida quando a pessoa entrar na rota /.                                 | A tela inicial escolhida entre Bíblia, sermão ou nenhuma preferência; estudo permanece em breve e não é valor válido nesta fatia.                                        | Escolha entre opções disponíveis de telas do produto, com ausência de escolha representando o seletor inicial.            | A preferência aponta para uma rota de entrada do produto e controla a exibição do Sidebar.                           | Somente a pessoa usuária individual do dispositivo consulta e altera.         | É criada quando a pessoa salva uma tela inicial, muda quando escolhe outra e deixa de valer quando a preferência é removida; enquanto não existir, / mostra as opções de entrada e o Sidebar não aparece.                              | specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md; specs/backlog/0002-tela-inicial-navegacao.md; conversa atual                                                           |
| Configuração do workspace nativo e migração | Permitir que o app nativo reencontre a pasta do workspace e saiba se uma migração do armazenamento web ainda precisa ser oferecida ou retomada. | Pasta escolhida; tipo de armazenamento (nativo ou web); versão do formato; estado da migração: não iniciada, concluída ou com erro. | O registro normativo vive em `.openbible/config.json` dentro da pasta escolhida; o shell pode manter apenas o caminho em `localStorage` para reabertura. | A configuração aponta para o workspace que contém notas, preferências, índice auxiliar e bancos bíblicos; o estado da migração se refere ao workspace web de origem e ao destino nativo. Nenhum dado do app fica em Application Support. | Somente a pessoa usuária individual do dispositivo consulta ou altera. | Criada na primeira configuração; muda ao escolher outra pasta ou quando a migração avança/termina/falha; pode ser substituída ao reconfigurar o workspace; não há retenção remota. | specs/inbox/2026-09-04-164740-versao-nativa-macos-com-tauri-e-armazenamento-local.md; specs/backlog/0014-versao-nativa-macos-tauri.md; conversa atual, clarificação Files Over App de 2026-09-04 |
| Catálogo local de workspaces | Listar, reencontrar e selecionar os workspaces disponíveis em um dispositivo sem misturar suas raízes. | ID estável do workspace, nome exibido, tipo de armazenamento, referência local necessária para reencontro, indicador do último workspace ativo e data do último uso. | Registro local por dispositivo com uma entrada por workspace e uma única referência ao workspace ativo; caminhos e handles não são sincronizados. | Cada entrada local aponta para exatamente uma raiz real, handle autorizado ou diretório lógico OPFS; o workspace ativo aponta para uma dessas entradas. | Somente a pessoa usuária local e o shell OpenBible daquele dispositivo consultam ou alteram. | Criado ao cadastrar ou migrar um workspace, atualizado ao renomear ou abrir, removido ao esquecer o workspace e apagado junto com os dados locais do aplicativo; não remove conteúdo da pasta por si só. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 1 de dados |
| Identidade portátil do workspace | Reconhecer o mesmo workspace quando sua pasta for movida ou adicionada em outro dispositivo e preservar seu nome sem depender do caminho. | ID estável, nome exibido e versão do formato do workspace. | Informações textuais e versão numérica no arquivo .openbible/config.json da própria raiz. | O ID identifica a raiz e é referenciado pelo catálogo local, pelos índices e futuramente pelo estado de sincronização; o nome acompanha o workspace sem renomear a pasta. | A pessoa pode alterar o nome pelo OpenBible; o sistema cria e mantém ID e versão. | Criado ao preparar ou migrar o workspace, preservado ao mover ou recadastrar a pasta, atualizado ao renomear e removido somente com a exclusão confirmada do workspace. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 2 de dados |
| Propriedade da raiz do workspace | Impedir que o OpenBible apague integralmente uma pasta adicionada ou que contenha arquivos fora do controle do aplicativo. | Indicador de que a raiz dedicada foi criada ou preparada pelo OpenBible como gerenciada. | Confirmação explícita no .openbible/config.json, criada somente durante a preparação de uma raiz dedicada; pastas apenas adicionadas permanecem não gerenciadas. | Pertence à identidade portátil do workspace e é consultada junto da varredura de arquivos desconhecidos antes de qualquer exclusão integral. | Somente o fluxo de criação/preparação do OpenBible define o indicador; a pessoa consulta sua consequência na gestão e confirma a exclusão. | Criado com a raiz dedicada, preservado durante seu uso e invalidado para exclusão automática quando faltar, for inconsistente ou houver arquivos desconhecidos. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 3 de dados |
| Colisão de identidade de workspace | Evitar que duas raízes divergentes sejam tratadas simultaneamente como o mesmo workspace no dispositivo e na sincronização futura. | A decisão da pessoa entre atualizar a localização do cadastro existente ou criar uma cópia independente com novo ID. | Escolha explícita durante o cadastro quando o ID lido já existir; o catálogo final mantém no máximo uma referência local por ID. | Compara o ID portátil da pasta com o catálogo local; atualizar localização preserva a identidade, enquanto criar cópia altera o ID no novo workspace. | Somente a pessoa local confirma a intenção; o OpenBible detecta a colisão e aplica a alternativa escolhida. | Surge ao adicionar uma raiz com ID já conhecido e termina quando a referência é atualizada ou a cópia recebe novo ID; nenhuma duplicidade permanece pendente. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 4 de dados |
| Identidade e metadados portáteis da nota | Reconhecer nota, sermão ou estudo no backend e ao exportar para fora do OpenBible. | ID estável, versão do formato, tipo, título, descrição, datas e propriedades desconhecidas já presentes. | Registro em SQLite/IndexedDB; Markdown mantém uma representação derivada e reimportável. | O ID permanece ligado ao `workspaceId` mesmo após exportação, reimportação ou recuperação. | A pessoa e editores externos leem a exportação; o OpenBible altera o registro primário no backend ativo. | Criado/atualizado atomicamente no backend; exportações e fontes legadas são regeneráveis ou preservadas. | SPEC-0017; conversa de 2026-09-06 sobre SQLite/IndexedDB e Markdown/PDF |
| Bloco semântico portátil da nota | Manter versículos e vídeos legíveis em qualquer editor e ainda editáveis como bloco no OpenBible. | ID do bloco, tipo, referência ou URL, versão bíblica/provedor e snapshot textual visível. | Conteúdo CommonMark/GFM visível em blockquote ou link, envolvido por comentários HTML com JSON versionado de metadados. | O ID liga metadados invisíveis ao conteúdo visível; perder comentários preserva leitura, mas perde edição enriquecida. | A pessoa lê e edita o conteúdo; o OpenBible valida metadados e nunca sobrescreve divergência externa silenciosamente. | Criado pelo comando do editor, atualizado ao editar o bloco, migrado de fence válido ao salvar e removido com o bloco. | specs/backlog/0018-formatos-portateis-indice-reconstruivel.md; conversa de 2026-09-05; documentação CommonMark/GFM/Obsidian |
| Destaque autoral do leitor bíblico | Preservar cada destaque no backend ativo e permitir exportação/intercâmbio sem sidecar obrigatório. | `workspaceId`, `highlightId`, versão e intervalo bíblico, estilo, datas e versão do schema. | Registro em `workspace_highlights` no SQLite/IndexedDB; `reader_highlight` é projeção; JSON é opcional. | Cada registro aponta para uma referência bíblica e nunca cruza `workspaceId`. | Somente a pessoa usuária e as ferramentas locais que ela escolher. | Criado/atualizado atomicamente no backend, projetado novamente quando necessário e exportado sem mutar a fonte. | SPEC-0017; conversa de 2026-09-06 sobre SQLite/IndexedDB e Markdown/PDF |
| Índice reconstruível do workspace | Acelerar buscas e relações sem se tornar fonte exclusiva de informação da pessoa. | Projeções de referências, destaques e metadados derivados, versão do schema, estado e origem do rebuild. | `workspace_index_state`, `note_verse_ref` e `reader_highlight` no SQLite/IndexedDB operacional. | Cada linha referencia registros primários por `workspaceId`; nenhuma projeção é autoridade e a Bíblia fica fora do rebuild. | Somente os motores do OpenBible no aparelho. | Pode ser apagado ou substituído; é recriado sob demanda quando ausente, incompatível ou corrompido. | SPEC-0017; conversa de 2026-09-06 sobre SQLite/IndexedDB e Markdown/PDF |
| Mídia anexada à nota | Permitir que o editor Edra reabra mídias offline e que a área de Uso e armazenamento liste, filtre, diagnostique e gerencie os arquivos usados nas notas. | Nome original, tipo, formato, tamanho, data de importação, data da última utilização, identificador estável, estado disponível/ausente/corrompida e vínculos com todas as notas que usam a mídia. | Metadados descritivos, datas, tamanho numérico, identificador estável, estado entre opções e vínculos consultáveis entre mídia e nota; quantidade de notas e uso podem ser derivados desses vínculos. | Cada mídia permanece ligada a zero ou mais notas por uma referência estável; a quantidade de notas que usam o arquivo é derivada desses vínculos. | A pessoa usuária do workspace ativo consulta e gerencia essas informações localmente; não há compartilhamento entre pessoas nesta fatia. | A mídia nasce após upload validado e cópia bem-sucedida, muda de estado quando é usada ou fica ausente/corrompida, e poderá ser apagada conforme a regra confirmada para mídias sem uso. | specs/inbox/2026-09-10-125413-armazenamento-e-gerenciamento-de-midias-no-editor-edra.md; specs/backlog/0023-armazenamento-gerenciamento-midias-editor-edra.md; PROJECT.md |
| Mídia sem uso | Preservar arquivos quando deixam de ser usados por notas até que a pessoa escolha removê-los no gerenciador. | Estado sem uso e a ausência de vínculos ativos com notas, mantendo os metadados e o arquivo disponíveis para consulta e exclusão manual. | Estado entre usada e sem uso, derivado dos vínculos atuais com notas; os metadados e o arquivo permanecem até uma ação explícita de exclusão. | Uma mídia passa a sem uso quando não existe mais nenhuma nota vinculada; continua relacionada ao workspace e pode voltar a ser usada por uma nova referência. | A pessoa usuária do workspace ativo pode consultar e apagar mídias sem uso pela área de Uso e armazenamento. | A mídia não é apagada automaticamente ao perder a última referência; permanece até exclusão manual. Mídias em uso continuam protegidas contra exclusão. | specs/backlog/0023-armazenamento-gerenciamento-midias-editor-edra.md; PROJECT.md |
<!-- specsfy:conversation-data:end -->
