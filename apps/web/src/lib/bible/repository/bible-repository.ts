import type { WorkspaceStorage } from '$lib/storage/types';
import type { BibleRepository } from './types';
import { MockBibleRepository } from './mock-bible-repository';
import { SQLiteBibleRepository } from './sqlite-bible-repository';

export function createDefaultBibleRepository(storage?: WorkspaceStorage): BibleRepository {
	if (storage) {
		return new SQLiteBibleRepository(storage);
	}
	return new MockBibleRepository();
}

export * from './types';
export * from './mock-bible-repository';
export * from './sqlite-bible-repository';
