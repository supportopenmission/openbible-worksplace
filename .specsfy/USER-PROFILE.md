# Perfil de interação do Specsfy

Este arquivo guarda somente o nível de conhecimento e as respostas confirmadas
durante o setup. Ele orienta a forma da conversa e não substitui `PROJECT.md`,
`STACK.md`, `RULES.md`, `DATABASE.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD` ou uma
spec.

## Nível de conhecimento

| Campo | Valor |
| --- | --- |
| Nível atual | intermediário |
| Fonte da confirmação | Conversa atual, resposta à Pergunta 1 do setup |
| Última confirmação | 2026-08-31 |

Valores permitidos: `iniciante`, `intermediário` e `experiente`.

## Respostas confirmadas

Registre somente respostas dadas pela pessoa ou declarações inequívocas já
presentes nas fontes lidas. Não registre segredos, tokens, senhas ou dados de
produção.

| Área | Pergunta ou assunto | Resposta normalizada | Fonte | Confirmado em |
| --- | --- | --- | --- | --- |
| Setup | Preferência de orientação | intermediário | Conversa atual, resposta à Pergunta 1 | 2026-08-31 |
| Produto | Objetivo principal | Estudos e elaboração de estudos bíblicos | Conversa atual, resposta à Pergunta 1 do setup | 2026-08-31 |
| Produto | Pessoas usuárias e papéis | Uso individual: uma pessoa cria, organiza e consulta os próprios estudos bíblicos | Conversa atual, resposta à Pergunta 2 do setup | 2026-08-31 |
| Acesso | Autenticação | Sem conta; uso local sem login | Conversa atual, resposta à Pergunta 3 do setup | 2026-08-31 |
| Domínio | Dados principais | Estudos estruturados, construtor de sermões inspirado em Sermonary/Logos Sermon Builder e notas simples | Conversa atual, resposta à Pergunta 4 do setup | 2026-08-31 |
| Interface | Jornada inicial | Biblioteca, editor/construtor de sermões e leitor da Bíblia | Conversa atual, resposta à Pergunta 5 do setup | 2026-08-31 |
| Persistência | Fonte dos dados | Markdown com YAML frontmatter para sermões e notas; SQLite local para índices, destaques e dados auxiliares | Conversa atual, resposta à Pergunta 6 do setup | 2026-08-31 |
| Integração | Fonte bíblica | Usuário importa SQLite compatível com o padrão do OpenLP por arrastar e soltar, ou informa URL estilo Cloudflare R2 para acessar os SQLite | Conversa atual, resposta à Pergunta 7 do setup | 2026-08-31 |
| Operação | Plataforma inicial | Executar localmente via `localhost` ou hospedado na Cloudflare como PWA para mobile; empacotar para desktop com Tauri posteriormente | Conversa atual, resposta à Pergunta 8 do setup e complemento posterior | 2026-08-31 |
| Interface | Primitives de UI | Usar shadcn-svelte como base de componentes | Conversa atual; https://github.com/huntabyte/shadcn-svelte | 2026-08-31 |
| Persistência | Nome do SQLite do workspace | Manter `.openbible/index.sqlite` como banco auxiliar de índices; não adotar `app.sqlite` ou `openbible.sqlite` nesta etapa | Conversa atual, resposta à Pergunta 1 sobre nome do SQLite | 2026-08-31 |
| Operação | Testes, observabilidade e deploy | Vitest para testes unitários e de componentes conforme a documentação do Svelte; observabilidade conforme a documentação do SvelteKit; hospedagem PWA na Cloudflare com o adapter oficial | Conversa atual, resposta à Pergunta 9 do setup e complemento posterior; https://svelte.dev/docs/svelte/testing#Unit-and-component-tests-with-Vitest; https://svelte.dev/docs/kit/observability; https://svelte.dev/docs/kit/adapter-cloudflare | 2026-08-31 |
| Operação | Agentes Cursor | Planejador Specsfy (`specsfy-planner`) arquiteta e especifica; implementador (`specsfy-implementer`) usa Composer 2.5 ou GPT-5.6 Luna em xhigh; ambos registram no ai-memory local quando necessário | Conversa atual, pedido explícito de configuração dos dois agentes | 2026-09-01 |
| Plataforma nativa | Migração OPFS | Migração assistida opcional para pasta nativa, preservando o workspace web original | Conversa atual, resposta à Pergunta 1 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Workspace padrão | `~/Library/Application Support/OpenBible/workspace`, com opção de escolher outra pasta | Conversa atual, resposta à Pergunta 2 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Alvo macOS | macOS 13 Ventura ou mais recente, binário universal Intel + Apple Silicon | Conversa atual, resposta à Pergunta 3 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Compartilhamento de UI | Reutilizar `apps/web` e selecionar storage web/Tauri em runtime | Conversa atual, resposta à Pergunta 4 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Contrato Tauri | Facade tipada de comandos com capabilities allowlist; sem caminho arbitrário ou SQL livre na UI | Conversa atual, resposta à Pergunta 5 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Paridade inicial | Cobrir onboarding e todas as rotas/fluxos web publicados (`/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study`, `/config`) | Conversa atual, resposta à Pergunta 6 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Distribuição inicial | Build local e artefato CI testável sem assinatura/notarização; distribuição pública posterior | Conversa atual, resposta à Pergunta 7 do backlog BACKLOG-0014 | 2026-09-04 |
| Plataforma nativa | Concorrência | Uso exclusivo de um workspace por vez, com lock/sinalização e orientação à pessoa | Conversa atual, resposta à Pergunta 8 do backlog BACKLOG-0014 | 2026-09-04 |

## Uso pelo setup

- Antes de perguntar, leia este arquivo, a conversa atual e os contextos do
  projeto disponíveis.
- Uma resposta já registrada ou explicitamente declarada em outra fonte não
  volta a ser perguntada.
- Se fontes divergirem, pergunte apenas para resolver a divergência e registre
  a nova fonte e o alcance da resposta.
