# Testes

<!-- specsfy:documentator:start -->
## Resumo

- Arquivos de teste: 21.
- Runner: não identificado.
- Scripts: build: turbo run build; check-types: turbo run check-types; dev: turbo run dev; lint: turbo run lint; format: prettier --write .; format:check: prettier --check ..

| Arquivo |
| --- |
| apps/web/src/lib/features/bible/bible-reader.test.ts |
| apps/web/src/lib/features/bible/highlights-page.test.ts |
| apps/web/src/lib/features/bible/reader-highlights-repository.test.ts |
| apps/web/src/lib/features/bible/reader-highlights.test.ts |
| apps/web/src/lib/features/bible/reader-note-indicators.test.ts |
| apps/web/src/lib/features/bible/reader-preference.test.ts |
| apps/web/src/lib/features/bible/reader-verse-notes.test.ts |
| apps/web/src/lib/features/bible/verse-selection.test.ts |
| apps/web/src/lib/features/navigation/sidebar.test.ts |
| apps/web/src/lib/features/notes/note-block-interactions.test.ts |
| apps/web/src/lib/features/notes/note-markdown.test.ts |
| apps/web/src/lib/features/notes/note-verse-index.test.ts |
| apps/web/src/lib/features/notes/notes-repository.test.ts |
| apps/web/src/lib/features/notes/slash-verse-command.test.ts |
| apps/web/src/lib/features/notes/verse-block-extension.test.ts |
| apps/web/src/lib/features/notes/verse-selector.test.ts |
| apps/web/src/lib/index.test.ts |
| apps/web/src/lib/navigation/home-preference.test.ts |
| apps/web/src/lib/pwa/pwa.test.ts |
| apps/web/src/lib/pwa/service-worker-registration.test.ts |
| apps/web/src/lib/theme/theme.test.ts |
<!-- specsfy:documentator:end -->

## Suíte browser da aplicação web

Os cenários de interface usam Vitest Browser Mode com Chromium e seguem o
contrato `SPECSFY:` da spec concluída:

- `apps/web/src/routes/onboarding.svelte.spec.ts`
- `apps/web/src/routes/page.svelte.spec.ts`
- `apps/web/src/routes/config.svelte.spec.ts`
- `apps/web/src/routes/navigation.svelte.spec.ts`
- `apps/web/src/routes/theme.svelte.spec.ts`

## Contexto confirmado

Vitest é o runner confirmado para testes unitários e de componentes, com a
configuração em `apps/web/vitest.config.ts`. Playwright está configurado para
testes de navegador via Vitest Browser Mode.
