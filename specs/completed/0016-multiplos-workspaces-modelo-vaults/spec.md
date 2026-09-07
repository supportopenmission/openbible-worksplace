# Especificação integrada: Múltiplos workspaces no modelo de vaults

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0016 |
| Slug | 0016-multiplos-workspaces-modelo-vaults |
| Status | Complete |
| Effort | 9 |
| Effort updated at | 2026-09-06 |
| Effort rationale | A atualização troca os backends ativos de filesystem por SQLite nativo no Tauri e IndexedDB no PWA, preserva migração legada, exige paridade transacional, isolamento por workspace e replanejamento da persistência antes de retomar a implementação. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

> **Atualização normativa de 2026-09-06:** esta revisão reabriu a SPEC-0016 por mudança de comportamento e de arquitetura. O workspace ativo deixa de ser uma raiz de filesystem mantida por Tauri/FSA/OPFS e passa a ser uma entidade persistida no banco do aplicativo: SQLite nativo no Tauri e IndexedDB no PWA. As evidências e tarefas da arquitetura anterior permanecem registradas como histórico; o Definition Gate foi refeito e o Plan Gate foi passado após a materialização dos REDs T030–T038.

> **Atualização de interface de 2026-09-06:** a tela de Configurações separa a identidade do workspace do mecanismo de armazenamento. A navegação passa a expor as abas `Armazenamento` e `Workspaces`; a primeira concentra backend, persistência e troca de destino, e a segunda concentra o ciclo de vida do workspace.

### 1. Problema e resultado

#### Problema

O OpenBible atualmente parte de um único workspace por instalação/origem e mistura a identidade do workspace com referências de filesystem. Isso torna a persistência diferente entre Tauri, navegador e PWA, aumenta a superfície de migração e dificulta a evolução para sincronização local-first. A arquitetura revisada precisa centralizar a persistência dos workspaces em um contrato único, usando SQLite nativo no Tauri e IndexedDB no PWA, sem transformar Markdown ou PDF em formato de armazenamento primário.

#### Resultado desejado

A pessoa consegue criar, cadastrar, selecionar, renomear, remover da lista e excluir com segurança vários workspaces. Existe exatamente um workspace ativo por janela/sessão; todas as leituras, gravações, índices, sincronizações futuras e contextos de agentes resolvem primeiro essa identidade. O contrato lógico é o mesmo nos dois ambientes: o Tauri persiste em SQLite nativo (`app.sqlite` ou equivalente definido no Ato II) e o PWA em IndexedDB, com `workspaceId` explícito e isolamento transacional. A Bíblia em SQLite WASM pode permanecer como recurso binário consultável no PWA; ela não precisa ser importada como tabelas do IndexedDB nesta fatia.

Markdown e PDF são formatos de exportação das notas. A futura geração de Markdown interoperável e PDF deverá consumir o conteúdo do workspace por um parser/exportador definido nas specs de notas, sem tornar esses formatos a fonte primária de dados.

#### Métricas de sucesso

- 100% das inicializações legadas preservam o workspace existente e concluem uma migração idempotente para o banco local sem apagar a fonte legada.
- 100% das trocas bem-sucedidas demonstram que a operação seguinte lê e grava somente o `workspaceId` ativo; uma falha de flush/transação mantém o workspace anterior ativo.
- 100% dos cenários equivalentes produzem o mesmo resultado lógico em SQLite nativo e IndexedDB, incluindo criação, troca, remoção, exclusão e recuperação.
- O mesmo fluxo de seleção expõe criar, adicionar, gerenciar e recuperar no desktop e no mobile, sem overflow em viewport de 320px.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Como o armazenamento é escolhido hoje? → O projeto possui uma abstração `WorkspaceStorage`, registros singulares de sessão/estado e adaptadores Tauri, File System Access e OPFS; a revisão deve substituir o caminho ativo por uma porta de persistência com adapters SQLite nativo e IndexedDB, mantendo filesystem apenas como fonte legada de importação.
- **R-002**: Como a interface atual acomoda a seleção? → `AppSidebar` possui `Sidebar.Header`, `AppFrame` compõe o shell responsivo, e `WorkspaceSettings`/`PermissionRecovery` já concentram configuração e recuperação; a seleção deve reutilizar esses pontos.
- **R-003**: Como separar conteúdo portátil de referências locais? → A identidade e o conteúdo operacional do workspace passam a ser persistidos no banco local do ambiente; paths, handles e fontes legadas continuam locais e não sincronizáveis. Markdown/PDF são saídas, não a fonte primária.
- **R-004**: Qual backend é normativo em cada ambiente? → Tauri usa SQLite nativo; PWA usa IndexedDB. O domínio expõe um contrato lógico comum e não conhece APIs específicas.
- **R-005**: Como a Bíblia permanece disponível no PWA? → A Bíblia SQLite pode continuar como arquivo/binário consultado por SQLite WASM; ela não precisa ser convertida para tabelas do IndexedDB para esta migração.
- **R-006**: Como notas serão exportadas? → A fonte é o conteúdo persistido do workspace. Uma camada futura de parser/exportador gera Markdown interoperável e PDF; essa implementação pertence à spec de notas/exportação, não à fundação de workspaces.

#### Fontes e contexto consultados

- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md` — brief refinado e decisões D-001 a D-012.
- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico e dependências.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` e `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — bootstrap e runtime nativo existentes.
- `PROJECT.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md` e `.specsfy/USER-PROFILE.md`.
- Código atual em `apps/web/src/lib/storage/`, `apps/web/src/lib/features/navigation/` e `apps/web/src/lib/features/workspace/`.

#### Documentação consultada

- Specsfy/2.0 e template local de spec — formato, gates, rastreabilidade e contrato de interface.
- Documentação do próprio projeto sobre SvelteKit/Svelte 5, Tailwind 4, shadcn-svelte, Tauri, OPFS e a abstração `WorkspaceStorage` — restrições de stack e armazenamento observadas localmente.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo foi necessário; as conclusões normativas estão apoiadas nas fontes locais acima.

#### Dúvidas respondidas

- **Q**: Haverá uma experiência única de workspaces entre plataformas? → **A**: Sim. A experiência e o contrato lógico são únicos; Tauri persiste por SQLite nativo e PWA por IndexedDB. File System Access, OPFS e caminhos nativos ficam restritos à importação/compatibilidade de dados legados, não são backends ativos do workspace novo.
- **Q**: Onde fica o seletor? → **A**: No `Sidebar.Footer` desktop e no header/drawer mobile, com trocar, criar, gerenciar e recuperar; as regras de domínio permanecem compartilhadas.
- **Q**: O que ocorre com conteúdo não salvo? → **A**: O flush/commit da transação termina antes da troca; falha bloqueia a troca e oferece tentar novamente ou descartar explicitamente.
- **Q**: Remover e apagar são a mesma ação? → **A**: Não. Remover desanexa da listagem e preserva os registros; excluir é ação separada, confirmada e transacional.
- **Q**: Como tratar workspace indisponível? → **A**: Preservar a escolha, explicar erro de banco/migração ou fonte legada e oferecer retry/recovery/escolher outro, sem fallback silencioso.
- **Q**: Nome e identidade são a mesma coisa? → **A**: Não. `workspaceId` é estável; o nome é editável no banco sem alterar a identidade nem uma eventual fonte legada.
- **Q**: Como migrar o registro atual? → **A**: Cadastrar automaticamente o workspace atual no banco local, gerar/preservar ID, manter a fonte legada intacta e tornar a migração idempotente.
- **Q**: O banco do PWA deve ser SQLite WASM? → **A**: Não para a persistência operacional dos workspaces nesta fatia: IndexedDB é o backend normativo do PWA. A Bíblia SQLite permanece um recurso binário consultável por WASM.
- **Q**: Qual é o papel de Markdown e PDF? → **A**: São formatos de exportação das notas. Um parser/exportador futuro gera Markdown compatível/interoperável e PDF a partir do conteúdo persistido; não são o banco nem o formato authorial primário desta spec.

#### Dúvidas abertas

- Definir no Ato II o esquema físico dos object stores IndexedDB e a estratégia de blobs para notas/anexos, sem importar a Bíblia SQLite como linhas relacionais.

### 3. Escopo e atores

#### Incluído

- Banco lógico de workspaces por instalação/origem, com `workspaceId`, nome, estado, ponteiro ativo e metadados locais.
- Persistência nativa em SQLite no Tauri e persistência operacional em IndexedDB no PWA, por adapters sob um contrato comum.
- Migração idempotente do registro singular e importação somente-leitura da configuração/manifesto legados, sem apagar a fonte.
- Criar, selecionar, renomear, reconectar, remover da listagem e excluir registros de workspace com transações e confirmação.
- Isolamento de conteúdo, índices, preferências de conteúdo, sincronização futura e contexto de IA por `workspaceId` ativo.
- Barreira de flush/commit, token de geração para invalidar operações assíncronas antigas e recuperação de falhas de banco/migração.
- Compatibilidade temporária de leitura de pasta/OPFS/FSA/Tauri apenas para migrar dados legados; nenhum desses backends é o armazenamento operacional novo.
- Seletor/gestão em SvelteKit desktop e mobile, com estados de carregamento, vazio, erro, permissão e sucesso.
- Testes de contrato dos adapters SQLite/IndexedDB, paridade de resultados, estado de troca, migração, exclusão transacional e interface.

#### Fora de escopo

- Parser/exportador de notas para Markdown interoperável e PDF; a decisão de formato de saída pertence à próxima spec de notas/exportação e consome este workspace como fonte.
- Backup ZIP/restauração PWA; pertence a BACKLOG-0019.
- Automerge, transporte remoto, resolução de conflitos e sincronização do catálogo; pertence a BACKLOG-0020.
- Agentes, credenciais, embeddings e política de contexto; pertence a BACKLOG-0021.
- Renomear pasta física, manter filesystem como backend ativo, abrir dois workspaces simultaneamente na mesma janela ou sincronizar caminhos/handles.
- Implementação de código nesta etapa; a execução começa somente após o Plan Gate e será delegada separadamente.

#### Atores

- **Pessoa usuária individual**: cria, escolhe e administra as próprias raízes locais; confirma ações destrutivas.
- **OpenBible web/PWA**: coordena estado ativo, adapter IndexedDB, flush/commit e recuperação dentro das capacidades do navegador.
- **OpenBible Tauri**: coordena o adapter SQLite nativo e transações locais; bridge nativa não expõe filesystem como backend operacional.
- **Fonte legada**: pasta, manifesto ou banco existente que pode ser lido durante a migração, sem tornar-se a autoridade após a migração.
- **Banco local do dispositivo**: autoridade operacional dos workspaces desta fatia; não é payload de Automerge/sync.

### 4. Princípios e restrições do projeto

- **PR-001 — Banco por ambiente**: Tauri usa SQLite nativo e PWA usa IndexedDB para a persistência operacional dos workspaces; o domínio não conhece o backend.
- **PR-002 — Identidade estável**: `workspaceId` e nome são dados persistidos no banco local; path, handle e fonte legada são referências locais temporárias e não entram em sync.
- **PR-003 — Um ativo por janela**: toda operação recebe o workspace ativo de um único contexto; uma operação sem identidade ativa falha explicitamente.
- **PR-004 — Isolamento por chave**: toda tabela/object store de domínio deve carregar ou derivar `workspaceId`; consultas sem escopo falham ou são explicitamente globais.
- **PR-005 — Migração conservadora**: migração idempotente não apaga a fonte legada; falha parcial restaura o ponteiro anterior e permite retry.
- **PR-006 — Barreira de troca**: nenhuma abertura do destino começa antes do flush/commit ou descarte explícito do workspace anterior terminar.
- **PR-007 — Stale async**: cada abertura/troca recebe token de geração; respostas de gerações antigas não podem substituir o workspace ativo mais novo.
- **PR-008 — Contrato de persistência**: cada backend declara transação, leitura/escrita, blobs, migração e concorrência; UI e casos de uso não assumem uma capability ausente.
- **PR-009 — Exclusão transacional**: remover da lista não destrói dados; excluir só confirma após validar o workspace, bloquear concorrência e concluir a transação sem deixar estado parcial.
- **PR-010 — Stack existente**: preservar SvelteKit/Svelte 5, Tailwind 4 e primitives shadcn-svelte já presentes; não introduzir React ou servidor local como requisito.
- **PR-011 — Exportação separada**: Markdown e PDF são formatos de saída; parser/exportador não altera a fonte persistida e será especificado fora desta fatia.

### 5. Histórias de usuário

#### US-001 — Criar, cadastrar e selecionar um workspace (P1)

Como pessoa usuária, quero criar múltiplos workspaces e selecionar o ativo em um seletor semelhante ao de vaults, para organizar conteúdos independentes por identidade persistida.

**Por que P1**: é a capacidade-base que habilita a separação de dados e todos os fluxos posteriores.
**Teste independente**: cadastrar dois workspaces em cada backend disponível, selecionar cada um e confirmar que o nome ativo e o conteúdo visível correspondem ao `workspaceId` selecionado.
**Requisitos**: FR-001, FR-002, FR-004

#### US-002 — Trocar e recuperar o workspace ativo com segurança (P1)

Como pessoa usuária, quero trocar de workspace sem perder alterações e recuperar um registro indisponível, para continuar trabalhando com previsibilidade.

**Por que P1**: troca insegura pode perder dados ou expor conteúdo de outra raiz.
**Teste independente**: iniciar flush pendente, provocar sucesso e falha de transação, trocar com token antigo em voo e simular banco/migração indisponível; validar barreira, geração e recovery.
**Requisitos**: FR-002, FR-004

#### US-003 — Gerir identidade e ciclo de vida do workspace (P1)

Como pessoa usuária, quero renomear, remover da lista, recuperar ou excluir um workspace com confirmações distintas, para controlar a organização sem destruir dados por acidente.

**Por que P1**: o isolamento exige que a pessoa controle identidade e ciclo de vida com operações transacionais previsíveis.
**Teste independente**: executar renomeação, remoção, exclusão, exclusão bloqueada, migração repetida e colisão de ID; verificar efeitos no banco e no conteúdo.
**Requisitos**: FR-003, FR-004

### 6. Cenários BDD de aceite

> Os cenários AC-001–AC-012 abaixo foram materializados para a arquitetura anterior e são preservados como histórico de comportamento. A atualização vigente é definida por AC-013–AC-021, que substitui filesystem/manifesto como backend ativo por SQLite nativo/IndexedDB. Os IDs anteriores só permanecem válidos onde não contradizem o contrato revisado; a matriz da seção 12 será refeita no Plan Gate.

#### AC-001 — Migrar o workspace singular sem repetir onboarding

**Cobre**: US-001, FR-001, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-002 @AC-001
Feature: Migração para catálogo de workspaces

  Scenario: Cadastrar automaticamente o workspace legado
    Given existe um workspace singular configurado com notas e seu manifesto legado
    And o catálogo local ainda não possui entradas
    When o OpenBible inicia a versão com múltiplos workspaces
    Then ele gera uma identidade estável e cadastra o workspace legado como ativo
    And preserva nome, arquivos e referências sem mover ou reescrever conteúdo
    And não exibe onboarding novamente
```

#### AC-002 — Criar workspace usando a capability do ambiente

**Cobre**: US-001, FR-001, FR-004, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-004 @NFR-002 @NFR-003 @AC-002
Feature: Criação adaptativa de workspace

  Scenario: Escolher o backend compatível
    Given a pessoa solicita criar um workspace
    When o ambiente é Tauri, navegador com seleção de pasta ou PWA sem filesystem
    Then o sistema usa respectivamente pasta real, pasta autorizada ou raiz lógica isolada no OPFS
    And grava um manifesto v2 com ID, nome e managedRoot conforme a capability disponível
    And apresenta o workspace criado como ativo
```

#### AC-003 — Selecionar e persistir o workspace ativo

**Cobre**: US-001, FR-001, FR-004, NFR-003

```gherkin
@US-001 @FR-001 @FR-004 @NFR-003 @AC-003
Feature: Seletor de workspace

  Scenario: Trocar pelo seletor responsivo
    Given existem pelo menos dois workspaces cadastrados
    When a pessoa abre o seletor na Sidebar desktop ou no header/drawer mobile
    Then ela identifica visualmente o nome do ativo e pode escolher outro, criar, adicionar ou gerenciar
    And a seleção pode ser executada por mouse ou teclado com foco previsível
    And o catálogo persiste o novo ativo para a próxima inicialização da mesma instalação
```

#### AC-004 — Isolar por completo o contexto da raiz ativa

**Cobre**: US-001, US-002, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-002 @NFR-001 @NFR-002 @AC-004
Feature: Isolamento por workspace

  Scenario: Alternar entre raízes sem misturar dados
    Given workspace A e workspace B possuem notas, Bíblias, preferências e índices distintos
    When a pessoa seleciona B após trabalhar em A
    Then toda leitura, gravação e indexação seguinte resolve somente a raiz de B
    And conteúdo, preferências, sincronização futura e contexto de IA de A não aparecem em B
```

#### AC-005 — Concluir autosave antes da troca

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-005
Feature: Barreira de autosave na troca

  Scenario: Trocar depois de salvar pendências
    Given o workspace A possui uma alteração pendente de autosave
    When a pessoa solicita o workspace B
    Then o OpenBible conclui o autosave de A antes de abrir B
    And somente depois do sucesso publica B como ativo
    And a alteração fica persistida na raiz de A
```

#### AC-006 — Bloquear troca quando autosave falha

**Cobre**: US-002, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-006
Feature: Falha de autosave na troca

  Scenario: Oferecer retry ou descarte explícito
    Given o workspace A possui alteração pendente
    And o autosave falha
    When a pessoa tenta trocar para B
    Then A permanece ativo e o erro identifica o autosave
    And a interface oferece Tentar novamente e Descartar e trocar
    And B não é aberto até a pessoa escolher uma dessas ações
```

#### AC-007 — Recuperar workspace indisponível sem fallback silencioso

**Cobre**: US-002, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-007
Feature: Recuperação do workspace

  Scenario: Permissão, ausência, lock ou configuração inválida no início
    Given o último workspace selecionado está sem permissão, ausente, bloqueado ou inválido
    When o OpenBible inicia
    Then preserva o registro e informa a causa detectada
    And oferece reconectar, tentar novamente ou escolher outro workspace
    And não ativa silenciosamente outro workspace nem remove o registro
```

#### AC-008 — Remover da lista preservando arquivos

**Cobre**: US-003, FR-003, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-002 @NFR-003 @AC-008
Feature: Remoção não destrutiva

  Scenario: Remover apenas a referência local
    Given um workspace está cadastrado e seus arquivos estão acessíveis
    When a pessoa escolhe Remover da lista e confirma a ação não destrutiva
    Then a entrada é removida somente do catálogo local
    And nenhum arquivo, manifesto ou diretório da raiz é apagado
    And a mesma raiz pode ser adicionada novamente depois
```

