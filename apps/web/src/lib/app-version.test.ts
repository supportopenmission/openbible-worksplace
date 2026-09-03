import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const VERSION_MODULE = fileURLToPath(new URL('./app-version.ts', import.meta.url));
const PACKAGE_JSON = fileURLToPath(new URL('../../package.json', import.meta.url));

describe('versão do app', () => {
	// SPECSFY: US-001 FR-005 FR-006 NFR-001 AC-009
	it('expõe 0.4.0 em fonte única espelhando o package.json', async () => {
		const module = await readFile(VERSION_MODULE, 'utf8');
		const pkg = JSON.parse(await readFile(PACKAGE_JSON, 'utf8')) as { version?: string };
		expect(module).toContain(`APP_VERSION = '0.4.0'`);
		expect(pkg.version).toBe('0.4.0');
	});
});
