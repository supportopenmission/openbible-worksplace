type PersistableStorage = Pick<StorageManager, 'persist'> &
	Partial<Pick<StorageManager, 'persisted'>>;

function browserStorageManager(): PersistableStorage | null {
	if (typeof navigator === 'undefined' || !navigator.storage) return null;
	if (typeof navigator.storage.persist !== 'function') return null;
	return navigator.storage;
}

export async function isStoragePersisted(
	storage: PersistableStorage | null = browserStorageManager()
): Promise<boolean | null> {
	if (!storage?.persisted) return null;
	try {
		return await storage.persisted();
	} catch {
		return null;
	}
}

export async function requestPersistentStorage(
	storage: PersistableStorage | null = browserStorageManager()
): Promise<boolean> {
	if (!storage) return false;
	try {
		if (storage.persisted && (await storage.persisted())) return true;
		return await storage.persist();
	} catch {
		return false;
	}
}
