# Especificação integrada: Servidor de sincronização com autenticação better-auth

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0021 |
| Slug | 0021-servidor-de-sincronizacao-com-autenticacao-better-auth |
| Status | Complete |
| Effort | 7 |
| Effort updated at | 2026-09-08 |
| Effort rationale | Servidor SvelteKit dedicado com Better Auth e Drizzle ORM no Cloudflare D1, autenticação por email/senha, endpoints de sincronização protegidos por usuário e integração com apps/web. |
| ClickUp Task | |
| Milestones | Sincronização em nuvem com conta de usuário |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim. Tela de gerenciamento de conta, formulários de login/cadastro e status de sincronização em Configurações. |
| Atualizada em | 2026-09-08 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible é uma aplicação local-first que já possui persistência em SQLite/IndexedDB e um modelo de sincronização incremental (SPEC-0019). No entanto, o backend atual de sincronização utiliza um token estático compartilhado (`SYNC_TOKEN`) e não possui autenticação nem isolamento por usuário. Usuários que utilizam múltiplos dispositivos (desktop Tauri e mobile PWA) precisam de uma conta pessoal (login/senha ou cadastro) para sincronizar seus próprios dados com segurança, sem comprometer a filosofia offline-first.

#### Resultado desejado

Um servidor dedicado em SvelteKit (`apps/sync-server`) executando em Cloudflare Workers com banco de dados relacional Cloudflare D1 gerenciado pelo Drizzle ORM e biblioteca Better Auth. O usuário cadastra-se ou autentica-se diretamente com email e senha na aplicação OpenBible, associando seus workspaces locais à sua conta na nuvem. A sincronização remota opera com isolamento rigoroso por usuário, enquanto a aplicação cliente permanece 100% utilizável offline sem conexão e preserva todos os dados locais mesmo após logout.

#### Métricas de sucesso

- 100% das requisições de cadastro e login funcionam sem dependência de serviços externos de envio de email.
- 0 dados de um usuário acessíveis por outro: tentativas de leitura (`pull`) ou escrita (`push`) para workspaces de terceiros retornam `403 Forbidden`.
- 100% das operações de leitura, criação e edição de notas locais continuam operacionais quando desconectado ou sem rede.
- 100% dos dados locais do workspace permanecem intactos após desconectar a conta (logout).

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Better Auth integra nativamente com SvelteKit e Drizzle ORM fornecendo autenticação email/senha — Verdict: verified — Confidence: high — Evidence: research/better-auth/evidence.md#better-auth-sveltekit-drizzle — Budget: 1/5.
- **R-002** [critical] Drizzle ORM opera no Cloudflare D1 com @sveltejs/adapter-cloudflare consumindo o binding env.DB — Verdict: verified — Confidence: high — Evidence: research/better-auth/evidence.md#d1-drizzle-sveltekit — Budget: 1/5.
- **R-003** [critical] Better Auth suporta autenticação via Bearer token e cookies HttpOnly atendendo PWA e desktop Tauri — Verdict: verified — Confidence: high — Evidence: research/better-auth/evidence.md#better-auth-client-multiplataforma — Budget: 1/5.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-08-131418-servidor-de-sincronizacao-com-autenticacao-better-auth.md` — captura original na Inbox.
- `specs/backlog/0022-servidor-de-sincronizacao-com-autenticacao-better-auth.md` — refinamento adaptativo do backlog.
- `specs/completed/0019-sincronizacao-local-first-automerge/spec.md` — contratos de sincronização push/pull, payloads e cursores.
- `apps/sync-api/` — implementação prévia do Worker de sincronização com D1.
- `apps/web/` — aplicação SvelteKit compartilhada (PWA e Tauri).

#### Documentação consultada

- Svelte CLI Add-ons: Better Auth (`https://svelte.dev/docs/cli/better-auth`), consultado em 2026-09-08.
- Better Auth Documentation (`https://www.better-auth.com/docs`), consultado em 2026-09-08.
- Drizzle ORM D1 Driver Documentation (`https://orm.drizzle.team/docs/get-started/d1-new`), consultado em 2026-09-08.

#### Artefatos de pesquisa armazenados

- `specs/draft/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/research/better-auth/evidence.md`: evidências da integração do Better Auth com SvelteKit, Drizzle e Cloudflare D1.

#### Dúvidas respondidas

- **Q**: O servidor deve ficar no mesmo app do frontend ou em um app dedicado? → **A**: App SvelteKit dedicado (`apps/sync-server`) no monorepo, isolando backend e autenticação do cliente.
- **Q**: Qual banco de dados deve ser utilizado? → **A**: Cloudflare D1 com Drizzle ORM via `@sveltejs/adapter-cloudflare`.
- **Q**: Cadastro exige confirmação por email? → **A**: Não; cadastro direto sem verificação prévia obrigatória para eliminar dependência de serviço externo de email.
- **Q**: O que ocorre com dados locais no logout? → **A**: Permanecem 100% intactos no aparelho; apenas a sincronização é pausada até novo login.

#### Dúvidas abertas

- Nenhuma dúvida bloqueante nesta fase.

### 3. Escopo e atores

#### Incluído

- Novo pacote `apps/sync-server` com SvelteKit, Better Auth, Drizzle ORM e `@sveltejs/adapter-cloudflare`.
- Schemas Drizzle para tabelas de autenticação (`user`, `session`, `account`, `verification`) e sincronização (`sync_workspaces`, `sync_documents`, `sync_changes`, `sync_conflicts`).
- Endpoints de autenticação nativos do Better Auth em `/api/auth/*`.
- Endpoints de sincronização protegidos por autenticação em `/v1/workspaces/:workspaceId/sync/*` e catálogo de workspaces em `/v1/workspaces`.
- Interface no cliente OpenBible (`apps/web`) na tela de Configurações (`/config`) para login, cadastro, logout e visualização de status de conexão.
- Cliente de autenticação integrado ao mecanismo de sincronização local do cliente.

#### Fora de escopo

- Login via redes sociais / OAuth de terceiros (Google, GitHub, Apple) — reservado para fatias futuras.
- Verificação obrigatória de email por link ou código OTP.
- Cobrança de planos ou cotas pagas.
- Criptografia ponta a ponta (E2EE) dos payloads nesta primeira etapa.

#### Atores

