# Testes

<!-- specsfy:documentator:start -->
## Resumo

- Arquivos de teste: 46.
- Runner: não identificado.
- Scripts: build: turbo run build; check-types: turbo run check-types; dev: turbo run dev; lint: turbo run lint; format: prettier --write .; format:check: prettier --check ..

| Arquivo |
| --- |
| apps/web/src/lib/app-version.test.ts |
| apps/web/src/lib/features/bible/bible-library.test.ts |
| apps/web/src/lib/features/bible/bible-reader.test.ts |
| apps/web/src/lib/features/bible/highlights-page.test.ts |
| apps/web/src/lib/features/bible/reader-highlights-repository.test.ts |
| apps/web/src/lib/features/bible/reader-highlights.test.ts |
| apps/web/src/lib/features/bible/reader-note-indicators.test.ts |
| apps/web/src/lib/features/bible/reader-preference.test.ts |
| apps/web/src/lib/features/bible/reader-verse-notes.test.ts |
| apps/web/src/lib/features/bible/verse-selection.test.ts |
| apps/web/src/lib/features/bible-remote/remote-download.test.ts |
| apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts |
| apps/web/src/lib/features/bible-remote/remote-install.test.ts |
| apps/web/src/lib/features/bible-remote/remote-manifest.test.ts |
| apps/web/src/lib/features/config/config-page.spec.ts |
| apps/web/src/lib/features/home/continue-reading-card.spec.ts |
| apps/web/src/lib/features/home/home-continuation.spec.ts |
| apps/web/src/lib/features/home/home-entry.spec.ts |
| apps/web/src/lib/features/home/home-page.spec.ts |
| apps/web/src/lib/features/home/home-recents.spec.ts |
| apps/web/src/lib/features/home/home-states.spec.ts |
| apps/web/src/lib/features/home/quick-actions.spec.ts |
| apps/web/src/lib/features/home/recent-lists.spec.ts |
| apps/web/src/lib/features/navigation/app-sidebar.spec.ts |
| apps/web/src/lib/features/navigation/sidebar.test.ts |
| apps/web/src/lib/features/notes/note-block-interactions.test.ts |
| apps/web/src/lib/features/notes/note-markdown.test.ts |
| apps/web/src/lib/features/notes/note-verse-index.test.ts |
| apps/web/src/lib/features/notes/notes-repository.test.ts |
| apps/web/src/lib/features/notes/slash-verse-command.test.ts |
| apps/web/src/lib/features/notes/verse-block-extension.test.ts |
| apps/web/src/lib/features/notes/verse-selector.test.ts |
| apps/web/src/lib/features/onboarding/onboarding-errors.test.ts |
| apps/web/src/lib/features/onboarding/storage-choice.svelte.spec.ts |
| apps/web/src/lib/features/workspace/workspace-state.test.ts |
| apps/web/src/lib/features/workspace/workspace-stats.test.ts |
| apps/web/src/lib/index.test.ts |
| apps/web/src/lib/navigation/home-preference.spec.ts |
| apps/web/src/lib/navigation/home-preference.test.ts |
| apps/web/src/lib/pwa/daily-reminder.test.ts |
| apps/web/src/lib/pwa/mobile-viewport.test.ts |
| apps/web/src/lib/pwa/offline-reminder.test.ts |
| apps/web/src/lib/pwa/pwa-shell.test.ts |
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
