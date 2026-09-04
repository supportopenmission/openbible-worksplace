# Backlog: Versão nativa macOS com Tauri

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0014 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Distribuição nativa do OpenBible |
| Funcionalidade | Shell Tauri macOS com workspace nativo e SQLite direto |
| Tipo | Funcionalidade técnica |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-04 |
| Spec promovida | `specs/draft/0014-versao-nativa-macos-tauri/spec.md` |

## Ideia original

Precisamos implementar um app que será a versao nativa do app, iremos usar o tauri, vamos começar com a build de macos, a ideia é termos o a interface como temos no web, só que ao inves de usar o OPFS iremos usar a pasta nativa do computador. E o sqlite será acessado diretamente do tauri. usando specsfy vamos planejar e vamos até o passo 6, o implemente depois vamos para o implemente.

## Problema percebido

O app web usa OPFS e sql.js no runtime; a versão desktop precisa persistir o workspace em uma pasta nativa do macOS e acessar o SQLite por uma camada Tauri, mantendo a experiência existente.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do OpenBible que usa macOS para ler a Bíblia, manter notas, estudos e sermões.

## Resultado ou valor esperado

Uma aplicação Tauri para macOS que abre a interface Svelte existente, usa uma pasta nativa para Markdown/JSON/SQLite e mantém paridade funcional com o app web no escopo definido.

## Contexto

Item técnico/de produto complementar às specs web já concluídas e em andamento. A primeira plataforma nativa é macOS; a interface deve ser compartilhada com apps/web. Substitui OPFS e o acesso SQLite em JavaScript apenas no runtime Tauri; build e distribuição cross-platform ficam fora da primeira fatia. Origem: specs/inbox/2026-09-04-164740-versao-nativa-macos-com-tauri-e-armazenamento-local.md. Referências relacionadas: PROJECT.md e .specsfy/STACK.md (Tauri anteriormente planejado); .specsfy/DATABASE.md e specs/completed/0003-leitor-biblia-sqlite/spec.md (SQLite/estrutura existentes); specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md e specs/completed/0010-melhorar-experiencia-do-pwa/spec.md (storage e shell). Lacunas para descoberta: alvo mínimo do macOS/arquiteturas, migração OPFS, diretório/seleção de workspace, API e permissões Tauri, paridade de telas, assinatura/notarização e observabilidade.

## Referências relacionadas

- `specs/inbox/2026-09-04-164740-versao-nativa-macos-com-tauri-e-armazenamento-local.md` — origem da captura.
- `PROJECT.md` — finalidade, limites, rotas e persistência atuais; registra Tauri como etapa posterior.
- `.specsfy/STACK.md` — stack SvelteKit/Tauri planejado e decisões tecnológicas existentes.
- `.specsfy/DATABASE.md` — `.openbible/index.sqlite`, `bibles/*.sqlite`, notas Markdown e preferências.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — onboarding e escolha de storage.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — leitor e acesso aos bancos OpenLP.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — notas File Over Apps e índice SQLite.
- `specs/completed/0010-melhorar-experiencia-do-pwa/spec.md` — shell, PWA e limites de empacotamento.
- `specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md` — rotas, navegação e estados atuais.
- `.specsfy/DATABASE.md` — registro confirmado da configuração do workspace nativo e estado da migração.

## Comportamento esperado

- A pessoa instala/executa uma aplicação Tauri para macOS 13 Ventura ou mais recente, distribuída como binário universal Intel + Apple Silicon.
- A aplicação carrega a mesma interface de `apps/web` e preserva onboarding, shell e rotas `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study` e `/config`.
- No runtime Tauri, a camada de armazenamento troca OPFS/APIs web por uma pasta nativa. O padrão é `~/Library/Application Support/OpenBible/workspace`, com opção de escolher outra pasta.
- Se houver workspace no OPFS/PWA, a primeira abertura oferece migração assistida opcional para uma pasta nativa; o original não é alterado.
- O frontend chama uma facade tipada de comandos Tauri. Capabilities allowlist restringem arquivos e SQLite ao workspace; não há caminho arbitrário nem SQL livre enviado pela UI.
- O workspace mantém Markdown/JSON e os SQLite existentes, incluindo `.openbible/index.sqlite` e `bibles/*.sqlite`, sem alterar o contrato File Over Apps.
- O uso é exclusivo por vez. Um lock/sinalização impede abrir a mesma pasta em outra instância e informa como fechar a instância concorrente.
- A configuração persistida registra pasta, tipo de armazenamento, versão do formato e estado da migração (`não iniciada`, `concluída` ou `com erro`).

## Regras de negócio

- macOS 13+ e binário universal são o alvo da primeira build.
- A UI e regras de domínio permanecem compartilhadas com a web; apenas a implementação de armazenamento/SQLite varia por runtime.
- A migração é opt-in, assistida e não destrutiva para o workspace de origem.
- O diretório padrão nativo fica sob Application Support; a pessoa pode escolher outro diretório dentro do fluxo permitido.
- A UI não recebe acesso genérico ao filesystem nem executa SQL arbitrário.
- Somente uma instância pode escrever em um workspace por vez.
- Assinatura, notarização e distribuição pública não fazem parte da primeira fatia.

## Critérios de aceitação

