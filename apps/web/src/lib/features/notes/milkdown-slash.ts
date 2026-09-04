import { slashFactory } from '@milkdown/kit/plugin/slash';

export type MilkdownSlashId =
	| 'verse'
	| 'heading'
	| 'bullet'
	| 'ordered'
	| 'task'
	| 'quote'
	| 'code'
	| 'divider';

export interface MilkdownSlashItem {
	id: MilkdownSlashId;
	label: string;
	description: string;
	aliases: string[];
}

const ITEMS: MilkdownSlashItem[] = [
	{ id: 'verse', label: 'Versículo', description: 'Texto bíblico', aliases: ['versiculo', 'verse', 'biblia'] },
	{ id: 'heading', label: 'Título', description: 'Título ou seção', aliases: ['h1', 'h2', 'h3', 'titulo'] },
	{ id: 'bullet', label: 'Lista', description: 'Lista com marcadores', aliases: ['lista', 'bullet', 'ul'] },
	{ id: 'ordered', label: 'Lista numerada', description: 'Itens numerados', aliases: ['numerada', 'ordered', 'ol'] },
	{ id: 'task', label: 'Checklist', description: 'Lista de tarefas', aliases: ['checklist', 'task', 'todo'] },
	{ id: 'quote', label: 'Citação', description: 'Bloco citado', aliases: ['citacao', 'quote'] },
	{ id: 'code', label: 'Código', description: 'Bloco de código', aliases: ['codigo', 'code'] },
	{ id: 'divider', label: 'Divisória', description: 'Separador horizontal', aliases: ['divisoria', 'divider', 'hr'] }
];

export function getSlashItems(): MilkdownSlashItem[] {
	return ITEMS.map((item) => ({ ...item, aliases: [...item.aliases] }));
}

export function filterSlashItems(items: MilkdownSlashItem[], query: string): MilkdownSlashItem[] {
	const normalized = query.replace(/^\//, '').trim().toLocaleLowerCase('pt-BR');
	if (!normalized) return items;
	return items.filter((item) =>
		[item.label, item.description, ...item.aliases]
			.map((value) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
			.some((value) => value.includes(normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
	);
}

export function moveSlashSelection(count: number, current: number, direction: 'next' | 'prev') {
	if (count <= 0) return 0;
	return (current + (direction === 'next' ? 1 : -1) + count) % count;
}
/**
 * Kept as a named factory for callers that need to integrate Milkdown's
 * native slash plugin with a renderer. The note editor owns the accessible
 * overlay and intentionally does not install this plugin without a renderer.
 */
export const milkdownSlashPlugin = slashFactory('openbible');
