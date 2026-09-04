import { describe, expect, it } from 'vitest';
import { getDirectoryPickerError } from './onboarding-errors';

describe('onboarding directory picker errors', () => {
	it('explains that folder selection was cancelled', () => {
		expect(getDirectoryPickerError({ name: 'AbortError' })).toMatch(/foi cancelada/);
	});

	it('preserves useful errors from the picker', () => {
		expect(getDirectoryPickerError(new Error('Directory selection is not available'))).toBe(
			'Directory selection is not available'
		);
	});
});
