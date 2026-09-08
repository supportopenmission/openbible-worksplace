# Aplicação e implementações

<!-- specsfy:documentator:start -->
## Superfícies

Categorias: Serviços, Rotas e APIs, Páginas, Componentes, Testes e Outras fontes.

Relação: relaciona cada arquivo observado à sua superfície.

| Categoria | Arquivo | Símbolos |
| --- | --- | --- |
| Outras fontes | apps/desktop/src-tauri/build.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/ai.rs | KEYRING_SERVICE, SECRET_REF_PREFIX |
| Outras fontes | apps/desktop/src-tauri/src/commands/ai_test.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/lock.rs | LockError |
| Outras fontes | apps/desktop/src-tauri/src/commands/lock_test.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/migration.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/mod.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/sync.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/commands/workspace.rs | FORMAT_VERSION, MigrationState, MANAGED_TOP_LEVEL |
| Outras fontes | apps/desktop/src-tauri/src/database.rs | MIGRATION_001, MIGRATION_002, MIGRATION_003, APP_DATABASE_FILE, CURRENT_SCHEMA_VERSION, DatabaseError |
| Outras fontes | apps/desktop/src-tauri/src/lib.rs | — |
| Outras fontes | apps/desktop/src-tauri/src/main.rs | — |
| Outras fontes | apps/sync-api/.wrangler/tmp/bundle-5mc82G/middleware-insertion-facade.js | MIDDLEWARE_TEST_INJECT |
| Outras fontes | apps/sync-api/.wrangler/tmp/bundle-5mc82G/middleware-loader.entry.ts | __Facade_ScheduledController__, wrapExportedHandler, wrapWorkerEntrypoint, extends, does |
| Outras fontes | apps/sync-api/.wrangler/tmp/dev-J3PAGd/index.js | clone, assertId, assertSafePayload, assertOperation, extends, payloadBytes, applyPush, pullChanges |
| Outras fontes | apps/sync-api/src/index.ts | Env, ApiConfig, DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, json, errorResponse, idFromPath, parsePositiveInteger |
| Testes | apps/sync-api/src/sync-api.test.ts | operation, push |
| Outras fontes | apps/sync-api/src/sync-core.ts | SyncOperation, SyncDocument, SyncChange, SyncConflict, SyncStore, PushRequest, PushResult, PushLimits |
| Outras fontes | apps/sync-server/.svelte-kit/ambient.d.ts | BETTER_AUTH_SECRET, BETTER_AUTH_TRUSTED_ORIGINS, BETTER_AUTH_URL, PORT, ANTIGRAVITY_AGENT, ANTIGRAVITY_AGENTAPI_EXE, ANTIGRAVITY_CONVERSATION_ID, ANTIGRAVITY_CSRF_TOKEN |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/chunks/BncCcBhj.js | extends, d, f, p, m, h, g, _ |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/chunks/Bvp1tNrK.js | p, m, extends, ve, ye, be, xe, Se |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/chunks/xihTtKlq.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/entry/app.BXuAndXO.js | o, s, i, M |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/entry/start.v6oCOiR2.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/nodes/0.9D4d7gkH.js | i |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_app/immutable/nodes/1.-pCPdQZX.js | h |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare/_worker.js | e, t, r, o |
| Outras fontes | apps/sync-server/.svelte-kit/cloudflare-tmp/manifest.js | __memo |
| Outras fontes | apps/sync-server/.svelte-kit/env.d.ts | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/app.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/matchers.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/nodes/0.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/nodes/1.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client-optimized/app.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client-optimized/matchers.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client-optimized/nodes/0.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client-optimized/nodes/1.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/root.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/server/internal.js | get_hooks |
| Outras fontes | apps/sync-server/.svelte-kit/generated/shared/error-template.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/non-ambient.d.ts | HTMLAttributes, AppTypes |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/chunks/BncCcBhj.js | extends, d, f, p, m, h, g, _ |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/chunks/Bvp1tNrK.js | p, m, extends, ve, ye, be, xe, Se |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/chunks/xihTtKlq.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/entry/app.BXuAndXO.js | o, s, i, M |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/entry/start.v6oCOiR2.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/nodes/0.9D4d7gkH.js | i |
| Outras fontes | apps/sync-server/.svelte-kit/output/client/_app/immutable/nodes/1.-pCPdQZX.js | h |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/auth.js | escapeRegExpChar, escapeRegExpString, transform, isMatch, takes, wildcardMatch, isLoopbackForDevScheme, trimTrailingSlashes |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/env.js | set_env |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/exports.js | resolve, normalize_path, decode_pathname, decode_params, make_trackable, disable_hash, disable_search, allow_nodejs_console_log |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/internal.js | override, reset, set_assets, set_building, set_prerendering |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/internal2.js | set_private_env, set_public_env, set_read_implementation, set_manifest, handle_event_propagation, assign_nodes, mount, hydrate |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/kysely-adapter.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/rolldown-runtime.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/server.js | run, run_all, deferred, equals, safe_not_equal, safe_equals, StaleReactionError, experimental_async_required |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/shared.js | noop, once, get_relative_path, base64_encode, base64_decode, coalesce_to_error, that, normalize_error |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/sync-service.js | clone, assertId, assertSafePayload, assertOperation, extends, payloadBytes, applyPush, pullChangesFromStore |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/chunks/utils.js | set_nested_value, convert_formdata, deserialize_binary_form, get_chunk, get_buffer, deserialize_error, LazyFile, split_path |
| Rotas e APIs | apps/sync-server/.svelte-kit/output/server/entries/endpoints/api/auth/_...all_/_server.ts.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/endpoints/health/_server.ts.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/endpoints/v1/workspaces/_server.ts.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/endpoints/v1/workspaces/_workspaceId_/sync/pull/_server.ts.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/endpoints/v1/workspaces/_workspaceId_/sync/push/_server.ts.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/fallbacks/error.svelte.js | notifiable_store, notify, set, subscribe, create_updated_store, Page, Navigating, Updated |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/fallbacks/layout.svelte.js | Layout |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/entries/hooks.server.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/env.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/index.js | with_resolvers, render_endpoint, is_endpoint_request, compact, has_data_suffix, add_data_suffix, strip_data_suffix, has_resolution_suffix |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/internal.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/manifest-full.js | __memo |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/manifest.js | __memo |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/nodes/0.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/nodes/1.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/output/server/remote-entry.js | create_validator, call, get_response, parse_remote_response, derive_remote_function_event, run_remote_function, to_iterator, get_cache |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/api/auth/[...all]/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/health/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/[workspaceId]/sync/pull/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/[workspaceId]/sync/push/$types.d.ts | — |
| Outras fontes | apps/sync-server/drizzle.config.ts | — |
| Outras fontes | apps/sync-server/src/app.d.ts | Platform |
| Outras fontes | apps/sync-server/src/hooks.server.ts | ALLOWED_ORIGINS |
| Outras fontes | apps/sync-server/src/lib/server/auth.ts | AuthRuntimeEnv, DEFAULT_AUTH_SECRET, DEFAULT_TRUSTED_ORIGINS, createAuth, getAuth |
| Outras fontes | apps/sync-server/src/lib/server/db/index.ts | createDb |
| Outras fontes | apps/sync-server/src/lib/server/db/schema.ts | — |
| Outras fontes | apps/sync-server/src/lib/server/sync/sync-service.ts | SyncOperation, SyncDocument, SyncChange, SyncConflict, SyncStore, PushRequest, PushResult, PushLimits |
| Rotas e APIs | apps/sync-server/src/routes/api/auth/[...all]/+server.ts | GET, POST |
| Rotas e APIs | apps/sync-server/src/routes/health/+server.ts | GET |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/+server.ts | GET, POST |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/pull/+server.ts | GET |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/push/+server.ts | POST |
| Testes | apps/sync-server/src/test/auth.test.ts | — |
| Testes | apps/sync-server/src/test/sync-auth.test.ts | — |
| Testes | apps/sync-server/src/test/workspaces.test.ts | — |
| Outras fontes | apps/sync-server/svelte.config.js | — |
| Outras fontes | apps/sync-server/vite.config.ts | — |
| Outras fontes | apps/web/.svelte-kit/ambient.d.ts | ANTIGRAVITY_AGENT, ANTIGRAVITY_AGENTAPI_EXE, ANTIGRAVITY_CONVERSATION_ID, ANTIGRAVITY_CSRF_TOKEN, ANTIGRAVITY_LS_ADDRESS, ANTIGRAVITY_LS_VERSION, ANTIGRAVITY_PROJECT_ID, ANTIGRAVITY_SOURCE_METADATA |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/0.BkfsOC6k.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/2.SrOwNqhZ.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/3.uKK-3Ivt.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/4.DVZkycCw.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/5.e4FGILj6.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/6.DEycNB_8.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/7.D6DmNWEi.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/8.pkZRyyZQ.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/HighlightsList.Cm1TLr5U.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/LocalBibleImport.XD-HZ-08.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/PageHeader.D4E2QHx-.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/ProductPage.Bt54Nk6E.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/RemoteBibleImport.CJit26Yt.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/drawer.gmmBdIMB.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/note-editor-layout.DYFWr0Jd.css | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-asm-debug.DaWLdCIQ.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-asm-memory-growth.DGFve7n6.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-asm.0eXDphpc.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-wasm-browser-debug.xSsKJ-2z.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-wasm-browser.DZJJQdPp.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-wasm-debug.fzvR0zSa.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/sql-wasm.DqUGnjTZ.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/worker.sql-asm-debug.hXhYBql8.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/worker.sql-asm.CyhR_y_X.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/worker.sql-wasm-debug.DLKQiAMV.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/assets/worker.sql-wasm.DYUeLTVh.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/0CJ4yD1l.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/0Jvr4NVV.js | ye, n, be, xe, Se, C, Oe, ke |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/1lyH5Iw-.js | w |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/4fR3T-Z1.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/7tT_52gM.js | i, o, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/8ckK5UfH.js | W, ve, be, Se, we, De, Ae, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B7Ithy0X.js | extends, c, l, u, d, f, p, m |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B8idCQGS.js | e, h, g, _, b, ee, S, C |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BEDFYXnJ.js | e, W, q, X, te, ie, oe, ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BPDfT2XZ.js | s, l, d, p, h, y, b, x |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B_JLH0Mb.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BewYr9py.js | et, Dt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BglqsUsg.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bgq8hU8J.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bix8VrAZ.js | extends, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BmcvsyQv.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BnaxxHPM.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C486LVeK.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C6wJIzgq.js | Ee, Oe, Y, X, ke, e, Re, Ve |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C8C1f-Sa.js | a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C9DPc-38.js | f, m, h, g, _, extends, Se, Ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CAlyZ4Qh.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CCZZu5Dl.js | u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CDb7wEni.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CLePmhg0.js | M, z, B, V |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CMLtuY_W.js | ie, O, ae, oe, se, ce, ue, de |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CNHQ7MNH.js | me, he, _e, N, ye, be, xe, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/COwzUWPo.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CSsmeNfz.js | r, i, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CWdyH0t4.js | w, D, k, M |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CaIZsOD7.js | g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CigXvUN4.js | r, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Cj_ro75g.js | g, v, S, C, T, D, k, A |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Ckyq-_8e.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CuMYSrN_.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CuZotUcb.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CyGsA0u7.js | e |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CyVX1qTt.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D0syVJvb.js | extends, r, i, a, o, s, c, l |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D4lfN1yd.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D7dTHSVv.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D9vyxjUv.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DFfMaMZh.js | e, t, n, r, i, s, c, extends |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DGPdRnoZ.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DLPcx80W.js | e, t, n, r, i, must, in, T |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DV58mmy6.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Da-KCmU7.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Da4UkUKJ.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DeqYMwdY.js | d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DfPUrosE.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dim-9zFk.js | M, P, R, B, U, G, q |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DjIA-v1W.js | a, o, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DnQlI2D-.js | t, n, r |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dr2POLD8.js | extends, d, f, p, m, h, ee, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DrMcd7ie.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DtHHiH3t.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DwR70nCA.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dz_jqCrz.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/HclGiUj8.js | c, l, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/LcNYIUZS.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/WuJ5lk-5.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/X0hlWc81.js | extends, M, N, P, F, oe, s, I |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/bE3pmSku.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/bgFeacLR.js | t, n, r, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/esxY9yZY.js | extends, i, a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/hePW80VL.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/lztkuLUK.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/pIVdaqU6.js | De, Oe, ke, Ae, je, Me, N, Ne |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/q6NuP3rm.js | extends, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/r0P3ovJx.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/uqboL8wq.js | ce, le, ue, fe, me, he, U, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/xihTtKlq.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/app.DQkMh5Um.js | k |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/start.DiOimInv.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/0.Czv0mikz.js | St, Ct, wt, Tt, Et, Dt, Ot, kt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/1.CHliJiO6.js | f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/10.CNPX9j0M.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/2.CPTUBFM5.js | je, N, P, F, Ie, Re, Be, He |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/3.BFM-eBlr.js | Te, De, ke, je, Xe, fe, pe, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/4.KLk7gloU.js | Rt, q, Vt, Ht, Y, Gt, Jt, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/5.CJr8D38W.js | xt, Ct, Tt, Dt, kt, jt, Nt, Ft |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/6.M7sLzv-d.js | M, U, X, se, ce, le |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/7.BXW9bRmm.js | E, k, y |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/8.D_qWnAhx.js | Ue, We, Ke, Ze, y, J, tt, nt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/9.DFwYsTNU.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_worker.js | e, t, r, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/service-worker.js | c, l |
| Outras fontes | apps/web/.svelte-kit/cloudflare-tmp/manifest.js | __memo |
| Outras fontes | apps/web/.svelte-kit/env.d.ts | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/app.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/matchers.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/0.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/1.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/10.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/2.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/3.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/4.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/5.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/6.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/7.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/8.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client/nodes/9.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/app.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/matchers.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/0.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/1.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/10.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/2.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/3.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/4.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/5.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/6.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/7.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/8.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/client-optimized/nodes/9.js | — |
| Outras fontes | apps/web/.svelte-kit/generated/root.js | — |
<!-- specsfy:documentator:end -->

