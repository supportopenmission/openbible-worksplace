export function displayVersionAbbreviation(version: {
	name: string;
	fileName?: string;
	id?: string;
}): string {
	const fileName = version.fileName ?? version.id ?? '';
	const fileStem = fileName
		.replace(/\.[^.]+$/, '')
		.replace(/^(?:bibles?|versions?)[_-]/i, '')
		.trim();
	if (/^[a-z\d]{2,8}$/i.test(fileStem) && !/^(?:bibles?|versions?)$/i.test(fileStem)) {
		return fileStem.toUpperCase();
	}

	const normalizedName = version.name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('pt-BR');
	const knownAbbreviations: Array<[string, string]> = [
		['almeida revista e atualizada', 'ARA'],
		['almeida corrigida e fiel', 'ACF'],
		['almeida revista e corrigida', 'ARC'],
		['nova almeida atualizada', 'NAA'],
		['nova versao internacional', 'NVI'],
		['joao ferreira de almeida', 'JFA']
	];
	const known = knownAbbreviations.find(([name]) => normalizedName.includes(name));
	if (known) return known[1];

	const words = version.name.match(/[\p{L}\d]+/gu) ?? [];
	const ignoredWords = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'o', 'os']);
	const acronym = words
		.filter((word) => !ignoredWords.has(word.toLocaleLowerCase('pt-BR')))
		.map((word) => word[0])
		.join('')
		.slice(0, 5)
		.toUpperCase();
	return acronym || 'BÍBLIA';
}
