import { describe, expect, it } from 'vitest';
import { getDirectoryPickerError } from './onboarding-errors';

describe('onboarding directory picker errors', () => {
	it('explains host permission failures instead of calling them cancellation', () => {
		expect(getDirectoryPickerError({ name: 'AbortError' })).toMatch(
			/ambiente integrado pode não oferecer acesso a pastas/
		);
	});

	it('preserves useful errors from the picker', () => {
		expect(getDirectoryPickerError(new Error('Directory selection is not available'))).toBe(
			'Directory selection is not available'
		);
	});
});
