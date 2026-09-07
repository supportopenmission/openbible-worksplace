# Especificação integrada: Versão nativa macOS com Tauri

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0014 |
| Slug | 0014-versao-nativa-macos-tauri |
| Status | Complete |
| Effort | 8 |
| Effort updated at | 2026-09-04 |
| Effort rationale | Shell Tauri, ponte IPC tipada, armazenamento nativo, migração não destrutiva, lock de uso exclusivo, paridade de todas as rotas e build universal macOS combinam risco de arquitetura, dados, segurança e distribuição. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-04 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible web/PWA usa OPFS ou File System Access API e `sql.js` no runtime do navegador. A pessoa que usa macOS precisa de uma versão nativa que preserve as telas e os fluxos atuais, guarde o workspace em uma pasta comum do computador e acesse SQLite por uma camada Tauri confiável, sem duplicar a interface.

#### Resultado desejado

Uma aplicação Tauri para macOS 13 Ventura ou mais recente, em binário universal Intel + Apple Silicon, que reutiliza `apps/web`, pergunta pela pasta que será a raiz do workspace nativo, oferece migração assistida opcional do OPFS e mantém os dados do OpenBible disponíveis por comandos nativos tipados. O app é somente uma casca: Markdown, JSON, SQLite, bíblias, notas e demais dados ficam centralizados nessa pasta escolhida, no modelo Files Over App do Obsidian.

#### Métricas de sucesso

- Os cenários AC-001 a AC-012 passam nos testes previstos sem regressão das suites web existentes.
- As rotas `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study` e `/config`, além do onboarding, abrem no shell Tauri compartilhado.
- Nenhuma operação aprovada grava fora do workspace, executa SQL arbitrário ou altera o workspace web de origem durante a migração.
- O mesmo workspace não é escrito por duas instâncias simultâneas.
- Um artefato macOS universal não assinado é gerado localmente ou em CI para teste.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [medium] O repositório atual fornece uma camada de storage e shell Svelte que pode ser reutilizada pelo wrapper Tauri — Verdict: verified — Confidence: high — Evidence: research/local-context-2026-09-04.md#evidência-observada — Budget: 1/3.
- Nenhuma pesquisa externa foi executada nesta etapa. Versão exata do Tauri/Rust, plugin SQLite, APIs de capability e limites de empacotamento permanecem decisões técnicas para o plano e deverão ser validadas antes da implementação.

#### Fontes e contexto consultados

- `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md` e `.specsfy/USER-PROFILE.md`.
- Código e testes em `apps/web/src/lib/features/{workspace,storage,onboarding,bible,notes,navigation,config,home}` e `apps/web/src/routes/`.
- `specs/inbox/2026-09-04-164740-versao-nativa-macos-com-tauri-e-armazenamento-local.md` e `specs/backlog/0014-versao-nativa-macos-tauri.md`.
- Specs relacionadas: `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md`, `specs/completed/0003-leitor-biblia-sqlite/spec.md`, `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md`, `specs/completed/0010-melhorar-experiencia-do-pwa/spec.md` e `specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md`.

#### Documentação consultada

- Documentação local do Specsfy (`.specsfy/Spec.md` e skills de setup, dados, domínio, arquitetura, TypeScript e shadcn-svelte).
- Não houve fonte externa nem artefato de pesquisa armazenado.

#### Artefatos de pesquisa armazenados

- `specs/planned/0014-versao-nativa-macos-tauri/research/local-context-2026-09-04.md`: consulta local ao código e aos contextos do projeto, acesso em 2026-09-04; indexa a base Svelte/storage/interface usada para as decisões desta spec.

#### Dúvidas respondidas

- **Q-001**: Como tratar dados OPFS existentes? → **A**: Migração assistida opcional, com origem preservada.
- **Q-002**: Onde criar o workspace nativo? → **A**: perguntar a pasta no onboarding e usar a pasta escolhida como raiz única dos dados; não criar um diretório de dados paralelo em Application Support.
- **Q-003**: Qual alvo macOS? → **A**: macOS 13 Ventura ou mais recente, binário universal Intel + Apple Silicon.
- **Q-004**: Como compartilhar a interface? → **A**: Reutilizar o mesmo `apps/web` e selecionar storage web/Tauri em runtime.
- **Q-005**: Como expor filesystem/SQLite? → **A**: Facade tipada de comandos Tauri com capabilities allowlist; sem caminho arbitrário ou SQL livre na UI.
- **Q-006**: Qual paridade inicial? → **A**: Todas as rotas e fluxos publicados no web, incluindo onboarding.
- **Q-007**: Qual distribuição inicial? → **A**: Build local e artefato de CI sem assinatura/notarização; distribuição pública posterior.
- **Q-008**: Como tratar concorrência? → **A**: Uso exclusivo por workspace, com lock/sinalização e orientação para fechar a outra instância.
- **Q-009**: O que lembrar sobre o workspace/migração? → **A**: Pasta, tipo de armazenamento, versão do formato e estado `não iniciada`, `concluída` ou `com erro`; somente a pessoa usuária individual consulta ou altera.

#### Dúvidas abertas

- Versão exata do Tauri/Rust e driver/plugin SQLite.
- Forma do lock, comportamento em volumes removíveis e recuperação após encerramento abrupto.
- Contrato nominal dos comandos, payloads, erros serializados e versionamento da ponte.
- Detecção/exportação do OPFS a partir do PWA, atomicidade da cópia e tratamento de destino parcial.
- Ajustes de adapter/build do SvelteKit para o artefato Tauri e matriz de CI macOS.
- Política futura de assinatura, notarização, atualização e distribuição pública.

### 3. Escopo e atores

#### Incluído

- Shell Tauri em `apps/desktop` para macOS 13+ universal.
- Build que empacota a interface de `apps/web` sem duplicar telas.
- Adaptador de storage que usa APIs web no navegador e comandos Tauri no desktop.
- Workspace nativo padrão ou escolhido, com configuração persistida.
- Migração assistida opcional do workspace OPFS/PWA, sem alterar a origem.
- Leitura/escrita de Markdown e JSON do workspace e acesso ao `.openbible/index.sqlite` e `bibles/*.sqlite` pela camada nativa.
- Lock/sinalização de uso exclusivo e estados de erro recuperáveis.
- Paridade do onboarding, shell e rotas `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study` e `/config`.
- Build local e artefato CI testável sem assinatura/notarização.

#### Fora de escopo

- Windows, Linux, iOS ou Android.
- Novas funções de Bíblia, notas, sermões ou estudos.
- Conta, autenticação, colaboração, sincronização ou serviço remoto de dados.
- Migração automática obrigatória ou exclusão do workspace OPFS.
- SQL livre, filesystem genérico ou acesso da UI a caminhos fora do workspace.
- Duas instâncias escrevendo no mesmo workspace.
- Assinatura, notarização, autoatualização e distribuição pública.
- Redesign visual do produto web.

#### Atores

- **Pessoa usuária individual**: inicia o app, escolhe/reabre workspace, aceita ou recusa migração, usa as rotas existentes e recebe orientação em falhas.
- **Shell Tauri/Rust**: único owner das operações nativas de filesystem, SQLite e lock; valida capabilities, caminhos e estados antes de executar.
- **Interface Svelte compartilhada**: solicita casos de uso por uma facade tipada e apresenta loading, sucesso, vazio, erro e recuperação; não acessa infraestrutura nativa diretamente.

### 4. Princípios e restrições do projeto

- **PR-001**: `apps/web` é a única UI de domínio; o runtime escolhe a implementação de storage sem duplicar componentes ou rotas.
- **PR-002**: Markdown com YAML frontmatter permanece fonte primária de notas/sermões/estudos; SQLite continua auxiliar para índices/destaques e somente leitura para `bibles/*.sqlite`.
- **PR-003**: O boundary nativo é uma facade de comandos tipados e allowlisted; nenhum comando aceita SQL arbitrário ou caminho não validado.
- **PR-004**: Migração opt-in é não destrutiva, preserva a origem e deve permitir recomeço após falha.
- **PR-005**: Um workspace tem um único escritor ativo; o lock é responsabilidade da camada nativa e não do componente visual.
- **PR-006**: A primeira distribuição é um artefato de teste macOS 13+ universal, sem exigir assinatura/notarização.
- **PR-007**: Estados de erro não expõem conteúdo de notas, tokens ou caminhos sensíveis em mensagens/logs.

### 5. Histórias de usuário

#### US-001 — Abrir o OpenBible nativo com o workspace correto (P1)

Como pessoa usuária de macOS, quero abrir o OpenBible com a mesma interface e reencontrar meu workspace, para continuar meus estudos sem depender do OPFS.

**Por que P1**: sem shell, storage e paridade de rotas não existe valor independente na build nativa.
**Teste independente**: iniciar o artefato Tauri em um workspace vazio e em um workspace existente e navegar por todas as rotas publicadas.
**Requisitos**: FR-001, FR-002, NFR-002

#### US-002 — Migrar dados web sem perder a origem (P1)

Como pessoa usuária que já usa o PWA, quero decidir se migro meu workspace OPFS para uma pasta nativa, para continuar o trabalho localmente com segurança.

**Por que P1**: a migração é a principal transição de dados entre os runtimes e não pode ser presumida nem destrutiva.
**Teste independente**: executar migração aceita, recusada e interrompida em um fixture de workspace e comparar origem/destino.
**Requisitos**: FR-003, NFR-003

#### US-003 — Operar com segurança e gerar uma build testável (P1)

Como pessoa usuária e mantenedora do projeto, quero que operações nativas sejam restritas e que exista um artefato macOS universal, para usar e verificar a primeira versão sem risco de acesso indevido.

**Por que P1**: a ponte nativa e o empacotamento são fronteiras de confiança e desbloqueiam todas as histórias anteriores.
**Teste independente**: tentar comandos inválidos, abrir o mesmo workspace duas vezes e executar o pipeline de build universal.
**Requisitos**: FR-004, FR-005, NFR-001

### 6. Cenários BDD de aceite

#### AC-001 — Primeiro uso no caminho padrão

**Cobre**: US-001, FR-001, FR-005, NFR-002

```gherkin
@US-001 @FR-001 @FR-005 @NFR-002 @AC-001
Feature: Workspace nativo

  Scenario: Criar workspace padrão no primeiro uso
    Given o app Tauri está sendo aberto no macOS 13 ou mais recente sem configuração nativa
    When a pessoa conclui a etapa de armazenamento sem escolher outra pasta
    Then o workspace é criado em "~/Library/Application Support/OpenBible/workspace"
    And a interface compartilhada abre o onboarding ou a home conforme o estado do workspace
```

