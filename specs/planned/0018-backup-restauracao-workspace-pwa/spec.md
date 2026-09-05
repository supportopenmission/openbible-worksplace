# Especificação integrada: Backup e restauração do workspace PWA

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0018 |
| Slug | 0018-backup-restauracao-workspace-pwa |
| Status | Planned |
| Effort | 8 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Fatiamento de alto risco por combinar streaming, contêiner ZIP/ZIP64, verificabilidade, staging e três famílias de storage sem colocar dados operacionais no pacote. |
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

O workspace PWA pode viver apenas no OPFS, que é privado da origem e pode ser
removido ao limpar os dados do site. A pessoa precisa retirar o conteúdo do
navegador, mover uma cópia entre OPFS, uma pasta selecionada pelo navegador e o
Tauri, e recuperar dados sem copiar catálogo, handles, cache ou índices
descartáveis. O projeto ainda não possui um contrato único que prove quais
bytes foram exportados e que impeça uma restauração parcial ou insegura.

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
- Em OPFS, uma falha de restauração deixa autoral intacto e oferece nova
  tentativa ou limpeza segura do staging; a reconstrução do índice não impede a
  abertura do conteúdo.
- A pessoa consegue iniciar, acompanhar, cancelar e concluir backup/restauração
  com teclado, leitor de tela, viewport de 320 px e viewport desktop de 1440 px.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] OPFS é privado da origem, sujeito a quota e removido ao limpar os dados do site — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#opfs-e-file-system-access-api — Budget: 1/5.
- **R-002** [critical] `showDirectoryPicker()` tem disponibilidade limitada, exige contexto seguro e gesto da pessoa — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#opfs-e-file-system-access-api — Budget: 1/5.
- **R-003** [critical] Compression Streams oferece gzip/deflate em fluxo, não um contêiner de múltiplos arquivos — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.
- **R-004** [critical] ZIP permite múltiplas entradas, compressão opcional e registros ZIP64 para tamanhos maiores — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.
- **R-005** [critical] Service workers são workers assíncronos orientados a eventos e não um servidor local persistente — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#service-worker — Budget: 1/5.
- **R-006** [critical] O storage atual expõe enumeração limitada e a tela de Configurações já contém `WorkspaceSettings` — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#inspeção-local-do-projeto — Budget: 1/5.
- **R-007** [critical] `SubtleCrypto.digest()` exige a entrada inteira e não fornece hash streaming — Verdict: verified — Confidence: high — Evidence: research/backup-platform/evidence.md#fluxo-e-compressão — Budget: 1/5.

#### Fontes e contexto consultados

- `specs/backlog/0019-backup-restauracao-workspace-pwa.md`, fonte de comportamento,
  critérios e decisões do backlog.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`, identidade,
  catálogo, adaptadores e barreira de autosave.
- `specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md`, contrato
  autoral Markdown/JSON e índice SQLite reconstruível.
- `apps/web/src/lib/storage/types.ts`, `opfs-storage.ts`, `local-storage.ts`,
  `tauri-storage.ts`, `workspace.ts`, `storage-registry.ts` e
  `apps/web/src/lib/features/config/ConfigPage.svelte`.

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

- `specs/planned/0018-backup-restauracao-workspace-pwa/research/backup-platform/evidence.md`:
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
- Enumerar recursivamente arquivos autorais permitidos em Markdown, JSON,
  anexos e arquivos desconhecidos que não pertençam a áreas operacionais
  reservadas.
- Gerar ZIP/ZIP64 com `openbible-backup.json` e `files/<caminho-relativo>`.
- Registrar política de Bíblias, contagem, bytes, tipo, tamanho e SHA-256 por
  entrada.
- Validar pacote e destino, escrever em staging, fazer commit/rollback e gerar
  relatório sem expor conteúdo completo ou caminho absoluto.
- Restaurar para OPFS, pasta autorizada pelo File System Access ou Tauri,
  abrindo autoral mesmo quando o índice derivado falhar.
- Oferecer fluxo responsivo e acessível na seção de armazenamento de
  `ConfigPage`/`WorkspaceSettings`.

#### Fora de escopo

- Sincronização contínua, transporte remoto ou resolução de conflito Automerge.
- Agentes de IA, chaves de provedores, embeddings e política de rede.
- Exportação de catálogo local, handles, referências OPFS, `localStorage`,
  IndexedDB do shell, Cache Storage, service worker, locks, logs ou temporários.
- Conversão de SQLite de Bíblia em Markdown/JSON ou edição de seu conteúdo.
- Hospedagem, nuvem, conta, criptografia de backup, compartilhamento automático
  e agendamento recorrente.
- Implementação da identidade e do seletor de workspaces, pertencente à
  SPEC-0016.

#### Atores

- **Pessoa usuária**: inicia, configura, acompanha, cancela e confirma backup ou
  restauração; escolhe Bíblias e destino.
- **Adaptador de storage**: enumera, lê, escreve, cria staging e informa
  capabilities no backend ativo.
- **Validador de pacote**: trata o arquivo recebido como dados, verifica
  manifesto, ZIP, caminhos, limites e hashes.
- **Índice local**: projeção descartável que será recriada após o commit e nunca
  é fonte do backup.

### 4. Princípios e restrições do projeto

- **PR-001**: Files over Apps; o pacote deve sobreviver sem OpenBible e não pode
  depender do OPFS, de handles ou do catálogo do aparelho.
- **PR-002**: ZIP/ZIP64 é somente um contêiner; o contrato autoral continua
  sendo Markdown/JSON/bytes com caminhos relativos e UTF-8 quando textual.
- **PR-003**: Cada arquivo de conteúdo possui tamanho declarado e SHA-256 dos
  bytes descompactados; divergência impede commit.
- **PR-004**: `openbible-backup.json` é a primeira entrada local do ZIP, sem
  compressão, em UTF-8 canônico, e a lista de arquivos fica ordenada por caminho.
- **PR-005**: Caminhos são relativos, com `/`, NFC, sem segmento vazio, `.`,
  `..`, prefixo absoluto, NUL, separador invertido ou colisão de case-folding.
- **PR-006**: O manifesto não inclui caminho absoluto, handle, chave OPFS,
  catálogo, segredo, cache ou índice SQLite.
- **PR-007**: O limite inicial é 100.000 entradas, 10 GiB descompactados por
  pacote, 4 GiB por entrada, 8 MiB para o manifesto e buffers ativos de 16 MiB.
- **PR-008**: O conteúdo recebido nunca é executado; HTML, JavaScript, links e
  arquivos especiais são dados, não comandos.
- **PR-009**: A restauração padrão cria workspace novo e a criação do catálogo
  somente ocorre depois de commit válido.
- **PR-010**: A implementação preserva SvelteKit/Svelte, TypeScript,
  `WorkspaceStorage`, shadcn-svelte e o fluxo de Configurações existente.

### 5. Histórias de usuário

#### US-001 — Criar uma cópia portátil verificável (P1)

Como pessoa usuária, quero criar backup do workspace ativo, para retirar meus
arquivos do navegador e verificar que a cópia representa o snapshot salvo.

**Por que P1**: sem exportação verificável, os dados OPFS continuam presos à
origem e não existe recuperação independente.
**Teste independente**: criar fixture com Markdown, JSON, anexo e Bíblia
opcional, gerar ZIP, ler o manifesto e comparar bytes e hashes.
**Requisitos**: FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002,
NFR-003, NFR-004.

#### US-002 — Restaurar sem destruir o workspace atual (P1)

Como pessoa usuária, quero validar e restaurar um pacote em workspace novo, para
recuperar meus arquivos após perder o OPFS ou trocar de aparelho.

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
    Given o workspace contém Markdown, JSON, anexos e arquivos autorais em subpastas
    When o backup percorre a raiz
    Then cada arquivo permitido entra no manifesto com caminho relativo, tamanho e SHA-256 e a operação usa iteradores e buffers limitados
```

