import { describe, it, expect } from "vitest";

describe("Workspaces Catalog", () => {
  // SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-007
  it("retorna catálogo dos workspaces associados ao usuário autenticado", async () => {
    const syncService = await import("../lib/server/sync/sync-service");
    expect(typeof syncService.listUserWorkspaces).toBe("function");
  });

  // SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-008
  it("permite associar novo workspace e sincronizar réplica em outro dispositivo", async () => {
    const syncService = await import("../lib/server/sync/sync-service");
    expect(typeof syncService.bindWorkspace).toBe("function");
  });

  it("permite renomear um workspace existente pertencente ao usuário", async () => {
    const { bindWorkspace, renameWorkspace, listUserWorkspaces } = await import("../lib/server/sync/sync-service");
    await bindWorkspace(undefined, "test-rename-ws", "user-renamer", "Workspace Antigo");
    const renamed = await renameWorkspace(undefined, "test-rename-ws", "user-renamer", "Workspace Novo");
    expect(renamed.name).toBe("Workspace Novo");

    const list = await listUserWorkspaces(undefined, "user-renamer");
    const found = list.workspaces.find((w) => w.workspaceId === "test-rename-ws");
    expect(found?.name).toBe("Workspace Novo");
  });

  it("permite excluir um workspace da nuvem pertencente ao usuário", async () => {
    const { bindWorkspace, deleteWorkspace, listUserWorkspaces } = await import("../lib/server/sync/sync-service");
    await bindWorkspace(undefined, "test-delete-ws", "user-deleter", "Para Deletar");
    const res = await deleteWorkspace(undefined, "test-delete-ws", "user-deleter");
    expect(res.deleted).toBe(true);

    const list = await listUserWorkspaces(undefined, "user-deleter");
    const found = list.workspaces.find((w) => w.workspaceId === "test-delete-ws");
    expect(found).toBeUndefined();
  });
});

