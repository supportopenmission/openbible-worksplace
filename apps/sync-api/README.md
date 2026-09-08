# OpenBible Sync API

API HTTPS incremental para sincronizar notas e destaques entre réplicas Tauri
(`app.sqlite`) e PWA (IndexedDB). O serviço não recebe SQLite, paths absolutos,
handles, catálogo local ou credenciais. O token é lido como secret do Worker;
nenhum token é versionado neste repositório.

## Desenvolvimento local

```bash
bun install
bun run --cwd apps/sync-api dev # aplica a migration local antes do Worker
```

Se o D1 local já estiver em uso por outro processo, aplique a migration
separadamente antes de iniciá-lo:

```bash
bun run --cwd apps/sync-api db:migrate:local
```

O placeholder `database_id` em `wrangler.jsonc` é suficiente para o D1 local.
Para uma conta Cloudflare, crie o banco e substitua esse valor apenas no
ambiente de deploy:

```bash
wrangler d1 create openbible-sync
wrangler secret put SYNC_TOKEN --config apps/sync-api/wrangler.jsonc
bun run --cwd apps/sync-api db:migrate:remote
bun run --cwd apps/sync-api deploy
```

Depois, valide `GET /health` e configure no app o endpoint HTTPS publicado e o
mesmo token durante a sessão. O PWA não grava esse token em localStorage,
IndexedDB, SQLite ou exportações.

## Contrato

- `GET /health`: disponibilidade básica sem autenticação.
- `POST /v1/workspaces/:workspaceId/sync/push`: lote idempotente por
  `operationId`, com revisão base, payload de documento ou tombstone.
- `GET /v1/workspaces/:workspaceId/sync/pull?after=<cursor>&limit=<n>`: mudanças
  incrementais ordenadas por cursor.

Uma revisão divergente é preservada como conflito explícito. O serviço não faz
merge semântico de texto e não sobrescreve silenciosamente a edição local.
TLS protege o transporte, mas esta primeira versão não oferece E2EE: o Worker e
o D1 podem observar e reter o estado sincronizado.

## Limites do Cloudflare Free

O plano gratuito é adequado para um MVP ou beta pequeno, desde que o uso seja
monitorado. No momento desta implementação, o Workers Free oferece 100.000
requests/dia e 10 ms de CPU por invocação; o D1 Free oferece 5 milhões de
linhas lidas/dia, 100.000 linhas escritas/dia e 5 GB de armazenamento total.
As cotas atuais e o comportamento após excedê-las devem ser conferidos na
[documentação oficial de limites do Workers](https://developers.cloudflare.com/workers/platform/limits/)
e na [documentação de preços do D1](https://developers.cloudflare.com/d1/platform/pricing/).

Após o limite diário de linhas do D1, as queries podem falhar até a virada UTC;
o app continua local-first e deve tentar novamente depois. A API usa cursores,
índices por workspace e lotes pequenos para reduzir consumo.

Para o protocolo CRDT oficial do Automerge, consulte o
[`WebSocketClientAdapter`](https://automerge.org/docs/reference/repositories/networking/)
e o [servidor de referência](https://github.com/automerge/automerge-repo-sync-server).
Essa alternativa exige WebSocket e não é o transporte HTTP desta API.
