export const onboardingCopy = {
	intro: {
		eyebrow: 'Primeiro passo',
		title: 'Prepare seu espaço de estudo',
		body: 'O OpenBible mantém seus estudos, sermões, notas e Bíblias em arquivos que você controla.'
	},
	storage: {
		eyebrow: 'Onde seus arquivos ficam',
		title: 'Escolha a pasta do OpenBible',
		body: 'A pasta escolhida será a raiz do seu workspace. O OpenBible não cria uma subpasta adicional.'
	},
	installing: {
		eyebrow: 'Preparando o workspace',
		title: 'Criando sua estrutura de arquivos',
		body: 'Estamos preparando as pastas e os arquivos iniciais. Nada é enviado para a internet.'
	},
	import: {
		eyebrow: 'Conteúdo inicial',
		title: 'Você já tem Bíblias SQLite?',
		body: 'Adicione arquivos compatíveis agora ou deixe essa etapa pendente para fazer depois.'
	},
	complete: {
		eyebrow: 'Tudo pronto',
		title: 'Seu workspace está preparado',
		body: 'A estrutura do OpenBible está pronta para receber seus estudos.'
	}
} as const;

export type OnboardingStep = keyof typeof onboardingCopy;
