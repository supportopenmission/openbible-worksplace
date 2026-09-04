import { readAllReaderHighlights } from '$lib/features/bible/reader-highlights-repository';
import type { ReaderHighlightRecord } from '$lib/features/bible/reader-highlights-repository';
import type {
	ReaderSelectionPreference,
	WorkspaceStorage
} from '$lib/storage/types';

export type HomeContinuation =
	| { kind: 'selection'; selection: ReaderSelectionPreference }
	| { kind: 'highlight'; highlight: ReaderHighlightRecord }
	| { kind: 'empty' };

/**
 * Resolve o destino de "Continuar leitura" da home: primeiro a seleção salva
 * em `readerSelection`, depois o último destaque do workspace. Falha de
 * leitura dos destaques cai em vazio em vez de quebrar a home.
 */
export async function resolveHomeContinuation(
	preferences: { readerSelection: ReaderSelectionPreference | null },
	storage: WorkspaceStorage
): Promise<HomeContinuation> {
	if (preferences.readerSelection) {
		return { kind: 'selection', selection: preferences.readerSelection };
	}
	try {
		const highlights = await readAllReaderHighlights(storage);
		const last = highlights[highlights.length - 1];
		if (last) return { kind: 'highlight', highlight: last };
	} catch {
		// Destaques ilegíveis equivalem a ausência para a continuidade.
	}
	return { kind: 'empty' };
}
