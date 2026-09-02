# Stack do sistema

Documente tecnologias estruturais e a evidência executável que confirma cada
uma. Preserve decisões humanas nas seções livres deste arquivo.

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Runtime | Node.js | `package.json` |
| Gerenciador | Bun 1.4.0 | `package.json` (`devEngines.packageManager`) |
| Monorepo | Turborepo ^2.10.12 | `package.json` |
| Framework | SvelteKit 2.70.2 | `apps/web/package.json` e `svelte.config.js` |
| Biblioteca de interface | Svelte 5.56.9 | `package.json` (catalogo `sveltejs`) e `apps/web/package.json` |
| Linguagem | TypeScript 7.0.2 | `apps/web/package.json` |
| Bundler | Vite 8.2.1 | `apps/web/package.json` e `apps/web/vite.config.ts` |
| Testes | Vitest 4.1.10 | `apps/web/package.json` e `apps/web/vitest.config.ts` |
| Testes de navegador | Playwright 1.62.1 | `apps/web/package.json` e `playwright.config.ts` |
| CSS | Tailwind CSS 4.3.3 | `apps/web/package.json`, `apps/web/vite.config.ts` e `apps/web/src/app.css` |
| Primitives de interface | shadcn-svelte local, estilo Nova | `apps/web/components.json` e `apps/web/src/lib/components/ui/` |
| Editor canvas | @friendofsvelte/tipex 0.2.0 | `apps/web/package.json` |
| Extensão do editor | @tiptap/extension-highlight 2.27.2 | `apps/web/package.json` e `bun.lock` |
<!-- specsfy:stack:end -->

## Decisões e observações do projeto

Acrescente aqui escolhas, restrições e contexto que não podem ser inferidos dos
manifests.

- SvelteKit e Svelte são a stack de interface confirmada; shadcn-svelte foi
  materializado localmente como base de primitives `Item`, `Sidebar` e suas
  dependências. Não há React, shadcn/ui ou ReUI configurados no código atual.
- Os apps mantêm TypeScript 7.0.2; `@repo/eslint-config` declara TypeScript 5.9.3
  isoladamente porque `typescript-eslint` 8.67.0 ainda não suporta a API do
  TypeScript 7. O lint de Svelte permanece sintaxe-aware até essa compatibilidade
  ser disponibilizada.
- SQLite local e Markdown com YAML frontmatter são decisões de produto para a
  próxima implementação, não tecnologias já presentes no repositório.
- A aplicação deve funcionar via `localhost` e ser hospedada na Cloudflare como
  PWA mobile usando `@sveltejs/adapter-cloudflare` como adapter oficial do
  SvelteKit; a aplicação web já está configurada para esse adapter em
  `apps/web/svelte.config.js`.
- A aplicação web publica um manifesto standalone e um service worker versionado
  para cache do app shell, rotas locais e assets estáticos após o primeiro acesso.
- Tauri é o alvo confirmado para empacotamento desktop posterior; ainda não faz
  parte da stack implementada.
