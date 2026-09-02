export type SlashCommandId =
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'bullet'
	| 'ordered'
	| 'task'
	| 'quote'
	| 'code'
	| 'highlight'
	| 'verse';

export interface SlashCommand {
	id: SlashCommandId;
	label: string;
	aliases: string[];
	description: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
	{
		id: 'heading1',
		label: 'Título 1',
		aliases: ['h1', 'titulo', 'título'],
		description: 'Cabeçalho principal'
	},
	{
		id: 'heading2',
		label: 'Título 2',
		aliases: ['h2', 'subtitulo', 'subtítulo'],
		description: 'Seção'
	},
	{
		id: 'heading3',
		label: 'Título 3',
		aliases: ['h3'],
		description: 'Subseção'
	},
	{
		id: 'bullet',
		label: 'Lista',
		aliases: ['ul', 'lista', 'bullet'],
		description: 'Marcadores'
	},
	{
		id: 'ordered',
		label: 'Lista numerada',
		aliases: ['ol', 'numerada', 'numero'],
		description: 'Itens numerados'
	},
	{
		id: 'task',
		label: 'Lista de tarefas',
		aliases: ['todo', 'tarefa', 'checkbox'],
		description: 'Caixas de seleção'
	},
	{
		id: 'quote',
		label: 'Citação',
		aliases: ['quote', 'blockquote', 'citacao'],
		description: 'Bloco citado'
	},
	{
		id: 'code',
		label: 'Código',
		aliases: ['code', 'pre'],
		description: 'Bloco de código'
	},
	{
		id: 'highlight',
		label: 'Destaque',
		aliases: ['highlight', 'mark', 'marca'],
		description: 'Realçar o texto'
	},
	{
		id: 'verse',
		label: 'Versículo',
		aliases: ['versiculo', 'verse', 'biblia', 'bíblia'],
		description: 'Texto bíblico'
	}
];

const DIRECT_VERSE = new Set(['/versiculo', '/verse']);

export function isDirectVerseSlash(token: string): boolean {
	return DIRECT_VERSE.has(token.trim().toLowerCase());
}

export function parseSlashToken(textBefore: string): { token: string; length: number } | null {
	const match = textBefore.match(/(\/\S*)$/);
	if (!match) return null;
	return { token: match[1], length: match[1].length };
}

export function filterSlashCommands(token: string): SlashCommand[] {
	const query = token.replace(/^\//, '').trim().toLowerCase();
	if (!query) return SLASH_COMMANDS;
	return SLASH_COMMANDS.filter(
		(command) =>
			command.label.toLowerCase().includes(query) ||
			command.aliases.some((alias) => alias.startsWith(query) || alias.includes(query))
	);
}

export function openVerseSelectorFromSlash(input: string): { open: boolean; command: string | null } {
	if (isDirectVerseSlash(input)) {
		return { open: true, command: 'verse' };
	}
	return { open: false, command: null };
}
