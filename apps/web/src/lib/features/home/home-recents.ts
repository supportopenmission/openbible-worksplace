import { readAllReaderHighlights } from '$lib/features/bible/reader-highlights-repository';
import type { ReaderHighlightRecord } from '$lib/features/bible/reader-highlights-repository';
import { listNotes } from '$lib/features/notes/notes-repository';
import type { Note } from '$lib/features/notes/note-types';
import type { WorkspaceStorage } from '$lib/storage/types';

export const HOME_RECENT_NOTES_LIMIT = 5;
export const HOME_RECENT_HIGHLIGHTS_LIMIT = 5;

export interface HomeRecents {
	notes: Note[];
	highlights: ReaderHighlightRecord[];
	notesError: string;
	highlightsError: string;
}

/**
 * Carrega os recentes da home com limites fixos pequenos. Cada seção falha
 * de forma isolada para não derrubar a home inteira.
 */
export async function loadHomeRecents(storage: WorkspaceStorage): Promise<HomeRecents> {
	const [notesResult, highlightsResult] = await Promise.allSettled([
		listNotes(storage),
		readAllReaderHighlights(storage)
	]);
	return {
		notes:
			notesResult.status === 'fulfilled'
				? notesResult.value.slice(0, HOME_RECENT_NOTES_LIMIT)
				: [],
		highlights:
			highlightsResult.status === 'fulfilled'
				? highlightsResult.value.slice(-HOME_RECENT_HIGHLIGHTS_LIMIT)
				: [],
		notesError:
			notesResult.status === 'rejected' ? 'Não foi possível carregar as notas recentes.' : '',
		highlightsError:
			highlightsResult.status === 'rejected'
				? 'Não foi possível carregar os destaques recentes.'
				: ''
	};
}
