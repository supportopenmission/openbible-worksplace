# Especificação integrada: Onboarding de configuração e armazenamento

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0001 |
| Slug | 0001-onboarding-configuracao-armazenamento |
| Status | Implementing |
| Effort | 7 |
| Effort updated at | 2026-09-01 |
| Effort rationale | A feature inicial combina uma jornada modal, duas APIs de armazenamento do navegador, persistência do handle local e cópia de arquivos com falhas parciais. |
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

O OpenBible ainda é um starter sem rota de produto, configuração de armazenamento ou orientação inicial. A pessoa não consegue preparar a pasta de dados nem importar Bíblias antes de começar a usar o projeto.

#### Resultado desejado

A pessoa conclui um onboarding modal na aplicação web, configura a estrutura Files over app na pasta escolhida em localhost ou no OPFS em PWA/hospedado, vê o progresso e importa Bíblias SQLite agora ou deixa essa etapa pendente para continuar em `/`.

#### Métricas de sucesso

- Em uma execução bem-sucedida, 100% dos diretórios e artefatos declarados ficam presentes no armazenamento selecionado e cada operação assíncrona produz estado visual de progresso ou erro.
- Em uma reabertura após configuração válida, 0 modal de onboarding é exibido automaticamente e a rota `/` é disponibilizada diretamente.
- Em um lote misto de importação, 100% dos arquivos SQLite válidos e não duplicados são copiados e 100% dos arquivos rejeitados recebem motivo visível, sem sobrescrita.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo foi executado; as decisões desta spec vêm da conversa, da Inbox, do backlog e das fontes locais do repositório.

#### Fontes e contexto consultados

- `specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md` — formulação original e sinais de escopo.
- `specs/backlog/0001-onboarding-configuracao-armazenamento.md` — refinamento e decisões confirmadas.
- `PROJECT.md` — finalidade, usuário individual, plataforma e limites.
- `DESIGNSYSTEM.MD` — princípios de interface, estados, foco e responsividade.
- `INTERFACE.md` — base Svelte e ausência de componentes de produto existentes.
- `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` — stack, regras e informações persistentes confirmadas.
- `apps/web/src/routes/+page.svelte`, `apps/web/src/routes/page.svelte.spec.ts` e manifests — tela e testes do starter que serão substituídos/estendidos.

#### Documentação consultada

- Documentação local do Specsfy e templates da spec — formato, rastreabilidade, TDD e gates.
- APIs nativas de navegador serão usadas como contratos locais isolados; nenhuma documentação externa foi copiada ou usada como fonte normativa nesta definição.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo; não houve consulta externa que exigisse cópia em `research/`.

#### Dúvidas respondidas

- **Q1: plataforma da primeira entrega** → **A:** somente `apps/web`; localhost usa seleção de diretório via File System Access API e PWA/hospedado usa OPFS; Tauri fica para depois.
- **Q2: artefatos iniciais** → **A:** `config.json` e `sync.json` com JSON mínimo; `index.sqlite` vazio, sem schema funcional nesta feature.
- **Q3: arquivos inválidos, duplicados e falhas** → **A:** validar por arquivo, rejeitar inválidos e duplicados sem sobrescrever, mostrar o motivo e continuar com os válidos; falha parcial fica visível.
- **Q4: memória da configuração** → **A:** lembrar o armazenamento, abrir diretamente `/` e manter Bíblias pendentes até importação concluída ou parcial.
- **Q5: raiz local** → **A:** a pasta escolhida já é a raiz do workspace; não criar uma subpasta `OpenBible` adicional.
- **Q6: templates** → **A:** criar `sermon.md`, `study.md` e `note.md` com frontmatter mínimo (`title`, `createdAt`, `updatedAt`, `type`) e corpo inicial curto.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante para a primeira entrega. Schema funcional de `index.sqlite`, integração Tauri, limites artificiais de tamanho e sincronização remota permanecem fora do escopo.

### 3. Escopo e atores

#### Incluído

- Onboarding modal na rota `/` de `apps/web`.
- Detecção do modo local e PWA/hospedado conforme ambiente web.
- Escolha da pasta raiz em localhost com `showDirectoryPicker`.
- Criação idempotente de `.openbible/`, diretórios de conteúdo, templates e `trash`.
- Escrita dos JSON mínimos e criação do arquivo `index.sqlite` vazio.
- Barra de progresso, estados de sucesso, erro e recuperação.
- Seleção múltipla e arrastar/soltar de arquivos SQLite para `bibles/`.
- Validação da assinatura SQLite, rejeição individual de inválidos/duplicados e continuidade dos válidos.
- Persistência da configuração e do status de importação, incluindo o status pendente.

#### Fora de escopo

- Integração ou empacotamento Tauri.
- Schema funcional, consultas, índices ou abertura do `index.sqlite`.
- Leitor da Bíblia, biblioteca de estudos, editor de sermões e notas.
- Download de Bíblias por URL ou sincronização remota.
- Autenticação, contas, colaboração, telemetria ou envio dos arquivos para servidor.
- Reconfiguração, remoção ou migração de um workspace já configurado.

#### Atores

- **Pessoa usuária individual**: escolhe o armazenamento, confirma a criação, importa arquivos e decide continuar sem Bíblias.
- **Aplicação web**: detecta o ambiente, cria/atualiza os artefatos locais, mostra estados e navega para `/`.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte e Vitest; não introduzir React, shadcn/ui ou ReUI.
- **PR-002**: manter Files over app: Markdown é fonte primária futura e SQLite é auxiliar; o onboarding somente prepara os artefatos.
- **PR-003**: não enviar conteúdo nem caminho de arquivos para servidor; a operação ocorre no armazenamento escolhido pela pessoa.
- **PR-004**: operações repetidas são idempotentes e preservam arquivos existentes, salvo novos arquivos de importação que não tenham conflito.
- **PR-005**: o modal deve manter foco visível, nomes acessíveis, estados anunciáveis e uso por teclado, sem depender somente de cor ou ícone.

### 5. Histórias de usuário

#### US-001 — Preparar meu espaço de trabalho (P1)

Como pessoa usuária individual, quero configurar o armazenamento do OpenBible em uma pasta local ou no OPFS, para começar com uma estrutura de arquivos previsível e não repetir o onboarding.

**Por que P1**: sem o workspace configurado, nenhuma capacidade futura de estudo, sermão, nota ou Bíblia tem onde persistir seus dados.
**Teste independente**: executar os cenários de configuração com um adaptador de armazenamento em memória e uma renderização do modal, comprovando a árvore, os artefatos, o progresso e o retorno a `/`.
**Requisitos**: FR-001, FR-002, FR-003, FR-005

#### US-002 — Importar Bíblias ou continuar depois (P1)

Como pessoa usuária individual, quero importar uma ou mais Bíblias SQLite por seleção ou arrastar/soltar, ou deixar a importação pendente, para começar com os textos disponíveis sem bloquear a entrada no projeto.

