<script lang="ts">
	import { KeyRound, ShieldAlert, Sparkles, WifiOff } from '@lucide/svelte';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { isTauriRuntime } from '$lib/storage/tauri-runtime';
	import { invokeWorkspaceCommand, TauriCommandError } from '$lib/storage/tauri-bridge';

	export type AgentCapability = 'tauri' | 'pwa' | 'unavailable';

	interface AgentCapabilityPanelProps {
		capability?: AgentCapability;
	}

	const { capability = isTauriRuntime() ? 'tauri' : 'unavailable' }: AgentCapabilityPanelProps =
		$props();

	let profileName = $state('Assistência local');
	let provider = $state('openai');
	let model = $state('gpt-5');
	let endpoint = $state('');
	let secret = $state('');
	let secretRef = $state<string | null>(null);
	let saving = $state(false);
	let testing = $state(false);
	let revoking = $state(false);
	let message = $state('');
	let error = $state('');

	const capabilityTitle = $derived(
		capability === 'tauri'
			? 'Assistência segura neste computador'
			: capability === 'pwa'
				? 'Assistência temporária no navegador'
				: 'Assistência indisponível'
	);
	const capabilityDescription = $derived(
		capability === 'tauri'
			? 'Sua credencial fica protegida no sistema. Seus dados de estudo recebem apenas as configurações necessárias.'
			: capability === 'pwa'
				? 'O navegador usa uma sessão temporária e segura. Para começar, configure uma conexão confiável.'
				: 'Este dispositivo ainda não oferece uma forma segura de configurar a assistência.'
	);
	const isConfigured = $derived(secretRef !== null);

	function clearFeedback() {
		message = '';
		error = '';
	}

	function errorMessage(value: unknown): string {
		if (value instanceof TauriCommandError) return value.message;
		return 'Não foi possível concluir a operação. Tente novamente.';
	}

	async function saveProfile(event: SubmitEvent) {
		event.preventDefault();
		clearFeedback();
		if (capability !== 'tauri') {
			error = 'Configure a assistência em um dispositivo com armazenamento seguro.';
			return;
		}
		if (!profileName.trim() || !provider.trim() || !model.trim() || !secret.trim()) {
			error = 'Informe nome, provedor, modelo e credencial para continuar.';
			return;
		}

		saving = true;
		try {
			const result = await invokeWorkspaceCommand<{
				secretRef?: unknown;
				state?: unknown;
			}>({
				name: 'agent.profile.save',
				profileId: 'profile-default',
				provider: provider.trim(),
				model: model.trim(),
				endpoint: endpoint.trim() || undefined,
				secret
			});
			const returnedSecretRef =
				result.value && typeof result.value.secretRef === 'string' ? result.value.secretRef : null;
			secretRef = returnedSecretRef;
			secret = '';
			message = 'Configuração salva com segurança. A credencial foi removida do formulário.';
		} catch (failure) {
			error = errorMessage(failure);
		} finally {
			saving = false;
		}
	}

	async function testCapability() {
		clearFeedback();
		testing = true;
		try {
			const result = await invokeWorkspaceCommand<{ available?: unknown }>({
				name: 'agent.profile.capability'
			});
			message = result.value?.available
				? 'O armazenamento seguro está disponível neste dispositivo.'
				: 'O armazenamento seguro não está disponível. A assistência permanece bloqueada.';
		} catch (failure) {
			error = errorMessage(failure);
		} finally {
			testing = false;
		}
	}

	async function revokeProfile() {
		if (!secretRef) return;
		clearFeedback();
		revoking = true;
		try {
			await invokeWorkspaceCommand({
				name: 'agent.profile.revoke',
				profileId: 'profile-default',
				secretRef
			});
			secretRef = null;
			message = 'Credencial revogada. Nenhum arquivo dos seus estudos foi alterado.';
		} catch (failure) {
			error = errorMessage(failure);
		} finally {
			revoking = false;
		}
	}
</script>

