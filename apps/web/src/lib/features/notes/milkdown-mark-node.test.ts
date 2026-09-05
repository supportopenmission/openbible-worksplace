import { describe, expect, it } from 'vitest';
import {
	extractMarkSpans,
	formatActionMarkName,
	serializeMarkedSpan
} from './milkdown-mark-node';

// SPECSFY: US-007 FR-007 NFR-001 AC-019
describe('highlight mark spans', () => {
	it('parses ==teste== into a highlight span and serializes it back', () => {
		expect(extractMarkSpans('a ==teste== b')).toEqual([
			{ text: 'a ', mark: null },
			{ text: 'teste', mark: 'highlight' },
			{ text: ' b', mark: null }
		]);
		expect(serializeMarkedSpan({ text: 'teste', mark: 'highlight' })).toBe('==teste==');
	});
});

// SPECSFY: US-007 FR-007 NFR-002 AC-020
describe('underline guard', () => {
	it('marks ++mesmo++ but leaves C++ untouched', () => {
		expect(extractMarkSpans('isto ++mesmo++ aqui')).toEqual([
			{ text: 'isto ', mark: null },
			{ text: 'mesmo', mark: 'underline' },
			{ text: ' aqui', mark: null }
		]);
		expect(extractMarkSpans('C++ e C++')).toEqual([{ text: 'C++ e C++', mark: null }]);
		expect(serializeMarkedSpan({ text: 'mesmo', mark: 'underline' })).toBe('++mesmo++');
	});
});

// SPECSFY: US-007 FR-007 NFR-003 AC-021
describe('popover mark mapping', () => {
	it('maps actions to schema marks and keeps the legacy color', () => {
		expect(formatActionMarkName('bold')).toBe('strong');
		expect(formatActionMarkName('italic')).toBe('emphasis');
		expect(formatActionMarkName('highlight')).toBe('highlight');
		expect(formatActionMarkName('underline')).toBe('underline');
		expect(serializeMarkedSpan({ text: 'x', mark: 'highlight', color: 'yellow' })).toBe(
			'=={yellow}x=='
		);
	});
});