**Por que P1**: a Bíblia é uma fonte de conteúdo central, mas a pessoa precisa conseguir abrir o projeto mesmo sem tê-la importado.
**Teste independente**: enviar arquivos SQLite válidos, inválidos e duplicados ao componente e ao serviço, verificando cópia, motivos, status parcial e opção de continuar.
**Requisitos**: FR-003, FR-004, FR-005

### 6. Cenários BDD de aceite

#### AC-001 — Configuração local concluída

**Cobre**: US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-003 @FR-005 @NFR-001 @NFR-002 @AC-001
Feature: Configurar o workspace do OpenBible

  Scenario: Criar a estrutura na pasta escolhida em localhost
    Given que a pessoa está em localhost e ainda não possui configuração reconhecida
    When avança pelo modal, escolhe uma pasta raiz e confirma a instalação
    Then a aplicação cria a estrutura Files over app nessa pasta
    And mostra progresso durante a criação
    And registra a configuração para a próxima visita
```

#### AC-002 — Configuração em PWA

**Cobre**: US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-003 @FR-005 @NFR-001 @NFR-002 @AC-002
Feature: Configurar o workspace do OpenBible

  Scenario: Criar a estrutura no OPFS
    Given que a pessoa está em ambiente PWA ou hospedado e ainda não possui configuração reconhecida
    When confirma a instalação no modal
    Then a aplicação cria a mesma estrutura na raiz OPFS da origem
    And não solicita uma pasta do sistema
    And informa o progresso da operação
```

#### AC-003 — Seleção local cancelada ou indisponível

**Cobre**: US-001, FR-001, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-005 @NFR-001 @NFR-002 @AC-003
Feature: Recuperar falhas de configuração

  Scenario: Manter o onboarding quando a pasta não pode ser escolhida
    Given que localhost não oferece a API necessária ou a pessoa cancela/nega a permissão
    When tenta confirmar a configuração local
    Then a aplicação mostra uma mensagem de erro próxima da ação
    And preserva o modal para nova tentativa
    And não registra a configuração como concluída
```

#### AC-004 — Importação adiada

**Cobre**: US-002, FR-003, FR-004, FR-005, NFR-001, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @FR-005 @NFR-001 @NFR-002 @AC-004
Feature: Importar Bíblias no onboarding

  Scenario: Continuar sem importar agora
    Given que a estrutura do workspace foi criada
    When a pessoa escolhe fazer a importação de Bíblias depois
    Then a aplicação grava o status de importação como pendente
    And segue para a rota `/`
    And não impede a abertura do projeto
```

#### AC-005 — Importação de SQLite válido

**Cobre**: US-002, FR-004, FR-005, NFR-001, NFR-002

```gherkin
@US-002 @FR-004 @FR-005 @NFR-001 @NFR-002 @AC-005
Feature: Importar Bíblias no onboarding

  Scenario: Copiar uma Bíblia válida por seleção ou arrastar/soltar
    Given que a estrutura do workspace foi criada e um arquivo SQLite válido foi escolhido
    When a pessoa envia o arquivo pelo diálogo ou pela área de arrastar/soltar
    Then a aplicação copia o arquivo com seu nome para `bibles/`
    And mostra o resultado da cópia
    And atualiza o status da importação
```

#### AC-006 — Lote com inválidos e duplicados

**Cobre**: US-002, FR-004, FR-005, NFR-001, NFR-002

```gherkin
@US-002 @FR-004 @FR-005 @NFR-001 @NFR-002 @AC-006
Feature: Importar Bíblias no onboarding

  Scenario: Continuar o lote sem sobrescrever arquivos
    Given que o lote contém um SQLite válido, um arquivo sem assinatura SQLite e um nome já existente em `bibles/`
    When a pessoa envia o lote
    Then a aplicação copia somente o SQLite válido sem conflito
    And rejeita os demais individualmente com seus motivos
    And preserva o arquivo já existente
    And informa que o resultado foi parcial
```

#### AC-007 — Retorno após configuração

**Cobre**: US-001, US-002, FR-003, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-003 @FR-005 @NFR-001 @NFR-002 @AC-007
Feature: Reabrir um workspace configurado

  Scenario: Não repetir o onboarding
    Given que a configuração foi concluída e está registrada no armazenamento local
    When a pessoa abre a aplicação novamente
    Then a aplicação reconhece o workspace
    And não mostra o onboarding automaticamente
    And disponibiliza `/` com o status de Bíblias correspondente
```

#### AC-008 — Reexecução idempotente

**Cobre**: US-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-008
Feature: Reexecutar a configuração do OpenBible

  Scenario: Preservar arquivos existentes na estrutura
    Given que a raiz já contém parte da estrutura e um arquivo criado pela pessoa
    When a operação de preparação é executada novamente
    Then os diretórios e artefatos ausentes são criados
    And o arquivo existente da pessoa não é substituído
    And a configuração continua consistente
```

#### AC-009 — Progresso e acessibilidade

**Cobre**: US-001, US-002, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-005 @NFR-001 @NFR-002 @AC-009
Feature: Acompanhar o onboarding

  Scenario: Usar o modal durante uma operação assíncrona
    Given que a criação ou importação está em andamento
    When a pessoa navega pelo modal usando teclado
    Then encontra foco visível e uma descrição associada ao estado atual
    And a barra informa valor atual e total
    And ações incompatíveis ficam desabilitadas até a operação terminar
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve selecionar o backend de armazenamento da aplicação web: File System Access API em localhost e OPFS em PWA/hospedado; se localhost não suportar a API ou a permissão for negada, deve informar o erro e permitir nova tentativa.
- **FR-002**: O sistema deve criar de forma idempotente a árvore `.openbible/`, `bibles/`, `notes/theology/`, `notes/studies/`, `sermons/drafts/`, `sermons/preached/`, `sermons/series/`, `studies/characters/`, `studies/themes/`, `studies/books/`, `templates/`, `attachments/images/`, `attachments/audio/`, `attachments/pdf/`, `attachments/files/` e `trash/`, além de `config.json`, `sync.json`, `index.sqlite`, `templates/sermon.md`, `templates/study.md` e `templates/note.md`.
- **FR-003**: O sistema deve salvar a configuração mínima com versão, backend, momento de configuração e status de importação (`pending`, `complete` ou `partial`), persistir a referência necessária para reencontrar o workspace local e não exibir o onboarding novamente quando a configuração puder ser lida.
- **FR-004**: O sistema deve aceitar múltiplos arquivos com extensão `.sqlite` por diálogo ou arrastar/soltar, validar a assinatura `SQLite format 3\0`, copiar somente arquivos válidos sem nome já existente para `bibles/`, preservar arquivos existentes e produzir resultado individual por arquivo.
- **FR-005**: O sistema deve exibir as etapas de informação inicial, escolha/confirmação, criação, importação e conclusão, com progresso durante criação/importação, mensagens de erro recuperáveis, opção de fazer a importação depois e navegação para `/` após a conclusão ou adiamento.