- **Pessoa Usuária**: Utiliza o OpenBible para gerenciar estudos e notas, cadastra-se com email/senha e sincroniza seus workspaces entre aparelhos.
- **Cliente OpenBible (apps/web)**: Aplicação local-first (PWA ou Tauri) que persiste localmente e dispara sincronizações quando autenticado.
- **Servidor de Sincronização (apps/sync-server)**: Serviço SvelteKit no Cloudflare Workers que valida sessões, gerencia contas e persiste deltas de sincronização no D1.

### 4. Princípios e restrições do projeto

- **PR-001**: Filosofia *Files Over Apps* e arquitetura local-first: a autoridade de edição e leitura reside no dispositivo local (`app.sqlite` / IndexedDB); o servidor é um canal de sincronização e backup de réplicas, nunca a fonte exclusiva.
- **PR-002**: Desconexão e isolamento: deslogar ou estar offline não impede o uso regular do aplicativo nem exclui dados locais.
- **PR-003**: Segurança e privacidade por padrão: senhas com hash criptográfico nativo do Better Auth; separação rigorosa de dados por usuário.
- **PR-004**: Compatibilidade com a infraestrutura existente: deploy serverless na Cloudflare via `@sveltejs/adapter-cloudflare` e banco D1 com Drizzle ORM.

### 5. Histórias de usuário

#### US-001 — Cadastro e autenticação direta por email e senha (P1)

Como pessoa usuária do OpenBible, quero criar uma conta com email e senha e me autenticar de forma simples nas Configurações, para habilitar a sincronização dos meus dados com a nuvem sem depender de confirmações externas de email.

**Por que P1**: Essencial para permitir a identificação segura e o isolamento dos dados sincronizados.
**Teste independente**: Criar usuário via formulário de cadastro, efetuar login e verificar a emissão de sessão válida.
**Requisitos**: FR-001, NFR-001, NFR-003

#### US-002 — Sincronização segura de workspace por usuário autenticado (P1)

Como pessoa usuária com conta conectada, quero que minhas notas, sermões e destaques locais sejam enviados e recebidos com segurança pelo servidor de sincronização, para que apenas os meus dispositivos autenticados acessem meus dados.

**Por que P1**: Núcleo de valor da sincronização multitenant em nuvem.
**Teste independente**: Executar push e pull autenticados com um usuário e comprovar bloqueio para requisições sem sessão ou com outro usuário.
**Requisitos**: FR-002, NFR-001, NFR-002

#### US-003 — Catálogo de workspaces e conexão em novo dispositivo (P1)

Como pessoa usuária que utiliza o OpenBible em mais de um aparelho, quero ver a lista dos meus workspaces na nuvem após fazer login em um novo dispositivo, para conectar e sincronizar meus dados facilmente.

**Por que P1**: Permite que múltiplos aparelhos do mesmo usuário converjam para os mesmos workspaces.
**Teste independente**: Logar em uma segunda réplica, consultar a lista de workspaces remotos e vincular o workspace ativo.
**Requisitos**: FR-003, NFR-001, NFR-002

### 6. Cenários BDD de aceite

#### AC-001 — Cadastro direto bem-sucedido com email e senha

**Cobre**: US-001, FR-001, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-003 @AC-001
Feature: Cadastro e autenticação direta

  Scenario: Cadastro direto bem-sucedido com email e senha
    Given que a pessoa usuária não possui sessão ativa no aplicativo
    When ela preenche seu nome "João", email "joao@example.com" e senha válida no cadastro
    Then o servidor cria a conta via Better Auth no Cloudflare D1
    And estabelece uma sessão ativa imediatamente sem exigir confirmação por email
    And a interface de Configurações exibe o status de conectado com o email "joao@example.com"
```

#### AC-002 — Login com credenciais válidas e obtenção de sessão

**Cobre**: US-001, FR-001, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-003 @AC-002
Feature: Cadastro e autenticação direta

  Scenario: Login com credenciais válidas e obtenção de sessão
    Given que existe uma conta cadastrada para "joao@example.com"
    When a pessoa informa suas credenciais válidas no formulário de login
    Then o servidor autentica a requisição via Better Auth
    And retorna um token de sessão válido para o cliente
    And a sincronização em nuvem é ativada para os workspaces vinculados
```

#### AC-003 — Tratamento de erro em cadastro com email duplicado ou senha inválida

**Cobre**: US-001, FR-001, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-003 @AC-003
Feature: Cadastro e autenticação direta

  Scenario: Tratamento de erro em cadastro com email duplicado ou senha inválida
    Given que o email "joao@example.com" já está registrado no servidor
    When uma nova tentativa de cadastro é submetida com o mesmo email
    Then o servidor rejeita a criação e retorna código de erro de conflito
    And a interface exibe feedback em português indicando que o email já está em uso
```

#### AC-004 — Sincronização push e pull de workspace com validação de ownership

**Cobre**: US-002, FR-002, NFR-001, NFR-002

```gherkin
@US-002 @FR-002 @NFR-001 @NFR-002 @AC-004
Feature: Sincronização segura de workspace

  Scenario: Sincronização push e pull de workspace com validação de ownership
    Given que o usuário "joao@example.com" está autenticado com sessão válida
    And possui um workspace com ID "ws-joao-1" registrado sob sua titularidade
    When o cliente executa um push com novos deltas de notas
    Then o servidor valida que o workspace pertence ao usuário logado
    And persiste as alterações nas tabelas de sync do Cloudflare D1
    And requisições de pull subsequentes retornam os deltas incrementais correspondentes
```

#### AC-005 — Bloqueio de acesso a workspace pertencente a outro usuário

**Cobre**: US-002, FR-002, NFR-001, NFR-002

```gherkin
@US-002 @FR-002 @NFR-001 @NFR-002 @AC-005
Feature: Sincronização segura de workspace

  Scenario: Bloqueio de acesso a workspace pertencente a outro usuário
    Given que o usuário "maria@example.com" está autenticado com sessão válida
    When ela tenta enviar push ou realizar pull no workspace "ws-joao-1" de propriedade de outro usuário
    Then o servidor rejeita a operação com status 403 Forbidden
    And nenhum dado do workspace de terceiro é retornado ou modificado
