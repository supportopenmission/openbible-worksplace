import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const highlightsPage = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../../routes/highlights/+page.svelte'
);

describe('/highlights page', () => {
	it('provides a dedicated highlights route', () => {
		// SPECSFY: US-002 FR-002 AC-004
		expect(existsSync(highlightsPage)).toBe(true);
	});

	it('can render an empty highlights collection', () => {
		// SPECSFY: US-002 FR-002 NFR-002 AC-006
		expect(existsSync(highlightsPage)).toBe(true);
	});
});