#### Não funcionais

- **NFR-001**: O onboarding deve ser operável por teclado, ter foco visível e ordem coerente, nomes acessíveis para controles, mensagens associadas aos erros e `aria-valuenow`/`aria-valuemax` na barra; a composição deve se adaptar sem overflow horizontal em viewport de 320px a 1440px. **Verificação**: testes browser e inspeção visual nos viewports 320px e 1440px.
- **NFR-002**: Nenhuma operação de configuração ou importação deve fazer requisição de rede com conteúdo de arquivos; cada operação assíncrona deve manter o feedback de estado até sucesso ou erro e continuar após rejeições individuais de lote. **Verificação**: testes unitários dos adaptadores, teste browser com APIs de rede observadas e inspeção do fluxo de estados.

#### Erros e casos-limite

- Diálogo local cancelado ou permissão negada → manter o passo local aberto, mostrar erro acionável e não gravar configuração concluída.
- File System Access API ausente em localhost → mostrar incompatibilidade e orientar tentativa em navegador compatível; não trocar silenciosamente para OPFS.
- Falha ao criar qualquer diretório/arquivo → interromper a instalação, preservar o que já foi criado, mostrar a etapa/erro e permitir tentar novamente de forma idempotente.
- Arquivo sem extensão `.sqlite` ou sem assinatura SQLite → rejeitar individualmente e informar o motivo.
- Nome já presente em `bibles/` → rejeitar individualmente como duplicado e não substituir o destino.
- Falha de cópia de um arquivo → manter os demais resultados, marcar `partial` quando houver sucesso e exibir a falha.
- Nenhuma Bíblia importada → manter `pending` e permitir acesso ao projeto.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- O monorepo usa Bun 1.4.0, SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7.0.2, Vite 8.2.1 e Vitest 4.1.10. `apps/web` contém somente a página starter e testes browser; `packages/ui` contém apenas `CounterView`. Não há roteamento de produto, shadcn-svelte configurado, persistência ou Tauri.

#### Arquitetura e módulos

- `apps/web/src/lib/storage/types.ts`: contratos `WorkspaceStorage`, `StorageKind`, progresso, resultados de instalação/importação e configuração persistida.
- `apps/web/src/lib/storage/workspace.ts`: caso de uso que prepara a árvore, grava artefatos mínimos, atualiza status, valida SQLite e importa arquivos por adaptador.
- `apps/web/src/lib/storage/opfs-storage.ts`: adaptador OPFS usando `navigator.storage.getDirectory()` e APIs de diretório/arquivo.
- `apps/web/src/lib/storage/local-storage.ts`: adaptador localhost usando `showDirectoryPicker({ mode: 'readwrite' })` e armazenamento do `FileSystemDirectoryHandle` em IndexedDB para reencontro local.
- `apps/web/src/lib/storage/environment.ts`: seleção explícita entre localhost e PWA/hospedado, sem fallback silencioso de localhost para OPFS.
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte`: modal e estados da jornada, incluindo foco, progresso, importação e navegação.
- `apps/web/src/lib/features/onboarding/onboarding-copy.ts`: textos e metadados dos passos para manter a página coordenadora simples.
- `apps/web/src/routes/+page.svelte`: carrega o estado inicial, compõe o modal enquanto necessário e renderiza a superfície mínima do projeto após configuração.

#### Migrations

- Não aplicável. Não há banco de aplicação nem schema funcional nesta entrega; `index.sqlite` é criado como arquivo vazio reservado.

#### Models

- Não há model de domínio persistido. `WorkspaceConfig` e `ImportResult` são tipos TypeScript de contrato em `apps/web/src/lib/storage/types.ts`; a invariável é que o status só seja `pending`, `complete` ou `partial` e que um destino existente nunca seja sobrescrito.

#### Controllers e casos de uso

- `prepareWorkspace(storage, onProgress)`: cria a árvore, escreve JSON/templates e cria `index.sqlite`, sem apagar conteúdo existente.
- `importBibleFiles(storage, files, onProgress)`: valida, evita conflito, copia e acumula resultados por arquivo; o componente fornece seleção ou drag-and-drop.
- `loadWorkspaceConfig(storage)`: lê a configuração e decide se o onboarding pode ser omitido.
- Não há controller HTTP, autenticação ou API de servidor.

#### Views e experiência

- `OnboardingModal.svelte`: cinco estados operacionais, `intro`, `storage`, `installing`, `import` e `complete`, com `error` associado a qualquer etapa. Em localhost mostra ação de escolher pasta; em PWA mostra que OPFS será usado. A importação tem input múltiplo e área de drop.
- `/` mostra a superfície inicial do projeto após o onboarding, o status de Bíblias e uma ação para importação posterior quando aplicável.

#### Queries e repositórios

- Não há queries SQL. `local-storage.ts` usa um pequeno repositório IndexedDB somente para o handle do diretório local; `opfs-storage.ts` consulta arquivos por caminho relativo. Os arquivos Markdown/SQLite são a fonte física futura e não são indexados nesta feature.

#### Jobs e processamento assíncrono

- Não aplicável como job remoto. Criação e cópia são operações assíncronas no cliente; cada etapa atualiza progresso, não usa retry automático destrutivo e pode ser repetida idempotentemente pelo usuário.

#### Estrutura de arquivos

```text
apps/web/src/
  lib/storage/
    types.ts
    environment.ts
    opfs-storage.ts
    local-storage.ts
    workspace.ts
    workspace.test.ts
  lib/features/onboarding/
    OnboardingModal.svelte
    onboarding-copy.ts
  routes/
    +page.svelte
    onboarding.svelte.spec.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| WorkspaceConfig | arquivo `.openbible/config.json` na raiz do workspace | `version: 1`, `storage: "local" | "opfs"`, `configuredAt`, `bibleImportStatus: "pending" | "complete" | "partial"`; um workspace ativo por origem/perfil local | relaciona-se aos arquivos da raiz e aos SQLite em `bibles/` |
| SyncConfig | arquivo `.openbible/sync.json` | `version: 1`, `enabled: false`, `lastSyncAt: null`; não inicia sincronização | pertence ao WorkspaceConfig |
| BibleFile | arquivo em `bibles/<nome>.sqlite` | nome base preservado, assinatura SQLite válida, não substituir destino existente | vários BibleFile pertencem a um WorkspaceConfig |
| LocalWorkspaceHandle | registro IndexedDB local | handle serializado da pasta escolhida, sem conteúdo dos arquivos; usado apenas para reencontrar a raiz local | aponta para um WorkspaceConfig local |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| WorkspaceConfig | ausente | instalação concluída | configurado | todos os artefatos mínimos foram tentados e `config.json` foi gravado |
| WorkspaceConfig | configurado | nenhum SQLite importado | pending | `/` continua acessível |
| WorkspaceConfig | pending | importação com todos os arquivos válidos | complete | nenhum destino existente foi sobrescrito |
| WorkspaceConfig | pending | importação com sucesso e rejeições/falhas | partial | resultados individuais permanecem visíveis |
| WorkspaceConfig | complete/partial | nova importação | complete ou partial | duplicados continuam rejeitados |