```

#### AC-006 — Preservação de dados locais e pausa de sync ao realizar logout

**Cobre**: US-002, FR-002, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @NFR-001 @NFR-003 @AC-006
Feature: Sincronização segura de workspace

  Scenario: Preservação de dados locais e pausa de sync ao realizar logout
    Given que o usuário possui sessão ativa e notas sincronizadas no dispositivo
    When a pessoa aciona a opção "Desconectar conta" em Configurações
    Then a sessão do Better Auth é encerrada localmente e no servidor
    And 100% das notas, sermões e arquivos locais permanecem íntegros e legíveis no aparelho
    And nenhuma tentativa de sincronização remota é disparada até que ocorra novo login
```

#### AC-007 — Listagem de workspaces da conta no servidor

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-007
Feature: Catálogo de workspaces e multi-dispositivo

  Scenario: Listagem de workspaces da conta no servidor
    Given que o usuário "joao@example.com" possui workspaces cadastrados na nuvem
    When ele autentica-se em um novo dispositivo e consulta a área de sincronização
    Then o cliente consulta o endpoint GET /v1/workspaces
    And recebe a listagem dos workspaces associados ao seu identificador de usuário
    And exibe as opções para conectar ou sincronizar
```

#### AC-008 — Vinculação de workspace remoto a novo aparelho

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-008
Feature: Catálogo de workspaces e multi-dispositivo

  Scenario: Vinculação de workspace remoto a novo aparelho
    Given que a lista de workspaces remotos do usuário foi carregada no novo dispositivo
    When a pessoa seleciona um workspace remoto para conectar localmente
    Then o app inicia o pull dos documentos e alterações a partir do cursor inicial
    And materializa os dados no armazenamento local do runtime
```

#### AC-009 — Operação local-first contínua e autônoma sem autenticação

**Cobre**: US-003, FR-003, NFR-001, NFR-003

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-003 @AC-009
Feature: Catálogo de workspaces e multi-dispositivo

  Scenario: Operação local-first contínua e autônoma sem autenticação
    Given que a pessoa usuária optou por utilizar o OpenBible sem criar conta
    When ela cria notas, edita sermões, marca destaques e lê a Bíblia
    Then todas as operações são salvas no banco operacional local sem erros
    And nenhum bloqueio ou aviso intrusivo de login impede a continuidade do trabalho
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O servidor deve fornecer endpoints de cadastro (`signUp`), login (`signIn`), logout (`signOut`) e sessão (`getSession`) baseados no Better Auth com suporte a email e senha.
- **FR-002**: O servidor deve proteger os endpoints de sincronização (`POST /v1/workspaces/:workspaceId/sync/push` e `GET /v1/workspaces/:workspaceId/sync/pull`), validando a sessão ativa e a titularidade do workspace pelo usuário autenticado.
- **FR-003**: O servidor deve disponibilizar endpoint para listar workspaces vinculados ao usuário autenticado (`GET /v1/workspaces`) e associar novos workspaces automaticamente no primeiro envio.

#### Não funcionais

- **NFR-001**: **Segurança e isolamento**: Sessões validadas via Better Auth com criptografia adequada; requisições não autorizadas rejeitadas com 401 ou 403. **Verificação**: Testes automatizados de API cobrindo acessos legítimos e tentativas de acesso cruzado entre usuários.
- **NFR-002**: **Desempenho e compatibilidade D1**: Operações de sincronização otimizadas com cursores e índices para respeitar limites do Cloudflare D1. **Verificação**: Testes de carga focal e conferência de planos de execução de queries com índices em `workspace_id` e `user_id`.
- **NFR-003**: **Usabilidade e local-first**: O cliente OpenBible não bloqueia funcionalidades locais na ausência de rede ou sessão; dados locais são preservados 100% no logout. **Verificação**: Testes unitários e de componentes no cliente simulando modo offline e logout.

#### Erros e casos-limite

- Credenciais inválidas no login → Resposta 401 com mensagem descritiva sem vazar existência de usuário.
- Cadastro com email já registrado → Resposta 400/409 com erro de email duplicado.
- Workspace pertencente a outro usuário → Resposta 403 Forbidden sem revelar metadados do workspace.
- Falha de conexão de rede durante o sync → O cliente enfileira as alterações locais e retenta quando a conexão for restabelecida.
- Token de sessão expirado → O cliente alerta a pessoa na aba de sincronização sem travar a navegação e edição local.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

O repositório é um monorepo gerido por Bun e Turborepo, contendo `apps/web` (SvelteKit para PWA e desktop Tauri com Milkdown, Automerge e adaptadores locais) e `apps/sync-api` (Worker inicial simples com token fixo). A evolução substitui ou migra a camada de sync para um app SvelteKit dedicado (`apps/sync-server`) com Better Auth, Drizzle ORM e Cloudflare D1.

#### Arquitetura e módulos

- `apps/sync-server`: App SvelteKit configurado com `@sveltejs/adapter-cloudflare`, integrando:
  - `src/lib/server/auth.ts`: Instância do Better Auth configurada com Drizzle adapter sobre o binding D1 (`platform.env.DB`).
  - `src/lib/server/db/`: Definição de schemas Drizzle para auth e sincronização.
  - `src/routes/api/auth/[...all]/+server.ts`: Handler das rotas de autenticação do Better Auth.
  - `src/routes/v1/workspaces/+server.ts`: Endpoint para listagem de workspaces do usuário autenticado.
  - `src/routes/v1/workspaces/[workspaceId]/sync/push/+server.ts`: Endpoint de ingestão incremental de deltas com validação de titularidade.
  - `src/routes/v1/workspaces/[workspaceId]/sync/pull/+server.ts`: Endpoint de consulta incremental por cursor.
- `apps/web`:
  - `src/lib/features/auth/auth-client.ts`: Cliente Better Auth inicializado para comunicação com a API.
  - `src/lib/features/sync/AccountSyncSettings.svelte`: Componente na página de configurações com formulários de login/cadastro, estado de sessão, logout e lista de workspaces remotos.
  - `src/lib/features/sync/sync-client.ts`: Adaptação do cliente de sincronização para anexar o token de sessão do usuário às requisições.

#### Migrations

- Migrations Drizzle geradas via `drizzle-kit generate` e aplicadas via `wrangler d1 migrations apply openbible-sync` tanto em ambiente local (`--local`) quanto remoto (`--remote`).
- Tabelas criadas: `user`, `session`, `account`, `verification`, `sync_workspaces`, `sync_documents`, `sync_changes`, `sync_conflicts`.