<section class="agent-capability-panel" aria-labelledby="agent-capability-title">
	<PageHeader
		eyebrow="Configurações / Assistência"
		title="Assistência"
		description="Configure uma assistência segura para consultar seus estudos sem incluir sua credencial nos dados exportados."
	/>

	<div class="capability-status" data-capability={capability} role="status" aria-live="polite">
		<div class="status-icon" aria-hidden="true">
			{#if capability === 'tauri'}
				<KeyRound size={18} strokeWidth={1.8} />
			{:else if capability === 'pwa'}
				<Sparkles size={18} strokeWidth={1.8} />
			{:else}
				<WifiOff size={18} strokeWidth={1.8} />
			{/if}
		</div>
		<div class="status-copy">
			<strong id="agent-capability-title">{capabilityTitle}</strong>
			<p>{capabilityDescription}</p>
		</div>
	</div>

	{#if capability === 'tauri'}
		<form class="agent-form" onsubmit={saveProfile}>
			<div class="form-heading">
				<div>
					<p class="section-eyebrow">Perfil do dispositivo</p>
					<h2>Escolher provedor de IA</h2>
				</div>
				{#if isConfigured}
					<span class="configured-state">Configurado</span>
				{/if}
			</div>
			<p class="form-description">
				A credencial é enviada somente ao armazenamento seguro e nunca aparece nos seus estudos,
				cópias, sincronização ou diagnóstico.
			</p>

			<div class="field-grid">
				<label class="field">
					<span>Nome do perfil</span>
					<input bind:value={profileName} autocomplete="off" />
				</label>
				<label class="field">
					<span>Provedor</span>
					<input bind:value={provider} autocomplete="off" />
				</label>
				<label class="field">
					<span>Modelo</span>
					<input bind:value={model} autocomplete="off" />
				</label>
				<label class="field">
					<span>Endereço do serviço <small>(opcional)</small></span>
					<input bind:value={endpoint} type="url" autocomplete="url" placeholder="https://..." />
				</label>
				<label class="field field-wide">
					<span>Chave da API</span>
					<input
						bind:value={secret}
						type="password"
						autocomplete="new-password"
						aria-describedby="agent-secret-help"
					/>
					<small id="agent-secret-help"
						>Usada apenas para conectar o serviço; não será salva nos seus estudos.</small
					>
				</label>
			</div>

			<div class="agent-actions">
				<Button type="submit" disabled={saving}>
					<KeyRound data-icon="inline-start" size={15} strokeWidth={1.8} aria-hidden="true" />
					{saving ? 'Salvando...' : 'Salvar configuração'}
				</Button>
				<Button type="button" variant="outline" onclick={testCapability} disabled={testing}>
					{testing ? 'Verificando...' : 'Testar disponibilidade'}
				</Button>
				{#if isConfigured}
					<Button type="button" variant="ghost" onclick={revokeProfile} disabled={revoking}>
						{revoking ? 'Revogando...' : 'Revogar credencial'}
					</Button>
				{/if}
			</div>
		</form>
	{:else if capability === 'pwa'}
		<section class="capability-message" aria-labelledby="agent-gateway-title">
			<div class="message-icon" aria-hidden="true"><Sparkles size={18} strokeWidth={1.8} /></div>
			<div>
				<h2 id="agent-gateway-title">Conexão segura necessária</h2>
				<p>Para usar a assistência no navegador, configure uma conexão HTTPS confiável.</p>
			</div>
		</section>
	{:else}
		<section class="capability-message" aria-labelledby="agent-unavailable-title">
			<div class="message-icon" aria-hidden="true"><ShieldAlert size={18} strokeWidth={1.8} /></div>
			<div>
				<h2 id="agent-unavailable-title">Nenhuma forma de assistência disponível</h2>
				<p>
					Leitura, edição, exportação e sincronização local continuam disponíveis neste dispositivo.
				</p>
			</div>
		</section>
	{/if}

	{#if message}
		<p class="feedback" role="status">{message}</p>
	{/if}
	{#if error}
		<p class="feedback error" role="alert">{error}</p>
	{/if}
</section>

<style>
	.agent-capability-panel {
		display: grid;
		gap: 24px;
		color: var(--foreground);
	}

	.capability-status,
	.capability-message {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		border: 1px solid var(--border);
		padding: 16px;
	}

	.capability-status[data-capability='tauri'] {
		border-color: color-mix(in oklch, var(--foreground) 28%, var(--border));
	}

	.capability-status[data-capability='unavailable'] {
		border-color: color-mix(in oklch, var(--destructive) 38%, var(--border));
	}

	.status-icon,
	.message-icon {
		display: grid;
		flex: 0 0 auto;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 1px solid var(--border);
		color: var(--muted-foreground);
	}

	.status-copy,
	.capability-message > div:last-child {
		min-width: 0;
	}

	.status-copy strong,
	.capability-message h2 {
		display: block;
		margin: 0;
		font-size: 0.95rem;
		font-weight: 650;
	}

	.status-copy p,
	.capability-message p,
	.form-description,
	.field small {
		margin: 6px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.55;
	}

	.agent-form {
		display: grid;
		gap: 20px;
		border-block: 1px solid var(--border);
		padding-block: 20px;
	}

	.form-heading,
	.agent-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.section-eyebrow {
		margin: 0 0 4px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.configured-state {
		border: 1px solid var(--border);
		padding: 5px 8px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}

	.field {
		display: grid;
		gap: 6px;
		min-width: 0;
		font-size: 0.82rem;
		font-weight: 550;
	}

	.field-wide {
		grid-column: 1 / -1;
	}

	.field input {
		width: 100%;
		min-height: 36px;
		border: 1px solid var(--input);
		border-radius: 8px;
		background: var(--background);
		padding: 7px 10px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.84rem;
	}

	.field input:focus-visible {
		border-color: var(--ring);
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.field input::placeholder {
		color: var(--muted-foreground);
	}

	.agent-actions {
		justify-content: flex-start;
	}

	.feedback {
		margin: 0;
		color: var(--foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.feedback.error {
		color: var(--destructive);
	}

	@media (max-width: 640px) {
		.field-grid {
			grid-template-columns: 1fr;
		}

		.field-wide {
			grid-column: auto;
		}

		.agent-actions :global(button) {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.agent-capability-panel * {
			transition: none;
		}
	}
</style>