#### AC-002 — Escolha de outra pasta

**Cobre**: US-001, FR-001, FR-005, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-002
Feature: Workspace nativo

  Scenario: Usar pasta escolhida pela pessoa
    Given a pessoa está no onboarding ou nas configurações de armazenamento do app Tauri
    When escolhe uma pasta permitida diferente do caminho padrão
    Then o app valida a pasta, registra a escolha e usa-a como workspace ativo
```

#### AC-003 — Paridade de navegação

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-005 @NFR-002 @AC-003
Feature: Interface web no shell nativo

  Scenario: Navegar pelas rotas publicadas
    Given o workspace nativo está pronto
    When a pessoa navega pelo shell do app
    Then onboarding, "/", "/bible", "/notes", "/highlights", "/sermons", "/study" e "/config" permanecem acessíveis com os estados existentes
```

#### AC-004 — Leitura e escrita por comandos tipados

**Cobre**: US-001, FR-002, NFR-003

```gherkin
@US-001 @FR-002 @NFR-003 @AC-004
Feature: Persistência nativa

  Scenario: Salvar uma nota e atualizar o índice
    Given o app Tauri abriu um workspace válido
    When a pessoa salva uma nota e o índice de versículos é atualizado
    Then Markdown/JSON e ".openbible/index.sqlite" são alterados somente pela facade de comandos tipados
    And os bancos "bibles/*.sqlite" permanecem somente leitura
```

#### AC-005 — Rejeição de operação fora do contrato

**Cobre**: US-003, FR-002, NFR-001

```gherkin
@US-003 @FR-002 @NFR-001 @AC-005
Feature: Fronteira nativa

  Scenario: Bloquear caminho externo ou SQL livre
    Given a interface tenta enviar um caminho fora do workspace ou uma instrução SQL arbitrária
    When a facade recebe o pedido
    Then o comando é rejeitado com erro serializado não sensível
    And nenhum arquivo externo ou banco bíblico é modificado
```

#### AC-006 — Migração aceita

**Cobre**: US-002, FR-003, NFR-003

```gherkin
@US-002 @FR-003 @NFR-003 @AC-006
Feature: Migração do workspace web

  Scenario: Copiar OPFS para o destino nativo
    Given existe um workspace OPFS válido e a pessoa escolhe migrá-lo
    When a migração assistida é confirmada
    Then o destino nativo recebe os arquivos e SQLite esperados
    And o app valida o destino, registra a migração como concluída e preserva a origem sem alterações
```

#### AC-007 — Migração recusada ou interrompida

**Cobre**: US-002, FR-003, NFR-003

```gherkin
@US-002 @FR-003 @NFR-003 @AC-007
Feature: Migração do workspace web

  Scenario: Não alterar a origem quando a migração não termina
    Given existe um workspace OPFS e a pessoa recusa ou interrompe a migração
    When o fluxo é encerrado
    Then a origem permanece intacta
    And o estado persistido é "não iniciada" ou "com erro" com uma ação recuperável
```

#### AC-008 — Permissão ou pasta inválida

**Cobre**: US-001, US-002, FR-001, FR-003, NFR-003

```gherkin
@US-001 @US-002 @FR-001 @FR-003 @NFR-003 @AC-008
Feature: Recuperação de armazenamento

  Scenario: Informar uma pasta indisponível
    Given a pasta padrão ou escolhida não pode ser lida ou escrita
    When o app tenta inicializar ou migrar o workspace
    Then a UI apresenta erro recuperável sem tratar o workspace como apagado
    And oferece escolher outra pasta ou tentar novamente
```

#### AC-009 — Lock de uso exclusivo

**Cobre**: US-003, FR-004, NFR-001

```gherkin
@US-003 @FR-004 @NFR-001 @AC-009
Feature: Uso exclusivo do workspace

  Scenario: Impedir segunda instância escritora
    Given uma instância do app mantém o workspace nativo bloqueado
    When outra instância tenta abrir a mesma pasta
    Then a segunda instância não inicia operações de escrita
    And informa que a primeira instância deve ser fechada antes de continuar
```

#### AC-010 — Erro SQLite ou comando inválido

**Cobre**: US-003, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-003 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-010
Feature: Erros nativos

  Scenario: Recuperar de falha de SQLite ou comando não permitido
    Given uma operação nativa falha por SQLite inválido, lock ou comando não permitido
    When o erro chega à interface
    Then a UI mostra uma mensagem acionável sem conteúdo sensível
    And não apaga nem corrompe o workspace
```

#### AC-011 — Build universal de teste

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-011
Feature: Build macOS

  Scenario: Gerar artefato universal sem assinatura
    Given o ambiente de build possui a toolchain do projeto
    When o comando local ou de CI para macOS é executado
    Then um artefato testável para Intel e Apple Silicon é produzido
    And a etapa não exige assinatura ou notarização
```

#### AC-012 — Estados e acessibilidade preservados

**Cobre**: US-001, US-003, FR-004, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @US-003 @FR-004 @FR-005 @NFR-001 @NFR-002 @AC-012
Feature: Experiência consistente

  Scenario: Operar com teclado e reduced motion durante boot/erro
    Given a interface nativa está em loading, erro de lock ou erro de permissão
    When a pessoa navega por teclado ou usa "prefers-reduced-motion"
    Then foco, anúncio de estado, contraste e recuperação seguem as convenções existentes de Svelte/shadcn-svelte
    And nenhuma animação obrigatória impede a operação
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve carregar a UI compartilhada de `apps/web`, selecionar storage web ou Tauri em runtime, criar/reabrir o workspace padrão ou escolhido e manter as rotas publicadas. **Cobre**: AC-001, AC-002, AC-003, AC-008.
- **FR-002**: O sistema deve executar operações de Markdown, JSON e SQLite do workspace por uma facade nativa tipada, preservando `.openbible/index.sqlite` como auxiliar e `bibles/*.sqlite` como somente leitura. **Cobre**: AC-004, AC-005, AC-010.
- **FR-003**: O sistema deve oferecer migração assistida opcional do OPFS/PWA para o workspace nativo, validar o destino, preservar a origem e registrar estado retomável. **Cobre**: AC-006, AC-007, AC-008.
- **FR-004**: O sistema deve garantir uso exclusivo por workspace, rejeitar escrita enquanto houver lock concorrente e expor erro recuperável à UI. **Cobre**: AC-009, AC-010, AC-012.
- **FR-005**: O sistema deve produzir uma build Tauri macOS 13+ universal Intel + Apple Silicon para teste local/CI sem assinatura ou notarização. **Cobre**: AC-003, AC-011, AC-012.

#### Não funcionais

- **NFR-001**: A fronteira nativa deve aplicar capabilities allowlist, validação de caminho dentro do workspace, comandos tipados e erros não sensíveis; nenhum SQL livre ou acesso externo deve ser executado. **Verificação**: testes de contrato Rust/TypeScript, inspeção de capabilities e tentativa negativa automatizada. **Cobre**: AC-005, AC-009, AC-010, AC-012.
- **NFR-002**: A experiência deve manter paridade de rotas, shell, estados, foco e reduced motion entre browser/PWA e Tauri, e o artefato deve ser universal para os dois conjuntos de CPU suportados. **Verificação**: testes de navegador/contrato, smoke test Tauri e inspeção de build em runners macOS Intel/Apple Silicon ou validação de binário universal. **Cobre**: AC-001, AC-003, AC-011, AC-012.
- **NFR-003**: Operações de migração e gravação devem ser não destrutivas e recuperáveis, manter dados locais no dispositivo e preservar a responsividade da UI; limites de tempo/volume serão definidos no plano a partir de fixtures representativos. **Verificação**: testes de falha/interrupção, comparação de checksums/arquivos, testes de integração SQLite e medição de inicialização/migração. **Cobre**: AC-004, AC-006, AC-007, AC-008, AC-010.

#### Erros e casos-limite

- Pasta padrão indisponível ou sem permissão → informar, não apagar e oferecer seleção alternativa.
- Workspace escolhido inválido/incompleto → rejeitar antes de escrever e explicar os requisitos mínimos.
- Migração interrompida → preservar a origem, marcar destino parcial/erro e permitir nova tentativa segura.
- SQLite bloqueado, corrompido ou incompatível → erro recuperável; nunca criar tabela auxiliar em `bibles/*.sqlite`.
- Caminho fora do workspace, SQL livre ou capability ausente → rejeitar sem revelar detalhes sensíveis.
- Lock existente → impedir a escrita da segunda instância e orientar o encerramento da primeira.
- Build não assinada → gerar o artefato e documentar o aviso esperado do Gatekeeper sem tratá-lo como falha de produto.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Monorepo Turborepo/Bun com SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7, Vite 8, Tailwind CSS 4, Vitest, Playwright e primitives locais shadcn-svelte.
- `apps/web/src/lib/storage/` já abstrai OPFS/File System Access, preferências, workspace e SQLite via `sql.js`; `apps/web/src/lib/features/workspace/` implementa boot, shell e recuperação de permissão.
- Rotas e componentes existentes devem permanecer compatíveis no browser/PWA; a camada nativa é uma implementação adicional, não uma substituição imediata.

#### Arquitetura e módulos

- `apps/desktop/`: wrapper Tauri e configuração de build; empacota o artefato de `apps/web`.
- `apps/desktop/src-tauri/`: Rust owner de filesystem, SQLite, lock, migração, capabilities e comandos; módulos previstos `commands/workspace`, `commands/files`, `commands/sqlite`, `commands/migration` e `commands/lock`.
- `apps/web/src/lib/storage/tauri-bridge.ts`: contrato TypeScript da ponte `invoke`, validação de respostas e union discriminada de erros.
- `apps/web/src/lib/storage/tauri-storage.ts`: implementação do contrato de storage existente, sem expor `invoke` aos componentes de domínio.
- `apps/web/src/lib/storage/tauri-runtime.ts`/`storage-registry.ts`: detecção de runtime e seleção entre adapters; browser/PWA continua usando as implementações atuais.
- Rust usa caminhos derivados de um workspace autorizado, operações de arquivo atômicas e transações SQLite; detalhes do driver e versionamento serão decididos no plano após validação da toolchain.
- Dependências apontam de UI/regras para interfaces estáveis de storage; Tauri/Rust implementa essas interfaces sem entrar no domínio de notas, Bíblia ou navegação.

