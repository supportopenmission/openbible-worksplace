import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('macOS universal build configuration', () => {
	// SPECSFY: US-003 FR-005 NFR-002 AC-011
	it('targets both CPU families without requiring signing', () => {
		const path = 'apps/desktop/src-tauri/tauri.conf.json';
		expect(existsSync(path)).toBe(true);
		const config = JSON.parse(readFileSync(path, 'utf8'));
		const packageJson = JSON.parse(readFileSync('apps/desktop/package.json', 'utf8'));

		expect(packageJson.scripts.build).toContain('--target universal-apple-darwin');
		expect(packageJson.scripts.build).toContain('--no-sign');
		expect(packageJson.scripts['build:debug']).toContain('--target universal-apple-darwin');
		expect(packageJson.scripts['build:linux']).toContain('--bundles deb,appimage');
		expect(packageJson.scripts['build:linux']).toContain('--no-sign');
		expect(config.bundle.targets).toContain('app');
		expect(config.bundle.macOS?.signingIdentity ?? null).toBeNull();
		expect(config.bundle.macOS?.minimumSystemVersion).toBe('13.0');
	});
});
