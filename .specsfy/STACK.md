# Stack do sistema

Documente tecnologias estruturais e a evidência executável que confirma cada
uma. Preserve decisões humanas nas seções livres deste arquivo.

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Runtime | Node.js | `package.json` |
| Gerenciador | Bun 1.4.0 | `package.json` (`devEngines.packageManager`) e `bun.lock` (`lockfileVersion`) |
| Monorepo | Turborepo ^2.10.12 | `package.json` |
| Framework | SvelteKit 2.70.2 | `apps/web/package.json` e `svelte.config.js` |
| Biblioteca de interface | Svelte 5.56.9 | `package.json` (catalogo `sveltejs`) e `apps/web/package.json` |
| Linguagem | TypeScript 7.0.2 | `apps/web/package.json` |
| Bundler | Vite 8.2.1 | `apps/web/package.json` e `apps/web/vite.config.ts` |
| Testes | Vitest 4.1.10 | `apps/web/package.json` e `apps/web/vitest.config.ts` |
| Testes de navegador | Playwright 1.62.1 | `apps/web/package.json` e `playwright.config.ts` |
| CSS | Tailwind CSS 4.3.3 | `apps/web/package.json`, `apps/web/vite.config.ts` e `apps/web/src/app.css` |
| Primitives de interface | shadcn-svelte local, estilo Nova | `apps/web/components.json` e `apps/web/src/lib/components/ui/` |
| Editor Markdown principal | @milkdown/kit 7.22.1 | `apps/web/package.json`, `bun.lock` e `apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte` |
| Parser de diretivas Markdown | remark-directive 4.0.0 | `apps/web/package.json`, `bun.lock` e `apps/web/src/lib/features/notes/milkdown-verse-node.ts` |
| Editor legado (compatibilidade transitória) | @friendofsvelte/tipex 0.2.0 | `apps/web/package.json` e testes de caracterização legados |
| Extensão legada do editor | @tiptap/extension-highlight 2.27.2 | `apps/web/package.json`, `bun.lock` e utilitário legado `verse-block-extension.ts` |
| Desktop | Tauri 2.11.5 | `apps/desktop/src-tauri/Cargo.toml` e `apps/desktop/package.json` |
| Diálogo nativo | tauri-plugin-dialog 2.7.3 | `apps/desktop/src-tauri/Cargo.toml`, `src-tauri/src/lib.rs` e `capabilities/default.json` |
| Backend desktop | Rust 2021 + rusqlite 0.40.2 | `apps/desktop/src-tauri/Cargo.toml` |
| Build macOS | Tauri universal-apple-darwin | `apps/desktop/package.json` scripts `build`/`build:debug` |
| Adapter desktop | @sveltejs/adapter-static 3.0.8 | `apps/web/package.json` e `apps/web/svelte.config.js` |
| Ponte web→desktop | @tauri-apps/api 2.11.1 | `apps/web/package.json` |
| Seletor de pasta nativo | @tauri-apps/plugin-dialog 2.7.3 | `apps/web/package.json` e `apps/web/src/lib/storage/storage-registry.ts` |
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
- Tauri é o shell desktop implementado para macOS e Linux; o plugin de diálogo
  fornece a escolha nativa da pasta do workspace.
- Dependências estruturais de `apps/web/package.json` (Vitest, Playwright,
  shadcn-svelte, Tipex, `@tiptap/extension-highlight`) reconciliadas no inventário
  após a SPEC-0006 em 2026-09-03; sem mudança de framework para a SPEC-0007.
- Favicon, `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` derivam de
  `apps/web/static/logo-minimal.png` (marca branca em fundo preto com área de
  segurança para maskable); o manifesto segue `standalone` com `purpose any
  maskable`.
- Versão visível do app em `0.4.0`: canônico em `apps/web/package.json`
  (`version`), espelhado em `apps/web/src/lib/app-version.ts` (`APP_VERSION`)
  via `bun run version:sync [X.Y.Z]` (`apps/web/scripts/sync_app_version.mjs`).
  Exibida no rodapé da sidebar e em `/config`.
- `bun.lock` foi verificado durante o setup desta tarefa; a implementação do
  seletor de pasta não altera a stack nem adiciona dependências.
- A SPEC-0013 tornou `@milkdown/kit` 7.22.1 o motor principal de `/notes/[id]`
  e do split de notas no leitor, com `remark-directive` para roundtrip do fence
  `:::verse`. Tipex/TipTap permanecem temporariamente apenas em arquivos e
  testes legados até sua remoção segura após a regressão completa.
- O seletor de versículos usa os primitives locais `Select` e `Drawer` do
  shadcn-svelte; o Drawer depende de `vaul-svelte` para a interação móvel.