#### Migração e retenção

- Não há migração de schema. `config.json`, `sync.json`, o handle local e os status permanecem até uma futura reconfiguração definida; nenhum arquivo de conteúdo é removido por esta feature.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A pessoa precisa entender o armazenamento, confirmar a criação, acompanhar progresso, importar arquivos e escolher continuar sem Bíblias.

#### Stack e convenções de interface

- A interface usa SvelteKit/Svelte em `apps/web`, TypeScript, CSS local da composição e Vitest Browser Mode com Playwright. A página atual é um starter e não possui shell, breadcrumb, modal ou primitive reutilizável; a feature criará um componente Svelte de domínio sem introduzir biblioteca de UI não configurada. A orientação macro vem de `DESIGNSYSTEM.MD` e o registro de blocos será atualizado em `INTERFACE.md`.

#### Telas e responsabilidades

- **Onboarding na rota `/`**: pessoa individual; entender o produto, configurar o armazenamento, acompanhar criação, importar ou adiar Bíblias; entrada é o estado local do workspace e saída é configuração persistida e navegação para o projeto.
- **Superfície inicial de `/`**: pessoa individual; receber o projeto após o onboarding e ver se Bíblias estão pendentes, completas ou parciais.

#### Fluxo de informação e navegação

- A pessoa chega diretamente à rota `/`. A aplicação carrega a configuração de OPFS ou o handle local; se não encontrar configuração válida, abre o modal. O modal segue `intro → storage → installing → import → complete`; erro retorna ao passo correspondente preservando a seleção. Ao importar ou adiar, a pessoa chega à superfície inicial de `/`.
- Não há equipe, conta ou shell autenticado no MVP. O breadcrumb global não é aplicável ao modal técnico da primeira rota, pois não existe equipe/módulo do produto implementado; a superfície inicial deve usar o título `OpenBible` e o estado do workspace como contexto.

#### Menus e navegação principal

- Não há menu de produto nesta base inicial. O onboarding é acessado automaticamente por `/` e a conclusão/adiamento retorna à própria `/`; isso é suficiente porque não existe outra tela recorrente implementada. Uma futura tela de biblioteca deverá registrar seu menu quando for criada.

#### Formulários e ações

- **Intro**: texto informativo e ação primária `Começar`.
- **Storage local**: ação `Escolher pasta`, estado da pasta selecionada e ação `Configurar armazenamento`; a pasta é obrigatória em localhost. Em PWA, exibir backend OPFS e ação `Configurar armazenamento` sem input de pasta.
- **Installing**: sem campos editáveis; progresso determinado pela quantidade de operações concluídas, ações desabilitadas durante escrita.
- **Import**: input `multiple` com accept `.sqlite`, dropzone acionável por teclado, ação `Importar Bíblias` e ação secundária `Fazer depois`; arquivo inválido/duplicado aparece no resultado individual.
- **Complete**: resumo da estrutura/status e ação `Ir para o projeto`.
- O padrão é um modal centrado com overlay; não há fechamento silencioso antes da configuração. Cancelar o diálogo de pasta mantém a pessoa no mesmo passo e não cria falso sucesso.

#### Composição e disposição

- Superfície clara e compacta, largura máxima de 640px, overlay neutro, cabeçalho com etapa atual, corpo com uma pergunta por vez e rodapé com ações alinhadas. A barra de progresso fica próxima do texto da operação. Em 320px, os botões ocupam largura confortável e o conteúdo rola verticalmente sem overflow horizontal; em 1440px, o modal permanece focado sem esticar.
- A hierarquia usa título da etapa, explicação curta, estado atual, área de ação e feedback. As bordas, espaçamentos, margens, padding e tipografia serão conferidos contra os defaults de `DESIGNSYSTEM.MD` durante a tarefa visual.

#### Blocos React e componentes selecionados

| Tela | Bloco Svelte | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding | `OnboardingModal` | Orquestrar estados, foco e ações | `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` | Modal de domínio com `<dialog>`/overlay acessível | Próprio | Novo porque não há modal existente; poderá ser estendido por futuras jornadas de inicialização |
| Onboarding | `ProgressIndicator` | Mostrar etapa, valor atual e total | dentro de `OnboardingModal.svelte` | `<progress>` nativo com texto associado | Plataforma web | Interno até existir segundo consumidor |
| Onboarding | `BibleDropzone` | Selecionar e arrastar arquivos | dentro de `OnboardingModal.svelte` | input file + dropzone sem dependência | Próprio | Interno à importação até haver upload reutilizável |
| Projeto `/` | `ProjectHome` | Mostrar destino e status de Bíblias | `apps/web/src/routes/+page.svelte` | Composição Svelte de estado inicial | Próprio | Superfície mínima desta feature; futura biblioteca poderá estender |

- Não há componentes shadcn-svelte disponíveis para reaproveitar; a escolha por elementos nativos reduz dependências e mantém acessibilidade explícita.
- React, shadcn/ui e ReUI não se aplicam a esta app Svelte; a tabela acima registra os blocos Svelte reais que substituem essa composição.

#### Estados e acessibilidade

- Estados: carregando configuração, intro vazia, seleção sem pasta, pasta selecionada, instalação em progresso, importação vazia, importação em progresso, sucesso completo, sucesso parcial, erro recuperável e projeto configurado.
- O modal terá `role="dialog"`, `aria-modal="true"`, título associado, foco inicial no heading/ação principal, retorno de foco após conclusão e bloqueio de ações incompatíveis enquanto grava. Erros usarão região `aria-live`, labels visíveis e descrição do campo/dropzone. A dropzone também abrirá o diálogo ao receber Enter/Espaço.
- A cor será acompanhada por texto de estado; a barra terá valor textual e semântica nativa. O layout respeitará `prefers-reduced-motion` e não dependerá de animação.

#### Contrato CRUD

- Não aplicável. O onboarding prepara um workspace e importa arquivos; não administra registros CRUD. Não há `PageHeader`, `DataGrid`, coluna `ID`, ações de editar ou apagar nesta entrega; esses padrões ficam reservados para futuras telas CRUD.

#### Revisão visual durante o desenvolvimento

- A revisão será feita no browser com Playwright/Vitest Browser Mode e inspeção manual/renderizada em 320px e 1440px, percorrendo intro, seleção, progresso, erro, importação vazia, resultado parcial e conclusão. Serão conferidos bordas, espaçamentos, margens, padding, tipografia, foco, zoom, overflow e quebra de texto.

#### APIs expostas

- Não há endpoint HTTP. O contrato é a rota `/` e eventos internos do componente: escolha de pasta, confirmação, progresso, seleção/drop, importação, adiamento e navegação.

