# OpenBible

Monorepo Turborepo com a PWA SvelteKit do OpenBible e pacotes de configuração
compartilhada.

## Desenvolvimento

```sh
bun install
bun run dev --filter=web
```

Verificação local:

```sh
bun exec turbo run build check-types lint --filter=web
```

## Estrutura

### Apps

- `web`: aplicação OpenBible ([SvelteKit](https://svelte.dev/docs/kit))

### Packages

- `eslint-config`: configuração ESLint compartilhada
- `typescript-config`: `tsconfig` compartilhado

### Tarefas Turbo

- `build`: build dos pacotes e apps
- `check-types`: checagem TypeScript
- `lint`: ESLint
- `test:unit`: testes unitários e de componentes (via `apps/web`)