#### AC-009 — Excluir raiz gerenciada quando todos os guardas passam

**Cobre**: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-009
Feature: Exclusão protegida de workspace

  Scenario: Apagar uma raiz dedicada comprovadamente gerenciada
    Given a raiz possui manifesto v2 com managedRoot válido
    And o OpenBible comprovou que a raiz é dedicada e não encontrou arquivo desconhecido
    And não existe lock ou operação concorrente
    When a pessoa escolhe Excluir workspace e confirma a consequência completa
    Then o sistema apaga a raiz inteira usando a capability segura do backend
    And remove a referência do catálogo sem apagar outro workspace
    And informa o resultado concluído
```

#### AC-010 — Bloquear exclusão quando a propriedade não é comprovada

**Cobre**: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-010
Feature: Exclusão fail-closed

  Scenario: Raiz arbitrária, marcador inválido ou arquivo desconhecido
    Given a raiz não possui marcador gerenciado válido ou contém arquivo desconhecido
    When a pessoa solicita excluir o workspace
    Then o sistema bloqueia a exclusão integral
    And explica que não existe opção de forçar pelo OpenBible
    And preserva catálogo, manifesto e arquivos e orienta exclusão manual segura
```

#### AC-011 — Resolver colisão de identidade sem duas raízes por ID

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-011
Feature: Colisão de ID de workspace

  Scenario: Adicionar uma raiz cujo ID já está cadastrado
    Given a pasta escolhida possui o mesmo workspaceId de uma entrada existente
    When a pessoa tenta adicioná-la ao catálogo
    Then o sistema oferece atualizar a localização existente ou criar uma cópia independente
    And a atualização preserva o ID original
    And a cópia grava um novo ID antes do cadastro
    And nunca mantém duas raízes locais para o mesmo ID
```

#### AC-012 — Renomear sem alterar a pasta física

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-012
Feature: Nome portátil do workspace

  Scenario: Editar o nome exibido
    Given um workspace cadastrado possui ID e raiz física ou lógica
    When a pessoa salva um novo nome exibido
    Then o catálogo atualiza o cache local e o manifesto grava o novo nome
    And o ID, caminho/handle, conteúdo e estado de sincronização permanecem inalterados
```

#### AC-013 — Persistir workspace no backend do ambiente

**Cobre**: US-001, FR-001, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, NFR-004

```gherkin
@US-001 @FR-001 @FR-004 @FR-005 @FR-006 @NFR-001 @NFR-002 @NFR-003 @NFR-004 @AC-013
Feature: Persistência por ambiente

  Scenario Outline: Usar o backend normativo do runtime
    Given a pessoa cria ou abre um workspace
    When o runtime é <runtime>
    Then o sistema persiste a identidade e os dados do workspace em <backend>
    And todas as leituras e escritas ficam escopadas pelo workspaceId ativo
    And nenhum código de domínio depende diretamente da API do backend

    Examples:
      | runtime | backend |
      | Tauri   | SQLite nativo |
      | PWA     | IndexedDB |
```

#### AC-014 — Migrar o workspace legado de forma idempotente

**Cobre**: US-001, FR-001, FR-005, NFR-001

```gherkin
@US-001 @FR-001 @FR-005 @NFR-001 @AC-014
Feature: Migração para banco local

  Scenario: Migrar novamente sem duplicar nem apagar a fonte
    Given existe uma configuração ou workspace legado
    And o banco novo ainda não possui o registro correspondente
    When o OpenBible executa a migração
    Then cria ou atualiza uma única entrada com workspaceId estável
    And preserva a fonte legada para leitura/recovery
    And repetir a migração não cria duplicata nem altera dados já migrados
```

#### AC-015 — Isolar dados por workspaceId

**Cobre**: US-001, US-002, FR-002, NFR-002

```gherkin
@US-001 @US-002 @FR-002 @NFR-002 @AC-015
Feature: Isolamento no banco

  Scenario: Alternar entre workspaces sem misturar dados
    Given workspace A e workspace B possuem registros distintos no backend
    When a pessoa seleciona B após trabalhar em A
    Then toda consulta e gravação seguinte usa somente workspaceId de B
    And nenhum registro, índice ou preferência de A aparece em B
```

#### AC-016 — Concluir flush e commit antes da troca

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-016
Feature: Barreira transacional na troca

  Scenario: Trocar depois de persistir pendências
    Given o workspace A possui uma alteração pendente
    When a pessoa solicita o workspace B
    Then o sistema conclui o flush/commit de A antes de publicar B como ativo
    And uma falha preserva A como ativo
```

#### AC-017 — Manter paridade entre SQLite e IndexedDB

**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-006, NFR-001, NFR-004

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @FR-006 @NFR-001 @NFR-004 @AC-017
Feature: Paridade dos adapters

  Scenario: Executar o mesmo contrato em cada backend
    Given o conjunto de operações create, list, rename, switch, remove e delete
    When os testes de contrato rodam no adapter SQLite e no adapter IndexedDB
    Then os resultados lógicos, estados e erros tipados são equivalentes
    And detalhes de implementação do backend não vazam para a interface
```

#### AC-018 — Remover da lista sem destruir dados

**Cobre**: US-003, FR-003, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-002 @NFR-003 @AC-018
Feature: Remoção não destrutiva

  Scenario: Desanexar um workspace
    Given um workspace possui dados persistidos
    When a pessoa escolhe Remover da lista e confirma
    Then o workspace deixa de aparecer na listagem ativa
    And seus registros permanecem intactos para recovery/reconexão
    And nenhuma operação destrutiva é executada
```

#### AC-019 — Excluir workspace por transação segura

**Cobre**: US-003, FR-003, NFR-001, NFR-002, NFR-004

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @NFR-004 @AC-019
Feature: Exclusão transacional

  Scenario: Excluir somente após confirmação e guards
    Given a pessoa confirmou a exclusão do workspace
    And não há flush, migração ou operação concorrente em andamento
    When o adapter executa a transação de exclusão
    Then todos os registros pertencentes ao workspace são removidos atomicamente
    And uma falha não deixa exclusão parcial nem afeta outro workspace
```

#### AC-020 — Recuperar falha de banco ou migração

**Cobre**: US-002, FR-002, FR-004, FR-005, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @FR-005 @NFR-001 @NFR-003 @AC-020
Feature: Recovery de persistência

  Scenario: Informar falha sem fallback silencioso
    Given o banco, schema ou migração do workspace está indisponível
    When o OpenBible tenta iniciar ou trocar
    Then preserva o ponteiro anterior quando possível
    And informa a causa e oferece retry, recovery ou escolha de outro workspace
    And não ativa silenciosamente um workspace diferente
```

#### AC-021 — Exportação não altera a fonte

**Cobre**: US-001, FR-002, FR-006, NFR-002

```gherkin
@US-001 @FR-002 @FR-006 @NFR-002 @AC-021
Feature: Fronteira de exportação

  Scenario: Preparar notas para Markdown ou PDF
    Given a pessoa solicita exportar notas do workspace ativo
    When a futura camada de parser/exportador processa os dados persistidos
    Then Markdown ou PDF é produzido como saída
    And o workspace persistido continua sendo a fonte
    And a exportação não muda o formato authorial nem o workspace ativo
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve persistir workspaces em um contrato comum com adapter SQLite nativo no Tauri e adapter IndexedDB no PWA; cada registro deve conter `workspaceId` estável, nome, estado, timestamps, versão de schema e metadados locais necessários à recuperação.
- **FR-002**: O sistema deve manter exatamente um workspace ativo por janela, resolver todas as operações pelo `workspaceId` ativo, concluir flush/commit antes de trocar, invalidar operações assíncronas antigas por token de geração e oferecer recuperação sem fallback silencioso.
- **FR-003**: O sistema deve permitir criar, renomear, remover da listagem, recuperar e excluir workspaces; deve detectar colisão de ID e executar exclusão transacional sem afetar outro workspace nem deixar estado parcial.
- **FR-004**: O sistema deve expor seleção e gestão em Svelte desktop/mobile com nome ativo visível, ações semanticamente distintas, estados de loading/empty/error/success/permission e operação por teclado/tecnologia assistiva.
- **FR-005**: O sistema deve migrar o registro/configuração legados de modo idempotente, preservar a fonte legada durante a transição e não exigir migração de notas, Bíblia ou exportações nesta fatia.
- **FR-006**: O sistema deve expor uma fronteira de leitura/exportação do workspace ativo para que specs posteriores gerem Markdown e PDF; exportar não pode alterar a fonte persistida.

#### Não funcionais

- **NFR-001**: integridade e consistência — schema, migração, troca de ponteiro, colisão e exclusão devem ser atômicos no adapter ou restaurar o estado anterior após falha; operações de geração antiga nunca podem vencer a mais nova. **Verificação**: testes de contrato SQLite/IndexedDB com falhas injetadas, concorrência e token stale.
- **NFR-002**: privacidade e segurança local — conteúdo e referências de outro workspace não podem vazar para o ativo; `workspaceId` deve escopar consultas; paths/handles/fontes legadas não entram em sync; exclusão deve ser confirmada e transacional. **Verificação**: testes de isolamento, inspeção de payloads de sync e matriz de transação/guardas.
- **NFR-003**: acessibilidade e responsividade — seleção, dialogs, drawer, recuperação e gestão devem ser operáveis por teclado, ter foco visível e previsível, nomes acessíveis, anúncio de erro/sucesso e não gerar overflow em 320px, além de funcionar em tema claro/escuro e desktop. **Verificação**: testes de componente/axe quando disponível e inspeção manual nos viewports 320px e 1440px.
- **NFR-004**: paridade de backend — o mesmo contrato de domínio deve produzir resultados e erros equivalentes em SQLite nativo e IndexedDB; diferenças de transação, blob e concorrência devem ficar encapsuladas nos adapters. **Verificação**: suíte de contrato executada contra os dois adapters, com cenários de sucesso, schema incompatível, conflito, indisponibilidade e rollback.

#### Erros e casos-limite

- Autosave falha → manter o ativo, mostrar causa e oferecer retry ou descarte explícito.
- Permissão revogada → manter cadastro e abrir recuperação; não apagar nem trocar silenciosamente.
- Banco ausente, schema incompatível ou migração interrompida → não sobrescrever silenciosamente; oferecer diagnóstico/retry/recovery.
- Fonte legada movida/ausente durante importação → manter o registro e explicar que a migração pode ser retomada, sem apagar o workspace já persistido.
- ID duplicado → exigir atualizar localização ou criar cópia com novo ID.
- Falha de transação → restaurar a operação ou deixar o estado anterior intacto e comunicar recovery.
- Último workspace removido → abrir criação/adição; não fabricar raiz silenciosamente.
- Resposta assíncrona de geração antiga → descartar resultado e manter o estado da geração ativa.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Aplicação SvelteKit com Svelte 5, TypeScript, Tailwind CSS 4 e primitives shadcn-svelte.
- `WorkspaceStorage` é a fronteira atual de persistência em `apps/web/src/lib/storage/types.ts`; `storage-registry.ts`, `session.ts` e `workspace-state.svelte.ts` ainda assumem registro/estado singular e precisam migrar para um repositório escopado por `workspaceId`.
- O runtime Tauri deve usar SQLite nativo (`app.sqlite` ou equivalente); o PWA deve usar IndexedDB. FSA, OPFS, paths e handles só são compatibilidade de leitura/importação legada nesta fatia.
- `AppFrame.svelte`, `AppSidebar.svelte`, `WorkspaceSettings.svelte` e `PermissionRecovery.svelte` já fornecem shell, configuração e recuperação a serem estendidos.

#### Arquitetura e módulos

- Introduzir `WorkspaceRepository` como porta de domínio para listar, criar, abrir, renomear, remover, restaurar e excluir workspaces; toda operação recebe ou deriva `workspaceId` explicitamente.
- Implementar `SqliteWorkspaceAdapter` no Tauri sobre SQLite nativo e `IndexedDbWorkspaceAdapter` no PWA sobre IndexedDB; ambos expõem o mesmo contrato de transação, blobs, schema, migração e erros tipados.
- Persistir o ponteiro ativo e os metadados do aplicativo em um banco por instalação/origem: `app.sqlite` no Tauri e um banco IndexedDB no PWA. Todas as entidades de workspace usam `workspaceId` como chave/escopo; não há um banco operacional separado por workspace nesta fatia.
- Criar `WorkspaceLifecycle`/barreira de troca. O fluxo é `flush active → commit/discard decision → increment generation → open destination → commit active pointer`; falha antes da ativação mantém o ponteiro anterior.
- Cada operação `open`, `switch`, `migrate`, `remove` e `delete` captura `generationToken`; o guard de commit rejeita resultado stale ou destino que deixou de ser solicitado.
- Manter um `LegacyWorkspaceSource` somente-leitura para importar o registro singular, manifesto, arquivos e referências disponíveis. Após a migração, filesystem não é backend ativo nem requisito para abrir o workspace novo.
- Expor `WorkspaceExportSource` somente-leitura para as specs posteriores de notas; o parser/exportador de Markdown e PDF não participa da transação primária nem altera o workspace.

#### Migrations

- **Schema local v1**: criar tabela/object store de workspaces, ponteiro ativo, versão de schema e marcador de migração; repetir pelo mesmo `workspaceId` é no-op.
- **Tauri**: abrir/criar o banco global local `app.sqlite` de forma segura, aplicar migrations transacionais e preservar o arquivo legado enquanto a importação não for confirmada.
- **PWA**: abrir/criar um banco IndexedDB por origem, atualizar object stores de forma versionada e preservar blobs/fontes legadas até o término da migração.
- **Importação legada**: ler configuração singular e `.openbible/config.json`/fontes compatíveis, derivar ou preservar ID, gravar a entidade no banco e registrar a origem local somente quando necessária para recovery.
- **Compatibilidade/rollback**: se schema, importação ou ponteiro falhar, conservar o estado anterior, não duplicar a entrada e sinalizar recovery. Não há migração de notas, Bíblia ou formato de exportação nesta spec.

#### Models

- `WorkspaceRecord`: `workspaceId`, `name`, `status`, `schemaVersion`, `createdAt`, `updatedAt`, `lastOpenedAt` e metadados locais; o ID é único no banco.
- `ActiveWorkspacePointer`: `workspaceId` ativo, geração monotônica e atualização atômica; nunca contém conteúdo da nota.
- `WorkspaceStorageContext`: adapter/resolvedor do ambiente (`sqlite` ou `indexeddb`), capabilities de transação/blob/migração e referências locais não sincronizáveis.
- `LegacyWorkspaceSource`: origem de importação, estado, erro e cursor de migração; somente-leitura e descartável após confirmação.
- `WorkspaceExportSource`: consultas de leitura para exportação futura, sempre escopadas ao workspace ativo.

#### Controllers e casos de uso

- `initializeWorkspaceDatabase`: resolve o adapter do runtime, cria/verifica schema e carrega o ponteiro ativo.
- `migrateLegacyWorkspace`: lê a fonte legada, cria/atualiza uma única entidade, registra progresso e é repetível sem apagar a origem.
- `createWorkspace` e `openWorkspace`: criam/abrem um registro no adapter e retornam um contexto escopado por `workspaceId`.
- `switchWorkspace`: executa flush/commit, incrementa geração, abre o destino e publica o ponteiro apenas se o token ainda for válido.
- `recoverWorkspace`: recebe `retry`, `resume-migration`, `restore-legacy` ou `choose-other`, preserva identidade e reporta a causa.
- `renameWorkspace`, `removeWorkspace` e `deleteWorkspace`: mantêm efeitos separados; exclusão exige confirmação, guarda de concorrência e transação atômica.

#### Views e experiência

- `WorkspaceSelector` em `AppSidebar.svelte`/`Sidebar.Footer` (abaixo do toggle de tema): nome do ativo, estado de abertura e `DropdownMenu` com trocar, criar, adicionar e gerenciar.
- Trigger equivalente no header mobile abre `Drawer` com a mesma lista e ações; não duplicar regras de domínio entre desktop e mobile.
- `WorkspaceSettings.svelte`: lista simples de gestão com ID/nome/status/última atualização e ações independentes de renomear, remover, recuperar e excluir.
- `ConfigPage.svelte` separa `Armazenamento` de `Workspaces`; `WorkspaceSettings.svelte` recebe uma visão explícita para cada responsabilidade e não mistura a lista de workspaces com os fatos do backend.
- `PermissionRecovery.svelte` recebe motivo e actions de recovery, com estado de loading e anúncio live.
- Dialogs destrutivos separam “Remover da lista” de “Excluir workspace”; a confirmação textual informa alcance e motivo de bloqueio quando aplicável.

#### Queries e repositórios

- `WorkspaceRepository.list()` lista registros sem carregar o conteúdo integral nem abrir fontes legadas.
- `getById`, `create`, `rename`, `remove`, `restore`, `setActive`, `touchLastOpened` e `delete` devem ser idempotentes e serializados por adapter.
- Toda query de conteúdo recebe `workspaceId`; consultas globais são limitadas a schema, saúde do banco e ponteiro ativo.
- `WorkspaceExportSource` oferece leitura consistente do workspace ativo para Markdown/PDF posteriores, sem mutação.

#### Jobs e processamento assíncrono

- Não há job remoto ou servidor local nesta fatia. Abertura, migration, flush e export-source são assíncronos e devem usar generation token, cancelamento/ignore de resultado stale e retry explícito na UI.

#### Estrutura de arquivos

