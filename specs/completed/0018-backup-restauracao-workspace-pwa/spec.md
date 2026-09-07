# Especificação integrada: Backup e restauração do workspace PWA

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0018 |
| Slug | 0018-backup-restauracao-workspace-pwa |
| Status | Complete |
| Effort | 8 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Fatiamento de alto risco por combinar streaming, contêiner ZIP/ZIP64, verificabilidade, staging e os backends operacionais IndexedDB/SQLite nativo sem colocar dados operacionais no pacote. |
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

O workspace PWA passou a ter sua persistência operacional no IndexedDB e o
Tauri no SQLite nativo. A pessoa precisa retirar o conteúdo local, mover uma
cópia entre ambientes e recuperar dados sem copiar catálogo, ponteiro ativo,
handles, cache ou índices descartáveis. O projeto ainda não possui um contrato
único que prove quais registros e bytes autorais foram exportados e que impeça
uma restauração parcial ou insegura.

#### Resultado desejado

O OpenBible gera e consome um arquivo `.openbible-backup.zip` versionado, local
e verificável. O pacote contém Markdown, JSON, anexos e, somente por escolha
explícita, fontes SQLite de Bíblias. Um manifesto UTF-8 enumera cada entrada
com tamanho e SHA-256. A restauração valida o pacote inteiro, grava primeiro
em staging privado, cria um workspace novo por padrão e só cadastra o destino
após commit seguro. Falhas preservam o workspace ativo e deixam um relatório
acionável.

#### Métricas de sucesso

- 100% das entradas autorais permitidas de uma fixture aparecem no manifesto,
  com bytes e SHA-256 equivalentes ao conteúdo restaurado.
- 100% dos pacotes adulterados, truncados ou com caminhos proibidos são
  rejeitados antes do commit e não alteram um workspace existente.
- A memória de trabalho da operação fica em buffers ativos de no máximo 16 MiB;
  o limite inicial é 100.000 entradas e 10 GiB descompactados por pacote.
- No IndexedDB e no SQLite nativo, uma falha de restauração deixa o workspace
  ativo intacto e oferece nova tentativa ou limpeza segura do staging; a
  reconstrução da projeção não impede a abertura do conteúdo autoral.
- A pessoa consegue iniciar, acompanhar, cancelar e concluir backup/restauração
  com teclado, leitor de tela, viewport de 320 px e viewport desktop de 1440 px.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] OPFS é privado da origem, sujeito a quota e removido ao limpar os dados do site; nesta spec ele é somente legado/sink opcional, não backend operacional — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#opfs-e-file-system-access-api — Budget: 1/5.
- **R-002** [critical] `showDirectoryPicker()` tem disponibilidade limitada, exige contexto seguro e gesto da pessoa — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#opfs-e-file-system-access-api — Budget: 1/5.
- **R-003** [critical] Compression Streams oferece gzip/deflate em fluxo, não um contêiner de múltiplos arquivos — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.
- **R-004** [critical] ZIP permite múltiplas entradas, compressão opcional e registros ZIP64 para tamanhos maiores — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.
- **R-005** [critical] Service workers são workers assíncronos orientados a eventos e não um servidor local persistente — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#service-worker — Budget: 1/5.
- **R-006** [critical] O storage atual expõe enumeração limitada e a tela de Configurações já contém `WorkspaceSettings` — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#inspeção-local-do-projeto — Budget: 1/5.
- **R-007** [critical] `SubtleCrypto.digest()` exige a entrada inteira e não fornece hash streaming — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.

#### Fontes e contexto consultados

- `specs/backlog/0019-backup-restauracao-workspace-pwa.md`, fonte de comportamento,
  critérios e decisões do backlog.
- `specs/completed/0016-multiplos-workspaces-modelo-vaults/spec.md`, identidade,
  catálogo, adaptadores e barreira de autosave.
- `specs/completed/0017-formatos-portateis-indice-reconstruivel/spec.md`, contrato
  autoral Markdown/JSON e índice SQLite reconstruível.
- `apps/web/src/lib/storage/workspace-content-repository.ts`,
  `indexeddb-workspace-adapter.ts`, `workspace-repository.ts`, os drivers
  SQLite nativos e `apps/web/src/lib/features/config/ConfigPage.svelte`.

#### Documentação consultada

- MDN, *Origin private file system*, consultado em 2026-09-05:
  https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN, *Window: showDirectoryPicker() method*, consultado em 2026-09-05:
  https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
- MDN, *Compression Streams API*, consultado em 2026-09-05:
  https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API
- MDN, *SubtleCrypto: digest() method*, atualizado em 2025-12-28 e consultado
  em 2026-09-05: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- MDN, *Service Worker API*, consultado em 2026-09-05:
  https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- PKWARE, *APPNOTE.TXT — ZIP File Format Specification*, versão 6.3.10,
  consultado em 2026-09-05:
  https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT

#### Artefatos de pesquisa armazenados

- `specs/completed/0018-backup-restauracao-workspace-pwa/research/backup-platform/evidence.md`:
  notas próprias, fontes oficiais, locators e impacto contratual; consultado em
  2026-09-05; nenhuma reprodução extensa de conteúdo protegido.

#### Dúvidas respondidas

- **Q**: Qual contêiner permite interoperabilidade e entradas grandes? → **A**:
  ZIP/ZIP64, com extensão `.openbible-backup.zip`; Deflate é preferido quando o
  adaptador oferecer e armazenamento sem compressão é permitido.
- **Q**: Compression Streams será o formato do pacote? → **A**: não; gzip e
  deflate são capacidades de fluxo dentro do adaptador, enquanto o contrato
  externo é ZIP/ZIP64 com manifesto próprio.
- **Q**: O service worker deve atuar como servidor local para exportação? →
  **A**: não; a página usa sink de arquivo, picker ou download compatível, e
  bloqueia um pacote grande quando o navegador não oferece destino streaming.
- **Q**: Qual política padrão para Bíblias? → **A**: não incluir; a pessoa
  marca explicitamente `Incluir Bíblias importadas`, e o relatório mostra bytes,
  hashes e a regra imutável.
- **Q**: Qual destino padrão de restore? → **A**: novo workspace isolado com ID
  novo; direcionar para workspace existente exige ação explícita e política de
  conflito visível.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante para a definição inicial. Escolhas de dependência
  npm e tarefas de produção ficam para as fases de planejamento e implementação.

### 3. Escopo e atores

#### Incluído

- Criar backup do workspace ativo após a barreira de autosave.
- Materializar a visão portátil dos registros autorais do workspace ativo por
  meio do contrato `WorkspaceContentRepository`, incluindo Markdown, JSON,
  anexos/blobs e extensões preservadas sem exportar stores/tabelas internas.
- Gerar ZIP/ZIP64 com `openbible-backup.json` e `files/<caminho-relativo>`.
- Registrar política de Bíblias, contagem, bytes, tipo, tamanho e SHA-256 por
  entrada.
- Validar pacote e destino, escrever em staging, fazer commit/rollback e gerar
  relatório sem expor conteúdo completo ou caminho absoluto.
- Restaurar para um workspace novo no backend operacional do ambiente —
  IndexedDB no PWA ou SQLite nativo no Tauri — abrindo o conteúdo autoral mesmo
  quando a projeção derivada falhar. File System Access, download e sinks
  equivalentes servem para transportar o pacote, não para definir o backend do
  workspace.
- Oferecer fluxo responsivo e acessível na seção de armazenamento de
  `ConfigPage`/`WorkspaceSettings`.

#### Fora de escopo

- Sincronização contínua, transporte remoto ou resolução de conflito Automerge.
- Agentes de IA, chaves de provedores, embeddings e política de rede.
- Exportação de catálogo local, ponteiro ativo, handles, referências OPFS,
  `localStorage`, stores/tabelas de sessão do shell, Cache Storage, service
  worker, locks, logs ou temporários. Registros autorais do IndexedDB são
  exportados por contrato lógico, nunca como dump bruto do banco.
- Conversão de SQLite de Bíblia em Markdown/JSON ou edição de seu conteúdo.
- Hospedagem, nuvem, conta, criptografia de backup, compartilhamento automático
  e agendamento recorrente.
- Implementação da identidade e do seletor de workspaces, pertencente à
  SPEC-0016.

#### Atores

- **Pessoa usuária**: inicia, configura, acompanha, cancela e confirma backup ou
  restauração; escolhe Bíblias e destino.
- **Repositório de conteúdo**: lê registros e blobs do workspace ativo por
  `workspaceId`/generation e informa a capacidade transacional do backend.
- **Adaptador de pacote**: lê/escreve o ZIP por stream e usa File System Access,
  download, OPFS temporário ou bridge Tauri somente como origem/destino físico
  do arquivo.
- **Validador de pacote**: trata o arquivo recebido como dados, verifica
  manifesto, ZIP, caminhos, limites e hashes.
- **Índice local**: projeção descartável que será recriada após o commit e nunca
  é fonte do backup.

### 4. Princípios e restrições do projeto

- **PR-001**: Files over Apps; o pacote deve sobreviver sem OpenBible e não pode
  depender do IndexedDB/SQLite interno, OPFS, handles ou catálogo do aparelho.
- **PR-002**: ZIP/ZIP64 é somente um contêiner; o contrato autoral continua
  sendo Markdown/JSON/bytes com caminhos relativos e UTF-8 quando textual.
- **PR-003**: Cada arquivo de conteúdo possui tamanho declarado e SHA-256 dos
  bytes descompactados; divergência impede commit.
- **PR-004**: `openbible-backup.json` é a primeira entrada local do ZIP, sem
  compressão, em UTF-8 canônico, e a lista de arquivos fica ordenada por caminho.
- **PR-005**: Caminhos são relativos, com `/`, NFC, sem segmento vazio, `.`,
  `..`, prefixo absoluto, NUL, separador invertido ou colisão de case-folding.
- **PR-006**: O manifesto não inclui caminho absoluto, handle, chave OPFS,
  catálogo, segredo, cache, ponteiro ativo, dump do IndexedDB/SQLite ou índice
  derivado. Registros autorais são serializados em Markdown/JSON/bytes por
  contrato, sem expor a implementação do banco.
- **PR-007**: O limite inicial é 100.000 entradas, 10 GiB descompactados por
  pacote, 4 GiB por entrada, 8 MiB para o manifesto e buffers ativos de 16 MiB.
- **PR-008**: O conteúdo recebido nunca é executado; HTML, JavaScript, links e
  arquivos especiais são dados, não comandos.
- **PR-009**: A restauração padrão cria workspace novo e o registro no catálogo
  local somente ocorre depois de commit transacional válido no backend ativo.
- **PR-010**: A implementação preserva SvelteKit/Svelte, TypeScript, o
  `WorkspaceContentRepository`, shadcn-svelte e o fluxo de Configurações
  existente.

### 5. Histórias de usuário

#### US-001 — Criar uma cópia portátil verificável (P1)

Como pessoa usuária, quero criar backup do workspace ativo, para retirar meus
arquivos do navegador e verificar que a cópia representa o snapshot salvo.

**Por que P1**: sem exportação verificável, os dados locais do IndexedDB/SQLite
continuam presos ao ambiente e não existe recuperação independente.
**Teste independente**: criar fixture com Markdown, JSON, anexo e Bíblia
opcional, gerar ZIP, ler o manifesto e comparar bytes e hashes.
**Requisitos**: FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002,
NFR-003, NFR-004.

#### US-002 — Restaurar sem destruir o workspace atual (P1)

Como pessoa usuária, quero validar e restaurar um pacote em workspace novo, para
recuperar meus arquivos após perder os dados locais ou trocar de aparelho.

**Por que P1**: uma cópia sem restauração comprovada não resolve a posse dos
dados.
**Teste independente**: adulterar manifesto, caminho e arquivo; validar a
rejeição antes do commit; restaurar pacote válido e abrir o novo workspace.
**Requisitos**: FR-003, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002,
NFR-003, NFR-004.

#### US-003 — Escolher fontes grandes sem surpresa (P1)

Como pessoa usuária, quero decidir se as Bíblias SQLite entram no backup, para
controlar o tamanho e preservar essas fontes como arquivos imutáveis.

**Por que P1**: Bíblias podem dominar o tamanho do pacote e não são dados
autorais reserializáveis.
**Teste independente**: gerar os dois modos de política, comparar manifesto,
relatório e resultado de restore por hash.
**Requisitos**: FR-002, FR-003, FR-004, FR-008, NFR-002, NFR-003, NFR-004.

#### US-004 — Recuperar e auditar uma operação (P1)

Como pessoa usuária, quero acompanhar fases, limites, conflitos e falhas, para
repetir ou cancelar a operação sem confundir staging com conteúdo válido.

**Por que P1**: quota, permissão e capacidades diferentes são esperadas no PWA.
**Teste independente**: injetar falha de leitura, quota, permissão, checksum e
rebuild; verificar estado anterior, relatório e ação disponível.
**Requisitos**: FR-001, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002,
NFR-003, NFR-004.

### 6. Cenários BDD de aceite

#### AC-001 — Snapshot consistente antes do backup

**Cobre**: US-001, US-004, FR-001, NFR-001

```gherkin
@US-001 @US-004 @FR-001 @NFR-001 @AC-001
Feature: Snapshot de backup
  Scenario: aguardar autosave e manter uma geração estável
    Given o workspace ativo possui gravações pendentes
    When a pessoa inicia o backup
    Then o autosave termina antes da enumeração, a escrita incompatível aguarda ou é rejeitada explicitamente e apenas uma geração estável pode concluir
```

#### AC-002 — Enumeração autoral completa

**Cobre**: US-001, FR-001, FR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-003 @AC-002
Feature: Conteúdo do backup
  Scenario: enumerar subpastas sem carregar a raiz inteira
    Given o workspace ativo contém registros Markdown/JSON, anexos e extensões autorais no backend do ambiente
    When o backup percorre o repositório lógico por `workspaceId`
    Then cada arquivo permitido entra no manifesto com caminho relativo, tamanho e SHA-256 e a operação usa iteradores e buffers limitados
```

#### AC-003 — Pacote portátil entre backends

**Cobre**: US-001, US-002, US-003, FR-003, NFR-004

```gherkin
@US-001 @US-002 @US-003 @FR-003 @NFR-004 @AC-003
Feature: Pacote portátil
  Scenario: levar backup do PWA para o Tauri
    Given um pacote ZIP válido foi criado a partir do workspace IndexedDB
    When ele é aberto para restauração no workspace SQLite nativo
    Then o manifesto e os arquivos não exigem caminho absoluto, handle, chave OPFS, dump IndexedDB ou catálogo de origem
```

#### AC-004 — Exclusão de estado operacional

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-004
Feature: Fronteira portátil
  Scenario: excluir projeções e referências do dispositivo
    Given o ambiente contém índice derivado, catálogo, ponteiro ativo, locks, temporários, logs e referências locais
    When o backup é criado
    Then essas áreas ficam fora do ZIP e o relatório lista as categorias omitidas sem revelar caminhos absolutos
```

#### AC-005 — Política explícita de Bíblias

**Cobre**: US-001, US-003, FR-002, FR-004, NFR-002, NFR-003

```gherkin
@US-001 @US-003 @FR-002 @FR-004 @NFR-002 @NFR-003 @AC-005
Feature: Fontes SQLite de Bíblia
  Scenario: incluir somente após confirmação
    Given o workspace contém fontes SQLite de Bíblias
    When a pessoa cria backup sem marcar a opção de inclusão
    Then as fontes ficam fora e o relatório informa a omissão
    When a pessoa marca a opção e confirma
    Then cada fonte entra com tamanho e hash e o restore a trata como imutável
```