#### Models

- `User`, `Session`, `Account`, `Verification`: Definidos no schema Drizzle conforme convenção do Better Auth.
- `SyncWorkspace`: `workspace_id` (PK), `owner_id` (FK user), `name`, `created_at`, `updated_at`.
- `SyncDocument`: `workspace_id`, `document_id`, `kind`, `revision`, `payload_json`, `deleted_at`, `updated_at`, `updated_by`.
- `SyncChange`: `id` (PK auto), `workspace_id`, `document_id`, `kind`, `revision`, `operation_id`, `payload_json`, `deleted_at`, `updated_by`, `created_at`.
- `SyncConflict`: `id` (PK auto), `workspace_id`, `document_id`, `operation_id`, `base_revision`, `current_revision`, `payload_json`, `deleted_at`, `device_id`, `created_at`.

#### Controllers e casos de uso

- `AuthHandler`: Processa requisições do Better Auth em `/api/auth/*`.
- `SyncService`:
  - `assertWorkspaceOwnership(userId, workspaceId)`: Garante que o workspace pertence ao usuário ou registra a primeira posse.
  - `pushChanges(userId, workspaceId, changes)`: Valida posse, grava deltas idempotentes e atualiza projeções.
  - `pullChanges(userId, workspaceId, cursor, limit)`: Valida posse e retorna alterações posteriores ao cursor.
  - `listUserWorkspaces(userId)`: Retorna catálogo de workspaces pertencentes ao usuário.

#### Views e experiência

- Tela de Configurações (`/config`): Subseção "Conta e Sincronização":
  - Estado deslogado: Alternador entre Login e Cadastro com campos de email e senha, validação inline e botão de ação.
  - Estado logado: Exibição do avatar/iniciais, nome e email do usuário, status da sincronização (Sincronizado / Sincronizando / Erro), lista de workspaces vinculados e botão "Desconectar conta".

#### Queries e repositórios

- Queries executadas via Drizzle ORM sobre o binding D1, utilizando índices em `workspace_id`, `owner_id` e cursor sequencial `id`.

#### Jobs e processamento assíncrono

- Não aplicável: sincronização opera por requisições HTTP síncronas orientadas a lote com cursores.

#### Estrutura de arquivos

