import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP_HTML = fileURLToPath(new URL('../../app.html', import.meta.url));
const APP_CSS = fileURLToPath(new URL('../../app.css', import.meta.url));
const SHEET = fileURLToPath(
	new URL('../components/ui/sheet/sheet-content.svelte', import.meta.url)
);

describe('viewport e drawers mobile', () => {
	// SPECSFY: US-001 FR-001 NFR-001 AC-001
	it('trava o pinch em escala 1', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		expect(html).toContain('maximum-scale=1.0');
	});

	// SPECSFY: US-001 FR-001 NFR-001 AC-002
	it('trava o zoom por duplo toque', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		expect(html).toContain('user-scalable=no');
	});

	// SPECSFY: US-002 FR-002 NFR-001 AC-003
	it('garante campo em 16px no touch contra o zoom de foco', async () => {
		const css = await readFile(APP_CSS, 'utf8');
		expect(css).toContain('pointer: coarse');
		expect(css).toMatch(/input.*font-size:\s*16px/s);
	});

	// SPECSFY: US-002 FR-002 NFR-001 AC-004
	it('cobre campos de modal com a mesma regra touch', async () => {
		const css = await readFile(APP_CSS, 'utf8');
		expect(css).toContain('textarea');
		expect(css).toContain('select');
		expect(css).toContain('font-size: 16px');
	});

	// SPECSFY: US-002 FR-002 NFR-002 AC-005
	it('preserva o desenho de campos no desktop com mouse', async () => {
		const css = await readFile(APP_CSS, 'utf8');
		const coarseAt = css.indexOf('@media (pointer: coarse)');
		expect(coarseAt).toBeGreaterThan(-1);
		expect(css.slice(coarseAt)).toContain('font-size: 16px');
		expect(css.slice(0, coarseAt)).not.toContain('font-size: 16px');
	});

	// SPECSFY: US-003 FR-003 NFR-001 AC-006
	it('abre o drawer inferior com 90% da altura', async () => {
		const sheet = await readFile(SHEET, 'utf8');
		expect(sheet).toContain('90dvh');
	});

	// SPECSFY: US-003 FR-003 NFR-001 AC-007
	it('respeita a safe-area inferior no drawer', async () => {
		const sheet = await readFile(SHEET, 'utf8');
		expect(sheet).toContain('safe-area-inset-bottom');
	});

	// SPECSFY: US-003 FR-003 NFR-002 AC-008
	it('preserva sheets laterais e comportamento desktop', async () => {
		const sheet = await readFile(SHEET, 'utf8');
		expect(sheet).toContain('data-[side=left]');
		expect(sheet).toContain('data-[side=right]');
	});

	// SPECSFY: US-001 FR-001 NFR-002 AC-009
	it('declara a trava nativa na meta viewport', async () => {
		const html = await readFile(APP_HTML, 'utf8');
		const viewport = html.match(/<meta name="viewport"[^>]*>/)?.[0] ?? '';
		expect(viewport).toContain('maximum-scale');
		expect(viewport).toContain('user-scalable');
		expect(viewport).toContain('viewport-fit=cover');
	});
});
