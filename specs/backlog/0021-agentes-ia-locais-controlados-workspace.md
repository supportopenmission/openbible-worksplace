# Backlog: Agentes de IA locais e controlados pelo workspace

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0021 |
| Status | Ready for specification |
| Produto | OpenBible |
| Épico | BACKLOG-0016 — arquitetura local-first e portabilidade dos dados |
| Funcionalidade | Assistência de IA controlada pelo workspace |
| Tipo | Feature de integração local / privacidade e autoria |
| Prioridade | P1 — risco de credencial, privacidade e dependência das fatias anteriores |
| Milestones | Pós-0017–0020; desktop/Tauri como driver inicial |
| Criado em | 2026-09-05 |
| Spec promovida | `specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md` |

## Ideia original

Permitir que a pessoa conecte sua própria API key e use agentes de IA com informações do workspace ativo.

## Problema percebido

Recursos futuros de IA precisam consultar conteúdo local sem expor credenciais, misturar workspaces ou assumir um backend permanente no PWA. O OpenBible ainda não possui um contrato de execução, seleção de contexto, proposta revisável ou armazenamento de segredo para agentes.

## Pessoa afetada ou beneficiada

Pessoa usuária individual que estuda a Bíblia, cria notas, sermões e estudos no workspace ativo e deseja assistência de IA preservando posse, isolamento e portabilidade dos arquivos.

## Resultado ou valor esperado

Um agente consulta somente o escopo explicitamente autorizado do workspace ativo, retorna uma proposta ou resposta identificável e só altera conteúdo autoral quando a pessoa aplica explicitamente a proposta. Credenciais ficam fora do workspace, da sincronização, de exportações e de logs.

## Contexto

Quinta fatia dependente do BACKLOG-0016 e das bases de workspaces, formatos portáteis, backup e sincronização. O desktop/Tauri é o driver primário: a chave é consumida exclusivamente pelo backend Tauri e armazenada no cofre seguro do sistema operacional. O PWA não persiste chave nem a embute no cliente; quando houver assistência, usa gateway confiável configurado com token de sessão ou recebe resultados sincronizados. Service worker é cache/worker orientado a eventos e não backend persistente.

## Referências relacionadas