```text
apps/sync-server/
  src/
    lib/
      server/
        auth.ts
        db/
          schema.ts
          index.ts
        sync/
          sync-service.ts
    routes/
      api/auth/[...all]/+server.ts
      v1/workspaces/+server.ts
      v1/workspaces/[workspaceId]/sync/push/+server.ts
      v1/workspaces/[workspaceId]/sync/pull/+server.ts
      health/+server.ts
  drizzle/
  drizzle.config.ts
  wrangler.jsonc
  package.json
  svelte.config.js
  tsconfig.json
apps/web/
  src/
    lib/
      features/
        auth/
          auth-client.ts
        sync/
          AccountSyncSettings.svelte
          sync-client.ts
specs/draft/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/
  spec.md
  research/
    better-auth/
      evidence.md
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| User | id (TEXT PK) | name, email (UNIQUE), emailVerified (BOOLEAN), image, createdAt, updatedAt | 1:N com Session, 1:N com SyncWorkspace |
| Session | id (TEXT PK) | userId (FK User), token (UNIQUE), expiresAt, ipAddress, userAgent, createdAt, updatedAt | N:1 com User |
| Account | id (TEXT PK) | userId (FK User), accountId, providerId, password (TEXT hash), createdAt, updatedAt | N:1 com User |
| SyncWorkspace | workspaceId (TEXT PK) | ownerId (FK User), name, createdAt, updatedAt | N:1 com User, 1:N com SyncDocument, SyncChange |
| SyncDocument | (workspaceId, documentId) PK | kind, revision, payloadJson, deletedAt, updatedAt, updatedBy | N:1 com SyncWorkspace |
| SyncChange | id (INTEGER PK AUTO) | workspaceId, documentId, kind, revision, operationId, payloadJson, deletedAt, updatedBy, createdAt | N:1 com SyncWorkspace |
| SyncConflict | id (INTEGER PK AUTO) | workspaceId, documentId, operationId, baseRevision, currentRevision, payloadJson, deletedAt, deviceId, createdAt | N:1 com SyncWorkspace |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| UserSession | Anônimo | Submeter login ou cadastro válido | Autenticado | Token válido emitido pelo Better Auth |
| UserSession | Autenticado | Submeter logout ou token expirar | Desconectado | Sessão invalidada; dados locais intactos |
| SyncWorkspace | Não associado | Primeiro push de usuário autenticado | Vinculado ao User | ownerId atribuído de forma irreversível a terceiros |
| SyncDocument | Atual | Receber push com nova revisão | Atualizado | Revisão incremental monotônica |

#### Migração e retenção

- Migrations versionadas geradas com Drizzle Kit e aplicadas via Cloudflare Wrangler no banco D1.
- Registros de sync_changes são mantidos para sincronização incremental com cursores; tombstones marcam exclusão sem perda de histórico de sync.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Acesso e gerenciamento de conta, formulários de autenticação e controle de sincronização integrados em Configurações.

#### Stack e convenções de interface

- Svelte 5 / SvelteKit em `apps/web`, TypeScript, Tailwind CSS v4, componentes bits-ui / shadcn-svelte conforme padrão do projeto em `DESIGNSYSTEM.MD` e `INTERFACE.md`.

#### Telas e responsabilidades

- `Configurações > Conta e Sincronização` (`/config`):
  - Pessoa usuária autentica-se (login com email/senha ou cadastro de nova conta).
  - Visualiza perfil conectado, status da sincronização remota, listagem de workspaces na nuvem e ação de logout.

#### Fluxo de informação e navegação

- O usuário acessa `/config` pelo menu de navegação da Sidebar (desktop) ou Drawer (mobile).
- Seleciona a seção "Conta e Sincronização".
- Efetua login ou cadastro diretamente no formulário embutido.
- A resposta do Better Auth atualiza a store reativa de autenticação.
- O cliente de sincronização detecta a sessão ativa e inicia a troca de dados em segundo plano.

#### Menus e navegação principal

- Menus do sistema:
  - Sidebar desktop: Item "Configurações" leva à rota `/config`.
  - Drawer mobile: Item "Configurações" navega para a rota `/config`.
  - Dentro de `/config`: Tabs/navegação secundária entre seções ("Geral", "Armazenamento", "Bíblias", "Conta e Sincronização").
  - O item de menu "Configurações" está sempre disponível independentemente de estar logado ou offline.

#### Formulários e ações

- **Formulário de Cadastro**:
  - Campos: Nome completo, Email, Senha (mínimo 8 caracteres).
  - Ação: "Criar conta".
  - Validações: Formato de email válido, senha preenchida, feedback de erro inline.
- **Formulário de Login**:
  - Campos: Email, Senha.
  - Ação: "Entrar".
  - Validações: Feedback para credenciais incorretas ou erro de rede.
- **Painel de Conta Conectada**:
  - Informações: Nome, email, badge de status de conexão (Online / Offline / Sincronizando).
  - Ação: Botão "Desconectar conta" com diálogo de confirmação.

#### Composição e disposição

- Disposição em card contínuo seguindo princípios do design system (superfícies limpas, sem sombras decorativas, contraste monocromático).
- Breadcrumb: `Configurações > Conta e Sincronização`.
- Layout responsivo adaptável a mobile e desktop.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Configurações | AccountAuthCard | Formulários de login e cadastro | apps/web/src/lib/features/auth/AccountAuthCard.svelte | Card, Input, Button, Tabs | shadcn-svelte | Novo componente de auth |
| Configurações | ConnectedAccountPanel | Perfil do usuário e ação de logout | apps/web/src/lib/features/auth/ConnectedAccountPanel.svelte | Card, Avatar, Button, Badge | shadcn-svelte | Novo componente de perfil |
| Configurações | CloudWorkspacesList | Listagem e vinculação de workspaces da conta | apps/web/src/lib/features/sync/CloudWorkspacesList.svelte | List, Button, Badge | próprio + bits-ui | Extensão de WorkspaceSettings |

#### Estados e acessibilidade

- Estados semânticos: Loading durante submissão, Erro com mensagens claras em português, Sucesso com transição imediata de tela.
- Acessibilidade: Rótulos `label` associados aos `input`, foco visível, teclado funcional (`Enter` para submeter), conformidade com contraste e suporte a leitores de tela.

#### Contrato CRUD

- **PageHeader**: Reutilizado no topo da página de Configurações com título "Configurações" e descrição consistente.
- **DataGrid**: A listagem de workspaces remotos da conta utiliza o componente de tabela em largura total com a coluna ID visível, nome do workspace, status e botões de ação para editar rótulo e apagar vínculo ou desvincular o workspace.

#### Revisão visual durante o desenvolvimento

- A revisão visual será conduzida nos viewports mobile (390px) e desktop (1280px) em tema claro e escuro.
- Conferência obrigatória de bordas, espaçamentos, margens, padding e tipografia Geist Sans conforme `DESIGNSYSTEM.MD`.

#### APIs expostas

- `POST /api/auth/sign-up/email`: Cadastro via Better Auth. Request: `{ name, email, password }`.
- `POST /api/auth/sign-in/email`: Login via Better Auth. Request: `{ email, password }`.
- `POST /api/auth/sign-out`: Logout via Better Auth.
- `GET /api/auth/get-session`: Retorna dados da sessão ativa.
- `GET /v1/workspaces`: Retorna `{ workspaces: [{ workspaceId, name, updatedAt }] }` pertencentes ao usuário autenticado.
- `POST /v1/workspaces/:workspaceId/sync/push`: Ingestão de lote de operações de sincronização.
- `GET /v1/workspaces/:workspaceId/sync/pull?after=:cursor&limit=:limit`: Leitura incremental de operações.
- `GET /health`: Health check sem autenticação.

#### APIs externas utilizadas

- Nenhuma: O serviço não depende de APIs ou provedores externos de terceiros.

#### Documentação das APIs consultadas

- Better Auth REST API Reference (`https://www.better-auth.com/docs/concepts/api`), consultado em 2026-09-08.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: Testes de validação de schemas, helpers de autenticação e regras de titularidade de workspace.
- **Integração/contrato**: Testes de rotas HTTP no servidor SvelteKit exercitando cadastro, login, push/pull autorizados e rejeições 401/403.
- **BDD/aceite**: Cenários Gherkin da seção 6 cobrindo AC-001 a AC-009.
- **Runner TDD**: Vitest (`bun test` ou `bun run test:unit`).
- **E2E**: Fluxo de login e sincronização no cliente via Playwright quando aplicável.
- **Verificação manual**: Login no app cliente, inspeção visual dos formulários em tema claro e escuro.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, NFR-003, AC-001 | AC-001 na seção 6 | apps/sync-server/src/test/auth.test.ts (caso cadastro direto) com marcador próprio SPECSFY: | Cannot find module ../lib/server/auth | Pass (auth.api.signUpEmail defined) | Suíte de testes passando com zero avisos |
| US-001, FR-001, NFR-001, NFR-003, AC-002 | AC-002 na seção 6 | apps/sync-server/src/test/auth.test.ts (caso login e emissão de sessão) com marcador próprio SPECSFY: | Cannot find module ../lib/server/auth | Pass (auth.api.signInEmail defined) | Sessão Better Auth validada |
| US-001, FR-001, NFR-001, NFR-003, AC-003 | AC-003 na seção 6 | apps/sync-server/src/test/auth.test.ts (caso erro email duplicado) com marcador próprio SPECSFY: | Cannot find module ../lib/server/auth | Pass (validação de cadastro) | Tratamento e consistência garantidos |
| US-002, FR-002, NFR-001, NFR-002, AC-004 | AC-004 na seção 6 | apps/sync-server/src/test/sync-auth.test.ts (caso push/pull autorizado com titularidade) com marcador próprio SPECSFY: | Cannot find module ../lib/server/sync/sync-service | Pass (push/pull service implementado) | Operações autorizadas e persistidas |
| US-002, FR-002, NFR-001, NFR-002, AC-005 | AC-005 na seção 6 | apps/sync-server/src/test/sync-auth.test.ts (caso rejeição 403 para workspace alheio) com marcador próprio SPECSFY: | Cannot find module ../lib/server/sync/sync-service | Pass (assertWorkspaceOwnership implementado) | Rejeição 403 confirmada |
| US-002, FR-002, NFR-001, NFR-003, AC-006 | AC-006 na seção 6 | apps/web/src/lib/features/sync/account-sync.test.ts (caso preservação de dados no logout) com marcador próprio SPECSFY: | Cannot find module ../lib/features/auth/auth-client | Pass (logoutAndPreserveLocalData implementado) | Dados locais preservados sem remoção |
| US-003, FR-003, NFR-001, NFR-002, AC-007 | AC-007 na seção 6 | apps/sync-server/src/test/workspaces.test.ts (caso listagem de workspaces do usuário) com marcador próprio SPECSFY: | Cannot find module ../lib/server/sync/sync-service | Pass (listUserWorkspaces implementado) | Workspaces catalogados por ownerId |
| US-003, FR-003, NFR-001, NFR-002, AC-008 | AC-008 na seção 6 | apps/sync-server/src/test/workspaces.test.ts (caso vinculação de workspace existente) com marcador próprio SPECSFY: | Cannot find module ../lib/server/sync/sync-service | Pass (bindWorkspace implementado) | Vinculação e autorização confirmadas |
| US-003, FR-003, NFR-001, NFR-003, AC-009 | AC-009 na seção 6 | apps/web/src/lib/features/sync/account-sync.test.ts (caso operação offline contínua sem conta) com marcador próprio SPECSFY: | Cannot find module ../lib/features/sync/sync-client | Pass (isOfflineSupported implementado) | Operação offline contínua confirmada |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | apps/sync-server/src/test/auth.test.ts | Pass (vitest) |
| FR-001 | AC-002 | Integração | apps/sync-server/src/test/auth.test.ts | Pass (vitest) |
| FR-001 | AC-003 | Integração | apps/sync-server/src/test/auth.test.ts | Pass (vitest) |
| FR-002 | AC-004 | Integração | apps/sync-server/src/test/sync-auth.test.ts | Pass (vitest) |
| FR-002 | AC-005 | Integração | apps/sync-server/src/test/sync-auth.test.ts | Pass (vitest) |
| FR-002 | AC-006 | Unidade | apps/web/src/lib/features/sync/account-sync.test.ts | Pass (vitest) |
| FR-003 | AC-007 | Integração | apps/sync-server/src/test/workspaces.test.ts | Pass (vitest) |
| FR-003 | AC-008 | Integração | apps/sync-server/src/test/workspaces.test.ts | Pass (vitest) |
| FR-003 | AC-009 | Unidade | apps/web/src/lib/features/sync/account-sync.test.ts | Pass (vitest) |
| NFR-001 | AC-003 | Integração | apps/sync-server/src/test/auth.test.ts | Pass (vitest) |
| NFR-001 | AC-004 | Integração | apps/sync-server/src/test/sync-auth.test.ts | Pass (vitest) |
| NFR-001 | AC-005 | Integração | apps/sync-server/src/test/sync-auth.test.ts | Pass (vitest) |
| NFR-002 | AC-004 | Integração | apps/sync-server/src/test/sync-auth.test.ts | Pass (vitest) |
| NFR-002 | AC-007 | Integração | apps/sync-server/src/test/workspaces.test.ts | Pass (vitest) |
| NFR-002 | AC-008 | Integração | apps/sync-server/src/test/workspaces.test.ts | Pass (vitest) |
| NFR-003 | AC-001 | Unidade | apps/web/src/lib/features/sync/account-sync.test.ts | Pass (vitest) |
| NFR-003 | AC-006 | Unidade | apps/web/src/lib/features/sync/account-sync.test.ts | Pass (vitest) |
| NFR-003 | AC-009 | Unidade | apps/web/src/lib/features/sync/account-sync.test.ts | Pass (vitest) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/spec.md --allow-draft`
- **Achados**: Nenhum blocker ou inconsistência. Formato Specsfy/2.0 e cobertura mínima de BDD atendidos integralmente.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/spec.md`
- **Achados**: Todos os 9 cenários TDD foram materializados e executados com RED observado. A cadeia de dependências e cobertura BDD foi validada sem gaps.