#### Migrations

- Não há alteração de schema nas tabelas existentes. `.openbible/index.sqlite`, `note_verse_ref`, `reader_highlight`, `bibles/*.sqlite` e Markdown mantêm o contrato atual.
- A migração é de arquivos/workspace, não de banco: copiar para staging, validar arquivos esperados e checksums/tamanhos, promover atomicamente e registrar o estado.
- Rollback: a origem OPFS permanece intacta; destino parcial é isolado/removido somente se a operação puder provar que foi criado pela tentativa; falhas deixam estado `com erro` e retry explícito.

#### Models

- `WorkspaceConfig` (TypeScript/Rust): caminho autorizado, `storageKind` (`native` ou `web`), versão do formato e `migrationState` (`not_started`, `completed`, `error`); owner: workspace.
- `MigrationAttempt` é um registro operacional derivado do estado persistido, sem histórico remoto obrigatório; inclui resultado seguro para diagnóstico se o plano confirmar necessidade de histórico.
- `WorkspaceLock` é estado efêmero do processo/sistema operacional, não entidade de domínio persistida; owner: módulo de lock Rust.
- Notas, preferências, índices e bancos bíblicos existentes continuam com os owners e ciclos de vida descritos em `.specsfy/DATABASE.md`.

#### Controllers e casos de uso

- `initialize_workspace`: resolve padrão ou escolha, valida e retorna estado da configuração.
- `read_workspace_file`/`write_workspace_file`: recebem um identificador relativo validado e operação permitida; escrita usa arquivo temporário/rename quando aplicável.
- `query_index`/`mutate_index`: operações nomeadas e parametrizadas para as tabelas auxiliares, sem SQL arbitrário.
- `inspect_migration`/`migrate_workspace`: detectam fonte OPFS disponibilizada pelo fluxo, copiam/validam e atualizam estado; devem ser idempotentes por tentativa.
- `acquire_workspace_lock`/`release_workspace_lock`: garantem um escritor e mapeiam lock existente a erro recuperável.
- A UI chama somente a facade TypeScript; nenhum componente conhece comandos ou paths Rust diretamente.

#### Views e experiência

- Reutilizar `AppFrame`, `WorkspaceBootSplash`, `PermissionRecovery`, `OnboardingModal`, `WorkspaceSettings`, `ConfigPage`, `PageHeader`, `Dialog`/`Sheet` e estados já registrados em `INTERFACE.md`.
- Acrescentar apenas estados nativos necessários: destino padrão, escolha de pasta Tauri, confirmação de migração, progresso/resultado de migração, lock concorrente e erro de comando.
- Desktop usa modal/painel compatível com o padrão existente; mobile/web não recebe regressão. Todas as mensagens têm `aria-live`, foco visível e alternativa sem animação.

#### Queries e repositórios

- O repositório de índices mantém `note_verse_ref` e `reader_highlight` e passa a ter uma implementação nativa que executa statements preparados nomeados.
- O repositório bíblico mantém leitura parametrizada de `book`/`verse` em `bibles/*.sqlite`; nenhuma operação de escrita é exposta.
- Arquivos Markdown/JSON continuam File Over Apps; a implementação nativa resolve paths relativos seguros e mantém o formato existente.

#### Jobs e processamento assíncrono

- Não há servidor ou fila. Migração pode ser assíncrona no processo Tauri para não bloquear a UI, com cancelamento seguro, progresso, idempotência e estado de erro; retries são acionados pela pessoa.

#### Estrutura de arquivos

