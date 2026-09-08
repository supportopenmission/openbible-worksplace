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
| Outras fontes | apps/sync-api/src/index.ts | Env, ApiConfig, DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, json, errorResponse, idFromPath, parsePositiveInteger |
| Testes | apps/sync-api/src/sync-api.test.ts | operation, push |
| Outras fontes | apps/sync-api/src/sync-core.ts | SyncOperation, SyncDocument, SyncChange, SyncConflict, SyncStore, PushRequest, PushResult, PushLimits |
| Outras fontes | apps/web/.svelte-kit/ambient.d.ts | SHELL, COLORTERM, TURBO_INVOCATION_DIR, NODE, TAURI_ENV_DEBUG, XDG_DATA_HOME, PWD, TAURI_ENV_PLATFORM |
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
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/4bwnzgwC.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/5BDqUZ4T.js | d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/5WYPB6SN.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BD2tS9Fp.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BOzOOUau.js | W, ve, be, Se, we, De, Ae, X |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BRsCU_pC.js | extends, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B_JLH0Mb.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B_dA5_ds.js | c, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Be0A4X0R.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BeMMO3o8.js | s, l, d, p, h, y, b, x |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BedszLo0.js | extends, d, f, p, m, h, ee, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bhey43ET.js | i, a, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BmTYUJZZ.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BmcvsyQv.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bu_etjNL.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C63Dqurm.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C6wLKj3b.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C9DPc-38.js | f, m, h, g, _, extends, Se, Ce |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CC5hAGtu.js | u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CImBs19x.js | w |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CIvxnKlx.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CLckWhLz.js | extends, c, l, u, d, f, p, m |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CMLtuY_W.js | ie, O, ae, oe, se, ce, ue, de |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CNvo6F6p.js | a, o, s, c, l, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/COwzUWPo.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C_cKE8go.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CigXvUN4.js | r, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Cj_ro75g.js | g, v, S, C, T, D, k, A |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/ClCegJUF.js | g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CuZotUcb.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CxeQyvdt.js | De, Oe, ke, Ae, je, Me, P, Ne |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CxysKB8l.js | e, W, q, X, te, ie, oe, ce |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CyGsA0u7.js | e |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D072JwEj.js | t, n, r, a, o, s |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D0syVJvb.js | extends, r, i, a, o, s, c, l |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D3pz1BnP.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D6RWr99C.js | extends, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DA4vzoOt.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DDzt0UI6.js | w, D, k, M |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DEy91-sa.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DFfMaMZh.js | e, t, n, r, i, s, c, extends |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DGPdRnoZ.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DLPcx80W.js | e, t, n, r, i, must, in, T |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DWbQibdX.js | i, o, c, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DZ_b_7Ms.js | et, Dt |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DnQlI2D-.js | t, n, r |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Dp_aQWX6.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Ds-UZb3J.js | ce, le, ue, fe, me, he, U, ge |
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
