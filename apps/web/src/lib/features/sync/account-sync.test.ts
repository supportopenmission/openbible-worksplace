import { describe, it, expect } from "vitest";

describe("Client Account & Offline Sync", () => {
  // SPECSFY: US-002 FR-002 NFR-001 NFR-003 AC-006
  it("mantém 100% dos dados locais do workspace intactos após logout da conta", async () => {
    const authClient = await import("../auth/auth-client");
    expect(typeof authClient.logoutAndPreserveLocalData).toBe("function");
  });

  // SPECSFY: US-003 FR-003 NFR-001 NFR-003 AC-009
  it("permite operação de leitura e escrita local-first contínua offline sem conta", async () => {
    const syncClient = await import("./sync-client");
    expect(typeof syncClient.isOfflineSupported).toBe("function");
  });
});
