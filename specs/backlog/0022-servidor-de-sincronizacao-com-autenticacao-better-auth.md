# Backlog: Servidor de sincronização com autenticação better-auth

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0022 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | BACKLOG-0016 — arquitetura local-first, interoperabilidade e sincronização |
| Funcionalidade | Servidor de sincronização multitenant com autenticação de usuário (better-auth) |
| Tipo | Feature arquitetural / backend e autenticação |
| Prioridade | P1 |
| Milestones | Pós-SPEC-0019; sincronização em nuvem com conta de usuário |
| Criado em | 2026-09-08 |
| Spec promovida | `specs/planned/0021-servidor-de-sincronizacao-com-autenticacao-better-auth/spec.md` |

## Ideia original

vamos implementar um server para sincronizacao de dados, a ideia é que o usuario possa fazer o login e senha (ou se cadsstrar) para ter a sincronia dos dados. O app continua sendo offiline first mais com a sincronia. Use o https://svelte.dev/docs/cli/better-auth para o auth

## Problema percebido

O aplicativo é offline-first, mas necessita de um servidor de sincronização com autenticação de usuário (login/senha e cadastro via better-auth) para sincronizar dados do workspace entre múltiplos aparelhos com segurança e isolamento por conta.

## Pessoa afetada ou beneficiada

Pessoa usuária do OpenBible que utiliza múltiplos dispositivos (PWA e desktop Tauri) e deseja sincronizar seus dados do workspace em sua conta própria.

## Resultado ou valor esperado

Servidor de sincronização integrado com better-auth para login e cadastro, permitindo que réplicas locais sincronizem dados sob a identidade do usuário, sem perder a capacidade de operação offline-first.

## Contexto

Evolução da infraestrutura de sync após a SPEC-0019; transição da sincronização com SYNC_TOKEN estático para um serviço autenticado multitenant com better-auth e persistência de contas/sessões.

## Referências relacionadas

- `specs/inbox/2026-09-08-131418-servidor-de-sincronizacao-com-autenticacao-better-auth.md` — captura original na Inbox.
- `specs/completed/0019-sincronizacao-local-first-automerge/spec.md` — especificação normativa anterior de sincronização incremental (SPEC-0019).
- `apps/sync-api/` — serviço de sincronização atual (Cloudflare Worker + D1).
- `apps/web/` — aplicação SvelteKit compartilhada entre PWA e desktop Tauri.
- `https://svelte.dev/docs/cli/better-auth` — documentação de referência para integração do better-auth via Svelte CLI com Drizzle.

## Comportamento esperado

- O monorepo terá um app SvelteKit dedicado para o servidor de sincronização e autenticação (ex.: `apps/sync-server` ou evolução de `apps/sync-api` para SvelteKit), isolando o backend do cliente frontend.
- O servidor rodará na Cloudflare usando `@sveltejs/adapter-cloudflare` e Cloudflare D1 como banco de dados relacional com Drizzle ORM.
- O servidor usa Better Auth com Drizzle (D1) para gerenciar contas de usuário, login por email/senha, cadastro e sessões/tokens de autenticação.
- Os endpoints de sincronização (`push` e `pull`) exigem autenticação válida do usuário e validam se o workspace pertence à conta autenticada.
- No cliente OpenBible (`apps/web`), a autenticação é acessada nas Configurações (`/config`), em uma seção dedicada "Conta e Sincronização", com formulários de login e cadastro por email e senha, indicador da conta conectada, status de sincronização e ação de logout.
- O aplicativo permanece 100% funcional offline para leitura e escrita local; quando deslogado ou offline, opera normalmente e só dispara sincronização ao autenticar e dispor de conexão.
- Associação de workspaces: o workspace local ativo é vinculado automaticamente à conta no primeiro sync; o servidor mantém um catálogo de workspaces vinculados ao `userId`.
- Multi-dispositivo: ao fazer login em um novo aparelho, o usuário pode visualizar seus workspaces na nuvem para conectar/baixar cópia local ou vincular um workspace local existente.
- Ao fazer logout (desconectar a conta): todos os dados, notas, sermões e workspaces locais permanecem 100% intactos no dispositivo, interrompendo unicamente o envio e recebimento de dados remotos até uma nova autenticação.
- Cadastro sem atrito: criação de conta direta com email e senha, sem exigir verificação de email prévia para início de uso e sincronização.

## Regras de negócio

- **RB-001**: O aplicativo OpenBible continua estritamente offline-first; toda leitura, criação de notas, sermões, destaques e estudos bíblicos funciona localmente mesmo sem conta ou sem internet.
- **RB-002**: A sincronização com o servidor somente é executada se houver um usuário autenticado com sessão válida e conectividade com a rede.
- **RB-003**: Cada workspace sincronizado na nuvem possui um proprietário único (`userId`); requisições de leitura (`pull`) ou escrita (`push`) para um `workspaceId` que pertença a outro usuário são bloqueadas com `403 Forbidden`.
- **RB-004**: No primeiro `push` de um workspace com `workspaceId` ainda não existente na nuvem, o servidor vincula automaticamente aquele workspace ao `userId` autenticado no catálogo de workspaces da conta.
- **RB-005**: Ao deslogar (logout), nenhum dado local ou arquivo do workspace é apagado; a sessão é encerrada no cliente e a sincronização remota é pausada até novo login.
- **RB-006**: As senhas são protegidas por hash seguro nativo do Better Auth; senhas em texto puro nunca são persistidas nem logadas.
- **RB-007**: O cadastro não exige envio de email nem verificação de link externa, permitindo operação autônoma no Cloudflare D1 sem dependência de serviços externos de email.

