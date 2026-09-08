<script lang="ts">
	import { authClient, setStoredAuthToken, setStoredAuthUser } from './auth-client';
	import { normalizeEmail, detectEmailTypo } from './email-suggestion';
	import { Button } from '$lib/components/ui/button/index.js';
	import { LogIn, UserPlus, AlertCircle, CheckCircle2, Sparkles } from '@lucide/svelte';

	interface Props {
		onsuccess?: () => void;
	}

	let { onsuccess }: Props = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	const emailTypo = $derived(detectEmailTypo(email));

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!email.trim() || !password.trim()) {
			errorMessage = 'Preencha todos os campos obrigatórios.';
			return;
		}

		if (emailTypo.isKnownTypo && emailTypo.suggestedEmail) {
			errorMessage = `O domínio do email parece conter um erro (${emailTypo.warning}). Corrija para continuar.`;
			return;
		}

		const normalizedEmail = normalizeEmail(email);

		if (mode === 'signup' && !name.trim()) {
			errorMessage = 'Informe seu nome para o cadastro.';
			return;
		}

		if (mode === 'signup' && password.length < 8) {
			errorMessage = 'A senha deve conter no mínimo 8 caracteres.';
			return;
		}

		loading = true;

		try {
			if (mode === 'signup') {
				const response = await authClient.signUp.email({
					name: name.trim(),
					email: normalizedEmail,
					password: password
				});

				if (response.error) {
					errorMessage = response.error.message || 'Erro ao realizar cadastro. Verifique se o email já existe.';
				} else {
					if (response.data?.token) {
						setStoredAuthToken(response.data.token);
					}
					if (response.data?.user) {
						setStoredAuthUser({
							id: response.data.user.id,
							name: response.data.user.name,
							email: response.data.user.email
						});
					}
					successMessage = 'Conta criada com sucesso! Conectando...';
					setTimeout(() => {
						onsuccess?.();
					}, 400);
				}
			} else {
				const response = await authClient.signIn.email({
					email: normalizedEmail,
					password: password
				});

				if (response.error) {
					errorMessage = response.error.message || 'Email ou senha incorretos.';
				} else {
					if (response.data?.token) {
						setStoredAuthToken(response.data.token);
					}
					if (response.data?.user) {
						setStoredAuthUser({
							id: response.data.user.id,
							name: response.data.user.name,
							email: response.data.user.email
						});
					}
					successMessage = 'Login realizado com sucesso!';
					setTimeout(() => {
						onsuccess?.();
					}, 400);
				}
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Falha na comunicação com o servidor de sincronização.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-card">
	<div class="auth-tabs" role="tablist" aria-label="Ações de conta">
		<button
			type="button"
			role="tab"
			aria-selected={mode === 'signin'}
			class="auth-tab"
			class:active={mode === 'signin'}
			onclick={() => {
				mode = 'signin';
				errorMessage = '';
				successMessage = '';
			}}
		>
			<LogIn size={15} aria-hidden="true" />
			<span>Entrar</span>
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={mode === 'signup'}
			class="auth-tab"
			class:active={mode === 'signup'}
			onclick={() => {
				mode = 'signup';
				errorMessage = '';
				successMessage = '';
			}}
		>
			<UserPlus size={15} aria-hidden="true" />
			<span>Criar conta</span>
		</button>
	</div>

	<form class="auth-form" onsubmit={handleSubmit}>
		{#if errorMessage}
			<div class="auth-alert error" role="alert">
				<AlertCircle size={16} aria-hidden="true" />
				<span>{errorMessage}</span>
			</div>
		{/if}

		{#if successMessage}
			<div class="auth-alert success" role="status">
				<CheckCircle2 size={16} aria-hidden="true" />
				<span>{successMessage}</span>
			</div>
		{/if}

		{#if mode === 'signup'}
			<div class="form-group">
				<label for="auth-name" class="form-label">Nome completo</label>
				<input
					id="auth-name"
					type="text"
					class="form-input"
					placeholder="Ex: Maria da Silva"
					bind:value={name}
					required
					autocomplete="name"
					disabled={loading}
				/>
			</div>
		{/if}

		<div class="form-group">
			<label for="auth-email" class="form-label">Email</label>
			<input
				id="auth-email"
				type="email"
				class="form-input"
				class:has-suggestion={Boolean(emailTypo.suggestedEmail)}
				placeholder="seu@email.com"
				bind:value={email}
				required
				autocomplete="email"
				disabled={loading}
			/>
			{#if emailTypo.suggestedEmail}
				<button
					type="button"
					class="email-suggestion-box"
					onclick={() => {
						if (emailTypo.suggestedEmail) email = emailTypo.suggestedEmail;
					}}
				>
					<Sparkles size={13} class="sparkle-icon" aria-hidden="true" />
					<span>Você quis dizer <strong>{emailTypo.suggestedEmail}</strong>? Clique para corrigir.</span>
				</button>
			{/if}
		</div>

		<div class="form-group">
			<label for="auth-password" class="form-label">
				Senha
				{#if mode === 'signup'}
					<span class="label-hint">(mínimo 8 caracteres)</span>
				{/if}
			</label>
			<input
				id="auth-password"
				type="password"
				class="form-input"
				placeholder="••••••••"
				bind:value={password}
				required
				autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
				disabled={loading}
			/>
		</div>

		<div class="form-actions">
			<Button type="submit" disabled={loading} class="w-full">
				{#if loading}
					<span>Carregando...</span>
				{:else if mode === 'signup'}
					<span>Criar conta</span>
				{:else}
					<span>Entrar</span>
				{/if}
			</Button>
		</div>

		<p class="auth-note">
			O OpenBible é 100% offline-first. A conta serve apenas para sincronizar seus dados
			entre seus próprios dispositivos com privacidade e controle total.
		</p>
	</form>
</div>

<style>
	.auth-card {
		border: 1px solid var(--border, #e5e7eb);
		background: var(--background, #ffffff);
		border-radius: 8px;
		overflow: hidden;
		max-width: 440px;
		width: 100%;
		font-family: inherit;
	}

	.auth-tabs {
		display: flex;
		border-bottom: 1px solid var(--border, #e5e7eb);
		background: var(--muted, #f9fafb);
	}

	.auth-tab {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted-foreground, #6b7280);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.auth-tab:hover {
		color: var(--foreground, #111827);
	}

	.auth-tab.active {
		color: var(--foreground, #111827);
		border-bottom-color: var(--foreground, #111827);
		background: var(--background, #ffffff);
	}

	.auth-form {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.auth-alert {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	.auth-alert.error {
		background: var(--destructive-subtle, #fef2f2);
		border: 1px solid var(--destructive-border, #fecaca);
		color: var(--destructive, #b91c1c);
	}

	.auth-alert.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground, #111827);
	}

	.label-hint {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--muted-foreground, #6b7280);
	}

	.form-input {
		height: 36px;
		padding: 0 12px;
		border-radius: 6px;
		border: 1px solid var(--input, #d1d5db);
		background: var(--background, #ffffff);
		color: var(--foreground, #111827);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.form-input:focus-visible {
		border-color: var(--foreground, #111827);
		box-shadow: 0 0 0 1px var(--foreground, #111827);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-input.has-suggestion {
		border-color: #f59e0b;
	}

	.email-suggestion-box {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: #fffbeb;
		border: 1px solid #fde68a;
		border-radius: 6px;
		color: #b45309;
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.email-suggestion-box:hover {
		background: #fef3c7;
	}

	.email-suggestion-box strong {
		color: #92400e;
		text-decoration: underline;
	}

	.form-actions {
		margin-top: 4px;
	}

	.auth-note {
		font-size: 0.75rem;
		color: var(--muted-foreground, #6b7280);
		line-height: 1.4;
		text-align: center;
		margin: 0;
	}
</style>
