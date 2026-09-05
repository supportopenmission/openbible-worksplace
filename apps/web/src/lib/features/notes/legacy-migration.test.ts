import { describe, expect, it } from 'vitest';
import * as markdownIo from './milkdown-markdown-io';

// SPECSFY: US-002 FR-003 NFR-001 NFR-004 AC-008
describe('explicit legacy migration', () => {
	it('does not rewrite on read and converts only on an explicit canonical save', () => {
		const legacy = ':::verse{versionId="acf.sqlite" bookId="1"}\nTexto legado.\n:::';
		const readOnly = markdownIo.roundtripMarkdown(legacy);
		const readApi = markdownIo.readPortableMarkdown;
		const saveApi = markdownIo.saveCanonicalMarkdown;

		expect(readOnly).toBe(legacy);
		expect(typeof readApi).toBe('function');
		expect(typeof saveApi).toBe('function');
		if (typeof readApi === 'function' && typeof saveApi === 'function') {
			expect(readApi(legacy)).toEqual(expect.objectContaining({ sourceKind: 'legacy' }));
			const explicitSave = saveApi(readApi(legacy));
			expect(explicitSave).not.toContain(':::verse');
			expect(explicitSave).toContain('> Texto legado.');
		}
	});
});