#### AC-003 — Pacote portátil entre backends

**Cobre**: US-001, US-002, US-003, FR-003, NFR-004

```gherkin
@US-001 @US-002 @US-003 @FR-003 @NFR-004 @AC-003
Feature: Pacote portátil
  Scenario: levar backup de OPFS para pasta local ou Tauri
    Given um pacote ZIP válido foi criado no OPFS
    When ele é aberto por um adaptador File System Access ou Tauri
    Then o manifesto e os arquivos não exigem caminho absoluto, handle, chave OPFS ou catálogo de origem
```

#### AC-004 — Exclusão de estado operacional

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-004
Feature: Fronteira portátil
  Scenario: excluir projeções e referências do dispositivo
    Given a raiz contém index.sqlite, locks, temporários, logs e referências locais
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
    Given o workspaceId de origem já existe no catálogo local
    When a pessoa confirma o restore padrão
    Then o sistema cria outro ID estável, não altera o workspace ativo e cadastra a nova raiz somente depois do commit
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
  Scenario: abrir sem index.sqlite no pacote
    Given o backup não contém o índice SQLite
    When o commit autoral termina
    Then o destino abre com Markdown, JSON e anexos disponíveis e inicia a reconstrução ou marca a projeção para nova tentativa
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
- **FR-002**: O sistema deve enumerar recursivamente arquivos permitidos, excluir
  áreas operacionais reservadas e aplicar a política de Bíblias escolhida antes
  de adicionar uma entrada.
- **FR-003**: O sistema deve produzir e ler `.openbible-backup.zip` com
  `openbible-backup.json` na primeira entrada e `files/<path>` nas demais,
  respeitando o contrato de manifesto abaixo e informando que checksums não são
  assinatura nem prova de autoria.
- **FR-004**: O sistema deve excluir Bíblias por padrão, incluir somente após
  confirmação e restaurar as incluídas como SQLite imutável, sem substituir uma
  fonte diferente sem confirmação explícita.
- **FR-005**: O sistema deve usar leitura, hash, compressão e escrita
  incrementais, impor os limites declarados e informar quota/capability antes de
  prometer sucesso.
- **FR-006**: O sistema deve validar assinatura ZIP, versão, JSON, entrada
  regular, caminho canônico, duplicatas, case-folding, limites, tamanho e
  SHA-256 antes de qualquer commit.
- **FR-007**: O sistema deve criar staging privado, suportar commit/rollback
  conforme a capability, criar workspace novo por padrão e manter conflitos de
  destino existente explícitos e sem sobrescrita silenciosa.
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
  consumido por adaptadores OPFS, File System Access e Tauri, e a experiência
  deve expor progresso, erro, foco e próximo passo em teclado, leitor de tela,
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
  "source": { "workspaceId": "uuid", "displayName": "Estudos", "backend": "opfs", "workspaceFormatVersion": 2 },
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
  recovery, locks, logs, tmp e catálogo é rejeitado mesmo se surgir no arquivo.
- `files[].size` é o total exato de bytes descompactados; `sha256` é SHA-256 em
  hexadecimal minúsculo dos mesmos bytes; `role` é `authorial` ou `bible`.
  Tipos textuais preservam UTF-8; bytes de anexos permanecem sem reserialização.
- Um restore transforma a entrada ZIP `files/x` em `x` relativo à nova raiz.
  `.openbible/config.json` não é copiado como configuração operacional; o
  destino recebe config nova com ID, backend e marcadores locais recriados.

