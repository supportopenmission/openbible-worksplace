# Contexto local — SPEC-0014

## Proveniência

Consulta somente ao repositório OpenBible em 2026-09-04. Este artefato não é
uma decisão normativa independente; indexa as fontes locais usadas pela spec.

## Evidência observada

- `apps/web` usa SvelteKit/Svelte, TypeScript, Tailwind CSS, Vitest,
  Playwright e primitives locais shadcn-svelte.
- `apps/web/src/lib/storage/` contém adapters web para workspace, OPFS,
  preferências e `sql.js`; `apps/web/src/lib/features/workspace/` contém boot,
  shell e recuperação de permissão.
- `.specsfy/DATABASE.md` confirma Markdown/JSON como fonte de arquivos do
  workspace, `.openbible/index.sqlite` como SQLite auxiliar e `bibles/*.sqlite`
  como bancos bíblicos consultados.
- `INTERFACE.md` confirma `AppFrame`, `AppSidebar`, `WorkspaceBootSplash`,
  `PermissionRecovery`, `OnboardingModal`, `WorkspaceSettings`, `ConfigPage`,
  `PageHeader`, `Dialog`, `Sheet` e os estados responsivos existentes.

## Impacto na spec

- O shell Tauri deve ser um wrapper novo que reutiliza o artefato de `apps/web`;
  não há base local que justifique uma UI React ou uma segunda aplicação de
  domínio.
- A implementação nativa deve respeitar os owners e formatos existentes e
  introduzir uma ponte de storage, não uma migração de schema.
- A interface nativa precisa estender estados de onboarding/configuração e
  manter o mapa de rotas e componentes registrado em `INTERFACE.md`.
