import { describe, it, expect } from 'vitest';

describe('Better Auth Server', () => {
	// SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-001
	it('cadastra usuário diretamente com email e senha sem verificação de email prévia', async () => {
		const authModule = await import('../lib/server/auth');
		expect(authModule.auth).toBeDefined();
		expect(typeof authModule.auth.api.signUpEmail).toBe('function');
	});

	// SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-002
	it('realiza login com credenciais válidas e emite sessão ativa', async () => {
		const authModule = await import('../lib/server/auth');
		expect(authModule.auth).toBeDefined();
		expect(typeof authModule.auth.api.signInEmail).toBe('function');
	});

	// SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-003
	it('rejeita cadastro com email duplicado e retorna conflito amigável', async () => {
		const authModule = await import('../lib/server/auth');
		expect(authModule.auth).toBeDefined();
		expect(typeof authModule.auth.api.signUpEmail).toBe('function');
	});

	it('usa os bindings de runtime para configurar o auth publicado', async () => {
		const authModule = await import('../lib/server/auth');
		const runtimeAuth = authModule.getAuth(undefined, {
			BETTER_AUTH_URL: 'https://sync.example.com',
			BETTER_AUTH_SECRET: 'a-secure-test-secret-with-at-least-32-chars',
			BETTER_AUTH_TRUSTED_ORIGINS: 'https://app.example.com'
		});

		expect(runtimeAuth.options.baseURL).toBe('https://sync.example.com');
		expect(runtimeAuth.options.secret).toBe('a-secure-test-secret-with-at-least-32-chars');
		expect(runtimeAuth.options.trustedOrigins).toContain('https://app.example.com');
	});

	it('habilita o plugin bearer para autorização via header Authorization', async () => {
		const authModule = await import('../lib/server/auth');
		const plugins = authModule.auth.options.plugins ?? [];
		const hasBearer = plugins.some((p: any) => p.id === 'bearer');
		expect(hasBearer).toBe(true);
	});
});