#### Erros e casos-limite

- Autosave pendente ou falho → impedir início/sucesso e oferecer repetir ou
  cancelar.
- OPFS indisponível, permissão revogada ou quota insuficiente → manter estado
  anterior, indicar backend e oferecer reconexão, outro destino ou cancelamento.
- Manifesto ausente, JSON inválido, versão incompatível, assinatura ZIP
  inválida ou hash divergente → rejeitar antes do commit e manter staging
  isolado para relatório/limpeza.
- Caminho absoluto, traversal, duplicata, case-folding, symlink ou tipo
  especial → rejeitar a entrada sem escrever fora do staging.
- Arquivo acima do limite, total acima de 10 GiB, mais de 100.000 entradas ou
  manifesto acima de 8 MiB → rejeitar antes de escrever conteúdo.
- Interrupção no streaming/commit → manter destino anterior e remover ou marcar
  staging recuperável; temporário nunca vira workspace válido.
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
- `WorkspaceStorage` oferece leitura, escrita, existência, exclusão e listagem;
  OPFS e File System Access percorrem `FileSystemDirectoryHandle`, e Tauri usa
  bridge tipada para arquivos locais.
- A SPEC-0016 fornece workspace ativo, identidade, catálogo e barreira de
  autosave; a SPEC-0017 fornece Markdown/JSON autorais e índice reconstruível.

#### Arquitetura e módulos

- `backup-contract.ts`: tipos versionados, limites, MIME, extensão, exclusões,
  normalização de caminho e validação pura do manifesto.
- `backup-enumerator.ts`: `AsyncIterable` de entradas do workspace, filtragem
  de áreas reservadas, política de Bíblias e contagem incremental.
- `backup-archive.ts`: leitor/escritor ZIP/ZIP64 streaming, entrada de manifesto
  inicial, UTF-8, Deflate/Store, CRC e rejeição de criptografia/tipo especial.
- `backup-hash.ts`: SHA-256 incremental sobre bytes descompactados; usa hasher
  incremental JS/WASM no PWA e bridge nativa no Tauri. WebCrypto só pode ser
  usado quando a entrada inteira já cabe no limite de 16 MiB.
- `backup-restore.ts`: validação por duas passagens, conflito explícito,
  materialização em staging, commit e relatório.
- `backup-staging.ts`: geração de ID, marcador, journal/rollback e limpeza ou
  recuperação de staging por backend.
- `backup-report.ts`: códigos de erro, contagens, tamanhos, exclusões e hashes
  sem conteúdo completo ou caminho absoluto.
- `BackupRestorePanel.svelte`: fluxo em Configurações, progressão, seleção de
  Bíblias, picker, relatório e ações de recuperação.

#### Migrations

Não aplicável: esta fatia não muda o schema SQLite nem cria tabela. O índice
continua excluído e reconstruível. A implementação pode registrar marcadores de
staging como arquivos reservados, sem migration de dados autorais.

#### Models

- `BackupManifest`: contrato JSON validado e imutável durante a operação.
- `BackupEntry`: caminho relativo, tamanho, SHA-256, media type e papel.
- `BackupPolicy`: inclusão de Bíblias e categorias omitidas.
- `BackupJob`: fase, geração do workspace, progresso, cancelamento e erro.
- `RestoreSession`: packageId/restoreId, destino, staging, política de conflito
  e marcador de commit.
- `RestoreReport`: resumo privado de sucesso, omissões, conflitos, hashes e
  recuperação.

#### Controllers e casos de uso

- `createBackup(options)`: aguarda flush, congela geração, enumera, cria
  manifesto e transmite arquivo para sink OPFS/FSA/Tauri/download limitado.
- `validateBackup(input)`: lê manifesto/central directory, valida contrato,
  limites, caminhos, tipos e hashes sem ativar o workspace.
- `restoreBackup(input, destination)`: cria staging, verifica cada entrada,
  resolve política de ID/conflito, commita e cadastra após sucesso.
- `recoverStaging()` e `discardStaging()`: listam marcadores recuperáveis sem
  tratar staging como conteúdo ativo.
- Os casos de uso dependem de interfaces de storage e de archive, nunca chamam
  OPFS, File System Access, Tauri ou `localStorage` diretamente.

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

- Não há query nova. O índice não é lido para decidir o conteúdo do backup.
- Repositórios futuros usam `WorkspaceStorage` para enumeração e escrita; após
  commit disparam a reconstrução definida na SPEC-0017.

#### Jobs e processamento assíncrono

- O job roda no foreground/worker iniciado pela página e pode cooperar com
  cancelamento. Service worker não é backend persistente.
- Falhas de permissão/quota/checksum são classificadas por código estável; retry
  reabre um novo staging ou retoma somente quando houver marcador válido, sem
  reutilizar bytes não verificados.

#### Estrutura de arquivos