```text
specs/review/0016-multiplos-workspaces-modelo-vaults/
  spec.md
apps/web/src/lib/storage/
  types.ts
  workspace-repository.ts
  sqlite-workspace-adapter.ts
  indexeddb-workspace-adapter.ts
  workspace-lifecycle.ts
  workspace-migration.ts
  storage-registry.ts
  session.ts
  legacy-workspace-source.ts
  indexeddb-workspace-adapter.test.ts
  workspace-repository.test.ts
  workspace-lifecycle.test.ts
apps/web/src/lib/features/navigation/
  AppSidebar.svelte
apps/web/src/lib/features/workspace/
  AppFrame.svelte
  WorkspaceSelector.svelte
  WorkspaceSettings.svelte
  PermissionRecovery.svelte
  workspace-state.svelte.ts
  workspace-state.test.ts
apps/desktop/src-tauri/src/commands/
  workspace.rs
  database.rs
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `WorkspaceRecord` | `workspaceId` estável | `name`, `status`, `schemaVersion`, `createdAt`, `updatedAt`, `lastOpenedAt` e metadados locais; único por banco | É a entidade operacional do workspace |
| `ActiveWorkspacePointer` | janela/sessão | `workspaceId`, `generation`; um por janela, sem conteúdo | Refere exatamente um `WorkspaceRecord` ativo |
| `WorkspaceStorageContext` | runtime + adapter | `sqlite` no Tauri ou `indexeddb` no PWA, capabilities e estado de schema | Resolve a persistência para o caso de uso |
| `LegacyWorkspaceSource` | origem local temporária | tipo, referência, status, erro e cursor de migração; somente-leitura | Alimenta `migrateLegacyWorkspace` |
| `WorkspaceExportSource` | `workspaceId` + snapshot | consultas consistentes de leitura; nunca muta o banco | Será consumido por parser/exportador de notas |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Workspace | `registered` | abrir | `opening` | cadastro permanece local |
| Workspace | `opening` | schema/contexto válidos | `ready` | generation ainda é válida |
| Workspace | `opening` | banco/schema/migração indisponível | `unavailable`/`migrating`/`invalid` | não ativar fallback |
| Workspace ativo | `ready` | solicitação de troca | `flushing` | não iniciar destino antes do flush |
| Workspace ativo | `flushing` | sucesso e token válido | `switching` → `ready` | antigo só deixa ativo após commit |
| Workspace ativo | `flushing` | falha | `ready` | retry ou descarte explícito |
| Workspace | `registered` | remover da lista | `detached` | registros/conteúdo permanecem recuperáveis |
| Workspace | `registered` | exclusão confirmada e transação | `deleted` | nenhum outro workspace é afetado |

#### Migração e retenção

- O registro singular é convertido em `WorkspaceRecord` sem apagar a fonte legada. A operação usa uma chave de migração/idempotência e pode ser repetida após interrupção.
- O banco local é a autoridade operacional dos workspaces; referências à fonte legada são locais e descartáveis após migração confirmada.
- Remover da lista altera visibilidade/estado do registro, mas retém dados para recovery. Excluir remove somente o escopo do workspace após confirmação e transação completa.
- SQLite nativo e IndexedDB não participam diretamente de Automerge nesta fatia. A Bíblia SQLite pode ser armazenada como blob/recurso consultável por WASM no PWA sem conversão relacional.
- Markdown e PDF não são armazenados como fonte primária; exportadores posteriores leem um snapshot consistente do `WorkspaceExportSource`.

### 10. Interfaces e contratos

> A interface de workspaces permanece, mas a linguagem vigente é de registros persistidos no banco. Referências a pasta, manifesto, permissão e lock abaixo só se aplicam ao recovery/importação da fonte legada.

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A feature altera o shell principal, a configuração, os fluxos de seleção, troca, recuperação e ações destrutivas.

#### Stack e convenções de interface

- SvelteKit/Svelte 5, TypeScript, Tailwind 4 e shadcn-svelte existentes. O shell é `AppFrame.svelte` + `AppSidebar.svelte`; `WorkspaceSettings.svelte` e `PermissionRecovery.svelte` são superfícies existentes a estender.
- Desktop usa `Sidebar.Footer` (abaixo do toggle de tema) e `DropdownMenu`, com modo ícone só com o botão; mobile usa trigger na barra e `Drawer`. Dialog/AlertDialog será usado para confirmação destrutiva quando disponível.
- A descoberta de interface identificou o fluxo de configuração e recuperação existentes; preservar marca, Geist, tokens monocromáticos, foco visível, tema claro/escuro e `prefers-reduced-motion`.
- O padrão genérico de `DataGrid` e `Breadcrumb` de equipe do design system não se aplica literalmente: esta superfície é configuração local de vault, não CRUD de entidade de negócio nem navegação organizacional por equipe. A gestão pode usar lista compacta acessível, mostra ID estável quando útil e mantém a navegação contextual do shell existente, sem inventar equipe, breadcrumb ou rota falsa.

#### Telas e responsabilidades

- **Shell principal/Sidebar desktop**: pessoa identifica o workspace ativo, troca ou abre ações de criação/adição/gestão.
- **Header/Drawer mobile**: mesma seleção e ações em largura reduzida; o nome ativo permanece visível.
- **Configurações → Workspaces**: pessoa lista referências, renomeia, reconecta, remove da lista ou inicia exclusão.
- **Dialog de criar/adicionar**: pessoa escolhe nome/pasta conforme capability e recebe resultado ou erro.
- **Recovery de workspace**: pessoa entende causa, tenta retry/retomar migração/restaurar legado ou escolhe outro registro.
- **Dialog de exclusão**: pessoa confirma a remoção transacional do escopo do workspace; bloqueio explica a operação pendente ou concorrente.

#### Fluxo de informação e navegação

1. Bootstrap abre o banco do runtime, aplica schema/migrations e carrega o ponteiro do último workspace.
2. O shell mostra nome e estado do ativo.
3. A pessoa abre o seletor; escolhe workspace existente ou uma ação de criação/adição/gestão.
4. Para troca, a aplicação faz flush/commit das pendências, valida o registro destino, incrementa geração e abre o contexto do adapter.
5. Sucesso atualiza shell e anuncia novo nome; falha permanece no contexto anterior ou abre recovery.
6. Gestão retorna ao shell após renomear/remover/excluir, mantendo o último estado válido.

O contexto é o shell principal do OpenBible; não há `Breadcrumb` de equipe aplicável a esta configuração. Quando a gestão for apresentada como página de Configurações, a navegação existente deve indicar Configurações → Workspaces e marcar Workspaces como página atual.

#### Menus e navegação principal

- `WorkspaceSelector` → workspace listado, Criar workspace, Gerenciar workspaces.
- Menu de cada item → Tornar ativo, Renomear, Recuperar quando indisponível, Remover da lista, Excluir workspace quando os guardas permitirem.
- Desktop mantém dropdown ancorado na Sidebar; mobile abre drawer e conserva foco/retorno ao trigger.
- Nenhuma ação destrutiva fica agrupada visualmente com remoção não destrutiva sem rótulo e confirmação próprios.

#### Formulários e ações

- Criar: nome exibido, validação após trim, unicidade de `workspaceId` e estado de gravação.
- Abrir/recuperar: selecionar um registro existente; a fonte legada só aparece quando a migração/recovery precisar dela.
- Renomear: campo de nome exibido, erro inline e submit desabilitado durante a transação.
- Remover: ação não destrutiva em dialog curto, com frase explícita de que os dados permanecem recuperáveis.
- Excluir: dialog separado, resumo do workspace, guardas de flush/migração/concorrência e confirmação forte; não existe botão “forçar”.
- Recovery: retry, retomar migração, restaurar fonte legada ou escolher outro; manter o workspace selecionado quando possível.

#### Composição e disposição

- Sidebar/Header: nome ativo com indicador textual de estado; lista de workspaces ocupa a largura disponível.
- Configuração: cabeçalho da superfície, lista compacta de entradas, ações por linha e feedback contextual; não usar cards decorativos ou pills sem significado.
- Mobile: drawer com alvo de toque adequado, conteúdo rolável e dialogs que não ultrapassem viewport; desktop: dropdown/lista sem overflow horizontal.
- Estados curto/longo, loading, vazio, erro, permission-needed, locked, invalid, sucesso e exclusão bloqueada têm mensagens acionáveis.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Shell desktop | Não aplicável; bloco Svelte | Exibir ativo e ações | `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` | `Sidebar.Footer` + `DropdownMenu` | shadcn-svelte + próprio | Novo bloco Svelte sobre primitive existente |
| Shell mobile | Não aplicável; bloco Svelte | Seleção em drawer | `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` | `Drawer` | shadcn-svelte + próprio | Reuso da regra do seletor, composição responsiva |
| Configurações | Não aplicável; bloco Svelte | Listar e gerir workspaces | `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` | lista acessível + `Dialog` | próprio + primitives | Estender tela existente |
| Exclusão | Não aplicável; bloco Svelte | Confirmar consequência | `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` | `AlertDialog`/`Dialog` | shadcn-svelte | Ação nova separada de remoção |
| Recovery | Não aplicável; bloco Svelte | Reconectar/repetir/escolher | `apps/web/src/lib/features/workspace/PermissionRecovery.svelte` | alert/live region + buttons | próprio existente | Estender recuperação existente |

A coluna mantém “Não aplicável” para React porque a aplicação usa Svelte; os blocos reais e seus arquivos Svelte estão explicitados. A regra de CRUD genérica de `PageHeader`/DataGrid não será importada para uma configuração de vault sem entidade de negócio; essa é uma decisão de escopo, não uma omissão de acessibilidade ou de identificação.

#### Estados e acessibilidade

- Loading: `aria-busy`, foco mantido no acionador e texto “Abrindo workspace…”.
- Vazio: explicar que nenhum workspace está cadastrado e oferecer Criar/Adicionar.
- Erro: mensagem específica para flush, schema, migração, indisponibilidade, colisão, concorrência e transação; foco vai ao alerta acionável.
- Sucesso: anúncio `aria-live` com nome do workspace ativo e ação concluída.
- Teclado: trigger, itens, dialogs, retry, confirmação e cancelamento são alcançáveis; Escape fecha sem perder contexto; foco retorna ao acionador.
- Acessibilidade visual: nome ativo não depende somente de ícone/cor; contraste/foco seguem `DESIGNSYSTEM.MD`; conteúdo longo quebra sem overflow.
- Respeitar tema claro/escuro, zoom, reduced motion e viewport mobile de 320px.

#### Contrato CRUD

- Esta entrega não é CRUD de entidade de negócio. A gestão de workspaces é uma configuração de persistência local e usa lista compacta, ações nomeadas e dialogs distintos.
- A lista sempre identifica cada entrada por nome e ID estável quando houver espaço; não usa breadcrumb de equipe, linha clicável para detalhe ou ações destrutivas ambíguas.
- O contrato CRUD padrão com `PageHeader`, `DataGrid` em largura total, coluna `ID` sempre visível e ações independentes de editar e apagar é **Não aplicável**: não existem rotas de lista/detalhe/criação/edição de uma entidade de negócio. A superfície reutiliza o cabeçalho da `ConfigPage`, expõe renomear e remover/excluir como ações explícitas e registra essa exceção em `INTERFACE.md` durante a implementação.

#### Revisão visual durante o desenvolvimento

- A implementação deverá revisar 320px e 1440px, tema claro/escuro, lista vazia, conteúdo longo, loading, erro, permissão, lock, sucesso e confirmação destrutiva.
- Registrar procedimento, viewport, estados, foco, overflow, bordas, espaçamentos, margens, padding e tipografia na tarefa de interface; testes sem superfície visual marcarão `Não aplicável` com motivo.

#### APIs expostas

- `WorkspaceRepository` interno, versão de contrato `v1`: recebe `workspaceId` quando aplicável e expõe `list`, `getById`, `create`, `rename`, `remove`, `restore`, `setActive`, `touchLastOpened`, `transaction` e `delete`; retorna `WorkspaceRecord`/resultado de transação e erros `DUPLICATE_ID`, `NOT_FOUND`, `CONFLICT` ou `PERSISTENCE_UNAVAILABLE`.
- `WorkspacePersistenceAdapter` interno, versão de schema explícita: `open`, `ensureSchema`, `read`, `write`, `query`, `transaction`, `readBlob`, `writeBlob`, `migrate` e `close`; recebe operações escopadas e retorna dados tipados, sem acesso direto da UI.
- `WorkspaceLifecycle` interno: `flushAndSwitch`, `retry`, `discardAndSwitch`, `commitActivation` e `getGeneration`; retorna estado de ativação ou `FLUSH_FAILED`, `STALE_GENERATION`, `MIGRATION_FAILED` e `ACTIVATION_FAILED`.
- Bridge Tauri: comandos tipados para abrir/migrar/transacionar SQLite e consultar saúde do banco; entrada é a operação validada, saída é resultado/erro serializável, não há autenticação de rede nem caminho arbitrário como backend de workspace.
- `WorkspaceExportSource` interno: `snapshot`, `listNotes` e leitura de conteúdo do workspace ativo; somente-leitura, com `workspaceId`/versão do snapshot, para parser/exportadores posteriores.

#### APIs externas utilizadas

- Nenhuma API externa de rede. APIs de plataforma (Tauri IPC, SQLite nativo, IndexedDB e SQLite WASM para a Bíblia) são adaptadas atrás da fronteira de persistência e não são dependências de servidor.

#### Documentação das APIs consultadas

- Contratos locais e documentação de plataforma observados na stack e nas implementações atuais; nenhuma fonte externa precisa ser armazenada para esta spec.

#### Eventos e outros contratos

- `WorkspaceActivated { workspaceId, generation, backend }` é evento interno local; consumidores de índice, editor, sincronização futura e agente futuro devem resolver o banco pelo ID/contexto ativo.
- `WorkspaceActivationFailed { workspaceId, reasonCode }` preserva o ativo anterior e alimenta recovery.
- `WorkspaceRecord` e `ActiveWorkspacePointer` nunca são payload de Automerge/sync nesta fatia; exportação e sincronização posteriores recebem contratos explícitos, não o storage bruto.

### 11. Estratégia TDD

- **Unidade**: validação de `WorkspaceRecord`, isolamento por `workspaceId`, schema/migração idempotente, transação, generation token e máquina de estados de troca.
- **Integração/contrato**: adapters SQLite nativo/IndexedDB, migração legada, ponteiro ativo e bridge Tauri de banco.
- **BDD/aceite**: AC-013–AC-021 são a referência vigente; AC-001–AC-012 permanecem como histórico da arquitetura anterior. Cada caso TDD deverá possuir marcador `SPECSFY:` próprio e rastrear os IDs cobertos.
- **Runner TDD**: Vitest, conforme `apps/web/package.json` e decisão registrada no perfil do projeto.
- **E2E**: jornadas essenciais do seletor desktop/mobile, troca com autosave, recovery e confirmação; materializar após o Plan Gate.
- **Verificação manual**: revisão visual e recovery de banco/migração somente quando o ambiente de teste não simular SQLite/IndexedDB; registrar motivo e viewport.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| AC-013 | Persistência por runtime na seção 6 | `apps/web/src/lib/storage/workspace-persistence-contract.test.ts` — `SPECSFY: US-001 FR-001 FR-004 FR-005 FR-006 NFR-001 NFR-002 NFR-003 NFR-004 AC-013` | RED observado em 2026-09-06: `expected undefined to be 'sqlite'`; `describeAdapter('native')` ainda não expõe backend normativo (exit 1) | GREEN observado em 2026-09-06 no contrato native→SQLite/PWA→IndexedDB, bridge Tauri e adapter IndexedDB versionado | Passed |
| AC-014 | Migração idempotente na seção 6 | `apps/web/src/lib/storage/workspace-migration.test.ts` — `SPECSFY: AC-014` | RED observado em 2026-09-06: migration atual retorna `manifest/migrated`, sem `record/sourcePreserved` (exit 1) | GREEN observado em 2026-09-06: `LegacyWorkspaceSource` lê sem escrever a fonte, cria registro `ready`, mantém cursor de migration e retry retorna o mesmo `workspaceId` sem duplicata; 8 testes focais passaram | Passed — regressão final |
| AC-015 | Isolamento por workspaceId na seção 6 | `apps/web/src/lib/storage/workspace-scope.test.ts` — `SPECSFY: AC-015` | RED observado em 2026-09-06: entrada ainda não expõe backend normalizado `sqlite` (exit 1) | GREEN observado em 2026-09-06: catálogo normaliza o backend por runtime, `WorkspaceRepository` exige `workspaceId`, contextos A/B não cruzam leituras/escritas e query sem ID falha fechado; 13 testes focais passaram | Passed — regressão final |
| AC-016 | Flush/commit na seção 6 | `apps/web/src/lib/storage/workspace-lifecycle-contract.test.ts` — `SPECSFY: AC-016` | RED observado em 2026-09-06: resultado não informa `committed: true` (exit 1) | GREEN observado em 2026-09-06: commit guard retorna `committed: true`, preserva o ativo em falha de autosave e rejeita geração stale; 6 testes focais passaram | Passed — regressão final |
| AC-017 | Paridade dos adapters na seção 6 | `apps/web/src/lib/storage/workspace-adapter-contract.test.ts` — `SPECSFY: AC-017` | RED observado em 2026-09-06: capabilities atuais não declaram `transactions`/`blobs` (exit 1) | GREEN observado em 2026-09-06 no contrato compartilhado e no adapter IndexedDB com transações/blobs; ponte nativa permanece coberta por T039 | Passed |
| AC-018 | Remoção não destrutiva na seção 6 | `apps/web/src/lib/storage/workspace-repository.test.ts` — `SPECSFY: AC-018` | RED observado em 2026-09-06: remoção atual não retorna estado `detached/dataRetained` (exit 1) | GREEN observado em 2026-09-06: remoção retorna `detached/dataRetained` e mantém a fonte física; 8 testes focais de repository/delete/adapter/bridge passaram | Passed — regressão final |
| AC-019 | Exclusão transacional na seção 6 | `apps/web/src/lib/storage/workspace-delete.test.ts` — `SPECSFY: AC-019` | RED observado em 2026-09-06: erro ainda é `WorkspaceDeleteBlockedError`/`capability_unavailable`, sem `PERSISTENCE_CONFLICT` (exit 1) | GREEN observado em 2026-09-06: conflito de capability é tipado como `PERSISTENCE_CONFLICT`; SQLite remove registro, migrations e ponteiro no mesmo commit; 9 testes Rust passaram | Passed — rollback físico além do banco permanece fora desta fatia |
| AC-020 | Recovery de banco/migração na seção 6 | `apps/web/src/lib/features/workspace/workspace-recovery.test.ts` — `SPECSFY: AC-020` | RED observado em 2026-09-06: erro não expõe `reasonCode` de schema (exit 1) | GREEN observado em 2026-09-06: `WorkspaceOpenError` expõe `SCHEMA_UNAVAILABLE`, `MIGRATION_REQUIRED` e `PERSISTENCE_UNAVAILABLE`, a fonte legada permanece preservada e a UI oferece retry/retomar/restaurar/escolher; 27 testes focais passaram | Passed |
| AC-021 | Exportação na seção 6 | `apps/web/src/lib/storage/workspace-export-source.test.ts` — `SPECSFY: AC-021` | RED observado em 2026-09-06: entrada não expõe boundary `exportSource` (exit 1) | GREEN observado em 2026-09-06: catálogo expõe descriptor somente-leitura, snapshot versionado, listagem/leitura escopada de notas e rejeição de path externo; 9 testes focais passaram | Passed — parser Markdown/PDF fica em spec posterior |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-001 FR-001 NFR-001 AC-001` | RED observado: manifesto legado continua `version: 1`, sem `workspaceId`, `formatVersion` e `name` portáteis (exit 1) | GREEN observado em 2026-09-05 (T013): `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` 4 passed; manifesto v2 idempotente com `workspaceId`, `formatVersion: 2`, `name` e `managedRoot`, migração preserva arquivos | Pending — regressão final em T029 |
| US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002 | AC-002 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-001 FR-001 FR-004 NFR-002 NFR-003 AC-002` | RED observado: `prepareWorkspace` não produz manifesto v2/`managedRoot` em native, local e OPFS (exit 1) | GREEN observado em 2026-09-05 (T013): `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` 11 passed; `workspaceId`/`formatVersion: 2`/`name`/`managedRoot` por kind (native/opfs gerenciado, local não gerenciado) | Pending — regressão final em T029 |
| US-001, FR-001, FR-004, NFR-003, AC-003 | AC-003 na seção 6 | `apps/web/src/lib/features/navigation/app-sidebar.spec.ts` — `SPECSFY: US-001 FR-001 FR-004 NFR-003 AC-003` | RED observado: `AppSidebar.svelte` não contém `WorkspaceSelector` nem ação de gestão (exit 1) | GREEN observado em 2026-09-05 (T017 desktop + T018 mobile): `WorkspaceSelector` em `Sidebar.Header` e em `Drawer` na barra mobile do `AppFrame` com a mesma regra/ações, teclado, foco com retorno ao trigger e `aria-live`; 2 passed em `app-sidebar.spec.ts` | Pending — regressão final em T029 |
| US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 | AC-004 na seção 6 | `apps/web/src/lib/features/workspace/workspace-state.test.ts` — `SPECSFY: US-001 US-002 FR-002 NFR-001 NFR-002 AC-004` | RED observado: `WorkspaceState` não expõe `workspaceId`/`generation` para vincular consumidores ao ativo (exit 1) | GREEN observado em 2026-09-05 (T015): `workspaceId`/`generation` vinculados ao ponteiro ativo com token de geração; 4 passed em `workspace-state.test.ts` | Pending — regressão final em T029 |
| US-002, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — `SPECSFY: US-002 FR-002 NFR-001 AC-005` | RED observado: lifecycle não expõe `flushAndSwitch` para impor a barreira de autosave (exit 1) | GREEN observado em 2026-09-05 (T015): barreira flush→generation→open→commit, 2 passed em `workspace-lifecycle.test.ts` | Pending — regressão final em T029 |
| US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006 | AC-006 na seção 6 | `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-006` | RED observado: lifecycle não expõe contrato de falha/retry/discard-and-switch (exit 1) | GREEN observado em 2026-09-05 (T015): falha preserva ativo com `AUTOSAVE_FAILED` + `retry`/`discard-and-switch`; teste determinístico com flush injetado | Pending — regressão final em T029 |
| US-002, FR-002, FR-004, NFR-001, NFR-003, AC-007 | AC-007 na seção 6 | `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-007` | RED observado: estados nativo não expõem `unavailable`/`invalid` com ações de recuperação (exit 1) | GREEN observado em 2026-09-05 (T021): estados `unavailable`/`invalid` com `ariaLive` assertivo e ações, recovery por motivo com retry/reconectar/escolher-outro e boot com montagem do catálogo; 2 passed | Pending — regressão final em T029 |
| US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008 | AC-008 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-008` | RED observado: storage não expõe remoção exclusiva do catálogo para preservar a raiz (exit 1) | GREEN observado em 2026-09-05 (T013 fundação): remoção só do catálogo, arquivos/manifesto preservados, recadastro possível (4 passed no mesmo arquivo) | Pending — regressão final em T029 |
| US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 | AC-009 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-009` | RED observado: adapter não expõe `deleteManagedRoot` para executar a cadeia de guards (exit 1) | GREEN parcial em 2026-09-05 (T013 fundação): `deleteManagedRoot` com `managedRoot`/capability/scan conservador, 11 passed; guards estritos (ID/lock) serão endurecidos em T023 | GREEN em 2026-09-05 (T023): amarração estrita ID===manifesto, exclusão integral pelo backend (comando nativo com guardas em Rust, remoção recursiva OPFS) e casos de ID divergente; reasonCode estável | Pending — regressão final em T029 |
| US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-010 | AC-010 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-010` | RED observado: manifesto de raiz arbitrária não declara `managedRoot: false` (exit 1) | GREEN observado em 2026-09-05 (T013): raiz local arbitrária com `managedRoot: false`, sem `forceDelete`, bloqueio fail-closed (11 passed) | GREEN em 2026-09-05 (T023): + caso de arquivo desconhecido bloqueado com arquivos preservados e sem `forceDelete` | Pending — regressão final em T029 |
| US-003, FR-003, NFR-001, NFR-002, AC-011 | AC-011 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-011` | RED observado: storage não expõe resolução de colisão de ID (exit 1) | GREEN observado em 2026-09-05 (T013 fundação): colisão resolve `update` preservando ID ou `copy` com novo ID, nunca duas raízes por ID (4 passed) | Pending — regressão final em T029 |
| US-003, FR-003, NFR-001, NFR-002, AC-012 | AC-012 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-012` | RED observado: storage não expõe renomeação portátil (exit 1) | GREEN observado em 2026-09-05 (T013 fundação): rename atualiza `name`/`label` e catálogo, preserva ID/raiz (4 passed) | Pending — regressão final em T029 |

