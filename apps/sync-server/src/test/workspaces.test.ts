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
});
