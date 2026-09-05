import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP_HTML = fileURLToPath(new URL('../../app.html', import.meta.url));
const APP_CSS = fileURLToPath(new URL('../../app.css', import.meta.url));
const MANIFEST = fileURLToPath(new URL('../../../static/manifest.webmanifest', import.meta.url));
const APP_FRAME = fileURLToPath(new URL('../features/workspace/AppFrame.svelte', import.meta.url));
const APP_SIDEBAR = fileURLToPath(
	new URL('../features/navigation/AppSidebar.svelte', import.meta.url)
);
const FAVICON = fileURLToPath(new URL('../../../static/favicon.png', import.meta.url));
const APPLE_TOUCH = fileURLToPath(new URL('../../../static/apple-touch-icon.png', import.meta.url));

async function readPngSize(path: string): Promise<{ width: number; height: number }> {
	const bytes = await readFile(path);
	return {
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20)
	};
}

describe('pwa shell', () => {
	// SPECSFY: US-001 FR-001 FR-003 FR-005 NFR-001 AC-001
	it('abre instalado em standalone dentro do escopo do app', async () => {
		const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as {
			display?: string;
			start_url?: string;
			scope?: string;
		};
		expect(manifest.display).toBe('standalone');
		expect(manifest.start_url).toBe('/');
		expect(manifest.scope).toBe('/');
	});

	// SPECSFY: US-001 FR-001 NFR-001 AC-002
	it('usa favicon quadrado derivado do logo-minimal', async () => {
		const { width, height } = await readPngSize(FAVICON);
		expect(width).toBe(height);
		expect(width).toBeGreaterThanOrEqual(180);
	});

	// SPECSFY: US-002 FR-002 NFR-003 AC-003
	it('não renderiza header global no shell mobile', async () => {
		const frame = await readFile(APP_FRAME, 'utf8');
		expect(frame).not.toContain('mobile-header');
	});

	// SPECSFY: US-001 US-002 FR-002 FR-004 NFR-001 NFR-003 AC-004
	it('estende o tema sob notch e barra com safe-area', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		const css = await readFile(APP_CSS, 'utf8');
		expect(html).toContain('viewport-fit=cover');
		expect(css).toContain('safe-area-inset');
	});

	// SPECSFY: US-001 FR-004 FR-005 NFR-001 AC-010
	it('declara theme-color por esquema claro e escuro', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		expect(html).toContain('name="theme-color"');
		expect(html).toContain('prefers-color-scheme: dark');
		expect(html).toContain('prefers-color-scheme: light');
	});

	// SPECSFY: US-001 FR-001 NFR-001 AC-011
	it('oferece apple-touch-icon e maskable sem recorte', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as {
			icons?: Array<{ purpose?: string }>;
		};
		expect(html).toContain('apple-touch-icon');
		const { width, height } = await readPngSize(APPLE_TOUCH);
		expect(width).toBe(180);
		expect(height).toBe(180);
		expect(manifest.icons?.some((icon) => icon.purpose?.includes('maskable'))).toBe(true);
	});

	// SPECSFY: US-002 FR-002 FR-004 NFR-003 AC-012
	it('mantém a barra inferior como navegação única com safe-area', async () => {
		const sidebar = await readFile(APP_SIDEBAR, 'utf8');
		expect(sidebar).toContain('mobile-bottom-nav');
		expect(sidebar).toContain('safe-area-inset-bottom');
		expect(sidebar).toContain('aria-current');
	});

	// SPECSFY: US-002 FR-002 FR-004 NFR-003 AC-012
	it('recompõe a barra quando o visual viewport do iOS muda', async () => {
		const sidebar = await readFile(APP_SIDEBAR, 'utf8');
		expect(sidebar).toContain('visualViewport');
		expect(sidebar).toContain('viewport-repaint');
		expect(sidebar).toContain('translate3d(0, 0, 0.001px)');
	});
});
