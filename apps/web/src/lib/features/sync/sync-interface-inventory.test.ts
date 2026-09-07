import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const interfaceDoc = readFileSync(new URL('../../../../../../INTERFACE.md', import.meta.url), 'utf8');

// SPECSFY: US-004 FR-003 FR-005 NFR-004 AC-011 AC-016 AC-027
describe('sync interface inventory', () => {
	it('registra blocos, estados e composição da configuração', () => {
		expect(interfaceDoc).toContain('| `SyncSettings`');
		expect(interfaceDoc).toContain('| `SyncStatus`');
		expect(interfaceDoc).toContain('| `PeerConflictPanel`');
		expect(interfaceDoc).toContain('conflito `needs-review`');
		expect(interfaceDoc).toContain('PeerConflictPanel');
	});
});
