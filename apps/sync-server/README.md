# OpenBible Sync Server

Servidor SvelteKit para autenticação Better Auth e sincronização de workspaces
no Cloudflare Workers, com persistência no D1 `openbible-sync`.

## Desenvolvimento

```bash
bun run --cwd apps/sync-server db:migrate:local
bun run --cwd apps/sync-server dev
```

Para o Wrangler local, coloque o segredo em `apps/sync-server/.dev.vars` (esse
arquivo não deve ser versionado):

```dotenv
BETTER_AUTH_SECRET=<segredo-aleatorio-com-no-minimo-32-caracteres>
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Deploy

O app usa o modo Cloudflare Workers, não Pages. O fluxo de produção é:

```bash
bun run --cwd apps/sync-server build
bun run --cwd apps/sync-server db:migrate:remote
bunx wrangler secret put BETTER_AUTH_SECRET --config apps/sync-server/wrangler.jsonc
bun run --cwd apps/sync-server deploy
```

Configure `BETTER_AUTH_URL` e `BETTER_AUTH_TRUSTED_ORIGINS` como variáveis do
Worker quando a URL pública do servidor e a origem do `apps/web` estiverem
definidas. O endpoint `GET /health` valida o processo e a conexão com o D1.

O Worker legado `openbible-sync-api` não é removido automaticamente; clientes
devem ser apontados para o novo `openbible-sync-server` antes de sua retirada.
