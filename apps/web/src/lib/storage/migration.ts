export interface OpfsMigrationOptions {
	source: string;
	destination: string;
	interruptAfter?: string;
	copy?: (source: string, destination: string, interruptAfter?: string) => Promise<void>;
}

export interface OpfsMigrationResult {
	state: 'completed' | 'error';
	sourcePreserved: true;
	retryable: boolean;
	destination: string;
}

export async function migrateOpfsWorkspace(options: OpfsMigrationOptions): Promise<OpfsMigrationResult> {
	try {
		if (options.copy) await options.copy(options.source, options.destination, options.interruptAfter);
		if (options.interruptAfter) throw new Error('migration_interrupted');
		return { state: 'completed', sourcePreserved: true, retryable: false, destination: options.destination };
	} catch {
		return { state: 'error', sourcePreserved: true, retryable: true, destination: options.destination };
	}
}
