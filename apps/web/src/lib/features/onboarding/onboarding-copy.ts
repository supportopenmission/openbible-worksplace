export const onboardingCopy = {
	intro: {
		eyebrow: 'Primeiro passo',
		title: 'Prepare seu espaço de estudo',
		body: 'O OpenBible salva suas notas e destaques no armazenamento local do workspace. Markdown fica reservado para exportação.'
	},
	installing: {
		eyebrow: 'Preparando o workspace',
		title: 'Configurando seu espaço de estudo',
		body: 'Estamos preparando o armazenamento local e os recursos iniciais. Nada é enviado para a internet.'
	},
	import: {
		eyebrow: 'Conteúdo inicial',
		title: 'Você já tem Bíblias SQLite?',
		body: 'Adicione arquivos compatíveis agora ou deixe essa etapa pendente para fazer depois.'
	},
	complete: {
		eyebrow: 'Tudo pronto',
		title: 'Seu workspace está preparado',
		body: 'Seu espaço está pronto. Escreva no app e exporte suas notas em Markdown quando precisar.'
	}
} as const;

export type OnboardingStep = keyof typeof onboardingCopy;