### 12. Plano de testes e rastreabilidade

> A matriz abaixo preserva os ACs históricos AC-001–AC-012 como evidência de auditoria e registra os ACs vigentes AC-013–AC-021 com os contratos da revisão SQLite/IndexedDB. `Passed` nos doze primeiros IDs significa somente que a evidência histórica anterior foi preservada; eles não são escopo vigente.

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade/integração | `workspace-catalog.test.ts`, `workspace.test.ts`, `app-sidebar.spec.ts` via `bun run --cwd apps/web test:tdd -- ...` | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| FR-002 | AC-004, AC-005, AC-006, AC-007 | Unidade/integração | `workspace-state.test.ts`, `workspace-lifecycle.test.ts`, `native-workspace-states.test.ts` via comando focal | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| FR-003 | AC-008, AC-009, AC-010, AC-011, AC-012 | Unidade/integração | `workspace-catalog.test.ts`, `workspace.test.ts` via comando focal | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| FR-004 | AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 | Componente/contrato | testes marcados nos arquivos de storage, lifecycle, recovery e sidebar | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| NFR-001 | AC-001, AC-004, AC-005, AC-006, AC-007, AC-009, AC-010, AC-011, AC-012 | Unidade/integração | testes de manifesto, isolamento, barreira, guards e identidade via Vitest | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| NFR-002 | AC-001, AC-002, AC-004, AC-008, AC-009, AC-010, AC-011, AC-012 | Contrato/inspeção | testes de manifesto, referência local e isolamento via Vitest | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| NFR-003 | AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 | Componente/contrato | `app-sidebar.spec.ts` e contratos de estados/ações via comando focal | Passed — evidência histórica da arquitetura filesystem, escopo substituído pelos ACs vigentes |
| FR-001, FR-004, FR-005, FR-006 | AC-013 | Contrato | `workspace-persistence-contract.test.ts` | Passed — native usa SQLite e PWA usa IndexedDB; 4 testes focais passaram |
| FR-001 | AC-014 | Unidade/integração | `workspace-migration.test.ts` | Passed — migração idempotente, fonte preservada e retry sem duplicata; 8 testes focais passaram |
| FR-001, FR-004 | AC-015 | Unidade/integração | `workspace-scope.test.ts` | Passed — isolamento por `workspaceId`; 13 testes focais passaram |
| FR-002 | AC-016 | Unidade/integração | `workspace-lifecycle-contract.test.ts` | Passed — flush/commit e stale generation; 6 testes focais passaram |
| FR-003, FR-005 | AC-017 | Contrato | `workspace-adapter-contract.test.ts` | Passed — paridade de capabilities, transações e blobs; contrato nativo coberto pelo T039 |
| FR-003 | AC-018 | Unidade/integração | `workspace-repository.test.ts` | Passed — remoção não destrutiva e dados retidos; 8 testes focais passaram |
| FR-003 | AC-019 | Integração | `workspace-delete.test.ts` e testes Rust | Passed — conflito tipado e exclusão SQLite transacional; 9 testes Rust passaram |
| FR-002, FR-006 | AC-020 | Componente/integração | `workspace-recovery.test.ts` | Passed — schema/migração/persistência com recuperação explícita; 27 testes focais passaram |
| FR-005, FR-006 | AC-021 | Contrato | `workspace-export-source.test.ts` | Passed — boundary somente-leitura para exportadores; 9 testes focais passaram |

### 13. Validações

> **Reabertura de 2026-09-06:** os resultados abaixo de 2026-09-05 e as correções anteriores são evidências históricas da arquitetura de filesystem. A revisão SQLite/IndexedDB possui evidência própria em T030–T053; o parser Markdown/PDF permanece fora desta fatia.

#### Gate do Ato I — Definição

- **Resultado histórico**: READY — Passed em 2026-09-05 para a arquitetura anterior.
- **Resultado revisado**: READY — Passed em 2026-09-06 após revalidar a arquitetura SQLite/IndexedDB, fechar o escopo de `app.sqlite`/IndexedDB por instalação/origem e registrar o boundary de exportação Markdown/PDF.
- **Comandos revisados**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/review/0016-multiplos-workspaces-modelo-vaults/spec.md --allow-draft`; `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/review/0016-multiplos-workspaces-modelo-vaults/spec.md --root .` — ambos passaram.
- **Cobertura vigente**: AC-013–AC-021; US-001=5, US-002=4, US-003=3; FR-001=3, FR-002=5, FR-003=3, FR-004=3, FR-005=3, FR-006=3; NFR-001=6, NFR-002=6, NFR-003=3, NFR-004=3.
- **Findings vigentes**: nenhum `BLOCKER` ou `P1 Open`; FIND-ARCH-001, FIND-ARCH-002 e FIND-SEC-001 permanecem como evidências históricas `Resolved`.
- **Transições executadas**: `$specsfy-06-tdd-bdd` em modo `prepare` materializou os REDs T030–T038; `$specsfy-05-tasks` revalidou o plano e liberou o Plan Gate.
- **Comandos**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`; `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`
- **Cobertura**: 12 ACs; US-001=4, US-002=4, US-003=5; FR-001=3, FR-002=4, FR-003=5, FR-004=7; NFR-001=9, NFR-002=8, NFR-003=7.
- **FIND-ARCH-001** [P1] [Resolved] o estado singleton e caches não indexados permitiam resposta assíncrona antiga após a troca — Refs: FR-002, NFR-001, AC-004 — Evidence: apps/web/src/lib/features/notes/notes-state.svelte.ts:206 — Effect: conteúdo de A poderia aparecer em B — Suggestion: resolvido por token de geração, barreira de commit e testes de corrida definidos nas seções 4, 8 e 11.
- **FIND-ARCH-002** [P2] [Resolved] o primeiro rascunho apontava componentes e bridge nativa para diretórios divergentes do monorepo — Refs: FR-004 — Evidence: apps/web/src/lib/features/navigation/AppSidebar.svelte:90 — Effect: tarefas seriam produzidas em fronteiras erradas — Suggestion: estrutura e tabela de componentes corrigidas para `features/navigation`, `features/workspace` e `apps/desktop/src-tauri`.
- **FIND-SEC-001** [P1] [Resolved] o contrato atual só expõe exclusão opcional de arquivo e não prova ownership/capacidade para apagar uma raiz — Refs: FR-003, NFR-002, AC-009, AC-010 — Evidence: apps/web/src/lib/storage/types.ts:39 — Effect: implementar exclusão diretamente poderia apagar conteúdo não pertencente ao OpenBible — Suggestion: resolvido por capability explícita, marcador gerenciado, scan de allowlist, lock e falha fechada sem força.
- **Achados restantes**: nenhum `BLOCKER` e nenhum `P1 Open`.

#### Gate do Ato II — Plano

- **Resultado histórico**: Passed em 2026-09-05 para a arquitetura anterior. **Resultado atual**: Passed em 2026-09-06 após reconciliar as tarefas vigentes, materializar T030–T038 com RED válido e validar o plano.
- **Comandos**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0016-multiplos-workspaces-modelo-vaults/spec.md`; `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0016-multiplos-workspaces-modelo-vaults/spec.md`; `node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/in-progress/0016-multiplos-workspaces-modelo-vaults/spec.md . --task T039` — todos passaram.
- **Contagens**: 53 tarefas; 53 concluídas; 22 tarefas `[TEST] [TDD]`; 24 tarefas `[CODE]`; 318 itens de checklist, 318 concluídos; cobertura 34/34 IDs; interface OK.
- **Achados**: nenhum bloqueio dentro da spec. O auditor global registrou 34/34 IDs cobertos e `GAPS` somente por marcadores órfãos preexistentes de outras specs; esses marcadores foram preservados e não pertencem ao contrato desta revisão.
- **RED revisado**: a suíte focal dos nove ACs vigentes executou em 2026-09-06 com 9 testes falhando por contratos ausentes da arquitetura SQLite/IndexedDB, sem falha de importação ou ambiente. Comando protegido por `check_database_safety.mjs` → `SAFE`: `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-migration.test.ts src/lib/storage/workspace-scope.test.ts src/lib/storage/workspace-lifecycle-contract.test.ts src/lib/storage/workspace-adapter-contract.test.ts src/lib/storage/workspace-repository.test.ts src/lib/storage/workspace-delete.test.ts src/lib/features/workspace/workspace-recovery.test.ts src/lib/storage/workspace-export-source.test.ts`.
- **T039 GREEN**: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` passou com 8 testes; o focal Vitest de persistência/adapter/bridge passou com 4 testes; a migration v1 criou `workspaces`, `active_workspace_pointer` e `legacy_workspace_migrations` em `app.sqlite`.
- **T040 GREEN**: o adapter IndexedDB passou 3 testes focais com criação de schema, escopo por `workspaceId`, persistência de blob e reabertura; stores e índices estão documentados em `.specsfy/DATABASE.md`. O check TypeScript foi executado, mas mantém erros preexistentes fora da área de storage.
- **T041 GREEN**: `workspace-migration.test.ts`, o adapter IndexedDB, os contratos de persistência/paridade e a regressão do catálogo passaram com 8 testes; a migração não chama `writeFile`, usa identidade estável para fonte v1 sem `workspaceId`, registra `running/completed/error` e retry não duplica o registro. `bun run --cwd apps/web check` continua com falhas preexistentes fora da área de migration/storage.
- **T042 GREEN**: contratos de lifecycle, retry/descarte, recovery e concorrência passaram com 6 testes; `SwitchResult` confirma `committed: true`, o commit guard centralizado rejeita `stale_generation` sem mover o ativo e `WorkspaceOpenError` normaliza `reasonCode` para recovery.
- **T043 GREEN**: o catálogo expõe backend normalizado (`sqlite`/`indexeddb`), `WorkspaceRepository` oferece contexto explícito por `workspaceId` e `WorkspaceState.dataContext` vincula ID, geração e backend; testes A/B passaram sem vazamento e ID vazio foi rejeitado.
- **T044 GREEN**: repository/catalog e bridge passaram 8 testes; Rust passou 9 testes com exclusão transacional de um workspace, limpeza do ponteiro ativo e preservação do vizinho. A camada física continua protegida por guards fail-closed e sem caminho de force.
- **T045 GREEN**: `WorkspaceExportSource` passou 9 testes focais com snapshot v1, listagem/leitura somente-leitura de notas e escopo de path; a saída não fixa Markdown/PDF, preservando esses formatos para parser/exportador posterior.
- **T046 GREEN**: seletor desktop/mobile comunica `SQLite local` ou `IndexedDB local` no item e no `aria-label`, mantém loading/vazio/erro e conflito de persistência acionáveis, e o footer do Sidebar nomeia o contexto local; 8 testes focais passaram.
- **T047 GREEN**: barra mobile sticky exibe workspace/backend ativos, abre `Drawer` com o mesmo `WorkspaceSelector`, mantém safe-area, foco e fechamento por ação; 9 testes focais passaram.
- **T048 GREEN**: gestão lista backend, status e último acesso, separa remoção não destrutiva, restauração e exclusão, e mantém estados loading/vazio/erro com ações nomeadas; 20 testes focais passaram.
- **T049 GREEN**: diálogo de exclusão mantém confirmação digitada, guards fail-closed, bloqueio sem forçar e anuncia conflito de persistência; a remoção do registro é confirmada no SQLite/IndexedDB após a capability da raiz; 12 testes focais passaram.
- **T050 GREEN**: recovery diferencia `SCHEMA_UNAVAILABLE`, `MIGRATION_REQUIRED` e `PERSISTENCE_UNAVAILABLE`, mantém a fonte legada preservada e oferece retry, retomar migração, restaurar fonte e escolher outro workspace; 27 testes focais passaram.
- **T051 GREEN**: criar/adicionar/abrir permanecem ações distintas, os formulários validam trim e colisões, anunciam loading/erro e mapeiam schema, persistência, migração e reconexão sem fallback silencioso; 22 testes focais passaram.
- **T052 GREEN**: inventários, regras, perfil, `PROJECT.md`, `INTERFACE.md` e documentação técnica registram SQLite/IndexedDB como backends normativos, catálogo/manifesto como migração/recovery e Markdown/PDF como exportação; documentação reconstruída e check compatível.
- **QA de aceite**: `verify_acceptance.mjs` passou; AC-001–AC-012 permanecem identificados como histórico preservado e AC-013–AC-021 são os critérios vigentes GREEN.

#### Gate do Ato III — Entrega

- **Resultado atual**: Passed — a revisão SQLite/IndexedDB foi implementada, verificada e documentada; os ACs vigentes AC-013–AC-021 estão GREEN e o aceite automatizado passou.
- **Comando TDD focal**: protegido por `check_database_safety.mjs` → `SAFE`, `bun run --cwd apps/web test:tdd -- [33 arquivos focais de storage/workspace/navigation, excluindo backup]` → 33 arquivos e 81 testes passaram.
- **Verificação nativa**: protegido por `check_database_safety.mjs` → `SAFE`, `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` → 9 testes passaram; `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` → exit 0.
- **Rastreabilidade e aceite**: `check_traceability.mjs --full-chain` cobre 34/34 IDs da spec; `verify_acceptance.mjs` → `QA: PASSED`. Marcadores órfãos reportados pelo auditor pertencem a outras specs e permanecem fora desta fonte normativa.
- **Qualidade global**: `bun run --cwd apps/web check` mantém erros TypeScript preexistentes fora da área alterada; a execução ampla das pastas inclui 14 REDs preexistentes de backup da SPEC-0019. Esses achados não bloqueiam o Delivery Gate desta fatia e ficam registrados para seus respectivos trabalhos.
- **Entrega T013–T029 (2026-09-05)**: 11 tarefas CODE + 5 DOC + regressão concluídas. Focais da spec: 27 passed (6 arquivos). Suíte total: 403 passed / 74 failed — todos os 74 em arquivos RED de outras specs (backup, sync, agentes, portáteis), confirmados preexistentes por baseline em HEAD sem as mudanças; nenhum arquivo da spec falha. `check`: 43 erros TS preexistentes, nenhum nos arquivos da entrega. Lint: 41 erros preexistentes, nenhum novo. `cargo check` (Tauri): `Finished`, exit 0. Rastreabilidade: 22/22 IDs; órfãos só de outras specs (pré-documentados). `validate_tasks`: READY; interface: OK. Evidências `specsfy:evidence` de T013–T023: PASSED (strict).
- **Correções em Reviewing (2026-09-06, pedido da pessoa)**: seletor movido para `Sidebar.Footer` abaixo do toggle de tema, com modo ícone só com o botão (sem overflow no sidebar fechado); §10 e `INTERFACE.md` atualizados. Fluxos criar/adicionar unificados em `trackActivation` com retomada de ativação pendente sem novo picker (fim do loop escolher→preparar→falhar→reescolher); falha de ativação agora aparece visível no dialog com [Tentar ativar novamente], e o erro genérico do seletor anuncia o detalhe técnico. Focais: 27 passed; `check` sem novos erros.
- **Causa raiz do “Não foi possível abrir” (2026-09-06)**: `WorkspaceSelector` chamava `getWorkspaceState()` (getContext) dentro do handler assíncrono — fora da init o Svelte lança `lifecycle_outside_component`, caindo sempre no erro genérico após criar/cadastrar com sucesso. Corrigido capturando o state na init como nos demais 15 componentes; mesmo hardening no hover do `MilkdownNoteEditor`. Fim do falso “só falta ativar”.

