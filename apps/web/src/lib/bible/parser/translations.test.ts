import { describe, expect, it } from 'vitest';
import {
	findTranslation,
	registerTranslation,
	registerBibleVersion,
	populateTranslationsFromCatalog,
	bibleTranslations
} from './translations';
import { parseBibleReferences } from './BibleReferenceParser';

describe('translations registry', () => {
	it('finds initial standard translations case-insensitively', () => {
		expect(findTranslation('ARA')?.abbreviation).toBe('ARA');
		expect(findTranslation('ara')?.abbreviation).toBe('ARA');
		expect(findTranslation('(ARA)')?.abbreviation).toBe('ARA');
		expect(findTranslation('(nvi)')?.abbreviation).toBe('NVI');
		expect(findTranslation('naa')?.abbreviation).toBe('NAA');
		expect(findTranslation('arc')?.abbreviation).toBe('ARC');
	});

	it('registers a new translation and recognizes it immediately', () => {
		registerTranslation({
			id: 'kjv',
			abbreviation: 'KJV',
			name: 'King James Version'
		});

		expect(findTranslation('KJV')?.name).toBe('King James Version');
		expect(findTranslation('kjv')?.abbreviation).toBe('KJV');
		expect(findTranslation('(kjv)')?.abbreviation).toBe('KJV');

		const refs = parseBibleReferences('Read John 3.16 KJV');
		expect(refs).toHaveLength(1);
		expect(refs[0].translation).toBe('KJV');
		expect(refs[0].raw).toBe('John 3.16 KJV');
	});

	it('registers translation from installed Bible version file', () => {
		const installed = registerBibleVersion({
			fileName: 'ACF.sqlite',
			name: 'Almeida Corrigida e Fiel'
		});

		expect(installed.abbreviation).toBe('ACF');
		expect(findTranslation('ACF')?.name).toBe('Almeida Corrigida e Fiel');

		const refs = parseBibleReferences('Compare com Sl 23.1 (ACF).');
		expect(refs).toHaveLength(1);
		expect(refs[0].translation).toBe('ACF');
		expect(refs[0].raw).toBe('Sl 23.1 (ACF)');
	});

	it('populates translations from a catalog list', () => {
		populateTranslationsFromCatalog([
			{ fileName: 'NVT.sqlite', name: 'Nova Versão Transformadora' },
			{ fileName: 'NTLH.sqlite', name: 'Nova Tradução na Linguagem de Hoje' }
		]);

		expect(findTranslation('NVT')).toBeDefined();
		expect(findTranslation('ntlh')).toBeDefined();

		const refs = parseBibleReferences('Estudo em Jo 1.1 NVT e Rm 8.1 (NTLH)');
		expect(refs).toHaveLength(2);
		expect(refs[0].translation).toBe('NVT');
		expect(refs[1].translation).toBe('NTLH');
	});
});