```text
specs/planned/0018-backup-restauracao-workspace-pwa/
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
| `BackupJob` | `jobId` local | fase, workspaceId, generation, bytes, entries, cancelamento e erro | lê um workspace e produz um manifesto |
| `RestoreSession` | `restoreId` aleatório | package fingerprint, destino, staging, conflictPolicy e commit marker | materializa um manifesto |
| `RestoreReport` | `restoreId` | status, contagens, exclusões, conflitos, codes e nextAction; sem conteúdo completo | resulta de backup ou restore |
| `WorkspaceManifest` | `workspaceId` | config nova no destino; path/handle/catálogo são locais e não entram no pacote | criado após commit |

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
| `RestoreSession` | `staging` | todas as entradas verificadas | `ready-to-commit` | hashes e conflitos conhecidos |
| `RestoreSession` | `ready-to-commit` | confirmação | `committing` | destino não ativo antes do marcador |
| `RestoreSession` | `committing` | marcador/catálogo concluídos | `committed` | ID único e autoral íntegro |
| `RestoreSession` | qualquer antes do commit | falha | `recoverable` ou `discarded` | workspace anterior intacto |

#### Migração e retenção

Não há migração de schema. Pacotes são imutáveis após geração. O staging é
temporário e pode ser apagado após commit ou retido com marcador para
recuperação explícita. O relatório fica somente na sessão local e não é copiado
para o workspace como fonte autoral. O conteúdo restaurado segue a retenção
definida pelos arquivos do próprio workspace; o índice é recriado e pode ser
descartado sem perda.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A pessoa cria/restaura backup pela seção
  `Configurações > Armazenamento`, acompanha fases e decide política de Bíblias,
  destino, conflitos e descarte de staging.

#### Stack e convenções de interface

- Preservar SvelteKit/Svelte 5, componentes `.svelte`, TypeScript, Tailwind 4,
  tokens claro/escuro e primitives locais shadcn-svelte. Não introduzir React,
  servidor local ou biblioteca de UI paralela.
- Preservar `ConfigPage.svelte` como composição de seções e
  `WorkspaceSettings.svelte` como bloco de storage; o novo painel é extensão
  da seção existente, não rota independente.
- Usar `Dialog` para confirmação e conflitos, `Button` para ações, `Progress`
  para fases, `Alert`/live region para falha e `Drawer` apenas onde o shell
  mobile já o exigir. A implementação deve atualizar `INTERFACE.md` conforme
  os componentes reais.

#### Telas e responsabilidades

- **Configurações > Armazenamento (desktop)**: exibe backend, workspace ativo,
  persistência, ações `Criar backup` e `Restaurar backup`, e o painel de
  armazenamento existente.
- **Configurações > Armazenamento (mobile)**: mesma tarefa em fluxo vertical,
  com foco na seção aberta e ações ocupando a largura disponível.
- **Dialog Criar backup**: mostra snapshot, estimativa, exclusões, checkbox
  `Incluir Bíblias importadas`, sink e confirmação.
- **Dialog Restaurar backup**: recebe arquivo, valida manifest/limites, mostra
  origem, contagens e conflitos, permite `Novo workspace` por padrão e destino
  existente apenas com confirmação.
- **Painel de relatório/recovery**: apresenta sucesso, cancelamento, falha,
  staging recuperável, rebuild pendente e ações de repetir, descartar, abrir ou
  escolher outro destino.

#### Fluxo de informação e navegação

- A pessoa chega por `Sidebar > Configurações` e seleciona `Armazenamento`.
  No mobile, usa o índice/drawer de Configurações já existente.
- Backup: abrir ação → confirmar snapshot/política → aguardar autosave →
  escolher sink → acompanhar → baixar/salvar → consultar relatório.
- Restore: escolher arquivo → validar sem escrita → revisar origem/política/
  conflitos → escolher destino → confirmar → acompanhar staging/commit/rebuild
  → abrir novo workspace ou repetir recuperação.
- Breadcrumb contextual: `OpenBible / Configurações / Armazenamento`; no mobile,
  o botão de voltar do subpainel mantém a mesma sequência sem overflow.

#### Menus e navegação principal

- Menu principal desktop: item `Configurações` existente no Sidebar leva a `/config`; seção
  `Armazenamento` permanece no índice lateral.
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
  picker; modo `Novo workspace` marcado; seleção de existente exige
  confirmação adicional e fica indisponível com explicação quando o adapter não
  comprova commit atômico/rollback; política de conflito `parar e revisar` inicial.
- Ações de erro: `Tentar novamente`, `Escolher outro destino`, `Descartar
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
| Armazenamento | Não aplicável; bloco Svelte | Expor ações e fatos do workspace | `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` | composição existente + `Button` | Svelte/shadcn-svelte local | Estender bloco atual |
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
- Não há rota HTTP nem serviço local persistente. O sink usa `WorkspaceStorage`,
  `FileSystemWritableFileStream`, arquivo selecionado ou bridge Tauri conforme
  capability.

#### APIs externas utilizadas

- OPFS (`navigator.storage.getDirectory`, `navigator.storage.estimate`) para
  workspace lógico e staging local.
- File System Access (`showDirectoryPicker`, `showOpenFilePicker`,
  `showSaveFilePicker` quando disponível), sempre por gesto e permissão
  explícitos; fallback por arquivo informa limitações.
- `CompressionStream`/`DecompressionStream` somente como capacidade opcional de
  Deflate/gzip dentro do adaptador; não altera o contrato ZIP.
- Hasher SHA-256 incremental JS/WASM ou bridge nativa, sem rede; WebCrypto fica
  limitado a entradas inteiras de até 16 MiB porque sua API de digest não é streaming.

#### Documentação das APIs consultadas

- OPFS e File System Access: MDN URLs registradas na seção 2 e em
  `research/backup-platform/evidence.md`; impacto: capabilities explícitas,
  quota, streaming e fallback.
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

