import { describe, expect, it } from 'vitest';
import { clearHomeRoute, readHomeRoute, saveHomeRoute } from './home-preference';

describe('home preference removida', () => {
	it('trata qualquer valor legado como ausência', () => {
		expect(readHomeRoute()).toBeNull();
	});

	it('não salva nova preferência', () => {
		expect(saveHomeRoute()).toBe(false);
		expect(readHomeRoute()).toBeNull();
	});

	it('limpa o resíduo legado sem falhar', () => {
		expect(clearHomeRoute()).toBe(true);
		expect(readHomeRoute()).toBeNull();
	});
});