## Fontes de aplicação relevantes

O inventário gerado inclui artefatos `.svelte-kit`. As fontes de aplicação que
devem ser priorizadas são:

| Superfície               | Arquivo                                                  | Situação                                                                  |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Entrada web              | `apps/web/src/routes/+page.svelte`                       | Onboarding preservado, seletor inicial e redirecionamento por preferência |
| Shell web                | `apps/web/src/routes/+layout.svelte`                     | Sidebar condicional e `main` compartilhado                                |
| Navegação                | `apps/web/src/lib/features/navigation/AppSidebar.svelte` | Menu responsivo com rota ativa                                            |
| Preferência              | `apps/web/src/lib/navigation/home-preference.ts`         | Leitura, gravação, remoção e validação local                              |
| Configuração             | `apps/web/src/routes/config/+page.svelte`                | Seleção e remoção da tela inicial                                         |
| Bíblia                   | `apps/web/src/routes/bible/+page.svelte`                 | Superfície mínima do leitor futuro                                        |
| Sermões                  | `apps/web/src/routes/sermons/+page.svelte`               | Superfície mínima do construtor futuro                                    |
| Estudos                  | `apps/web/src/routes/study/+page.svelte`                 | Estado explícito em breve                                                 |

As superfícies de navegação estão normatizadas em `specs/completed/0002-tela-inicial-navegacao/spec.md`;
os módulos funcionais continuam aguardando specs próprias.
