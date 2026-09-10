/**
 * Estado do índice (ToC) do Edra, extraído de `toc.svelte`: o toolchain não
 * resolve imports nomeados do `<script module>` do Svelte (ver README).
 */
import { writable } from 'svelte/store';
import type { TableOfContentData } from '@tiptap/extension-table-of-contents';

export const tocItems = writable<TableOfContentData>([]);

export const setTocItems = (items: TableOfContentData): void => {
	tocItems.set(items);
};
