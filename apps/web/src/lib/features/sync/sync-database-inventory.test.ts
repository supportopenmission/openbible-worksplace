import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const databaseDoc = readFileSync(new URL('../../../../../../.specsfy/DATABASE.md', import.meta.url), 'utf8');

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 FR-004 FR-005 NFR-004 AC-002 AC-009 AC-013
describe('sync database inventory', () => {
	it('registra schema v3 e as estruturas operacionais nos dois backends', () => {
		expect(databaseDoc).toContain('schema v3');
		expect(databaseDoc).toContain('sync_documents');
		expect(databaseDoc).toContain('sync_snapshots');
		expect(databaseDoc).toContain('sync_changes');
		expect(databaseDoc).toContain('sync_queue');
		expect(databaseDoc).toContain('sync_peers');
		expect(databaseDoc).toContain('sync_endpoints');
		expect(databaseDoc).toContain('sync_conflicts');
		expect(databaseDoc).toContain('IndexedDB `openbible-workspace`');
		expect(databaseDoc).toContain('workspaceId');
	});
});