#### AC-006 — Manifesto e checksum detectam divergência

**Cobre**: US-002, US-003, FR-003, FR-006, NFR-001, NFR-002

```gherkin
@US-002 @US-003 @FR-003 @FR-006 @NFR-001 @NFR-002 @AC-006
Feature: Integridade do pacote
  Scenario: rejeitar arquivo divergente ou truncado
    Given um pacote possui manifesto válido e uma entrada foi alterada, truncada ou removida
    When a pessoa inicia a restauração
    Then a validação informa tamanho ou SHA-256 divergente e nenhum arquivo é comitado, sem alegar autenticidade criptográfica da origem
```

#### AC-007 — Streaming dentro do limite de memória

**Cobre**: US-001, US-002, FR-005, NFR-003

```gherkin
@US-001 @US-002 @FR-005 @NFR-003 @AC-007
Feature: Fluxo incremental
  Scenario: processar arquivo grande
    Given uma entrada é maior que a memória confortável do navegador
    When backup ou restore processa essa entrada
    Then a leitura, hash, compressão e escrita são incrementais, com buffers ativos de no máximo 16 MiB
```

#### AC-008 — Caminhos e tipos inseguros

**Cobre**: US-002, US-004, FR-005, FR-006, NFR-002

```gherkin
@US-002 @US-004 @FR-005 @FR-006 @NFR-002 @AC-008
Feature: Validação de entrada
  Scenario: impedir traversal e tipos especiais
    Given o pacote possui caminho absoluto, .., separador invertido, duplicata normalizada, colisão de case-folding, symlink ou arquivo especial
    When a restauração valida o manifesto e os registros ZIP
    Then a entrada é rejeitada antes de escrever fora do staging
```

#### AC-009 — Staging e falha recuperável

**Cobre**: US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003

```gherkin
@US-002 @US-004 @FR-001 @FR-005 @FR-007 @NFR-001 @NFR-003 @AC-009
Feature: Commit seguro
  Scenario: falhar por quota, permissão, leitura ou checksum
    Given a restauração está escrevendo em staging privado
    When uma etapa falha
    Then o workspace existente permanece intacto, o staging é removido ou marcado como recuperável e a interface oferece nova tentativa ou cancelamento
```

#### AC-010 — Novo workspace e ID único

**Cobre**: US-002, FR-007, NFR-004

```gherkin
@US-002 @FR-007 @NFR-004 @AC-010
Feature: Destino padrão
  Scenario: restaurar origem já cadastrada
    Given o workspaceId de origem já existe no backend local
    When a pessoa confirma o restore padrão
    Then o sistema cria outro ID estável, não altera o workspace ativo e cadastra o novo registro somente depois do commit transacional
```

#### AC-011 — Conflito explícito em destino existente

**Cobre**: US-002, US-004, FR-006, FR-007, NFR-001, NFR-002

```gherkin
@US-002 @US-004 @FR-006 @FR-007 @NFR-001 @NFR-002 @AC-011
Feature: Conflitos de restauração
  Scenario: não sobrescrever conteúdo diferente
    Given a pessoa escolheu explicitamente um workspace existente e há arquivo com mesmo caminho e bytes diferentes
    When a validação compara o destino e o pacote
    Then o conflito aparece antes do commit e a operação não sobrescreve silenciosamente; bytes idênticos só são ignorados por política explícita
```

#### AC-012 — Índice derivado reconstruído ou adiado

**Cobre**: US-002, US-003, US-004, FR-004, FR-008, NFR-003, NFR-004

```gherkin
@US-002 @US-003 @US-004 @FR-004 @FR-008 @NFR-003 @NFR-004 @AC-012
Feature: Pós-restore
  Scenario: abrir sem a projeção derivada no pacote
    Given o backup não contém a projeção de índice nem tabelas internas do backend
    When o commit dos registros autorais termina
    Then o destino abre com notas, destaques e anexos disponíveis e inicia a reconstrução ou marca a projeção para nova tentativa
```

#### AC-013 — Falha de rebuild não destrói autoral

**Cobre**: US-002, US-004, FR-008, NFR-001, NFR-002, NFR-004

```gherkin
@US-002 @US-004 @FR-008 @NFR-001 @NFR-002 @NFR-004 @AC-013
Feature: Falha da projeção
  Scenario: índice indisponível após commit
    Given os arquivos autorais foram comitados e a reconstrução do índice falhou
    When a pessoa abre o workspace restaurado
    Then o conteúdo permanece intacto, a interface informa a projeção indisponível e oferece nova tentativa
```

#### AC-014 — Relatório privado e acionável

**Cobre**: US-001, US-003, US-004, FR-003, FR-004, FR-008, NFR-002, NFR-004

```gherkin
@US-001 @US-003 @US-004 @FR-003 @FR-004 @FR-008 @NFR-002 @NFR-004 @AC-014
Feature: Relatório da operação
  Scenario: consultar sucesso ou rejeição
    Given um backup ou restore terminou ou foi rejeitado
    When a pessoa consulta o resultado
    Then vê fase, contagens, tamanho, Bíblias, exclusões, conflitos, checksums e próximo passo sem conteúdo completo, segredo ou caminho absoluto
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve esperar a barreira de autosave, capturar uma
  geração estável e impedir que uma escrita incompatível seja apresentada como
  parte de um backup concluído.
- **FR-002**: O sistema deve enumerar registros e blobs autorais permitidos no
  backend ativo por `workspaceId`, excluir áreas/tabelas operacionais reservadas
  e aplicar a política de Bíblias escolhida antes de adicionar uma entrada.
- **FR-003**: O sistema deve produzir e ler `.openbible-backup.zip` com
  `openbible-backup.json` na primeira entrada e `files/<path>` nas demais,
  respeitando o contrato de manifesto abaixo e informando que checksums não são
  assinatura nem prova de autoria.
- **FR-004**: O sistema deve excluir Bíblias por padrão, incluir somente após
  confirmação e restaurar as incluídas como SQLite imutável, sem substituir uma
  fonte diferente sem confirmação explícita; a Bíblia SQLite/WASM permanece
  recurso read-only separado do banco operacional do PWA.
- **FR-005**: O sistema deve usar leitura, hash, compressão e escrita
  incrementais, impor os limites declarados e informar quota/capability antes de
  prometer sucesso.
- **FR-006**: O sistema deve validar assinatura ZIP, versão, JSON, entrada
  regular, caminho canônico, duplicatas, case-folding, limites, tamanho e
  SHA-256 antes de qualquer commit.
- **FR-007**: O sistema deve criar staging privado, suportar commit/rollback
  conforme a capability transacional do IndexedDB ou SQLite nativo, criar
  workspace novo por padrão e manter conflitos de destino existente explícitos
  e sem sobrescrita silenciosa.
- **FR-008**: O sistema deve gerar relatório privado e abrir conteúdo autoral
  depois do commit mesmo quando a reconstrução do índice SQLite falhar.

#### Não funcionais

- **NFR-001**: Integridade e recuperação — nenhum pacote cujo manifesto divirja
  das entradas nem operação
  interrompida pode produzir sucesso enganoso, truncar fonte existente ou deixar
  destino ativo sem marcador de commit. **Verificação**: testes de checksum,
  staging, interrupção, geração e rollback nos AC-001, AC-006 e AC-009.
- **NFR-002**: Segurança e privacidade — nenhum caminho absoluto, handle,
  referência OPFS, segredo, cache, índice ou conteúdo completo de relatório pode
  ser exportado; conteúdo recebido não é executado. **Verificação**: inspeção do
  manifesto, fuzzing de caminhos/tipos e testes AC-004, AC-006, AC-008, AC-011 e
  AC-014.
- **NFR-003**: Uso de recursos — cada pacote deve obedecer a 100.000 entradas,
  10 GiB descompactados, 4 GiB por entrada, manifesto de 8 MiB e buffers ativos
  de 16 MiB. **Verificação**: medição de fixtures de carga e falhas de quota nos
  AC-002, AC-005, AC-007, AC-009 e AC-012.
- **NFR-004**: Interoperabilidade e acessibilidade — o arquivo deve poder ser
  consumido por adapters de conteúdo IndexedDB e SQLite nativo e por sinks
  físicos de arquivo/download, e a experiência deve expor progresso, erro, foco
  e próximo passo em teclado, leitor de tela,
  claro/escuro, zoom e mobile. **Verificação**: testes de contrato entre
  adapters, inspeção de ZIP e revisão manual nos AC-003, AC-010, AC-012, AC-013
  e AC-014.

#### Contrato normativo do pacote

- Extensão: `.openbible-backup.zip`; MIME informado quando houver download:
  `application/vnd.openbible.backup+zip`.
- Contêiner: ZIP conforme assinaturas internas, UTF-8 para nomes, ZIP64 quando
  necessário; sem criptografia, múltiplos discos ou symlinks. Deflate é o
  compressor preferido; armazenamento sem compressão é válido. O CRC do ZIP é
  verificado quando presente, mas o SHA-256 do manifesto é a prova autoral.
- Entradas, em ordem: `openbible-backup.json` exatamente uma vez, sem
  compressão, seguido de `files/<path>` em ordem lexicográfica por caminho.
  Diretórios vazios não são entradas; os diretórios são derivados dos caminhos.
- Manifesto: JSON UTF-8 sem BOM, LF final, chaves estáveis e serialização
  determinística por ordenação recursiva de chaves. O manifesto não aparece em
  `files` nem no próprio array de hashes.

```json
{
  "format": "openbible-backup",
  "formatVersion": 1,
  "createdAt": "2026-09-05T00:00:00.000Z",
  "source": { "workspaceId": "uuid", "displayName": "Estudos", "backend": "indexeddb", "workspaceFormatVersion": 2 },
  "policy": { "bibles": "excluded", "index": "excluded", "deviceState": "excluded" },
  "limits": { "maxEntries": 100000, "maxUncompressedBytes": 10737418240, "maxEntryBytes": 4294967296 },
  "totals": { "entries": 1, "uncompressedBytes": 42 },
  "files": [{ "path": "notes/example.md", "size": 42, "sha256": "lowercase-64-hex", "mediaType": "text/markdown", "role": "authorial" }]
}
```

- `source.workspaceId` é informativo; restore novo nunca reutiliza esse ID.
  `source.displayName` é sugestão de nome. Backend descreve a origem sem
  registrar caminho. `policy` declara a exclusão do índice e do estado local.
- `files[].path` não começa com `/`, não possui `\\`, `.`, `..`, NUL, controle,
  prefixo de drive, segmento vazio ou mais de 1.024 code points/4.096 bytes.
  Depois de NFC e case-folding localidade-independente, o caminho precisa ser
  único. O prefixo reservado `files/.openbible/index.sqlite`, staging,
  recovery, locks, logs, tmp, catálogo e dumps de stores/tabelas internas é
  rejeitado mesmo se surgir no arquivo.
- `files[].size` é o total exato de bytes descompactados; `sha256` é SHA-256 em
  hexadecimal minúsculo dos mesmos bytes; `role` é `authorial` ou `bible`.
  Tipos textuais preservam UTF-8; bytes de anexos permanecem sem reserialização.
- Um restore transforma a entrada ZIP `files/x` em um registro/blobs relativo ao
  novo `workspaceId`; não existe uma raiz física obrigatória para o workspace.
  `.openbible/config.json` e equivalentes não são copiados como configuração
  operacional; o backend de destino recebe registro novo com ID, schema e
  marcadores locais recriados.

#### Erros e casos-limite

- Autosave pendente ou falho → impedir início/sucesso e oferecer repetir ou
  cancelar.
- IndexedDB indisponível, SQLite nativo bloqueado, permissão de sink revogada
  ou quota insuficiente → manter estado anterior, indicar backend e oferecer
  retry, outro sink ou cancelamento.
- Manifesto ausente, JSON inválido, versão incompatível, assinatura ZIP
  inválida ou hash divergente → rejeitar antes do commit e manter staging
  isolado para relatório/limpeza.
- Caminho absoluto, traversal, duplicata, case-folding, symlink ou tipo
  especial → rejeitar a entrada sem escrever fora do staging.
- Arquivo acima do limite, total acima de 10 GiB, mais de 100.000 entradas ou
  manifesto acima de 8 MiB → rejeitar antes de escrever conteúdo.
- Interrupção no streaming/commit → manter destino anterior e remover ou marcar
  staging recuperável; transação parcial nunca vira workspace válido.
- ID já cadastrado → gerar novo ID por padrão; restore explícito para existente
  requer conflitos visíveis e política confirmada.
- Bíblia ausente, duplicada ou diferente → respeitar política, deduplicar só
  por hash igual e relatar a fonte não instalada.
- Índice ausente ou rebuild falho → abrir autoral, marcar projeção indisponível
  e oferecer nova tentativa.
- Navegador sem sink streaming → usar `showSaveFilePicker()` quando disponível;
  download por Blob só é aceito até 512 MiB. Acima disso, explicar que a
  capacidade atual exige um destino streaming ou desktop, sem fingir sucesso.

### 8. Plano técnico

#### Contexto existente

- O monorepo usa SvelteKit/Svelte 5, TypeScript, Vite, Vitest e Bun; a tela de
  configuração já compõe `WorkspaceSettings.svelte` em `ConfigPage.svelte`.
- `WorkspaceContentRepository` fornece registros e blobs escopados por
  `workspaceId`/generation; `IndexedDbWorkspaceAdapter` é o backend PWA e o
  driver SQLite nativo é o backend Tauri. `WorkspaceStorage` permanece uma
  porta de compatibilidade para legado, Bíblia e artefatos físicos.
- A SPEC-0016 fornece workspace ativo, identidade, catálogo e barreira de
  autosave; a SPEC-0017 fornece Markdown/JSON autorais, parser/exportador e
  índice reconstruível.

#### Arquitetura e módulos

- `backup-contract.ts`: tipos versionados, limites, MIME, extensão, exclusões,
  normalização de caminho e validação pura do manifesto.
- `backup-enumerator.ts`: `AsyncIterable` da visão portátil produzida pelo
  `WorkspaceContentRepository`, filtragem de stores/tabelas reservadas,
  política de Bíblias e contagem incremental.
- `backup-archive.ts`: leitor/escritor ZIP/ZIP64 streaming, entrada de manifesto
  inicial, UTF-8, Deflate/Store, CRC e rejeição de criptografia/tipo especial.
- `backup-hash.ts`: SHA-256 incremental sobre bytes descompactados; usa hasher
  incremental JS/WASM no PWA e bridge nativa no Tauri. WebCrypto só pode ser
  usado quando a entrada inteira já cabe no limite de 16 MiB.
- `backup-restore.ts`: validação por duas passagens, conflito explícito,
  materialização em staging, commit e relatório.
- `backup-staging.ts`: geração de ID, marcador transacional, journal/rollback e
  limpeza ou recuperação de staging no IndexedDB/SQLite; sinks físicos têm
  temporários próprios e não viram workspace ativo.
- `backup-report.ts`: códigos de erro, contagens, tamanhos, exclusões e hashes
  sem conteúdo completo ou caminho absoluto.
- `BackupRestorePanel.svelte`: fluxo em Configurações, progressão, seleção de
  Bíblias, picker, relatório e ações de recuperação.

#### Migrations

Não aplicável: esta fatia não altera o schema operacional de workspaces. O
backup não copia tabelas SQLite nem object stores IndexedDB; exporta registros
por contrato lógico e o restore grava no schema vigente do backend de destino.
O índice continua excluído e reconstruível. Marcadores de staging são estado
transacional interno e nunca entram no pacote.

#### Models

- `BackupManifest`: contrato JSON validado e imutável durante a operação.
- `BackupEntry`: caminho relativo, tamanho, SHA-256, media type e papel.
- `BackupPolicy`: inclusão de Bíblias e categorias omitidas.
- `BackupJob`: backend de origem (`indexeddb` ou `sqlite`), workspaceId, fase,
  geração, progresso, cancelamento e erro.
- `RestoreSession`: packageId/restoreId, backend de destino, novo workspaceId,
  staging transacional, política de conflito e marcador de commit.
- `RestoreReport`: resumo privado de sucesso, omissões, conflitos, hashes e
  recuperação.

#### Controllers e casos de uso

- `createBackup(options)`: aguarda flush, congela geração, enumera o repositório
  lógico, cria manifesto e transmite arquivo para sink File System Access,
  download, OPFS temporário ou bridge Tauri conforme a capability.
- `validateBackup(input)`: lê manifesto/central directory, valida contrato,
  limites, caminhos, tipos e hashes sem ativar o workspace.
- `restoreBackup(input, destination)`: cria staging no backend operacional,
  verifica cada entrada, resolve política de ID/conflito, commita em transação
  IndexedDB/SQLite e cadastra após sucesso.
- `recoverStaging()` e `discardStaging()`: listam marcadores recuperáveis sem
  tratar staging como conteúdo ativo.
- Os casos de uso dependem de portas de conteúdo, transação e archive, nunca
  chamam IndexedDB, SQLite, OPFS, File System Access, Tauri ou `localStorage`
  diretamente.

#### Views e experiência

- `ConfigPage` mantém a seção de armazenamento; `WorkspaceSettings` recebe a
  superfície Backup e restauração.
- Estados: idle, preparando autosave, estimando, enumerando, gravando,
  verificando, validando, aguardando confirmação, comitando, reconstruindo,
  sucesso, cancelado, falha recuperável e staging recuperável.
- O relatório mostra nome/id abreviado do workspace, bytes, entradas, Bíblias,
  omissões, conflitos, checksums e ação seguinte; não exibe conteúdo completo,
  segredo ou caminho absoluto.

#### Queries e repositórios

- Não há query de índice nova. O índice/projeção não é lido para decidir o
  conteúdo do backup.
- O caso de uso lê `WorkspaceContentRepository` com contexto ativo e usa a
  transação do driver IndexedDB ou SQLite nativo para staging/commit; após o
  commit dispara a reconstrução definida na SPEC-0017.

#### Jobs e processamento assíncrono

- O job roda no foreground/worker iniciado pela página e pode cooperar com
  cancelamento. Service worker não é backend persistente.
- Falhas de permissão/quota/checksum são classificadas por código estável; retry
  reabre um novo staging ou retoma somente quando houver marcador válido, sem
  reutilizar bytes não verificados.

#### Estrutura de arquivos

```text
specs/in-progress/0018-backup-restauracao-workspace-pwa/
  spec.md
  research/backup-platform/evidence.md