Os REDs da fase 6 são testes Vitest unitários/contratuais, isolados de
filesystem real e sem dependência de implementação. Cada caso prepara um
`WorkspaceStorage` real da aplicação, importa o namespace público existente de
`../workspace`, materializa um AC do BDD de referência e invoca a função
prevista contra a fixture, marcando os IDs com `SPECSFY:`. A integração entre
enumerador, archive, hash, staging e adapters fica coberta por contratos
falsáveis; E2E e revisão visual permanecem para as tarefas de interface.

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
| AC-003 | `apps/web/src/lib/storage/backup/backup-portability.test.ts` | RED comportamental | Pendente | Pendente |
| AC-004 | `apps/web/src/lib/storage/backup/backup-exclusions.test.ts` | RED comportamental | Pendente | Pendente |
| AC-005 | `apps/web/src/lib/storage/backup/backup-bible-policy.test.ts` | RED comportamental | Pendente | Pendente |
| AC-006 | `apps/web/src/lib/storage/backup/backup-integrity.test.ts` | RED comportamental | Pendente | Pendente |
| AC-007 | `apps/web/src/lib/storage/backup/backup-streaming.test.ts` | RED comportamental | Pendente | Pendente |
| AC-008 | `apps/web/src/lib/storage/backup/backup-path-validation.test.ts` | RED comportamental | Pendente | Pendente |
| AC-009 | `apps/web/src/lib/storage/backup/backup-staging.test.ts` | RED comportamental | Pendente | Pendente |
| AC-010 | `apps/web/src/lib/storage/backup/backup-workspace-id.test.ts` | RED comportamental | Pendente | Pendente |
| AC-011 | `apps/web/src/lib/storage/backup/backup-conflicts.test.ts` | RED comportamental | Pendente | Pendente |
| AC-012 | `apps/web/src/lib/storage/backup/backup-index-rebuild.test.ts` | RED comportamental | Pendente | Pendente |
| AC-013 | `apps/web/src/lib/storage/backup/backup-index-failure.test.ts` | RED comportamental | Pendente | Pendente |
| AC-014 | `apps/web/src/lib/storage/backup/backup-report.test.ts` | RED comportamental | Pendente | Pendente |

### 12. Plano de testes e rastreabilidade

| Classe | Cobertura materializada | Evidência |
| --- | --- | --- |
| US-001 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-007, AC-014 | testes RED com marcadores `SPECSFY` |
| US-002 | AC-003, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 | testes RED com marcadores `SPECSFY` |
| US-003 | AC-003, AC-005, AC-006, AC-012, AC-014 | testes RED com marcadores `SPECSFY` |
| US-004 | AC-001, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 | testes RED com marcadores `SPECSFY` |
| FR-001..FR-008 | AC distribuídos pelas 14 tarefas T001–T014 | seção 14, refs por tarefa e marcadores nos arquivos |
| NFR-001..NFR-004 | AC distribuídos pelas 14 tarefas T001–T014 | seção 14, refs por tarefa e marcadores nos arquivos |

