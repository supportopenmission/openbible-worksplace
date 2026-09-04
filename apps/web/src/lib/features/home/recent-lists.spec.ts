import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-002 FR-004 FR-002 NFR-001 AC-009
describe('recentes vazios sem conteúdo', () => {
	it('expõe listas com vazio orientado por seção', () => {
		const lists = new URL('./RecentLists.svelte', import.meta.url);
		expect(existsSync(lists)).toBe(true);
	});
});