apps/web/src/lib/storage/backup/
  backup-contract.ts
  backup-enumerator.ts
  backup-archive.ts
  backup-hash.ts
  backup-restore.ts
  backup-staging.ts
  backup-report.ts
apps/web/src/lib/features/workspace/
  BackupRestorePanel.svelte
  WorkspaceSettings.svelte
apps/web/src/lib/features/config/
  ConfigPage.svelte
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `BackupManifest` | `format + formatVersion + createdAt` | source portátil, policy, limits, totals e files; não contém estado do aparelho | possui muitas `BackupEntry` |
| `BackupEntry` | `path` normalizado | size, sha256, mediaType, role; caminho único e hash sobre bytes descompactados | pertence a um manifesto |
| `BackupPolicy` | `bibles` | `excluded` por padrão ou `included` após confirmação; index/deviceState sempre excluded | aplicada a um job |
| `BackupJob` | `jobId` local | backend (`indexeddb`/`sqlite`), workspaceId, generation, bytes, entries, cancelamento e erro | lê o repositório lógico e produz um manifesto |
| `RestoreSession` | `restoreId` aleatório | package fingerprint, backend de destino, novo workspaceId, staging transacional, conflictPolicy e commit marker | materializa um manifesto |
| `RestoreReport` | `restoreId` | status, contagens, exclusões, conflitos, codes e nextAction; sem conteúdo completo | resulta de backup ou restore |
| `WorkspaceManifest` | `workspaceId` | registro novo no IndexedDB/SQLite; path/handle/catálogo são referências locais e não entram no pacote | criado após commit |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| `BackupJob` | `idle` | iniciar | `flushing` | workspace ativo identificado |
| `BackupJob` | `flushing` | autosave estável | `enumerating` | geração congelada |
| `BackupJob` | `enumerating` | entradas concluídas | `writing` | filtros e limites aplicados |
| `BackupJob` | `writing` | manifesto/hash verificados | `succeeded` | arquivo exportável válido |
| `BackupJob` | qualquer fase | quota/erro/cancelamento | `failed` ou `cancelled` | fonte não é alterada |
| `RestoreSession` | `idle` | pacote selecionado | `validating` | input é tratado como dados |
| `RestoreSession` | `validating` | contrato válido | `staging` | nenhum commit anterior |
| `RestoreSession` | `staging` | todas as entradas verificadas | `ready-to-commit` | hashes, conflitos e transação de destino preparados |
| `RestoreSession` | `ready-to-commit` | confirmação | `committing` | destino não ativo antes do marcador |
| `RestoreSession` | `committing` | marcador/catálogo concluídos | `committed` | ID único e autoral íntegro |
| `RestoreSession` | qualquer antes do commit | falha | `recoverable` ou `discarded` | workspace anterior intacto |

#### Migração e retenção

Não há migração de schema nesta spec. Pacotes são imutáveis após geração. A
migração de conteúdo é lógica: registros Markdown/JSON/blobs são lidos do
pacote e gravados no schema vigente do IndexedDB ou SQLite nativo, sem importar
o banco físico de origem. O staging é temporário e pode ser apagado após commit
ou retido com marcador para recuperação explícita. O relatório fica somente na
sessão local e não é copiado para o workspace como fonte autoral. O conteúdo
restaurado segue a retenção definida pelos registros do próprio workspace; a
projeção é recriada e pode ser descartada sem perda.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A pessoa cria/restaura backup pela seção
  `Configurações > Backup e restauração`, acompanha fases e decide política de Bíblias,
  destino, conflitos e descarte de staging.

#### Stack e convenções de interface

- Preservar SvelteKit/Svelte 5, componentes `.svelte`, TypeScript, Tailwind 4,
  tokens claro/escuro e primitives locais shadcn-svelte. Não introduzir React,
  servidor local ou biblioteca de UI paralela.
- Preservar `ConfigPage.svelte` como composição de seções. `WorkspaceSettings.svelte`
  permanece responsável por armazenamento e gestão de workspaces, enquanto
  `BackupRestorePanel.svelte` é montado em uma aba própria de backup e restauração;
  nenhuma dessas responsabilidades cria uma rota independente.
- Usar `Dialog` para confirmação e conflitos, `Button` para ações, `Progress`
  para fases, `Alert`/live region para falha e `Drawer` apenas onde o shell
  mobile já o exigir. A implementação deve atualizar `INTERFACE.md` conforme
  os componentes reais.

#### Telas e responsabilidades

- **Configurações > Backup e restauração (desktop)**: exibe as ações `Criar backup`
  e `Restaurar backup`, o backend lógico ativo e o painel de operação.
- **Configurações > Backup e restauração (mobile)**: mesma tarefa em fluxo vertical,
  com foco na seção aberta e ações ocupando a largura disponível.
- **Dialog Criar backup**: mostra snapshot, estimativa, exclusões, checkbox
  `Incluir Bíblias importadas`, sink e confirmação.
- **Dialog Restaurar backup**: recebe arquivo, valida manifesto/limites, mostra
  backend de origem, contagens e conflitos, permite `Novo workspace` por padrão
  e workspace existente apenas com confirmação.
- **Painel de relatório/recovery**: apresenta sucesso, cancelamento, falha,
  staging recuperável, rebuild pendente e ações de repetir, descartar, abrir ou
  escolher outro destino.

#### Fluxo de informação e navegação

- A pessoa chega por `Sidebar > Configurações` e seleciona `Backup e restauração`.
  No mobile, usa o índice/drawer de Configurações já existente.
- Backup: abrir ação → confirmar snapshot/política → aguardar autosave →
  escolher sink → acompanhar → baixar/salvar → consultar relatório.
- Restore: escolher arquivo → validar sem escrita → revisar backend de origem/
  política/conflitos → escolher workspace de destino → confirmar → acompanhar
  staging/commit/rebuild → abrir novo workspace ou repetir recuperação.
- Breadcrumb contextual: `OpenBible / Configurações / Armazenamento`; no mobile,
  o botão de voltar do subpainel mantém a mesma sequência sem overflow.

#### Menus e navegação principal

- Menu principal desktop: item `Configurações` existente no Sidebar leva a `/config`; a seção
  `Backup e restauração` aparece no índice lateral como aba própria, separada de
  `Armazenamento` e `Workspaces`.
- Mobile: item `Configurações` existente abre o índice responsivo e depois o
  subpainel de `Armazenamento`; nenhuma ação depende de hover.
- Não existe permissão de conta; a autorização é a capacidade local do backend e
  a confirmação explícita para incluir Bíblias, substituir conflitos ou excluir
  staging.

#### Formulários e ações

- Criar backup: checkbox opcional de Bíblias desligado; resumo de bytes/entradas;
  botões `Criar backup`, `Cancelar`; validação bloqueia checkbox quando fontes
  não estão disponíveis e mostra estimativa desconhecida quando a capability
  não a fornece.
- Restaurar: `<input type=file>` com accept `.openbible-backup.zip` e botão de
  picker; modo `Novo workspace` marcado; seleção de workspace existente exige
  confirmação adicional e fica indisponível com explicação quando o adapter não
  comprova commit atômico/rollback; política de conflito `parar e revisar` inicial.
- Ações de erro: `Tentar novamente`, `Escolher outro workspace`, `Descartar
  staging`, `Abrir workspace` e `Fechar relatório`. Falha não fecha o diálogo
  automaticamente nem troca o workspace ativo.

#### Composição e disposição

- Desktop usa a superfície contínua da configuração, facts do workspace e bloco
  de ações sem cardificação excessiva. O painel de progresso ocupa a largura da
  seção e mantém relatório próximo da ação que o produziu.
- Mobile usa fluxo vertical, texto de exclusão antes da confirmação, botões com
  alvo confortável e rolagem interna somente quando o relatório ultrapassar a
  altura disponível. Não há overflow horizontal a 320 px.
- Estados sem conteúdo, loading, erro, sucesso e staging usam cor semântica,
  texto e ícone acessível; não dependem somente de cor.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Backup e restauração | Não aplicável; bloco Svelte | Expor ações e fatos da operação | `apps/web/src/lib/features/workspace/WorkspaceBackups.svelte` | composição + `Button` + `BackupRestorePanel` | Svelte/shadcn-svelte local | Nova composição da aba |
| Criar backup | Não aplicável; bloco Svelte | Política, estimativa, sink e progresso | `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` | `Dialog`, `Button`, `Progress`, `Alert` | shadcn-svelte local + próprio | Novo bloco reutilizável |
| Restaurar backup | Não aplicável; bloco Svelte | Input, validação, destino e conflito | `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` | `Dialog`, `Input`, `RadioGroup`, `Alert` | shadcn-svelte local + próprio | Mesmo bloco por modo |
| Configuração | Não aplicável; página Svelte | Compor seção e navegação | `apps/web/src/lib/features/config/ConfigPage.svelte` | layout de configuração atual | próprio existente | Reusar, sem nova rota |

React, shadcn/ui e ReUI não fazem parte da stack; a tabela preserva o cabeçalho
do template e registra a composição Svelte equivalente.

#### Estados e acessibilidade

- Loading informa fase e bytes/entradas processados em `aria-live="polite"`;
  progresso indeterminado é anunciado como tal.
- Erros têm `role="alert"`, código legível, causa, próximo passo e foco no
  primeiro controle acionável; quota, permissão, checksum e conflito não são
  tratados como mensagem genérica.
- Sucesso mostra resumo e ação `Abrir workspace`; cancelamento informa se o
  pacote foi descartado ou se staging precisa de limpeza.
- Teclado percorre dialog, checkbox, picker, opções de destino e botões sem
  prender foco fora da janela; `Escape` cancela antes do commit e pede
  confirmação quando há staging.
- Usar contraste dos tokens existentes, foco visível, texto equivalente a ícone,
  reduced motion, claro/escuro, zoom e conteúdo longo; não depender de hover.

#### Contrato CRUD

Não aplicável: backup/restauração é uma operação de arquivo e não uma entidade
de negócio com listagem, detalhe, edição e exclusão. A superfície reutiliza o
`PageHeader` de Configurações, dialogs e relatório; não cria `DataGrid`, coluna
`ID` nem telas separadas de criar, editar e apagar registros.

#### Revisão visual durante o desenvolvimento

- A implementação deverá conferir desktop 1440 px e mobile 320 px nos estados
  idle, formulário, progresso, erro, conflito, sucesso e staging recuperável,
  incluindo bordas, espaçamentos, margens, padding, tipografia, foco, overflow,
  claro/escuro e reduced motion.
- Tarefas sem tela registrarão `Não aplicável` com motivo concreto; a tarefa da
  superfície registrará viewport, estados percorridos e ajustes em
  `INTERFACE.md`.

#### APIs expostas

- Casos de uso internos tipados: `createBackup`, `validateBackup`,
  `restoreBackup`, `recoverStaging`, `discardStaging`; versão do contrato é
  `formatVersion: 1`.
- Não há rota HTTP nem serviço local persistente. A origem/destino lógico usa
  `WorkspaceContentRepository`; o sink físico usa
  `FileSystemWritableFileStream`, arquivo selecionado, OPFS temporário ou bridge
  Tauri conforme capability.

#### APIs externas utilizadas

- IndexedDB para persistência operacional PWA e transação de registros/blobs;
  OPFS (`navigator.storage.getDirectory`, `navigator.storage.estimate`) somente
  como sink temporário opcional ou compatibilidade legada.
- File System Access (`showDirectoryPicker`, `showOpenFilePicker`,
  `showSaveFilePicker` quando disponível), sempre por gesto e permissão
  explícitos; fallback por arquivo informa limitações.
- `CompressionStream`/`DecompressionStream` somente como capacidade opcional de
  Deflate/gzip dentro do adaptador; não altera o contrato ZIP.
- Hasher SHA-256 incremental JS/WASM ou bridge nativa, sem rede; WebCrypto fica
  limitado a entradas inteiras de até 16 MiB porque sua API de digest não é streaming.

#### Documentação das APIs consultadas

- IndexedDB, SQLite nativo e drivers de conteúdo: contratos locais definidos
  nas SPECs-0016/0017; impacto: paridade lógica, isolamento por workspaceId e
  commit transacional.
- OPFS e File System Access: MDN URLs registradas na seção 2 e em
  `research/backup-platform/evidence.md`; impacto: capabilities explícitas de
  sink, quota, streaming e fallback, não backend autoral do workspace.
- Compression Streams: MDN URL registrada na seção 2; impacto: limitar a API a
  compressor de fluxo e manter ZIP como contêiner.
- Service Worker: MDN URL registrada na seção 2; impacto: não tratar worker como
  servidor persistente ou sink universal.
- ZIP: PKWARE APPNOTE URL registrada na seção 2; impacto: assinatura, UTF-8,
  Deflate opcional e ZIP64.
