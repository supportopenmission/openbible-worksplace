const WORKSPACE_STARTUP_SCREEN_KEY = 'openbible:workspace-startup-screen';
export const WORKSPACE_STARTUP_SCREEN_EVENT = 'openbible:workspace-startup-screen';

/**
 * A tela de escolha é útil no desktop, mas não deve prender quem prefere abrir
 * diretamente no último workspace. O padrão é mostrar: a primeira execução
 * sempre deixa a pessoa decidir explicitamente.
 */
export function readWorkspaceStartupScreen(): boolean {
	try {
		return localStorage.getItem(WORKSPACE_STARTUP_SCREEN_KEY) !== 'hidden';
	} catch {
		return true;
	}
}

export function saveWorkspaceStartupScreen(show: boolean): void {
	try {
		localStorage.setItem(WORKSPACE_STARTUP_SCREEN_KEY, show ? 'shown' : 'hidden');
	} catch {
		// O padrão seguro continua sendo mostrar a tela nesta sessão.
	}
}

export function requestWorkspaceStartupScreen(): void {
	try {
		window.dispatchEvent(new CustomEvent(WORKSPACE_STARTUP_SCREEN_EVENT));
	} catch {
		// Sem window (SSR/testes): não há tela para abrir.
	}
}
