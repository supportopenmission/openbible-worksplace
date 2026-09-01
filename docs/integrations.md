# Integrações

<!-- specsfy:documentator:start -->
## Configuração

Valores de ambiente e integrações são documentados apenas pelos nomes declarados localmente, sem segredos.
<!-- specsfy:documentator:end -->

## Integrações de produto confirmadas

- Bancos bíblicos SQLite importados pelo usuário devem seguir o padrão do OpenLP.
- A aplicação também aceitará uma URL de distribuição, como Cloudflare R2, para
  acessar bancos SQLite.
- A execução local usará `localhost`; a versão PWA para mobile será hospedada na
  Cloudflare usando o adapter oficial do SvelteKit:
  https://svelte.dev/docs/kit/adapter-cloudflare.
- O preview de produção da aplicação web usa `bun run --cwd apps/web preview`,
  que recompila com o adapter Cloudflare e inicia `wrangler dev --local`; não
  usar `vite preview` para essa saída.
- O empacotamento desktop com Tauri está planejado para uma etapa posterior e
  ainda não existe no código atual.
- Nenhuma credencial, variável de ambiente ou integração de backend foi
  identificada no código atual.
