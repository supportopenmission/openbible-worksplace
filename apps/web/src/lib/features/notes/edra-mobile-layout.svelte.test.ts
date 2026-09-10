import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import EdraNoteEditor from './EdraNoteEditor.svelte';
import type { Note } from './note-types';
import type { WorkspaceStorage } from '$lib/storage/types';

function memoryStorage(): WorkspaceStorage {
	return {
		kind: 'opfs',
		label: 'Teste Edra',
		workspaceId: `edra-mobile-${Date.now()}`,
		async ensureDirectory() {},
		async writeFile() {},
		async readFile() {
			return null;
		},
		async fileExists() {
			return false;
		},
		async listFiles() {
			return [];
		}
	};
}

function testNote(id: string, body: string): Note {
	const now = new Date().toISOString();
	return {
		id,
		title: 'Nota mobile',
		createdAt: now,
		updatedAt: now,
		meta: { id, title: 'Nota mobile', createdAt: now, updatedAt: now, type: 'note', path: `notes/${id}.md` },
		body,
		content: body,
		path: `notes/${id}.md`
	};
}

// SPECSFY: layout mobile do editor — sem scroll de página, toolbar com
// scroll invisível próprio, conteúdo em 100% e sem outline de foco.
describe('edra mobile layout', () => {
	it('keeps long urls and tables inside the viewport width', async () => {
		await page.viewport(390, 844);
		const body = [
			'## Título',
			'',
			'Texto https://exemplo.test/um/caminho/bem/longo/para/quebrar/layout/mobile.',
			'',
			'| A | B bem longa mesmo | C |',
			'| --- | --- | --- |',
			'| 1 | 2 com texto extenso | 3 |',
			''
		].join('\n');

		const screen = await render(EdraNoteEditor, {
			props: { note: testNote('mobile-1', body), storage: memoryStorage(), toolbarPinned: true }
		});

		const wrap = screen.container.querySelector('.edra-canvaswrap') as HTMLElement;
		expect(wrap.scrollWidth - wrap.clientWidth).toBeLessThanOrEqual(2);
		expect(document.documentElement.scrollWidth - window.innerWidth).toBeLessThanOrEqual(0);
		const editor = screen.container.querySelector('.edra-editor') as HTMLElement;
		expect(editor.scrollWidth - editor.clientWidth).toBeLessThanOrEqual(2);
	});

	it('wraps the toolbar without horizontal scrolling on mobile', async () => {
		await page.viewport(390, 844);
		const screen = await render(EdraNoteEditor, {
			props: { note: testNote('mobile-2', 'Texto.\n'), storage: memoryStorage(), toolbarPinned: true }
		});

		const bar = screen.container.querySelector('.edra-toolbar-bar') as HTMLElement;
		expect(getComputedStyle(bar).overflowX).toBe('hidden');
		expect(getComputedStyle(bar).flexWrap).toBe('wrap');
		expect(getComputedStyle(bar).scrollbarWidth).toBe('none');
		const full = screen.container.querySelector('.edra-toolbar-full') as HTMLElement;
		expect(getComputedStyle(full).overflowX).toBe('hidden');
		const editor = screen.container.querySelector('.edra-editor') as HTMLElement;
		// Sem scroll horizontal no editor, com vertical preservado.
		expect(editor.scrollWidth - editor.clientWidth).toBeLessThanOrEqual(2);
		expect(['auto', 'scroll']).toContain(getComputedStyle(editor).overflowY);
	});

	it('fills the available height without a focus outline', async () => {
		await page.viewport(390, 844);
		const screen = await render(EdraNoteEditor, {
			props: { note: testNote('mobile-3', 'Curta.\n'), storage: memoryStorage(), toolbarPinned: true }
		});

		const pm = screen.container.querySelector('.ProseMirror') as HTMLElement;
		const host = screen.container.querySelector('.edra-content') as HTMLElement;
		expect(pm.getBoundingClientRect().height).toBeGreaterThanOrEqual(
			host.getBoundingClientRect().height - 1
		);
		await screen.getByText('Curta.').click();
		expect(getComputedStyle(pm).outlineStyle).toBe('none');
	});

	it('confines the selection bubble to the viewport width', async () => {
		await page.viewport(390, 844);
		const screen = await render(EdraNoteEditor, {
			props: { note: testNote('mobile-4', 'Texto para selecionar.\n'), storage: memoryStorage() }
		});

		await screen.getByText('Texto para selecionar.').click();
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await new Promise((resolve) => setTimeout(resolve, 500));
		for (const el of document.body.querySelectorAll('*')) {
			const node = el as HTMLElement;
			if (!(node instanceof HTMLElement)) continue;
			const rect = node.getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) continue;
			const style = getComputedStyle(node);
			if (style.display === 'none' || style.visibility === 'hidden') continue;
			expect(
				rect.right,
				`${node.tagName}.${node.className.toString().split(' ').slice(0, 2).join('.')}`
			).toBeLessThanOrEqual(391.5);
		}
	});

	it('aligns the editor column with the title on desktop', async () => {		await page.viewport(1280, 800);
		const screen = await render(EdraNoteEditor, {
			props: { note: testNote('desktop-1', 'dddsdsdsd\n'), storage: memoryStorage() }
		});

		const title = screen.container.querySelector('.note-title') as HTMLElement;
		const pm = screen.container.querySelector('.ProseMirror') as HTMLElement;
		const titleRect = title.getBoundingClientRect();
		const pmRect = pm.getBoundingClientRect();
		expect(Math.abs(pmRect.x - titleRect.x)).toBeLessThanOrEqual(2);
		expect(pmRect.width).toBeGreaterThanOrEqual(titleRect.width - 2);
	});
});