- **AC-001** — Dado macOS 13+ Intel ou Apple Silicon, quando a build universal é iniciada, então a UI Svelte compartilhada abre sem exigir uma versão web separada.
- **AC-002** — Dado primeiro uso sem workspace nativo, quando o armazenamento é inicializado, então o padrão é `~/Library/Application Support/OpenBible/workspace` e existe opção de escolher outra pasta.
- **AC-003** — Dado um workspace OPFS detectável, quando a pessoa escolhe migrar, então o app copia os dados para a pasta nativa, valida o resultado e preserva o OPFS original; quando recusa, o app segue sem alterar a origem.
- **AC-004** — Dado runtime Tauri, quando uma tela lê ou grava notas, preferências, índices ou SQLite bíblico, então a operação passa pela facade tipada de comandos e permanece dentro do workspace autorizado.
- **AC-005** — Dado um pedido de SQL livre ou caminho fora do workspace, quando a UI tenta executá-lo, então o comando é rejeitado com erro seguro e sem acesso ao arquivo externo.
- **AC-006** — Dado o app nativo aberto, quando a pessoa navega, então as rotas e estados existentes do web permanecem disponíveis e equivalentes no desktop.
- **AC-007** — Dado o mesmo workspace já bloqueado, quando outra instância tenta abri-lo, então a segunda instância não escreve e apresenta orientação para fechar a primeira.
- **AC-008** — Dado falha de filesystem, SQLite ou migração, quando a operação termina, então a UI mostra estado de erro recuperável, sem corromper ou apagar a origem.
- **AC-009** — Dado o processo de build da primeira fatia, quando executado localmente ou em CI, então um artefato macOS testável é gerado sem exigir assinatura/notarização.

## Qualidades e operação

- Segurança: capabilities allowlist, validação de caminhos no Rust, comandos tipados e ausência de SQL livre; detalhes de threat model e mensagens seguras ficam para a spec.
- Privacidade: dados permanecem no dispositivo e não são enviados a servidor pela camada nativa; não registrar conteúdo de notas, tokens ou caminhos sensíveis em logs.
- Desempenho: inicialização e consultas devem preservar a responsividade da UI; limites mensuráveis e volumes de migração serão definidos na spec.
- Recuperação: cópia/migração e gravações de arquivo devem ser atômicas ou transacionais conforme o tipo de dado; estratégia detalhada pendente.
- Observabilidade: erros de comando, lock e migração devem ser diagnosticáveis sem expor conteúdo; formato e destino do log pendentes.

## Dependências

- Toolchain Tauri/Rust e configuração de capabilities para macOS.
- Adaptação da camada de storage existente em `apps/web` sem quebrar browser/PWA.
- Driver/plugin SQLite nativo compatível com a versão escolhida do Tauri.
- Ambiente macOS 13+ Intel e Apple Silicon para build/teste universal.
- Definição do fluxo de detecção e exportação do OPFS/PWA.
- Decisão posterior sobre assinatura/notarização e distribuição.

## Situações de erro

- Pasta padrão indisponível ou sem permissão: informar e oferecer escolha de outra pasta.
- Workspace escolhido inválido/incompleto: explicar o problema sem sobrescrever dados.
- Migração interrompida: manter a origem intacta, limpar/identificar destino parcial e permitir tentar novamente.
- SQLite bloqueado, corrompido ou incompatível: erro recuperável e orientação; nunca alterar `bibles/*.sqlite`.
- Comando fora da allowlist, caminho externo ou SQL livre: rejeitar com mensagem não sensível.
- Lock existente: impedir escrita concorrente e orientar encerramento da outra instância.
- Build local sem assinatura: documentar que o macOS pode exibir aviso de segurança; não bloquear o artefato de teste.

## Escopo

- Dentro: shell Tauri para macOS; binário universal macOS 13+; UI compartilhada de `apps/web`; seleção e criação de workspace nativo; migração assistida opcional do OPFS; facade de comandos tipados; acesso nativo ao SQLite; lock de uso exclusivo; paridade das rotas e fluxos publicados; build local/CI testável.
- Fora: Windows/Linux/iOS/Android; novas funcionalidades de domínio; colaboração, conta ou sincronização; migração automática obrigatória; assinatura/notarização e distribuição pública; suporte a múltiplas instâncias simultâneas; redesign da interface.

## Dúvidas, decisões e riscos

- **Decidido:** migração assistida opcional, destino padrão em Application Support com escolha alternativa, macOS 13+ universal, frontend único, facade tipada/allowlist, paridade de todas as rotas, uso exclusivo, build sem assinatura.
- **A decidir na especificação:** versão exata do Tauri/Rust e plugin SQLite; formato do lock; contrato de comandos, erros e versionamento; detecção/exportação do OPFS; transação/atomicidade da migração; estratégia para workspace escolhido em volume removível; matriz de testes; CI macOS e artefatos; política de atualização futura.
- **Riscos:** diferenças de sandbox/capabilities, permissões do macOS, corrupção durante cópia, incompatibilidade SQLite, divergência entre runtimes web/Tauri, custo de manter binário universal e aviso de Gatekeeper em builds não assinadas.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify`; decisões técnicas pendentes devem virar perguntas/hipóteses na spec, não requisitos inventados.