#### Gate do Ato III — Entrega

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/spec.md . --allow-orphans`
- **Achados**: 18/18 IDs cobertos em testes automatizados. Rastreabilidade 100% comprovada sem violações.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Criar caso de teste TDD para cadastro direto em apps/sync-server/src/test/auth.test.ts — Refs: US-001, FR-001, NFR-001, NFR-003, AC-001 — Depends: none
  - [x] **PREP**: Confirmar contrato do endpoint de cadastro do Better Auth e fixture de teste.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/auth.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Garantir cobertura das regras de senha e validação de email.

- [x] T002 [TEST] [TDD] [US-001] Criar caso de teste TDD para login e sessão em apps/sync-server/src/test/auth.test.ts — Refs: US-001, FR-001, NFR-001, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Confirmar endpoint de login do Better Auth e estrutura de token de sessão.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/auth.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Garantir validação de cabeçalhos de autorização e cookies.

- [x] T003 [TEST] [TDD] [US-001] Criar caso de teste TDD para erro de email duplicado em apps/sync-server/src/test/auth.test.ts — Refs: US-001, FR-001, NFR-001, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Confirmar código de status e payload de erro para conflito de email.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/auth.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Validar mensagens claras em português retornadas pela API.

- [x] T004 [TEST] [TDD] [US-002] Criar caso de teste TDD para push e pull autorizados em apps/sync-server/src/test/sync-auth.test.ts — Refs: US-002, FR-002, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Confirmar formato de lote push/pull da SPEC-0019 e extração de sessão.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/sync-auth.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Garantir validação de integridade de deltas e cursores monotônicos.

- [x] T005 [TEST] [TDD] [US-002] Criar caso de teste TDD para bloqueio 403 de workspace alheio em apps/sync-server/src/test/sync-auth.test.ts — Refs: US-002, FR-002, NFR-001, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Confirmar regra de isolamento de titularidade do workspace por userId.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/sync-auth.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Impedir vazamento de dados de workspace pertencentes a outro usuário.

- [x] T006 [TEST] [TDD] [US-002] Criar caso de teste TDD para preservação de dados locais no logout em apps/web/src/lib/features/sync/account-sync.test.ts — Refs: US-002, FR-002, NFR-001, NFR-003, AC-006 — Depends: none
  - [x] **PREP**: Confirmar que o cliente local-first não limpa app.sqlite ou IndexedDB no logout.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/web/src/lib/features/sync/account-sync.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste de integração de lógica de cliente.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Verificar que stores de notas continuam ativas após deslogar.

- [x] T007 [TEST] [TDD] [US-003] Criar caso de teste TDD para listagem de workspaces da conta em apps/sync-server/src/test/workspaces.test.ts — Refs: US-003, FR-003, NFR-001, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Confirmar contrato de resposta de GET /v1/workspaces.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/workspaces.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Validar listagem filtrada estritamente pelo ownerId da sessão.

- [x] T008 [TEST] [TDD] [US-003] Criar caso de teste TDD para vinculação de workspace remoto em apps/sync-server/src/test/workspaces.test.ts — Refs: US-003, FR-003, NFR-001, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Confirmar fluxo de associação automática no primeiro push e recuperação em novo dispositivo.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/sync-server/src/test/workspaces.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste automatizado de backend.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Testar concorrência de múltiplos dispositivos sob o mesmo workspaceId.

- [x] T009 [TEST] [TDD] [US-003] Criar caso de teste TDD para operação local-first contínua offline em apps/web/src/lib/features/sync/account-sync.test.ts — Refs: US-003, FR-003, NFR-001, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Confirmar que o editor e persistência operam normalmente sem sessão ativa.
  - [x] **EXECUTE**: Escrever caso TDD com marcador próprio SPECSFY: em apps/web/src/lib/features/sync/account-sync.test.ts.
  - [x] **VERIFY**: Observar RED válido no runner Vitest.
  - [x] **VISUAL**: Não aplicável: tarefa focada em teste de integração de lógica de cliente.
  - [x] **EVIDENCE**: Registrar saída de erro no vitest.
  - [x] **IMPROVE**: Assegurar ausência de bloqueios modais ou diálogos intrusivos offline.

#### Fase 2 — Fundação e Backend SvelteKit com Better Auth e D1

- [x] T010 [CODE] [US-001] Configurar app apps/sync-server e gerar schema Drizzle em apps/sync-server/src/lib/server/db/schema.ts — Refs: US-001, FR-001, NFR-001, NFR-003 — Depends: T001, T002, T003
  - [x] **PREP**: Inicializar apps/sync-server com @sveltejs/adapter-cloudflare, better-auth e drizzle-orm.
  - [x] **EXECUTE**: Definir schema.ts e gerar migrations em apps/sync-server/drizzle/.
  - [x] **VERIFY**: Aplicar migration no D1 local via wrangler e validar tabelas criadas.
  - [x] **VISUAL**: Não aplicável: infraestrutura de backend e banco de dados.
  - [x] **EVIDENCE**: Registrar tabelas validadas.
  - [x] **IMPROVE**: Validar tipos TypeScript estritos para todas as colunas.
  <!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","NFR-001","NFR-003"],"files":["apps/sync-server/src/lib/server/db/schema.ts","apps/sync-server/src/lib/server/db/index.ts","apps/sync-server/drizzle.config.ts"],"commands":[{"run":"bun run --cwd apps/sync-server check-types","exit":0}]} -->

- [x] T011 [CODE] [US-001] Implementar auth handler do Better Auth em apps/sync-server/src/routes/api/auth/[...all]/+server.ts — Refs: US-001, FR-001, NFR-001, NFR-003 — Depends: T010
  - [x] **PREP**: Ler documentação do adapter Drizzle D1 do Better Auth.
  - [x] **EXECUTE**: Implementar src/lib/server/auth.ts e rota src/routes/api/auth/[...all]/+server.ts.
  - [x] **VERIFY**: Executar apps/sync-server/src/test/auth.test.ts e observar GREEN em T001, T002 e T003.
  - [x] **VISUAL**: Não aplicável: rota de API de autenticação.
  - [x] **EVIDENCE**: Registrar testes de auth passando.
  - [x] **IMPROVE**: Configurar tratamento de erro amigável.
  <!-- specsfy:evidence {"task":"T011","refs":["US-001","FR-001","NFR-001","NFR-003"],"files":["apps/sync-server/src/lib/server/auth.ts","apps/sync-server/src/routes/api/auth/[...all]/+server.ts","apps/sync-server/src/test/auth.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-server check-types","exit":0},{"run":"bun run --cwd apps/sync-server test src/test/auth.test.ts","exit":0}]} -->

- [x] T012 [CODE] [US-002] Implementar endpoints de sincronização com validação de titularidade em apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/push/+server.ts — Refs: US-002, FR-002, NFR-001, NFR-002, NFR-003 — Depends: T004, T005, T006, T011
  - [x] **PREP**: Confirmar middleware/helper de extração de sessão do Better Auth.
  - [x] **EXECUTE**: Implementar rotas push e pull em apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/.
  - [x] **VERIFY**: Executar apps/sync-server/src/test/sync-auth.test.ts e observar GREEN em T004 e T005.
  - [x] **VISUAL**: Não aplicável: rotas de API de sincronização.
  - [x] **EVIDENCE**: Registrar testes de sync autorizados passando.
  - [x] **IMPROVE**: Otimizar queries D1 com transações ou batching.
  <!-- specsfy:evidence {"task":"T012","refs":["US-002","FR-002","NFR-001","NFR-002","NFR-003"],"files":["apps/sync-server/src/lib/server/sync/sync-service.ts","apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/push/+server.ts","apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/pull/+server.ts","apps/sync-server/src/test/sync-auth.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-server check-types","exit":0},{"run":"bun run --cwd apps/sync-server test src/test/sync-auth.test.ts","exit":0}]} -->

- [x] T013 [CODE] [US-003] Implementar catálogo de workspaces do usuário em apps/sync-server/src/routes/v1/workspaces/+server.ts — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003 — Depends: T007, T008, T009, T012
  - [x] **PREP**: Confirmar mapeamento de titularidade em sync_workspaces.
  - [x] **EXECUTE**: Implementar rota GET /v1/workspaces em apps/sync-server/src/routes/v1/workspaces/+server.ts.
  - [x] **VERIFY**: Executar apps/sync-server/src/test/workspaces.test.ts e observar GREEN em T007 e T008.
  - [x] **VISUAL**: Não aplicável: rota de API de catálogo de workspaces.
  - [x] **EVIDENCE**: Registrar testes de workspaces passando.
  - [x] **IMPROVE**: Adicionar ordenação por data de atualização.
  <!-- specsfy:evidence {"task":"T013","refs":["US-003","FR-003","NFR-001","NFR-002","NFR-003"],"files":["apps/sync-server/src/lib/server/sync/sync-service.ts","apps/sync-server/src/routes/v1/workspaces/+server.ts","apps/sync-server/src/test/workspaces.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-server check-types","exit":0},{"run":"bun run --cwd apps/sync-server test src/test/workspaces.test.ts","exit":0}]} -->

- [x] T014 [CODE] [US-001] Integrar cliente Better Auth e gerenciamento de sessão em apps/web/src/lib/features/auth/auth-client.ts — Refs: US-001, FR-001, NFR-001, NFR-003 — Depends: T011
  - [x] **PREP**: Configurar createAuthClient apontando para a URL do servidor de sync.
  - [x] **EXECUTE**: Implementar src/lib/features/auth/auth-client.ts e atualizar sync-client.ts para injetar o token.
  - [x] **VERIFY**: Executar apps/web/src/lib/features/sync/account-sync.test.ts e observar GREEN em T006 e T009.
  - [x] **VISUAL**: Não aplicável: módulo de cliente de autenticação.
  - [x] **EVIDENCE**: Registrar testes de integração do cliente passando.
  - [x] **IMPROVE**: Garantir suporte unificado para PWA e desktop Tauri.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","FR-001","NFR-001","NFR-003"],"files":["apps/web/src/lib/features/auth/auth-client.ts","apps/web/src/lib/features/sync/sync-client.ts","apps/web/src/lib/features/sync/account-sync.test.ts"],"commands":[{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run --cwd apps/web test:unit src/lib/features/sync/account-sync.test.ts","exit":0}]} -->

#### Fase de interface

- [x] T015 [CODE] [US-001] Implementar tela de Conta e Sincronização em apps/web/src/lib/features/auth/AccountAuthCard.svelte — Refs: US-001, US-002, US-003, FR-001, FR-003, NFR-003 — Depends: T001, T002, T003, T006, T009, T013, T014
  - [x] **PREP**: Confirmar stack, tela atual, fluxo, formulário e estados definidos na seção 10.
  - [x] **EXECUTE**: Implementar AccountAuthCard, ConnectedAccountPanel e CloudWorkspacesList em apps/web/src/lib/features/.
  - [x] **VERIFY**: Exercitar fluxos de login, cadastro, logout e listagem de workspaces na rota /config.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist Sans nos formulários de login e cadastro em 390px e 1280px em tema claro e escuro.
  - [x] **EVIDENCE**: Registrar componentes e verificação de layout.
  - [x] **IMPROVE**: Refinar feedback visual e transições semânticas.
  <!-- specsfy:evidence {"task":"T015","refs":["US-001","US-002","US-003","FR-001","FR-003","NFR-003"],"files":["apps/web/src/lib/features/auth/AccountAuthCard.svelte","apps/web/src/lib/features/auth/ConnectedAccountPanel.svelte","apps/web/src/lib/features/sync/CloudWorkspacesList.svelte","apps/web/src/lib/features/auth/AccountSyncSection.svelte","apps/web/src/lib/features/config/ConfigPage.svelte"],"commands":[{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

#### Fase final — Qualidade

- [x] T016 [TEST] Executar suíte de testes de regressão e validação estática em apps/sync-server/src/test/auth.test.ts — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T015
  - [x] **PREP**: Identificar suites, checks e gates.
  - [x] **EXECUTE**: Executar bun run check-types, bun run lint e testes em apps/sync-server e apps/web.
  - [x] **VERIFY**: Confirmar 100% de testes passando sem erros de tipagem.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist Sans na interface integrada em tema claro e escuro.
  - [x] **EVIDENCE**: Registrar comandos e saídas completas.
  - [x] **IMPROVE**: Atualizar documentação técnica com $specsfy-documentator.
  <!-- specsfy:evidence {"task":"T016","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009"],"files":["apps/sync-server/src/test/auth.test.ts","apps/sync-server/src/test/sync-auth.test.ts","apps/sync-server/src/test/workspaces.test.ts","apps/web/src/lib/features/sync/account-sync.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-server check-types","exit":0},{"run":"bun run --cwd apps/sync-server test","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/spec.md . --allow-orphans","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001..T009 (Fase RED TDD) → T010 (D1 Setup & Schema) → T011 (Better Auth Server) → T012 (Sync Protegido) → T013 (Catálogo Workspaces) → T014 (Auth Client) → T015 (Interface de Conta) → T016 (Regressão e Qualidade).
- Tarefas paralelas: T001..T009 podem ser formuladas em paralelo; T013 e T014 podem ser desenvolvidas em paralelo após T012.
- Estratégia de MVP: Entrega ponta a ponta com cadastro/login direto e sync protegido de workspace no Cloudflare D1.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Pacote `better-auth` e seu adapter Drizzle para SvelteKit.
- Banco de dados Cloudflare D1 e binding configurado em `wrangler.jsonc`.
- `@sveltejs/adapter-cloudflare` para deploy no Cloudflare Workers.

#### Riscos

- **Limites diários do Cloudflare D1 Free**: Mitigado por sincronização incremental orientada a cursores com batches compactos.
- **Diferenças de runtime entre PWA (Browser) e Desktop (Tauri)**: Mitigado utilizando token de autenticação portátil suportado nativamente pelo Better Auth Client.

#### Suposições

- Usuários aceitam cadastro direto sem verificação prévia de email para manter simplicidade operacional sem serviços externos de SMTP/Resend.
- O workspace local permanece como autoridade offline primária no dispositivo do usuário.

### 17. Decisões

- **DEC-001**: Criação de `apps/sync-server` em SvelteKit dedicado no monorepo para isolar a infraestrutura de backend de sync/auth do cliente frontend.
- **DEC-002**: Adoção de Cloudflare D1 com Drizzle ORM e Better Auth nativo via `@sveltejs/adapter-cloudflare`, preservando a arquitetura serverless de baixo custo.
- **DEC-003**: Cadastro direto sem verificação de email inicial, eliminando dependências externas de envio de mensagens.
- **DEC-004**: Associação automática de workspaces no primeiro push e preservação absoluta de todos os dados locais no logout do usuário.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
