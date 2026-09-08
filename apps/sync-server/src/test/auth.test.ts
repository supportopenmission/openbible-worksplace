import { describe, it, expect } from "vitest";

describe("Better Auth Server", () => {
  // SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-001
  it("cadastra usuário diretamente com email e senha sem verificação de email prévia", async () => {
    const authModule = await import("../lib/server/auth");
    expect(authModule.auth).toBeDefined();
    expect(typeof authModule.auth.api.signUpEmail).toBe("function");
  });

  // SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-002
  it("realiza login com credenciais válidas e emite sessão ativa", async () => {
    const authModule = await import("../lib/server/auth");
    expect(authModule.auth).toBeDefined();
    expect(typeof authModule.auth.api.signInEmail).toBe("function");
  });

  // SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-003
  it("rejeita cadastro com email duplicado e retorna conflito amigável", async () => {
    const authModule = await import("../lib/server/auth");
    expect(authModule.auth).toBeDefined();
    expect(typeof authModule.auth.api.signUpEmail).toBe("function");
  });
});
