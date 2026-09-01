# Regras do sistema

Estas regras complementam as instruções dos agentes sem substituir specs ou
critérios de aceite. Modelo inicial reconciliado com SvelteKit, Svelte e os
manifests dos workspaces.

## Arquitetura

- Manter Markdown com YAML frontmatter como fonte primária dos sermões, estudos e notas; usar SQLite local apenas para índices, destaques e dados auxiliares.

- Gravar tema, tela inicial e última leitura em `.openbible/preferences.json` no workspace; o `localStorage` é cache de primeiro paint, não a fonte File Over Apps.

- Revalidar a permissão da pasta local após reload e pedir `navigator.storage.persist()` no origin para reduzir eviction do OPFS e do IndexedDB.

- Manter a aplicação executável via `localhost` e hospedável na Cloudflare como PWA mobile, usando APIs web para importação de arquivos SQLite e acesso a URLs de bancos bíblicos.

- Manter o app shell PWA e as rotas locais já carregadas utilizáveis sem rede por meio do service worker, sem prometer sincronização remota de conteúdo.

## Código e qualidade

- Manter a interface do produto em SvelteKit e Svelte, usando shadcn-svelte como base de primitives; não introduzir React, shadcn/ui ou ReUI sem decisão explícita registrada.

- Aplicar `https://vercel.com/design.md` como guideline de qualidade para todas
  as interfaces: Geist Sans/Mono, hierarquia tipográfica, superfícies contínuas,
  transparência antes da interação, hover/foco semântico, contraste, reflow e
  acessibilidade. Não importar a marca ou o shell da Vercel.

## Testes

- Usar Vitest para testes unitários e de componentes, seguindo as práticas documentadas pelo Svelte.

## Segurança e privacidade

- Não exigir autenticação no MVP; o uso será individual e sem conta.

## Operação

- Preparar a hospedagem na Cloudflare usando o adapter oficial do SvelteKit e seguir a orientação de observabilidade documentada pelo SvelteKit; deixar o empacotamento desktop com Tauri para uma etapa posterior.

- Separar planejamento e implementação em dois agentes Cursor: `specsfy-planner` conduz o Specsfy até o Plan Gate; `specsfy-implementer` executa a seção 14 com Composer 2.5 ou GPT-5.6 Luna em xhigh. Registrar no ai-memory local decisões, gotchas e handoffs materiais.

## Regras específicas do projeto

- Aceitar bancos bíblicos SQLite importados por arrastar e soltar quando compatíveis com o padrão do OpenLP, ou acessados por URL de distribuição como Cloudflare R2.
