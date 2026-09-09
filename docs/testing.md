# Testes

<!-- specsfy:documentator:start -->
## Resumo

- Arquivos de teste: 130.
- Runner: não identificado.
- Scripts: build: turbo run build; check-types: turbo run check-types; dev: turbo run dev; lint: turbo run lint; format: prettier --write .; format:check: prettier --check ..

| Arquivo |
| --- |
| apps/sync-api/src/sync-api.test.ts |
| apps/sync-server/src/test/auth.test.ts |
| apps/sync-server/src/test/sync-auth.test.ts |
| apps/sync-server/src/test/workspaces.test.ts |
| apps/web/src/lib/app-version.test.ts |
| apps/web/src/lib/bible/editor/bibleReferenceDecorations.test.ts |
| apps/web/src/lib/bible/parser/BibleReferenceParser.test.ts |
| apps/web/src/lib/bible/parser/translations.test.ts |
| apps/web/src/lib/bible/repository/bible-repository.test.ts |
| apps/web/src/lib/bible/stores/bible-reference-viewer.test.ts |
| apps/web/src/lib/features/ai/agent-context-picker.svelte.spec.ts |
| apps/web/src/lib/features/ai/agent-failure-red.test.ts |
| apps/web/src/lib/features/ai/agent-observability-red.test.ts |
| apps/web/src/lib/features/ai/agent-profile-red.test.ts |
| apps/web/src/lib/features/ai/agent-proposal-review.svelte.spec.ts |
| apps/web/src/lib/features/ai/agent-run-red.test.ts |
| apps/web/src/lib/features/ai/ai-interface.test.ts |
| apps/web/src/lib/features/ai/ai-regression.test.ts |
| apps/web/src/lib/features/ai/context-red.test.ts |
| apps/web/src/lib/features/ai/gateway-red.test.ts |
| apps/web/src/lib/features/ai/proposal-red.test.ts |
| apps/web/src/lib/features/ai/service-worker-boundary-red.test.ts |
| apps/web/src/lib/features/auth/auth-client.test.ts |
| apps/web/src/lib/features/auth/email-suggestion.test.ts |
| apps/web/src/lib/features/bible/bible-library.test.ts |
| apps/web/src/lib/features/bible/bible-note-split.test.ts |
| apps/web/src/lib/features/bible/bible-reader.test.ts |
| apps/web/src/lib/features/bible/bible-settings.spec.ts |
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
| apps/web/src/lib/features/config/t024-backup.svelte.spec.ts |
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
| apps/web/src/lib/features/notes/MilkdownMobileToolbar.test.ts |
| apps/web/src/lib/features/notes/MilkdownNoteEditor.test.ts |
| apps/web/src/lib/features/notes/highlight-file-repository.test.ts |
| apps/web/src/lib/features/notes/index-rebuilder.benchmark.test.ts |
| apps/web/src/lib/features/notes/index-rebuilder.test.ts |
| apps/web/src/lib/features/notes/legacy-migration.test.ts |
| apps/web/src/lib/features/notes/milkdown-mark-node.test.ts |
| apps/web/src/lib/features/notes/milkdown-markdown-io.test.ts |
| apps/web/src/lib/features/notes/milkdown-placeholder-plugin.test.ts |
| apps/web/src/lib/features/notes/milkdown-slash-drawer.test.ts |
| apps/web/src/lib/features/notes/milkdown-slash.test.ts |
| apps/web/src/lib/features/notes/milkdown-verse-node.test.ts |
| apps/web/src/lib/features/notes/milkdown-video-node.test.ts |
| apps/web/src/lib/features/notes/note-block-interactions.test.ts |
| apps/web/src/lib/features/notes/note-editor-service.test.ts |
| apps/web/src/lib/features/notes/note-editor-viewport.test.ts |
| apps/web/src/lib/features/notes/note-export.test.ts |
| apps/web/src/lib/features/notes/note-index.test.ts |
| apps/web/src/lib/features/notes/note-markdown.test.ts |
| apps/web/src/lib/features/notes/note-toolbar.test.ts |
| apps/web/src/lib/features/notes/note-verse-index.test.ts |
| apps/web/src/lib/features/notes/notes-delete-refresh.test.ts |
| apps/web/src/lib/features/notes/notes-repository-sync.test.ts |
| apps/web/src/lib/features/notes/notes-repository.test.ts |
| apps/web/src/lib/features/notes/notes-state-switching.test.ts |
| apps/web/src/lib/features/notes/notes-state.test.ts |
| apps/web/src/lib/features/notes/portable-block-ui.test.ts |
| apps/web/src/lib/features/notes/portable-envelope.test.ts |
| apps/web/src/lib/features/notes/portable-markdown.test.ts |
| apps/web/src/lib/features/notes/reference-hover.test.ts |
| apps/web/src/lib/features/notes/selection-popover.test.ts |
| apps/web/src/lib/features/notes/slash-verse-command.test.ts |
| apps/web/src/lib/features/notes/verse-block-extension.test.ts |
| apps/web/src/lib/features/notes/verse-selector.test.ts |
| apps/web/src/lib/features/notes/youtube-embed.test.ts |
| apps/web/src/lib/features/onboarding/onboarding-errors.test.ts |
| apps/web/src/lib/features/onboarding/storage-choice.svelte.spec.ts |
| apps/web/src/lib/features/sync/account-sync.test.ts |
| apps/web/src/lib/features/sync/cloud-workspace-service.test.ts |
| apps/web/src/lib/features/sync/external-edit-bridge.test.ts |
| apps/web/src/lib/features/sync/peer-conflict-panel.svelte.spec.ts |
| apps/web/src/lib/features/sync/peer-conflict-panel.test.ts |
| apps/web/src/lib/features/sync/peer-policy.test.ts |
| apps/web/src/lib/features/sync/sync-automerge.test.ts |
| apps/web/src/lib/features/sync/sync-database-inventory.test.ts |
| apps/web/src/lib/features/sync/sync-document-registry.test.ts |
| apps/web/src/lib/features/sync/sync-envelope-guard.test.ts |
| apps/web/src/lib/features/sync/sync-governance-inventory.test.ts |
| apps/web/src/lib/features/sync/sync-http-integration.test.ts |
| apps/web/src/lib/features/sync/sync-interface-inventory.test.ts |
| apps/web/src/lib/features/sync/sync-network-adapters.test.ts |
| apps/web/src/lib/features/sync/sync-repository.test.ts |
| apps/web/src/lib/features/sync/sync-settings.test.ts |
| apps/web/src/lib/features/sync/sync-status.test.ts |
| apps/web/src/lib/features/sync/sync-storage-adapters.test.ts |
| apps/web/src/lib/features/workspace/native-workspace-states.test.ts |
| apps/web/src/lib/features/workspace/permission-recovery.spec.ts |
| apps/web/src/lib/features/workspace/t023-backup.svelte.spec.ts |
| apps/web/src/lib/features/workspace/t025-backup.svelte.spec.ts |
| apps/web/src/lib/features/workspace/t026-backup.svelte.spec.ts |
| apps/web/src/lib/features/workspace/t027-backup.svelte.spec.ts |
| apps/web/src/lib/features/workspace/workspace-recovery.test.ts |
| apps/web/src/lib/features/workspace/workspace-selector.spec.ts |
| apps/web/src/lib/features/workspace/workspace-settings.spec.ts |
| apps/web/src/lib/features/workspace/workspace-state.test.ts |
| apps/web/src/lib/features/workspace/workspace-stats.test.ts |
| apps/web/src/lib/features/workspace/workspace-switching.test.ts |
| apps/web/src/lib/index.test.ts |
| apps/web/src/lib/navigation/home-preference.spec.ts |
| apps/web/src/lib/navigation/home-preference.test.ts |
| apps/web/src/lib/pwa/client-reset.test.ts |
| apps/web/src/lib/pwa/daily-reminder.test.ts |
| apps/web/src/lib/pwa/mobile-viewport.test.ts |
| apps/web/src/lib/pwa/offline-reminder.test.ts |
| apps/web/src/lib/pwa/pwa-shell.test.ts |
| apps/web/src/lib/pwa/pwa.test.ts |
| apps/web/src/lib/pwa/service-worker-registration.test.ts |
| apps/web/src/lib/theme/theme.test.ts |
| apps/web/src/lib/updates/app-updates.test.ts |
<!-- specsfy:documentator:end -->

## Suíte browser da aplicação web

Os cenários de interface usam Vitest Browser Mode com Chromium e seguem o
contrato `SPECSFY:` da spec concluída:

- `apps/web/src/routes/onboarding.svelte.spec.ts`
- `apps/web/src/routes/page.svelte.spec.ts`
- `apps/web/src/routes/config.svelte.spec.ts`
- `apps/web/src/routes/navigation.svelte.spec.ts`
- `apps/web/src/routes/theme.svelte.spec.ts`
- `apps/web/src/routes/highlights.svelte.spec.ts`
- `apps/web/src/routes/notes-editor.svelte.spec.ts`

As fatias de persistência e exportação também têm cobertura focal em
`workspace-content-repository.test.ts`, `index-rebuilder.test.ts`,
`portable-block-ui.test.ts` e `note-export.test.ts`. Antes de cada suíte que
possa tocar persistência, o projeto exige `check_database_safety.mjs` com
resultado `SAFE`.

## Contexto confirmado

Vitest é o runner confirmado para testes unitários e de componentes, com a
configuração em `apps/web/vitest.config.ts`. Playwright está configurado para
testes de navegador via Vitest Browser Mode.