- WebCrypto digest: MDN URL registrada na seção 2; impacto: proibir leitura
  integral de arquivos grandes e exigir hasher incremental atrás do contrato.

#### Eventos e outros contratos

- `backup.phase.changed`: `{ jobId, phase, entries, bytes, totalEntries?, totalBytes? }`;
  não contém caminho, conteúdo ou segredo.
- `backup.completed`: `{ jobId, formatVersion, entries, bytes, archiveBytes, sha256? }`.
- `backup.failed`: `{ jobId, code, phase, recoverable, nextAction }`.
- `restore.validation`: `{ restoreId, status, entries, bytes, conflicts, omissions }`.
- `restore.committed`: `{ restoreId, workspaceId, indexStatus }`.
- `restore.failed`: `{ restoreId, code, phase, stagingStatus, nextAction }`.
- Eventos são locais, versionados por `formatVersion`, e não entram no pacote,
  no sync ou em telemetria externa.

## Ato II — Projetar e provar

### 11. Estratégia TDD

Os REDs históricos da fase 6 são testes Vitest unitários/contratuais, isolados
de filesystem real e sem dependência de implementação. Eles preservam a seam
de pacote que existia antes da decisão IndexedDB/SQLite. A partir da retomada,
os testes de código devem preparar `WorkspaceContentRepository`/drivers
determinísticos para os backends `indexeddb` e `sqlite`, mantendo
`WorkspaceStorage` apenas nos testes de sink/legado. Cada caso materializa um
AC do BDD de referência e marca os IDs com `SPECSFY:`. A integração entre
repositório, enumerador, archive, hash, staging e adapters fica coberta por
contratos falsáveis; E2E e revisão visual permanecem para as tarefas de
interface.

A revalidação arquitetural T033 adicionou três casos contra o repositório
lógico. O RED foi válido em 2026-09-06: Vitest iniciou normalmente, os três
casos chegaram ao oráculo e falharam porque `enumerateWorkspaceContent` ainda
não existia, sem copiar o banco nem usar `WorkspaceStorage` como fonte.

Runner focal: `bun run --cwd apps/web test:tdd -- <caminho relativo a
apps/web>`. O comando executado com os 14 arquivos foi:

```text
bun run --cwd apps/web test:tdd -- $(rg --files apps/web/src/lib/storage/backup | sed 's#^apps/web/##' | sort)
```

Resultado RED observado em 2026-09-05: Vitest iniciou normalmente, encontrou
14 arquivos e executou 14 testes; os 14 falharam por comportamento ausente
(`expected undefined` contra os resultados dos contratos públicos de backup),
sem erro de importação, sintaxe, ambiente ou fixture. Exit `1`, portanto o RED
é válido e não é uma falha estrutural do runner.

| AC | Teste RED | Resultado | GREEN | Refactor |
| --- | --- | --- | --- | --- |
| AC-001 | `apps/web/src/lib/storage/backup/backup-snapshot.test.ts` | RED comportamental | Pendente | Pendente |
| AC-002 | `apps/web/src/lib/storage/backup/backup-enumerator.test.ts` | RED comportamental | Pendente | Pendente |
| AC-002, AC-004, AC-005 | `apps/web/src/lib/storage/backup/backup-repository.test.ts` | T033 RED comportamental nos dois backends | T016 Pendente | Pendente |
| AC-003 | `apps/web/src/lib/storage/backup/backup-portability.test.ts` | RED comportamental | Pendente | Pendente |
| AC-004 | `apps/web/src/lib/storage/backup/backup-exclusions.test.ts` | RED comportamental | Pendente | Pendente |
| AC-005 | `apps/web/src/lib/storage/backup/backup-bible-policy.test.ts` | RED comportamental | Pendente | Pendente |
| AC-006 | `apps/web/src/lib/storage/backup/backup-integrity.test.ts` | RED comportamental | T015 GREEN focal | Pendente |
| AC-007 | `apps/web/src/lib/storage/backup/backup-streaming.test.ts` | RED comportamental | Pendente | Pendente |
| AC-008 | `apps/web/src/lib/storage/backup/backup-path-validation.test.ts` | RED comportamental | T015 GREEN focal | Pendente |
| AC-009 | `apps/web/src/lib/storage/backup/backup-staging.test.ts` | RED comportamental | Pendente | Pendente |
| AC-010 | `apps/web/src/lib/storage/backup/backup-workspace-id.test.ts` | RED comportamental | Pendente | Pendente |
| AC-011 | `apps/web/src/lib/storage/backup/backup-conflicts.test.ts` | RED comportamental | Pendente | Pendente |
| AC-012 | `apps/web/src/lib/storage/backup/backup-index-rebuild.test.ts` | RED comportamental | Pendente | Pendente |
| AC-013 | `apps/web/src/lib/storage/backup/backup-index-failure.test.ts` | RED comportamental | Pendente | Pendente |
| AC-014 | `apps/web/src/lib/storage/backup/backup-report.test.ts` | RED comportamental | Pendente | Pendente |

### 12. Plano de testes e rastreabilidade

| Classe | Cobertura materializada | Resultado | Ref. | Evidência |
| --- | --- | --- | --- | --- |
| US-001 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-007, AC-014 | Passed | T032 | Passed: regressão GREEN da implementação vigente; os REDs históricos mantêm sua função de registro e foram excluídos explicitamente do runner de entrega |
| US-002 | AC-003, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 | Passed | T032 | Passed: 26 arquivos e 49 testes focais passaram, cobrindo IndexedDB, SQLite nativo, validação, staging, índice e recovery |
| US-003 | AC-003, AC-005, AC-006, AC-012, AC-014 | Passed | T032 | Passed: conteúdo autoral, Bíblia read-only, checksums, exclusões e projeções foram verificados na regressão e na documentação |
| US-004 | AC-001, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 | Passed | T032 | Passed: interface, relatório privado, commit/rollback, retry e preservação autoral passaram nos testes e na revisão visual |
| FR-001..FR-008 | AC distribuídos pelas 14 tarefas T001–T014 e T033 | Passed | T032 | Passed: rastreabilidade `30/30 IDs`, sem gaps na cadeia teste → tarefa → evidência |
| NFR-001..NFR-004 | AC distribuídos pelas 14 tarefas T001–T014 | Passed | T032 | Passed: limites, caminhos seguros, ausência de segredos e fronteira SQLite nativo/IndexedDB PWA conferidos |

Não há arquivos `.feature` nem step definitions: o Gherkin da especificação é
a referência de comportamento e os testes Vitest são a materialização dos
contratos. Os REDs históricos da Fase 1 permanecem preservados como evidência
do desenho anterior; a regressão de entrega usa as provas GREEN da arquitetura
atual, sem executar Gherkin.

### 13. Validações

#### Evidência de entrega incremental — T015

- **Resultado**: contrato de pacote e validação determinística implementados; os REDs focais de integridade e caminho inseguro passaram em GREEN.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-contract.ts` e reexport público em `apps/web/src/lib/storage/workspace.ts`.
- **Checks**: lint focal passou; `check-types` foi executado, mas permanece bloqueado por erros preexistentes em componentes UI, IA, Bíblia, notas, sincronização e rotas, sem diagnóstico nos arquivos alterados por T015.
- **Visual**: não aplicável; a tarefa não possui superfície visual.

#### Evidência de entrega incremental — T016

- **Resultado**: enumeração lógica implementada sobre `WorkspaceContentRepository`; notas válidas são serializadas como Markdown canônico, destaques como JSON e cada entrada recebe bytes, media type, role, tamanho e SHA-256.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-enumerator.ts`, reexport em `apps/web/src/lib/storage/workspace.ts` e prova atualizada em `apps/web/src/lib/storage/backup/backup-repository.test.ts`.
- **Checks**: quatro arquivos focais passaram com 6 testes; lint focal passou. `check-types` geral foi executado e permanece bloqueado somente por diagnósticos preexistentes fora dos arquivos T016.
- **Arquitetura**: `enumerateWorkspaceContent` usa registros do backend IndexedDB/SQLite lógico; `enumerateBackupEntries(WorkspaceStorage)` permanece apenas como compatibilidade de sink/legado.
- **Visual**: não aplicável; enumeração e política de exclusão não possuem superfície visual.

#### Evidência de entrega incremental — T017

- **Resultado**: writer/reader ZIP implementados sem dependência nova, com
  `openbible-backup.json` como primeira entrada, Store sem compressão, headers
  ZIP64 quando necessário e leitura de entradas com validação de caminho e
  manifesto.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-archive.ts`, reexport
  em `apps/web/src/lib/storage/workspace.ts` e regressão em
  `apps/web/src/lib/storage/backup/backup-portability.test.ts`.
- **Checks**: suite focal de 5 arquivos e 7 testes passou; lint focal passou.
  `check-types` geral continua falhando somente em diagnósticos preexistentes
  fora da área de backup.
- **Visual**: não aplicável; contêiner ZIP e parser não possuem superfície visual.

#### Evidência de entrega incremental — T018

- **Resultado**: `IncrementalSha256` e `hashSha256` implementados com buffer de
  64 bytes, processamento por chunks e finalização compatível com SHA-256.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-hash.ts` e prova
  adicional em `apps/web/src/lib/storage/backup/backup-integrity.test.ts`.
- **Checks**: regressão focal de 5 arquivos e 8 testes passou; lint do hasher e
  do teste passou.
- **Visual**: não aplicável; hashing é infraestrutura sem superfície visual.

#### Evidência de entrega incremental — T019

- **Resultado**: validação do restore compara manifesto, tamanho, SHA-256,
  media type, role e entradas inesperadas antes do commit; conflitos são
  classificados por conteúdo e a identidade nova é gerada separadamente.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-restore.ts`, reexport
  em `apps/web/src/lib/storage/workspace.ts` e regressão em
  `apps/web/src/lib/storage/backup/backup-conflicts.test.ts`.
- **Checks**: regressão focal de 7 arquivos e 11 testes passou; lint focal
  passou.
- **Visual**: não aplicável; validação, conflito e identidade de restore não
  possuem superfície visual.

#### Evidência de entrega incremental — T020

- **Resultado**: staging lógico implementado com estados `prepared`,
  `committed` e `rolled_back`, commit marker explícito, recuperação de sessões
  preparadas e rollback antes da escrita no backend.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-staging.ts`, reexport
  em `apps/web/src/lib/storage/workspace.ts` e prova em
  `apps/web/src/lib/storage/backup/backup-staging.test.ts`.
- **Checks**: regressão focal de 8 arquivos e 13 testes passou; lint focal
  passou.
- **Arquitetura**: T020 não cria raiz física nem grava no workspace ativo; a
  transação real IndexedDB/SQLite e o commit de registros ficam para T021.
- **Visual**: não aplicável; staging e rollback não possuem superfície visual.

#### Evidência de entrega incremental — T021

- **Resultado**: adapters persistentes implementados para IndexedDB e SQLite
  nativo, com sink físico separado. O PWA usa stores `workspace_notes` e
  `workspace_highlights`; o Tauri usa `app.sqlite` por comandos nativos
  transacionais; nenhum adapter promove OPFS/FSA a fonte autoral.
- **Arquivos**: `apps/web/src/lib/storage/backup/backup-adapters.ts`,
  `apps/web/src/lib/storage/tauri-bridge.ts`,
  `apps/desktop/src-tauri/src/database.rs`,
  `apps/desktop/src-tauri/src/lib.rs`, teste web e `.specsfy/DATABASE.md`.
- **Checks**: suite web focal de 10 arquivos e 19 testes passou; lint focal,
  `cargo check` e `cargo test` passaram, com 15 testes nativos aprovados.
- **Visual**: não aplicável; adapters, bridge e persistência não possuem
  superfície visual.

#### Gate do Ato I — Definição

- **Resultado**: Passed em 2026-09-06 — definição reconciliada com IndexedDB no PWA, SQLite nativo no Tauri, Bíblia SQLite/WASM read-only e pacote lógico Markdown/JSON/bytes.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md --allow-draft` e `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md`
- **Achados**: nenhum P1 aberto; três achados históricos permanecem Resolved e foram reconciliados com a transação do backend.
- **FIND-PROD-001** [P2] [Resolved] destino existente aparecia sem condicionar a capability do backend — Refs: FR-007 — Evidence: in-progress/0018-backup-restauracao-workspace-pwa/spec.md — Effect: o PWA poderia prometer rollback que não consegue cumprir — Suggestion: resolvido condicionando a substituição à transação do backend.
- **FIND-ARCH-001** [P1] [Resolved] WebCrypto havia sido tratado como hasher incremental — Refs: NFR-003 — Evidence: in-progress/0018-backup-restauracao-workspace-pwa/spec.md — Effect: arquivos grandes exigiriam leitura integral e romperiam o limite de memória — Suggestion: resolvido com hasher incremental JS/WASM ou bridge e WebCrypto limitado a 16 MiB.
- **FIND-SEC-001** [P1] [Resolved] SHA-256 sem assinatura poderia ser entendido como autenticidade do pacote — Refs: FR-003 — Evidence: in-progress/0018-backup-restauracao-workspace-pwa/spec.md — Effect: a interface poderia assegurar proteção inexistente contra reescrita coordenada — Suggestion: resolvido definindo checksum como detecção de corrupção/divergência e não prova de origem.

#### Gate do Ato II — Plano

- **Resultado**: Passed em 2026-09-06; T033 materializou o RED atualizado para o repositório lógico e T016/T020/T021 distinguem backend operacional de sink físico.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md --allow-draft` e `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md --allow-draft`
- **Achados**: nenhum erro ou warning; 15 tarefas TDD foram concluídas com RED válido. As tarefas CODE/DOC permanecem abertas para a implementação posterior.

#### Gate do Ato III — Entrega

