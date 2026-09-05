import { describe, expect, it } from 'vitest';
import {
	buildExportMarkdown,
	buildPrintDocument,
	expandVerseFences,
	expandVideoFences
} from './note-export';
import { markdownBodyToHtml } from './verse-block-extension';

const NOTE = '# Estudo\n\n:::verse {version="nvi.sqlite" book="Gn" chapter="3" verseStart="1" verseEnd="1"}\nSnapshot antigo\n:::\n';

// SPECSFY: US-005 FR-005 NFR-001 AC-013
describe('markdown export with expanded verses', () => {
	it('replaces each fence with reference plus full text', () => {
		const expanded = expandVerseFences(NOTE, () => [{ reference: 'Gn 3.1', text: 'No princípio...' }]);
		expect(expanded.ok).toBe(true);
		if (expanded.ok) {
			expect(expanded.markdown).toContain('> Gn 3.1');
			expect(expanded.markdown).toContain('No princípio...');
			expect(expanded.markdown).not.toContain(':::verse');
		}
	});
});

// SPECSFY: US-005 FR-005 NFR-002 AC-014
describe('print export equivalence', () => {
	it('derives the printable document from the same expansion', () => {
		const markdown = buildExportMarkdown(NOTE, () => [
			{ reference: 'Gn 3.1', text: 'No princípio...' }
		]);
		expect(markdown).toContain('# Estudo');
		expect(markdown).toContain('No princípio...');
		expect(markdown).not.toContain(':::verse');
	});
});

// SPECSFY: US-005 FR-005 NFR-003 AC-015
describe('export preserves the original note', () => {
	it('never mutates the source and reports missing verse text', () => {
		const frozen = NOTE;
		const expanded = expandVerseFences(NOTE, () => []);
		expect(NOTE).toBe(frozen);
		expect(expanded.ok).toBe(false);
		if (!expanded.ok) {
			expect(expanded.reason).toBe('missing-verse-text');
		}
	});
});

const VIDEO_NOTE =
	'# Estudo\n\n:::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" videoId="dQw4w9WgXcQ"}\n:::\n';
const BR_NOTE = '# Estudo\n\nPrimeira linha.<br />Segunda linha.<br/>Terceira.<br>Quarta.\n';

// SPECSFY: US-004 FR-008 NFR-001 AC-022
describe('video iframe export', () => {
	it('replaces each video fence with an accessible nocookie iframe', () => {
		const markdown = buildExportMarkdown(VIDEO_NOTE, () => []);
		expect(markdown).toContain('<iframe');
		expect(markdown).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
		expect(markdown).toContain('title="Vídeo do YouTube"');
		expect(markdown).not.toContain(':::video');
	});
});

// SPECSFY: US-004 FR-008 NFR-002 AC-023
describe('multiple video export order', () => {
	it('keeps iframes in the order of the source fences', () => {
		const second = VIDEO_NOTE.replaceAll('dQw4w9WgXcQ', 'eY52Zsg2Jjw');
		const markdown = buildExportMarkdown(`${VIDEO_NOTE}\nTexto.\n\n${second}`, () => []);
		const first = markdown.indexOf('dQw4w9WgXcQ');
		const other = markdown.indexOf('eY52Zsg2Jjw');
		expect(first).toBeGreaterThanOrEqual(0);
		expect(other).toBeGreaterThan(first);
		expect(markdown).not.toContain(':::video');
	});
});

// SPECSFY: US-004 FR-008 NFR-003 AC-024
describe('video without id', () => {
	it('omits the block and reports a warning without network', () => {
		const note = '# Estudo\n\n:::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"}\n:::\n';
		const { markdown, warnings } = expandVideoFences(note);
		expect(markdown).not.toContain(':::video');
		expect(markdown).not.toContain('<iframe');
		expect(warnings).toHaveLength(1);
	});
});

// SPECSFY: US-005 FR-009 NFR-001 AC-025
describe('print without literal tags', () => {
	it('sanitizes br tags through the full print pipeline', () => {
		const markdown = buildExportMarkdown(BR_NOTE, () => []);
		const html = markdownBodyToHtml(markdown);
		const doc = buildPrintDocument('Estudo', html);
		expect(doc).not.toContain('<br');
		expect(doc).toContain('Primeira linha.');
		expect(doc).toContain('Segunda linha.');
		expect(doc).toContain('<title>Estudo</title>');
	});
});

// SPECSFY: US-005 FR-009 NFR-002 AC-026
describe('editorial print stylesheet', () => {
	it('wraps the document with title, verse and margin rules', () => {
		const doc = buildPrintDocument('Estudo', '<h1>Estudo</h1><blockquote><p>Gn 3.1</p></blockquote>');
		expect(doc).toContain('<h1 class="doc-title">Estudo</h1>');
		expect(doc).not.toContain('<h1>Estudo</h1>');
		expect(doc).toContain('max-width');
		expect(doc).toContain('blockquote');
		expect(doc).toContain('Georgia');
	});
});

// SPECSFY: US-005 FR-009 NFR-003 AC-027
describe('markdown without literal tags', () => {
	it('turns br tags into real breaks and keeps the source intact', () => {
		const frozen = BR_NOTE;
		const markdown = buildExportMarkdown(BR_NOTE, () => []);
		expect(BR_NOTE).toBe(frozen);
		expect(markdown).not.toContain('<br');
		expect(markdown).toContain('Primeira linha.');
	});
});
