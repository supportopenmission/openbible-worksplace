import { describe, expect, it } from 'vitest';
import { toUserFacingStorageError } from './tauri-bridge';

describe('native error mapping', () => {
	// SPECSFY: US-003 FR-002 FR-004 NFR-001 NFR-003 AC-010
	it('does not expose paths or note content in an actionable error', () => {
		const error = toUserFacingStorageError({
			code: 'sqlite_invalid',
			message: 'SQLite failure at /Users/test/OpenBible/notes/private.md'
		});

		expect(error).toMatchObject({ recoverable: true });
		expect(error.message).not.toContain('/Users/test');
		expect(error.message).not.toContain('private.md');
	});
});
