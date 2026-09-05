import { describe, expect, it } from 'vitest';
import { roundtripMarkdown } from './milkdown-markdown-io';
import { buildExportMarkdown } from './note-export';
import { renderVerseFence } from './verse-block-extension';

const CREATED_VERSE = renderVerseFence({
	attrs: {
		versionId: 'nvi.sqlite',
		version: 'NVI',
		bookId: '43',
		book: 'João',
		chapter: '3',
		verseStart: '16',
		verseEnd: '16'
	},
	body: 'Porque Deus amou o mundo.'
});

// SPECSFY: US-002 FR-002 NFR-002 AC-004
describe('canonical verse envelope', () => {
	it('emits a visible blockquote and a versioned HTML metadata envelope when a new block is created', () => {
		const canonical = roundtripMarkdown(CREATED_VERSE);

		expect(canonical).toContain('> **João 3:16 · NVI**');
		expect(canonical).toContain('<!-- openbible:block');
	});
});

// SPECSFY: US-002 FR-002 NFR-001 NFR-004 AC-005
describe('verse snapshot conflict', () => {
	it('preserves stable id and reports external text divergence', () => {
		const external = `${CREATED_VERSE}\nTexto editado fora do OpenBible.`;
		const canonical = roundtripMarkdown(external);

		expect(canonical).not.toContain(':::verse');
		expect(canonical).toContain('conflict');
		expect(canonical).toContain('Texto editado fora do OpenBible.');
	});
});

// SPECSFY: US-002 FR-002 FR-003 NFR-002 NFR-004 AC-006
describe('degraded verse envelope', () => {
	it('keeps a readable blockquote and an explicit degraded state after metadata loss', () => {
		const visible = '> João 3:16\n> Porque Deus amou o mundo.';
		const recovered = roundtripMarkdown(visible);

		expect(recovered).toContain('> João 3:16');
		expect(recovered).toContain('degraded');
	});
});

// SPECSFY: US-002 US-004 FR-002 FR-005 NFR-002 AC-007
describe('canonical video link', () => {
	it('keeps a visible link instead of requiring an iframe', () => {
		const source = ':::video{videoId="dQw4w9WgXcQ"}\n:::';
		const exported = buildExportMarkdown(source, () => []);

		expect(exported).toContain('[Vídeo]');
		expect(exported).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(exported).not.toContain('<iframe');
	});
});
