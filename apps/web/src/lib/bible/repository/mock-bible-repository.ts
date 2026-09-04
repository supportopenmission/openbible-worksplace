import type { BiblePassage, BibleRepository, GetPassageInput, BibleVerseItem } from './types';
import { getBookName } from '../parser/books';

const KNOWN_VERSES: Record<string, string> = {
	'Gen.3.1':
		'Ora, a serpente era mais sagaz que todos os animais selváticos que o SENHOR Deus tinha feito. E disse à mulher: É assim que Deus disse: Não comereis de toda árvore do jardim?',
	'Gen.3.2':
		'Respondeu a mulher à serpente: Do fruto das árvores do jardim podemos comer,',
	'Gen.3.3':
		'mas do fruto da árvore que está no meio do jardim, disse Deus: Dele não comereis, nem tocareis nele, para que não morrais.',
	'Gen.3.4':
		'Então, a serpente disse à mulher: É certo que não morrereis.',
	'Gen.3.5':
		'Porque Deus sabe que no dia em que dele comerdes se vos abrirão os olhos e, como Deus, sereis conhecedores do bem e do mal.',
	'John.3.16':
		'Porque Deus amou ao mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.',
	'Rom.5.12':
		'Portanto, assim como por um só homem entrou o pecado no mundo, e pelo pecado, a morte, assim também a morte passou a todos os homens, porque todos pecaram.',
	'Rom.8.1':
		'Agora, pois, já nenhuma condenação há para os que estão em Cristo Jesus.',
	'Rom.8.2':
		'Porque a lei do Espírito da vida, em Cristo Jesus, te livrou da lei do pecado e da morte.',
	'Rom.8.3':
		'Porquanto o que fora impossível à lei, no que estava enferma pela carne, isso fez Deus enviando o seu próprio Filho em semelhança de carne pecaminosa e no tocante ao pecado; e, com efeito, condenou Deus, na carne, o pecado,',
	'Rom.8.4':
		'a fim de que o preceito da lei se cumprisse em nós, que não andamos segundo a carne, mas segundo o Espírito.',
	'1Cor.13.1':
		'Ainda que eu fale as línguas dos homens e dos anjos, se não tiver amor, serei como o bronze que soa ou como o címbalo que retine.',
	'Ps.23.1':
		'O SENHOR é o meu pastor; nada me faltará.'
};

export class MockBibleRepository implements BibleRepository {
	private defaultTranslation: string;

	constructor(defaultTranslation: string = 'ARA') {
		this.defaultTranslation = defaultTranslation;
	}

	async getPassage(input: GetPassageInput): Promise<BiblePassage> {
		const translation = input.translation || this.defaultTranslation;
		const osis = input.osis;

		// Extract first segment if multiple
		const firstSegment = osis.split(',')[0] ?? osis;

		// Handle range, e.g. Gen.3.1-Gen.3.5
		const isRange = firstSegment.includes('-');
		const [startPart, endPart] = isRange ? firstSegment.split('-') : [firstSegment, firstSegment];

		const startTokens = startPart.split('.');
		const endTokens = endPart?.split('.') ?? startTokens;

		const bookOsis = startTokens[0] ?? 'Gen';
		const bookName = getBookName(bookOsis);
		const chapter = parseInt(startTokens[1] ?? '1', 10) || 1;

		const startVerse = startTokens[2] ? parseInt(startTokens[2], 10) : 1;
		const endVerse = endTokens[2] ? parseInt(endTokens[2], 10) : startTokens[2] ? startVerse : 5;

		const verses: BibleVerseItem[] = [];

		for (let v = startVerse; v <= endVerse; v++) {
			const key = `${bookOsis}.${chapter}.${v}`;
			const text =
				KNOWN_VERSES[key] ??
				`[Versículo ${v} de ${bookName} ${chapter} na versão ${translation}]`;
			verses.push({
				number: v,
				text
			});
		}

		return {
			osis,
			translation,
			bookName,
			chapter,
			verses
		};
	}
}