Não há arquivos `.feature` nem step definitions: o Gherkin da especificação é
a referência de comportamento e os testes Vitest são a materialização RED.
Testes E2E, acessibilidade/visual e integração com adapters reais serão
adicionados nas tarefas de código/interface, depois do Plan Gate.

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed em 2026-09-05 — READY; formato Specsfy/2.0 válido e cobertura mínima confirmada para 4 US, 8 FR e 4 NFR, cada qual ligado a pelo menos 3 AC distintos.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0018-backup-restauracao-workspace-pwa/spec.md`
- **Achados**: nenhum P1 aberto. Revisão de produto, arquitetura e segurança concluída.
- **FIND-PROD-001** [P2] [Resolved] destino existente aparecia sem condicionar a capability do backend — Refs: FR-007 — Evidence: specs/planned/0018-backup-restauracao-workspace-pwa/spec.md:979 — Effect: o PWA poderia prometer rollback que não consegue cumprir — Suggestion: resolvido bloqueando a opção sem troca atômica e orientando workspace novo.
- **FIND-ARCH-001** [P1] [Resolved] WebCrypto havia sido tratado como hasher incremental — Refs: NFR-003 — Evidence: specs/planned/0018-backup-restauracao-workspace-pwa/spec.md:68 — Effect: arquivos grandes exigiriam leitura integral e romperiam o limite de memória — Suggestion: resolvido com hasher incremental JS/WASM ou bridge e WebCrypto limitado a 16 MiB.
- **FIND-SEC-001** [P1] [Resolved] SHA-256 sem assinatura poderia ser entendido como autenticidade do pacote — Refs: FR-003 — Evidence: specs/planned/0018-backup-restauracao-workspace-pwa/spec.md:437 — Effect: a interface poderia assegurar proteção inexistente contra reescrita coordenada — Suggestion: resolvido definindo checksum como detecção de corrupção/divergência e não prova de origem.

#### Gate do Ato II — Plano

- **Resultado**: Passed em 2026-09-05 — 32 tarefas, 14 TDD, 13 CODE e 5 DOC/fechamento; todas as referências US/FR/NFR/AC cobertas e tarefas de interface com registro em `INTERFACE.md`.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0018-backup-restauracao-workspace-pwa/spec.md` e `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/planned/0018-backup-restauracao-workspace-pwa/spec.md`
- **Achados**: nenhum erro ou warning; 14 tarefas TDD foram concluídas com RED válido. As tarefas CODE/DOC permanecem abertas para a implementação posterior.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress — apenas REDs foram materializados; nenhum código de produto foi implementado.
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0018-backup-restauracao-workspace-pwa/spec.md apps/web/src/lib/storage/backup --full-chain`
- **Achados**: rastreabilidade focal OK, 30/30 IDs cobertos em 14 arquivos de teste; 14 arquivos/14 testes RED comportamentais registrados. GREEN, refactor, interface, documentação e regressão final permanecem pendentes por desenho.

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

#### Fase 2 — Fundação de contrato e processamento

- [ ] T015 [CODE] [US-001] Implementar contrato de pacote e validação determinística em `apps/web/src/lib/storage/backup/backup-contract.ts` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014 — Depends: T001, T003, T006, T008, T014
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014 e os limites de contrato de pacote e validação determinística.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-contract.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-contract.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: contrato de pacote e validação determinística não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-006, NFR-001, NFR-002, NFR-004, AC-001, AC-003, AC-006, AC-008, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T016 [CODE] [US-001] Implementar enumeração recursiva e política de exclusão em `apps/web/src/lib/storage/backup/backup-enumerator.ts` — Refs: US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005 — Depends: T001, T002, T004, T005
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005 e os limites de enumeração recursiva e política de exclusão.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-enumerator.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-enumerator.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: enumeração recursiva e política de exclusão não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-003, FR-001, FR-002, FR-004, NFR-002, NFR-003, AC-001, AC-002, AC-004, AC-005; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T017 [CODE] [US-001] Implementar writer/reader ZIP/ZIP64 streaming em `apps/web/src/lib/storage/backup/backup-archive.ts` — Refs: US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007 — Depends: T003, T006, T007, T008
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007 e os limites de writer/reader ZIP/ZIP64 streaming.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-archive.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-archive.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: writer/reader ZIP/ZIP64 streaming não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-003, NFR-004, AC-003, AC-006, AC-007; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T018 [CODE] [US-001] Implementar hash incremental SHA-256 em `apps/web/src/lib/storage/backup/backup-hash.ts` — Refs: US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007 — Depends: T001, T006, T007
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007 e os limites de hash incremental SHA-256.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-hash.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-hash.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: hash incremental SHA-256 não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-002, US-003, FR-003, FR-005, FR-006, NFR-001, NFR-003, AC-006, AC-007; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T019 [CODE] [US-002] Implementar validação e conflitos de restore em `apps/web/src/lib/storage/backup/backup-restore.ts` — Refs: US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011 — Depends: T006, T008, T010, T011, T015, T017, T018
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011 e os limites de validação e conflitos de restore.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-restore.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-restore.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: validação e conflitos de restore não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-006, AC-008, AC-010, AC-011; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T020 [CODE] [US-002] Implementar staging, commit marker e rollback em `apps/web/src/lib/storage/backup/backup-staging.ts` — Refs: US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010 — Depends: T001, T009, T010, T015
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010 e os limites de staging, commit marker e rollback.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-staging.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-staging.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: staging, commit marker e rollback não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-002, US-004, FR-001, FR-005, FR-007, NFR-001, NFR-003, AC-001, AC-009, AC-010; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T021 [CODE] [US-002] Implementar adapters OPFS, File System Access e Tauri em `apps/web/src/lib/storage/backup/backup-adapters.ts` — Refs: US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012 — Depends: T003, T007, T009, T012, T017, T019, T020
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012 e os limites de adapters OPFS, File System Access e Tauri.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-adapters.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-adapters.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: adapters OPFS, File System Access e Tauri não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-002, US-003, US-004, FR-003, FR-005, FR-007, FR-008, NFR-003, NFR-004, AC-003, AC-007, AC-009, AC-012; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T022 [CODE] [US-004] Implementar relatório, códigos de erro e recovery em `apps/web/src/lib/storage/backup/backup-report.ts` — Refs: US-001, US-002, US-003, US-004, FR-004, FR-008, NFR-002, NFR-004, AC-005, AC-012, AC-013, AC-014 — Depends: T005, T012, T013, T014, T019, T020, T021
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-002, US-003, US-004, FR-004, FR-008, NFR-002, NFR-004, AC-005, AC-012, AC-013, AC-014 e os limites de relatório, códigos de erro e recovery.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/storage/backup/backup-report.ts`, preservando as interfaces e convenções Svelte/TypeScript existentes.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- apps/web/src/lib/storage/backup/backup-report.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Não aplicável: relatório, códigos de erro e recovery não possui superfície visual; registrar esse motivo na evidência.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-002, US-003, US-004, FR-004, FR-008, NFR-002, NFR-004, AC-005, AC-012, AC-013, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

#### Fase de interface

- [ ] T023 [CODE] [US-001] Implementar ações de backup/restauração na configuração desktop em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 — Depends: T001, T005, T014, T016, T022
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 e os limites de ações de backup/restauração na configuração desktop.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte`, preservando as interfaces e convenções Svelte/TypeScript existentes e registrando os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t023-backup.svelte.spec.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320 px e 1440 px nos estados relevantes, teclado, zoom, claro/escuro, reduced motion e ausência de overflow.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T024 [CODE] [US-001] Implementar fluxo de armazenamento mobile em `apps/web/src/lib/features/config/ConfigPage.svelte` — Refs: US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 — Depends: T001, T005, T014, T023
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014 e os limites de fluxo de armazenamento mobile.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/features/config/ConfigPage.svelte`, preservando as interfaces e convenções Svelte/TypeScript existentes e registrando os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t024-backup.svelte.spec.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320 px e 1440 px nos estados relevantes, teclado, zoom, claro/escuro, reduced motion e ausência de overflow.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-003, FR-001, FR-004, FR-008, NFR-004, AC-001, AC-005, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T025 [CODE] [US-001] Implementar dialog de criação de backup em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014 — Depends: T001, T002, T004, T005, T007, T009, T014, T016, T017, T018, T022, T023
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014 e os limites de dialog de criação de backup.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte`, preservando as interfaces e convenções Svelte/TypeScript existentes e registrando os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t025-backup.svelte.spec.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320 px e 1440 px nos estados relevantes, teclado, zoom, claro/escuro, reduced motion e ausência de overflow.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-001, US-003, US-004, FR-001, FR-002, FR-004, FR-005, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-004, AC-005, AC-007, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T026 [CODE] [US-002] Implementar dialog de validação e restauração em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 — Depends: T003, T006, T008, T009, T010, T011, T015, T017, T019, T020, T021
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 e os limites de dialog de validação e restauração.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte`, preservando as interfaces e convenções Svelte/TypeScript existentes e registrando os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t026-backup.svelte.spec.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320 px e 1440 px nos estados relevantes, teclado, zoom, claro/escuro, reduced motion e ausência de overflow.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-002, US-004, FR-003, FR-006, FR-007, NFR-001, NFR-002, NFR-004, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

