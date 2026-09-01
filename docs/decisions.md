# Decisões técnicas

<!-- specsfy:documentator:start -->
## Política

Decisões explícitas em `PROJECT.md` e `.specsfy/` prevalecem sobre inferências deste documento.
<!-- specsfy:documentator:end -->

## Decisões confirmadas em 2026-08-31

| Decisão                                                                                                                          | Fonte                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Execução local via `localhost` e PWA mobile hospedada na Cloudflare                                                              | Conversa de setup e `PROJECT.md`                                                                               |
| Uso individual sem autenticação                                                                                                  | Conversa de setup e `.specsfy/RULES.md`                                                                        |
| Markdown com YAML como fonte de sermões, estudos e notas                                                                         | Conversa de setup e `.specsfy/DATABASE.md`                                                                     |
| SQLite local para índices, destaques e dados auxiliares                                                                          | Conversa de setup e `.specsfy/DATABASE.md`                                                                     |
| shadcn-svelte como base de primitives de UI                                                                                      | Conversa de setup e `INTERFACE.md`                                                                             |
| Deploy em Cloudflare com adapter oficial do SvelteKit                                                                            | Conversa de setup e `.specsfy/RULES.md`                                                                        |
| Empacotamento desktop posterior com Tauri                                                                                        | Conversa de setup e `PROJECT.md`                                                                               |
| Vitest para testes unitários e de componentes                                                                                    | Conversa de setup e `.specsfy/RULES.md`                                                                        |
| TypeScript 5.9.3 isolado no pacote de ESLint e lint Svelte sem type-aware rules, enquanto os apps permanecem em TypeScript 7.0.2 | `packages/eslint-config/package.json`, `packages/eslint-config/index.js` e incompatibilidade observada no lint |