#### APIs externas utilizadas

- Nenhuma API de serviço externo. APIs nativas do navegador: File System Access API em localhost, OPFS, File/Blob, drag-and-drop e IndexedDB local para o handle; não usam autenticação, timeout de rede ou retry remoto.

#### Documentação das APIs consultadas

- Nenhuma documentação externa foi consultada nesta etapa; os contratos serão encapsulados nos adaptadores e verificados por testes unitários/browser com doubles controlados.

#### Eventos e outros contratos

- `WorkspaceConfig` em `.openbible/config.json`: `{ "version": 1, "storage": "local" | "opfs", "configuredAt": string, "bibleImportStatus": "pending" | "complete" | "partial" }`.
- `SyncConfig` em `.openbible/sync.json`: `{ "version": 1, "enabled": false, "lastSyncAt": null }`.
- Templates: frontmatter YAML mínimo com `title`, `createdAt`, `updatedAt` e `type`, seguido de corpo inicial curto.
- Resultado de importação: `{ name, status: "imported" | "rejected", reason?: "invalid-sqlite" | "duplicate" | "copy-failed" }[]`.

### 11. Estratégia TDD

- **Unidade**: `workspace.ts` para árvore, artefatos, idempotência, validação de assinatura e estados; `environment.ts` para seleção de backend.
- **Integração/contrato**: adaptadores OPFS/local com fakes de `FileSystemDirectoryHandle` e IndexedDB; nenhum servidor participa.
- **BDD/aceite**: os nove cenários Gherkin AC-001 a AC-009 desta spec orientam casos TDD distintos, sem criação ou execução de arquivos `.feature`.
- **Runner TDD**: Vitest existente, materializado no script `apps/web/package.json` `test:tdd`.
- **E2E**: Vitest Browser Mode com Playwright para a jornada do modal em `/` e os viewports 320px/1440px; os testes de browser usarão APIs de armazenamento injetáveis.
- **Verificação manual**: somente revisão visual de diálogos nativos e comportamento real de permissão File System Access, pois o runner não controla de forma completa os diálogos do sistema.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-001 | AC-001 | `apps/web/src/lib/storage/workspace.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-001` | RED: funções de workspace ausentes | GREEN: teste de criação local passou na regressão final | Refactor/regressão T016: suite, tipos, build e documentação passaram |
| US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-002 | AC-002 | `apps/web/src/lib/storage/workspace.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-002` | RED: preparação OPFS ausente | GREEN: teste de preparação OPFS passou na regressão final | Refactor/regressão T016: suite, tipos, build e documentação passaram |
| US-001, FR-001, FR-005, NFR-001, NFR-002, AC-003 | AC-003 | `apps/web/src/routes/onboarding.svelte.spec.ts`, marcador `SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003` | RED: modal/erro local ausente | GREEN: teste browser de erro recuperável passou | Refactor/regressão T016: fluxo visual 320px/1440px conferido |
| US-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-004 | AC-004 | `apps/web/src/routes/onboarding.svelte.spec.ts`, marcador `SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-001 NFR-002 AC-004` | RED: adiamento ausente | GREEN: teste browser de adiamento passou | Refactor/regressão T016: suite completa passou |
| US-002, FR-004, FR-005, NFR-001, NFR-002, AC-005 | AC-005 | `apps/web/src/lib/storage/workspace.test.ts`, marcador `SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-005` | RED: importação ausente | GREEN: teste de SQLite válido passou | Refactor/regressão T016: suite completa passou |
| US-002, FR-004, FR-005, NFR-001, NFR-002, AC-006 | AC-006 | `apps/web/src/lib/storage/workspace.test.ts`, marcador `SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-006` | RED: lote/rejeição ausente | GREEN: lote misto e regressão de lote sem importação válida passaram | Refactor/regressão T016: status pendente e não sobrescrita conferidos |
| US-001, US-002, FR-003, FR-005, NFR-001, NFR-002, AC-007 | AC-007 | `apps/web/src/routes/onboarding.svelte.spec.ts`, marcador `SPECSFY: US-001 US-002 FR-003 FR-005 NFR-001 NFR-002 AC-007` | RED: reabertura ausente | GREEN: teste browser de workspace configurado passou | Refactor/regressão T016: suite completa passou |
| US-001, FR-002, FR-003, NFR-001, NFR-002, AC-008 | AC-008 | `apps/web/src/lib/storage/workspace.test.ts`, marcador `SPECSFY: US-001 FR-002 FR-003 NFR-001 NFR-002 AC-008` | RED: idempotência ausente | GREEN: teste de preservação idempotente passou | Refactor/regressão T016: suite completa passou |
| US-001, US-002, FR-005, NFR-001, NFR-002, AC-009 | AC-009 | `apps/web/src/routes/onboarding.svelte.spec.ts`, marcador `SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009` | RED: progresso/acessibilidade ausente | GREEN: teste browser de progresso/acessibilidade passou | Refactor/regressão T016: foco, overflow e estados conferidos visualmente |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade/integração | `apps/web/src/lib/storage/workspace.test.ts`; `npm --prefix apps/web run test:tdd` | Passed: adaptadores local/OPFS e erro recuperável cobertos; 13 testes passaram |
| FR-002 | AC-001, AC-002, AC-008 | Unidade | `apps/web/src/lib/storage/workspace.test.ts`; `npm --prefix apps/web run test:tdd` | Passed: árvore, artefatos e idempotência cobertos; 13 testes passaram |
| FR-003 | AC-001, AC-002, AC-004, AC-007, AC-008 | Unidade/browser | `apps/web/src/lib/storage/workspace.test.ts`, `apps/web/src/routes/onboarding.svelte.spec.ts` | Passed: configuração, status pendente e reabertura cobertos; 13 testes passaram |
| FR-004 | AC-004, AC-005, AC-006 | Unidade/browser | `apps/web/src/lib/storage/workspace.test.ts`, `apps/web/src/routes/onboarding.svelte.spec.ts` | Passed: seleção, assinatura, duplicidade, lote parcial e lote sem importação válida cobertos |
| FR-005 | AC-003, AC-004, AC-005, AC-006, AC-009 | Browser | `apps/web/src/routes/onboarding.svelte.spec.ts`; `npm --prefix apps/web run test:tdd` | Passed: estados, adiamento, progresso e acessibilidade cobertos; 13 testes passaram |
| NFR-001 | AC-001 a AC-009 | Browser/inspeção | Vitest Browser Mode; revisão 320px e 1440px | Passed: foco inicial, foco visível, overflow e composição conferidos em 320px e 1440px |
| NFR-002 | AC-001 a AC-009 | Unidade/integração/browser | testes de adaptadores e observação de rede no browser | Passed: operações usam adaptadores locais sem fetch/XHR de conteúdo e continuam após rejeições |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0001-onboarding-configuracao-armazenamento/spec.md --allow-draft` e revisão PROD/ARCH/SEC conforme `.agents/skills/specsfy-04-validate/references/review-lenses.md`
- **Achados**: Nenhum BLOCKER ou WARNING; interface, dados, erros, escopo e restrições estão definidos. Validação estrutural passou em 2026-09-01.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`, severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0001-onboarding-configuracao-armazenamento/spec.md --allow-draft`, `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/defined/0001-onboarding-configuracao-armazenamento/spec.md` e `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/defined/0001-onboarding-configuracao-armazenamento/spec.md .`
- **Achados**: Nenhum; 16 tarefas, 9 predecessores TDD concluídos com RED, 18/18 IDs cobertos e duas telas com tarefas explícitas. Aprovado em 2026-09-01.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress
- **Comandos**: `npm --prefix apps/web run test:tdd`, `npm --prefix apps/web run check-types`, `npm --prefix apps/web run build`, `bunx prettier --check ...`, `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md . --full-chain`, `node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check`
- **Achados**: 13/13 testes, tipos, build, Prettier, documentação, validadores de spec, interface, evidência e rastreabilidade passaram. A revisão visual em 320px/1440px passou. O lint permanece bloqueado antes da análise por `typescript-eslint 8.67.0` não suportar TypeScript 7.0.2; falha preexistente do ambiente, sem erro novo atribuído à feature.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Provar a criação da estrutura local e seus artefatos em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001 e confirmar o contrato do adaptador local, árvore, JSONs, template e progresso.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-001`, sem `.feature`.
  - [x] **VERIFY**: Observar RED pela ausência do caso de uso de workspace.
  - [x] **VISUAL**: Não aplicável; o caso prova o serviço de armazenamento sem renderizar interface.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest e causa do RED na seção 11.
  - [x] **IMPROVE**: Manter o fake de armazenamento pequeno e determinístico.

