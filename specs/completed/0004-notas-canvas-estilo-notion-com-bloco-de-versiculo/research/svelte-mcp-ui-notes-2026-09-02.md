# Svelte MCP — notas aplicáveis à SPEC-0004

- Origem: `@sveltejs/mcp` oficial, comando `get-documentation`
- Consultado em: 2026-09-02
- Seções: `svelte/$state`, `svelte/$derived`, `svelte/lifecycle-hooks`, `svelte/svelte-window`, `svelte/each`, `svelte/snippet`, `svelte/global-styles`
- Versão alvo: Svelte 5

## Evidência aplicada

- Estado mutável da interface usa `$state`; coleções filtradas e valores calculados sem efeitos usam `$derived`.
- `<svelte:window>` registra listeners globais e bindings de viewport com cleanup automático, sendo apropriado para teclado, resize e scroll do overlay.
- Listas dinâmicas usam `{#each}` com chave estável.
- Conteúdo reutilizável em componentes Svelte 5 usa snippets tipados quando necessário.
- Overrides de elementos de bibliotecas dentro de componentes usam seletores `:global(...)` restritos ao ancestral local.
- Componentes alterados devem passar pelo `svelte-autofixer` do mesmo MCP antes da entrega.
