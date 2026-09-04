import { describe, expect, it } from 'vitest';
import { Schema } from '@milkdown/kit/prose/model';
import { buildBibleReferenceDecorations } from './bibleReferenceDecorations';

describe('buildBibleReferenceDecorations', () => {
	const schema = new Schema({
		nodes: {
			doc: { content: 'block+' },
			paragraph: { group: 'block', content: 'inline*' },
			code_block: { group: 'block', content: 'text*' },
			text: { group: 'inline' }
		},
		marks: {
			code_inline: {},
			link: { attrs: { href: {} } }
		}
	});

	it('creates inline decorations for recognized bible references', () => {
		const doc = schema.node('doc', null, [
			schema.node('paragraph', null, [
				schema.text('Hoje estava lendo Gn 3.1 (ARA) e comparei com João 3.16.')
			])
		]);

		const decoSet = buildBibleReferenceDecorations(doc);
		const found = decoSet.find();

		expect(found).toHaveLength(2);

		// First deco: Gn 3.1 (ARA)
		const deco1 = found[0] as any;
		const attrs1 = deco1.type.attrs;
		expect(attrs1['data-osis']).toBe('Gen.3.1');
		expect(attrs1['data-version']).toBe('ARA');
		expect(attrs1['data-raw']).toBe('Gn 3.1 (ARA)');
		expect(attrs1['class']).toBe('bible-reference');

		// Second deco: João 3.16
		const deco2 = found[1] as any;
		const attrs2 = deco2.type.attrs;
		expect(attrs2['data-osis']).toBe('John.3.16');
		expect(attrs2['data-raw']).toBe('João 3.16');
	});

	it('does not create decorations inside code blocks', () => {
		const doc = schema.node('doc', null, [
			schema.node('code_block', null, [
				schema.text('Gn 3.1 (ARA) dentro de bloco de código')
			])
		]);

		const decoSet = buildBibleReferenceDecorations(doc);
		expect(decoSet.find()).toHaveLength(0);
	});

	it('does not create decorations inside inline code', () => {
		const doc = schema.node('doc', null, [
			schema.node('paragraph', null, [
				schema.text('Código: '),
				schema.text('Gn 3.1', [schema.mark('code_inline')]),
				schema.text(' e normal: Rm 5.12.')
			])
		]);

		const decoSet = buildBibleReferenceDecorations(doc);
		const found = decoSet.find();

		expect(found).toHaveLength(1);
		const attrs = (found[0] as any).type.attrs;
		expect(attrs['data-raw']).toBe('Rm 5.12');
		expect(attrs['data-osis']).toBe('Rom.5.12');
	});

	it('does not create decorations inside links', () => {
		const doc = schema.node('doc', null, [
			schema.node('paragraph', null, [
				schema.text('Link: '),
				schema.text('Gn 3.1', [schema.mark('link', { href: 'https://example.com' })])
			])
		]);

		const decoSet = buildBibleReferenceDecorations(doc);
		expect(decoSet.find()).toHaveLength(0);
	});
});