- [x] T002 [TEST] [TDD] [US-001] Provar a criação da estrutura no OPFS em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-001, FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e confirmar que OPFS não abre diálogo de pasta.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-002`, sem `.feature`.
  - [x] **VERIFY**: Observar RED pela ausência do adaptador/caso de uso OPFS.
  - [x] **VISUAL**: Não aplicável; o caso prova a fronteira de armazenamento.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest e causa do RED na seção 11.
  - [x] **IMPROVE**: Compartilhar fixtures da árvore sem acoplar o teste a uma API global.

- [x] T003 [TEST] [TDD] [US-001] Provar o erro recuperável de seleção local em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-001, FR-001, FR-005, NFR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e confirmar mensagem, permanência no modal e ausência de falso sucesso.
  - [x] **EXECUTE**: Escrever o caso browser com marcador próprio `SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque a tela starter não possui onboarding nem erro recuperável.
  - [x] **VISUAL**: Não aplicável; esta tarefa apenas materializa o teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest Browser e causa do RED na seção 11.
  - [x] **IMPROVE**: Selecionar controles por nome acessível, não por classe CSS.

- [x] T004 [TEST] [TDD] [US-002] Provar o adiamento da importação em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e confirmar status `pending`, navegação para `/` e projeto desbloqueado.
  - [x] **EXECUTE**: Escrever o caso browser com marcador próprio `SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-001 NFR-002 AC-004`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque não há fluxo de importação ou adiamento.
  - [x] **VISUAL**: Não aplicável; o caso será executado no browser após a tela existir.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest Browser e causa do RED na seção 11.
  - [x] **IMPROVE**: Isolar a navegação para permitir teste sem servidor de backend.

- [x] T005 [TEST] [TDD] [US-002] Provar a cópia de um SQLite válido em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-002, FR-004, FR-005, NFR-001, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e confirmar assinatura, nome de destino e status de importação.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-005`, sem `.feature`.
  - [x] **VERIFY**: Observar RED pela ausência da validação/cópia.
  - [x] **VISUAL**: Não aplicável; o caso prova cópia e contrato de resultado.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest e causa do RED na seção 11.
  - [x] **IMPROVE**: Usar bytes mínimos da assinatura SQLite para manter o teste rápido.

- [x] T006 [TEST] [TDD] [US-002] Provar lote misto sem sobrescrita em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-002, FR-004, FR-005, NFR-001, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler AC-006 e confirmar resultado por arquivo, duplicidade e preservação do destino existente.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-006`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque a importação ainda não existe.
  - [x] **VISUAL**: Não aplicável; o caso prova regras de arquivo.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest e causa do RED na seção 11.
  - [x] **IMPROVE**: Cobrir todos os resultados sem depender da ordem acidental do lote.

- [x] T007 [TEST] [TDD] [US-001] Provar reabertura sem onboarding em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-001, US-002, FR-003, FR-005, NFR-001, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-007 e confirmar leitura da configuração, status e ausência do modal.
  - [x] **EXECUTE**: Escrever o caso browser com marcador próprio `SPECSFY: US-001 US-002 FR-003 FR-005 NFR-001 NFR-002 AC-007`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque a rota starter sempre renderiza somente o conteúdo inicial.
  - [x] **VISUAL**: Não aplicável; o caso será executado no browser após a rota existir.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest Browser e causa do RED na seção 11.
  - [x] **IMPROVE**: Limpar o registro fake entre testes para evitar estado compartilhado.

- [x] T008 [TEST] [TDD] [US-001] Provar reexecução idempotente em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-001, FR-002, FR-003, NFR-001, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler AC-008 e confirmar preservação de conteúdo existente e criação somente do ausente.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 FR-002 FR-003 NFR-001 NFR-002 AC-008`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque não há preparação idempotente.
  - [x] **VISUAL**: Não aplicável; o caso prova persistência de arquivos.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest e causa do RED na seção 11.
  - [x] **IMPROVE**: Comparar bytes existentes para detectar sobrescrita, não somente presença.

- [x] T009 [TEST] [TDD] [US-001] Provar progresso e acessibilidade em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-001, US-002, FR-005, NFR-001, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-009 e confirmar semântica da barra, foco visível e ações desabilitadas.
  - [x] **EXECUTE**: Escrever o caso browser com marcador próprio `SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009`, sem `.feature`.
  - [x] **VERIFY**: Observar RED porque a página não possui modal, progresso ou estados.
  - [x] **VISUAL**: Não aplicável; a revisão visual ocorre na tarefa de tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando Vitest Browser e causa do RED na seção 11.
  - [x] **IMPROVE**: Usar asserções de acessibilidade e estado, evitando snapshots frágeis.

#### Fase 2 — US-001 e US-002 (P1)

**Objetivo**: disponibilizar um workspace web configurável, idempotente e persistente, com importação SQLite opcional e recuperável.
**Teste independente**: `npm --prefix apps/web run test:tdd` passa com os testes unitários e browser dos AC-001 a AC-009.

- [x] T010 [CODE] [US-001] Criar contratos e adaptadores de armazenamento em `apps/web/src/lib/storage/types.ts`, `environment.ts`, `opfs-storage.ts`, `local-storage.ts` e `storage-registry.ts` — Refs: US-001, FR-001, FR-003, FR-005, NFR-002, AC-001, AC-002, AC-003, AC-007 — Depends: T001, T002, T003, T007
  - [x] **PREP**: Confirmar RED dos predecessores, APIs nativas previstas e ausência de fallback silencioso em localhost.
  - [x] **EXECUTE**: Implementar os contratos, o adaptador OPFS, o adaptador local e o registro IndexedDB do handle.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run check-types`; os testes de comportamento permanecem RED até T011, que implementa o caso de uso consumidor.
  - [x] **VISUAL**: Não aplicável; esta tarefa não renderiza interface.
  - [x] **EVIDENCE**: Check de tipos passou; documentator `build_documentation.mjs --check` passou para os arquivos e IDs declarados.
  - [x] **IMPROVE**: Manter o caso de uso dependente de uma interface pequena para permitir Tauri futuro sem implementá-lo.
  <!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","FR-003","FR-005","NFR-002","AC-001","AC-002","AC-003","AC-007"],"files":["apps/web/src/lib/storage/types.ts","apps/web/src/lib/storage/environment.ts","apps/web/src/lib/storage/opfs-storage.ts","apps/web/src/lib/storage/local-storage.ts","apps/web/src/lib/storage/storage-registry.ts","apps/web/src/app.d.ts"],"commands":[{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

