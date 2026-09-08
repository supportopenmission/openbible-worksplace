# Evidência de pesquisa: better-auth, Svelte CLI e Cloudflare D1 com Drizzle

## Identificação

- **Fonte**: Documentação oficial do Svelte CLI (https://svelte.dev/docs/cli/better-auth) e Better Auth (https://www.better-auth.com/docs).
- **Data da consulta**: 2026-09-08
- **Objetivo**: Avaliar integração do better-auth com SvelteKit, Drizzle ORM e Cloudflare D1.

## Evidências coletadas

### better-auth com SvelteKit e Drizzle
- **Locator**: #better-auth-sveltekit-drizzle
- **Conteúdo**: O comando `npx sv add better-auth` configura autenticação completa no SvelteKit com Drizzle ORM como adapter de banco de dados, habilitando autenticação por email/senha por padrão e gerando schemas de tabelas compatíveis.
- **Veredito**: Verified.
- **Confiança**: High.
- **Impacto no OpenBible**: O servidor SvelteKit dedicado (`apps/sync-server`) pode utilizar a integração nativa com Drizzle D1 para persistir contas, sessões e verificações no mesmo banco Cloudflare D1 usado pela sincronização.

### Cloudflare D1 com Drizzle ORM no SvelteKit
- **Locator**: #d1-drizzle-sveltekit
- **Conteúdo**: O driver D1 do Drizzle (`drizzle-orm/d1`) consome o binding de banco de dados `env.DB` injetado pelo Cloudflare Workers/Pages no objeto `platform.env` do SvelteKit via `@sveltejs/adapter-cloudflare`.
- **Veredito**: Verified.
- **Confiança**: High.
- **Impacto no OpenBible**: O servidor SvelteKit dedicado executará no runtime Cloudflare Workers utilizando o banco D1 `openbible-sync`, isolando auth e sync com custo zero inicial.

### Autenticação em clientes multiplataforma (PWA e Tauri)
- **Locator**: #better-auth-client-multiplataforma
- **Conteúdo**: Better Auth expõe cliente TypeScript (`createAuthClient`) com suporte a cookies HttpOnly em navegadores e tokens de sessão via header `Authorization: Bearer <token>`, permitindo uso consistente tanto no PWA quanto no ambiente desktop Tauri.
- **Veredito**: Verified.
- **Confiança**: High.
- **Impacto no OpenBible**: O cliente `apps/web` consome a API de autenticação pelo cliente Better Auth e inclui o token nas chamadas aos endpoints de sincronização `/v1/workspaces/:workspaceId/sync/*`.
