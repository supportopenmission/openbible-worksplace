import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesList from '$lib/features/notes/NotesList.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

const encoder = new TextEncoder();
const noteFile = `---
title: "Nota longa para testar a composição responsiva"
createdAt: "2026-09-02T00:00:00.000Z"
updatedAt: "2026-09-02T01:00:00.000Z"
type: "note"
---

# Nota longa para testar a composição responsiva
`;

function storage(): WorkspaceStorage {
	return {
		kind: 'opfs',
		label: 'Teste',
		async ensureDirectory() {},
		async writeFile() {},
		async readFile(path) {
			return path === 'notes/nota-1.md' ? encoder.encode(noteFile) : null;
		},
		async fileExists() {
			return true;
		},
		async listFiles(path) {
			return path === 'notes' ? ['nota-1.md'] : [];
		},
		async deleteFile() {}
	};
}

describe('notes list revised responsive composition', () => {
	// SPECSFY: US-001 US-004 FR-001 FR-009 NFR-001 AC-001
	it('keeps the page title out of the content because the shell owns it', async () => {
		render(NotesList, { props: { storage: storage(), onOpen: () => {} } });
		await expect.element(page.getByRole('heading', { name: 'Notas' })).not.toBeInTheDocument();
	});

	// SPECSFY: US-001 US-004 FR-001 FR-009 NFR-001 AC-001 AC-015
	it('renders the desktop data-table composition with a visible ID column', async () => {
		render(NotesList, { props: { storage: storage(), onOpen: () => {} } });
		await expect.element(page.getByTestId('notes-data-table')).toBeInTheDocument();
		await expect.element(page.getByText('ID', { exact: true })).toBeInTheDocument();
	});

	// SPECSFY: US-001 US-004 FR-001 FR-009 NFR-001 AC-002 AC-015
	it('renders an equivalent mobile card collection with edit and delete actions', async () => {
		render(NotesList, { props: { storage: storage(), onOpen: () => {} } });
		await expect.element(page.getByTestId('notes-card-list')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /editar nota/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /apagar nota/i })).toBeInTheDocument();
	});
});
