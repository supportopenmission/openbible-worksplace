import { describe, expect, it } from 'vitest';
import { MediaValidationError, validateMediaFile } from './media-service';

describe('media validation', () => {
	// SPECSFY: US-001 FR-001 AC-003
	it('accepts supported formats and rejects unsupported extensions', () => {
		expect(validateMediaFile(new File(['image'], 'cover.webp', { type: 'image/webp' }))).toEqual({
			mediaType: 'image',
			format: 'webp'
		});
		expect(() => validateMediaFile(new File(['script'], 'script.exe'))).toThrow(MediaValidationError);
	});

	it('enforces the image size limit before copying bytes', () => {
		const file = new File(['small'], 'cover.png', { type: 'image/png' });
		Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 });

		expect(() => validateMediaFile(file)).toThrowError(/10 MB/);
	});
});
