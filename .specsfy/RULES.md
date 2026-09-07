# Regras do sistema

Estas regras complementam as instruções dos agentes sem substituir specs ou
critérios de aceite. Modelo inicial reconciliado com SvelteKit, Svelte e os
manifests dos workspaces.

## Arquitetura

- Manter o backend operacional como fonte primária das notas (SQLite `app.sqlite` no Tauri e IndexedDB no PWA); Markdown com YAML frontmatter é exportação derivada e formato de recuperação legado. Sermões e estudos preservam seus formatos portáteis conforme suas specs.

- Gravar tema, tela inicial e última leitura em `.openbible/preferences.json` no workspace; o `localStorage` é cache de primeiro paint, não a fonte File Over Apps.
- No desktop Tauri, a pasta escolhida pela pessoa é a raiz única de dados Files Over App; `localStorage` pode guardar somente o ponteiro do caminho para reabrir o workspace, nunca notas, configurações ou bancos fora dessa pasta.

- Na SPEC-0016, o registro operacional de workspaces vive em um único `app.sqlite` por instalação Tauri e em um IndexedDB versionado por origem no PWA; toda operação é escopada por `workspaceId`. O SQLite bíblico WASM continua somente leitura, e a fonte legada só é usada para migração/recovery.

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

## Workspaces

- O backend normativo é SQLite no Tauri e IndexedDB no PWA; o catálogo local é apenas uma projeção de reencontro e não pode substituir os registros do banco.

- Markdown e PDF são formatos de exportação das notas; o parser/exportador é uma fatia posterior e não deve ser confundido com a persistência do registro de workspace.

- Manter no máximo uma referência local por workspaceId no catálogo; colisão de ID se resolve atualizando a localização existente ou criando cópia independente com novo ID.

- Remover da lista nunca apaga arquivos; excluir workspace exige raiz dedicada com marcador gerenciado comprovado e bloqueia sem opção de forçar em qualquer dúvida.

## Sincronização

- Na SPEC-0019, a sincronização entre dispositivos é opt-in por workspace e por dispositivo; sem configuração explícita, o app permanece somente local. As notas e o estado operacional continuam persistidos no app.sqlite no Tauri ou no IndexedDB versionado no PWA, sempre escopados por workspaceId. Nenhum relay é obrigatório; quando houver endpoint WebSocket, ele deve usar transporte seguro, autenticação configurada e permitir revogação.
