# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: preacher (pastor/missionary/teacher) preparing sermons and structured Bible studies individually, offline-first, on desktop and mobile.

The person works solo on their own studies, sermons, and notes. MVP requires no account or login.

## Product Purpose

OpenBible supports elaborating Bible studies and sermons: read the Bible, organize a structured study/sermon library, elaborate sermons in a dedicated builder, and keep simple notes alongside reading.

Success means the person can continue reading, highlight and annotate verses, build sermons/studies, and retrieve notes/highlights locally without creating an account.

## Positioning

Local-first private vaults with no mandatory account or relay: multiple workspaces scoped by `workspaceId` with exactly one active workspace per window, SQLite `app.sqlite` via Tauri on desktop and versioned IndexedDB in the PWA, opt-in per-workspace per-device sync only.

A cloud-first reader or a sermon editor that requires an account central store cannot truthfully copy solo offline vault operation with user-brought SQLite Bibles and derived-only Markdown/PDF export.

## Operating Context

Solo workflows across routes `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study`, `/config`: home with Continue reading / quick actions / recents; Bible reader with continuous verse-range selection, persisted highlights, workspace-wide highlights sheet and `/highlights`, verse note icon, copy, and side note creation with `:::verse` fence; notes in Milkdown editor; structured sermon builder; simple notes.

Environments: SvelteKit PWA standalone installable with cached local routes for offline use, hosted on Cloudflare; Tauri 2 macOS universal packaging of the same web UI in `apps/desktop` with Rust backend and `rusqlite`. Theme light/dark persisted locally; Sidebar on desktop, bottom bar on mobile.

Tools and materials: user-brought SQLite Bible databases compatible with the OpenLP pattern via drag-and-drop, distribution URL such as Cloudflare R2 URL, legacy folder/manifest source (`.openbible/config.json`, `.openbible/preferences.json`, auxiliary `index.sqlite` with `note_verse_ref` and `reader_highlight`) kept for migration/recovery via File System Access API or OPFS, local device vault catalog for re-encounter. Markdown with YAML frontmatter and PDF are derived export artifacts, not the primary record.

AI assistance is optional and controlled: desktop profile uses OS secure vault via Tauri; PWA boundary depends on trusted gateway and in-memory session token. Agent reads only selected context of the active workspace and returns a reviewable proposal, without autonomous tools or automatic authorial writing.

## Capabilities and Constraints

Confirmed: Bible reading with chapter open, continuous verse selection, highlights in operational backend, `/highlights` projection, copy reference/text, verse-linked notes without leaving the route; study/sermon library; sermon builder; simple notes with Milkdown and portable rich blocks; multiple vault workspaces with active-window barrier (autosave and generation token on switch); local import of compatible SQLite; distribution-URL SQLite access; Markdown and PDF export as derivatives; installable PWA shell with versioned service worker, safe area, and `apps/web/src/app.css` light/dark tokens; offline-tolerant operation.

Constraints: MVP has no authentication, no collaboration between people, no centralized account; device-local vault catalog is not syncable while `.openbible/config.json` travels with the root; sync between devices is opt-in and may use a user-configured secure WebSocket endpoint without requiring a mandatory relay; local backends remain valid without relay.

Terminology: workspace/vault, `workspaceId`, active workspace, operational backend (`app.sqlite` / IndexedDB), legacy folder/manifest source, derived export.

Undecided: audience beyond solo preacher/student; sharing or publishing model post-MVP; pricing/licensing; canonical Bible versions to bundle.

## Brand Commitments

Name: OpenBible. Quality reference `https://vercel.com/design.md` applied as composition guidance only, without Vercel wordmark, logo, or identity. Local Geist Sans for text and Geist Mono for code/paths/identifiers in `apps/web/static/fonts/`. Voice: undecided.

## Evidence on Hand

Code: `apps/web/src/routes/` (`+page.svelte`, `bible/`, `notes/`, `highlights/`, `sermons/`, `study/`, `config/`), `apps/web/src/lib/features/` (bible, workspace, navigation, ai, sync, config), `apps/web/src/app.css`, `apps/desktop` Tauri packaging. Docs: `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/DATABASE.md`.

Absences future work must not fabricate: no testimonials, customers, case studies, press, benchmarks, pricing, or licensing claims on hand.

## Product Principles

1. Local-first and private by default: the workspace on the device is the authority; network and relay are opt-in.
2. Reading leads to producing: every study, sermon, highlight, and note stays attached to the passage it came from.
3. Solo focus over collaboration: one active workspace per window, no account friction in the MVP.
4. Portable without lock-in: legacy folder source for recovery and Markdown/PDF as derivatives, never as the database.
5. Controlled assistance: AI proposes from explicitly selected context; the person reviews and applies.