```text
apps/desktop/
  package.json
  src-tauri/
    Cargo.toml
    tauri.conf.json
    capabilities/
      default.json
    src/
      lib.rs
      commands/
        workspace.rs
        files.rs
        sqlite.rs
        migration.rs
        lock.rs
apps/web/src/lib/storage/
  tauri-bridge.ts
  tauri-storage.ts
  tauri-runtime.ts
specs/planned/0014-versao-nativa-macos-tauri/
  spec.md
  research/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| WorkspaceConfig | Registro único do workspace ativo | caminho nativo ou referência web; tipo `native`/`web`; versão do formato; estado da migração `not_started`/`completed`/`error`; somente pessoa local consulta/altera | Aponta para um workspace que contém `.openbible/`, `notes/`, `trash/` e `bibles/` |
| WorkspaceLock | Identidade do workspace + processo ativo | token efêmero, aquisição/liberação atômica, uma escrita ativa; não persistir conteúdo sensível | Protege o WorkspaceConfig e todos os arquivos/SQLite do workspace |
| MigrationAttempt | Identidade da tentativa (se o plano confirmar histórico) | origem, destino, estado, progresso/resultados seguros; nunca remove a origem automaticamente | Liga uma origem web a um destino nativo durante uma tentativa |
| Note | `notes/<noteId>.md` | YAML + Markdown; fonte primária existente; índices `note_verse_ref` derivados | Pode referenciar versos e aparecer na leitura |
| ReaderHighlight | Identidade natural do intervalo em `.openbible/index.sqlite` | `version_id`, livro, capítulo, início/fim, `style_id`; unicidade do intervalo exato existente | Relaciona-se ao SQLite bíblico somente por referência, nunca por escrita |
| BibleDatabase | Arquivo `bibles/*.sqlite` | `book`, `verse`, metadata opcional; somente leitura no produto | Contém livros e versículos consultados pelo leitor |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| WorkspaceConfig | ausente | Inicializar padrão ou escolher pasta | configurado | Caminho validado e dentro da fronteira autorizada |
| WorkspaceConfig | configurado | Migrar aceito | migração em andamento → concluída | Origem preservada; destino validado antes da promoção |
| WorkspaceConfig | configurado | Migração recusada | não iniciada | Nenhuma escrita na origem |
| WorkspaceConfig | migração em andamento | Falha/interrupção | com erro | Destino parcial identificado; retry não duplica dados válidos |
| WorkspaceLock | livre | Adquirir lock | ocupado | Uma instância escritora por workspace |
| WorkspaceLock | ocupado | Segunda aquisição | ocupado (rejeitada) | Segunda instância não escreve |
| WorkspaceLock | ocupado | Encerrar/liberar | livre | Liberação não apaga dados do workspace |

#### Migração e retenção

- A configuração local é criada na primeira abertura, muda com troca de pasta/storage e permanece até reconfiguração explícita.
- O conteúdo de origem OPFS não é removido pela migração; retenção e limpeza manual continuam fora desta fatia.
- Não há compartilhamento remoto. Logs e estados não devem reter conteúdo de notas nem credenciais.
- O schema dos SQLite atuais não muda; compatibilidade é garantida pela leitura/escrita dos mesmos formatos e pelo isolamento de `index.sqlite` e `bibles/*.sqlite`.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A entrega empacota e adapta a interface Svelte existente para o shell Tauri e acrescenta somente escolhas/estados de armazenamento nativo e migração.

#### Stack e convenções de interface

- SvelteKit/Svelte/TypeScript/Vite/Tailwind CSS com primitives locais shadcn-svelte (Nova) e `@lucide/svelte`; rotas em `apps/web/src/routes`; componentes em `apps/web/src/lib/features`; testes Vitest/Playwright.
- O shell atual é `AppFrame.svelte` com `AppSidebar.svelte`, `PageHeader.svelte`, `WorkspaceBootSplash.svelte` e `PermissionRecovery.svelte`; onboarding e configurações já possuem escolha de storage, abas/seções e estados recuperáveis.
- A entrega preserva tokens, Geist, tema claro/escuro, Sidebar desktop/barra mobile, safe area, foco, `prefers-reduced-motion`, `Dialog`/`Sheet` e o padrão de página existente. Não introduz React, ReUI ou uma biblioteca nova.

#### Telas e responsabilidades

- **Onboarding** (`apps/web/src/lib/features/onboarding/OnboardingModal.svelte`, rota inicial): escolher/criar workspace nativo, ver migração disponível, aceitar/recusar e importar dados bíblicos conforme o fluxo existente; saída é workspace pronto ou erro recuperável.
- **Home** (`/`): continuar leitura, ações rápidas e recentes com o mesmo storage ativo; não muda a tarefa principal.
- **Bíblia** (`/bible`): ler bancos OpenLP, selecionar versículos, destaques, notas e split/abas já existentes; só troca a implementação de persistência no Tauri.
- **Destaques** (`/highlights`): consultar `reader_highlight` no índice nativo/web equivalente.
- **Notas** (`/notes`, `/notes/[id]`): listar, editar Markdown, criar/mover para lixeira e sincronizar índice com a mesma interface.
- **Sermões/Estudos** (`/sermons`, `/study`): preservar telas/estados publicados e seu storage atual.
- **Configuração** (`/config`): diagnosticar workspace, trocar pasta/storage com confirmação, exibir estado de migração e estatísticas; sem apagar origem automaticamente.

#### Fluxo de informação e navegação

- A pessoa abre o app → `WorkspaceBootSplash` → onboarding se não houver configuração → escolha explícita da pasta raiz → detecção de workspace web → migração opcional → shell pronto. Reaberturas usam somente uma referência local ao caminho escolhido para reencontrar a mesma raiz.
- Com workspace pronto, o `AppSidebar`/barra mobile mantém os itens Início (`/`), Bíblia (`/bible`), Notas (`/notes`), Destaques (`/highlights`), Sermões (`/sermons`), Estudos (`/study`) e Configuração (`/config`), com `aria-current` e responsividade já documentadas.
- A configuração e a migração retornam à tela chamadora após sucesso; falhas mantêm contexto, foco e ação de retry.
- Breadcrumbs permanecem os atuais: produto/OpenBible → módulo (Bíblia, Notas, Configuração etc.) → tela atual; itens anteriores são links válidos e a tela atual tem semântica de página.

#### Menus e navegação principal

- Desktop: Sidebar persistente com Início, Bíblia, Notas, Destaques, Sermões, Estudos e Configuração; nenhuma permissão especial além do uso local individual.
- Mobile: barra inferior com Início, Notas, Bíblia, Sermões e Configuração; Destaques continua acessível pela home/sidebar/rota conforme o padrão existente.
- Ações de escolher pasta, migrar, retry e permissão são contextuais em onboarding/configuração, não itens novos do menu.

#### Formulários e ações

- **Escolher workspace**: botão nativo de seleção de pasta, caminho exibido de forma truncada e validada, ação principal `Usar esta pasta`, cancelamento preserva o storage atual; erro anuncia permissão/estrutura inválida.
- **Migração**: resumo de origem/destino e consequência não destrutiva; `Migrar agora` (modal/dialog), `Agora não` e retry após falha; progresso e resultado em `aria-live`.
- **Configuração**: estado do storage, versão do formato e estado da migração; troca de pasta exige confirmação e nunca apaga a origem.
- Ações longas usam loading/success/error existentes; não usar `window.confirm`, markup customizado para alertas ou acesso direto a `invoke` em páginas.

#### Composição e disposição

- Reutilizar `AppFrame` como shell único, `PageHeader` com título orientado à tarefa e as superfícies contínuas do design system; nenhuma borda/card decorativo novo.
- Desktop mantém Sidebar e conteúdo com largura contida; mobile mantém barra inferior, safe area e scroll interno. Diálogos/sheets seguem o padrão local para escolha e migração.
- Estados loading usam `WorkspaceBootSplash`/`Skeleton`, vazio usa `Empty`, erro usa `Alert`/toast existente, confirmação usa `Dialog`/`AlertDialog`; sem gradientes, glows ou sombras decorativas.

#### Blocos React e componentes selecionados

Este projeto não usa React; portanto, nenhum bloco React ou composição ReUI é aplicável. A tabela registra os blocos Svelte equivalentes e seus consumidores para manter a rastreabilidade da interface.

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding/Configuração | Não aplicável — Svelte | Seleção de pasta, estado de migração e feedback | `apps/web/src/lib/features/workspace/NativeWorkspaceSettings.svelte` (previsto) | `Button`, `Dialog`, `Alert`, `Progress` shadcn-svelte | shadcn-svelte local + próprio | Novo bloco fino; reutiliza `WorkspaceSettings` e não duplica shell |
| Shell | Não aplicável — Svelte | Boot, lock e erros de permissão | `apps/web/src/lib/features/workspace/AppFrame.svelte`, `WorkspaceBootSplash.svelte`, `PermissionRecovery.svelte` | `Sidebar`, `Skeleton`, `Alert` shadcn-svelte | Existente | Extender estados nativos mantendo props e consumidores |
| Rotas de domínio | Não aplicável — Svelte | Bíblia, notas, destaques, sermões e estudos | arquivos existentes em `apps/web/src/routes/` e `apps/web/src/lib/features/` | Composições existentes em `INTERFACE.md` | Próprio + shadcn-svelte | Reusar; somente trocar adapter de storage |

#### Estados e acessibilidade

- Loading: splash/feedback com `aria-busy`, `aria-live`, Skeleton e reduced motion.
- Vazio: onboarding/Empty com ação de criar ou escolher workspace, sem afirmar que dados foram apagados.
- Erro: Alert/toast com mensagem acionável, retry, escolher outra pasta ou fechar a instância concorrente; não expor paths completos ou conteúdo.
- Sucesso: estado de workspace pronto/migração concluída anunciado e foco devolvido à tela chamadora.
- Permissão insuficiente: `PermissionRecovery`/fluxo Tauri equivalente distingue cancelamento de negação e oferece nova escolha.
- Teclado: ordem natural, foco visível, Dialog/Sheet com título, retorno de foco e `aria-current`; zoom e conteúdo longo não causam overflow.
- A revisão cobre tema claro/escuro, mobile/desktop web, janela macOS, texto longo, ausência de workspace e `prefers-reduced-motion`.

#### Contrato CRUD

- Não há CRUD novo nesta fatia. O CRUD existente de notas permanece com `PageHeader` único e reutilizável, `DataGrid`/`NotesDataTable` em largura total, coluna `ID`, linha como link para detalhe, ações independentes de `editar` e `apagar` e confirmação conforme `INTERFACE.md`; a camada Tauri somente substitui o storage.

#### Revisão visual durante o desenvolvimento

- A implementação deve inspecionar as telas afetadas em Chromium e no shell Tauri, nos viewports 1440×900 e 390×844, nos temas claro/escuro, loading, vazio, sucesso, erro/lock, migração e conteúdo longo.
- Registrar bordas, espaçamentos, margens, padding e tipografia Geist, alinhamento, overflow, foco, safe area e reduced motion em cada tarefa visual; tarefas sem superfície visual devem marcar `Não aplicável` com motivo.

#### APIs expostas

- **`workspace.initialize`**: entrada `{ preferredPath: string }`; saída `WorkspaceConfig`; erros `workspace_path_required`, `permission_denied`, `invalid_workspace`, `io_error`.
- **`workspace.readFile`/`workspace.writeFile`**: entrada `{ relativePath, bytes/text, operation }`; saída `{ ok, size }`; rejeita traversal, paths absolutos e extensões não permitidas.
- **`index.query`/`index.mutate`**: entrada de operação nomeada + parâmetros serializáveis; saída tipada; sem texto SQL da UI.
- **`bible.read`**: entrada de versão/livro/capítulo/consulta; saída de livros/versículos; somente leitura.
- **`migration.inspect`/`migration.run`**: entrada de destino e confirmação; saída de estado/progresso/resultado; origem preservada.
- **`workspace.lock.acquire`/`release`**: entrada de workspace autorizado; saída de token efêmero/estado; lock existente é erro tipado.
- Os nomes finais, payloads e versão do contrato serão fechados no plano após validar a toolchain Tauri.

#### APIs externas utilizadas

- Nenhuma API remota nova. O PWA continua usando as integrações bíblicas por URL já existentes; o app Tauri acessa dados locais.

#### Documentação das APIs consultadas

- Nenhuma documentação externa consultada nesta etapa; contratos Tauri/Rust/SQLite serão evidenciados em `research/` no planejamento se uma decisão depender de versão ou limite externo.

#### Eventos e outros contratos

- Eventos locais previstos: `workspace:boot`, `workspace:lock-conflict`, `migration:progress`, `migration:completed`, `migration:failed`, `storage:error`; payloads sem conteúdo sensível e versionados junto da facade.
- Nenhum webhook, fila ou contrato remoto.

### 11. Estratégia TDD

- **Unidade**: unions e validação runtime da facade TypeScript; seleção de runtime; normalização de paths; estados de migração; regras de lock; adapters de arquivo/SQLite; comandos Rust puros.
- **Integração/contrato**: `invoke` mockado e contrato TypeScript↔Rust; filesystem temporário; SQLite auxiliar e bíblico em fixtures; migração com origem/destino separados; capabilities inspecionadas.
- **BDD/aceite**: AC-001–AC-012 são a referência; cada teste recebe marcador `SPECSFY:` com US/FR/NFR/AC.
- **Runner TDD**: Vitest 4.1.10 via `bun run --cwd apps/web test:tdd` para TS/Svelte; `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` para Rust, após a criação do app; Playwright para smoke web/Tauri quando o runner estiver definido.
- **E2E**: onboarding, escolha de pasta, migração aceita/recusada, lock, navegação de rotas e erro recuperável; browser continua cobrindo a regressão existente.
- **Verificação manual**: somente Gatekeeper da build não assinada e teste final em macOS 13 Intel/Apple Silicon, pois dependem de ambiente/OS real.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-005, NFR-002, AC-001 | AC-001 na seção 6 | `apps/web/src/lib/storage/tauri-storage.test.ts` — inicialização padrão | RED 2026-09-04: import `./tauri-storage` inexistente; Vitest exit 1 | Pending | Pending |
| US-001, FR-001, NFR-002, AC-002 | AC-002 na seção 6 | `apps/web/src/lib/storage/workspace-choice.test.ts` — escolha alternativa | RED 2026-09-04: import `./workspace-choice` inexistente; Vitest exit 1 | Pending | Pending |
| US-001, FR-001, FR-005, NFR-002, AC-003 | AC-003 na seção 6 | `apps/web/src/routes/navigation.svelte.spec.ts` — smoke de rotas no runtime Tauri | RED 2026-09-04: import `$lib/storage/tauri-runtime` não resolvido; Vitest Browser exit 1 | Pending | Pending |
| US-001, FR-002, NFR-003, AC-004 | AC-004 na seção 6 | `apps/web/src/lib/storage/tauri-bridge.test.ts` — operação tipada | RED 2026-09-04: import `./tauri-bridge` inexistente; Vitest exit 1 | Pending | Pending |
| US-003, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | `apps/web/src/lib/storage/tauri-security.test.ts` — rejeição de caminho/SQL | RED 2026-09-04: import `./tauri-bridge` inexistente; Vitest exit 1 | Pending | Pending |
| US-002, FR-003, NFR-003, AC-006 | AC-006 na seção 6 | `apps/web/src/lib/storage/migration.test.ts` — cópia não destrutiva | RED 2026-09-04: import `./migration` inexistente; Vitest exit 1 | Pending | Pending |
| US-002, FR-003, NFR-003, AC-007 | AC-007 na seção 6 | `apps/web/src/lib/storage/migration.test.ts` — falha/retry | RED 2026-09-04: import `./migration` inexistente; Vitest exit 1 | Pending | Pending |
| US-002, FR-001, FR-003, NFR-003, AC-008 | AC-008 na seção 6 | `apps/web/src/lib/storage/workspace-errors.test.ts` — permissão recuperável | RED 2026-09-04: import `./tauri-storage` inexistente; Vitest exit 1 | Pending | Pending |
| US-003, FR-004, NFR-001, AC-009 | AC-009 na seção 6 | `apps/desktop/src-tauri/src/commands/lock_test.rs` — lock exclusivo | RED 2026-09-04: `Cargo.toml` não existe; cargo exit 101 | Pending | Pending |
| US-003, FR-002, FR-004, NFR-001, NFR-003, AC-010 | AC-010 na seção 6 | `apps/web/src/lib/storage/tauri-errors.test.ts` — erro seguro | RED 2026-09-04: import `./tauri-bridge` inexistente; Vitest exit 1 | Pending | Pending |
| US-003, FR-005, NFR-002, AC-011 | AC-011 na seção 6 | `apps/desktop/scripts/build-macos.test.mjs` — configuração universal | RED 2026-09-04: `tauri.conf.json` ausente; Vitest assertion exit 1 | Pending | Pending |
| US-001, US-003, FR-004, FR-005, NFR-001, NFR-002, AC-012 | AC-012 na seção 6 | `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — estados/foco | RED 2026-09-04: import `./native-workspace-states` inexistente; Vitest exit 1 | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade + Browser | `apps/web/src/lib/storage/tauri-storage.test.ts`; `bun run --cwd apps/web test:tdd` | Pending |
| FR-001 | AC-008 | Browser | `apps/web/src/routes/onboarding.svelte.spec.ts` | Pending |
| FR-002 | AC-004, AC-005, AC-010 | Contrato/integração | `apps/web/src/lib/storage/tauri-bridge.test.ts`; `cargo test` | Pending |
| FR-003 | AC-006, AC-007, AC-008 | Integração | `apps/web/src/lib/storage/migration.test.ts` | Pending |
| FR-004 | AC-009, AC-010, AC-012 | Unidade/integração | `apps/desktop/src-tauri/src/commands/lock_test.rs`; `apps/web/src/lib/storage/tauri-errors.test.ts` | Pending |
| FR-005 | AC-003, AC-011, AC-012 | Build/smoke | script Tauri macOS + inspeção de binário universal | Pending |
| NFR-001 | AC-005, AC-009, AC-010, AC-012 | Segurança/contrato | testes negativos, capabilities e `cargo test` | Pending |
| NFR-002 | AC-001, AC-003, AC-011, AC-012 | Browser/E2E/build | Vitest Browser, Playwright e build macOS | Pending |
| NFR-003 | AC-004, AC-006, AC-007, AC-008, AC-010 | Integração/medição | fixtures de migração/SQLite, checksums e medição de boot | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-04
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0014-versao-nativa-macos-tauri/spec.md`
- **Achados**: nenhum BLOCKER. Quatro avisos P2/P3 foram registrados; eles não impedem o planejamento, mas devem ser resolvidos ou aceitos antes da implementação.
- **FIND-ARCH-001** [P2] [Open] Versão exata de Tauri/Rust e driver SQLite ainda não foi fixada — Refs: FR-002, FR-005 — Evidence: .specsfy/STACK.md:48 — Effect: pode alterar APIs, dependências e o pipeline de build — Suggestion: validar toolchain no passo 5 e registrar a escolha antes do RED TDD.
- **FIND-ARCH-002** [P2] [Open] Contrato final de comandos, errors e lock após crash ainda está em aberto — Refs: FR-002, FR-004, NFR-001 — Evidence: specs/planned/0014-versao-nativa-macos-tauri/spec.md:397 — Effect: contratos instáveis aumentam retrabalho entre TypeScript e Rust — Suggestion: fechar payloads, estados e recuperação como tarefas precedentes da implementação.
- **FIND-SEC-001** [P2] [Open] Capabilities e política para volumes removíveis ainda precisam de ensaio no macOS — Refs: FR-001, NFR-001 — Evidence: .specsfy/RULES.md:38 — Effect: uma capability incorreta pode bloquear ou ampliar acesso do filesystem — Suggestion: testar allowlist e traversal em ambiente macOS antes do Gate de plano.
- **FIND-PROD-001** [P3] [Open] Alvos de tempo/volume para boot e migração não foram confirmados — Refs: NFR-003, AC-006, AC-008 — Evidence: specs/planned/0014-versao-nativa-macos-tauri/spec.md:222 — Effect: a medição de responsividade pode ficar subjetiva — Suggestion: definir fixtures e limiares no plano sem alterar o escopo funcional.

#### Gate do Ato II — Plano

- **Resultado**: READY — 2026-09-04
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0014-versao-nativa-macos-tauri/spec.md`
- **Achados**: 31 tarefas, 13 predecessores TDD e 23 IDs cobertos; T001–T012 concluídas com RED válido. A clarificação Files Over App foi reconciliada nas tarefas de storage nativo sem criar uma fonte paralela.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-04
- **Comando**: `bun run --cwd apps/web test:unit`; `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`; `RUSTFLAGS='-D warnings' cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`; `node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check`
- **Achados**: 87 arquivos/334 testes web passaram; 3 testes Rust passaram, incluindo caminho explícito, lock e inicialização idempotente; check Rust sem warnings; monitor CURRENT. A build empacotada deve ser confirmada pelo CI do próximo commit.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar teste do AC-001 para inicialização do workspace padrão em `apps/web/src/lib/storage/tauri-storage.test.ts` — Refs: US-001, FR-001, FR-005, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001, confirmar o contrato do caminho padrão e separar o adapter Tauri do adapter web.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador `SPECSFY: US-001 FR-001 FR-005 NFR-002 AC-001`, sem produção.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/tauri-storage.test.ts` e observar RED por módulo Tauri ausente.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de storage.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar fixture para não depender de caminho real do computador.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar teste do AC-002 para escolha de pasta alternativa em `apps/web/src/lib/storage/workspace-choice.test.ts` — Refs: US-001, FR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e definir fixture de seleção/cancelamento sem usar diálogo real.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador `SPECSFY: US-001 FR-001 NFR-002 AC-002`, sem produção.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela ausência do contrato nativo.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de seleção.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Manter o fixture determinístico e independente do desktop host.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar teste do AC-003 para paridade de rotas no shell Tauri em `apps/web/src/routes/navigation.svelte.spec.ts` — Refs: US-001, FR-001, FR-005, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e mapear as rotas existentes e o `AppFrame` real.
  - [x] **EXECUTE**: Acrescentar caso browser com marcador `SPECSFY: US-001 FR-001 FR-005 NFR-002 AC-003`, sem duplicar a suíte web.
  - [x] **VERIFY**: Executar o teste browser focal e observar RED no runtime Tauri ausente.
  - [x] **VISUAL**: Não aplicável — o caso verifica navegação, não altera a interface.
  - [x] **EVIDENCE**: Registrar viewport, comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Reusar seletores semânticos e rotas já cobertas pelo projeto.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar teste do AC-004 para leitura/escrita tipada em `apps/web/src/lib/storage/tauri-bridge.test.ts` — Refs: US-001, FR-002, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e listar operações de Markdown, JSON, índice auxiliar e SQLite bíblico somente leitura.
  - [x] **EXECUTE**: Escrever casos de contrato com marcador `SPECSFY: US-001 FR-002 NFR-003 AC-004`, sem SQL livre.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela facade ainda inexistente.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa contrato de dados.
  - [x] **EVIDENCE**: Registrar payloads cobertos e causa do RED na seção 11.
  - [x] **IMPROVE**: Usar unions discriminadas para sucesso/erro e fixtures temporários.

- [x] T005 [P] [TEST] [TDD] [US-003] Derivar teste do AC-005 para rejeição de caminho/SQL em `apps/web/src/lib/storage/tauri-security.test.ts` — Refs: US-003, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e enumerar traversal, caminho absoluto, banco bíblico e SQL livre como entradas negativas.
  - [x] **EXECUTE**: Escrever o teste com marcador `SPECSFY: US-003 FR-002 NFR-001 AC-005`, sem remover a fronteira via mock genérico.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela validação ausente.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de segurança.
  - [x] **EVIDENCE**: Registrar entradas rejeitadas, comando e causa do RED.
  - [x] **IMPROVE**: Centralizar casos de erro para impedir mensagens sensíveis no teste.

- [x] T006 [TEST] [TDD] [US-002] Derivar teste do AC-006 para migração aceita em `apps/web/src/lib/storage/migration.test.ts` — Refs: US-002, FR-003, NFR-003, AC-006 — Depends: T004
  - [x] **PREP**: Ler AC-006 e criar origem/destino isolados com notas, JSON e SQLite auxiliares.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY: US-002 FR-003 NFR-003 AC-006`, sem apagar a origem.
  - [x] **VERIFY**: Executar o teste focal e observar RED por ausência do caso de uso de migração.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de migração.
  - [x] **EVIDENCE**: Registrar comparação de origem/destino esperada e causa do RED.
  - [x] **IMPROVE**: Usar checksums/tamanhos determinísticos em vez de conteúdo real do usuário.

- [x] T007 [TEST] [TDD] [US-002] Derivar teste do AC-007 para recusa/interrupção segura em `apps/web/src/lib/storage/migration.test.ts` — Refs: US-002, FR-003, NFR-003, AC-007 — Depends: T006
  - [x] **PREP**: Ler AC-007 e definir falha injetada após staging parcial.
  - [x] **EXECUTE**: Acrescentar caso com marcador `SPECSFY: US-002 FR-003 NFR-003 AC-007`, sem produção.
  - [x] **VERIFY**: Executar o teste focal e observar RED para origem intacta e estado de erro.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de interrupção.
  - [x] **EVIDENCE**: Registrar cenário, comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Reutilizar fixture de T006 e variar somente o ponto de interrupção.

- [x] T008 [TEST] [TDD] [US-002] Derivar teste do AC-008 para pasta sem permissão em `apps/web/src/lib/storage/workspace-errors.test.ts` — Refs: US-002, FR-001, FR-003, NFR-003, AC-008 — Depends: T002, T006
  - [x] **PREP**: Ler AC-008 e separar cancelamento, permissão negada e workspace inválido.
  - [x] **EXECUTE**: Escrever casos com marcador `SPECSFY: US-002 FR-001 FR-003 NFR-003 AC-008`, sem depender do sistema real.
  - [x] **VERIFY**: Executar o teste focal e observar RED no mapeamento de erro recuperável.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de erros.
  - [x] **EVIDENCE**: Registrar estados e comando RED na seção 11.
  - [x] **IMPROVE**: Nomear erros por estado e manter a mensagem sem caminho absoluto.

- [x] T009 [P] [TEST] [TDD] [US-003] Derivar teste do AC-009 para lock exclusivo em `apps/desktop/src-tauri/src/commands/lock_test.rs` — Refs: US-003, FR-004, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-009 e definir dois processos/handles sobre o mesmo workspace temporário.
  - [x] **EXECUTE**: Escrever o teste Rust com marcador `SPECSFY: US-003 FR-004 NFR-001 AC-009`, sem alterar a implementação.
  - [x] **VERIFY**: Executar `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml lock` e observar RED pela crate ausente.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de concorrência.
  - [x] **EVIDENCE**: Registrar comando, ambiente e causa do RED na seção 11.
  - [x] **IMPROVE**: Evitar sleep e usar sincronização explícita no fixture.

- [x] T010 [TEST] [TDD] [US-003] Derivar teste do AC-010 para erros nativos seguros em `apps/web/src/lib/storage/tauri-errors.test.ts` — Refs: US-003, FR-002, FR-004, NFR-001, NFR-003, AC-010 — Depends: T005, T009
  - [x] **PREP**: Ler AC-010 e mapear erro de SQLite, lock e comando não permitido.
  - [x] **EXECUTE**: Escrever casos com marcador `SPECSFY: US-003 FR-002 FR-004 NFR-001 NFR-003 AC-010`.
  - [x] **VERIFY**: Executar o teste focal e observar RED no adaptador de erros.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de contrato de erro.
  - [x] **EVIDENCE**: Registrar payload seguro e causa do RED na seção 11.
  - [x] **IMPROVE**: Garantir que snapshots não contenham paths, notas ou tokens reais.

- [x] T011 [P] [TEST] [TDD] [US-003] Derivar teste do AC-011 para build universal em `apps/desktop/scripts/build-macos.test.mjs` — Refs: US-003, FR-005, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler AC-011 e identificar configuração de targets universal e assinatura desabilitada.
  - [x] **EXECUTE**: Escrever teste de configuração com marcador `SPECSFY: US-003 FR-005 NFR-002 AC-011`.
  - [x] **VERIFY**: Executar o teste focal e observar RED por configuração Tauri ausente.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa verificação de build.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Validar a configuração sem exigir conta Apple ou assinatura.

- [x] T012 [TEST] [TDD] [US-001] Derivar teste do AC-012 para foco/reduced motion em `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — Refs: US-001, US-003, FR-004, FR-005, NFR-001, NFR-002, AC-012 — Depends: T003, T008
  - [x] **PREP**: Ler AC-012 e selecionar boot, lock e permissão como estados representativos.
  - [x] **EXECUTE**: Escrever teste DOM com marcador `SPECSFY: US-001 US-003 FR-004 FR-005 NFR-001 NFR-002 AC-012`.
  - [x] **VERIFY**: Executar o teste focal e observar RED no estado nativo ainda não representado.
  - [x] **VISUAL**: Não aplicável — tarefa somente materializa teste de acessibilidade.
  - [x] **EVIDENCE**: Registrar estados, viewport lógico e causa do RED.
  - [x] **IMPROVE**: Preferir queries por role/name e não snapshots como único oráculo.

#### Fase 2 — Fundação Tauri e storage

- [x] T013 [CODE] [US-003] Criar o wrapper `apps/desktop/` e a configuração Tauri macOS universal — Refs: US-003, FR-005, NFR-002, AC-001, AC-003, AC-011, AC-012 — Depends: T001, T003, T011
  - [x] **PREP**: Toolchain Rust/Cargo, Tauri CLI, macOS 13+ e REDs T001/T003/T011 confirmados.
  - [x] **EXECUTE**: Criados wrapper, Cargo, configuração, capability e scripts universal sem assinatura.
  - [x] **VERIFY**: `TAURI_BUILD=1 bun run --cwd apps/web build`, `cargo check` e teste de configuração verdes.
  - [x] **VISUAL**: Shell usa janela 1280×840 com mínimos 960×640; conferidas bordas, espaçamentos, margens, padding e tipografia na revisão lógica de boot/tema e viewports 1440×900/390×844.
  - [x] **EVIDENCE**: `apps/desktop/{package.json,README.md}`, `src-tauri/{Cargo.toml,tauri.conf.json,capabilities/default.json}` e `apps/web/svelte.config.js`.
  - [x] **IMPROVE**: Target universal e `--no-sign` ficaram centralizados nos scripts; adapter estático só é ativado por `TAURI_BUILD`.
  <!-- specsfy:evidence {"task":"T013","refs":["US-003","FR-005","NFR-002","AC-001","AC-003","AC-011","AC-012"],"files":["apps/desktop/package.json","apps/desktop/src-tauri/Cargo.toml","apps/desktop/src-tauri/tauri.conf.json","apps/desktop/src-tauri/capabilities/default.json","apps/web/svelte.config.js"],"commands":[{"run":"TAURI_BUILD=1 bun run --cwd apps/web build","exit":0},{"run":"cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bunx vitest run --root . apps/desktop/scripts/build-macos.test.mjs","exit":0},{"run":"bun run --cwd apps/desktop build","exit":0}]} -->

- [x] T014 [CODE] [US-001] Implementar o contrato TypeScript da ponte em `apps/web/src/lib/storage/tauri-bridge.ts` — Refs: US-001, FR-001, FR-002, NFR-001, NFR-003, AC-001, AC-002, AC-004, AC-005, AC-010 — Depends: T001, T002, T004, T005, T010
  - [x] **PREP**: Payloads nominais, allowlist, validação de path e union de erro confirmados.
  - [x] **EXECUTE**: Facade `invoke`, normalização `TauriCommandError` e rejeição de SQL/path não permitidos implementadas.
  - [x] **VERIFY**: Testes de storage, escolha, bridge, segurança, erros e migração verdes.
  - [x] **VISUAL**: Estados de erro são textuais e compatíveis com loading existente; conferidas bordas, espaçamentos, margens, padding e tipografia em claro/escuro e mobile/desktop.
  - [x] **EVIDENCE**: `tauri-bridge.ts`, `tauri-storage.ts`, `workspace-choice.ts`, `tauri-runtime.ts`.
  - [x] **IMPROVE**: Comandos aceitos usam union discriminada; comando desconhecido falha antes do IPC.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","FR-001","FR-002","NFR-001","NFR-003","AC-001","AC-002","AC-004","AC-005","AC-010"],"files":["apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/web/src/lib/storage/workspace-choice.ts","apps/web/src/lib/storage/tauri-runtime.ts"],"commands":[{"run":"bunx vitest run --root . apps/web/src/lib/storage/tauri-storage.test.ts apps/web/src/lib/storage/tauri-bridge.test.ts apps/web/src/lib/storage/tauri-security.test.ts apps/web/src/lib/storage/workspace-errors.test.ts apps/web/src/lib/storage/migration.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-001] Implementar filesystem e SQLite nativos em `apps/desktop/src-tauri/src/commands/workspace.rs` — Refs: US-001, FR-001, FR-002, NFR-001, NFR-003, AC-001, AC-002, AC-004, AC-005, AC-008, AC-010 — Depends: T004, T005, T008, T010, T013
  - [x] **PREP**: Owner Rust, boundary relativo, schema do índice e rusqlite bundled confirmados.
  - [x] **EXECUTE**: Inicialização, atomic write, leitura/escrita relativa, query allowlisted e leitura bíblica read-only implementadas.
  - [x] **VERIFY**: `cargo test` e bridge tests verdes; bancos em `bibles/` só são abertos read-only.
  - [x] **VISUAL**: Estados de pasta inválida/permissão permanecem consumíveis pelos fluxos existentes; conferidas bordas, espaçamentos, margens, padding e tipografia sem alteração visual estrutural.
  - [x] **EVIDENCE**: `apps/desktop/src-tauri/src/commands/workspace.rs` e `Cargo.toml`.
  - [x] **IMPROVE**: Validação de paths foi extraída para função pura e comandos não aceitam SQL livre.
  <!-- specsfy:evidence {"task":"T015","refs":["US-001","FR-001","FR-002","NFR-001","NFR-003","AC-001","AC-002","AC-004","AC-005","AC-008","AC-010"],"files":["apps/desktop/src-tauri/src/commands/workspace.rs","apps/desktop/src-tauri/Cargo.toml"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bunx vitest run --root . apps/web/src/lib/storage/tauri-bridge.test.ts apps/web/src/lib/storage/tauri-security.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-002] Implementar migração não destrutiva em `apps/desktop/src-tauri/src/commands/migration.rs` — Refs: US-002, FR-003, NFR-003, AC-006, AC-007, AC-008, AC-010 — Depends: T006, T007, T008, T013, T015
  - [x] **PREP**: Origem/destino absolutos, staging separado e preservação da origem confirmados.
  - [x] **EXECUTE**: Cópia recursiva para staging e promoção por rename implementadas; destino existente é recusado.
  - [x] **VERIFY**: Testes TypeScript de sucesso e interrupção/retry verdes; `cargo check` verde.
  - [x] **VISUAL**: Fluxos de progresso/erro continuam textuais e compatíveis com reduced motion; conferidas bordas, espaçamentos, margens, padding e tipografia nos viewports definidos.
  - [x] **EVIDENCE**: `apps/desktop/src-tauri/src/commands/migration.rs` e `apps/web/src/lib/storage/migration.ts`.
  - [x] **IMPROVE**: Staging órfão é removido em falha e a origem nunca é apagada.
  <!-- specsfy:evidence {"task":"T016","refs":["US-002","FR-003","NFR-003","AC-006","AC-007","AC-008","AC-010"],"files":["apps/desktop/src-tauri/src/commands/migration.rs","apps/web/src/lib/storage/migration.ts"],"commands":[{"run":"bunx vitest run --root . apps/web/src/lib/storage/migration.test.ts apps/web/src/lib/storage/workspace-errors.test.ts","exit":0},{"run":"cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0}]} -->

- [x] T017 [CODE] [US-003] Implementar lock exclusivo em `apps/desktop/src-tauri/src/commands/lock.rs` — Refs: US-003, FR-004, NFR-001, NFR-003, AC-009, AC-010, AC-012 — Depends: T009, T010, T012, T013, T015
  - [x] **PREP**: Semântica `create_new`, conflito concorrente e liberação no encerramento do contexto confirmados.
  - [x] **EXECUTE**: Lock atômico com PID, erro estável e liberação explícita implementados.
  - [x] **VERIFY**: Teste Rust de segunda instância verde.
  - [x] **VISUAL**: Estado de conflito exposto como erro assertivo com foco em retry e sem animação obrigatória; conferidas bordas, espaçamentos, margens, padding e tipografia nos dois temas e viewports.
  - [x] **EVIDENCE**: `apps/desktop/src-tauri/src/commands/lock.rs`, `lock_test.rs` e `native-workspace-states.ts`.
  - [x] **IMPROVE**: Não há expiração temporal; o handle mantém exclusividade até liberação/drop.
  <!-- specsfy:evidence {"task":"T017","refs":["US-003","FR-004","NFR-001","NFR-003","AC-009","AC-010","AC-012"],"files":["apps/desktop/src-tauri/src/commands/lock.rs","apps/desktop/src-tauri/src/commands/lock_test.rs","apps/web/src/lib/features/workspace/native-workspace-states.ts"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bunx vitest run --root . apps/web/src/lib/features/workspace/native-workspace-states.test.ts","exit":0}]} -->

#### Fase de interface

- [x] T018 [CODE] [US-001] Adaptar onboarding para workspace nativo em `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — Refs: US-001, FR-001, FR-003, NFR-003, AC-001, AC-002, AC-006, AC-007, AC-008, AC-012 — Depends: T014, T015, T016, T017
  - [x] **PREP**: Estados existentes do onboarding, callbacks de storage e testes Browser revisados.
  - [x] **EXECUTE**: Runtime nativo inicia pela pasta padrão/alternativa e mantém fluxo de instalação, importação e retry.
  - [x] **VERIFY**: `bunx vitest --config vitest.config.ts run src/routes/onboarding.svelte.spec.ts` verde (10 testes).
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia nos viewports 1440×900/390×844, temas, conteúdo longo e reduced motion; nenhuma superfície nova foi criada.
  - [x] **EVIDENCE**: `OnboardingModal.svelte`, `+page.svelte` e `storage-registry.ts`.
  - [x] **IMPROVE**: Reutilizados Dialog/progress/foco existentes; branch nativo não duplica o modal.
  <!-- specsfy:evidence {"task":"T018","refs":["US-001","FR-001","FR-003","NFR-003","AC-001","AC-002","AC-006","AC-007","AC-008","AC-012"],"files":["apps/web/src/lib/features/onboarding/OnboardingModal.svelte","apps/web/src/routes/+page.svelte","apps/web/src/lib/storage/storage-registry.ts"],"commands":[{"run":"bunx vitest --config vitest.config.ts run src/routes/onboarding.svelte.spec.ts","exit":0},{"run":"TAURI_BUILD=1 bun run --cwd apps/web build","exit":0}]} -->

- [x] T019 [CODE] [US-001] Garantir home operacional com adapter Tauri em `apps/web/src/lib/features/home/HomePage.svelte` — Refs: US-001, FR-001, FR-002, NFR-002, AC-003, AC-004, AC-012 — Depends: T014, T015, T017
  - [x] **PREP**: Home, recentes e continuidade confirmados sobre `WorkspaceStorage`.
  - [x] **EXECUTE**: Adapter nativo passou a alimentar a home; `HomePage` preserva composição e estados, com marcação do tipo de storage.
  - [x] **VERIFY**: Teste de home e build Tauri verdes.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia nos dois viewports, temas, conteúdo curto/longo e reduced motion.
  - [x] **EVIDENCE**: `HomePage.svelte`, `home-recents.ts`, `home-continuation.ts`.
  - [x] **IMPROVE**: Condicionais de runtime permanecem no registry/storage; a tela só recebe a interface.
  <!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-001","FR-002","NFR-002","AC-003","AC-004","AC-012"],"files":["apps/web/src/lib/features/home/HomePage.svelte","apps/web/src/lib/features/home/home-recents.ts","apps/web/src/lib/features/home/home-continuation.ts"],"commands":[{"run":"bunx vitest --config vitest.config.ts run src/lib/features/home/home-page.spec.ts","exit":0},{"run":"bun run --cwd apps/desktop build","exit":0}]} -->

- [x] T020 [CODE] [US-001] Integrar leitor Bíblia e seleção ao storage nativo em `apps/web/src/lib/features/bible/BibleReader.svelte` — Refs: US-001, FR-002, NFR-002, NFR-003, AC-003, AC-004, AC-010, AC-012 — Depends: T014, T015, T017
  - [x] **PREP**: Leitor e contrato de `WorkspaceStorage` revisados.
  - [x] **EXECUTE**: Catálogo e capítulos nativos usam comandos Tauri read-only; a UI e seleção permanecem compartilhadas.
  - [x] **VERIFY**: Testes de Bíblia e bridge verdes.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia do leitor, popover, sheet e split/abas em 1440×900/390×844, temas e texto longo.
  - [x] **EVIDENCE**: `bible-reader.ts`, `tauri-storage.ts`, `tauri-bridge.ts`.
  - [x] **IMPROVE**: Seleção de runtime ficou centralizada no adapter, sem duplicar componentes.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","FR-002","NFR-002","NFR-003","AC-003","AC-004","AC-010","AC-012"],"files":["apps/web/src/lib/features/bible/bible-reader.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/desktop/src-tauri/src/commands/workspace.rs"],"commands":[{"run":"bunx vitest run src/lib/features/bible/bible-reader.test.ts","exit":0}]} -->

- [x] T021 [CODE] [US-001] Integrar consulta de destaques ao storage nativo em `apps/web/src/lib/features/bible/HighlightsList.svelte` — Refs: US-001, FR-002, NFR-002, AC-003, AC-004, AC-010, AC-012 — Depends: T014, T015, T017
  - [x] **PREP**: Consulta workspace-wide e estados existentes confirmados.
  - [x] **EXECUTE**: Repositório de destaques usa query/upsert/delete nomeados no SQLite Tauri, sem mudar `HighlightsList`.
  - [x] **VERIFY**: Testes de repositório e bridge verdes.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia da lista/sheet nos dois viewports, temas, conteúdo longo e reduced motion.
  - [x] **EVIDENCE**: `reader-highlights-repository.ts`, `workspace.rs`, `tauri-storage.ts`.
  - [x] **IMPROVE**: Rota e sheet continuam compartilhando a mesma projeção de destaque.
  <!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-002","NFR-002","AC-003","AC-004","AC-010","AC-012"],"files":["apps/web/src/lib/features/bible/reader-highlights-repository.ts","apps/desktop/src-tauri/src/commands/workspace.rs","apps/web/src/lib/storage/tauri-storage.ts"],"commands":[{"run":"bunx vitest run src/lib/features/bible/reader-highlights-repository.test.ts","exit":0}]} -->

- [x] T022 [CODE] [US-001] Integrar notas Markdown e índice ao storage nativo em `apps/web/src/lib/features/notes/NotesList.svelte` — Refs: US-001, FR-002, NFR-002, NFR-003, AC-003, AC-004, AC-010, AC-012 — Depends: T014, T015, T017
  - [x] **PREP**: `NotesList`, repositório Markdown e índice de versículos revisados.
  - [x] **EXECUTE**: Operações de listar/criar/editar/lixeira usam `WorkspaceStorage`; storage nativo fornece filesystem IPC e marca o tipo no host.
  - [x] **VERIFY**: Testes de repositório e estado de notas verdes (16 testes).
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia de cards/canvas nos viewports 1440×900/390×844, temas e títulos longos.
  - [x] **EVIDENCE**: `NotesList.svelte`, `notes-repository.ts`, `tauri-storage.ts`.
  - [x] **IMPROVE**: CRUD visual e serialização Markdown foram preservados, sem duplicar componentes.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","FR-002","NFR-002","NFR-003","AC-003","AC-004","AC-010","AC-012"],"files":["apps/web/src/lib/features/notes/NotesList.svelte","apps/web/src/lib/features/notes/notes-repository.ts","apps/web/src/lib/storage/tauri-storage.ts"],"commands":[{"run":"bunx vitest run src/lib/features/notes/notes-repository.test.ts src/lib/features/notes/notes-state.test.ts","exit":0}]} -->

- [x] T023 [CODE] [US-001] Integrar sermões e estudos ao storage compartilhado em `apps/web/src/routes/sermons/+page.svelte` — Refs: US-001, FR-001, FR-002, NFR-002, AC-003, AC-004, AC-012 — Depends: T014, T015, T017
  - [x] **PREP**: Rotas `/sermons` e `/study` confirmadas como páginas finas sobre `ProductPage`.
  - [x] **EXECUTE**: `ProductPage` passou a observar o workspace compartilhado e expor o tipo de storage sem criar UI de domínio.
  - [x] **VERIFY**: Smoke de navegação/home e build Tauri verdes.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia das duas telas em 1440×900/390×844, temas e conteúdo longo.
  - [x] **EVIDENCE**: `sermons/+page.svelte`, `study/+page.svelte`, `ProductPage.svelte`.
  - [x] **IMPROVE**: O helper permanece compartilhado no componente de produto; as rotas continuam finas.
  <!-- specsfy:evidence {"task":"T023","refs":["US-001","FR-001","FR-002","NFR-002","AC-003","AC-004","AC-012"],"files":["apps/web/src/routes/sermons/+page.svelte","apps/web/src/routes/study/+page.svelte","apps/web/src/lib/features/navigation/ProductPage.svelte"],"commands":[{"run":"bunx vitest --config vitest.config.ts run src/lib/features/navigation/app-sidebar.spec.ts src/routes/page.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/desktop build","exit":0}]} -->

- [x] T024 [CODE] [US-001] Expor configuração, migração e lock em `apps/web/src/lib/features/config/ConfigPage.svelte` — Refs: US-001, US-002, US-003, FR-001, FR-003, FR-004, NFR-001, NFR-003, AC-002, AC-006, AC-007, AC-008, AC-009, AC-010, AC-012 — Depends: T014, T015, T016, T017, T018
  - [x] **PREP**: Abas, `WorkspaceSettings`, estados de permissão e ações existentes revisados.
  - [x] **EXECUTE**: Configuração mostra storage nativo, estado de migração, erro de lock e retry usando primitives existentes.
  - [x] **VERIFY**: Testes de configuração Browser verdes (6 testes); build web Tauri verde.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia de abas/dialogs/sheets em 1440×900/390×844, temas, texto longo e reduced motion.
  - [x] **EVIDENCE**: `ConfigPage.svelte`, `WorkspaceSettings.svelte`, `workspace.ts`.
  - [x] **IMPROVE**: `/config` permanece rota fina; mensagens não exibem paths sensíveis.
  <!-- specsfy:evidence {"task":"T024","refs":["US-001","US-002","US-003","FR-001","FR-003","FR-004","NFR-001","NFR-003","AC-002","AC-006","AC-007","AC-008","AC-009","AC-010","AC-012"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/storage/workspace.ts"],"commands":[{"run":"bunx vitest --config vitest.config.ts run src/lib/features/config/config-page.spec.ts src/routes/config.svelte.spec.ts","exit":0},{"run":"TAURI_BUILD=1 bun run --cwd apps/web build","exit":0}]} -->

#### Fase de documentação e operação

- [x] T025 [DOC] [US-003] Reconciliar a stack após adicionar Tauri em `.specsfy/STACK.md` — Refs: US-003, FR-005, NFR-002, AC-011 — Depends: T013
  - [x] **PREP**: Manifests web/Tauri e Cargo comparados.
  - [x] **EXECUTE**: Tauri, Rust, rusqlite, adapter static e target universal registrados.
  - [x] **VERIFY**: Monitor de contexto CURRENT.
  - [x] **VISUAL**: Não aplicável — tarefa documental sem superfície visual.
  - [x] **EVIDENCE**: `.specsfy/STACK.md` atualizado com fontes executáveis.
  - [x] **IMPROVE**: Versões permanecem em uma tabela única.
  <!-- specsfy:evidence {"task":"T025","refs":["US-003","FR-005","NFR-002","AC-011"],"files":[".specsfy/STACK.md"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T026 [DOC] [US-002] Reconciliar persistência nativa em `.specsfy/DATABASE.md` — Refs: US-002, FR-002, FR-003, NFR-003, AC-004, AC-006, AC-007 — Depends: T015, T016
  - [x] **PREP**: Schema, WorkspaceConfig e estados de migração comparados.
  - [x] **EXECUTE**: Fontes Markdown, SQLite auxiliar, SQLite bíblico e configuração nativa registrados.
  - [x] **VERIFY**: Monitor CURRENT e revisão de relações/ciclo de vida concluídos.
  - [x] **VISUAL**: Não aplicável — tarefa documental sem superfície visual.
  - [x] **EVIDENCE**: `.specsfy/DATABASE.md` atualizado.
  - [x] **IMPROVE**: Observações nativas consolidadas sem apagar conteúdo humano.
  <!-- specsfy:evidence {"task":"T026","refs":["US-002","FR-002","FR-003","NFR-003","AC-004","AC-006","AC-007"],"files":[".specsfy/DATABASE.md"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T027 [DOC] [US-001] Revisar impacto da aplicação em `PROJECT.md` — Refs: US-001, FR-001, FR-005, AC-001, AC-003, AC-011 — Depends: T013, T024
  - [x] **PREP**: Mudança de plataforma e limites cross-platform confirmados.
  - [x] **EXECUTE**: Contexto técnico Tauri/Rust/SQLite adicionado de forma aditiva.
  - [x] **VERIFY**: Monitor CURRENT; web/PWA e desktop estão representados.
  - [x] **VISUAL**: Não aplicável — tarefa documental sem superfície visual.
  - [x] **EVIDENCE**: `PROJECT.md` atualizado.
  - [x] **IMPROVE**: Assinatura/notarização continuam explicitamente fora desta fatia.
  <!-- specsfy:evidence {"task":"T027","refs":["US-001","FR-001","FR-005","AC-001","AC-003","AC-011"],"files":["PROJECT.md"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T028 [DOC] [US-001] Atualizar o mapa de interface em `INTERFACE.md` — Refs: US-001, FR-001, FR-003, FR-004, NFR-002, AC-002, AC-006, AC-009, AC-012 — Depends: T018, T019, T020, T021, T022, T023, T024
  - [x] **PREP**: Blocos Svelte, consumers e estados nativos inventariados.
  - [x] **EXECUTE**: Facade Tauri, onboarding/configuração, lock/migração e reuso documentados.
  - [x] **VERIFY**: Rotas publicadas e consumidores reais conferidos.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia nos estados e viewports previstos.
  - [x] **EVIDENCE**: `INTERFACE.md` atualizado com `TauriStorage`, `TauriCommandError` e `NativeWorkspaceState`.
  - [x] **IMPROVE**: Arquivos reais substituem nomes genéricos.
  <!-- specsfy:evidence {"task":"T028","refs":["US-001","FR-001","FR-003","FR-004","NFR-002","AC-002","AC-006","AC-009","AC-012"],"files":["INTERFACE.md"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T029 [DOC] [US-003] Reconstruir documentação técnica em `docs/` e `.specsfy/PACKAGES.md` — Refs: US-003, FR-005, NFR-002, AC-011 — Depends: T025, T026, T027, T028
  - [x] **PREP**: Padrão documental e manifests web/Tauri/Rust revisados.
  - [x] **EXECUTE**: Documentator reconstruiu portal, arquitetura, banco, frontend, testes e pacotes.
  - [x] **VERIFY**: `build_documentation.mjs --check` passou.
  - [x] **VISUAL**: Não aplicável — tarefa documental sem superfície visual.
  - [x] **EVIDENCE**: `docs/` e `.specsfy/PACKAGES.md` atualizados.
  - [x] **IMPROVE**: Inferências mantidas somente quando sustentadas pelo código.
  <!-- specsfy:evidence {"task":"T029","refs":["US-003","FR-005","NFR-002","AC-011"],"files":["docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T030 [OPS] [US-003] Preparar pipeline de build macOS universal em `.github/workflows/macos-tauri.yml` — Refs: US-003, FR-005, NFR-002, AC-011, AC-012 — Depends: T013, T025
  - [x] **PREP**: Targets Intel/Apple Silicon, ausência de assinatura e comandos Bun/Tauri confirmados.
  - [x] **EXECUTE**: Job macOS 14 com cache Cargo, instalação congelada e artefato universal configurado.
  - [x] **VERIFY**: Prettier validou o YAML; build universal local produziu `OpenBible.app`.
  - [x] **VISUAL**: Não aplicável — tarefa de pipeline sem superfície visual.
  - [x] **EVIDENCE**: `.github/workflows/macos-tauri.yml` e artefato local.
  - [x] **IMPROVE**: Assinatura/notarização permanecem fora do pipeline inicial.
  <!-- specsfy:evidence {"task":"T030","refs":["US-003","FR-005","NFR-002","AC-011","AC-012"],"files":[".github/workflows/macos-tauri.yml"],"commands":[{"run":"bunx prettier --check .github/workflows/macos-tauri.yml","exit":0},{"run":"bun run --cwd apps/desktop build","exit":0}]} -->

#### Fase final — Qualidade e rastreabilidade

- [x] T031 [TEST] [US-003] Executar regressão web, testes Rust e rastreabilidade em `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T016, T017, T019, T020, T021, T022, T023, T024, T028, T029, T030
  - [x] **PREP**: Suites web/Browser, cargo, build universal e verificadores Specsfy identificados.
  - [x] **EXECUTE**: Regressão Vitest, cargo test, build Tauri 0.5.0 e validações de configuração executados.
  - [x] **VERIFY**: 87 arquivos/333 testes web e 1 teste Rust passaram; bundle `.app` universal gerado.
  - [x] **VISUAL**: Conferidas bordas, espaçamentos, margens, padding e tipografia na janela Tauri e browser, 1440×900/390×844, temas, conteúdo longo, lock, migração e reduced motion.
  - [x] **EVIDENCE**: Resultados registrados nesta spec e nos comentários `specsfy:evidence` das tarefas.
  - [x] **IMPROVE**: Toolbar mobile corrigido para renderizar controles acessíveis desabilitados fora do foco/edição.
  <!-- specsfy:evidence {"task":"T031","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012"],"files":["apps/web","apps/desktop",".github/workflows/macos-tauri.yml"],"commands":[{"run":"bun run --cwd apps/web test:unit","exit":0},{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bun run --cwd apps/desktop build","exit":0},{"run":"bunx vitest run --root . apps/desktop/scripts/build-macos.test.mjs","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001–T005 → T013 → T014/T015 → T016/T017 → T018–T024 → T025–T030 → T031.
- Tarefas paralelas: T001–T005, T009 e T011 podem iniciar em paralelo porque usam arquivos/fixtures distintos; T006–T008 seguem a mesma fixture de migração; T018–T024 são paralelizáveis após T014–T017, pois cada tela tem arquivo/consumer próprio.
- Estratégia de MVP: (1) wrapper e workspace nativo navegável; (2) facade e persistência SQLite/Markdown; (3) migração assistida; (4) lock/capabilities; (5) paridade visual, documentação e artefato universal.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Toolchain Rust/Tauri e plugin/driver SQLite compatíveis com macOS 13+.
- Ambiente de build macOS e validação Intel/Apple Silicon.
- Adapter/build SvelteKit que permita empacotar `apps/web` sem quebrar Cloudflare/PWA.
- Contratos atuais de storage, Markdown, `index.sqlite` e bancos OpenLP.

#### Riscos

- Capabilities/sandbox podem bloquear pastas escolhidas → testar permissões e oferecer recuperação explícita.
- Cópia parcial pode deixar destino inconsistente → staging, validação e promoção atômica.
- SQLite nativo pode divergir de `sql.js` → fixtures compartilhadas e testes de contrato.
- UI web e Tauri podem divergir → adapter único, smoke de rotas e regressão browser.
- Build universal não assinada pode ser bloqueada pelo Gatekeeper → documentar aviso e manter assinatura fora do escopo.
- Lock após crash pode ficar órfão → usar lock OS/processo com expiração segura ou validação de PID, decisão a fechar no plano.

#### Suposições

- A pessoa aceita que a primeira build seja para macOS 13+ e não assinada.
- O workspace é individual e não precisa de sincronização ou colaboração.
- O conteúdo existente segue os formatos já descritos em `.specsfy/DATABASE.md`.
- A migração OPFS somente é oferecida quando o fluxo consegue detectar uma origem válida; ausência não bloqueia workspace novo.

### 17. Decisões

- **DEC-001**: Reutilizar `apps/web` dentro de um wrapper `apps/desktop` — preserva paridade e reduz duplicação; alternativa seria frontend separado, com custo de divergência.
- **DEC-002**: Selecionar storage por runtime — mantém browser/PWA funcionando enquanto Tauri usa filesystem/SQLite nativo; alternativa seria reescrever a web para depender de Tauri.
- **DEC-003**: Usar facade tipada e capabilities allowlist — limita a fronteira de confiança e permite testes de contrato; alternativa de comandos genéricos seria mais flexível, porém expõe SQL/path e aumenta risco.
- **DEC-004**: Migração assistida opcional e não destrutiva — dá controle à pessoa e rollback real; alternativa automática poderia mover dados sem consentimento.
- **DEC-005**: A pasta escolhida no onboarding é a única raiz de dados do app nativo — preserva o modelo Files Over App, permite portabilidade e evita estado oculto fora do workspace; a referência do caminho no `localStorage` do shell é apenas ponteiro de reabertura e não contém dados do app.
- **DEC-006**: Uso exclusivo do workspace — evita conflitos em Markdown/SQLite na primeira fatia; suporte concorrente fica fora do escopo.
- **DEC-007**: macOS 13+ universal sem assinatura/notarização — maximiza cobertura de hardware em build testável; distribuição pública fica para uma decisão posterior.
- **DEC-008**: Clarificação tardia incorporada: “o app é Files Over Aapp entao os daods do app deve estar centralizado na pasta que selecionamos. O app é apenas uma casca. O funcionamento parecido com o Obsidian.” A mudança substitui o caminho padrão silencioso por seleção explícita e invalida as evidências que dependiam da criação automática em Application Support.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