- [ ] T027 [CODE] [US-004] Implementar relatório e recovery visual em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte` — Refs: US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014 — Depends: T009, T011, T012, T013, T014, T020, T021, T022, T026
  - [ ] **PREP**: Confirmar os REDs predecessores, a seção 8/10, os IDs US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014 e os limites de relatório e recovery visual.
  - [ ] **EXECUTE**: Produzir somente a menor entrega em `apps/web/src/lib/features/workspace/BackupRestorePanel.svelte`, preservando as interfaces e convenções Svelte/TypeScript existentes e registrando os blocos em `INTERFACE.md`.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/t027-backup.svelte.spec.ts` e a regressão focal relacionada; confirmar comportamento GREEN sem mascarar falhas.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320 px e 1440 px nos estados relevantes, teclado, zoom, claro/escuro, reduced motion e ausência de overflow.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivos, estados e IDs US-002, US-004, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-009, AC-011, AC-012, AC-013, AC-014; inserir o comentário `specsfy:evidence` JSON quando a tarefa concluir.
  - [ ] **IMPROVE**: Registrar uma melhoria concreta de isolamento, acessibilidade, segurança ou desempenho, ou justificar a ausência.

#### Fase de documentação e fechamento

- [ ] T028 [DOC] [US-003] Atualizar mapa de persistência do pacote e índice derivado em `.specsfy/DATABASE.md` — Refs: US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 — Depends: T017, T021, T022
  - [ ] **PREP**: Ler a fonte atual, confirmar o alcance dos IDs US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 e preservar conteúdo humano fora dos blocos gerenciados.
  - [ ] **EXECUTE**: Produzir a atualização documental em `.specsfy/DATABASE.md`, sem criar outra fonte normativa ou inventar dependência.
  - [ ] **VERIFY**: Executar o verificador/documentator focal e conferir caminhos, versões, retenção e ausência de segredos.
  - [ ] **VISUAL**: Não aplicável: mapa de persistência do pacote e índice derivado é documentação sem superfície visual.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivo alterado e IDs US-003, FR-003, FR-004, FR-008, NFR-002, NFR-003, AC-005, AC-012, AC-014 no checklist da tarefa.
  - [ ] **IMPROVE**: Remover duplicação e deixar explícita a fronteira entre conteúdo autoral, operação e projeção.

- [ ] T029 [DOC] [US-001] Atualizar componentes e estados em INTERFACE.md em `INTERFACE.md` — Refs: US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 — Depends: T023, T024, T025, T026, T027
  - [ ] **PREP**: Ler a fonte atual, confirmar o alcance dos IDs US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 e preservar conteúdo humano fora dos blocos gerenciados.
  - [ ] **EXECUTE**: Produzir a atualização documental em `INTERFACE.md`, sem criar outra fonte normativa ou inventar dependência.
  - [ ] **VERIFY**: Executar o verificador/documentator focal e conferir caminhos, versões, retenção e ausência de segredos.
  - [ ] **VISUAL**: Não aplicável: componentes e estados em INTERFACE.md é documentação sem superfície visual.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivo alterado e IDs US-001, US-002, US-004, FR-001, FR-007, FR-008, NFR-004, AC-001, AC-009, AC-013, AC-014 no checklist da tarefa.
  - [ ] **IMPROVE**: Remover duplicação e deixar explícita a fronteira entre conteúdo autoral, operação e projeção.

- [ ] T030 [DOC] [US-001] Atualizar documentação técnica em PROJECT.md e docs/ em `PROJECT.md e docs/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-003, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-003, AC-009, AC-012, AC-014 — Depends: T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027
  - [ ] **PREP**: Ler a fonte atual, confirmar o alcance dos IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-003, AC-009, AC-012, AC-014 e preservar conteúdo humano fora dos blocos gerenciados.
  - [ ] **EXECUTE**: Produzir a atualização documental em `PROJECT.md e docs/`, sem criar outra fonte normativa ou inventar dependência.
  - [ ] **VERIFY**: Executar o verificador/documentator focal e conferir caminhos, versões, retenção e ausência de segredos.
  - [ ] **VISUAL**: Não aplicável: documentação técnica em PROJECT.md e docs/ é documentação sem superfície visual.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivo alterado e IDs US-001, US-002, US-003, US-004, FR-001, FR-003, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-003, AC-009, AC-012, AC-014 no checklist da tarefa.
  - [ ] **IMPROVE**: Remover duplicação e deixar explícita a fronteira entre conteúdo autoral, operação e projeção.

- [ ] T031 [DOC] [US-001] Atualizar reconciliação de stack e dependências ZIP em `.specsfy/STACK.md` e `.specsfy/PACKAGES.md` em `.specsfy/STACK.md e .specsfy/PACKAGES.md` — Refs: US-001, US-002, FR-003, FR-005, NFR-003, NFR-004, AC-003, AC-007 — Depends: T017, T018, T021
  - [ ] **PREP**: Ler a fonte atual, confirmar o alcance dos IDs US-001, US-002, FR-003, FR-005, NFR-003, NFR-004, AC-003, AC-007 e preservar conteúdo humano fora dos blocos gerenciados.
  - [ ] **EXECUTE**: Produzir a atualização documental em `.specsfy/STACK.md e .specsfy/PACKAGES.md`, sem criar outra fonte normativa ou inventar dependência.
  - [ ] **VERIFY**: Executar o verificador/documentator focal e conferir caminhos, versões, retenção e ausência de segredos.
  - [ ] **VISUAL**: Não aplicável: reconciliação de stack e dependências ZIP em `.specsfy/STACK.md` e `.specsfy/PACKAGES.md` é documentação sem superfície visual.
  - [ ] **EVIDENCE**: Registrar comando, exit, arquivo alterado e IDs US-001, US-002, FR-003, FR-005, NFR-003, NFR-004, AC-003, AC-007 no checklist da tarefa.
  - [ ] **IMPROVE**: Remover duplicação e deixar explícita a fronteira entre conteúdo autoral, operação e projeção.

- [ ] T032 [TEST] [US-004] Executar regressão focal e rastreabilidade em `apps/web/src/lib/storage/backup/` e `apps/web/src/lib/features/workspace/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T028, T029, T030, T031
  - [ ] **PREP**: Identificar suites Vitest, check de tipos, lint, rastreabilidade, baseline e revisão visual final.
  - [ ] **EXECUTE**: Executar a regressão focal, os checks estáticos e a rastreabilidade sem executar Gherkin.
  - [ ] **VERIFY**: Confirmar ausência de gaps, limites medidos, caminhos seguros e documentação reconciliada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nos viewports 320 px/1440 px e estados da operação.
  - [ ] **EVIDENCE**: Registrar comandos, exits, contagens, IDs e o comentário `specsfy:evidence` de fechamento.
  - [ ] **IMPROVE**: Consolidar aprendizados e registrar qualquer ajuste normativo necessário.