## Critérios de aceitação

- **AC-001 — Cadastro de conta**: Dado um usuário não autenticado em Configurações > Conta e Sincronização, quando ele preenche nome, email e senha válidos e envia o cadastro, então a conta é criada via Better Auth, uma sessão é estabelecida e a interface reflete o estado autenticado.
- **AC-002 — Login de conta**: Dado um usuário com conta previamente cadastrada, quando ele preenche suas credenciais em Configurações, então o sistema autentica a sessão e habilita a sincronização com o servidor.
- **AC-003 — Sincronização autenticada**: Dado um usuário autenticado com um workspace local ativo, quando o sincronizador executa `push` ou `pull`, então os dados de sincronização são enviados/recebidos sob a identidade daquele usuário e persistidos no Cloudflare D1.
- **AC-004 — Bloqueio de acesso não autorizado**: Dado uma requisição de `push` ou `pull` sem token/sessão válida ou com token de outro usuário tentando acessar o `workspaceId` alheio, então o servidor responde com erro `401 Unauthorized` ou `403 Forbidden`.
- **AC-005 — Catálogo de workspaces em novo dispositivo**: Dado um usuário autenticado em um novo aparelho, quando ele acessa a área de sincronização, então o app lista os workspaces existentes vinculados à sua conta no servidor e permite conectar/sincronizar.
- **AC-006 — Logout seguro e preservação local**: Dado um usuário logado com sincronização ativa, quando ele aciona "Desconectar conta", então a sessão é finalizada, a sincronização é interrompida e 100% dos dados locais do workspace permanecem acessíveis e intactos.
- **AC-007 — Operação offline contínua**: Dado um usuário deslogado ou sem conexão de rede, quando ele usa o app (cria, edita ou exclui notas), então o app salva no backend operacional local (`app.sqlite` / IndexedDB) sem travar ou exigir login.

## Qualidades e operação

- **Segurança**: Credenciais protegidas pelo Better Auth; endpoints de sync protegidos por checagem de sessão e validação de `userId == workspace.owner_id`; tráfego 100% HTTPS.
- **Privacidade**: Sem telemetria oculta; dados de sincronização isolados por conta; dados locais nunca deletados por ações de rede sem confirmação explícita.
- **Desempenho e volume**: Uso eficiente do Cloudflare D1 com Drizzle ORM; lotes incrementais por cursor; sem queries desnecessárias quando offline.
- **Auditoria e observabilidade**: Endpoints de `/health` e logs de erros no Worker/SvelteKit sem exposição de senhas, tokens ou dados pessoais em logs de texto.

## Dependências

- `SPEC-0019` — Sincronização local-first com Automerge (contrato de payloads `push`/`pull` e cursores).
- Pacote `better-auth` e `@sveltejs/adapter-cloudflare` com `drizzle-orm` e `drizzle-kit`.
- Cloudflare D1 database.

## Situações de erro

- Sessão expirada ou inválida → O cliente sinaliza necessidade de reautenticação sem interromper a edição local offline.
- Email duplicado no cadastro → Better Auth retorna erro específico e a interface exibe feedback claro em português.
- Falha de conexão com o servidor → O cliente registra a falha no monitor de sincronização e tenta novamente quando a rede estiver disponível.
- Tentativa de acesso a workspace de outro usuário → O servidor rejeita com `403 Forbidden`.

## Escopo

- **Dentro**: Criação de `apps/sync-server` (SvelteKit com Drizzle + Cloudflare D1 + Better Auth); migração/criação das tabelas no D1; endpoints de auth (`/api/auth/*`) e sync (`/v1/workspaces/*`); interface de Login/Cadastro/Logout em `apps/web` (`/config`); listagem de workspaces da conta; cliente Better Auth integrado ao sync do app.
- **Fora**: Provedores OAuth de terceiros (Google, GitHub — ficam para fatias posteriores); verificação obrigatória por email; cobrança/planos pagos; criptografia ponta a ponta (E2EE) nesta primeira versão.

## Dúvidas, decisões e riscos

- **Decisão**: App SvelteKit dedicado no monorepo (`apps/sync-server`) para isolar o backend de sync/auth do frontend.
- **Decisão**: Cloudflare D1 + Drizzle ORM via `@sveltejs/adapter-cloudflare`.
- **Decisão**: Cadastro direto sem verificação de email inicial.
- **Decisão**: Associação automática no primeiro sync e catálogo de workspaces por `userId`.
- **Decisão**: Logout nunca remove nem limpa dados locais.
- **Risco**: Limites gratuitos do Cloudflare D1 (5M leituras/dia, 100k escritas/dia) — mitigado por lotes incrementais com cursores.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify` e criar a especificação normativa `specs/draft/0021-servidor-de-sincronizacao-com-better-auth/spec.md`.
