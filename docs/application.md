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
| Outras fontes | apps/web/.svelte-kit/ambient.d.ts | BACKGROUND, BAT_THEME, BORDER_BACKGROUND, BORDER_FOREGROUND, BROWSER, CHROME_DESKTOP, CODEX_CI, CODEX_SESSION_ID |
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
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/03ZJY3we.js | M, P, R, B, U, G, q |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/0Jvr4NVV.js | ye, n, be, xe, Se, C, Oe, ke |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/0PWCut4V.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/2KG8JPgk.js | r, i, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/4qdakjtE.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/B2O9Rze9.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BIqdbwtw.js | w |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BOuRkKKu.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BPkBVIVR.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BSt1EmIj.js | qe, Je, Ye, Xe, Ze, Qe, et, nt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BW5J6EBi.js | W, ve, be, Se, we, De, Ae, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BXXp6awJ.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bbgw-U6t.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BcuJWSjH.js | r, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bd4EW3Lr.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BeNmvhUv.js | ce, le, ue, fe, me, he, U, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/BhhyLJHE.js | d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bn7c0gAR.js | extends, d, f, p, m, h, ee, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C9DPc-38.js | f, m, h, g, _, extends, Se, Ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CFv-GHxA.js | et, Dt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CKPbxZ-7.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CMLtuY_W.js | ie, O, ae, oe, se, ce, ue, de |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/C_cLOcqz.js | s, l, d, p, h, y, b, x |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Ch-8dfaB.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Cj_ro75g.js | g, v, S, C, T, D, k, A |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CkKWbJJ4.js | Ee, Oe, Y, X, ke, e, Re, Ve |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CpN7sKUV.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Crf6lJOy.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CuZotUcb.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/CyGsA0u7.js | e |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D0syVJvb.js | extends, r, i, a, o, s, c, l |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D3ImVYPO.js | t, n, r, a, o, s |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/D8SKP_6U.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DFfMaMZh.js | e, t, n, r, i, s, c, extends |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DHgcGOlx.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DOUzj-Au.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DT9wxzNv.js | u, d |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DTF6ttSQ.js | e, W, q, X, te, ie, oe, ce |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DaLWK0T8.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dbio6eed.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DboUiB1H.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dbp1gmog.js | extends, c, l, u, d, f, p, m |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dk7ypfJ7.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DlpChjap.js | o, s, c, l, u, d, f, p |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DnQlI2D-.js | t, n, r |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/Dpau61fb.js | M, z, B, V |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DreH3hnM.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DvJxOmfR.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/DyTE9yD_.js | me, he, _e, N, ye, be, xe, Se |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/HclGiUj8.js | c, l, o |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/IWtKSkl5.js | a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/LcNYIUZS.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/MKhaQEje.js | g |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/RVY8BMzj.js | extends, l, u, d, f, p, m, h |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/SsOmWdIL.js | w, D, k, M |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/WHKpCJpA.js | e, t, n, r, i, must, in, T |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/bE3pmSku.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/dE5gCp7O.js | i, o, c, u |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/esxY9yZY.js | extends, i, a |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/hePW80VL.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/izUDKw02.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/lU5TZA8Q.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/lamuUyYs.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/o4iIdMBy.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/oAKhgEke.js | i |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/wUeEFWVN.js | extends, M, N, P, F, oe, s, I |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/xihTtKlq.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/chunks/yxkkdGwn.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/app.DcNIxlj-.js | k |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/entry/start.B-81qkXo.js | — |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/0.DUs1ig5T.js | pt, ht, _t, yt, xt, Ct, Tt, Dt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/1.DksgVyD1.js | f |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/10.DRpxAxfc.js | t |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/2.DFWU76b7.js | je, N, P, F, Ie, Re, Be, He |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/3.aNbvFm-U.js | Te, De, ke, je, Xe, fe, pe, ge |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/4.VRZI8MyZ.js | Rt, q, Vt, Ht, Y, Gt, Jt, X |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/5.BK9K-a9q.js | xt, Ct, Tt, Dt, kt, jt, Nt, Ft |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/6.yhfnANE0.js | M, U, X, se, ce, le |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/7.D_JyY93o.js | E, k, y |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/8.B69AlwR5.js | Ue, We, Ke, Ze, y, J, tt, nt |
| Outras fontes | apps/web/.svelte-kit/cloudflare/_app/immutable/nodes/9.CWUbehFs.js | t |
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
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/03ZJY3we.js | M, P, R, B, U, G, q |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/0Jvr4NVV.js | ye, n, be, xe, Se, C, Oe, ke |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/0PWCut4V.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/2KG8JPgk.js | r, i, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/4qdakjtE.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/B2O9Rze9.js | t, r, i, a, o, s |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BFqLT5rb.js | e, did, t, c, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BIqdbwtw.js | w |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BKnm7gP0.js | p |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BOuRkKKu.js | extends, e, Sn, Tn, En, An, Nn, In |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BPkBVIVR.js | extends, a, o, s, c, l, u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BSt1EmIj.js | qe, Je, Ye, Xe, Ze, Qe, et, nt |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BT4kM3za.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BW5J6EBi.js | W, ve, be, Se, we, De, Ae, X |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BXXp6awJ.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bbgw-U6t.js | Ce, Oe, V, H, U, ke, Ae, W |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BcuJWSjH.js | r, i, a, o, s, c, l, u |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bd4EW3Lr.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BeNmvhUv.js | ce, le, ue, fe, me, he, U, ge |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BenDQF7x.js | y, b, x, S, C, w, T, E |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/BhhyLJHE.js | d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bjy-W4x2.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bn7c0gAR.js | extends, d, f, p, m, h, ee, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Bw7Q2EIW.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C-LgA62f.js | Ce, we, Te, Ee, De, Oe, ke, Ae |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C9DPc-38.js | f, m, h, g, _, extends, Se, Ce |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CFv-GHxA.js | et, Dt |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CKPbxZ-7.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CMLtuY_W.js | ie, O, ae, oe, se, ce, ue, de |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/C_cLOcqz.js | s, l, d, p, h, y, b, x |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Ch-8dfaB.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Cj_ro75g.js | g, v, S, C, T, D, k, A |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CkKWbJJ4.js | Ee, Oe, Y, X, ke, e, Re, Ve |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CpN7sKUV.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Crf6lJOy.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CuZotUcb.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/CyGsA0u7.js | e |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D0syVJvb.js | extends, r, i, a, o, s, c, l |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D3ImVYPO.js | t, n, r, a, o, s |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/D8SKP_6U.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DFfMaMZh.js | e, t, n, r, i, s, c, extends |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DHgcGOlx.js | i |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DOUzj-Au.js | n, r, i, a, o, u, d, f |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DT9wxzNv.js | u, d |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DTF6ttSQ.js | e, W, q, X, te, ie, oe, ce |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DaLWK0T8.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Dbio6eed.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DboUiB1H.js | extends, n, r, i, a, o |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Dbp1gmog.js | extends, c, l, u, d, f, p, m |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Dk7ypfJ7.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DlpChjap.js | o, s, c, l, u, d, f, p |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DnQlI2D-.js | t, n, r |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/Dpau61fb.js | M, z, B, V |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DreH3hnM.js | l, u, d, f, p, m, h, g |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DvJxOmfR.js | _e, C, ye, w, be, xe, T, Se |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/DyTE9yD_.js | me, he, _e, N, ye, be, xe, Se |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/HclGiUj8.js | c, l, o |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/IWtKSkl5.js | a |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/LcNYIUZS.js | — |
| Outras fontes | apps/web/.svelte-kit/output/client/_app/immutable/chunks/MKhaQEje.js | g |
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
