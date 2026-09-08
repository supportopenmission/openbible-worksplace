# Integrações

<!-- specsfy:documentator:start -->
## Configuração

Valores de ambiente e integrações são documentados apenas pelos nomes declarados localmente, sem segredos.
<!-- specsfy:documentator:end -->

## Integrações de produto confirmadas

- Release atual: `0.8.2`, espelhado no PWA e no shell Tauri.

- Bancos bíblicos SQLite importados pelo usuário devem seguir o padrão do OpenLP.
- A aplicação também aceitará uma URL de distribuição, como Cloudflare R2, para
  acessar bancos SQLite.
- A execução local usará `localhost`; a versão PWA para mobile será hospedada na
  Cloudflare usando o adapter oficial do SvelteKit:
  https://svelte.dev/docs/kit/adapter-cloudflare.
- O preview de produção da aplicação web usa `bun run --cwd apps/web preview`,
  que recompila com o adapter Cloudflare e inicia `wrangler dev --local`; não
  usar `vite preview` para essa saída.
- O empacotamento desktop usa Tauri 2 como casca; o plugin de diálogo abre o
  seletor nativo de pasta e o shell usa `app.sqlite` para o registro operacional
  de workspaces. A raiz escolhida e seu manifesto permanecem preservados como
  fonte legada/autoral de migração e recovery.
- No PWA, o registro operacional usa o IndexedDB `openbible-workspace` por
  origem; o SQLite bíblico WASM permanece uma fonte somente leitura separada.
- A sincronização opcional usa `apps/sync-api`, um Worker Cloudflare com D1.
  `SYNC_TOKEN` é secret de ambiente; `MAX_BATCH_SIZE` e `MAX_PAYLOAD_BYTES` são
  variáveis públicas do Worker. O endpoint expõe health, push idempotente e
  pull incremental por cursor.
- O token do PWA fica somente em memória durante a sessão e não é salvo no
  workspace, exportação ou banco local. O Worker recebe documentos e tombstones,
  nunca o banco SQLite, paths, handles ou catálogo local.