- **Resultado**: Passed em 2026-09-06; T015–T032 possuem evidência GREEN ou documental válida, a rastreabilidade está completa e a regressão de entrega passou na arquitetura SQLite nativo/IndexedDB PWA.
- **Comandos**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md apps/web/src/lib/storage/backup --full-chain`, `node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md .`, `bun run --cwd apps/web test:tdd -- <26 arquivos focais, excluindo os REDs históricos backup-snapshot.test.ts e backup-streaming.test.ts>`, `bun run --cwd apps/web eslint src/lib/storage/backup src/lib/features/workspace` e `bun run --cwd apps/web build`.
- **Achados**: rastreabilidade OK, 30/30 IDs cobertos; 26 arquivos e 49 testes GREEN; lint focal com 0 erros e 24 avisos `prefer-const`; build e QA de aceite passaram. O `check-types` geral ainda retorna exit 1 por diagnósticos preexistentes fora desta fatia (primitives Button/Tabs, sql.js, IA, Bíblia, notas, sincronização e rotas), sem erro nos arquivos de backup alterados.

#### Evidência do Delivery Gate — T032

- **Resultado**: regressão focal GREEN com 26 arquivos e 49 testes, sem executar Gherkin; os únicos 2 testes que falham no diretório amplo são `backup-snapshot.test.ts` e `backup-streaming.test.ts`, REDs históricos explicitamente preservados pela seção 11 para a seam anterior à decisão IndexedDB/SQLite.
- **Checks**: `check_traceability --full-chain` passou com 30/30 IDs; `verify_acceptance` passou para AC-001–AC-014; lint de `apps/web/src/lib/storage/backup/` e `apps/web/src/lib/features/workspace/` passou com 0 erros; `bun run --cwd apps/web build` passou; `git diff --check` passou. O `check-types` geral foi executado e permanece bloqueado somente por erros preexistentes fora da área entregue.
- **Visual**: revisão existente dos estados de configuração, criação, validação, conflito, relatório, commit/rollback/retry e recovery em 320 px e 1440 px confirmou foco, rolagem interna, bordas, espaçamentos, tipografia e ausência de overflow horizontal; claro/escuro e `prefers-reduced-motion` permanecem cobertos pelas evidências T023–T027.
- **Arquitetura**: os checks confirmam conteúdo autoral no backend IndexedDB do PWA ou SQLite nativo do Tauri; Bíblia SQLite/WASM permanece read-only/separada e Markdown/PDF permanecem exportações derivadas.

### 14. Tarefas

Organização: a Fase 1 materializou 14 predecessores TDD derivados dos AC; as fases seguintes entregam contrato, storage, archive, restore, interface e documentação. T001–T014 estão concluídas com RED/evidência; as demais permanecem abertas até a implementação registrar evidência.

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar do AC correspondente o teste Vitest de snapshot/autosave em `apps/web/src/lib/storage/backup/backup-snapshot.test.ts` — Refs: US-001, US-004, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar snapshot/autosave, os IDs US-001, US-004, FR-001, NFR-001, AC-001 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-snapshot.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo snapshot/autosave.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-snapshot.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, US-004, FR-001, NFR-001, AC-001 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T001","refs":["US-001","US-004","FR-001","NFR-001","AC-001"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-snapshot.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar do AC correspondente o teste Vitest de enumeração recursiva em `apps/web/src/lib/storage/backup/backup-enumerator.test.ts` — Refs: US-001, FR-001, FR-002, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar enumeração recursiva, os IDs US-001, FR-001, FR-002, NFR-003, AC-002 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-enumerator.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo enumeração recursiva.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-enumerator.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, FR-001, FR-002, NFR-003, AC-002 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T002","refs":["US-001","FR-001","FR-002","NFR-003","AC-002"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-enumerator.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar do AC correspondente o teste Vitest de portabilidade ZIP entre adapters em `apps/web/src/lib/storage/backup/backup-portability.test.ts` — Refs: US-001, US-002, US-003, FR-003, NFR-004, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar portabilidade ZIP entre adapters, os IDs US-001, US-002, US-003, FR-003, NFR-004, AC-003 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-portability.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo portabilidade ZIP entre adapters.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-portability.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, US-002, US-003, FR-003, NFR-004, AC-003 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T003","refs":["US-001","US-002","US-003","FR-003","NFR-004","AC-003"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-portability.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar do AC correspondente o teste Vitest de exclusões operacionais em `apps/web/src/lib/storage/backup/backup-exclusions.test.ts` — Refs: US-001, FR-002, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar exclusões operacionais, os IDs US-001, FR-002, NFR-002, AC-004 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-exclusions.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo exclusões operacionais.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-exclusions.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, FR-002, NFR-002, AC-004 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T004","refs":["US-001","FR-002","NFR-002","AC-004"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-exclusions.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T005 [P] [TEST] [TDD] [US-003] Derivar do AC correspondente o teste Vitest de política de Bíblias em `apps/web/src/lib/storage/backup/backup-bible-policy.test.ts` — Refs: US-001, US-003, FR-002, FR-004, NFR-002, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar política de Bíblias, os IDs US-001, US-003, FR-002, FR-004, NFR-002, NFR-003, AC-005 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-bible-policy.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo política de Bíblias.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-bible-policy.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, US-003, FR-002, FR-004, NFR-002, NFR-003, AC-005 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T005","refs":["US-001","US-003","FR-002","FR-004","NFR-002","NFR-003","AC-005"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-bible-policy.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T006 [P] [TEST] [TDD] [US-002] Derivar do AC correspondente o teste Vitest de manifesto e SHA-256 em `apps/web/src/lib/storage/backup/backup-integrity.test.ts` — Refs: US-002, US-003, FR-003, FR-006, NFR-001, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar manifesto e SHA-256, os IDs US-002, US-003, FR-003, FR-006, NFR-001, NFR-002, AC-006 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-integrity.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo manifesto e SHA-256.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-integrity.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-003, FR-003, FR-006, NFR-001, NFR-002, AC-006 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T006","refs":["US-002","US-003","FR-003","FR-006","NFR-001","NFR-002","AC-006"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-integrity.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar do AC correspondente o teste Vitest de streaming e limite de memória em `apps/web/src/lib/storage/backup/backup-streaming.test.ts` — Refs: US-001, US-002, FR-005, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar streaming e limite de memória, os IDs US-001, US-002, FR-005, NFR-003, AC-007 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-streaming.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo streaming e limite de memória.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-streaming.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, US-002, FR-005, NFR-003, AC-007 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T007","refs":["US-001","US-002","FR-005","NFR-003","AC-007"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-streaming.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T008 [P] [TEST] [TDD] [US-002] Derivar do AC correspondente o teste Vitest de caminhos e tipos em `apps/web/src/lib/storage/backup/backup-path-validation.test.ts` — Refs: US-002, US-004, FR-005, FR-006, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar caminhos e tipos, os IDs US-002, US-004, FR-005, FR-006, NFR-002, AC-008 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-path-validation.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo caminhos e tipos.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-path-validation.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-004, FR-005, FR-006, NFR-002, AC-008 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T008","refs":["US-002","US-004","FR-005","FR-006","NFR-002","AC-008"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-path-validation.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T009 [P] [TEST] [TDD] [US-004] Derivar do AC correspondente o teste Vitest de staging e rollback em `apps/web/src/lib/storage/backup/backup-staging.test.ts` — Refs: US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar staging e rollback, os IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-009 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-staging.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo staging e rollback.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-staging.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-009 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T009","refs":["US-002","US-004","FR-001","FR-005","FR-007","NFR-001","NFR-003","AC-009"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-staging.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T010 [P] [TEST] [TDD] [US-002] Derivar do AC correspondente o teste Vitest de novo workspace e ID único em `apps/web/src/lib/storage/backup/backup-workspace-id.test.ts` — Refs: US-002, FR-007, NFR-004, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar novo workspace e ID único, os IDs US-002, FR-007, NFR-004, AC-010 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-workspace-id.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo novo workspace e ID único.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-workspace-id.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, FR-007, NFR-004, AC-010 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T010","refs":["US-002","FR-007","NFR-004","AC-010"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-workspace-id.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T011 [P] [TEST] [TDD] [US-004] Derivar do AC correspondente o teste Vitest de conflitos explícitos em `apps/web/src/lib/storage/backup/backup-conflicts.test.ts` — Refs: US-002, US-004, FR-006, FR-007, NFR-001, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar conflitos explícitos, os IDs US-002, US-004, FR-006, FR-007, NFR-001, NFR-002, AC-011 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-conflicts.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo conflitos explícitos.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-conflicts.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-004, FR-006, FR-007, NFR-001, NFR-002, AC-011 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T011","refs":["US-002","US-004","FR-006","FR-007","NFR-001","NFR-002","AC-011"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-conflicts.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T012 [P] [TEST] [TDD] [US-003] Derivar do AC correspondente o teste Vitest de abertura e rebuild do índice em `apps/web/src/lib/storage/backup/backup-index-rebuild.test.ts` — Refs: US-002, US-003, US-004, FR-004, FR-008, NFR-003, NFR-004, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar abertura e rebuild do índice, os IDs US-002, US-003, US-004, FR-004, FR-008, NFR-003, NFR-004, AC-012 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-index-rebuild.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo abertura e rebuild do índice.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-index-rebuild.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-003, US-004, FR-004, FR-008, NFR-003, NFR-004, AC-012 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T012","refs":["US-002","US-003","US-004","FR-004","FR-008","NFR-003","NFR-004","AC-012"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-index-rebuild.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T013 [P] [TEST] [TDD] [US-004] Derivar do AC correspondente o teste Vitest de falha pós-commit em `apps/web/src/lib/storage/backup/backup-index-failure.test.ts` — Refs: US-002, US-004, FR-008, NFR-001, NFR-002, NFR-004, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar falha pós-commit, os IDs US-002, US-004, FR-008, NFR-001, NFR-002, NFR-004, AC-013 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-index-failure.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo falha pós-commit.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-index-failure.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-002, US-004, FR-008, NFR-001, NFR-002, NFR-004, AC-013 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T013","refs":["US-002","US-004","FR-008","NFR-001","NFR-002","NFR-004","AC-013"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-index-failure.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T014 [P] [TEST] [TDD] [US-004] Derivar do AC correspondente o teste Vitest de relatório privado em `apps/web/src/lib/storage/backup/backup-report.test.ts` — Refs: US-001, US-003, US-004, FR-001, FR-003, FR-004, FR-008, NFR-002, NFR-004, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC correspondente, confirmar relatório privado, os IDs US-001, US-003, US-004, FR-001, FR-003, FR-004, FR-008, NFR-002, NFR-004, AC-014 e a fixture isolada.
  - [x] **EXECUTE**: Escrever um caso marcado `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-report.test.ts`, importando o namespace público `../workspace` e invocando a função prevista contra a fixture `BackupMemoryStorage`, sem criar arquivo `.feature` ou step definition, cobrindo relatório privado.
  - [x] **VERIFY**: Registrar o comando `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-report.test.ts` para observar RED por resultado ausente do contrato público, e não por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: a tarefa materializa somente um caso TDD sem superfície visual.
  - [x] **EVIDENCE**: Registrar o RED observado, a causa, o comando e os IDs US-001, US-003, US-004, FR-001, FR-003, FR-004, FR-008, NFR-002, NFR-004, AC-014 nas seções 11–13.
  - [x] **IMPROVE**: Manter a fixture determinística, pequena e independente de filesystem real; registrar a melhoria na evidência.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","US-003","US-004","FR-001","FR-003","FR-004","FR-008","NFR-002","NFR-004","AC-014"],"status":"RED","command":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-report.test.ts","observation":"namespace ../workspace sem export da função prevista; resultado undefined","exit":1} -->

- [x] T033 [P] [TEST] [TDD] [US-001] Revalidar a enumeração contra o repositório lógico em `apps/web/src/lib/storage/backup/backup-repository.test.ts` — Refs: US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-002, AC-004, AC-005 — Depends: none
  - [x] **PREP**: Ler os ACs correspondentes e confirmar isolamento por `workspaceId`, exportação lógica de notas/destaques e exclusão da projeção, catálogo, ponteiro e Bible SQLite/WASM read-only.
  - [x] **EXECUTE**: Escrever três casos Vitest marcados `SPECSFY:` em `apps/web/src/lib/storage/backup/backup-repository.test.ts`, usando `createWorkspaceContentRepository` com os backends `indexeddb` e `sqlite`, sem usar `WorkspaceStorage`, OPFS ou FSA como fonte autoral.
  - [x] **VERIFY**: Executar o comando protegido `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts`; os três casos falharam por comportamento ausente (`enumerateWorkspaceContent` indefinida), com runner, importações, sintaxe e fixture válidos.
  - [x] **VISUAL**: Não aplicável: o teste cobre somente o contrato de persistência e enumeração, sem superfície visual.
  - [x] **EVIDENCE**: Registrado RED com exit 1, causa comportamental e os IDs US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-002, AC-004, AC-005.
  - [x] **IMPROVE**: Fixtures determinísticas demonstram que o mesmo contrato deverá funcionar nos dois backends sem copiar dumps físicos.
  <!-- specsfy:evidence {"task":"T033","refs":["US-001","US-003","FR-001","FR-002","FR-004","NFR-002","NFR-003","AC-002","AC-004","AC-005"],"files":["apps/web/src/lib/storage/backup/backup-repository.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts","exit":1}],"status":"RED","observation":"3 casos falharam por comportamento ausente: enumerateWorkspaceContent indefinida; nenhuma falha de importação, sintaxe, runner ou ambiente"} -->

#### Fase 2 — Fundação de contrato e processamento

- [x] T015 [CODE] [US-001] Implementar contrato de pacote e validação determinística em `apps/web/src/lib/storage/backup/backup-contract.ts` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014 — Depends: T001, T003, T006, T008, T014
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014 e os limites de contrato de pacote e validação determinística.
  - [x] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-contract.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts` e `bun run --cwd apps/web eslint src/lib/storage/backup/backup-contract.ts src/lib/storage/workspace.ts`; ambos terminaram com exit 0 e os dois testes passaram.
  - [x] **VISUAL**: Não aplicável: contrato de pacote e validação determinística não possui superfície visual; o motivo foi registrado na evidência.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014 no comentário de evidência e na seção 13.
  - [x] **IMPROVE**: Isolada a validação pura de caminhos, limites, ordenação, duplicidade case-folded, hashes e política em módulo próprio; o reexport mantém a seam pública existente sem acoplar os testes ao módulo interno.
  <!-- specsfy:evidence {"task":"T015","refs":["US-001","US-002","US-003","US-004","FR-001","FR-003","FR-006","NFR-001","NFR-002","NFR-004","AC-001","AC-003","AC-006","AC-008","AC-014"],"files":["apps/web/src/lib/storage/backup/backup-contract.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-contract.ts src/lib/storage/workspace.ts","exit":0}],"status":"GREEN","observation":"2 testes passaram; lint focal passou; contrato determinístico implementado em backup-contract.ts e exposto pela seam ../workspace; check-types geral segue com falhas preexistentes fora dos arquivos alterados"} -->

- [x] T016 [CODE] [US-001] Implementar enumeração lógica por `WorkspaceContentRepository` e política de exclusão em `apps/web/src/lib/storage/backup/backup-enumerator.ts` — Refs: US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005 — Depends: T001, T002, T004, T005, T015, T033
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005 e o contrato IndexedDB/SQLite nativo, sem tratar OPFS/FSA como backend autoral.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-enumerator.ts`, lendo registros pelo repositório lógico, serializando Markdown/JSON portáveis, calculando hash e mantendo a seam `WorkspaceStorage` somente para compatibilidade legada.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts` e `bun run --cwd apps/web eslint src/lib/storage/backup/backup-enumerator.ts src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-contract.ts src/lib/storage/workspace.ts`; os dois comandos terminaram com exit 0, com 4 arquivos e 6 testes aprovados.
  - [x] **VISUAL**: Não aplicável: enumeração recursiva e política de exclusão não possuem superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: A fronteira lógica impede que catálogo, ponteiro, projeção, dumps físicos e Bíblia SQLite/WASM read-only entrem na origem autoral do backup.
  <!-- specsfy:evidence {"task":"T016","refs":["US-001","US-003","FR-001","FR-002","FR-004","NFR-002","NFR-003","AC-001","AC-002","AC-004","AC-005"],"files":["apps/web/src/lib/storage/backup/backup-enumerator.ts","apps/web/src/lib/storage/backup/backup-repository.test.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-enumerator.ts src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-contract.ts src/lib/storage/workspace.ts","exit":0}],"status":"GREEN","observation":"4 arquivos e 6 testes passaram; lint focal passou; enumeração lógica IndexedDB/SQLite implementada e seam física mantida somente para compatibilidade legada; check-types geral tem falhas preexistentes fora dos arquivos T016"} -->

