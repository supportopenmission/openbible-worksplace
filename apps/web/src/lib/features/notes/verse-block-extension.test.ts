import { describe, expect, it } from 'vitest';
import {
	markdownBodyToHtml,
	parseVerseFence,
	renderVerseFence,
	versePreviewUsesSnapshotOnly
} from './verse-block-extension';

const FENCE = `:::verse{versionId="nvi.sqlite" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
16 Porque Deus amou o mundo...
17 Porque Deus não enviou...
18 Quem crê nele...
:::`;

// SPECSFY: US-003 FR-003 FR-004 FR-006 NFR-002 AC-008
describe('verse-block-extension roundtrip', () => {
	it('preserves fence attributes and snapshot body', () => {
		const parsed = parseVerseFence(FENCE);
		expect(parsed.attrs.versionId).toBe('nvi.sqlite');
		expect(renderVerseFence(parsed)).toContain('verseStart="16"');
	});
});

// SPECSFY: US-003 FR-003 NFR-002 AC-007
describe('verse-block-extension preview', () => {
	it('renders snapshot without querying bibles/', () => {
		expect(versePreviewUsesSnapshotOnly(FENCE)).toBe(true);
	});
});

describe('markdown block conversion', () => {
	it('converts headings, lists, emphasis and highlight to HTML', () => {
		const markdown = `# Título\n\nParágrafo com **negrito** e *itálico* e ==destaque==.\n\n- um\n- dois\n\n1. primeiro\n\n### Sub`;
		const html = markdownBodyToHtml(markdown);
		expect(html).toContain('<h1>');
		expect(html).toContain('<h3>');
		expect(html).toContain('<ul>');
		expect(html).toContain('<ol>');
		expect(html).toContain('<strong>');
		expect(html).toContain('<em>');
		expect(html).toContain('<mark>');
	});

	// SPECSFY: US-003 FR-003 FR-008 NFR-002 AC-007 AC-013
	it('embeds the saved snapshot as an explicit node attribute for TipTap hydration', () => {
		const html = markdownBodyToHtml(FENCE);
		expect(html).toContain('data-snapshot-body=');
		expect(html).toContain('Porque Deus amou o mundo');
	});

	// SPECSFY: US-003 FR-003 FR-006 FR-008 NFR-002 AC-008 AC-013
	it('preserves two verse snapshots and their order through Markdown and HTML', () => {
		const second = FENCE.replace('nvi.sqlite', 'ara.sqlite').replace('João', 'João ARA');
		const html = markdownBodyToHtml(`${FENCE}\n\nTexto entre blocos.\n\n${second}`);
		expect(html.match(/data-snapshot-body=/g)).toHaveLength(2);
		expect(html.indexOf('nvi.sqlite')).toBeLessThan(html.indexOf('ara.sqlite'));
	});

	// SPECSFY: US-003 FR-003 FR-008 NFR-002 AC-007
	it('keeps an accented multiline snapshot available without a bible lookup', () => {
		const html = markdownBodyToHtml(FENCE);
		expect(html).toContain('data-snapshot-body=');
		expect(html).toContain('Deus não enviou');
	});

	// SPECSFY: US-002 FR-002 FR-010 NFR-001 NFR-002 AC-003 AC-005 AC-014
	it('hydrates a named highlight color instead of showing its marker as text', () => {
		const html = markdownBodyToHtml('=={yellow}texto marcado==');
		expect(html).toContain('<mark data-color="yellow">texto marcado</mark>');
	});
});