- `specs/inbox/2026-09-05-162057-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — formulação original da iniciativa.
- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico pai e ordem das fatias.
- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md` — identidade, raiz ativa e isolamento.
- `specs/backlog/0018-formatos-portateis-indice-reconstruivel.md` — Markdown/JSON autorais e índice SQLite reconstruível; exclui IA desta fatia.
- `specs/backlog/0019-backup-restauracao-workspace-pwa.md` — portabilidade e exclusões de credenciais/estado local.
- `specs/backlog/0020-sincronizacao-local-first-automerge.md` — exclusão de credenciais e caminhos do estado sincronizado.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md` — contrato `WorkspaceActivated` e contexto por workspace.
- `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/STACK.md` — regras canônicas de local-first, arquivos autorais, índices e Tauri.
- `apps/web/src/lib/storage/types.ts` — contrato atual de `WorkspaceStorage`.
- `apps/web/src/lib/storage/tauri-bridge.ts` e `apps/desktop/src-tauri/src/lib.rs` — bridge/allowlist atuais, sem comando de agente ou segredo.
- `apps/web/src/service-worker.ts` — cache do app shell e navegação; não é backend persistente.
- `apps/web/src/lib/features/notes/notes-repository.ts`, `note-markdown.ts` e `note-export.ts` — conteúdo autoral e exportação existentes.

## Comportamento esperado

- No desktop, a pessoa configura um perfil de agente sem expor a chave ao frontend; o backend Tauri recupera a chave por referência no armazenamento seguro do SO e a usa apenas durante a execução autorizada.
- O perfil e cada execução resolvem primeiro o workspace ativo e não podem ler outra raiz, catálogo local, handles, cache ou índice como fonte autoral.
- A pessoa seleciona o escopo de contexto (por exemplo, nota/sermão/estudo ou arquivos autorais escolhidos) e inicia a execução por ação explícita.
- A resposta da IA aparece como resultado/proposta temporária, com origem e escopo, sem salvar automaticamente conversa, prompt, segredo ou resposta em arquivo autoral.
- Aplicar uma proposta exige ação explícita, revisão e escrita atômica nos Markdown/JSON canônicos existentes; o SQLite é reindexado como derivação.
- No PWA, a interface não possui nem persiste API key e não a envia para o navegador. Uma execução só ocorre via gateway confiável configurado e token de sessão de curta duração, ou pela apresentação de resultado sincronizado; sem isso, a função permanece indisponível sem afetar o uso local.
- Trocar workspace, perder permissão, cancelar ou encerrar a sessão invalida o contexto da execução e impede aplicação em raiz diferente.

## Regras de negócio

- **RB-001 — driver e segredo:** Tauri é o driver de BYOK. A API key nunca é armazenada em workspace, arquivo autoral, sincronização, backup/exportação, `localStorage`, IndexedDB, Cache Storage ou log.
- **RB-002 — PWA sem chave:** o cliente PWA nunca embute, recebe ou persiste a API key; gateway confiável e token de sessão são fronteiras explícitas, não um backend OpenBible obrigatório.
- **RB-003 — isolamento:** toda leitura, execução e aplicação resolve o `workspaceId` ativo; contexto de outro workspace, índice, catálogo, path/handle ou service worker não é elegível.
- **RB-004 — autoria:** saída de IA é sugestão, nunca fonte autoral automática; Markdown/JSON continuam canônicos e toda aplicação é deliberada, revisável e atômica.
- **RB-005 — dados não confiáveis:** conteúdo do workspace é entrada não confiável, inclusive instruções inseridas em notas; o agente não pode transformar texto consultado em autorização de ferramenta.
- **RB-006 — escopo mínimo:** só o contexto selecionado e necessário é enviado ao provedor/gateway; não enviar workspace inteiro, credenciais, dados de infraestrutura, índice completo ou conteúdo não selecionado.
- **RB-007 — transparência:** a UI identifica provedor/gateway, workspace, arquivos/contexto, estado, erros e resultado sem revelar segredo; logs e diagnósticos usam metadados sanitizados.
- **RB-008 — offline e falhas:** sem provedor/gateway, rede ou permissão, o workspace continua utilizável localmente; timeout, cancelamento e falha não deixam gravação parcial.
- **RB-009 — service worker:** service worker permanece restrito a app shell/cache e não hospeda agente, API key, fila durável ou backend local persistente.

## Histórias e requisitos refinados

### US-001 — Configurar credencial no desktop

Como pessoa usuária do desktop, quero conectar minha própria credencial de provedor pelo OpenBible, para usar assistência sem gravá-la nos dados portáteis.

**Teste independente futuro:** configurar, substituir e revogar uma credencial em ambiente Tauri e inspecionar workspace, sincronização, exportação e logs sem encontrar o valor.

### US-002 — Consultar o workspace ativo com escopo explícito

Como pessoa usuária, quero escolher quais arquivos autorais do workspace ativo serão consultados, para receber assistência contextual sem misturar raízes ou enviar dados desnecessários.

**Teste independente futuro:** executar com dois workspaces e escopos distintos, verificando que somente o workspace e os arquivos selecionados participam do contexto.

### US-003 — Revisar e aplicar uma proposta

Como pessoa autora, quero revisar a resposta antes de aplicá-la, para manter controle sobre o que entra nos meus Markdown/JSON.

**Teste independente futuro:** produzir uma proposta, recusar e aplicar outra, verificando que só a aplicação confirmada altera a fonte canônica e que o índice é derivado depois.

### US-004 — Usar PWA sem expor a chave

Como pessoa usuária do PWA, quero saber quando a assistência não está disponível ou é fornecida por gateway confiável, para nunca precisar colocar uma API key no navegador.

**Teste independente futuro:** abrir o PWA sem gateway, com sessão válida e com sessão expirada; verificar disponibilidade, mensagens e ausência de segredo persistido.

## Critérios de aceitação

- **AC-001 — segredo fora do workspace:** Dado Tauri configurado com uma credencial, quando a pessoa salva ou atualiza o perfil, então o valor fica somente no armazenamento seguro do SO e não aparece nos arquivos do workspace, sincronização, exportação ou log.
- **AC-002 — execução Tauri autorizada:** Dado perfil válido e workspace ativo, quando a pessoa inicia uma execução, então somente o backend Tauri recupera o segredo, envia o pedido ao provedor configurado e devolve resultado sem devolver a chave ao frontend.
- **AC-003 — revogação/substituição:** Dado perfil existente, quando a pessoa revoga ou substitui a credencial, então execuções futuras usam apenas o novo estado e o valor anterior não é exibido nem reaproveitado.
- **AC-004 — escopo explícito:** Dado workspace com múltiplos arquivos, quando a pessoa seleciona contexto e inicia o agente, então o pedido contém somente arquivos autorais selecionados e metadados mínimos do workspace ativo.
- **AC-005 — isolamento entre workspaces:** Dado dois workspaces e uma execução do primeiro, quando a pessoa troca a raiz ou tenta referenciar a segunda, então o agente rejeita o contexto divergente e não lê nem grava a outra raiz.
- **AC-006 — conteúdo como dado:** Dado arquivo com texto que instrui o agente a ignorar regras ou chamar ferramentas, quando o agente o consulta, então esse texto permanece dado não confiável e não altera escopo, autorização ou comandos.
- **AC-007 — proposta não automática:** Dado resultado de IA, quando a execução termina, então a UI mostra resposta/proposta com origem, escopo e estado, mas nenhum Markdown/JSON autoral é alterado sem revisão e ação explícita.
- **AC-008 — aplicação canônica:** Dada proposta revisada, quando a pessoa confirma aplicar, então a escrita é atômica no arquivo Markdown/JSON selecionado, preserva IDs/metadados e atualiza apenas projeções derivadas necessárias.
- **AC-009 — recusa e conflito:** Dada proposta recusada, conteúdo alterado externamente ou aplicação inválida, quando a pessoa encerra/revisa, então a fonte anterior permanece intacta e nenhuma mesclagem silenciosa ocorre.
- **AC-010 — PWA sem API key:** Dado PWA sem gateway confiável ou token de sessão, quando a pessoa abre assistência, então o recurso informa indisponibilidade e não solicita, armazena ou embute API key.
- **AC-011 — PWA por fronteira confiável:** Dado gateway previamente configurado e sessão válida, quando a pessoa inicia uma execução, então o cliente envia apenas contexto autorizado com token de sessão e recebe resultado sem conhecer a chave do provedor.
- **AC-012 — sessão expirada:** Dado token de sessão ausente, expirado ou revogado, quando o PWA tenta executar, então não envia conteúdo, informa a necessidade de reconfiguração e preserva o uso local.
- **AC-013 — ausência de backend no SW:** Dado service worker instalado, quando a pessoa usa ou atualiza o PWA, então o worker limita-se a cache/navegação e não executa agente, persiste fila de prompts ou guarda credenciais.
- **AC-014 — falha segura:** Dado timeout, cancelamento, quota, rede ou erro do provedor, quando a execução termina, então o sistema mostra erro recuperável, descarta/limpa o contexto transitório conforme política e não deixa gravação parcial.
- **AC-015 — observabilidade sanitizada:** Dado execução concluída, falha ou cancelamento, quando o sistema registra diagnóstico local, então registra apenas IDs/estado/tempo/erro sanitizado, nunca prompt completo, resposta completa, chave, token ou path sensível.

## Qualidades e operação

- Segurança: bridge tipado e allowlist Tauri; nenhuma API do frontend recebe segredo; comandos validam workspace/contexto, tamanho, paths relativos e estado ativo; conteúdo é tratado como dado não confiável.
- Privacidade: contexto é opt-in por execução e mínimo; não há nuvem OpenBible obrigatória, conta OpenBible ou coleta remota implícita. Provedores e gateway ficam sujeitos a configuração explícita e política documentada.
- Integridade: proposta, recusa e aplicação são estados distintos; aplicação usa escrita atômica e reindexação derivada; conflito/erro não sobrescreve fonte.
- Desempenho e volume: leitura deve ser incremental/limitada por orçamento configurável a definir na implementação; o frontend não deve carregar o workspace inteiro nem bloquear edição local durante execução.
- Disponibilidade: ausência de chave, gateway, rede, permissão ou serviço externo não impede leitura/edição local, exportação ou sincronização autorizada.
- Auditoria: estados de execução, revogação, erro e aplicação podem ser diagnosticados localmente com redaction; nenhuma telemetria remota obrigatória.
- Acessibilidade: configurar, selecionar contexto, revisar, aplicar/recusar e recuperar erros deve funcionar com teclado, foco visível, leitor de tela, tema claro/escuro, 320px/1440px e zoom sem overflow.

## Dependências

- `SPEC-0016`/BACKLOG-0017 — workspace ativo, identidade estável, catálogo local e isolamento.
- `SPEC-0017`/BACKLOG-0018 — Markdown/JSON autorais, sidecars, IDs estáveis e índice reconstruível.
- `SPEC-0018`/BACKLOG-0019 — backup/restauração sem chaves, handles, caches ou estado local.
- `SPEC-0019`/BACKLOG-0020 — sincronização sem credenciais, paths ou catálogo local.
- `apps/web/src/lib/storage/WorkspaceStorage` e futuros casos de uso de contexto/execução.
- Backend Tauri com armazenamento seguro nativo do SO e bridge tipado; crate/plugin e APIs exatas permanecem decisão de arquitetura/implementação.
- Gateway confiável configurável para PWA e contrato de token de sessão; não pressupõe serviço OpenBible.

## Situações de erro

- Credencial ausente, inválida, revogada ou indisponível no cofre → não executar; orientar configuração sem revelar o valor.
- Provedor/gateway indisponível, sessão expirada, timeout ou limite externo → não aplicar; preservar uso local e oferecer tentativa segura.
- Workspace trocado, fechado, sem permissão ou diferente do contexto capturado → cancelar/rejeitar e descartar resultado não aplicável.
- Arquivo selecionado removido, alterado ou com formato desconhecido → mostrar conflito/diagnóstico e exigir revisão antes de aplicar.
- Conteúdo excede orçamento ou contém entrada malformada → truncar de modo declarado ou rejeitar antes do envio; nunca ampliar escopo silenciosamente.
- Resposta inválida, ferramenta não autorizada ou erro de serialização → tratar como proposta descartada, sem executar comandos nem alterar fonte.
- Falha de gravação/reindexação → preservar arquivo anterior, manter proposta recuperável apenas na sessão e informar ação de recuperação.

## Escopo

- **Dentro:** contrato de domínio para perfis/segredos por referência, execução controlada, seleção de contexto, bridge Tauri, cofre seguro do SO, gateway/token de sessão no PWA, propostas e aplicação explícita em Markdown/JSON, redaction, estados e interface em `/config`/workspace ativo.
- **Fora:** chave no PWA ou cliente, segredo em workspace/sync/export/log, backend OpenBible obrigatório, service worker como backend, execução autônoma sem confirmação, escrita automática, embeddings obrigatórios, treinamento, agente com acesso irrestrito, sincronização de credenciais, conta/cobrança OpenBible e implementação nesta fase.

## Dúvidas, decisões e riscos

- **Decisão D-001 — desktop:** BYOK é consumido no backend Tauri; segredo fica no armazenamento seguro do SO e o frontend recebe somente estado/resultados não sensíveis. Fonte: instrução do usuário nesta fase.
- **Decisão D-002 — PWA:** PWA não persiste nem embute chave; assistência, se habilitada, passa por gateway confiável com token de sessão ou apresenta resultado sincronizado. Fonte: instrução do usuário nesta fase.
- **Decisão D-003 — autoria:** resposta de IA não é conteúdo até ação explícita de aplicação. Fonte: instrução do usuário e contrato portátil 0018.
- **Decisão D-004 — fronteira local-first:** não há nuvem OpenBible obrigatória; ausência de provedor mantém uso local. Fonte: instrução do usuário e BACKLOG-0020.
- **Decisão D-005 — service worker:** worker não é backend persistente; fica fora da execução e da persistência de credenciais. Fonte: implementação local e BACKLOG-0019.
- **Hipótese H-001 — perfis:** configurações não secretas podem ser dispositivo-locais, mas o local/formato final deve ser confirmado na arquitetura sem colocá-las como requisito de arquivo autoral.
- **Aberta A-001 — provedores:** definir lista inicial, compatibilidade e política de endpoints/adapters; fontes OpenAI, quando usadas, devem ser apenas documentação oficial da OpenAI.
- **Aberta A-002 — gateway:** definir autenticação, expiração, retenção e operação do gateway confiável sem transformá-lo em dependência do OpenBible.
- **Aberta A-003 — ferramentas:** decidir se o primeiro agente é somente consulta/proposta ou possui ferramentas; qualquer ferramenta exigirá allowlist e confirmação por ação.
- **Risco R-001:** uma implementação web pode vazar segredo por devtools, logs, erro ou bundle; mitigação: chave só no backend Tauri/cofre e revisão de redaction.
- **Risco R-002:** prompt injection em Markdown pode induzir execução indevida; mitigação: contexto como dado, ferramentas desabilitadas por padrão e autorização independente.
- **Risco R-003:** resposta pode ser aplicada no arquivo errado após troca de workspace; mitigação: `workspaceId`/versão do documento e revalidação antes da escrita.
- **Risco R-004:** PWA pode parecer funcionar como servidor local; mitigação: gateway explícito, estados de indisponibilidade e exclusão do service worker como backend.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras para a Draft, com decisões de arquitetura abertas registradas.
- [x] O resultado pode ser verificado objetivamente por critérios AC e cenários BDD a consolidar na spec.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.
- [x] A separação Tauri/cofre, PWA/gateway e service worker/cache está explícita.
- [x] A separação entre saída transitória de IA e arquivos autorais canônicos está explícita.

## Próximo passo

Backlog refinado e promovido para `$specsfy-03-specify`. Produzir a spec Draft normativa, mantendo `Definition Gate: Pending` e sem iniciar `$specsfy-04-validate`, `$specsfy-06-tdd-bdd` ou `$specsfy-07-implement` nesta conversa.