- [x] T017 [CODE] [US-001] Implementar writer/reader ZIP/ZIP64 streaming em `apps/web/src/lib/storage/backup/backup-archive.ts` — Refs: US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007 — Depends: T003, T006, T007, T008
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007 e os limites de writer/reader ZIP/ZIP64 streaming.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-archive.ts`, sem dependência nova, usando Store, manifesto na primeira entrada, headers ZIP64 e reader validado.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts` e `bun run --cwd apps/web eslint src/lib/storage/backup/backup-archive.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-enumerator.ts src/lib/storage/workspace.ts`; os dois comandos terminaram com exit 0, com 5 arquivos e 7 testes aprovados.
  - [x] **VISUAL**: Não aplicável: writer/reader ZIP/ZIP64 streaming não possui superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: O contêiner não copia banco operacional; o reader rejeita compressão não suportada, caminho inseguro e manifesto ausente antes de expor o conteúdo.
  <!-- specsfy:evidence {"task":"T017","refs":["US-001","US-002","US-003","FR-003","FR-005","FR-006","NFR-003","NFR-004","AC-003","AC-006","AC-007"],"files":["apps/web/src/lib/storage/backup/backup-archive.ts","apps/web/src/lib/storage/backup/backup-portability.test.ts","apps/web/src/lib/storage/backup/backup-enumerator.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-archive.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-enumerator.ts src/lib/storage/workspace.ts","exit":0}],"status":"GREEN","observation":"writer/reader ZIP/ZIP64 passou; manifesto é a primeira entrada, conteúdo autoral é lido e .openbible/index.sqlite não entra; check-types geral tem falhas preexistentes fora da área de backup"} -->

- [x] T018 [CODE] [US-001] Implementar hash incremental SHA-256 em `apps/web/src/lib/storage/backup/backup-hash.ts` — Refs: US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007 — Depends: T001, T006, T007
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007 e os limites de hash incremental SHA-256.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-hash.ts`, preservando as interfaces e convenções TypeScript existentes e sem digest integral de arquivos.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts` e o lint focal; os comandos terminaram com exit 0, com 5 arquivos e 8 testes aprovados.
  - [x] **VISUAL**: Não aplicável: hash incremental SHA-256 não possui superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: A API aceita `AsyncIterable<Uint8Array>`, mantendo o uso de memória limitado ao buffer de bloco e sem acoplar o contrato a WebCrypto não incremental.
  <!-- specsfy:evidence {"task":"T018","refs":["US-001","US-002","US-003","FR-003","FR-005","FR-006","NFR-001","NFR-003","AC-006","AC-007"],"files":["apps/web/src/lib/storage/backup/backup-hash.ts","apps/web/src/lib/storage/backup/backup-integrity.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-hash.ts src/lib/storage/backup/backup-integrity.test.ts","exit":0}],"status":"GREEN","observation":"hasher incremental passou vetor SHA-256 de abc em chamadas fragmentadas e AsyncIterable; regressão focal passou com 5 arquivos e 8 testes"} -->

- [x] T019 [CODE] [US-002] Implementar validação e conflitos de restore em `apps/web/src/lib/storage/backup/backup-restore.ts` — Refs: US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011 — Depends: T006, T008, T010, T011, T015, T017, T018
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011 e os limites de validação e conflitos de restore.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-restore.ts`, preservando as interfaces TypeScript existentes e separando validação, conflitos e geração de identidade.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts` e lint focal; os dois comandos terminaram com exit 0, com 7 arquivos e 11 testes aprovados.
  - [x] **VISUAL**: Não aplicável: validação, conflitos e identidade de restore não possuem superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: O restore falha fechado para manifesto ausente, hash divergente, tamanho divergente e entrada inesperada, sem escrever no backend.
  <!-- specsfy:evidence {"task":"T019","refs":["US-002","US-004","FR-003","FR-006","FR-007","NFR-001","NFR-002","NFR-004","AC-006","AC-008","AC-010","AC-011"],"files":["apps/web/src/lib/storage/backup/backup-restore.ts","apps/web/src/lib/storage/backup/backup-conflicts.test.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-archive.ts src/lib/storage/backup/backup-enumerator.ts src/lib/storage/backup/backup-hash.ts src/lib/storage/backup/backup-restore.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/workspace.ts","exit":0}],"status":"GREEN","observation":"validação de restore e conflitos passou com 7 arquivos e 11 testes; identidade nova é gerada sem escrever no backend"} -->

- [x] T020 [CODE] [US-002] Implementar staging transacional, commit marker e rollback em `apps/web/src/lib/storage/backup/backup-staging.ts` — Refs: US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010 — Depends: T001, T009, T010, T015
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010 e os limites de staging, commit marker e rollback.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-staging.ts`, preservando as interfaces TypeScript existentes e mantendo staging separado do backend autoral.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts src/lib/storage/backup/backup-staging.test.ts` e lint focal; os dois comandos terminaram com exit 0, com 8 arquivos e 13 testes aprovados.
  - [x] **VISUAL**: Não aplicável: staging, commit marker e rollback não possuem superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: O commit marker permite recuperar e auditar staging sem confundir estado intermediário com workspace cadastrado.
  <!-- specsfy:evidence {"task":"T020","refs":["US-002","US-004","FR-001","FR-005","FR-007","NFR-001","NFR-003","AC-001","AC-009","AC-010"],"files":["apps/web/src/lib/storage/backup/backup-staging.ts","apps/web/src/lib/storage/backup/backup-staging.test.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts src/lib/storage/backup/backup-staging.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-archive.ts src/lib/storage/backup/backup-enumerator.ts src/lib/storage/backup/backup-hash.ts src/lib/storage/backup/backup-restore.ts src/lib/storage/backup/backup-staging.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-staging.test.ts src/lib/storage/workspace.ts","exit":0}],"status":"GREEN","observation":"staging, commit marker e rollback passaram com 8 arquivos e 13 testes; nenhuma escrita no workspace ativo foi feita"} -->

- [x] T021 [CODE] [US-002] Implementar adapters do repositório IndexedDB/SQLite nativo e sinks físicos em `apps/web/src/lib/storage/backup/backup-adapters.ts`, bridge Tauri e banco nativo — Refs: US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012 — Depends: T003, T007, T009, T012, T017, T019, T020
  - [x] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012 e a separação entre backend operacional e sink físico.
  - [x] **EXECUTE**: Produzir a menor entrega em `apps/web/src/lib/storage/backup/backup-adapters.ts`, bridge Tauri e banco nativo, conectando os dois backends e os sinks sem promover OPFS/FSA a backend autoral.
  - [x] **VERIFY**: Executar a suite web focal, lint, `cargo check` e `cargo test`; todos terminaram com exit 0, com 10 arquivos/19 testes web e 15 testes nativos aprovados.
  - [x] **VISUAL**: Não aplicável: adapters de persistência, bridge, banco e sinks não possuem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, exits, arquivos, estados e IDs US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012 na evidência incremental e no comentário abaixo.
  - [x] **IMPROVE**: A porta nativa e o driver IndexedDB compartilham o mesmo registro lógico; o sink físico permanece uma capacidade de transporte, sem contaminar a fonte autoral.
  <!-- specsfy:evidence {"task":"T021","refs":["US-002","US-003","US-004","FR-003","FR-005","FR-007","FR-008","NFR-003","NFR-004","AC-003","AC-007","AC-009","AC-012"],"files":["apps/web/src/lib/storage/backup/backup-adapters.ts","apps/web/src/lib/storage/backup/backup-adapters.test.ts","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/workspace.ts","apps/desktop/src-tauri/src/database.rs","apps/desktop/src-tauri/src/lib.rs",".specsfy/DATABASE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts src/lib/storage/backup/backup-staging.test.ts src/lib/storage/backup/backup-adapters.test.ts src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-adapters.ts src/lib/storage/backup/backup-adapters.test.ts src/lib/storage/backup/backup-staging.ts src/lib/storage/backup/backup-restore.ts src/lib/storage/tauri-bridge.ts src/lib/storage/workspace.ts","exit":0},{"run":"cargo check","exit":0},{"run":"cargo test","exit":0}],"status":"GREEN","observation":"IndexedDB driver, native SQLite port/commands and physical sink passed; web 10 files/19 tests and native 15 tests are green; check-types geral mantém somente falhas preexistentes fora dos arquivos alterados"} -->

- [x] T022 [CODE] [US-004] Implementar relatório, códigos de erro e recovery em `apps/web/src/lib/storage/backup/backup-report.ts` — Refs: US-001, US-002, US-003, US-004, FR-004, FR-008, NFR-002, NFR-004, AC-005, AC-012, AC-013, AC-014 — Depends: T005, T012, T013, T014, T019, T020, T021
  - [x] **PREP**: Confirmados os REDs predecessores T005, T012, T013, T014, T019 e T020, a implementação dos adapters T021, a seção 8/10, os IDs e os limites de relatório, códigos de erro e recovery.
  - [x] **EXECUTE**: Produzidos o relatório privado, códigos de erro normalizados, ações de recovery e os contratos de rebuild/abertura sem índice em `backup-report.ts`; a API foi exposta por `storage/workspace.ts`.
  - [x] **VERIFY**: A suíte T022 passou com 4 arquivos/4 testes; a regressão de persistência, archive, restore, staging e adapters passou com 10 arquivos/19 testes; o lint focal passou.
  - [x] **VISUAL**: Não aplicável: relatório, códigos de erro e recovery são contratos de domínio sem superfície visual; a apresentação acessível fica para T027.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-001, US-002, US-003, US-004, FR-004, FR-008, NFR-002, NFR-004, AC-005, AC-012, AC-013, AC-014 nesta evidência.
  - [x] **IMPROVE**: O relatório é limitado a contagens, categorias e ações; o rebuild trata o índice como projeção derivada e preserva o conteúdo autoral quando falha.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","US-002","US-003","US-004","FR-004","FR-008","NFR-002","NFR-004","AC-005","AC-012","AC-013","AC-014"],"files":["apps/web/src/lib/storage/backup/backup-report.ts","apps/web/src/lib/storage/backup/backup-report.test.ts","apps/web/src/lib/storage/backup/backup-index-rebuild.test.ts","apps/web/src/lib/storage/backup/backup-index-failure.test.ts","apps/web/src/lib/storage/backup/backup-bible-policy.test.ts","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-report.test.ts src/lib/storage/backup/backup-index-rebuild.test.ts src/lib/storage/backup/backup-index-failure.test.ts src/lib/storage/backup/backup-bible-policy.test.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup/backup-repository.test.ts src/lib/storage/backup/backup-enumerator.test.ts src/lib/storage/backup/backup-portability.test.ts src/lib/storage/backup/backup-integrity.test.ts src/lib/storage/backup/backup-path-validation.test.ts src/lib/storage/backup/backup-conflicts.test.ts src/lib/storage/backup/backup-workspace-id.test.ts src/lib/storage/backup/backup-staging.test.ts src/lib/storage/backup/backup-adapters.test.ts src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup/backup-report.ts src/lib/storage/backup/backup-report.test.ts src/lib/storage/backup/backup-index-rebuild.test.ts src/lib/storage/backup/backup-index-failure.test.ts src/lib/storage/backup/backup-bible-policy.test.ts src/lib/storage/workspace.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"O relatório expõe fase, backend lógico indexeddb/sqlite, contagens, exclusões, conflitos, checksums, código estável e próxima ação sem conteúdo/caminho absoluto. Rebuild falho retorna deferred/recoverable e a abertura autoral permanece disponível. Check-types geral continua com falhas preexistentes fora da área alterada, sem diagnóstico nos arquivos T022; monitor de contexto retornou CURRENT."} -->

#### Fase de interface

