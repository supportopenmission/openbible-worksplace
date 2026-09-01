import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const staticDirectory = resolve(process.cwd(), 'static');
const serviceWorkerPath = resolve(process.cwd(), 'src/service-worker.ts');

describe('PWA app shell', () => {
	// SPECSFY: US-002 FR-004 FR-007 NFR-002 AC-004 AC-007 AC-012
	it('publishes a standalone manifest with installable icons', () => {
		expect(existsSync(resolve(staticDirectory, 'manifest.webmanifest'))).toBe(true);
		const manifest = JSON.parse(
			readFileSync(resolve(staticDirectory, 'manifest.webmanifest'), 'utf8')
		) as { display: string; start_url: string; icons: unknown[] };

		expect(manifest.display).toBe('standalone');
		expect(manifest.start_url).toBe('/');
		expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
		expect(existsSync(resolve(staticDirectory, 'logo.png'))).toBe(true);
	});

	// SPECSFY: US-002 FR-004 FR-007 NFR-002 AC-004 AC-008 AC-012
	it('defines versioned cache and navigation fallback behavior', () => {
		expect(existsSync(serviceWorkerPath)).toBe(true);
		const source = readFileSync(serviceWorkerPath, 'utf8');

		expect(source).toContain('caches.open');
		expect(source).toContain("event.request.mode === 'navigate'");
		expect(source).toContain('CACHE_NAME');
	});

	// SPECSFY: US-002 FR-004 FR-007 NFR-002 AC-004 AC-008 AC-012
	it('keeps all local product routes in the offline contract', () => {
		const source = readFileSync(serviceWorkerPath, 'utf8');

		for (const route of ['/', '/bible', '/sermons', '/study', '/config']) {
			expect(source).toContain(`'${route}'`);
		}
	});
});