### 15. Ordem de execução

- Estado após a fase 6: T001–T014 estão concluídas com RED válido; a próxima
  tarefa pronta é T015. A execução para aqui para delegação posterior da fase
  7 ao agente implementador, sem antecipar código de produto.
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
- `WorkspaceStorage` precisa ganhar enumeração recursiva, capabilities de
  staging/commit e sinks de arquivo sem quebrar OPFS, File System Access e
  Tauri.
- WebCrypto/worker e um writer/reader ZIP streaming compatível com ZIP64 devem
  estar disponíveis ou ser encapsulados atrás de interfaces testáveis.

#### Riscos

- Quota e capacidades variam entre navegadores → estimar antes, mostrar limite,
  usar staging e recusar operação sem sink apropriado.
- ZIP/ZIP64 e parser streaming podem exigir dependência nova → encapsular o
  contêiner e manter fixture de interoperabilidade antes da integração.
- Atomicidade física varia entre OPFS, FSA e Tauri → usar marcador de commit,
  journal, destino novo e registro no catálogo somente no final; restauração
  sobre workspace existente fica bloqueada quando o adapter não comprovar troca
  atômica da raiz e rollback.
- Arquivos desconhecidos podem conter tipos perigosos → preservar bytes apenas
  como dados, rejeitar symlink/especial no adapter nativo e nunca executar.
- Restore de Bíblia pode substituir fonte incorreta → hash, imutabilidade,
  deduplicação somente explícita e relatório por arquivo.
- Download grande em navegador sem save picker não possui sink nativo universal
  → aplicar limite de Blob de 512 MiB e explicar requisito de destino streaming.

#### Suposições

- O workspace ativo oferece uma barreira de autosave observável e generation
  token conforme SPEC-0016.
- A origem pode ser enumerada sem depender do índice SQLite e o adapter informa
  tipo regular, tamanho e bytes.
- A primeira versão não criptografa nem envia backup para rede; a pessoa é
  responsável pela guarda física do arquivo.
- O nome sugerido da restauração pode ser alterado sem renomear a raiz até que
  o workspace esteja cadastrado.
- O relatório de operação é operacional e não deve virar fonte autoral ou ser
  sincronizado.

### 17. Decisões

- **DEC-001**: usar `.openbible-backup.zip` com ZIP/ZIP64 — preserva abertura em
  ferramentas comuns e suporta múltiplos arquivos grandes; o adaptador pode
  usar Deflate ou Store conforme capacidade.
- **DEC-002**: deixar `openbible-backup.json` como primeira entrada Store —
  permite inspeção e validação antecipadas; o central directory continua sendo
  validado antes do commit.
- **DEC-003**: hashear bytes descompactados com SHA-256 — torna o contrato
  independente da escolha de compressor e detecta corrupção/divergência; sem
  assinatura, não autentica a origem contra reescrita coordenada do manifesto.
- **DEC-004**: não incluir `index.sqlite` — o índice é projeção reconstruível;
  excluir evita restaurar estado obsoleto ou corrompido.
- **DEC-005**: excluir catálogo, handles, OPFS key, cache, localStorage,
  IndexedDB do shell e service worker — são referências privadas do aparelho,
  não conteúdo portátil.
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
  troca atômica da raiz e rollback — no PWA sem essa capability, a opção aparece
  indisponível e orienta restaurar em workspace novo.
- **DEC-010**: não usar service worker como servidor local — sua natureza é
  orientada a eventos; backup precisa de sink explícito e fallback honesto.
- **DEC-011**: manter conteúdo autoral legível sem o aplicativo — restauração e
  relatório devem preservar Files over Apps mesmo quando o índice ainda não foi
  reconstruído.
- **DEC-012**: manter relatório operacional fora do workspace — evita misturar
  logs e caminhos sensíveis com a fonte autoral e com Automerge futuro.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
- [ ] `.specsfy/DATABASE.md`, `INTERFACE.md`, `PROJECT.md` e `docs/` refletem o contrato final de storage, pacote e interface.

Estado desta fase: Draft intencional. As seções 11–15 aguardam validate, tasks e
TDD/BDD; nenhuma implementação de produto foi iniciada.