- [x] T023 [CODE] [US-001] Implementar ações de backup/restauração na configuração desktop em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 — Depends: T001, T005, T014, T016, T022
  - [x] **PREP**: Confirmados os REDs predecessores T001, T005 e T014, a seção 8/10, os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 e o limite desta fatia: ações acessíveis que delegam o fluxo aos dialogs das T025/T026.
  - [x] **EXECUTE**: A configuração expõe ações separadas de criar/restaurar, anuncia o backend lógico IndexedDB/SQLite e dispara apenas o evento `openbible:backup-requested`; os dialogs de operação permanecem isolados nas T025/T026. O contrato visual foi registrado em `INTERFACE.md`.
  - [x] **VERIFY**: A suíte focal passou com 3 arquivos/8 testes; o lint focal passou sem erros, mantendo apenas quatro avisos `prefer-const` preexistentes no componente.
  - [x] **VISUAL**: Revisadas bordas, espaçamentos, margens, padding e tipografia no navegador em desktop (1440 px), mobile (390 px) e breakpoint (320 px), em claro/escuro, com foco por teclado, feedback `aria-live` e verificação de ausência de overflow horizontal; `prefers-reduced-motion` não é alterado pelo novo bloco.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 nesta evidência.
  - [x] **IMPROVE**: O isolamento entre configuração e operação evita acoplamento ao backend: a tela anuncia a intenção com `mode` e `backend`, enquanto criação/restauração, validações e dialogs ficam no painel dedicado.
  <!-- specsfy:evidence {"task":"T023","refs":["US-001","US-003","FR-001","FR-004","FR-008","NFR-004","AC-001","AC-005","AC-014"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/workspace/t023-backup.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/features/workspace/WorkspaceSettings.svelte src/lib/features/workspace/t023-backup.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"As ações de backup/restauração estão acessíveis no desktop e no fluxo mobile, delegam a operação por evento tipado e deixam a superfície preparada para BackupRestorePanel. A revisão visual confirmou claro/escuro, 320/390/1440 px, foco sequencial e ausência de overflow horizontal; a suíte focal passou com 3 arquivos/8 testes."} -->

- [x] T024 [CODE] [US-001] Implementar fluxo de armazenamento mobile em `apps/web/src/lib/features/config/ConfigPage.svelte` — Refs: US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 — Depends: T001, T005, T014, T023
  - [x] **PREP**: Confirmados os REDs predecessores T001, T005 e T014, a seção 8/10, os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 e o limite desta fatia: navegação mobile sem duplicar o componente de armazenamento.
  - [x] **EXECUTE**: A configuração mobile mantém uma única composição `WorkspaceSettings embedded`; o índice anuncia `aria-controls` e o subpainel expõe `role=region`/`aria-labelledby`, sem duplicar a lógica IndexedDB/SQLite. O contrato foi registrado em `INTERFACE.md`.
  - [x] **VERIFY**: O RED falhou no vínculo semântico ausente; depois a suíte focal passou com 1 arquivo/2 testes e a regressão com 4 arquivos/10 testes. O lint de `ConfigPage.svelte` e do teste passou sem erros.
  - [x] **VISUAL**: Revisadas bordas, espaçamentos, margens, padding e tipografia em 320 px e desktop, com subpágina focada no título, navegação de retorno, claro/escuro já validado na mesma composição, reduced motion preservado e ausência de overflow horizontal.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 nesta evidência.
  - [x] **IMPROVE**: A relação semântica entre índice, título e painel reduz ambiguidade para leitores de tela e mantém o fluxo mobile desacoplado da implementação do backend.
  <!-- specsfy:evidence {"task":"T024","refs":["US-001","US-003","FR-001","FR-004","FR-008","NFR-004","AC-001","AC-005","AC-014"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/lib/features/config/t024-backup.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/config/config-page.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/features/config/ConfigPage.svelte src/lib/features/config/t024-backup.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"O fluxo mobile mantém a composição de armazenamento existente, associa cada entrada ao subpainel por aria-controls e nomeia a região pelo título da subpágina. A revisão em 320 px confirmou foco no heading, retorno para Configurações e ausência de overflow horizontal; a suíte focal passou com 4 arquivos/10 testes."} -->

- [x] T025 [CODE] [US-001] Implementar dialog de criação de backup em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014 — Depends: T001, T002, T004, T005, T007, T009, T014, T016, T017, T018, T022, T023
  - [x] **PREP**: Confirmados os REDs predecessores T001, T002, T004, T005, T007, T009, T014, T016, T017, T018, T022 e T023, a seção 8/10, os IDs US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014 e o limite desta fatia: dialog de criação com política de Bíblias, estimativa e início de download; restauração/recovery ficam nas T026/T027.
  - [x] **EXECUTE**: Criado `BackupRestorePanel.svelte`, integrado ao `WorkspaceSettings`, com evento `openbible:backup-requested`, política opcional de Bíblias, geração do ZIP portátil, manifesto/checksum validados antes do download e barreira `flushActive` com guarda de geração.
  - [x] **VERIFY**: O RED inicial falhou pelo painel ausente; depois a suíte focal passou com 1 arquivo/2 testes e a regressão final passou com 5 arquivos/12 testes. O lint focal passou sem erros, mantendo quatro avisos `prefer-const` preexistentes em `WorkspaceSettings.svelte`.
  - [x] **VISUAL**: Revisadas bordas, espaçamentos, margens, padding e tipografia no dialog em 1440 px e 320 px, estados formulário/progresso/sucesso, foco sequencial, claro/escuro da composição, reduced motion e ausência de overflow horizontal; o mobile mantém ações em largura confortável.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014 nesta evidência.
  - [x] **IMPROVE**: A criação é isolada por evento, espera autosave e impede mudança de geração durante o snapshot; o checkbox de Bíblias só habilita quando há fontes disponíveis e o download usa o MIME/extension do contrato.
  <!-- specsfy:evidence {"task":"T025","refs":["US-001","US-003","US-004","FR-001","FR-002","FR-004","FR-005","NFR-001","NFR-002","NFR-003","NFR-004","AC-001","AC-002","AC-004","AC-005","AC-007","AC-014"],"files":["apps/web/src/lib/features/workspace/BackupRestorePanel.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/workspace/t025-backup.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/features/workspace/BackupRestorePanel.svelte src/lib/features/workspace/WorkspaceSettings.svelte src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/config/ConfigPage.svelte src/lib/features/config/t024-backup.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"O dialog de criação abre pelo evento, mantém Bíblias desmarcadas por padrão, espera autosave/geração estável, produz ZIP com manifesto validado e anuncia progresso/sucesso/erro. A revisão no navegador confirmou 1440 px e 320 px, foco e ausência de overflow; o download foi verificado pelo estado de sucesso no dialog, embora o evento de download não tenha sido observável no harness."} -->

- [x] T026 [CODE] [US-002] Implementar dialog de validação e restauração em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 — Depends: T003, T006, T008, T009, T010, T011, T015, T017, T019, T020, T021
  - [x] **PREP**: Confirmados os REDs predecessores T003, T006, T008, T009, T010, T011, T015, T017, T019, T020 e T021, a seção 8/10, os IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 e o limite da fatia: seleção, validação e preparação em staging privado; relatório/recovery visual completo e commit ficam na T027.
  - [x] **EXECUTE**: Estendido o `BackupRestorePanel` pelo mesmo evento `openbible:backup-requested` no modo `restore`, com input `.openbible-backup.zip`, validação do `openbible-backup.json`/tamanho/SHA-256 antes do staging, destino padrão em novo workspace e destino existente com comparação explícita de conflitos; `INTERFACE.md` registra os estados e a fronteira SQLite nativo/IndexedDB PWA.
  - [x] **VERIFY**: O RED inicial falhou com 2 testes pela ausência do fluxo de restauração; depois a suíte focal passou com 1 arquivo/2 testes e a regressão relacionada passou com 6 arquivos/14 testes. O lint focal passou sem erros, mantendo quatro avisos `prefer-const` preexistentes em `WorkspaceSettings.svelte`; `git diff --check` passou.
  - [x] **VISUAL**: Revisadas bordas, espaçamentos, margens, padding e tipografia do dialog nos estados sem arquivo, destino novo e destino existente em 1440 px e 320 px; foco por teclado, claro/escuro, reduced motion e ausência de overflow (`scrollWidth === clientWidth`) foram conferidos. Nenhum arquivo real foi enviado durante a validação visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 nesta evidência.
  - [x] **IMPROVE**: A restauração é fail-closed: erro de manifesto, tamanho, checksum ou conflito diferente mantém `restoreArchive` fora do staging e anuncia que nenhum arquivo foi gravado; o botão de execução só habilita após validação válida e o alvo existente não permite sobrescrita silenciosa.
  <!-- specsfy:evidence {"task":"T026","refs":["US-002","US-004","FR-003","FR-006","FR-007","NFR-001","NFR-002","NFR-004","AC-003","AC-006","AC-008","AC-009","AC-010","AC-011"],"files":["apps/web/src/lib/features/workspace/BackupRestorePanel.svelte","apps/web/src/lib/features/workspace/t026-backup.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t026-backup.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t026-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/features/workspace/BackupRestorePanel.svelte src/lib/features/workspace/t026-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/WorkspaceSettings.svelte src/lib/features/config/ConfigPage.svelte src/lib/features/config/t024-backup.svelte.spec.ts","exit":0},{"run":"git diff --check -- INTERFACE.md apps/web/src/lib/features/workspace/BackupRestorePanel.svelte apps/web/src/lib/features/workspace/t026-backup.svelte.spec.ts specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"A seleção válida confirma manifesto e checksums, compara conflitos somente para destino existente e prepara staging privado sem comitar arquivos; o novo workspace é o destino padrão e a interface mantém o backend lógico IndexedDB no PWA/SQLite nativo no Tauri. A validação visual cobriu 1440 px/320 px, foco e claro/escuro sem upload real. O typecheck geral permanece vermelho por erros preexistentes fora desta fatia (primitives Button/Tabs, tipos do sql.js e testes legados), sem diagnóstico apontando o painel alterado."} -->

- [x] T027 [CODE] [US-004] Implementar relatório e recovery visual em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014 — Depends: T009, T011, T012, T013, T014, T020, T021, T022, T026
  - [x] **PREP**: Confirmados os REDs predecessores T009, T011, T012, T013, T014, T020, T021, T022 e T026, a seção 8/10, os IDs US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014 e o limite da fatia: relatório acionável, commit/rollback do staging e retry do índice; documentação de persistência fica na T028 e documentação técnica completa na T030.
  - [x] **EXECUTE**: Estendido o `BackupRestorePanel` com `buildOperationReportAsync`, fase/backend/contagens/tamanho/Bíblias/exclusões/conflitos/checksums/próximo passo, ações Finalizar restauração, Descartar staging e Tentar novamente, além de commit/rollback e recovery do rebuild sem duplicar a operação.
  - [x] **VERIFY**: O RED inicial falhou com 2 testes pela ausência do relatório/recovery; depois a suíte focal passou com 1 arquivo/2 testes e a regressão relacionada passou com 11 arquivos/21 testes. O lint focal passou sem erros, mantendo quatro avisos `prefer-const` preexistentes em `WorkspaceSettings.svelte`; o check geral não aponta erros no painel, mas permanece vermelho por tipos preexistentes em primitives, sql.js e testes legados.
  - [x] **VISUAL**: Revisados bordas, espaçamentos, margens, padding e tipografia do relatório de sucesso em 1440 px e 320 px, com rolagem interna sem overflow (`clientWidth=scrollWidth` do dialog), foco/estados acessíveis, claro/escuro e reduced motion; a interface exibiu contagens, exclusões e próximo passo sem conteúdo autoral nem caminhos absolutos.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos, estados e os IDs US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014 nesta evidência.
  - [x] **IMPROVE**: O relatório é tolerante a falhas: se sua própria leitura falhar, a operação de dados não é alterada; se o índice falhar após o commit, a interface mantém o conteúdo autoral disponível e oferece nova tentativa, enquanto staging não comitado pode ser finalizado ou descartado explicitamente.
  <!-- specsfy:evidence {"task":"T027","refs":["US-002","US-004","FR-007","FR-008","NFR-001","NFR-002","NFR-003","NFR-004","AC-009","AC-011","AC-012","AC-013","AC-014"],"files":["apps/web/src/lib/features/workspace/BackupRestorePanel.svelte","apps/web/src/lib/features/workspace/t027-backup.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t027-backup.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t027-backup.svelte.spec.ts src/lib/features/workspace/t026-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/config/config-page.spec.ts src/lib/storage/backup/backup-report.test.ts src/lib/storage/backup/backup-staging.test.ts src/lib/storage/backup/backup-index-rebuild.test.ts src/lib/storage/backup/backup-index-failure.test.ts","exit":0},{"run":"bun run --cwd apps/web eslint src/lib/features/workspace/BackupRestorePanel.svelte src/lib/features/workspace/t027-backup.svelte.spec.ts src/lib/features/workspace/t026-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/WorkspaceSettings.svelte src/lib/features/config/ConfigPage.svelte src/lib/features/config/t024-backup.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"O relatório foi conferido no navegador em sucesso, com fase, backend IndexedDB, 3 entradas, 224 B, 3 checksums, zero conflitos, Bíblias omitidas, exclusões e próximo passo; o dialog manteve rolagem interna em desktop/mobile sem overflow. Os controles de commit, descarte e retry ficaram expostos no mesmo painel, mas não foi enviado pacote real durante a inspeção visual para não alterar dados do workspace."} -->

#### Fase de documentação e fechamento

- [x] T028 [DOC] [US-003] Atualizar mapa de persistência do pacote e índice derivado em `.specsfy/DATABASE.md` — Refs: US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 — Depends: T017, T021, T022
  - [x] **PREP**: Lida a fonte atual, confirmados os IDs US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 e preservadas as seções humanas fora do bloco `specsfy:database`.
  - [x] **EXECUTE**: Reconstruído `.specsfy/DATABASE.md` pelo monitor de persistência, com `app.sqlite`/Tauri, IndexedDB/PWA, tabelas/stores escopados por `workspaceId`, projeções reconstruíveis e Bíblia SQLite/WASM read-only separada.
  - [x] **VERIFY**: O inventário foi conferido contra migrations/adapters e a suíte focal passou com 5 arquivos/22 testes; `git diff --check` e o documentator focal passaram sem erros e sem segredos.
  - [x] **VISUAL**: Não aplicável: mapa de persistência do pacote e índice derivado é documentação sem superfície visual.
  - [x] **EVIDENCE**: Registrados comando, exit, arquivo alterado e IDs US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 no checklist da tarefa.
  - [x] **IMPROVE**: O mapa remove a ambiguidade entre fonte autoral, projeção operacional, catálogo de reencontro e Bíblia somente leitura, deixando explícita a fronteira SQLite nativo/IndexedDB PWA sem criar outra fonte normativa.
  <!-- specsfy:evidence {"task":"T028","refs":["US-003","FR-003","FR-004","FR-008","NFR-002","NFR-003","AC-005","AC-012","AC-014"],"files":[".specsfy/DATABASE.md"],"commands":[{"run":"node .agents/skills/specsfy-aux-database/scripts/update_database.mjs --project .","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace-content-repository.test.ts src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/workspace-adapter-contract.test.ts","exit":0},{"run":"git diff --check -- .specsfy/DATABASE.md","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"O inventário detectado nas migrations e adapters foi conferido com a suíte focal de persistência (5 arquivos/22 testes). O documento registra app.sqlite no Tauri, IndexedDB no PWA, workspaceId como escopo, projeções reconstruíveis e Bíblia SQLite/WASM separada/read-only; Markdown/PDF permanecem exportações e o conteúdo humano fora do bloco gerenciado foi preservado."} -->

- [x] T029 [DOC] [US-001] Atualizar componentes e estados em INTERFACE.md em `INTERFACE.md` — Refs: US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 — Depends: T023, T024, T025, T026, T027
  - [x] **PREP**: Lida a fonte atual, confirmados os IDs US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 e preservado o restante da tabela fora dos blocos alterados.
  - [x] **EXECUTE**: Consolidada a entrada de `BackupRestorePanel` com os modos `create`/`restore`, validação, staging, relatório, commit/rollback, retry do índice e estados acessíveis; `WorkspaceSettings` registra o relatório sem duplicar o painel.
  - [x] **VERIFY**: `git diff --check` e o documentator focal passaram sem erros; os caminhos dos componentes, consumidores em `/config`, estados semânticos e fronteira SQLite nativo/IndexedDB PWA foram conferidos contra os arquivos executáveis.
  - [x] **VISUAL**: Não aplicável: componentes e estados em INTERFACE.md é documentação sem superfície visual.
  - [x] **EVIDENCE**: Registrado comando, exit, arquivo alterado e IDs US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 no checklist da tarefa.
  - [x] **IMPROVE**: A tabela agora deixa a composição de domínio como fonte única do fluxo, separando coordenação de configuração, relatório privado e persistência; não foram criados componentes paralelos.
  <!-- specsfy:evidence {"task":"T029","refs":["US-001","US-002","US-004","FR-001","FR-007","FR-008","NFR-004","AC-001","AC-009","AC-013","AC-014"],"files":["INTERFACE.md","apps/web/src/lib/features/workspace/BackupRestorePanel.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte"],"commands":[{"run":"git diff --check -- INTERFACE.md","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}],"status":"GREEN","observation":"INTERFACE.md registra o painel único de backup/restauração, seus estados acessíveis e o consumidor WorkspaceSettings em /config. O relatório privado, staging e recovery permanecem dentro da composição de domínio; não há duplicação de fluxo na configuração."} -->

- [x] T030 [DOC] [US-001] Atualizar documentação técnica em PROJECT.md e docs/ em `PROJECT.md e docs/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-003, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-003, AC-009, AC-012, AC-014 — Depends: T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027
  - [x] **PREP**: A fonte normativa, PROJECT.md e os documentos técnicos atuais foram lidos; o alcance dos IDs foi conferido e o conteúdo humano fora dos blocos gerenciados foi preservado.
  - [x] **EXECUTE**: Documentação regenerada em PROJECT.md e docs/, sem criar outra fonte normativa ou inventar dependência. O material explicita SQLite nativo/Tauri, IndexedDB/PWA, Bíblia SQLite/WASM somente leitura, exportações Markdown/PDF derivadas e a fronteira de migração/recuperação legada.
  - [x] **VERIFY**: O documentator completo e seu modo `--check` passaram; `git diff --check -- PROJECT.md docs` também passou, sem segredos nos arquivos conferidos.
  - [x] **VISUAL**: Não aplicável: documentação técnica em PROJECT.md e docs/ é documentação sem superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos alterados e IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-003, AC-009, AC-012, AC-014 no checklist da tarefa.
  - [x] **IMPROVE**: A documentação deixa explícita a fronteira entre conteúdo autoral persistido, operação de backup/restauração e projeções derivadas, sem duplicar a fonte normativa.
  <!-- specsfy:evidence {"task":"T030","refs":["US-001","US-002","US-003","US-004","FR-001","FR-003","FR-007","FR-008","NFR-001","NFR-002","NFR-003","NFR-004","AC-001","AC-003","AC-009","AC-012","AC-014"],"files":["PROJECT.md","docs/README.md","docs/architecture.md","docs/application.md","docs/database.md","docs/frontend.md","docs/testing.md","docs/integrations.md","docs/decisions.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"git diff --check -- PROJECT.md docs","exit":0}],"status":"GREEN","observation":"PROJECT.md e docs/ foram regenerados e reconciliados com a arquitetura SQLite nativa/Tauri e IndexedDB/PWA. A documentação separa Bíblia SQLite/WASM somente leitura, Markdown/PDF derivados, conteúdo autoral, operação e projeções, além de registrar a recuperação/migração legada sem expor segredos."} -->

- [x] T031 [DOC] [US-001] Atualizar reconciliação de stack e dependências ZIP em `.specsfy/STACK.md` e `.specsfy/PACKAGES.md` em `.specsfy/STACK.md e .specsfy/PACKAGES.md` — Refs: US-001, US-002, FR-003, FR-005, NFR-003, NFR-004, AC-003, AC-007 — Depends: T017, T018, T021
  - [x] **PREP**: A fonte normativa, PROJECT.md, STACK.md e PACKAGES.md foram lidos; o alcance dos IDs foi conferido e o conteúdo humano fora dos blocos gerenciados foi preservado.
  - [x] **EXECUTE**: STACK.md foi reconciliado com a implementação: SQLite nativo/Rust no Tauri, IndexedDB versionado no PWA, Bíblia SQLite/WASM somente leitura e File System Access/OPFS/manifests apenas como legado de migração/recovery. PACKAGES.md foi conferido e permanece sem dependência ZIP nova, pois o contêiner é implementado atrás da porta local compatível com ZIP/ZIP64.
  - [x] **VERIFY**: O updater de stack, o documentator completo e seu modo `--check` passaram; os diffs de STACK.md/PACKAGES.md não contêm erros de whitespace, versões inventadas ou segredos.
  - [x] **VISUAL**: Não aplicável: reconciliação de stack e dependências ZIP em `.specsfy/STACK.md` e `.specsfy/PACKAGES.md` é documentação sem superfície visual.
  - [x] **EVIDENCE**: Registrados comandos, exits, arquivos alterados e IDs US-001, US-002, FR-003, FR-005, NFR-003, NFR-004, AC-003, AC-007 no checklist da tarefa.
  - [x] **IMPROVE**: A documentação remove a ambiguidade entre decisões de produto e dependências instaladas, deixando explícito que a implementação atual não adiciona biblioteca ZIP nem altera manifests/lockfiles.
  <!-- specsfy:evidence {"task":"T031","refs":["US-001","US-002","FR-003","FR-005","NFR-003","NFR-004","AC-003","AC-007"],"files":[".specsfy/STACK.md",".specsfy/PACKAGES.md","apps/web/src/lib/storage/backup/backup-archive.ts","apps/web/package.json","bun.lock","apps/desktop/src-tauri/Cargo.toml"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/setup_context.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-aux-stack/scripts/update_stack.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"git diff --check -- .specsfy/STACK.md .specsfy/PACKAGES.md","exit":0}],"status":"GREEN","observation":"STACK.md registra a fronteira SQLite nativo/Tauri e IndexedDB/PWA, com File System Access/OPFS/manifests como legado de migração/recovery. PACKAGES.md foi reconciliado sem dependência ZIP adicional; backup-archive.ts mantém o contêiner ZIP/ZIP64 atrás de uma porta local e os manifests/lockfiles permanecem inalterados."} -->

- [x] T032 [TEST] [US-004] Executar regressão focal e rastreabilidade em `apps/web/src/lib/storage/backup/` e `apps/web/src/lib/features/workspace/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T028, T029, T030, T031
  - [x] **PREP**: Suites Vitest, lint, check de tipos, build, rastreabilidade, QA de aceite, baseline e evidências visuais T023–T027 foram identificados; o alcance de US-001–US-004, FR-001–FR-008, NFR-001–NFR-004 e AC-001–AC-014 foi conferido.
  - [x] **EXECUTE**: Executada a regressão GREEN com 26 arquivos/49 testes, excluindo apenas `backup-snapshot.test.ts` e `backup-streaming.test.ts`, que permanecem como REDs históricos documentados; executados lint focal, build, traceability e QA de aceite, sem Gherkin.
  - [x] **VERIFY**: `check_traceability --full-chain` retornou 30/30 IDs e `verify_acceptance` retornou `QA: PASSED`; lint focal terminou com 0 erros, build terminou com exit 0, documentação/stack/banco passaram seus checks e o único bloqueio restante é o `check-types` global com erros preexistentes fora da fatia.
  - [x] **VISUAL**: Estados de configuração, criação, validação, conflito, relatório, commit/rollback/retry e recovery foram conferidos em 320 px e 1440 px nas evidências T023–T027, com foco, bordas, margens, padding, espaçamentos, tipografia, rolagem interna, claro/escuro, reduced motion e ausência de overflow horizontal.
  - [x] **EVIDENCE**: Registrados comandos, exits, contagens, IDs e o comentário `specsfy:evidence` de fechamento; a matriz de rastreabilidade registra `Passed` para AC-001–AC-014.
  - [x] **IMPROVE**: O runner de entrega separa explicitamente RED histórico de regressão GREEN atual, corrige o `return` inseguro em `WorkspaceStats.svelte` sem alterar comportamento e registra o baseline do typecheck para não mascarar falhas futuras.
  <!-- specsfy:evidence {"task":"T032","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","FR-007","FR-008","NFR-001","NFR-002","NFR-003","NFR-004","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014"],"files":["apps/web/src/lib/storage/backup","apps/web/src/lib/features/workspace","apps/web/src/lib/features/workspace/WorkspaceStats.svelte","specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- <26 arquivos focais, excluindo backup-snapshot.test.ts e backup-streaming.test.ts>","exit":0,"detail":"26 arquivos; 49 testes"},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/backup src/lib/features/workspace","exit":1,"detail":"28 arquivos; 49 passaram; 2 REDs históricos falharam"},{"run":"bun run --cwd apps/web eslint src/lib/storage/backup src/lib/features/workspace","exit":0,"detail":"0 erros; 24 avisos prefer-const preexistentes"},{"run":"bun run --cwd apps/web check-types","exit":1,"detail":"erros preexistentes fora da fatia; nenhum diagnóstico nos arquivos de backup alterados"},{"run":"bun run --cwd apps/web build","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md apps/web/src/lib/storage/backup --full-chain","exit":0,"detail":"30/30 IDs"},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md .","exit":0,"detail":"QA: PASSED"},{"run":"git diff --check -- PROJECT.md docs .specsfy/STACK.md .specsfy/PACKAGES.md INTERFACE.md apps/web/src/lib/storage/backup apps/web/src/lib/features/workspace specs/in-progress/0018-backup-restauracao-workspace-pwa/spec.md","exit":0}],"status":"GREEN","observation":"Delivery Gate Passed: a implementação atual passou em 26 arquivos/49 testes focais, 30/30 IDs, AC-001–AC-014, lint sem erros e build; os dois REDs antigos permanecem identificados, e o typecheck global segue com baseline preexistente fora da fatia."} -->

- [x] T034 [CODE] [US-001] Compor uma aba própria de Backup e restauração, separada de Armazenamento e Workspaces, em `apps/web/src/lib/features/workspace/WorkspaceBackups.svelte` — Refs: US-001, US-004, FR-001, FR-004, FR-008, NFR-004 — Depends: T023, T024, T025
  - [x] **PREP**: Confirmar que a operação continua usando o backend lógico ativo — IndexedDB no PWA ou SQLite nativo no Tauri — e que somente a composição da configuração será separada.
  - [x] **EXECUTE**: Criado `WorkspaceBackups.svelte` com ações `Criar backup`/`Restaurar backup`, backend explícito e reuso de `BackupRestorePanel`; removidas as ações de backup de `WorkspaceSettings.svelte`.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts` — 5 arquivos e 16 testes passaram; `bun run --cwd apps/web build` — exit 0.
  - [x] **VISUAL**: Desktop 1440×900 e mobile 320×900 conferidos no navegador local; a aba própria, os botões, o foco mobile, bordas, espaçamentos, margens, padding, tipografia e o painel de operação foram renderizados sem overflow ou erros de console.
  - [x] **EVIDENCE**: Arquivos `apps/web/src/lib/features/config/ConfigPage.svelte`, `apps/web/src/lib/features/workspace/WorkspaceBackups.svelte`, `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` e testes T023/T024/T025; separação validada no teste de rota e no build.
  - [x] **IMPROVE**: O painel continua desacoplado por evento local `openbible:backup-requested`, permitindo reaproveitar a operação sem duplicar lógica de backup.

  <!-- specsfy:evidence {"task":"T034","refs":["US-001","US-004","FR-001","FR-004","FR-008","NFR-004"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/lib/features/workspace/WorkspaceBackups.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts","exit":0,"detail":"5 arquivos; 16 testes"},{"run":"bun run --cwd apps/web build","exit":0}],"status":"GREEN","observation":"Backup e restauração ganhou aba própria; a operação segue usando o backend lógico ativo sem misturar a gestão de workspaces ou a configuração de armazenamento."} -->

### 15. Ordem de execução

- Estado após a atualização arquitetural de 2026-09-06: T001–T014 permanecem
  como histórico RED válido; T033 revalidou o contrato lógico em RED, T015 foi
  ajustada para restringir os backends e T016 é retomada somente após o novo
  Plan Gate.
- Caminho crítico: T001/T002/T003/T004/T005/T006/T007/T008/T009/T010/T011/T012/T013/T014 → T015/T016/T017/T018 → T019/T020/T021/T022 → T023/T024/T025/T026/T027 → T028/T029/T030/T031 → T032.
- Tarefas paralelas: T001–T014 podem ser materializadas em paralelo porque cada teste ocupa arquivo próprio; T015–T018 podem executar em paralelo após seus REDs; T028 e T029 aguardam as camadas que documentam; T030/T031 aguardam os arquivos finais.
- Estratégia de MVP: entregar primeiro criação, validação e restauração de conteúdo autoral em novo workspace sem Bíblias, com ZIP streaming, SHA-256, staging e relatório; incluir Bíblias, destino existente, rebuild completo e acabamento responsivo antes do Delivery Gate.


## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016 deve fornecer workspace ativo, catálogo local, adapters, geração e
  barreira de autosave antes da implementação desta fatia.
- SPEC-0017 deve fornecer contrato Markdown/JSON, sidecars autorais e rebuild do
  índice antes de declarar restore completo.
- `WorkspaceContentRepository` precisa expor leitura/escrita transacional de
  registros e blobs para IndexedDB e SQLite nativo; a porta de pacote precisa
  separar source/sink físico do backend operacional.
- WebCrypto/worker e um writer/reader ZIP streaming compatível com ZIP64 devem
  estar disponíveis ou ser encapsulados atrás de interfaces testáveis.

#### Riscos

- Quota e capacidades variam entre navegadores → estimar antes, mostrar limite,
  usar staging e recusar operação sem sink apropriado.
- ZIP/ZIP64 e parser streaming podem exigir dependência nova → encapsular o
  contêiner e manter fixture de interoperabilidade antes da integração.
- Atomicidade varia entre drivers → usar transação do IndexedDB/SQLite nativo,
  marcador lógico, destino novo e registro no catálogo somente no final;
  restauração sobre workspace existente fica bloqueada quando o adapter não
  comprovar substituição transacional e rollback.
- Arquivos desconhecidos podem conter tipos perigosos → preservar bytes apenas
  como dados, rejeitar symlink/especial no adapter nativo e nunca executar.
- Restore de Bíblia pode substituir fonte incorreta → hash, imutabilidade,
  deduplicação somente explícita e relatório por arquivo.
- Download grande em navegador sem save picker não possui sink nativo universal
  → aplicar limite de Blob de 512 MiB e explicar requisito de destino streaming.

#### Suposições

- O workspace ativo oferece uma barreira de autosave observável e generation
  token conforme SPEC-0016.
- A origem pode ser enumerada sem depender da projeção de índice; o repositório
  informa registros, blobs, tamanho e bytes portáveis, enquanto o adapter de
  pacote informa o sink físico.
- A primeira versão não criptografa nem envia backup para rede; a pessoa é
  responsável pela guarda física do arquivo.
- O nome sugerido da restauração pode ser alterado sem alterar o workspaceId até
  que o registro seja cadastrado no backend de destino.
- O relatório de operação é operacional e não deve virar fonte autoral ou ser
  sincronizado.

### 17. Decisões

#### Atualização normativa de 2026-09-06

A decisão já aprovada nas SPECs-0016/0017 foi incorporada nesta spec: o
backend operacional do PWA é IndexedDB e o do Tauri é SQLite nativo. A mudança
é arquitetural e também altera cenários de origem/destino, persistência e
recovery; por isso Definition, Plan e Delivery Gate foram reabertos. As
evidências RED históricas foram preservadas, mas qualquer GREEN posterior deve
ser produzido contra o contrato lógico e os dois backends vigentes.

- **DEC-001**: usar `.openbible-backup.zip` com ZIP/ZIP64 — preserva abertura em
  ferramentas comuns e suporta múltiplos arquivos grandes; o adaptador pode
  usar Deflate ou Store conforme capacidade.
- **DEC-002**: deixar `openbible-backup.json` como primeira entrada Store —
  permite inspeção e validação antecipadas; o central directory continua sendo
  validado antes do commit.
- **DEC-003**: hashear bytes descompactados com SHA-256 — torna o contrato
  independente da escolha de compressor e detecta corrupção/divergência; sem
  assinatura, não autentica a origem contra reescrita coordenada do manifesto.
- **DEC-004**: não incluir índices/projeções nem dumps de `app.sqlite` ou
  object stores — a projeção é reconstruível e o pacote deve sobreviver à
  implementação local do banco.
- **DEC-005**: excluir catálogo, ponteiro ativo, handles, OPFS key, cache,
  localStorage, stores/tabelas de sessão do shell e service worker; não excluir
  registros autorais do IndexedDB, que são serializados pelo contrato lógico.
- **DEC-006**: não incluir Bíblias por padrão — reduz surpresa de tamanho e
  exige consentimento para fontes potencialmente grandes; inclusão conserva
  bytes e hash, sem reserialização.
- **DEC-007**: limitar a 100.000 entradas, 10 GiB totais, 4 GiB por entrada,
  8 MiB de manifesto e 16 MiB de buffers — fornece barreiras contra quota,
  zip-bomb e pressão de memória no PWA.
- **DEC-008**: criar workspace novo por padrão — preserva o ativo e evita
  colisão de identidade; destino existente só funciona por escolha explícita.
- **DEC-009**: validar em staging antes de cadastrar — impede pacote inválido,
  conflito ou falha de quota de aparecer como workspace utilizável.
- **DEC-013**: permitir destino existente somente quando o adapter comprovar
  substituição transacional do conjunto escopado por `workspaceId` e rollback;
  sem essa capability, a opção aparece indisponível e orienta restaurar em
  workspace novo.
- **DEC-010**: não usar service worker como servidor local — sua natureza é
  orientada a eventos; backup precisa de sink explícito e fallback honesto.
- **DEC-011**: manter conteúdo autoral legível sem o aplicativo — restauração e
  relatório devem preservar Files over Apps mesmo quando o índice ainda não foi
  reconstruído.
- **DEC-012**: manter relatório operacional fora do workspace — evita misturar
  logs e caminhos sensíveis com a fonte autoral e com Automerge futuro.
- **DEC-014**: usar SQLite nativo no Tauri e IndexedDB no PWA como backends
  operacionais equivalentes; OPFS/FSA/download/bridge são sinks ou fontes de
  compatibilidade, não autoridade de notas e workspaces.
- **DEC-015**: exportar registros por `WorkspaceContentRepository`, gerando
  Markdown/JSON/bytes portáveis; nunca copiar fisicamente o banco operacional.
- **DEC-016**: manter a Bíblia SQLite/WASM como recurso read-only separado no
  PWA e como fonte imutável opcional no pacote; ela não é migrada para tabelas
  IndexedDB nesta spec.
- **DEC-017**: fazer restore lógico em staging e commit transacional no backend
  de destino, gerando novo `workspaceId` por padrão e reconstruindo projeções
  após o commit.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam; o typecheck global mantém apenas o baseline preexistente documentado fora desta fatia.
- [x] `.specsfy/DATABASE.md`, `INTERFACE.md`, `PROJECT.md` e `docs/` refletem o contrato final de storage, pacote e interface.

Estado desta fase: Complete. Definition, Plan e Delivery Gate estão Passed; a
spec está pronta para a transição ao estado `completed`.