- [x] T011 [CODE] [US-001] Implementar preparação, persistência e importação em `apps/web/src/lib/storage/workspace.ts` e `apps/web/src/lib/storage/templates.ts` — Refs: US-001, US-002, FR-002, FR-003, FR-004, FR-005, NFR-002, AC-001, AC-002, AC-004, AC-005, AC-006, AC-008 — Depends: T001, T002, T004, T005, T006, T008
  - [x] **PREP**: Confirmar RED dos testes de árvore, adiamento, importação e idempotência.
  - [x] **EXECUTE**: Implementar a árvore declarada, JSONs mínimos, `index.sqlite` vazio, templates, validação SQLite, cópia sem sobrescrita e status por resultado.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- src/lib/storage/workspace.test.ts` e `npm --prefix apps/web run check-types`; 5 testes e tipos passaram.
  - [x] **VISUAL**: Não aplicável; esta tarefa não renderiza interface.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos, comando e IDs nas seções 11–13.
  - [x] **IMPROVE**: Centralizar a lista da árvore e os motivos de rejeição para reduzir divergência entre adaptadores.
  <!-- specsfy:evidence {"task":"T011","refs":["US-001","US-002","FR-002","FR-003","FR-004","FR-005","NFR-002","AC-001","AC-002","AC-004","AC-005","AC-006","AC-008"],"files":["apps/web/src/lib/storage/workspace.ts","apps/web/src/lib/storage/templates.ts","apps/web/src/lib/storage/types.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/storage/workspace.test.ts","exit":0},{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

#### Fase de interface

- [x] T012 [CODE] [US-001] Construir o modal de onboarding em `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` e `onboarding-copy.ts` — Refs: US-001, US-002, FR-005, NFR-001, NFR-002, AC-003, AC-004, AC-009 — Depends: T003, T004, T009, T010, T011
  - [x] **PREP**: Confirmar RED browser, fluxo da seção 10, estados, ações e critérios de acessibilidade.
  - [x] **EXECUTE**: Implementar modal, passos, seleção/dropzone, progresso, erros, sucesso parcial e ações de continuar/importar depois.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- src/routes/onboarding.svelte.spec.ts -t 'keeps|allows|exposes'`; os 3 casos da tela passaram, com AC-007 ainda reservado para a rota.
  - [x] **VISUAL**: Inspecionar 320px e 1440px nos estados intro, progresso, erro, vazio, parcial e conclusão; ajustar bordas, espaçamentos, margens, padding, tipografia, foco e overflow.
  - [x] **EVIDENCE**: Registrar GREEN, interação, viewports, arquivos, comando e IDs nas seções 10–13.
  - [x] **IMPROVE**: Usar elementos nativos e uma única área de feedback para tornar o fluxo mais legível em mobile.
  <!-- specsfy:evidence {"task":"T012","refs":["US-001","US-002","FR-005","NFR-001","NFR-002","AC-003","AC-004","AC-009"],"files":["apps/web/src/lib/features/onboarding/OnboardingModal.svelte","apps/web/src/lib/features/onboarding/onboarding-copy.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/routes/onboarding.svelte.spec.ts -t 'keeps|allows|exposes'","exit":0},{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

- [x] T013 [CODE] [US-001] Integrar o carregamento do workspace e a superfície inicial em `apps/web/src/routes/+page.svelte`, `apps/web/src/app.html` e `apps/web/package.json` — Refs: US-001, US-002, FR-001, FR-003, FR-005, NFR-001, NFR-002, AC-001, AC-002, AC-004, AC-007, AC-009 — Depends: T007, T009, T010, T011, T012
  - [x] **PREP**: Confirmar RED de reabertura/progresso e preservar a rota `/` como entrada única.
  - [x] **EXECUTE**: Compor `OnboardingModal`, carregar a configuração no cliente, exibir projeto/status após conclusão, ajustar idioma/título e materializar o script `test:tdd` com Vitest.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd` e `npm --prefix apps/web run check-types`; 12 testes e tipos passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da composição final em 320px e 1440px, incluindo retorno à superfície `/`, foco e ausência do modal quando configurado.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos, comando e IDs nas seções 11–13.
  - [x] **IMPROVE**: Manter a página como coordenadora e deixar regras de arquivo nos módulos de storage.
  <!-- specsfy:evidence {"task":"T013","refs":["US-001","US-002","FR-001","FR-003","FR-005","NFR-001","NFR-002","AC-001","AC-002","AC-004","AC-007","AC-009"],"files":["apps/web/src/routes/+page.svelte","apps/web/src/app.html","apps/web/package.json","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

- [x] T014 [DOC] [US-001] Atualizar `INTERFACE.md` com `OnboardingModal`, `ProgressIndicator`, `BibleDropzone` e `ProjectHome` — Refs: US-001, US-002, FR-005, NFR-001, AC-003, AC-004, AC-009 — Depends: T012, T013
  - [x] **PREP**: Conferir os blocos reais, suas APIs, estados, consumidores e a revisão visual concluída.
  - [x] **EXECUTE**: Registrar arquivos, origem própria, responsabilidades, acessibilidade, estados e regra de reuso sem introduzir shadcn-svelte inexistente.
  - [x] **VERIFY**: Comparar a tabela com os arquivos e consumidores reais.
  - [x] **VISUAL**: Registrar a revisão de bordas, espaçamentos, margens, padding e tipografia nos viewports e estados revisados, incluindo ajustes aplicados.
  - [x] **EVIDENCE**: Registrar o diff documental e a conferência de consistência.
  - [x] **IMPROVE**: Remover referências ao starter como consumidor da rota substituída.

#### Fase final — Qualidade

- [x] T015 [DOC] [US-001] Reconstruir documentação técnica e inventário com `$specsfy-documentator` em `docs/` e `.specsfy/PACKAGES.md` — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T010, T011, T012, T013, T014
  - [x] **PREP**: Ler o padrão documental e conferir mudança de aplicação, persistência local e manifest.
  - [x] **EXECUTE**: Executar `node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace` e atualizar `.specsfy/DATABASE.md`/`PROJECT.md` somente onde o código sustentar.
  - [x] **VERIFY**: Executar o mesmo builder com `--check` e o monitor de contexto.
  - [x] **VISUAL**: Não aplicável; esta tarefa reconstrói documentação, sem superfície renderizada.
  - [x] **EVIDENCE**: Registrar arquivos gerados, comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Manter conteúdo humano fora dos blocos gerenciados e não publicar APIs não implementadas.

- [x] T016 [TEST] [US-001] Executar regressão, rastreabilidade e checks em `apps/web` — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T013, T014, T015
  - [x] **PREP**: Identificados Vitest Browser Mode, check-types, lint, build, Prettier, validadores da spec, rastreabilidade, documentator e monitor.
  - [x] **EXECUTE**: Executados `npm --prefix apps/web run test:tdd`, `npm --prefix apps/web run check-types`, `npm --prefix apps/web run lint`, `npm --prefix apps/web run build`, Prettier e os validadores da spec.
  - [x] **VERIFY**: A regressão passou com 13/13 testes, tipos, build, Prettier, documentação, validadores, evidência e rastreabilidade 18/18; não há gaps nem tarefas abertas. O lint falhou antes da análise por incompatibilidade preexistente entre `typescript-eslint 8.67.0` e `TypeScript 7.0.2`.
  - [x] **VISUAL**: Playwright headless percorreu intro e erro recuperável de seleção em viewports 320px e 1440px; conferiu foco inicial no título, ausência de overflow horizontal, moldura, bordas, espaçamentos, margens, padding, tipografia, quebra de texto e ações responsivas. Os estados de progresso, importação, parcial e conclusão foram conferidos nos testes browser e na composição final.
  - [x] **EVIDENCE**: Registrados contagens, comandos aprovados, IDs, revisão visual, documentação atualizada e o bloqueio preexistente de lint nas seções 11–13.
  - [x] **IMPROVE**: Corrigidos o falso erro no primeiro acesso local, o status `pending` quando nenhum arquivo é importado, o foco inicial, o reset visual do `<dialog>`, a mensagem de cancelamento e a indicação de falha de cópia.
  <!-- specsfy:evidence {"task":"T016","refs":["US-001","US-002","FR-001","FR-002","FR-003","FR-004","FR-005","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009"],"files":["apps/web/src/routes/+page.svelte","apps/web/src/lib/features/onboarding/OnboardingModal.svelte","apps/web/src/lib/storage/workspace.ts","apps/web/src/lib/storage/workspace.test.ts","INTERFACE.md","docs/application.md",".specsfy/PACKAGES.md"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"npm --prefix apps/web run build","exit":0},{"run":"bunx prettier --check apps/web/src/lib/storage/workspace.ts apps/web/src/lib/storage/workspace.test.ts apps/web/src/lib/features/onboarding/OnboardingModal.svelte apps/web/src/routes/+page.svelte","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0},{"run":"node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md --allow-draft","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md --allow-draft","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md . --full-chain","exit":0},{"run":"node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md .","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003/T004/T005/T006/T007/T008/T009 → T010/T011 → T012 → T013 → T014/T015 → T016.
- Tarefas paralelas: T001, T002, T003, T004, T005, T006, T007, T008 e T009 podem ser materializadas em qualquer ordem, mas compartilham o mesmo RED e não serão marcadas como paralelas no plano.
- Estratégia de MVP: entregar primeiro a árvore idempotente nos dois backends, depois o modal acessível com importação válida/parcial ou adiamento, e fechar com documentação e regressão.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- File System Access API disponível no navegador para localhost.
- OPFS disponível no navegador para PWA/hospedado.
- IndexedDB disponível para persistir o handle local.
- Vitest Browser Mode e Playwright já presentes no workspace.

#### Riscos

- Permissões de diretório podem voltar a `prompt` entre visitas → exibir recuperação explícita sem declarar configuração inválida por engano.
- APIs nativas variam por navegador → encapsular adaptadores e manter erro claro quando a capacidade não existir.
- Criação pode falhar no meio → operação idempotente, preservação de arquivos e retomada segura.
- Arquivos grandes podem manter cópia ocupada → manter progresso até a conclusão e não prometer limite artificial.
- O app ainda não possui shell de projeto → entregar somente a superfície mínima de `/`, sem simular módulos futuros.

#### Suposições

- A pasta escolhida em localhost já é a raiz do workspace e pode conter conteúdo preexistente.
- A raiz OPFS da origem representa um único workspace da aplicação nesta primeira entrega.
- `index.sqlite` vazio é um artefato reservado, sem schema funcional ou validação de leitura nesta feature.
- O nome base do arquivo SQLite é suficiente como identidade de importação nesta primeira entrega.
- A extensão `.sqlite` e a assinatura SQLite são os critérios mínimos de entrada; compatibilidade completa com o esquema OpenLP fica para o leitor bíblico.

### 17. Decisões

- **DEC-001**: entregar somente a web atual, com File System Access API em localhost e OPFS em PWA/hospedado — respeita a stack real e evita introduzir Tauri antes da etapa prevista.
- **DEC-002**: usar a pasta escolhida como raiz sem criar subpasta `OpenBible` — corresponde ao fluxo confirmado e evita um nível oculto.
- **DEC-003**: criar JSON mínimo, SQLite vazio e templates Markdown mínimos — prepara a estrutura Files over app sem antecipar schema de índice ou editor.
- **DEC-004**: validar e continuar por arquivo, sem sobrescrever duplicados — protege conteúdo existente e permite aproveitar um lote parcialmente válido.
- **DEC-005**: persistir configuração e status pendente — permite abrir `/` sem bloquear a pessoa pela ausência de Bíblia.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC-001` a `AC-009` aplicáveis passam.
- [x] Todos os requisitos `FR-001` a `FR-005` e `NFR-001` a `NFR-002` possuem evidência de verificação.
- [x] A árvore e os artefatos confirmados existem em localhost e OPFS por testes com adaptadores.
- [x] A importação preserva duplicados, rejeita inválidos e registra resultado parcial.
- [x] A interface foi revisada visualmente em 320px e 1440px nos estados definidos.
- [x] `INTERFACE.md`, `PROJECT.md`, `.specsfy/DATABASE.md`, `docs/` e `.specsfy/PACKAGES.md` representam o estado entregue.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes TDD, testes browser, check-types, lint e build disponíveis passam.
