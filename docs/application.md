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
| Outras fontes | apps/sync-api/.wrangler/tmp/bundle-7KTSuY/middleware-insertion-facade.js | MIDDLEWARE_TEST_INJECT |
| Outras fontes | apps/sync-api/.wrangler/tmp/bundle-7KTSuY/middleware-loader.entry.ts | __Facade_ScheduledController__, wrapExportedHandler, wrapWorkerEntrypoint, extends, does |
| Outras fontes | apps/sync-api/.wrangler/tmp/dev-YlsZdy/index.js | clone, assertId, assertSafePayload, assertOperation, extends, payloadBytes, applyPush, pullChanges |
| Outras fontes | apps/sync-api/src/index.ts | Env, ApiConfig, DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, json, errorResponse, idFromPath, parsePositiveInteger |
| Testes | apps/sync-api/src/sync-api.test.ts | operation, push |
| Outras fontes | apps/sync-api/src/sync-core.ts | SyncOperation, SyncDocument, SyncChange, SyncConflict, SyncStore, PushRequest, PushResult, PushLimits |
| Outras fontes | apps/sync-server/.svelte-kit/ambient.d.ts | ANTIGRAVITY_AGENT, NVM_INC, ORCA_WORKTREE_ID, ORCA_CODEX_LAUNCH_PREFLIGHT, TERM_PROGRAM, NODE, ANTIGRAVITY_CONVERSATION_ID, DIRECTUS_MCP_TOKEN |
| Outras fontes | apps/sync-server/.svelte-kit/env.d.ts | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/app.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/matchers.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/nodes/0.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/client/nodes/1.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/root.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/generated/server/internal.js | get_hooks |
| Outras fontes | apps/sync-server/.svelte-kit/generated/shared/error-template.js | — |
| Outras fontes | apps/sync-server/.svelte-kit/non-ambient.d.ts | HTMLAttributes, AppTypes |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/api/auth/[...all]/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/[workspaceId]/sync/pull/$types.d.ts | — |
| Rotas e APIs | apps/sync-server/.svelte-kit/types/src/routes/v1/workspaces/[workspaceId]/sync/push/$types.d.ts | — |
| Outras fontes | apps/sync-server/drizzle.config.ts | — |
| Outras fontes | apps/sync-server/src/app.d.ts | Platform |
| Outras fontes | apps/sync-server/src/lib/server/auth.ts | createAuth, getAuth |
| Outras fontes | apps/sync-server/src/lib/server/db/index.ts | createDb |
| Outras fontes | apps/sync-server/src/lib/server/db/schema.ts | — |
| Outras fontes | apps/sync-server/src/lib/server/sync/sync-service.ts | SyncOperation, SyncDocument, SyncChange, SyncConflict, SyncStore, PushRequest, PushResult, PushLimits |
| Rotas e APIs | apps/sync-server/src/routes/api/auth/[...all]/+server.ts | GET, POST |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/+server.ts | GET, POST |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/pull/+server.ts | GET |
| Rotas e APIs | apps/sync-server/src/routes/v1/workspaces/[workspaceId]/sync/push/+server.ts | POST |
| Testes | apps/sync-server/src/test/auth.test.ts | — |
| Testes | apps/sync-server/src/test/sync-auth.test.ts | — |
| Testes | apps/sync-server/src/test/workspaces.test.ts | — |
| Outras fontes | apps/sync-server/svelte.config.js | — |
| Outras fontes | apps/sync-server/vite.config.ts | — |
| Outras fontes | apps/web/.svelte-kit/ambient.d.ts | ANTIGRAVITY_AGENT, NVM_INC, ORCA_WORKTREE_ID, ORCA_CODEX_LAUNCH_PREFLIGHT, TERM_PROGRAM, NODE, ANTIGRAVITY_CONVERSATION_ID, DIRECTUS_MCP_TOKEN |
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
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/0Jvr4NVV.js | ye, n, be, xe, Se, C, Oe, ke |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/2MARcGz-.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/4bwnzgwC.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B5ltObz1.js | me, he, _e, N, ye, be, xe, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BNWexFqY.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BRsCU_pC.js | extends, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B_JLH0Mb.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B_dA5_ds.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B_hKsdgB.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Be0A4X0R.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bh-v66v6.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bhey43ET.js | i, a, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BmTYUJZZ.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BmcvsyQv.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BnSrDeb5.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BzSU-r7i.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C52GHSdy.js | e, W, q, X, te, ie, oe, ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C8HfI6Zm.js | u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C9DPc-38.js | f, m, h, g, _, extends, Se, Ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CIvxnKlx.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CJzP3dDQ.js | i, o, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CLckWhLz.js | extends, c, l, u, d, f, p, m |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CMLtuY_W.js | ie, O, ae, oe, se, ce, ue, de |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CNvo6F6p.js | a, o, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CVk96z-h.js | ce, le, ue, fe, me, he, U, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CXlDW9Re.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Cd2UANNA.js | w |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CdKdnyTA.js | M, z, B, V |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/ChynvSpi.js | M, P, R, B, U, G, q |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Cj-Pc9Ms.js | W, ve, be, Se, we, De, Ae, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Cj_ro75g.js | g, v, S, C, T, D, k, A |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CuZotUcb.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CwZaoTmQ.js | extends, d, f, p, m, h, ee, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CwdmxT-3.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CyGsA0u7.js | e |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D072JwEj.js | t, n, r, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D0syVJvb.js | extends, r, i, a, o, s, c, l |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D6RWr99C.js | extends, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DCQ6o9XP.js | i, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DEN9ASqA.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DEV-y4uL.js | d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DFfMaMZh.js | e, t, n, r, i, s, c, extends |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DFfliUlY.js | et, Dt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DG9g6itM.js | a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DGPdRnoZ.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DIOmzywT.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DKbTNJbO.js | De, Oe, ke, Ae, je, Me, P, Ne |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DLPcx80W.js | e, t, n, r, i, must, in, T |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DPu83Ksa.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DVylDcwB.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DeMjjY7m.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DnQlI2D-.js | t, n, r |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dt3Qxmcw.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DvWhCboD.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DzeHaDuw.js | e, h, g, _, b, ee, S, C |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/HclGiUj8.js | c, l, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/LcNYIUZS.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/THmACKkj.js | w, D, k, M |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Yb_HoAW5.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/aW8qtvSb.js | extends, M, N, P, F, oe, s, I |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/aXR-j05X.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/bE3pmSku.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/esxY9yZY.js | extends, i, a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/fvUdvzqv.js | s, l, d, p, h, y, b, x |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/h0sW-9Ux.js | g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/hePW80VL.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/iS-j5GuF.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/lztkuLUK.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/tzxsNewA.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/w35z7Z2G.js | Ee, Oe, Y, X, ke, e, Re, Ve |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/xPFv0IR2.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/xihTtKlq.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/app.Dgk2WeVT.js | k |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/start.BpRAD7UH.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/0.GC9m_J03.js | St, Ct, wt, Tt, Et, Dt, Ot, kt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/1.CpTmeGJM.js | f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/10.Jnfn_3ip.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/2.njX2Dh_d.js | je, N, P, F, Ie, Re, Be, He |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/3.BV9OeyUW.js | Te, De, ke, je, Xe, fe, pe, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/4.CZE8uide.js | Rt, q, Vt, Ht, Y, Gt, Jt, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/5.kVR500QI.js | xt, Ct, Tt, Dt, kt, jt, Nt, Ft |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/6.CTGEFjSh.js | M, U, X, se, ce, le |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/7.pwEhyq8h.js | E, k, y |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/8.DeFy3Ncq.js | Ue, We, Ke, Ze, y, J, tt, nt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/9.D_AmwvUs.js | t |
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
| Outras fontes | apps/web/.svelte-kit/generated/server/internal.js | get_hooks |
| Outras fontes | apps/web/.svelte-kit/generated/shared/error-template.js | — |
| Outras fontes | apps/web/.svelte-kit/non-ambient.d.ts | HTMLAttributes, AppTypes |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/0.BkfsOC6k.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/2.SrOwNqhZ.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/3.uKK-3Ivt.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/4.DVZkycCw.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/5.e4FGILj6.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/6.DEycNB_8.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/7.D6DmNWEi.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/8.pkZRyyZQ.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/HighlightsList.Cm1TLr5U.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/LocalBibleImport.XD-HZ-08.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/PageHeader.D4E2QHx-.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/ProductPage.Bt54Nk6E.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/RemoteBibleImport.CJit26Yt.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/drawer.gmmBdIMB.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/note-editor-layout.DYFWr0Jd.css | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-asm-debug.DaWLdCIQ.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-asm-memory-growth.DGFve7n6.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-asm.0eXDphpc.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-wasm-browser-debug.xSsKJ-2z.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-wasm-browser.DZJJQdPp.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-wasm-debug.fzvR0zSa.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/sql-wasm.DqUGnjTZ.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/worker.sql-asm-debug.hXhYBql8.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/worker.sql-asm.CyhR_y_X.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/worker.sql-wasm-debug.DLKQiAMV.js | that, might, before, and, humanReadableVersionToPacked, to, parameter, initSqlJs |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/assets/worker.sql-wasm.DYUeLTVh.js | that, might, before, and, a, b, c, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/0Jvr4NVV.js | ye, n, be, xe, Se, C, Oe, ke |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/2MARcGz-.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/4bwnzgwC.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B5ltObz1.js | me, he, _e, N, ye, be, xe, Se |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BNWexFqY.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BRsCU_pC.js | extends, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B_JLH0Mb.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B_dA5_ds.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B_hKsdgB.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Be0A4X0R.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bh-v66v6.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bhey43ET.js | i, a, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BmTYUJZZ.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BmcvsyQv.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BnSrDeb5.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BzSU-r7i.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
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