### 14. Tarefas

> **Plano vigente da revisão:** T001–T029 abaixo foram planejadas/executadas para a arquitetura de filesystem e ficam preservadas como histórico, mas estão invalidadas como autorização de implementação desta revisão. As tarefas T030–T053 são o novo backlog normativo e permanecem abertas até o Plan Gate.

#### Fase revisada — banco, migração e contratos

- [x] T030 [P] [TEST] [TDD] [US-001] Derivar o RED de persistência por runtime do AC-013 em `apps/web/src/lib/storage/workspace-persistence-contract.test.ts` — Refs: US-001, FR-001, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, NFR-004, AC-013 — Depends: none
  - [x] **PREP**: Ler AC-013, confirmar Tauri→SQLite, PWA→IndexedDB e separar contrato de domínio dos adapters.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-013`, sem criar `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-persistence-contract.test.ts` e observar RED por ausência do contrato revisado; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; esta tarefa materializa somente o contrato de persistência.
  - [x] **EVIDENCE**: Registrar comando, RED e IDs em 11–13.
  - [x] **IMPROVE**: Garantir que o teste não acople a UI a SQLite ou IndexedDB.
  <!-- specsfy:evidence {"task":"T030","refs":["US-001","FR-001","FR-004","FR-005","FR-006","NFR-001","NFR-002","NFR-003","NFR-004","AC-013"],"files":["apps/web/src/lib/storage/workspace-persistence-contract.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-persistence-contract.test.ts","exit":1}]} -->

- [x] T031 [P] [TEST] [TDD] [US-001] Derivar o RED de migração idempotente do AC-014 em `apps/web/src/lib/storage/workspace-migration.test.ts` — Refs: US-001, FR-001, FR-005, NFR-001, AC-014 — Depends: none
  - [x] **PREP**: Ler AC-014 e preparar fonte legada, banco vazio, repetição e preservação da origem.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-014`, sem apagar fontes reais.
  - [x] **VERIFY**: Executar o teste focal e observar RED por ausência da migration; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; migration sem superfície visual.
  - [x] **EVIDENCE**: Registrar cenário, comando, RED e IDs em 11–13.
  - [x] **IMPROVE**: Separar duplicidade de falha parcial para tornar o rollback observável.
  <!-- specsfy:evidence {"task":"T031","refs":["US-001","FR-001","FR-005","NFR-001","AC-014"],"files":["apps/web/src/lib/storage/workspace-migration.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-migration.test.ts","exit":1}]} -->

- [x] T032 [P] [TEST] [TDD] [US-001] Derivar o RED de isolamento por `workspaceId` do AC-015 em `apps/web/src/lib/storage/workspace-scope.test.ts` — Refs: US-001, US-002, FR-002, NFR-002, AC-015 — Depends: none
  - [x] **PREP**: Preparar workspaces A/B com registros, índices e preferências distintos.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-015` para provar leitura e escrita escopadas.
  - [x] **VERIFY**: Executar o teste focal e observar RED por vazamento ou ausência do contexto; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; o comportamento é de repositório/contexto.
  - [x] **EVIDENCE**: Registrar dados de A/B, comando, RED e IDs.
  - [x] **IMPROVE**: Adicionar uma asserção para consultas globais permitidas apenas no schema.
  <!-- specsfy:evidence {"task":"T032","refs":["US-001","US-002","FR-002","NFR-002","AC-015"],"files":["apps/web/src/lib/storage/workspace-scope.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-scope.test.ts","exit":1}]} -->

- [x] T033 [P] [TEST] [TDD] [US-002] Derivar o RED da barreira de flush/commit do AC-016 em `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — Refs: US-002, FR-002, NFR-001, AC-016 — Depends: none
  - [x] **PREP**: Ler AC-016 e modelar sucesso, falha de commit e preservação do ativo anterior.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-016` e flush injetável.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela ordem incorreta ou commit ausente; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; lifecycle sem superfície visual.
  - [x] **EVIDENCE**: Registrar ordem esperada, comando, RED e IDs.
  - [x] **IMPROVE**: Manter o teste determinístico, sem timers reais.
  <!-- specsfy:evidence {"task":"T033","refs":["US-002","FR-002","NFR-001","AC-016"],"files":["apps/web/src/lib/storage/workspace-lifecycle-contract.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle-contract.test.ts","exit":1}]} -->

- [x] T034 [P] [TEST] [TDD] [US-001] Derivar o RED de paridade dos adapters do AC-017 em `apps/web/src/lib/storage/workspace-adapter-contract.test.ts` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-006, NFR-001, NFR-004, AC-017 — Depends: T030
  - [x] **PREP**: Definir a matriz create/list/rename/switch/remove/delete para SQLite e IndexedDB.
  - [x] **EXECUTE**: Escrever contrato parametrizado com marcador `SPECSFY: AC-017`.
  - [x] **VERIFY**: Executar contra doubles dos dois adapters e observar RED no contrato ausente; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; contrato de storage.
  - [x] **EVIDENCE**: Registrar matriz, comando, RED e IDs.
  - [x] **IMPROVE**: Comparar resultados normalizados e não detalhes físicos do banco.
  <!-- specsfy:evidence {"task":"T034","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-006","NFR-001","NFR-004","AC-017"],"files":["apps/web/src/lib/storage/workspace-adapter-contract.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-adapter-contract.test.ts","exit":1}]} -->

- [x] T035 [P] [TEST] [TDD] [US-003] Derivar o RED de remoção não destrutiva do AC-018 em `apps/web/src/lib/storage/workspace-repository.test.ts` — Refs: US-003, FR-003, FR-004, NFR-002, NFR-003, AC-018 — Depends: T030
  - [x] **PREP**: Preparar workspace com dados e confirmar diferença entre remover e excluir.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-018`.
  - [x] **VERIFY**: Executar o teste focal e observar RED se os registros forem apagados; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; a interface será testada na fase própria.
  - [x] **EVIDENCE**: Registrar estado antes/depois, comando, RED e IDs.
  - [x] **IMPROVE**: Cobrir restauração/reconexão no mesmo contrato.
  <!-- specsfy:evidence {"task":"T035","refs":["US-003","FR-003","FR-004","NFR-002","NFR-003","AC-018"],"files":["apps/web/src/lib/storage/workspace-repository.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-repository.test.ts","exit":1}]} -->

- [x] T036 [P] [TEST] [TDD] [US-003] Derivar o RED de exclusão transacional do AC-019 em `apps/web/src/lib/storage/workspace-delete.test.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-004, AC-019 — Depends: T034
  - [x] **PREP**: Preparar confirmação, concorrência, falha intermediária e outro workspace protegido.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-019`.
  - [x] **VERIFY**: Executar o teste focal e observar RED por exclusão parcial ou cross-workspace; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; guardas de persistência.
  - [x] **EVIDENCE**: Registrar transação, rollback, comando, RED e IDs.
  - [x] **IMPROVE**: Usar erro tipado estável para conflito e indisponibilidade.
  <!-- specsfy:evidence {"task":"T036","refs":["US-003","FR-003","NFR-001","NFR-002","NFR-004","AC-019"],"files":["apps/web/src/lib/storage/workspace-delete.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-delete.test.ts","exit":1}]} -->

- [x] T037 [P] [TEST] [TDD] [US-002] Derivar o RED de recovery do AC-020 em `apps/web/src/lib/features/workspace/workspace-recovery.test.ts` — Refs: US-002, FR-002, FR-004, FR-005, NFR-001, NFR-003, AC-020 — Depends: T033
  - [x] **PREP**: Mapear banco indisponível, schema incompatível e migration interrompida para ações acionáveis.
  - [x] **EXECUTE**: Escrever o teste de componente/estado com marcador `SPECSFY: AC-020`.
  - [x] **VERIFY**: Executar o teste focal e observar RED se houver fallback silencioso; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Conferir anúncio de erro, foco e ação de retry; registrar `Não aplicável` somente se o runner não renderizar.
  - [x] **EVIDENCE**: Registrar causa, ação, comando, RED e IDs.
  - [x] **IMPROVE**: Manter mensagens por `reasonCode`, sem depender de cor.
  <!-- specsfy:evidence {"task":"T037","refs":["US-002","FR-002","FR-004","FR-005","NFR-001","NFR-003","AC-020"],"files":["apps/web/src/lib/features/workspace/workspace-recovery.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-recovery.test.ts","exit":1}]} -->

- [x] T038 [P] [TEST] [TDD] [US-001] Derivar o RED do `WorkspaceExportSource` do AC-021 em `apps/web/src/lib/storage/workspace-export-source.test.ts` — Refs: US-001, FR-002, FR-006, NFR-002, AC-021 — Depends: T032
  - [x] **PREP**: Confirmar snapshot somente-leitura e fronteira futura do parser Markdown/PDF.
  - [x] **EXECUTE**: Escrever o teste Vitest com marcador `SPECSFY: AC-021`.
  - [x] **VERIFY**: Executar o teste focal e observar RED por mutação ou escopo incorreto; exit 1, sem falha de importação/ambiente.
  - [x] **VISUAL**: Não aplicável; contrato de export-source.
  - [x] **EVIDENCE**: Registrar snapshot, comando, RED e IDs.
  - [x] **IMPROVE**: Garantir que a saída não fixe o formato Markdown nesta spec.
  <!-- specsfy:evidence {"task":"T038","refs":["US-001","FR-002","FR-006","NFR-002","AC-021"],"files":["apps/web/src/lib/storage/workspace-export-source.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-export-source.test.ts","exit":1}]} -->

#### Fase 2 — Fundação e persistência

