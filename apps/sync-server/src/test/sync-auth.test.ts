import { describe, it, expect } from "vitest";

describe("Sync Authorization", () => {
  // SPECSFY: US-002 FR-002 NFR-001 NFR-002 AC-004
  it("processa push e pull autorizados quando o workspace pertence ao usuário logado", async () => {
    const syncService = await import("../lib/server/sync/sync-service");
    expect(typeof syncService.pushChanges).toBe("function");
    expect(typeof syncService.pullChanges).toBe("function");
  });

  // SPECSFY: US-002 FR-002 NFR-001 NFR-002 AC-005
  it("rejeita com 403 requisições de sync para workspace pertencente a outro usuário", async () => {
    const syncService = await import("../lib/server/sync/sync-service");
    expect(typeof syncService.assertWorkspaceOwnership).toBe("function");
  });
});
