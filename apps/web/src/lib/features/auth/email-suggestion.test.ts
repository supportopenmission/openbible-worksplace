import { describe, it, expect } from 'vitest';
import { normalizeEmail, detectEmailTypo } from './email-suggestion';

describe('email-suggestion', () => {
	it('normaliza o email removendo espaços e convertendo para minúsculas', () => {
		expect(normalizeEmail('  Cafg.Dev@Gmail.com  ')).toBe('cafg.dev@gmail.com');
	});

	it('detecta o typo clássico .conm e sugere .com', () => {
		const result = detectEmailTypo('cafg.dev@gmail.conm');
		expect(result.isKnownTypo).toBe(true);
		expect(result.suggestedEmail).toBe('cafg.dev@gmail.com');
		expect(result.warning).toContain('cafg.dev@gmail.com');
	});

	it('detecta typos comuns como gmai.com e gamil.com', () => {
		const r1 = detectEmailTypo('teste@gmai.com');
		expect(r1.isKnownTypo).toBe(true);
		expect(r1.suggestedEmail).toBe('teste@gmail.com');

		const r2 = detectEmailTypo('teste@gamil.com');
		expect(r2.isKnownTypo).toBe(true);
		expect(r2.suggestedEmail).toBe('teste@gmail.com');
	});

	it('detecta typos em hotmail e outlook', () => {
		const r1 = detectEmailTypo('usuario@hotmial.com');
		expect(r1.isKnownTypo).toBe(true);
		expect(r1.suggestedEmail).toBe('usuario@hotmail.com');

		const r2 = detectEmailTypo('usuario@outlok.com');
		expect(r2.isKnownTypo).toBe(true);
		expect(r2.suggestedEmail).toBe('usuario@outlook.com');
	});

	it('retorna null para emails válidos sem erro de domínio conhecido', () => {
		const valid = detectEmailTypo('cafg.dev@gmail.com');
		expect(valid.isKnownTypo).toBe(false);
		expect(valid.suggestedEmail).toBeNull();
	});

	it('trata inputs incompletos sem lançar erro', () => {
		expect(detectEmailTypo('').isKnownTypo).toBe(false);
		expect(detectEmailTypo('cafg').isKnownTypo).toBe(false);
		expect(detectEmailTypo('cafg@').isKnownTypo).toBe(false);
	});
});