- [x] T039 [P] [CODE] [US-001] Implementar schema versionado e migration SQLite nativa em `apps/desktop/src-tauri/src/database.rs` e `apps/desktop/src-tauri/migrations/001_create_workspaces.sql` — Refs: US-001, FR-001, FR-005, NFR-001, NFR-004, AC-013, AC-014, AC-017 — Depends: T030, T031, T034
  - [x] **PREP**: Confirmar REDs T030/T031/T034, `app.sqlite`, `workspace_id`, transações e banco de teste explicitamente separado.
  - [x] **EXECUTE**: Criar migration versionada, adapter de abertura/schema, estado Tauri e bridge tipada; executar `$specsfy-documentator` antes e depois de alterar código.
  - [x] **VERIFY**: Executar contratos Vitest e testes Rust com banco temporário protegido; 4 testes Vitest e 8 testes Rust passaram. O `bun run --cwd apps/web check` foi executado e manteve falhas preexistentes fora desta mudança.
  - [x] **VISUAL**: Não aplicável; schema, adapter nativo e bridge sem superfície visual.
  - [x] **EVIDENCE**: Registrar arquivos, migration, schema aplicado, comandos e resultados em 11–13.
  - [x] **IMPROVE**: Mapear indisponibilidade do banco para erro tipado `database_unavailable`, manter `app.sqlite` fora da raiz autoral e impedir que o schema futuro aceite versão superior silenciosamente.
  <!-- specsfy:evidence {"task":"T039","refs":["US-001","FR-001","FR-005","NFR-001","NFR-004","AC-013","AC-014","AC-017"],"files":["apps/desktop/src-tauri/src/database.rs","apps/desktop/src-tauri/migrations/001_create_workspaces.sql","apps/desktop/src-tauri/src/lib.rs","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/workspace-catalog.ts",".specsfy/DATABASE.md"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-adapter-contract.test.ts src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T040 [P] [CODE] [US-001] Implementar adapter IndexedDB por origem em `apps/web/src/lib/storage/indexeddb-workspace-adapter.ts` — Refs: US-001, FR-001, NFR-001, NFR-004, AC-013, AC-017 — Depends: T030, T032, T034
  - [x] **PREP**: Confirmar REDs T030/T034 e definir object stores, índices/chaves por `workspaceId` e blobs.
  - [x] **EXECUTE**: Implementar abertura/versionamento, stores `workspaces`, ponteiro ativo, migrações legadas e blobs, transações e validação runtime; executar `$specsfy-documentator` antes e depois do código.
  - [x] **VERIFY**: Executar o contrato de capabilities, o teste do adapter com upgrade/reabertura e escopo por `workspaceId`, além do check protegido. 3 testes focais passaram; o check manteve somente falhas preexistentes fora desta área.
  - [x] **VISUAL**: Não aplicável; adapter de persistência sem superfície visual.
  - [x] **EVIDENCE**: Registrar stores, índices, chaves compostas, comandos e resultados em 11–13.
  - [x] **IMPROVE**: Encapsular diferenças de transação e concorrência na porta IndexedDB, rejeitar registros malformados e fechar a conexão em `versionchange`.
  <!-- specsfy:evidence {"task":"T040","refs":["US-001","FR-001","NFR-001","NFR-004","AC-013","AC-017"],"files":["apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/storage/indexeddb-workspace-adapter.test.ts","apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/workspace-catalog.ts",".specsfy/DATABASE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-adapter-contract.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T041 [CODE] [US-001] Implementar `LegacyWorkspaceSource` e migration idempotente em `apps/web/src/lib/storage/workspace-migration.ts` — Refs: US-001, FR-001, FR-005, NFR-001, AC-014 — Depends: T031, T039, T040
  - [x] **PREP**: Confirmar RED T031, preservar fonte legada e mapear retry sem duplicata.
  - [x] **EXECUTE**: Implementar leitura somente-leitura, cursor/progresso e rollback; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Executar migration duas vezes, simular fonte não gravável e confirmar fonte intacta; retry retornou o mesmo `workspaceId` sem duplicata.
  - [x] **VISUAL**: Não aplicável; migration sem interface.
  - [x] **EVIDENCE**: Registrar comandos, estados antes/depois e resultado nos gates.
  - [x] **IMPROVE**: Tornar o marcador de progresso recuperável e observável por `legacy_workspace_migrations`/cursor.
  <!-- specsfy:evidence {"task":"T041","refs":["US-001","FR-001","FR-005","NFR-001","AC-014"],"files":["apps/web/src/lib/storage/workspace-migration.ts","apps/web/src/lib/storage/workspace-migration.test.ts","apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts",".specsfy/DATABASE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-migration.test.ts src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-adapter-contract.test.ts src/lib/storage/workspace-catalog.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T042 [CODE] [US-002] Implementar lifecycle de flush/commit, generation e recovery em `apps/web/src/lib/storage/workspace-lifecycle.ts` — Refs: US-002, FR-002, FR-004, FR-005, NFR-001, NFR-003, AC-016, AC-020 — Depends: T033, T037, T039, T040, T041
  - [x] **PREP**: Confirmar REDs T033/T037, estados, reasonCodes e barreira do workspace ativo.
  - [x] **EXECUTE**: Implementar lifecycle e executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Executar flush success/failure, stale generation, schema failure e retry; 6 testes focais passaram.
  - [x] **VISUAL**: Conferir loading/erro/recovery/foco, bordas, espaçamentos, margens, padding e tipografia nos componentes consumidores; núcleo sem superfície visual, estados consumidores permanecem cobertos por testes existentes.
  - [x] **EVIDENCE**: Registrar ordem, erros, comandos e resultados em 11–13.
  - [x] **IMPROVE**: Centralizar commit guard e eliminar fallback implícito; códigos de recovery preservam compatibilidade com `code` e adicionam `reasonCode` estável.
  <!-- specsfy:evidence {"task":"T042","refs":["US-002","FR-002","FR-004","FR-005","NFR-001","NFR-003","AC-016","AC-020"],"files":["apps/web/src/lib/storage/workspace-lifecycle.ts","apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/workspace-lifecycle-contract.test.ts","apps/web/src/lib/storage/workspace-lifecycle.test.ts","apps/web/src/lib/features/workspace/workspace-recovery.test.ts","apps/web/src/lib/features/workspace/workspace-switching.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle-contract.test.ts src/lib/storage/workspace-lifecycle.test.ts src/lib/features/workspace/workspace-recovery.test.ts src/lib/features/workspace/workspace-switching.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T043 [CODE] [US-001] Escopar repositórios e contexto de dados por `workspaceId` em `apps/web/src/lib/storage/workspace-repository.ts` e `apps/web/src/lib/features/workspace/workspace-state.svelte.ts` — Refs: US-001, US-002, FR-001, FR-002, NFR-002, AC-015 — Depends: T032, T034, T040, T042
  - [x] **PREP**: Confirmar RED T032 e inventariar consumidores que resolvem o workspace ativo.
  - [x] **EXECUTE**: Implementar repository/contexto escopado e executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Executar testes A/B, queries globais permitidas e troca de ponteiro; 13 testes focais passaram e query sem ID falhou fechado.
  - [x] **VISUAL**: Conferir loading/erro/recovery/foco, bordas, espaçamentos, margens, padding e tipografia nos consumidores do contexto; repository sem superfície visual, estados ficam nas tarefas de interface.
  - [x] **EVIDENCE**: Registrar arquivos, consultas, comandos e ausência de vazamento.
  - [x] **IMPROVE**: Fazer query sem `workspaceId` falhar explicitamente fora do schema global.
  <!-- specsfy:evidence {"task":"T043","refs":["US-001","US-002","FR-001","FR-002","NFR-002","AC-015"],"files":["apps/web/src/lib/storage/workspace-repository.ts","apps/web/src/lib/storage/workspace-repository-scope.test.ts","apps/web/src/lib/storage/workspace-scope.test.ts","apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/features/workspace/workspace-state.svelte.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-repository-scope.test.ts src/lib/storage/workspace-scope.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/features/workspace/workspace-state.test.ts src/lib/features/workspace/workspace-switching.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T044 [CODE] [US-003] Implementar remove/restore/delete transacional em `apps/web/src/lib/storage/workspace-repository.ts` e `apps/desktop/src-tauri/src/database.rs` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-004, AC-018, AC-019 — Depends: T035, T036, T039, T040, T042, T043
  - [x] **PREP**: Confirmar REDs T035/T036, distinção de ações e guardas de concorrência.
  - [x] **EXECUTE**: Implementar desanexação, restauração e exclusão atômica; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Executar contrato nos dois adapters, falha intermediária e isolamento do workspace vizinho; 8 testes web e 9 testes Rust passaram.
  - [x] **VISUAL**: Conferir loading/erro/recovery/foco da confirmação, bordas, espaçamentos, margens, padding e tipografia na interface consumidora; domínio sem superfície visual, confirmação completa fica na fase de interface.
  - [x] **EVIDENCE**: Registrar transação, rollback, comandos e resultados.
  - [x] **IMPROVE**: Manter remove reversível, delete sem caminho de force e conflito persistente tipado.
  <!-- specsfy:evidence {"task":"T044","refs":["US-003","FR-003","FR-004","NFR-001","NFR-002","NFR-004","AC-018","AC-019"],"files":["apps/web/src/lib/storage/workspace-repository.ts","apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/web/src/lib/storage/workspace-repository.test.ts","apps/web/src/lib/storage/workspace-delete.test.ts","apps/desktop/src-tauri/src/database.rs","apps/desktop/src-tauri/src/lib.rs"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-repository.test.ts src/lib/storage/workspace-delete.test.ts src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/tauri-bridge.test.ts src/lib/storage/workspace-repository-scope.test.ts src/lib/storage/workspace-scope.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T045 [CODE] [US-001] Implementar `WorkspaceExportSource` somente-leitura em `apps/web/src/lib/storage/workspace-export-source.ts` — Refs: US-001, FR-002, FR-006, NFR-002, AC-021 — Depends: T038, T043
  - [x] **PREP**: Confirmar RED T038 e delimitar snapshot sem parser Markdown/PDF.
  - [x] **EXECUTE**: Implementar snapshot/listagem de notas e executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Confirmar consistência, escopo por `workspaceId` e ausência de mutação; 9 testes focais passaram.
  - [x] **VISUAL**: Não aplicável ao contrato de leitura; não há loading/erro/recovery/foco, bordas, espaçamentos, margens, padding ou tipografia novos nesta camada.
  - [x] **EVIDENCE**: Registrar teste, comando e resultado.
  - [x] **IMPROVE**: Versionar snapshot para exportadores futuros sem acoplar o formato.
  <!-- specsfy:evidence {"task":"T045","refs":["US-001","FR-002","FR-006","NFR-002","AC-021"],"files":["apps/web/src/lib/storage/workspace-export-source.ts","apps/web/src/lib/storage/workspace-export-source.test.ts","apps/web/src/lib/storage/workspace-catalog.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-export-source.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace-repository-scope.test.ts src/lib/storage/workspace-scope.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase de interface

- [x] T046 [CODE] [US-001] Reconciliar o seletor desktop em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` e `apps/web/src/lib/features/navigation/AppSidebar.svelte` — Refs: US-001, FR-004, NFR-003, AC-013 — Depends: T042, T043
  - [x] **PREP**: Confirmar Sidebar.Footer, menu, estados de banco e convenções do `DESIGNSYSTEM.MD`.
  - [x] **EXECUTE**: Implementar seleção/criação/gestão sem expor SQLite/IndexedDB; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar abertura, teclado, loading, vazio, sucesso e erro no teste de sidebar; 8 testes focais passaram e o check não apontou erro novo nos componentes.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro e 1440px; revisão estática confirmou fonte Geist, mono para backend, foco visível, sem overflow e reduced motion preservado em desktop/mobile.
  - [x] **EVIDENCE**: Registrar arquivo, comando, resultado e estado acessível em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Manter uma única regra de domínio para o seletor usando `backendLabel` compartilhado.
  <!-- specsfy:evidence {"task":"T046","refs":["US-001","FR-004","NFR-003","AC-013"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte","apps/web/src/lib/features/navigation/app-sidebar.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts src/lib/features/workspace/workspace-state.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-scope.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T047 [CODE] [US-001] Reconciliar o seletor mobile em `apps/web/src/lib/features/workspace/AppFrame.svelte` e `WorkspaceSelector.svelte` — Refs: US-001, FR-004, NFR-003, AC-013 — Depends: T046
  - [x] **PREP**: Confirmar Drawer, retorno de foco, safe-area e comportamento em 320px.
  - [x] **EXECUTE**: Compor o mesmo seletor no header/drawer; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar abrir/fechar, teclado, foco, overflow e anúncios em teste Svelte; 9 testes focais passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, 320px e 480px; barra usa safe-area, ellipsis, foco visível e reduced motion.
  - [x] **EVIDENCE**: Registrar fluxo, viewport, comando e resultado em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Evitar divergência de ações entre desktop e mobile usando `storageBackendLabel` e o mesmo `WorkspaceSelector`.
  <!-- specsfy:evidence {"task":"T047","refs":["US-001","FR-004","NFR-003","AC-013"],"files":["apps/web/src/lib/features/workspace/AppFrame.svelte","apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/navigation/app-sidebar.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts src/lib/features/workspace/workspace-state.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-scope.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T048 [CODE] [US-003] Reconciliar lista e formulário de gestão em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-003, AC-018, AC-019 — Depends: T044
  - [x] **PREP**: Confirmar lista, rename, remove/restore, estados e ações nomeadas.
  - [x] **EXECUTE**: Implementar gestão acessível sem detalhe de backend; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar validação, sucesso, erro, recovery, teclado e retorno ao shell; 20 testes focais passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px e tema claro/escuro; lista usa ID em mono, foco visível, `aria-current` e estados textuais.
  - [x] **EVIDENCE**: Registrar componente, estados, comando e resultado em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Manter remove e delete semanticamente independentes; remoção fica `detached` e restauração retorna o registro ao seletor.
  <!-- specsfy:evidence {"task":"T048","refs":["US-003","FR-003","FR-004","NFR-003","AC-018","AC-019"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/workspace/workspace-settings.spec.ts","apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/workspace-catalog.test.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/navigation/app-sidebar.spec.ts src/lib/features/workspace/workspace-state.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-scope.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace-repository.test.ts src/lib/storage/workspace-repository-scope.test.ts src/lib/storage/workspace-delete.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T049 [CODE] [US-003] Reconciliar o dialog de exclusão em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-003, AC-019 — Depends: T048
  - [x] **PREP**: Confirmar confirmação forte, guards de concorrência, rollback e ausência de “forçar”.
  - [x] **EXECUTE**: Implementar Dialog/AlertDialog com consequência textual; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar confirmar/cancelar/bloquear, `aria-live`, foco preso e retorno ao acionador; 12 testes focais passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em dialog/drawer e conteúdo longo; conflito usa anúncio assertivo, foco visível e sem ação de forçar.
  - [x] **EVIDENCE**: Registrar estados, comandos e resultado em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Explicar conflito e rollback sem depender apenas de cor; confirmar a exclusão do registro no backend normativo.
  <!-- specsfy:evidence {"task":"T049","refs":["US-003","FR-003","FR-004","NFR-001","NFR-003","AC-019"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/workspace-delete.test.ts","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-bridge.test.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-settings.spec.ts src/lib/storage/workspace-delete.test.ts src/lib/storage/tauri-bridge.test.ts src/lib/storage/workspace-catalog.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T050 [CODE] [US-002] Reconciliar recovery em `apps/web/src/lib/features/workspace/PermissionRecovery.svelte` — Refs: US-002, FR-002, FR-004, NFR-003, AC-020 — Depends: T042
  - [x] **PREP**: Confirmar reasonCodes de schema/migration/indisponibilidade e ações retry/retomar/restaurar/escolher.
  - [x] **EXECUTE**: Implementar estados acionáveis e executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar erro, loading, retry, foco, Escape e live region em teste Svelte; 27 testes focais passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro e conteúdo longo; recovery usa foco visível, `aria-live` assertivo e reduced motion.
  - [x] **EVIDENCE**: Registrar causas, ações, comandos e resultado em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Usar mensagens específicas sem fallback silencioso; falha de migração preserva a fonte e publica estado recuperável.
  <!-- specsfy:evidence {"task":"T050","refs":["US-002","FR-002","FR-004","NFR-003","AC-020"],"files":["apps/web/src/lib/features/workspace/PermissionRecovery.svelte","apps/web/src/lib/features/workspace/native-workspace-states.ts","apps/web/src/lib/features/workspace/permission-recovery.spec.ts","apps/web/src/lib/features/workspace/workspace-recovery.test.ts","apps/web/src/lib/features/workspace/workspace-state.svelte.ts","apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/workspace-migration.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/permission-recovery.spec.ts src/lib/features/workspace/native-workspace-states.test.ts src/lib/features/workspace/workspace-recovery.test.ts src/lib/features/workspace/workspace-state.test.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/navigation/app-sidebar.spec.ts src/lib/storage/workspace-migration.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace-delete.test.ts src/lib/storage/workspace-repository.test.ts src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T051 [CODE] [US-001] Reconciliar dialogs e formulários de criação/abertura/rename em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` e `WorkspaceSettings.svelte` — Refs: US-001, US-003, FR-001, FR-003, FR-004, NFR-003, AC-013, AC-018 — Depends: T046, T048
  - [x] **PREP**: Confirmar campos, trim, colisão, estados de gravação e diferença entre abrir e remover.
  - [x] **EXECUTE**: Implementar formulários compartilhados nos padrões Dialog/Drawer; executar `$specsfy-documentator` antes do código.
  - [x] **VERIFY**: Exercitar submit, validação inline, cancelamento, teclado, loading e retorno de foco; 22 testes focais passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro e sem overflow; ações e estados usam labels, foco e `aria-live`.
  - [x] **EVIDENCE**: Registrar arquivos, fluxos, comandos e resultados em `INTERFACE.md` e 11–13.
  - [x] **IMPROVE**: Compartilhar campos sem duplicar regras de domínio; mapear recovery de banco/migração/reconexão no mesmo seletor desktop/mobile.
  <!-- specsfy:evidence {"task":"T051","refs":["US-001","US-003","FR-001","FR-003","FR-004","NFR-003","AC-013","AC-018"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/workspace/workspace-selector.spec.ts","apps/web/src/lib/features/workspace/workspace-settings.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-selector.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/navigation/app-sidebar.spec.ts src/lib/features/workspace/permission-recovery.spec.ts src/lib/features/workspace/workspace-state.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase final — Qualidade e documentação

- [x] T052 [DOC] [US-001] Atualizar `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `PROJECT.md`, `INTERFACE.md` e `docs/` após a fundação — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, NFR-004 — Depends: T039, T040, T041, T042, T043, T044, T045, T046, T047, T048, T049, T050, T051
  - [x] **PREP**: Conferir schema real, adapters, regras confirmadas, impacto de produto e blocos de interface.
  - [x] **EXECUTE**: Executar `$specsfy-aux-database`, `$specsfy-aux-stack`, `$specsfy-aux-rules` quando aplicáveis e `$specsfy-documentator`; atualizar somente fatos confirmados.
  - [x] **VERIFY**: Comparar documentação com código, migrations, manifests e componentes; `DATABASE`, `STACK`, `RULES`, perfil, `PROJECT` e `docs` reconciliados.
  - [x] **VISUAL**: Não aplicável; tarefa documental, exceto verificar que `INTERFACE.md` cobre os estados visuais e que as tabelas geradas permanecem legíveis.
  - [x] **EVIDENCE**: Registrar diffs, fontes e comandos nos gates.
  - [x] **IMPROVE**: Remover contradições entre a fundação e a documentação anterior; manter a spec como fonte normativa única.
  <!-- specsfy:evidence {"task":"T052","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002","NFR-003","NFR-004"],"files":[".specsfy/DATABASE.md",".specsfy/STACK.md",".specsfy/RULES.md",".specsfy/USER-PROFILE.md","PROJECT.md","INTERFACE.md","docs/architecture.md","docs/database.md","docs/decisions.md","docs/integrations.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T053 [TEST] [US-001] Executar contrato, regressão, rastreabilidade e verificação final em `apps/web/src/lib/storage/` e `apps/web/src/lib/features/workspace/` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, NFR-004, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021 — Depends: T030, T031, T032, T033, T034, T035, T036, T037, T038, T039, T040, T041, T042, T043, T044, T045, T046, T047, T048, T049, T050, T051, T052
  - [x] **PREP**: Conferir todos os REDs/GREENs, matriz revisada, documentação, checks e comandos seguros.
  - [x] **EXECUTE**: Executar Vitest focal/total, cargo check/test, check, lint e rastreabilidade sem migration destrutiva.
  - [x] **VERIFY**: Confirmar paridade, isolamento, migration idempotente, lifecycle, interface e ausência de gaps dentro do escopo vigente.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nos estados claro/escuro, mobile/desktop, loading, vazio, erro, recovery, sucesso e conteúdo longo; estados cobertos em `INTERFACE.md` e nos testes de componente.
  - [x] **EVIDENCE**: Registrar contagens, comandos, resultados e pendências finais nas seções 11–13.
  - [x] **IMPROVE**: Consolidar ajustes rastreáveis e reservar parser Markdown/PDF para uma spec posterior, sem ampliar esta entrega.
  <!-- specsfy:evidence {"task":"T053","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002","NFR-003","NFR-004","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021"],"files":["apps/web/src/lib/storage","apps/web/src/lib/features/workspace","apps/web/src/lib/features/navigation","apps/desktop/src-tauri/src/database.rs","apps/desktop/src-tauri/migrations/001_create_workspaces.sql","INTERFACE.md",".specsfy/DATABASE.md",".specsfy/STACK.md",".specsfy/RULES.md","docs/architecture.md","docs/database.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts src/lib/features/workspace/native-workspace-states.test.ts src/lib/features/workspace/permission-recovery.spec.ts src/lib/features/workspace/workspace-recovery.test.ts src/lib/features/workspace/workspace-selector.spec.ts src/lib/features/workspace/workspace-settings.spec.ts src/lib/features/workspace/workspace-state.test.ts src/lib/features/workspace/workspace-stats.test.ts src/lib/features/workspace/workspace-switching.test.ts src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/local-storage.test.ts src/lib/storage/migration.test.ts src/lib/storage/persistent-storage.test.ts src/lib/storage/preferences.test.ts src/lib/storage/session.test.ts src/lib/storage/storage-kind.spec.ts src/lib/storage/tauri-bridge.test.ts src/lib/storage/tauri-errors.test.ts src/lib/storage/tauri-storage.test.ts src/lib/storage/workspace-adapter-contract.test.ts src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace-choice.test.ts src/lib/storage/workspace-delete.test.ts src/lib/storage/workspace-errors.test.ts src/lib/storage/workspace-export-source.test.ts src/lib/storage/workspace-lifecycle-contract.test.ts src/lib/storage/workspace-lifecycle.test.ts src/lib/storage/workspace-migration.test.ts src/lib/storage/workspace-persistence-contract.test.ts src/lib/storage/workspace-repository-scope.test.ts src/lib/storage/workspace-repository.test.ts src/lib/storage/workspace-scope.test.ts src/lib/storage/workspace.test.ts","exit":0},{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/completed/0016-multiplos-workspaces-modelo-vaults/spec.md .","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0016-multiplos-workspaces-modelo-vaults/spec.md","exit":0},{"run":"node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/completed/0016-multiplos-workspaces-modelo-vaults/spec.md . --task T053","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Histórico invalidado — arquitetura de filesystem

> As fases abaixo e suas evidências `specsfy:evidence` são mantidas para auditoria da entrega anterior. Não devem ser retomadas sem uma tarefa T030+ que as substitua explicitamente.

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest do AC-001 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001 e confirmar migração idempotente, preservação de arquivos e ausência de onboarding repetido.
  - [x] **EXECUTE**: Escrever o teste Vitest co-localizado com o marcador `SPECSFY: US-001 FR-001 NFR-001 AC-001`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED pela ausência da migração do catálogo.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa somente um teste de persistência.
  - [x] **EVIDENCE**: Registrar o comando, a falha observada (manifesto atual `version: 1`, sem identidade portátil) e os IDs AC-001/US-001/FR-001/NFR-001 nas seções 11–13.
  - [x] **IMPROVE**: Revisar o caso para distinguir no-op idempotente de reescrita do manifesto; a ausência do contrato v2 permanece o gap para GREEN.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest do AC-002 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002 e mapear Tauri, File System Access e OPFS às capabilities declaradas.
  - [x] **EXECUTE**: Escrever o teste de contrato com o marcador `SPECSFY: US-001 FR-001 FR-004 NFR-002 NFR-003 AC-002`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED nos adapters/capabilities ainda ausentes.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa somente um teste de contrato de storage.
  - [x] **EVIDENCE**: Registrar comando, falha observada (manifesto sem `workspaceId`, `formatVersion` e `managedRoot`) e os IDs AC-002/US-001/FR-001/FR-004/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Conferir que o teste não trate OPFS como pasta física e registrar o limite de cada backend.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest de componente do AC-003 em `apps/web/src/lib/features/navigation/app-sidebar.spec.ts` — Refs: US-001, FR-001, FR-004, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003 e confirmar trigger desktop/mobile, ações do seletor, persistência e foco de teclado.
  - [x] **EXECUTE**: Escrever o teste Svelte/Vitest com o marcador `SPECSFY: US-001 FR-001 FR-004 NFR-003 AC-003`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts` e observar RED no seletor ainda não composto.
  - [x] **VISUAL**: Não aplicável: esta tarefa apenas registra o comportamento que a interface deverá provar.
  - [x] **EVIDENCE**: Registrar comando, falha observada (`AppSidebar.svelte` sem `WorkspaceSelector`/ações de gestão) e os IDs AC-003/US-001/FR-001/FR-004/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Revisar o caso para incluir conteúdo longo e operação por teclado sem duplicar regras de domínio.

- [x] T004 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-004 em `apps/web/src/lib/features/workspace/workspace-state.test.ts` — Refs: US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004 e listar notas, Bíblias, preferências, índices e contexto que devem resolver pela raiz ativa.
  - [x] **EXECUTE**: Escrever o teste de isolamento com o marcador `SPECSFY: US-001 US-002 FR-002 NFR-001 NFR-002 AC-004`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts` e observar RED quando um consumidor ainda usa o singleton.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre isolamento de estado sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (`WorkspaceState` sem `workspaceId`/`generation`) e os IDs AC-004/US-001/US-002/FR-002/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Adicionar uma asserção que impeça a raiz A de reaparecer depois da ativação de B.

- [x] T005 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-005 em `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — Refs: US-002, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005 e ordenar flush, persistência, abertura do destino e publicação do ativo.
  - [x] **EXECUTE**: Escrever o teste de barreira com o marcador `SPECSFY: US-002 FR-002 NFR-001 AC-005`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts` e observar RED se B for ativado antes do autosave de A.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre a sequência assíncrona do lifecycle.
  - [x] **EVIDENCE**: Registrar comando, falha observada (lifecycle sem `flushAndSwitch`) e os IDs AC-005/US-002/FR-002/NFR-001 nas seções 11–13.
  - [x] **IMPROVE**: Tornar a asserção determinística com promises controladas, sem depender de temporização real.

- [x] T006 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-006 em `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006 — Depends: T005
  - [x] **PREP**: Ler o Gherkin do AC-006 e definir falha de autosave, permanência de A e as ações retry/discard.
  - [x] **EXECUTE**: Acrescentar o teste com o marcador `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-006`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts` e observar RED se B puder ser aberto após erro sem decisão explícita.
  - [x] **VISUAL**: Não aplicável: o RED é do contrato de estado; o feedback visual será coberto pela fase de interface.
  - [x] **EVIDENCE**: Registrar comando, falha observada (lifecycle sem contrato de erro `AUTOSAVE_FAILED`/retry/discard) e os IDs AC-006/US-002/FR-002/FR-004/NFR-001/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Cobrir retry e descarte como caminhos distintos para evitar uma saída implícita.

- [x] T007 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-007 em `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007 e enumerar permissão revogada, ausência, lock e manifesto inválido como causas distintas.
  - [x] **EXECUTE**: Escrever o teste de recovery com o marcador `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-007`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/native-workspace-states.test.ts` e observar RED se ocorrer fallback silencioso ou remoção do registro.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa estados de recovery sem alterar a interface.
  - [x] **EVIDENCE**: Registrar comando, falha observada (estados `unavailable`/`invalid` ausentes) e os IDs AC-007/US-002/FR-002/FR-004/NFR-001/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Garantir que cada causa preserve a seleção e ofereça uma ação recuperável diferente.

- [x] T008 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-008 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008 — Depends: T001
  - [x] **PREP**: Ler o Gherkin do AC-008 e separar remoção de referência local da preservação física da raiz.
  - [x] **EXECUTE**: Acrescentar o teste com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-008`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se remove também manifesto ou arquivos.
  - [x] **VISUAL**: Não aplicável: esta tarefa verifica somente efeitos no catálogo e filesystem simulado.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `removeWorkspace`) e os IDs AC-008/US-003/FR-003/FR-004/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Adicionar recadastro da mesma raiz como prova de reversibilidade da remoção.

- [x] T009 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-009 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 — Depends: T002
  - [x] **PREP**: Ler o Gherkin do AC-009 e preparar manifesto válido, ownership comprovado, allowlist limpa e ausência de lock.
  - [x] **EXECUTE**: Acrescentar o teste de exclusão segura com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-009`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED se a capability não exigir todos os guardas.
  - [x] **VISUAL**: Não aplicável: a tarefa prova guards de exclusão, não a confirmação visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (adapter sem `deleteManagedRoot`) e os IDs AC-009/US-003/FR-003/FR-004/NFR-001/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Tornar a prova explícita contra apagar qualquer segundo workspace cadastrado.

- [x] T010 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-010 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-010 — Depends: T009
  - [x] **PREP**: Ler o Gherkin do AC-010 e preparar marcador ausente/inválido, arquivo desconhecido, lock e erro de scan.
  - [x] **EXECUTE**: Acrescentar o teste fail-closed com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-010`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED se houver caminho de força ou exclusão inconclusiva.
  - [x] **VISUAL**: Não aplicável: esta tarefa verifica bloqueio de segurança no domínio.
  - [x] **EVIDENCE**: Registrar comando, falha observada (manifesto sem `managedRoot: false`) e os IDs AC-010/US-003/FR-003/FR-004/NFR-001/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Parametrizar as causas sem reduzir a exigência de bloqueio para cada uma.

- [x] T011 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-011 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, AC-011 — Depends: T008
  - [x] **PREP**: Ler o Gherkin do AC-011 e distinguir atualizar localização preservando ID de criar cópia com novo ID.
  - [x] **EXECUTE**: Acrescentar o teste de colisão com o marcador `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-011`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se duas raízes locais mantiverem o mesmo ID.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre unicidade de identidade persistente.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `addExistingWorkspace`) e os IDs AC-011/US-003/FR-003/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Verificar que a cópia grava o novo ID antes do upsert, e não depois de cadastrar.

- [x] T012 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-012 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, AC-012 — Depends: T011
  - [x] **PREP**: Ler o Gherkin do AC-012 e fixar que nome exibido é mutável, enquanto ID, raiz, conteúdo e sync permanecem estáveis.
  - [x] **EXECUTE**: Acrescentar o teste de renomeação com o marcador `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-012`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se renomear caminho físico ou perder identidade.
  - [x] **VISUAL**: Não aplicável: esta tarefa valida manifesto/catalogue sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `renameWorkspace`) e os IDs AC-012/US-003/FR-003/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Incluir nome com espaços extremos e confirmar trim/validação sem alterar o ID.

#### Fase 2 — Fundação e ciclo de vida

- [x] T013 [CODE] [US-001] Implementar manifesto v2, catálogo local e migração idempotente em `apps/web/src/lib/storage/workspace-catalog.ts` — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar os REDs T001–T003, revisar o modelo da seção 9 e carregar `$specsfy-documentator` para reconstruir `docs/` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar a menor fundação de `WorkspaceManifest`, `WorkspaceCatalogEntry`, ponteiro ativo e migração sem mover conteúdo; executar o documentator antes de escrever código.
  - [x] **VERIFY**: Executar os três testes Vitest focalizados e `bun run --cwd apps/web check`; confirmar idempotência, manifesto v2 e catálogo não sincronizável.
  - [x] **VISUAL**: Não aplicável: esta tarefa altera persistência e bootstrap, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e migração exercitada nas seções 11–13.
  - [x] **IMPROVE**: Simplificar a transação de migração para preservar o ponteiro legado em qualquer falha parcial.
  <!-- specsfy:evidence {"task":"T013","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/migration.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts","exit":0}]} -->

- [x] T014 [CODE] [US-001] Adaptar capabilities Tauri, File System Access e OPFS no registro de storage em `apps/web/src/lib/storage/storage-registry.ts` — Refs: US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [x] **PREP**: Confirmar REDs T002/T003/T006, mapear limites de `tauri-storage.ts`, `opfs-storage.ts` e File System Access e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar adapters/capabilities explícitas para create/select/reconnect/writeManifest/scan/delete, executando o documentator antes de alterar o código.
  - [x] **VERIFY**: Executar testes de storage focais, `bun run --cwd apps/web check` e confirmar que capability ausente produz estado explícito, sem fallback.
  - [x] **VISUAL**: Não aplicável: esta tarefa altera adapters de plataforma, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN, backend exercitado e limites de capability nas seções 11–13.
  - [x] **IMPROVE**: Centralizar a seleção de adapter para evitar condicionais de plataforma espalhadas nos casos de uso.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","FR-001","FR-004","NFR-002","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/web/src/lib/storage/opfs-storage.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-002] Implementar troca segura, autosave e generation token em `apps/web/src/lib/storage/workspace-lifecycle.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-004, AC-005, AC-006, AC-007 — Depends: T004, T005, T006, T007
  - [x] **PREP**: Confirmar REDs T004–T007, revisar estados `flushing`/`switching`/`permission-needed` e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar a sequência flush → persist/discard → generation → open → commit guard, executando o documentator antes da implementação.
  - [x] **VERIFY**: Executar testes de lifecycle/state, `bun run --cwd apps/web check` e confirmar que resultados stale não vencem a geração atual.
  - [x] **VISUAL**: Não aplicável: esta tarefa entrega coordenação assíncrona, enquanto estados visuais ficam na fase de interface.
  - [x] **EVIDENCE**: Registrar GREEN, corrida simulada, falha e recuperação nas seções 11–13.
  - [x] **IMPROVE**: Isolar o commit guard em função pura para tornar concorrência e cancelamento auditáveis.
  <!-- specsfy:evidence {"task":"T015","refs":["US-002","FR-002","FR-004","NFR-001","NFR-003","AC-004","AC-005","AC-006","AC-007"],"files":["apps/web/src/lib/storage/workspace-lifecycle.ts","apps/web/src/lib/features/workspace/workspace-state.svelte.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-002] Resetar stores consumidores na ativação por workspace em `apps/web/src/lib/features/workspace/workspace-state.svelte.ts` — Refs: US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 — Depends: T004, T005, T007
  - [x] **PREP**: Confirmar REDs T004/T005/T007, inventariar stores de notas, Bíblia, preferências e índices e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Fazer cada consumidor reinicializar pelo `workspaceId`/generation ativo, executando o documentator antes de alterar estado.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts` e a suíte de stores afetados; confirmar ausência de dados de A em B.
  - [x] **VISUAL**: Não aplicável: esta tarefa ajusta stores consumidores sem nova composição visual.
  - [x] **EVIDENCE**: Registrar GREEN, consumidores resetados e comandos nas seções 11–13.
  - [x] **IMPROVE**: Preferir um evento `WorkspaceActivated` tipado em vez de resets manuais duplicados.
  <!-- specsfy:evidence {"task":"T016","refs":["US-001","US-002","FR-002","NFR-001","NFR-002","AC-004"],"files":["apps/web/src/lib/features/workspace/workspace-state.svelte.ts","apps/web/src/lib/features/notes/notes-state.svelte.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts","exit":0}]} -->

#### Fase de interface

- [x] T017 [CODE] [US-001] Compor o seletor no shell desktop em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, FR-004, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [x] **PREP**: Confirmar REDs T002/T003/T006, ler `AppSidebar.svelte`, `Sidebar.Header` e `DropdownMenu`, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar nome ativo, lista, trocar/criar/adicionar/gerenciar e foco de teclado no desktop; executar o documentator antes da implementação.
  - [x] **VERIFY**: Exercitar menu, ações, loading, vazio, erro, sucesso, teclado e `aria-live` no teste Svelte focal.
  - [x] **VISUAL**: Conferência estática do DOM/fonte em 320px/1440px, claro/escuro: bordas só em tokens (`--border`, raio 8/10px, sem sombra decorativa), espaçamentos/gap e margens/padding (header com gap 10px e padding 18/14/14, trigger com padding-inline 10px e min-height 34px, menu com padding 8/12 e estados), tipografia em escala rem com ellipsis sem overflow (menu máx. `min(320px, 100vw-32px)`), foco visível com `--ring`, alvo 44px no mobile, estados loading/vazio/erro/sucesso com `role=status`/`alert`/`aria-live`, `prefers-reduced-motion` sem transição. Sem render em navegador neste ambiente; revisão de render fica para T018/T029 com Drawer e dialogs.
  - [x] **EVIDENCE**: Registrar telas, estados, foco, comando e resultado em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova nesta composição (só primitivas/convencões existentes); a disciplina de migration do AGENTS.md já é atendida pela fundação (manifesto `formatVersion: 2` + catálogo v1, `ensureManifest`/`migrateLegacyWorkspace` idempotentes) — monitor reconhecido com `--acknowledge-rules-no-change`.
  - [x] **IMPROVE**: Reutilizar primitives existentes e reduzir ruído visual sem esconder o estado textual do ativo.
  <!-- specsfy:evidence {"task":"T017","refs":["US-001","FR-004","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [x] T018 [CODE] [US-001] Reusar o seletor em header/drawer mobile em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, FR-004, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [x] **PREP**: Confirmar REDs T002/T003/T006, ler `AppFrame.svelte` e `Drawer`, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Adaptar a mesma regra de domínio ao trigger mobile, drawer rolável, retorno de foco e alvo de toque; executar o documentator antes da implementação.
  - [x] **VERIFY**: Exercitar 320px, zoom, Escape, foco de retorno, ações e estados com teste Svelte focal sem overflow horizontal.
  - [x] **VISUAL**: Conferência estática em 320px/1440px, claro/escuro: bordas em tokens com raio 10px, espaçamentos (barra mobile com padding e safe-area, drawer com padding 0/16/16+safe-area, lista com gap 2px e padding 4/0/8), margens (ações com margin-top 6px e padding-top 8px sob divisor), padding (itens 10/12, trigger 8/12), tipografia em rem com ellipsis, drawer 90dvh com lista 60dvh rolável sem overflow horizontal, trigger/ itens 44px, Escape e retorno de foco pelo primitive `Drawer`, `menuitemradio` com `aria-checked`, `role=status`/`alert`/`aria-live`, `prefers-reduced-motion`. Sem render em navegador neste ambiente; render final em T029.
  - [x] **EVIDENCE**: Registrar composição mobile, foco, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova (reuso da mesma regra desktop/mobile em componente único); disciplina de migration do AGENTS.md já atendida pela fundação — monitor reconhecido com `--acknowledge-rules-no-change`.
  - [x] **IMPROVE**: Manter um único componente e uma única fonte de ações para impedir divergência desktop/mobile.
  <!-- specsfy:evidence {"task":"T018","refs":["US-001","FR-004","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/workspace/AppFrame.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [x] T019 [CODE] [US-003] Implementar a gestão de workspaces em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008, AC-011, AC-012 — Depends: T008, T011, T012
  - [x] **PREP**: Confirmar REDs T008/T011/T012, ler `ConfigPage.svelte` e os estados da lista, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar lista acessível com ID/nome/status/referência e ações separadas de renomear, reconectar, remover e colisão; executar o documentator antes do código.
  - [x] **VERIFY**: Exercitar validação de nome, atualização de localização, cópia com novo ID, remoção não destrutiva e retorno ao shell.
  - [x] **VISUAL**: Conferência estática em 320px/1440px, claro/escuro: bordas em tokens com raio 12px (linhas) e 10px (campos/botões), espaçamentos (lista com gap 12px, linhas com padding 14px, formulários com gap 8px e padding-top 12px sob divisor), margens (seção com margin-top 28px e padding-top 24px), padding (ações com margin-top 12px), tipografia em rem com ID em Geist Mono com ellipsis, botões 40px e coluna total abaixo de 560px, `aria-current`, erro inline com `role=alert`, confirmações e `aria-live`, foco gerenciado ao cabeçalho após cada ação, `prefers-reduced-motion` herdado. Sem render em navegador neste ambiente; render final em T029.
  - [x] **EVIDENCE**: Registrar ações, estados, foco, comando e arquivos em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova (ações seguem o domínio do catálogo e convenções do ConfigPage); sem mudança de estrutura de persistência — monitor reconhecido com `--acknowledge-rules-no-change`. Limite conhecido: referências locais de raízes não ativas vivem só na sessão (handles/paths por entrada ainda sem persistência dedicada); a remoção preserva arquivos e a raiz pode ser recadastrada.
  - [x] **IMPROVE**: Reaproveitar cabeçalho e primitives de configuração, mantendo ações destrutivas nomeadas e não ambíguas.
  <!-- specsfy:evidence {"task":"T019","refs":["US-003","FR-003","FR-004","NFR-002","NFR-003","AC-008","AC-011","AC-012"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts","exit":0}]} -->

- [x] T020 [CODE] [US-001] Implementar os dialogs de criar e adicionar no fluxo do seletor em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, US-003, FR-001, FR-003, FR-004, NFR-002, NFR-003, AC-002, AC-011 — Depends: T002, T008, T011
  - [x] **PREP**: Confirmar REDs T002/T008/T011, ler Dialog/Input existentes e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar formulário de nome/pasta ou raiz OPFS, validação de trim/capability/colisão e feedback de sucesso/erro; executar o documentator antes do código.
  - [x] **VERIFY**: Exercitar abertura/fechamento, submit, validação inline, loading, colisão e foco por teclado em testes Svelte.
  - [x] **VISUAL**: Conferência estática em 320px/1440px, claro/escuro: bordas em tokens (dialog com raio 12, drawer bottom com raio superior e campos com raio 10), espaçamentos (form com gap 12px, drawer-body com padding e safe-area, colisão com gap 10px e padding 12px), margens (linhas de ação com margin-top 4px), padding (inputs 0/12 a 44px, botões 0/16 a 44px), tipografia em rem com quebra sem overflow (dialog com max-height e scroll, drawer 90dvh com corpo rolável), `Dialog` no desktop e `Drawer` no mobile com o mesmo formulário, erro com `role=alert`, foco no nome ao abrir, Escape/fechar nativos, `prefers-reduced-motion`. Sem render em navegador neste ambiente; render final em T029.
  - [x] **EVIDENCE**: Registrar fluxo, validações, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova; sem mudança de estrutura de persistência além de `localRef` em string no catálogo (caminho nativo/ref OPFS; handles seguem só na sessão) — monitor reconhecido com `--acknowledge-rules-no-change`. Limites: reabertura multi-sessão de raízes nativas/locais não ativas depende da integração de boot (ponteiro+refs); troca de storage do destino na ativação segue pendente de resolução por entrada.
  - [x] **IMPROVE**: Manter criar e adicionar como intenções distintas, compartilhando apenas os campos e o contrato de resultado.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","US-003","FR-001","FR-003","FR-004","NFR-002","NFR-003","AC-002","AC-011"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/components/ui/dialog/dialog.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [x] T021 [CODE] [US-002] Estender recovery de permissão e disponibilidade em `apps/web/src/lib/features/workspace/PermissionRecovery.svelte` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006, AC-007 — Depends: T005, T006, T007
  - [x] **PREP**: Confirmar REDs T005–T007, ler `PermissionRecovery.svelte` e estados de autosave, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Exibir reasonCode acionável e ações retry/reconectar/escolher outro, preservando registro e foco; executar o documentator antes do código.
  - [x] **VERIFY**: Exercitar falha de autosave, permissão, ausência, lock, manifesto inválido, loading, live region, Escape e retorno de foco.
  - [x] **VISUAL**: Conferência estática em 320px/480px/1440px, claro/escuro: bordas em tokens com raio de `--radius`/12px, espaçamentos (página com padding e safe-area, ações com gap 12px e margin-top 32px, lista com gap 10px), margens (seção escolher-outro com margin-top 40px e padding-top 24px), padding (linhas 12/14, botões 0/16 a 40/46px), tipografia em clamp/rem com ellipsis, coluna total abaixo de 480px, `aria-live` do descritor, foco no título e no alvo de recuperação, Escape como ajuda de foco, sem decoração. Sem render em navegador neste ambiente; render final em T029.
  - [x] **EVIDENCE**: Registrar causas, ações, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova; sem mudança de estrutura de persistência — monitor reconhecido com `--acknowledge-rules-no-change`. Inclui ponte de montagem real: `openWorkspaceStorage` (registry) + `activateEntry`/`commitActivation` + boot com montagem do catálogo; seletor e gestão agora trocam ponteiro+storage juntos.
  - [x] **IMPROVE**: Usar mensagens específicas por causa sem introduzir fallback automático ou texto que dependa somente de cor.
  <!-- specsfy:evidence {"task":"T021","refs":["US-002","FR-002","FR-004","NFR-001","NFR-003","AC-006","AC-007"],"files":["apps/web/src/lib/features/workspace/PermissionRecovery.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/native-workspace-states.test.ts","exit":0}]} -->

- [x] T022 [CODE] [US-003] Compor a confirmação destrutiva e bloqueio na gestão em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T008, T009, T010
  - [x] **PREP**: Confirmar REDs T008–T010, ler Dialog/AlertDialog e regras de consequência, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar dialogs distintos para remover e excluir, confirmação forte somente quando guards passam e bloqueio sem “forçar”; executar o documentator antes do código.
  - [x] **VERIFY**: Exercitar manifesto/ownership/scan/lock/capability válidos e inválidos, confirmação/cancelamento, live region e preservação do contexto.
  - [x] **VISUAL**: Conferência estática em 320px/1440px, claro/escuro: bordas em tokens (linhas 12px, dialogs com raio e drawer bottom com safe-area), espaçamentos (lista com gap, dialogs com ações e prévia com gap), margens (seção e blocos de confirmação), padding (linhas, dialogs, campos de confirmação), tipografia em rem com lista de guardas textual (✓/✗ mais texto, nunca só cor), botões 40px+ em coluna total <560px, dialogs `Dialog` no desktop e `Drawer` no mobile com o mesmo corpo, `role=alert` e `aria-live`, foco preso/retornado pelos primitives. Sem render em navegador neste ambiente; render final em T029.
  - [x] **EVIDENCE**: Registrar alcance da confirmação, motivo do bloqueio, comando e resultado em `INTERFACE.md` e nas seções 11–13. Regras: nenhuma regra durável nova; sem mudança de estrutura de persistência — monitor reconhecido com `--acknowledge-rules-no-change`. Refatoração: varredura extraída para `scanWorkspaceRoot` + prévia somente-leitura `previewDeleteGuards`, reutilizadas pela exclusão.
  - [x] **IMPROVE**: Tornar “Remover da lista” e “Excluir workspace” semanticamente independentes no texto, ordem e estilo de ação.
  <!-- specsfy:evidence {"task":"T022","refs":["US-003","FR-003","FR-004","NFR-001","NFR-002","NFR-003","AC-009","AC-010"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/components/ui/dialog/dialog.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

#### Fase final — Segurança, documentação e fechamento

- [x] T023 [CODE] [US-003] Implementar exclusão fail-closed com scan, lock e capability em `apps/web/src/lib/storage/workspace.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T008, T009, T010
  - [x] **PREP**: Confirmar REDs T008–T010, revisar a cadeia readManifest→proveManagedRoot→scan→lock→confirm→delete e carregar `$specsfy-documentator` antes do EXECUTE.
  - [x] **EXECUTE**: Implementar guards fail-closed e bridge seguro, executando o documentator antes de alterar o domínio/bridge.
  - [x] **VERIFY**: Executar testes de segurança/contrato com cada falha injetada e confirmar que não há caminho de force nem exclusão de raiz arbitrária.
  - [x] **VISUAL**: Não aplicável: a barreira de segurança é domínio/bridge; a mensagem de bloqueio é verificada em T022.
  - [x] **EVIDENCE**: Registrar GREEN, guardes, bloqueios e arquivos alterados nas seções 11–13. Cadeia implementada em `workspace-catalog.ts` (fundação T013) com bridge em `tauri-bridge.ts`/`tauri-storage.ts`/`opfs-storage.ts` e comando nativo `delete_managed_workspace` em `workspace.rs`; `workspace.ts` não precisou mudar (só ancora o contrato via `prepareWorkspace`/`loadWorkspaceConfig`). Regras: nenhuma regra durável nova — monitor reconhecido com `--acknowledge-rules-no-change`.
  - [x] **IMPROVE**: Tornar desconhecidos e erros de scan conservadores por default e retornar reasonCode estável à UI.
  <!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-003","NFR-001","NFR-002","NFR-003","AC-009","AC-010"],"files":["apps/web/src/lib/storage/workspace.ts","apps/desktop/src-tauri/src/commands/workspace.rs"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

- [x] T024 [DOC] [US-001] Atualizar o inventário de persistência do catálogo, manifesto e migration em `.specsfy/DATABASE.md` — Refs: US-001, FR-001, FR-003, NFR-001, AC-001, AC-008, AC-009, AC-011 — Depends: T013, T023
  - [x] **PREP**: Conferir os REDs e contratos que alteram store, entidades, campos, relações e migration; delimitar catálogo local versus conteúdo autoral.
  - [x] **EXECUTE**: Registrar entidades, stores, campos, índices, idempotência e retenção em `.specsfy/DATABASE.md`, preservando conteúdo humano.
  - [x] **VERIFY**: Comparar a tabela com `workspace-catalog.ts`, migration, manifesto e testes, sem omitir local/sync boundary.
  - [x] **VISUAL**: Não aplicável: documentação de persistência não cria interface.
  - [x] **EVIDENCE**: Registrar diff, fontes consultadas e comandos nas seções 11–13. Seção nova fora do bloco gerenciado; `cargo check` do backend nativo: `Finished`, exit 0. Sem `[MIGRATION]` versionada: nenhuma estrutura nova de banco — catálogo versionado por `formatVersion`/migração idempotente em código.
  - [x] **IMPROVE**: Explicitar no inventário que o catálogo pode ser reconstruído e não é payload sincronizável.

- [x] T025 [DOC] [US-001] Atualizar o mapa de blocos, estados e consumidores em `INTERFACE.md` — Refs: US-001, US-002, US-003, FR-004, NFR-003, AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T017, T018, T019, T020, T021, T022
  - [x] **PREP**: Conferir todas as tarefas da Fase de interface, `DESIGNSYSTEM.MD`, componentes shadcn-svelte e fluxos desktop/mobile.
  - [x] **EXECUTE**: Documentar finalidade, arquivo, API, estados, consumidores, acessibilidade e regra de reuso de cada bloco alterado em `INTERFACE.md`.
  - [x] **VERIFY**: Confirmar que cada tela da seção 10 possui arquivo, estados, viewport e teste/revisão correspondente.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia documentados para 320px/1440px, claro/escuro e estados de erro/sucesso.
  - [x] **EVIDENCE**: Registrar diff, inventário de componentes e comandos nas seções 11–13. Mapa verificado: seletor desktop (`WorkspaceSelector`+`AppSidebar`, spec GREEN), mobile (`AppFrame`+`Drawer`, estático 320px), gestão (`WorkspaceSettings`, domínio GREEN), dialogs criar/adicionar (domínio GREEN), recovery (`PermissionRecovery`, descritores GREEN), exclusão (domínio GREEN). Regra de seletor único consolidada na linha `WorkspaceSelector`.
  - [x] **IMPROVE**: Consolidar a regra de seletor único desktop/mobile para evitar duas fontes de comportamento.

- [x] T026 [DOC] [US-001] Revisar impacto da feature e capacidades no histórico do produto em `PROJECT.md` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004 — Depends: T013, T015, T019, T023
  - [x] **PREP**: Comparar o resultado implementado com finalidade, limites e capacidades já registradas em `PROJECT.md`.
  - [x] **EXECUTE**: Atualizar somente o contexto material de múltiplos workspaces, Files Over Apps e limites de sincronização em `PROJECT.md`.
  - [x] **VERIFY**: Confirmar que a revisão não transforma catálogo local em conteúdo portátil nem adiciona escopo fora desta spec.
  - [x] **VISUAL**: Não aplicável: revisão do contexto do produto sem superfície visual.
  - [x] **EVIDENCE**: Registrar decisão de impacto material, diff e comandos nas seções 11–13. Impacto material: nova capacidade de vaults + ativo por janela + catálogo local não sincronizável com manifesto portátil; catálogo segue fora do conteúdo portátil e sem escopo além da spec.
  - [x] **IMPROVE**: Remover redundância e manter a narrativa do produto curta, apontando detalhes normativos para a spec.

- [x] T027 [DOC] [US-003] Registrar regras confirmadas de identidade e exclusão em `.specsfy/RULES.md` — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T023
  - [x] **PREP**: Isolar somente convenções duráveis confirmadas: ID único, remoção não destrutiva e exclusão sem force.
  - [x] **EXECUTE**: Acrescentar as regras em `.specsfy/RULES.md` sem apagar ou reescrever conteúdo humano existente.
  - [x] **VERIFY**: Conferir que cada regra tem alcance, fonte e não conflita com capabilities dos adapters.
  - [x] **VISUAL**: Não aplicável: regra de domínio/documentação sem interface.
  - [x] **EVIDENCE**: Registrar diff, fontes e comandos nas seções 11–13. Seção `Workspaces` com unicidade por ID/colisão e remoção não destrutiva vs exclusão fail-closed, via `add_rule.mjs`, sem tocar regras existentes.
  - [x] **IMPROVE**: Usar linguagem operacional verificável e evitar transformar detalhes transitórios de implementação em regra.

- [x] T028 [DOC] [US-001] Atualizar stack e dependências estruturais no inventário em `.specsfy/STACK.md` — Refs: US-001, FR-001, FR-004, NFR-001, AC-001, AC-002 — Depends: T013, T014, T024
  - [x] **PREP**: Conferir alterações de IndexedDB/OPFS, bridge Tauri, Vitest e arquivos estruturais após a implementação.
  - [x] **EXECUTE**: Registrar somente tecnologia/capability estrutural observada em `.specsfy/STACK.md`, preservando blocos humanos.
  - [x] **VERIFY**: Comparar stack com manifests, adapters e comandos de teste reais.
  - [x] **VISUAL**: Não aplicável: inventário técnico sem superfície visual.
  - [x] **EVIDENCE**: Registrar diff, manifestos e comandos nas seções 11–13. Nenhuma dependência nova: bloco gerenciado intacto; nota humana registra reuso (`vaul-svelte`, APIs de plataforma, comando Tauri sem dep nova) com manifests inalterados.
  - [x] **IMPROVE**: Remover dependência ou descrição não evidenciada no código, mantendo o inventário derivado.

- [x] T029 [TEST] [US-001] Executar regressão final, rastreabilidade e verificação de interface em `apps/web/src/lib/features/workspace/workspace-state.test.ts` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028
  - [x] **PREP**: Conferir todos os REDs/GREENs, matriz AC→US/FR/NFR, documentação e comandos de regressão seguros.
  - [x] **EXECUTE**: Executar suíte Vitest, `bun run --cwd apps/web check`, lint e os validadores de rastreabilidade/interface; não executar migrações destrutivas.
  - [x] **VERIFY**: Confirmar todos os 12 ACs, estados, guards, tokens stale, 320px/1440px, teclado, tema e ausência de gaps.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia na revisão final em claro/escuro, mobile/desktop, loading, vazio, erro, sucesso e conteúdo longo.
  - [x] **EVIDENCE**: Registrar contagens, comandos, resultados e pendências finais nas seções 11–13, sem fechar gates nesta etapa.
  - [x] **IMPROVE**: Consolidar achados de regressão e propor apenas ajustes rastreáveis nesta spec ou no backlog.

- [x] T054 [CODE] [US-003] Separar a gestão de workspaces da configuração de armazenamento em abas desktop/mobile de Configurações — Refs: US-003, FR-003, FR-004, NFR-003 — Depends: T048, T051
  - [x] **PREP**: Confirmar que a mudança reorganiza somente a navegação e a composição da UI, preservando catálogo, SQLite nativo no Tauri e IndexedDB no PWA.
  - [x] **EXECUTE**: `ConfigPage.svelte` passou a expor `Armazenamento` e `Workspaces`; `WorkspaceSettings.svelte` passou a receber `view="storage|workspaces"`, mantendo as ações e dialogs de gestão no painel próprio.
  - [x] **VERIFY**: `bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts` — 5 arquivos e 16 testes passaram; `bun run --cwd apps/web build` — exit 0.
  - [x] **VISUAL**: Desktop 1440×900 e mobile 320×900 conferidos no navegador local; abas, índice mobile, foco, conteúdo longo, bordas, espaçamentos, margens, padding, tipografia e ausência de overflow passaram sem erros de console.
  - [x] **EVIDENCE**: Arquivos `apps/web/src/lib/features/config/ConfigPage.svelte`, `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` e `apps/web/src/routes/config.svelte.spec.ts`; separação validada no teste de rota e no build.
  - [x] **IMPROVE**: A prop `view` mantém uma única implementação da gestão e evita duplicar regras entre armazenamento e workspaces.

  <!-- specsfy:evidence {"task":"T054","refs":["US-003","FR-003","FR-004","NFR-003"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts src/lib/features/workspace/t023-backup.svelte.spec.ts src/lib/features/workspace/t025-backup.svelte.spec.ts src/lib/features/workspace/workspace-settings.spec.ts","exit":0,"detail":"5 arquivos; 16 testes"},{"run":"bun run --cwd apps/web build","exit":0}],"status":"GREEN","observation":"Configuração separa Armazenamento e Workspaces em desktop/mobile; a fonte de persistência e as ações de gestão permanecem inalteradas."} -->

### 15. Ordem de execução

- Caminho crítico: T030/T031/T032/T033 → T034 → T039/T040 → T041 → T042/T043 → T044/T045 → T046/T047/T048/T049/T050/T051 → T052 → T053.
- Paralelismo: T030–T033 podem avançar em paralelo; T039 e T040 podem avançar em paralelo após os contratos; T046–T051 são fatias de interface sequenciadas por arquivo/estado; T052 é fechamento documental após todas as superfícies estabilizarem.
- MVP: T030–T043 entregam REDs, schema, adapters, migration, troca, recovery e isolamento; T044–T053 completam lifecycle destrutivo, export-source, seis superfícies de interface, documentação e regressão.
- Critério de avanço: cada AC vigente deve ter seu RED TDD próprio antes do CODE correspondente. O Plan Gate só pode passar após os predecessores T030–T038 estarem concluídos com RED registrado e a validação de tarefas passar.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- BACKLOG-0017 e as specs existentes de onboarding/configuração e Tauri.
- Driver SQLite nativo no Tauri e bridge tipada para schema/transações.
- IndexedDB no PWA, com suporte a versionamento de object stores e blobs.
- Componentes `AppFrame`, `AppSidebar`, `WorkspaceSettings`, `PermissionRecovery`, `DropdownMenu`, `Dialog`, `Drawer` e `Sidebar`.
- Fases posteriores 0017–0021 consumirão o `workspaceId` ativo e o `WorkspaceExportSource`; a spec de notas definirá o parser/exportador Markdown/PDF e a spec de sync definirá como Automerge observa o conteúdo.

#### Riscos

- Dois adapters divergirem → contrato de testes compartilhado, erros tipados e paridade obrigatória antes do Plan Gate.
- Schema SQLite/IndexedDB ficar incompatível → migrations versionadas, transacionais e recovery explícito.
- Dados legados serem apagados cedo demais → fonte somente-leitura e retenção até confirmação da migração.
- Persistência por banco perder o isolamento → `workspaceId` obrigatório em queries/repositórios e testes de vazamento.
- Race entre troca e abertura assíncrona → generation token e commit guard obrigatório.
- Migração parcial corromper bootstrap → operação idempotente, escrita transacional e ponteiro anterior preservado.
- Usuário confundir remover com excluir → ações separadas, texto de consequência e confirmação forte.
- Exportação virar fonte paralela → `WorkspaceExportSource` somente-leitura e parser/exportador fora da transação primária.

#### Suposições

- Existe um único workspace ativo por janela/sessão; concorrência entre janelas e locks de banco serão tratados pelos adapters.
- O Tauri possui acesso ao SQLite nativo; o PWA possui IndexedDB disponível e pode armazenar blobs.
- A Bíblia SQLite permanece um recurso consultável por WASM no PWA; não é requisito convertê-la para IndexedDB nesta fatia.
- A futura sincronização tratará documentos/conteúdo pelo contrato próprio, não o banco bruto, paths ou handles.
- Markdown e PDF serão gerados por parser/exportadores posteriores e não substituem a fonte persistida.

### 17. Decisões

- **DEC-001**: usar SQLite nativo no Tauri e IndexedDB no PWA como backends operacionais, atrás de um contrato comum — reduz a divergência entre runtimes sem exigir SQLite WASM para o banco do PWA.
- **DEC-002**: tratar filesystem, OPFS, FSA e manifestos existentes como fontes legadas de importação — preserva compatibilidade sem manter três arquiteturas ativas.
- **DEC-003**: manter exatamente um ativo e exigir barreira de flush/commit — impede mistura de workspaces e perda de alterações durante troca.
- **DEC-004**: introduzir token de geração em operações assíncronas — impede resultado stale de uma abertura antiga sobrescrever a seleção nova.
- **DEC-005**: separar remover da lista de excluir workspace — oferece reversibilidade cotidiana e destruição explícita dos registros escopados.
- **DEC-006**: executar exclusão por transação e sem “forçar” — evita exclusão parcial ou de outro workspace.
- **DEC-007**: manter nome editável separado da identidade — o nome muda no banco sem alterar `workspaceId` nem fonte legada.
- **DEC-008**: não aplicar DataGrid/breadcrumb de equipe — a gestão é configuração de vault no shell existente, não CRUD de equipe; preservar a regra de ID e acessibilidade sem inventar semântica.
- **DEC-009**: manter a Bíblia SQLite como recurso consultável por SQLite WASM no PWA — evita importar um banco de leitura estável para linhas duplicadas no IndexedDB.
- **DEC-010**: tratar Markdown e PDF como exportações — o parser/exportador será definido na spec de notas, consumindo snapshot do workspace sem mudar a fonte.
- **DEC-011**: usar um banco por instalação/origem, não um banco operacional por workspace — `app.sqlite` no Tauri e um IndexedDB no PWA centralizam schema, ponteiro e dados, enquanto `workspaceId` fornece o isolamento obrigatório.

#### Registro literal da mudança

**Pedido preservado:** “Markdown vai ser a forma de exportação das notas, tanto Markdown como PDF; vamos precisar desse parser para gerar o Markdown compatível; atualiza o spec; podemos começar com o workspace e depois seguir com os outros.”

**Classificação:** mudança de comportamento, dados, fronteira de persistência e plano. **Impacto:** reabre Ato I, invalida gates e tarefas da arquitetura anterior e cria dependência explícita para a futura spec de notas/exportação.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed` após a revisão de 2026-09-06.
- [x] `Plan Gate` está `Passed` após T030–T038 serem materializadas com RED válido e o plano T030–T053 ser validado.
- [x] `Delivery Gate` está `Passed`; a implementação da arquitetura revisada foi concluída e verificada.
- [x] Os cenários AC-013–AC-021 passam nos adapters SQLite e IndexedDB.
- [x] Todos os requisitos FR/NFR revisados possuem evidência de verificação.
- [x] Todas as tarefas vigentes da seção 14 estão concluídas.
- [x] Testes, checks estáticos, migrações e documentação da arquitetura revisada passam; o baseline global documentado permanece fora da fatia.
- [x] O contrato `WorkspaceExportSource` está pronto para a spec de parser/exportação Markdown/PDF, sem implementar essa exportação nesta fatia.

Estado desta fase: Complete. Definition, Plan e Delivery Gate estão Passed.
