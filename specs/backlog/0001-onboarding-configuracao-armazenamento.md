# Backlog: Onboarding de configuração e armazenamento

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0001 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Fundação do espaço de trabalho |
| Funcionalidade | Onboarding de configuração e armazenamento |
| Tipo | Funcionalidade |
| Prioridade | Alta, primeira feature do produto |
| Milestones | |
| Criado em | 2026-08-31 |
| Spec promovida | `specs/defined/0001-onboarding-configuracao-armazenamento/spec.md` |

## Ideia original

Criar um onboarding que configure os arquivos do OpenBible, escolhendo uma pasta no desktop/localhost/Tauri ou usando OPFS no PWA, criando a estrutura Files over app e permitindo importar Bíblias SQLite agora ou depois.

## Problema percebido

O aplicativo ainda não orienta a pessoa a configurar o diretório de dados nem oferece um caminho inicial para importar Bíblias.

## Pessoa afetada ou beneficiada

A pessoa usuária individual do OpenBible em localhost, PWA ou futuro desktop Tauri.

## Resultado ou valor esperado

Ao concluir o onboarding, a estrutura Files over app está criada no armazenamento adequado, com progresso visível, e a pessoa pode importar Bíblias agora ou deixar essa etapa pendente.

## Contexto

Primeira feature do produto, que ainda é um starter SvelteKit sem rotas de produto, componentes de onboarding, persistência ou integração Tauri. A captura original está em specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md. O fluxo envolve modal, seleção de pasta, criação de diretórios/arquivos, barra de progresso, upload por seleção ou arrastar/soltar e navegação para a rota inicial.

## Referências relacionadas

- `specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md` — captura de origem.
- `PROJECT.md` — documentação relacionada: plataforma e finalidade do produto.
- `.specsfy/STACK.md` — documentação relacionada: SvelteKit/Svelte e ausência de Tauri implementado.
- `.specsfy/RULES.md` — documentação relacionada: execução via localhost/PWA e importação de SQLite.
- `INTERFACE.md` — documentação relacionada: base de interface Svelte sem primitives configuradas.

## Comportamento esperado

- Em `apps/web`, o onboarding abre como modal na rota inicial quando não há configuração reconhecida.
- Em localhost, a pessoa escolhe um diretório pelo diálogo de diretório do navegador; em PWA/hospedado, a configuração usa OPFS sem pedir diretório local.
- Após confirmação, o sistema cria a estrutura Files over app e informa o progresso da operação.
- Após configurar o armazenamento, a pessoa escolhe importar Bíblias SQLite agora ou deixar a importação pendente e seguir para `/`.

## Regras de negócio

- A primeira entrega cobre a aplicação web atual; a integração Tauri fica fora desta feature.
- A estrutura criada deve ser idempotente e preservar arquivos existentes quando o diretório já contiver parte dela.
- Bíblias importadas ficam em `bibles/`; a importação deve aceitar seleção de arquivos e arrastar/soltar.
- O app é individual e sem autenticação, conforme as regras do projeto.

## Critérios de aceitação

- Dado que a aplicação web não encontra uma configuração, quando a pessoa avança pelo onboarding, então vê o modo de armazenamento aplicável e confirma a criação da estrutura.
- Dado que a pessoa confirma um diretório em localhost, quando a configuração termina, então a raiz escolhida contém a estrutura declarada, os artefatos `.openbible/` e templates mínimos, com progresso visível.
- Dado que a pessoa usa PWA/hospedado, quando confirma a configuração, então a mesma estrutura é criada no OPFS sem solicitar uma pasta do sistema.
- Dado que a pessoa seleciona Bíblias, quando arquivos válidos, inválidos e duplicados são processados, então os válidos são copiados para `bibles/`, os demais são rejeitados com motivo e nenhum existente é sobrescrito.
- Dado que a pessoa não quer importar agora, quando escolhe fazer depois, então o estado fica pendente e a pessoa segue para `/`.
- Dado que a configuração já existe, quando a pessoa retorna ao app, então o onboarding não reaparece e o projeto abre diretamente.

## Qualidades e operação

- Segurança: a operação usa apenas o diretório/OPFS escolhido pela pessoa e não envia arquivos para servidor.
- Privacidade: dados locais permanecem no armazenamento escolhido; nenhuma conta é necessária.
- Desempenho e volume: a avaliar para criação da estrutura e cópia de SQLite; não há limite artificial nesta fatia e o feedback deve permanecer ativo durante operações assíncronas.
- Auditoria e observabilidade: feedback visual de progresso, sucesso e erro; logs remotos não fazem parte do escopo.

## Dependências

- File System Access API para seleção de diretório em localhost, com fallback de erro quando indisponível ou negada.
- Origin Private File System (OPFS) para PWA/hospedado.
- Browser APIs de File/Directory para seleção e arrastar/soltar de SQLite.
- Vitest e testes de componentes/browser existentes no app web.

## Situações de erro

- Permissão de diretório negada ou diálogo cancelado.
- File System Access API indisponível no ambiente localhost.
- Falha ao criar diretório ou arquivo.
- Arquivo SQLite inválido, não suportado ou duplicado.
- Falha parcial durante importação ou cópia.

## Escopo

- Dentro: modal de onboarding na aplicação web; seleção de diretório em localhost; armazenamento OPFS em PWA/hospedado; criação idempotente da estrutura e artefatos; progresso; importação de SQLite por arquivo ou drag-and-drop; estado pendente; navegação para `/`.
- Fora: integração Tauri; sincronização remota; autenticação; leitor bíblico; schema funcional de índices além do necessário para criar o artefato inicial; download de Bíblias por URL.

## Dúvidas, decisões e riscos

- Decisão D-001: entregar somente `apps/web`; localhost usa File System Access API, PWA/hospedado usa OPFS. Confirmada na conversa em 2026-08-31.
- Decisão D-002: criar `config.json` e `sync.json` com conteúdo mínimo e `index.sqlite` vazio; schema funcional de índices fica para outra feature. Confirmada na conversa em 2026-08-31.
- Decisão D-003: validar cada SQLite, rejeitar inválidos e duplicados sem sobrescrever, informar o motivo e continuar com os válidos; falha parcial fica visível. Confirmada na conversa em 2026-08-31.
- Decisão D-004: lembrar o armazenamento escolhido entre visitas, abrir diretamente `/` e manter o estado de Bíblias pendente até importação concluída ou parcial. Confirmada na conversa em 2026-08-31 e registrada em `.specsfy/DATABASE.md`.
- Decisão D-005: a pasta selecionada já é a raiz do workspace; nenhuma subpasta `OpenBible` adicional é criada. No OPFS, a raiz da origem representa o workspace. Confirmada na conversa em 2026-08-31.
- Decisão D-006: criar `sermon.md`, `study.md` e `note.md` com frontmatter Markdown mínimo (`title`, `createdAt`, `updatedAt`, `type`) e corpo inicial curto. Confirmada na conversa em 2026-08-31.
- Nenhuma lacuna aplicável para a primeira fatia. Limites de tamanho específicos e schema funcional de `index.sqlite` permanecem fora do escopo, usando as limitações do navegador e do dispositivo.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Spec criada em `specs/defined/0001-onboarding-configuracao-armazenamento/spec.md`; continuar com `$specsfy-05-tasks`.
