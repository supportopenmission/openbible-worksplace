import { describe, expect, it } from 'vitest';
import { WorkspaceOpenError } from '$lib/storage/storage-registry';

// SPECSFY: US-002 FR-002 FR-004 FR-005 NFR-001 NFR-003 AC-020
describe('workspace recovery contract', () => {
	it('exposes a stable reason code for schema or migration recovery', () => {
		const error = new WorkspaceOpenError('workspace-a', 'invalid', 'schema incompatível');

		expect(error).toMatchObject({ reasonCode: 'SCHEMA_UNAVAILABLE', recoverable: true });
		expect(new WorkspaceOpenError('workspace-a', 'migration', 'migration pending')).toMatchObject({
			reasonCode: 'MIGRATION_REQUIRED',
			recoverable: true
		});
		expect(
			new WorkspaceOpenError('workspace-a', 'persistence-unavailable', 'database unavailable')
		).toMatchObject({ reasonCode: 'PERSISTENCE_UNAVAILABLE', recoverable: true });
	});
});
