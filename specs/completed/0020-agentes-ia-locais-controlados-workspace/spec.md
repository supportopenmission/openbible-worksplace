# Especificação integrada: Agentes de IA locais controlados no workspace

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0020 |
| Slug | 0020-agentes-ia-locais-controlados-workspace |
| Status | Complete |
| Effort | 8 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Integração de alto risco entre Tauri, cofre seguro do SO, PWA/gateway, isolamento por workspace, autoria canônica e revisão humana. Estimativa preliminar sujeita à revisão arquitetural. |
| ClickUp Task | |
| Milestones | Pós-BACKLOG-0017–0020; desktop/Tauri como driver inicial |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible ainda não possui uma fronteira segura para agentes de IA. A pessoa precisa de assistência contextual sobre o workspace ativo, mas a credencial não pode entrar no conteúdo portátil, na sincronização, em exportações ou em logs. O desktop Tauri é o driver natural para BYOK, enquanto o PWA não possui backend persistente nem deve receber a chave. Também não existe fluxo que diferencie resposta transitória de alteração autoral.

#### Resultado desejado

Uma execução controlada lê apenas o contexto explicitamente selecionado no workspace ativo, usa segredo somente no backend Tauri/cofre seguro do SO ou, no PWA, uma fronteira de gateway confiável com token de sessão, e devolve uma resposta/proposta revisável. Nenhum arquivo autoral muda até ação explícita; quando aplicada, a mudança é atômica em Markdown/JSON e o SQLite é apenas projeção reconstruível.

#### Métricas de sucesso

- 100% das superfícies de persistência, sincronização, exportação e diagnóstico cobertas por inspeção sem valor de API key, token de sessão, prompt completo ou resposta completa.
- 100% das aplicações de saída de IA exigem confirmação explícita e revalidam workspace, documento e versão antes da escrita.
- 0 execuções PWA sem gateway confiável/token de sessão válido ou resultado sincronizado autorizado; uso local permanece disponível em todas essas falhas.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] O bridge atual possui comando de agente ou segredo? — Verdict: verified — Confidence: high — Evidence: research/agent-boundaries.md#r-001 — Budget: 1/6.
- **R-002** [critical] Onde vivem hoje as fontes autorais e o índice? — Verdict: verified — Confidence: high — Evidence: research/agent-boundaries.md#r-002 — Budget: 1/6.
- **R-003** [critical] O service worker pode ser backend persistente de agente? — Verdict: verified — Confidence: high — Evidence: research/agent-boundaries.md#r-003 — Budget: 1/6.
- **R-004** [critical] Existem dependências locais de OpenAI, cofre seguro ou gateway? — Verdict: verified — Confidence: high — Evidence: research/agent-boundaries.md#r-004 — Budget: 1/6.
- **R-005** [critical] Uma API key de provedor pode ficar no cliente web? — Verdict: verified — Confidence: high — Evidence: research/agent-boundaries.md#r-005 — Budget: 1/6.
- **R-006** [critical] Há biblioteca Rust capaz de usar credential stores nativos? — Verdict: verified — Confidence: medium — Evidence: research/agent-boundaries.md#r-006 — Budget: 1/6.

#### Fontes e contexto consultados

- Instrução do usuário nesta fase: Tauri como driver, BYOK no backend/cofre seguro do SO, restrições PWA/service worker, autoria explícita e ausência de nuvem OpenBible obrigatória.
- `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/USER-PROFILE.md`, `INTERFACE.md`.
- `specs/backlog/0016...` até `0020...`, `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md` e inbox de origem.
- `apps/web/src/lib/storage/types.ts`, `opfs-storage.ts`, `tauri-bridge.ts`, `tauri-storage.ts`, `apps/desktop/src-tauri/src/lib.rs`, `commands/workspace.rs`, `apps/web/src/service-worker.ts`, `ConfigPage.svelte`, `WorkspaceSettings.svelte`, `notes-repository.ts`, `note-markdown.ts` e `note-export.ts`.

#### Documentação consultada

- `.agents/skills/specsfy-02-backlog/references/backlog-quality.md`, `.agents/skills/specsfy-03-specify/references/mcr-10.md` e especialistas locais de dados, domínio, arquitetura, interface, UX e UI: critérios de rastreabilidade, risco, segurança e interface usados nesta Draft.
- OpenAI API Reference e Best Practices for API Key Safety, fontes oficiais consultadas em 2026-09-05.
- Projeto `open-source-cooperative/keyring-rs`, README e wiki oficiais consultados em 2026-09-05 para a fronteira de credential store; a dependência exata será pinada somente na implementação.

#### Artefatos de pesquisa armazenados

- `specs/completed/0020-agentes-ia-locais-controlados-workspace/research/agent-boundaries.md` — síntese local das fontes, decisões de fronteira e conclusão de segurança dos claims R-001–R-006.

#### Dúvidas respondidas

- **Q-001**: Onde a chave do desktop fica? → **A**: somente backend Tauri e armazenamento seguro do sistema operacional; nunca frontend, workspace, sync, export ou log.
- **Q-002**: Como o PWA usa IA sem chave? → **A**: gateway confiável configurado com token de sessão ou resultado sincronizado; sem persistir/embutir API key.
- **Q-003**: A resposta de IA vira conteúdo automaticamente? → **A**: não; somente ação explícita, revisão e escrita canônica.
- **Q-004**: O OpenBible precisa de nuvem própria ou service worker servidor? → **A**: não; o uso local continua possível e service worker não é backend persistente.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante. Modelo e endpoint concretos continuam configuráveis
  e validados pelo adapter, sem congelar um identificador de modelo na spec.

### 3. Escopo e atores

#### Incluído

- Contrato de perfil não secreto e referência de segredo; execução controlada; contexto selecionado por workspace ativo; bridge Tauri; cofre seguro do SO; gateway/token de sessão no PWA; estados de proposta, recusa e aplicação; redaction; escrita canônica; interface em `/config` e na superfície de trabalho.
- Revalidação de identidade/versão do workspace antes de aplicar; falhas, cancelamento, timeout, conflito e ausência de serviço.

#### Fora de escopo

- Chave no navegador ou bundle, segredo em workspace/sync/export/log, backend OpenBible obrigatório, service worker como servidor, execução autônoma, escrita automática, embeddings obrigatórios, treinamento, agente irrestrito, conta/cobrança OpenBible e implementação nesta fase.
- Escolha definitiva de provedores, API específica de OpenAI, operação de gateway, política comercial, sincronização de conversas ou entrega de app nativo iOS.

#### Atores

- **Pessoa autora**: configura a integração, seleciona contexto, inicia, revisa, recusa e aplica uma proposta; única autoridade para alterar conteúdo.
- **Frontend Svelte/PWA**: apresenta estados e envia comandos tipados sem receber API key; nunca autoriza sozinho uma ferramenta ou escrita.
- **Backend Tauri**: resolve workspace ativo, recupera segredo por referência no cofre seguro, chama adapter autorizado e devolve estado/resultado não sensível.
- **Gateway confiável**: fronteira opcional para PWA; valida token de sessão e encaminha contexto autorizado sem expor a chave do provedor ao cliente.
- **Provedor de IA**: serviço externo escolhido pela pessoa, sem ser fonte canônica do workspace nem dependência da leitura/edição local.
- **Service worker**: cache/navegação do PWA; não participa da execução, persistência de prompts, fila ou segredo.

### 4. Princípios e restrições do projeto

- **PR-001**: Markdown/JSON autorais são a fonte de verdade; SQLite, cache, resposta transitória e resultado sincronizado são derivados/operacionais.
- **PR-002**: Tauri é o driver de BYOK e o segredo só pode atravessar a fronteira backend→provedor; frontend recebe estado ou resultado redigido.
- **PR-003**: PWA nunca persiste/embute API key; gateway e token de sessão são configuráveis e opcionais para o uso local.
- **PR-004**: contexto é mínimo, opt-in e vinculado a `workspaceId`; nenhum path absoluto, handle, catálogo local ou índice completo é contexto autoral implícito.
- **PR-005**: conteúdo consultado é dado não confiável; instruções no Markdown não ganham autorização de ferramenta, escopo ou mudança de política.
- **PR-006**: resultado só entra na fonte autoral por revisão e ação explícita; aplicação revalida versão e escreve atomicamente.
- **PR-007**: ausência de rede, gateway, credencial ou provedor não bloqueia leitura, edição, exportação e sincronização local autorizada.
- **PR-008**: diagnóstico local usa redaction e não registra segredo, token, prompt/resposta completos ou path sensível.
- **PR-009**: a primeira fatia oferece geração textual sem tool/function calls,
  shell, rede arbitrária ou escrita autônoma; aplica no máximo uma proposta a um
  documento por confirmação.
- **PR-010**: o cofre usa credential store nativo por uma interface Rust e não
  possui fallback para arquivo, SQLite, variável serializada ou frontend. Se o
  cofre estiver indisponível, a capability fica indisponível.
- **PR-011**: gateway PWA usa HTTPS, preflight sem conteúdo e token opaco somente
  em memória, com validade máxima de 60 minutos. URL não secreta é configuração
  local do aparelho; recarga, expiração ou revogação exigem nova sessão.
- **PR-012**: perfil autoral portátil e binding do aparelho são separados. O
  primeiro pode ser JSON legível sem endpoint/segredo; o segundo guarda adapter,
  modelo, endpoint local e `secretRef` fora do workspace e de sync/backup.

### 5. Histórias de usuário

#### US-001 — Configurar credencial no desktop (P1)

Como pessoa usuária do desktop, quero conectar minha própria credencial pelo OpenBible, para usar assistência sem gravá-la nos dados portáteis.

**Por que P1**: uma fronteira errada expõe credencial e compromete todos os workspaces.
**Teste independente**: configurar, substituir e revogar uma credencial Tauri e inspecionar superfícies de persistência/diagnóstico.
**Requisitos**: FR-001, FR-002, FR-003, NFR-001, NFR-003.

#### US-002 — Consultar workspace ativo com escopo explícito (P1)

Como pessoa usuária, quero escolher arquivos autorais do workspace ativo, para obter contexto sem misturar raízes ou enviar dados desnecessários.

**Por que P1**: isolamento e minimização limitam privacidade, custo e prompt injection.
**Teste independente**: executar com dois workspaces e escopos diferentes, verificando payload e rejeição de contexto divergente.
**Requisitos**: FR-004, FR-005, FR-006, NFR-002, NFR-003, NFR-006.

#### US-003 — Revisar e aplicar proposta (P1)

Como pessoa autora, quero revisar a resposta antes de aplicá-la, para manter controle sobre o que entra nos meus Markdown/JSON.

**Por que P1**: saída de IA não pode alterar autoria, destruir edição externa ou substituir a fonte de verdade.
**Teste independente**: produzir, recusar, conflitar e aplicar propostas, verificando atomicidade e projeção posterior.
**Requisitos**: FR-007, FR-008, NFR-004, NFR-008.

#### US-004 — Usar PWA sem expor a chave (P1)

Como pessoa usuária do PWA, quero saber quando a assistência depende de gateway confiável, para nunca colocar uma API key no navegador.

**Por que P1**: PWA e service worker não têm fronteira segura para manter BYOK persistente.
**Teste independente**: abrir sem gateway, com sessão válida e expirada; verificar estados e ausência de segredo.
**Requisitos**: FR-009, FR-010, FR-011, NFR-005, NFR-007.

### 6. Cenários BDD de aceite

#### AC-001 — Salvar segredo apenas no cofre Tauri

**Cobre**: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-003 @AC-001
Feature: Credencial BYOK protegida

  Scenario: Configurar uma credencial no desktop
    Given o OpenBible está executando em Tauri e o workspace ativo está pronto
    When a pessoa informa uma API key e salva o perfil
    Then somente o backend Tauri grava o valor no armazenamento seguro do SO
    And workspace, sync, exportação, frontend e logs recebem apenas uma referência ou estado redigido
```

#### AC-002 — Executar pelo backend sem devolver chave

**Cobre**: US-001, FR-002, FR-004, NFR-001, NFR-005

```gherkin
@US-001 @FR-002 @FR-004 @NFR-001 @NFR-005 @AC-002
Feature: Execução Tauri controlada

  Scenario: Executar com perfil válido
    Given existe um perfil Tauri ativo e uma seleção válida do workspace ativo
    When a pessoa inicia o agente
    Then o backend recupera a chave por referência e chama o adapter autorizado
    And o frontend recebe somente estado e resultado sem a chave
```

#### AC-003 — Revogar ou substituir credencial

**Cobre**: US-001, FR-001, FR-003, NFR-001, NFR-007

```gherkin
@US-001 @FR-001 @FR-003 @NFR-001 @NFR-007 @AC-003
Feature: Ciclo de vida da credencial

  Scenario: Revogar o perfil usado anteriormente
    Given existe uma credencial salva no cofre seguro
    When a pessoa a revoga ou substitui
    Then execuções futuras usam somente o novo estado
    And o valor anterior não é exibido, reaproveitado ou registrado
```

#### AC-004 — Enviar somente contexto selecionado

**Cobre**: US-002, FR-004, FR-005, FR-006, FR-012, NFR-002, NFR-003, NFR-006

```gherkin
@US-002 @FR-004 @FR-005 @FR-006 @FR-012 @NFR-002 @NFR-003 @NFR-006 @AC-004
Feature: Contexto mínimo do workspace

  Scenario: Selecionar arquivos autorais para consulta
    Given o workspace ativo possui notas e arquivos fora da seleção
    When a pessoa escolhe duas notas e inicia a execução
    Then o pedido contém somente essas notas e metadados mínimos permitidos
    And não inclui outro workspace, catálogo, handle, path absoluto ou índice completo
```

#### AC-005 — Rejeitar contexto de outro workspace

**Cobre**: US-002, FR-005, FR-006, FR-011, NFR-002, NFR-004

```gherkin
@US-002 @FR-005 @FR-006 @FR-011 @NFR-002 @NFR-004 @AC-005
Feature: Isolamento do workspace

  Scenario: Trocar a raiz enquanto uma execução está pendente
    Given uma execução foi capturada para o workspace A
    When a pessoa ativa o workspace B antes de aplicar o resultado
    Then a execução é cancelada ou marcada incompatível
    And nenhum conteúdo de B é lido ou gravado pela execução de A
```

#### AC-006 — Tratar prompt injection como dado

**Cobre**: US-002, FR-006, FR-011, FR-012, NFR-001, NFR-002, NFR-006

```gherkin
@US-002 @FR-006 @FR-011 @FR-012 @NFR-001 @NFR-002 @NFR-006 @AC-006
Feature: Conteúdo não confiável

  Scenario: Nota contém instrução para ignorar a política
    Given uma nota selecionada contém texto que pede chave ou chamada de ferramenta
    When o agente lê a nota
    Then o texto é tratado como conteúdo de referência
    And não altera escopo, autorização, política ou comandos disponíveis
```

#### AC-007 — Resultado não altera arquivo automaticamente

**Cobre**: US-003, FR-007, FR-008, FR-012, NFR-004, NFR-008

```gherkin
@US-003 @FR-007 @FR-008 @FR-012 @NFR-004 @NFR-008 @AC-007
Feature: Proposta revisável

  Scenario: Execução termina com uma sugestão
    Given o provedor devolveu uma resposta para o contexto selecionado
    When a execução termina
    Then a UI mostra resultado, origem, escopo e ações de revisar, aplicar ou recusar
    And nenhum Markdown ou JSON canônico é alterado antes da aplicação explícita
```

#### AC-008 — Aplicar proposta atomicamente

**Cobre**: US-003, FR-007, FR-008, FR-012, NFR-002, NFR-004, NFR-008

```gherkin
@US-003 @FR-007 @FR-008 @FR-012 @NFR-002 @NFR-004 @NFR-008 @AC-008
Feature: Aplicação canônica

  Scenario: Pessoa confirma uma proposta revisada
    Given a proposta ainda corresponde ao workspace e versão do documento
    When a pessoa confirma aplicar
    Then o arquivo Markdown ou JSON selecionado é escrito atomicamente
    And IDs e metadados são preservados e o índice é atualizado apenas como projeção
```

#### AC-009 — Preservar fonte em recusa ou conflito

**Cobre**: US-003, FR-007, FR-008, FR-011, NFR-004, NFR-008

```gherkin
@US-003 @FR-007 @FR-008 @FR-011 @NFR-004 @NFR-008 @AC-009
Feature: Recusa e conflito de aplicação

  Scenario: Arquivo foi alterado desde a consulta
    Given o arquivo canônico mudou depois da captura do contexto
    When a pessoa tenta aplicar a proposta antiga
    Then o sistema informa o conflito e não sobrescreve a fonte
    And a proposta pode ser descartada sem alterar o conteúdo atual
```

#### AC-010 — PWA indisponível sem gateway

**Cobre**: US-004, FR-009, FR-010, FR-011, NFR-003, NFR-005, NFR-007, NFR-009

```gherkin
@US-004 @FR-009 @FR-010 @FR-011 @NFR-003 @NFR-005 @NFR-007 @NFR-009 @AC-010
Feature: Assistência PWA sem chave

  Scenario: PWA não possui gateway ou sessão
    Given o PWA está aberto sem gateway confiável e sem token de sessão
    When a pessoa abre a assistência
    Then a UI informa que a função está indisponível nesta fronteira
    And não solicita, embute, recebe ou persiste API key
```

#### AC-011 — PWA usa sessão sem conhecer segredo

**Cobre**: US-004, FR-009, FR-010, NFR-001, NFR-003, NFR-005, NFR-009

```gherkin
@US-004 @FR-009 @FR-010 @NFR-001 @NFR-003 @NFR-005 @NFR-009 @AC-011
Feature: Gateway confiável

  Scenario: Sessão válida no gateway configurado
    Given o PWA tem gateway confiável configurado e token de sessão válido
    When a pessoa inicia uma execução com contexto autorizado
    Then o cliente envia contexto mínimo acompanhado da sessão
    And recebe resultado sem conhecer ou persistir a chave do provedor
```

#### AC-012 — Sessão expirada não envia conteúdo

**Cobre**: US-004, FR-009, FR-010, FR-011, NFR-005, NFR-007, NFR-009

```gherkin
@US-004 @FR-009 @FR-010 @FR-011 @NFR-005 @NFR-007 @NFR-009 @AC-012
Feature: Recuperação de sessão

  Scenario: Gateway rejeita a sessão
    Given o token de sessão está expirado ou revogado
    When o PWA tenta executar
    Then nenhum conteúdo é enviado ao gateway
    And a UI orienta reconfiguração sem impedir leitura e edição local
```

#### AC-013 — Service worker não é backend

**Cobre**: US-004, FR-010, FR-011, NFR-001, NFR-005, NFR-007

```gherkin
@US-004 @FR-010 @FR-011 @NFR-001 @NFR-005 @NFR-007 @AC-013
Feature: Limite do service worker

  Scenario: PWA instala ou atualiza o worker
    Given o service worker está instalado
    When o PWA executa instalação, ativação ou fetch do app shell
    Then o worker trata somente cache e navegação permitidos
    And não executa agente, persiste fila de prompt ou guarda credenciais
```

#### AC-014 — Falha externa não grava parcialmente

**Cobre**: US-001, US-002, US-003, FR-002, FR-004, FR-005, FR-007, FR-008, NFR-004, NFR-005, NFR-006

```gherkin
@US-001 @US-002 @US-003 @FR-002 @FR-004 @FR-005 @FR-007 @FR-008 @NFR-004 @NFR-005 @NFR-006 @AC-014
Feature: Falha segura de execução

  Scenario: Provedor excede timeout durante a execução
    Given uma execução está em andamento e o provedor deixa de responder
    When o timeout ou cancelamento é detectado
    Then a UI mostra erro recuperável sem proposta aplicável
    And nenhum arquivo canônico é parcialmente escrito
```

#### AC-015 — Diagnóstico sanitizado

**Cobre**: US-001, US-003, US-004, FR-001, FR-003, FR-008, FR-011, FR-012, NFR-001, NFR-007, NFR-009

```gherkin
@US-001 @US-003 @US-004 @FR-001 @FR-003 @FR-008 @FR-011 @FR-012 @NFR-001 @NFR-007 @NFR-009 @AC-015
Feature: Observabilidade sem segredo

  Scenario: Registrar sucesso, falha ou cancelamento
    Given uma execução mudou de estado
    When o sistema registra diagnóstico local
    Then guarda somente IDs, estado, duração e erro sanitizado
    And não guarda chave, token, prompt completo, resposta completa ou path sensível
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve criar, atualizar, revogar e consultar estado de um perfil de agente Tauri sem revelar o segredo ao frontend. **Cobre**: AC-001, AC-003, AC-015.
- **FR-002**: O backend Tauri deve recuperar o segredo exclusivamente por referência ao cofre seguro do SO e executar adapters autorizados. **Cobre**: AC-001, AC-002, AC-014.
- **FR-003**: O sistema deve redigir segredos e tokens de qualquer resposta, erro, telemetria ou diagnóstico. **Cobre**: AC-001, AC-003, AC-015.
- **FR-004**: O sistema deve capturar execução com `workspaceId`, geração/versão do documento, perfil e contexto selecionado. **Cobre**: AC-002, AC-004, AC-014.
- **FR-005**: O sistema deve enumerar e enviar somente arquivos autorais selecionados, com limites e metadados mínimos; índices, paths, handles e catálogos não são contexto implícito. **Cobre**: AC-004, AC-005, AC-006.
- **FR-006**: O sistema deve tratar conteúdo consultado como dado não confiável e bloquear autorização derivada de instruções encontradas nele. **Cobre**: AC-004, AC-005, AC-006.
- **FR-007**: O sistema deve apresentar resultado como proposta temporária com escopo, origem, estado, revisão, aplicação e recusa explícitas. **Cobre**: AC-007, AC-008, AC-009.
- **FR-008**: Ao aplicar, o sistema deve revalidar workspace/documento/versão, escrever Markdown/JSON atomicamente e reindexar apenas projeções derivadas. **Cobre**: AC-007, AC-008, AC-014.
- **FR-009**: O PWA deve operar somente por gateway confiável configurado com token de sessão válido ou apresentar resultado sincronizado autorizado; não deve conhecer API key. **Cobre**: AC-010, AC-011, AC-012.
- **FR-010**: O PWA deve comunicar indisponibilidade, expiração, cancelamento e recuperação sem bloquear funções locais. **Cobre**: AC-010, AC-011, AC-012.
- **FR-011**: O service worker deve permanecer fora de execução de agentes, persistência de prompts, filas duráveis e armazenamento de credenciais. **Cobre**: AC-005, AC-012, AC-013.
- **FR-012**: A primeira fatia deve usar geração textual sem ferramentas, limitar cada aplicação confirmada a um documento e separar perfil portátil de binding e credencial do aparelho. **Cobre**: AC-004, AC-006, AC-007, AC-008, AC-015.

#### Não funcionais

- **NFR-001**: Nenhum segredo ou token deve cruzar para bundle, estado Svelte, workspace, sync, export, Cache Storage ou log; verificar por inspeção de bridge, persistência, payload e diagnóstico. **Cobre**: AC-001, AC-002, AC-006, AC-011, AC-013, AC-015.
- **NFR-002**: Cada execução deve estar vinculada a um único workspace e contexto mínimo, e uma proposta divergente deve ser rejeitada antes da escrita; verificar com dois workspaces e edição concorrente. **Cobre**: AC-004, AC-005, AC-006, AC-008.
- **NFR-003**: A coleta remota deve ser opt-in por execução/gateway, sem nuvem OpenBible obrigatória, e sem enviar conteúdo não selecionado; verificar ausência de gateway e payload mínimo. **Cobre**: AC-001, AC-004, AC-010, AC-011.
- **NFR-004**: Aplicação deve ser atomicamente observável, preservando fonte anterior em falha, recusa ou conflito; verificar escrita interrompida e índice indisponível. **Cobre**: AC-007, AC-008, AC-009, AC-014.
- **NFR-005**: Sem credencial, gateway, rede ou provedor, leitura/edição local devem continuar disponíveis e a UI deve oferecer recuperação sem retry infinito; verificar estados indisponíveis e timeout. **Cobre**: AC-002, AC-010, AC-012, AC-014.
- **NFR-006**: A execução deve respeitar orçamento configurável de contexto e não carregar o workspace inteiro ou bloquear edição local; medir com conjunto grande e cancelamento. **Cobre**: AC-004, AC-006, AC-014.
- **NFR-007**: Diagnósticos devem conter apenas ID/estado/duração/erro sanitizado e permitir distinguir sucesso, falha, cancelamento, revogação e conflito; verificar inspeção de logs. **Cobre**: AC-003, AC-012, AC-013, AC-015.
- **NFR-008**: Configuração, seleção, revisão, aplicação e recuperação devem ser operáveis com teclado, foco visível, leitor de tela, claro/escuro, 320px e 1440px sem overflow; verificar estados vazios, loading, erro e sucesso. **Cobre**: AC-007, AC-008, AC-010.
- **NFR-009**: Token PWA deve existir somente em memória por no máximo 60 minutos; preflight sem conteúdo valida a sessão antes de qualquer envio, e reload, revogação ou expiração limpam a capability. **Cobre**: AC-010, AC-011, AC-012, AC-015.

#### Erros e casos-limite

- Credencial ausente/inválida/revogada → não executar e orientar configuração sem revelar valor.
- Gateway ausente/sessão expirada/rede indisponível → não enviar contexto e manter uso local.
- Workspace trocado, permissão perdida ou versão divergente → cancelar/rejeitar resultado.
- Arquivo removido/alterado/formato desconhecido → conflito revisável, sem sobrescrita.
- Contexto excede orçamento ou é malformado → rejeitar ou truncar de modo declarado, sem ampliar escopo.
- Resposta inválida/ferramenta não autorizada → descartar como proposta; não executar comando.
- Falha de escrita/reindexação → preservar fonte anterior e oferecer recuperação segura.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit 2/Svelte 5/TypeScript em `apps/web`; Tauri 2/Rust em `apps/desktop/src-tauri`; `WorkspaceStorage` abstrai arquivos para OPFS, pasta FSA/local e nativo.
- `apps/web/src/lib/storage/tauri-bridge.ts#L3-L20` usa união tipada de comandos e valida path relativo; `apps/desktop/src-tauri/src/lib.rs#L13-L24` registra allowlist de comandos atuais. Não há comando de IA, cofre seguro, gateway ou provider adapter.
- `apps/web/src/service-worker.ts#L10-L66` gerencia cache/navegação. `ConfigPage.svelte` usa seções responsivas; `WorkspaceSettings.svelte` é o ponto atual para armazenamento. Notas ficam em `notes/<id>.md`, destaques portáteis em JSON e índice em `.openbible/index.sqlite` conforme `.specsfy/DATABASE.md`.

#### Arquitetura e módulos

- **Domínio web compartilhado**: tipos/casos de uso para `PortableAgentProfile`, `DeviceAgentBinding`, seleção de contexto, `AgentRun`, `AIProposal` e aplicação; nenhum módulo recebe valor de segredo.
- **Facade Tauri**: comandos pequenos, tipados e allowlisted para salvar/consultar estado redigido, executar, cancelar e revogar. O Rust resolve workspace ativo e chama cofre seguro/adapter; o segredo não retorna pelo IPC.
- **Cofre seguro**: credential store nativo acessado por interface Rust; `SecretRef` é identificador, nunca valor em arquivo ou estado web. Ausência do cofre desabilita a capability, sem fallback em arquivo.
- **PWA gateway adapter**: preflight HTTPS sem conteúdo e token opaco somente em memória, válido por no máximo 60 minutos; o cliente envia escopo mínimo e recebe estado/resultado. Sem gateway, capability fica indisponível.
- **Context provider**: lê somente arquivos canônicos selecionados por `WorkspaceStorage`, valida IDs/geração e não expõe SQLite, catálogo, handles ou paths absolutos.
- **Proposal applier**: revalida versão, aplica mudança estruturada ao Markdown/JSON por operação atômica e dispara reindexação já existente; nenhuma alteração automática após resposta.
- **Service worker**: permanece inalterado como cache/navegação; não recebe comandos de agente.

#### Migrations

- Não aplicável a banco. Não criar tabela para segredo, prompt, resposta ou conversa. Perfil autoral sem segredo usa JSON portátil; binding, endpoint e `secretRef` ficam no estado local do aparelho.

#### Models

- `PortableAgentProfile`: ID, nome exibido, instrução autoral e capability textual sem ferramentas; JSON legível sem provider, endpoint, modelo ou segredo.
- `DeviceAgentBinding`: profileId, provider/adapter, modelo, endpoint não secreto, estado e `secretRef` opaco; local ao aparelho e excluído de workspace, backup e sync.
- `SecretRef`: referência não reversível/exibível ao cofre seguro do SO; não persistir no workspace sincronizável.
- `AgentContextSelection`: `workspaceId`, geração, IDs/caminhos relativos autorizados, versão/hash de leitura e orçamento; paths absolutos e handles ficam fora.
- `AgentRun`: ID, perfil, workspace/generation, estado, timestamps, contadores e erro redigido; transitório ou operacional, sem prompt/resposta completos.
- `AIProposal`: ID de execução, documentos/versões, diff/resultados, origem e estado `review|applied|rejected|stale`; transitório até ação explícita.
- `CanonicalContentChange`: operação validada sobre Markdown/JSON, preservando IDs/metadata e emitindo projeção de índice posterior.

#### Controllers e casos de uso

- `configureAgentProfile`: entrada de estado não secreto + segredo transitório, saída `AgentProfile` redigido; somente Tauri pode receber o segredo.
- `startAgentRun`: entrada `workspaceId`, seleção, instrução e perfil; valida escopo, monta contexto mínimo e delega ao adapter Tauri ou gateway.
- `cancelAgentRun`/`revokeAgentProfile`: cancelam e invalidam estado; nunca retornam/registram segredo.
- `reviewProposal`/`applyProposal`: carregam diff, revalidam geração/hash/ID e escrevem canônico atomicamente; conflito vira `stale`.

#### Views e experiência

- `/config` ganha seção “Assistência” usando padrão existente de seções desktop/mobile; exibe capability `Tauri/cofre`, `PWA/gateway` ou indisponível.
- No contexto de notas/estudo, ação “Consultar com IA” abre painel/sheet de seleção. Resultado aparece em painel/drawer de revisão com origem, arquivos, status, diff e ações Aplicar/Recusar.
- Estados obrigatórios: sem configuração, configurando, pronto, executando, cancelando, resultado, conflito/stale, erro recuperável, sessão expirada e indisponível offline.

#### Queries e repositórios

- Contexto usa `WorkspaceStorage.readFile/listFiles` com paths relativos validados; não consulta `index.sqlite` como fonte autoral.
- Aplicação reutiliza repositórios de notas/sidecars e `note-markdown`/serializer existentes; índice recebe apenas a projeção já suportada.
- Não criar repositório remoto de prompts/respostas. Estado operacional deve ser em memória ou armazenamento local não-portátil explicitamente aprovado.

#### Jobs e processamento assíncrono

- Execução é assíncrona, cancelável e com timeout; retries são limitados e idempotentes por `runId`/request id. Não há fila durável no service worker. Prompt, contexto, resposta e proposta ficam em memória e são descartados no reload ou em até 30 minutos após terminar; diagnóstico sanitizado usa anel local de no máximo 200 eventos ou sete dias.

#### Estrutura de arquivos

```text
specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md
apps/web/src/lib/features/ai/                 # futuro domínio e UI Svelte
apps/web/src/lib/storage/tauri-bridge.ts      # extensão tipada, sem segredo no retorno
apps/desktop/src-tauri/src/commands/ai.rs     # futuro backend Tauri/cofre/adapter
apps/desktop/src-tauri/capabilities/default.json
tests/                                        # somente fase TDD posterior
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `PortableAgentProfile` | `agentProfileId` estável | nome, instrução autoral e capability textual sem ferramentas; JSON legível, sem endpoint ou segredo | pertence ao workspace e pode ser exportado/sincronizado |
| `DeviceAgentBinding` | aparelho + `agentProfileId` | provider/adapter, modelo, endpoint não secreto, estado e `secretRef` opaco | local ao aparelho; cada run referencia um |
| `SecretRef` | referência do cofre | valor somente no cofre seguro do SO; não exportável/sincronizável | 0..1 por perfil Tauri; inexistente no PWA |
| `AgentContextSelection` | `selectionId`/run | `workspaceId`, generation, IDs e paths relativos selecionados, budget, hash/versão | 1 por `AgentRun`; não atravessa workspace |
| `AgentRun` | `runId` | `queued/running/cancelled/succeeded/failed/stale`, timestamps, contadores, erro redigido | pertence a um perfil e workspace ativo |
| `AIProposal` | `proposalId` | origem, escopo, versões, diff/resultado transitório, `review/applied/rejected/stale` | 0..1 ou N por run; aplicação cria mudança canônica |
| `CanonicalContentChange` | ID/versão do arquivo | operação atômica em Markdown/JSON, autor explícito, preserva IDs | altera apenas fonte selecionada; índice é projeção |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| `DeviceAgentBinding` | `unconfigured` | salvar binding e segredo Tauri | `ready` | segredo só no cofre |
| `DeviceAgentBinding` | `ready` | revogar/substituir | `revoked`/`ready` | valor anterior não é reutilizado |
| `AgentRun` | `queued` | adapter aceito | `running` | workspace/generation fixos |
| `AgentRun` | `running` | resposta | `succeeded` | resultado não grava autoral |
| `AgentRun` | `running` | cancelar/timeout/erro | `cancelled`/`failed` | sem escrita parcial |
| `AIProposal` | `review` | aplicar após revalidação | `applied` | confirmação e versão atuais |
| `AIProposal` | `review` | recusar ou detectar divergência | `rejected`/`stale` | fonte permanece intacta |

#### Migração e retenção

- Nenhuma migração de banco. Chaves e bindings ficam locais ao aparelho; token,
  prompt, contexto, resposta e proposta ficam em memória e expiram no reload ou
  em até 30 minutos após o término. Diagnóstico sanitizado retém no máximo 200
  eventos ou sete dias. O perfil autoral sem segredo usa JSON portátil.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A configuração vive em `/config` e a ação contextual vive no workspace/notas; revisão e aplicação são superfícies obrigatórias.

#### Stack e convenções de interface

- SvelteKit/Svelte/TypeScript, Tailwind e primitives shadcn-svelte locais (`Button`, `Dialog`, `Sheet`, `Select`, `Textarea`, `Tabs`, `AlertDialog` quando apropriado), Geist Sans/Mono e tokens de `apps/web/src/app.css`. Não introduzir React, shadcn/ui ou ReUI.
- Reutilizar `ConfigPage`, `WorkspaceSettings`, `PageHeader`, `AppFrame`, `Dialog`/`Sheet`/`Drawer` existentes e padrões de `INTERFACE.md`; criar bloco de domínio somente após decisão da fase de implementação.

#### Telas e responsabilidades

- **Configurações / Assistência**: equipe OpenBible · módulo Configurações · tela Assistência. Lista estado do backend/capability, perfil não secreto e ações configurar, testar, revogar; nunca mostra chave. Breadcrumb: `OpenBible / Configurações / Assistência`.
- **Seleção de contexto**: equipe OpenBible · módulo Workspace/Notas · painel “Consultar com IA”. Lista somente arquivos do workspace ativo, com seleção e orçamento; saída é run em execução. Breadcrumb no shell: `OpenBible / Workspace / Assistência`.
- **Revisão de proposta**: equipe OpenBible · módulo Workspace/Notas · sheet/painel de revisão. Mostra provider/gateway, workspace, fontes, status, diff/resultados e ações Aplicar/Recusar; Breadcrumb: `OpenBible / Workspace / Revisão de proposta`.

#### Fluxo de informação e navegação

1. Pessoa abre `/config`, entra em Assistência e vê capability: Tauri/cofre, PWA/gateway ou indisponível.
2. No desktop, configura perfil e segredo em interação nativa; o formulário limpa o valor após envio e só mantém estado redigido.
3. Em nota/estudo, abre ação contextual, seleciona arquivos autorizados e inicia; o shell mantém workspace ativo visível.
4. Enquanto executa, pode cancelar; ao terminar, vai para revisão. Aplicar exige confirmação; recusar encerra sem mudança.
5. Troca de workspace ou conflito fecha/invalida revisão e orienta nova seleção.

#### Menus e navegação principal

- Menu desktop: `Sidebar > Configurações` abre `/config`; o item de seção
  `Assistência` seleciona o painel `AgentCapabilityPanel` sem criar nova rota.
- Editor: a ação `Consultar com IA` em notas/estudos abre
  `AgentContextPicker`; uma resposta concluída abre `AgentProposalReview` no
  mesmo workspace.
- Menu mobile: `Drawer > Configurações > Assistência` mantém `/config`; seleção e
  revisão usam `Drawer`/`Sheet` com retorno ao acionador. As ações só aparecem
  quando a capability do aparelho permite e não dependem de hover.

#### Formulários e ações

- Configuração: provider/adapter, nome do perfil, endpoint não secreto, modelo/capabilities conforme decisão futura e campo secreto nativo com ajuda “não será salvo no workspace”; ações Salvar, Testar, Revogar. Validação de capability e erro abaixo do campo, sem ecoar segredo.
- Contexto: lista/tabela de arquivos autorais do workspace ativo, checkboxes/seleção acessível, instrução, orçamento e botão Consultar; nenhum path absoluto ou índice completo exibido como contexto.
- Revisão: metadados de origem/escopo, resultado/diff legível, Aplicar e Recusar; aplicação abre confirmação quando houver escrita; conflito troca para estado stale e desabilita Aplicar.

#### Composição e disposição

- Desktop: `PageHeader`/seção de configuração em largura disponível; formulário dividido em coluna de contexto e painel de campos; seleção/revisão em `Sheet` ou painel lateral sem esconder o workspace.
- Mobile 320px: seção empilhada e `Drawer` com foco gerenciado; ações primárias fixadas somente se não cobrirem conteúdo. Desktop 1440px: conteúdo com largura legível, diff e fontes lado a lado quando couber.
- Sem gradiente/glow/sombra decorativa; estados usam texto, borda e cor semântica; segredo nunca é identificado apenas por ícone/cor.

#### Blocos React e componentes selecionados

| Tela | Bloco | Responsabilidade | Arquivo previsto | Componente/composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Config Assistência | `AgentCapabilityPanel` | capability e estado redigido | `apps/web/src/lib/features/ai/AgentCapabilityPanel.svelte` | `PageHeader`, `Button`, `AlertDialog` | próprio + shadcn-svelte local | novo, consumido por `ConfigPage` |
| Seleção | `AgentContextPicker` | arquivos e orçamento autorizados | `apps/web/src/lib/features/ai/AgentContextPicker.svelte` | `Checkbox`, `Button`, `Sheet` | shadcn-svelte local | novo, contextual a notas/workspace |
| Revisão | `AgentProposalReview` | resultado, diff, aplicar/recusar | `apps/web/src/lib/features/ai/AgentProposalReview.svelte` | `Sheet`, `Dialog`, `Button`, `AlertDialog` | shadcn-svelte local | novo, sem CRUD genérico |

> A coluna mantém o título exigido pelo template; a stack real é Svelte, não React. Os nomes “Bloco” não autorizam React.

#### Estados e acessibilidade

- Loading: capability/arquivo/run com status textual e `aria-live="polite"`; foco vai para título do painel.
- Vazio: sem perfil, sem gateway ou sem arquivos selecionáveis explica causa e próximo passo, sem pedir chave no PWA.
- Erro: mensagem segura, código útil sem segredo, tentativa/reconfiguração e foco no erro; sessão expirada não envia conteúdo.
- Sucesso: resultado apresenta provider/gateway, workspace, fontes e timestamp; Aplicar/Recusar são botões nomeados.
- Permissão: workspace indisponível/alterado desabilita seleção e aplicação até recuperação.
- Teclado/leitor: tab order previsível, foco visível, `aria-describedby` em segredo/origem, diálogo com retorno de foco, `aria-live` para status; claro/escuro, zoom e 320/1440 sem overflow.

#### Contrato CRUD

- Não é CRUD de conteúdo. A superfície reutiliza `PageHeader`; não existe
  listagem `DataGrid`, coluna `ID`, detalhe, editar ou apagar registros. Salvar,
  testar e revogar um binding são ações de configuração, e Aplicar/Recusar são
  ações sobre proposta transitória. Caso uma futura entrega crie CRUD de
  perfis, ela deverá reabrir esta seção e cumprir o contrato completo.
- `INTERFACE.md` deverá registrar os blocos Svelte, estados e consumidores durante a implementação; não é alterado nesta Draft.

#### Revisão visual durante o desenvolvimento

- Futura implementação deve revisar 320px/1440px, claro/escuro,
  loading/vazio/erro/sucesso/conflito, teclado, zoom e ausência de overflow,
  conferindo bordas, espaçamentos, margens, padding, tipografia, alinhamento,
  foco e conteúdo curto/longo; nenhuma verificação visual foi executada nesta fase.

#### APIs expostas

- Futuro bridge Tauri tipado: `agent.profile.save`, `agent.profile.revoke`, `agent.run.start`, `agent.run.cancel`, `agent.proposal.apply`; request não contém segredo persistente além do fluxo nativo de configuração e response nunca contém chave. Erros são códigos redigidos/versionados.
- Futuro PWA gateway adapter: preflight HTTPS sem conteúdo seguido de `POST`/stream de execução com token opaco em memória e contexto mínimo, sem endpoint OpenBible obrigatório; sessão dura no máximo 60 minutos.

#### APIs externas utilizadas

- Provedor de IA escolhido pela pessoa via adapter Tauri/gateway. A primeira fatia define somente geração textual sem ferramentas; um adapter OpenAI pode usar a Responses API a partir do backend, seguindo exclusivamente documentação oficial, sem fixar modelo na spec.

#### Documentação das APIs consultadas

- OpenAI API Reference e Best Practices for API Key Safety, além do README/wiki
  oficial de `open-source-cooperative/keyring-rs`, estão indexados na seção 2.
  Fontes locais do bridge, Tauri, storage e service worker também estão ali.

#### Eventos e outros contratos

- Eventos internos futuros: `AgentRunStarted`, `AgentRunProgress`, `AgentRunCompleted`, `AgentRunFailed`, `AgentRunCancelled`, `AgentProposalStale`, `AgentProposalApplied`; todos carregam IDs/estado redigidos, não prompt/resposta/chave.
- `WorkspaceActivated` (SPEC-0016) invalida seleção/proposta de geração anterior; sincronização não transporta segredo nem estado operacional local.

### 11. Estratégia TDD

- **Unidade**: validação de escopo, redaction, máquina de estados, seleção de contexto, prompt como dado e aplicação atômica.
- **Integração/contrato**: bridge Tauri↔Rust/cofre, adapter gateway↔sessão, `WorkspaceStorage`↔repositórios canônicos e service worker fora do fluxo.
- **BDD/aceite**: AC-001–AC-015 nesta seção 6 são a referência; cada AC possui um RED explícito com marcador SPECSFY.
- **Runner TDD**: Vitest focal no web foi executado com os 15 REDs convertidos em GREEN; `cargo test` permanece predecessor de implementação da boundary Rust/cofre.
- **E2E**: configuração Tauri, dois workspaces, PWA sem/com gateway e revisão/aplicação, após escolha de cofre/gateway.
- **Verificação manual**: inspeção de bundle, IPC, cofre, logs e storage somente após implementação; necessária para confirmar ausência de segredo onde testes não observam o SO.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001/002/003, NFR-001/007, AC-001/002/003/015 | AC-001/002/003/015 | `agent-profile-red.test.ts`, `agent-run-red.test.ts`, `agent-observability-red.test.ts`, `commands/ai_test.rs` | RED histórico: 4 casos web falharam por seam ausente; predecessor Rust foi materializado em T017 | GREEN: perfil, execução redigida, observabilidade e boundary nativa passaram | Refactor: seam web centralizada e cofre `keyring` sem fallback em arquivo/SQLite |
| US-002, FR-004/005/006/012, NFR-002/003/006, AC-004/005/006 | AC-004/005/006 | `context-red.test.ts` | RED histórico: 3 casos falharam na asserção da seam ausente | GREEN: workspace/generation, paths relativos e ausência de tools passaram | Refactor: contexto mínimo e rejeição de generation obsoleta |
| US-003, FR-007/008/011/012, NFR-002/004/008, AC-007/008/009/014 | AC-007/008/009/014 | `proposal-red.test.ts`, `agent-failure-red.test.ts` | RED histórico: 4 casos falharam na seam ausente | GREEN: preview, rejeição, aplicação revalidada e cancelamento passaram | Refactor: aplicação usa temporário e confirmação explícita |
| US-004, FR-009/010/011, NFR-003/005/007/009, AC-010/011/012/013 | AC-010/011/012/013 | `gateway-red.test.ts`, `service-worker-boundary-red.test.ts` | RED histórico: 4 casos falharam na seam ausente | GREEN: preflight, sessão, revogação, falha e capability fora do service worker passaram | Refactor: token somente em memória e gateway sem envio implícito |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenários BDD | Nível futuro | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001/002/003, NFR-001/007 | AC-001, AC-002, AC-003, AC-015 | Unidade + domínio | `apps/web/src/lib/features/ai/workspace-agent-fixture.ts`, `agent-profile-red.test.ts`, `agent-run-red.test.ts`, `agent-observability-red.test.ts` | Passed: GREEN focal e geral; JSON redigido sem segredo |
| FR-004/005/006/012, NFR-002/003/006 | AC-004, AC-005, AC-006, AC-014 | Unidade + contrato | `apps/web/src/lib/features/ai/context-red.test.ts`, `agent-failure-red.test.ts` | Passed: GREEN focal e geral; fixture prepara WorkspaceStorage real |
| FR-007/008/011/012, NFR-002/004/008 | AC-007, AC-008, AC-009, AC-014 | Unidade + aplicação canônica | `apps/web/src/lib/features/ai/proposal-red.test.ts`, `agent-failure-red.test.ts` | Passed: GREEN focal e geral; arquivo autoral preservado antes/depois |
| FR-009/010/011, NFR-003/005/007/009 | AC-010, AC-011, AC-012, AC-013 | Contrato + PWA | `apps/web/src/lib/features/ai/gateway-red.test.ts`, `service-worker-boundary-red.test.ts` | Passed: GREEN focal e geral; SW não é backend |
| NFR-008 | AC-007, AC-008, AC-010, AC-012 | Interface entregue | `AgentCapabilityPanel.svelte`, `AgentContextPicker.svelte`, `AgentProposalReview.svelte`, `ai-interface.test.ts` | Passed: GREEN browser em 320/1440 px; foco, teclado, estados stale/erro/vazio e overflow verificados |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed em 2026-09-05 — READY; formato válido, cobertura mínima confirmada e fronteiras de segredo, gateway, retenção e autoria revisadas.
  - **Comando histórico**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md`.
- **FIND-SEC-001** [P1] [Resolved] cofre, sessão PWA e retenção estavam genéricos — Refs: FR-001, FR-002, FR-009, NFR-001, NFR-009 — Evidence: specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md:75 — Effect: uma implementação poderia persistir segredo/token ou conteúdo transitório em superfícies portáteis — Suggestion: resolvido com credential store nativo sem fallback, preflight, token em memória por até 60 minutos e conteúdo transitório em memória.
- **FIND-ARCH-001** [P1] [Resolved] perfil autoral e binding do aparelho estavam misturados — Refs: FR-012, FR-001 — Evidence: specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md:116 — Effect: endpoint e `secretRef` poderiam entrar em workspace, backup ou sync — Suggestion: resolvido separando `PortableAgentProfile` JSON de `DeviceAgentBinding` local.
- **FIND-PROD-001** [P2] [Resolved] primeira capability permitia interpretar “agente” como ferramentas autônomas — Refs: FR-012, FR-006 — Evidence: specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md:108 — Effect: superfície de prompt injection e escrita seria maior que o necessário — Suggestion: resolvido limitando a fatia a geração textual sem ferramentas e uma proposta por documento com confirmação.

#### Gate do Ato II — Plano

- **Resultado**: Passed em 2026-09-05 — tarefas, interface, focal RED e rastreabilidade válidos; pronto para implementação posterior.
  - **Comando histórico**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md`; `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md`; `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md apps/web/src/lib/features/ai --full-chain`; `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0020-agentes-ia-locais-controlados-workspace/spec.md`.
- **Achados**: 29 tarefas/174 itens canônicos, 40/40 IDs cobertos, 15 REDs executados em 8 arquivos; todos falham pela ausência da exportação de domínio `executeAgent`/`runAgentCommand`, sem importação/sintaxe quebrada.

#### Gate do Ato III — Entrega

  - **Resultado**: Passed em 2026-09-07; domínio web, cofre Rust/Tauri, capability PWA, seleção de contexto, revisão de proposta, regressão e interface foram entregues.
  - **Comandos**: `bun run --cwd apps/web test:tdd -- --project server --maxWorkers=2`; `bun run --cwd apps/web test:tdd -- --project client --maxWorkers=1`; `bun run --cwd apps/web check-types`; `bunx eslint apps/web/src/lib/features/ai apps/web/vitest.config.ts`; `bun run --cwd apps/web build`; `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`; `cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml -- --check`; `node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check`; `node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check`.
  - **Achados**: regressão controlada passou com 172 arquivos/575 testes (149 server/460 testes e 23 client/115 testes), T027 passou com 4 testes de rastreabilidade, Rust passou com 20 testes, build e checks estáticos passaram. A execução paralela sem limite apresentou falhas de infraestrutura (`Unknown system error -122`/iframe CORS), reproduzidas sem asserções RED e resolvidas com workers controlados.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P1] [TEST] [TDD] [US-001] Derivar RED do AC-001 em apps/web/src/lib/features/ai/agent-profile-red.test.ts — Refs: US-001, FR-001, FR-003, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T002 [P1] [TEST] [TDD] [US-001] Derivar RED do AC-002 em apps/web/src/lib/features/ai/agent-run-red.test.ts — Refs: US-001, FR-002, FR-004, NFR-001, NFR-005, AC-002 — Depends: T001
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T003 [P1] [TEST] [TDD] [US-001] Derivar RED do AC-003 em apps/web/src/lib/features/ai/agent-profile-red.test.ts — Refs: US-001, FR-001, FR-003, NFR-001, NFR-007, AC-003 — Depends: T001
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T004 [P1] [TEST] [TDD] [US-002] Derivar RED do AC-004 em apps/web/src/lib/features/ai/context-red.test.ts — Refs: US-002, FR-004, FR-005, FR-006, FR-012, NFR-002, NFR-003, NFR-006, AC-004 — Depends: T001
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T005 [P1] [TEST] [TDD] [US-002] Derivar RED do AC-005 em apps/web/src/lib/features/ai/context-red.test.ts — Refs: US-002, FR-005, FR-006, FR-011, NFR-002, NFR-003, AC-005 — Depends: T004
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T006 [P1] [TEST] [TDD] [US-002] Derivar RED do AC-006 em apps/web/src/lib/features/ai/context-red.test.ts — Refs: US-002, FR-005, FR-006, FR-012, NFR-001, NFR-002, NFR-006, AC-006 — Depends: T004
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T007 [P1] [TEST] [TDD] [US-003] Derivar RED do AC-007 em apps/web/src/lib/features/ai/proposal-red.test.ts — Refs: US-003, FR-007, FR-012, NFR-004, NFR-008, AC-007 — Depends: T004
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T008 [P1] [TEST] [TDD] [US-003] Derivar RED do AC-008 em apps/web/src/lib/features/ai/proposal-red.test.ts — Refs: US-003, FR-007, FR-008, FR-012, NFR-002, NFR-004, NFR-008, AC-008 — Depends: T007
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T009 [P1] [TEST] [TDD] [US-003] Derivar RED do AC-009 em apps/web/src/lib/features/ai/proposal-red.test.ts — Refs: US-003, FR-007, FR-008, FR-011, NFR-002, NFR-004, NFR-008, AC-009 — Depends: T007
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T010 [P1] [TEST] [TDD] [US-004] Derivar RED do AC-010 em apps/web/src/lib/features/ai/gateway-red.test.ts — Refs: US-004, FR-009, FR-010, NFR-003, NFR-005, NFR-007, NFR-009, AC-010 — Depends: T001
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T011 [P1] [TEST] [TDD] [US-004] Derivar RED do AC-011 em apps/web/src/lib/features/ai/gateway-red.test.ts — Refs: US-004, FR-009, FR-010, NFR-003, NFR-005, NFR-009, AC-011 — Depends: T010
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T012 [P1] [TEST] [TDD] [US-004] Derivar RED do AC-012 em apps/web/src/lib/features/ai/gateway-red.test.ts — Refs: US-004, FR-009, FR-010, FR-011, NFR-005, NFR-007, NFR-009, AC-012 — Depends: T011
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T013 [P1] [TEST] [TDD] [US-004] Derivar RED do AC-013 in apps/web/src/lib/features/ai/service-worker-boundary-red.test.ts — Refs: US-004, FR-010, FR-011, NFR-001, NFR-005, NFR-007, NFR-009, AC-013 — Depends: T010
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T014 [P1] [TEST] [TDD] [US-003] Derivar RED do AC-014 em apps/web/src/lib/features/ai/agent-failure-red.test.ts — Refs: US-001, US-002, US-003, FR-002, FR-007, FR-008, NFR-004, NFR-005, NFR-006, AC-014 — Depends: T002, T008
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

- [x] T015 [P1] [TEST] [TDD] [US-004] Derivar RED do AC-015 em apps/web/src/lib/features/ai/agent-observability-red.test.ts — Refs: US-001, US-003, US-004, FR-003, FR-008, FR-012, NFR-001, NFR-007, NFR-009, AC-015 — Depends: T003, T012
  - [x] **PREP**: Ler AC/FR/NFR, confirmar seam pública ou contrato previsto e escolher o menor nível de teste.
  - [x] **EXECUTE**: Escrever teste Vitest/Rust com marcador SPECSFY e fixture real, sem mockar a fronteira sob prova.
  - [x] **VERIFY**: Executar focal e observar RED por comportamento ausente, nunca por importação, sintaxe ou ambiente.
  - [x] **VISUAL**: Não aplicável: tarefa de contrato sem mudança de interface.
  - [x] **EVIDENCE**: Registrar arquivo, marcador, comando, saída RED e IDs nas seções 11–12.
  - [x] **IMPROVE**: Registrar melhoria de seam/fixture/redaction ou justificar nenhuma.

#### Fase de produção e dados

- [x] T016 [P1] [CODE] [US-001] Separar PortableAgentProfile e DeviceAgentBinding em `apps/web/src/lib/features/ai/agent-profile.ts` — Refs: US-001, FR-001, FR-003, FR-012, NFR-001, NFR-003, AC-001, AC-003, AC-015 — Depends: T001, T003, T015
  - [x] **PREP**: Contrato portátil/local e REDs T001/T003/T015 confirmados.
  - [x] **EXECUTE**: Tipos e serialização implementados sem endpoint, provider ou segredo no perfil portátil.
  - [x] **VERIFY**: Testes de perfil e inspeção de JSON passaram sem segredo.
  - [x] **VISUAL**: Não aplicável: tarefa de boundary de domínio sem tela alterada.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Binding permanece separado e não entra em backup/sync/export.

  <!-- specsfy:evidence {"task":"T016","refs":["US-001","FR-001","FR-003","FR-012","NFR-001","NFR-003","AC-001","AC-003","AC-015"],"files":["apps/web/src/lib/features/ai/agent-profile.ts","apps/web/src/lib/features/ai/agent-profile-red.test.ts","apps/web/src/lib/features/ai/workspace-agent-fixture.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web test:tdd","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T017 [P1] [CODE] [US-001] Implementar credential store Rust/Tauri nativo sem fallback e comandos redigidos em `apps/desktop/src-tauri/src/commands/ai.rs` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-007, AC-001, AC-002, AC-003, AC-015 — Depends: T001, T002, T003, T015
  - [x] **PREP**: API `keyring` nativa, ausência de fallback e predecessores RED confirmados.
  - [x] **EXECUTE**: Boundary Rust/Tauri, allowlist IPC e respostas sem material secreto implementadas.
  - [x] **VERIFY**: Rust (20 testes), bridge (5 testes), TypeScript, lint e `cargo fmt --check` passaram.
  - [x] **VISUAL**: Não aplicável: tarefa de boundary nativa sem tela; estados de capability ficam para T025.
  - [x] **EVIDENCE**: Comandos e saídas registrados no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Não há fallback; o segredo só é encaminhado ao credential store e não entra em retorno/log/workspace.

  <!-- specsfy:evidence {"task":"T017","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","NFR-007","AC-001","AC-002","AC-003","AC-015"],"files":["apps/desktop/src-tauri/Cargo.toml","apps/desktop/src-tauri/Cargo.lock","apps/desktop/src-tauri/src/commands/ai.rs","apps/desktop/src-tauri/src/commands/ai_test.rs","apps/desktop/src-tauri/src/commands/mod.rs","apps/desktop/src-tauri/src/lib.rs","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-bridge.test.ts",".specsfy/STACK.md","docs/"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml -- --check","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/storage/tauri-bridge.ts apps/web/src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T018 [P1] [CODE] [US-002] Implementar seleção por workspace/generation, paths relativos e primeira fatia sem tools em `apps/web/src/lib/features/ai/agent-context.ts` — Refs: US-002, FR-004, FR-005, FR-006, FR-012, NFR-002, NFR-003, NFR-006, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Contrato WorkspaceStorage, geração, allowlist e fixture autoral confirmados.
  - [x] **EXECUTE**: Seleção determinística implementada com paths relativos e sem chamadas de ferramenta.
  - [x] **VERIFY**: REDs T004/T005/T006 convertidos em GREEN, incluindo workspace/generation divergente.
  - [x] **VISUAL**: Não aplicável: tarefa de boundary de contexto sem tela alterada.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Contexto reduzido ao selecionado e caminhos absolutos rejeitados.

  <!-- specsfy:evidence {"task":"T018","refs":["US-002","FR-004","FR-005","FR-006","FR-012","NFR-002","NFR-003","NFR-006","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/ai/agent-context.ts","apps/web/src/lib/features/ai/context-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T019 [P1] [CODE] [US-002] Implementar AgentRun textual cancelável com orçamento, timeout e erro redigido em `apps/web/src/lib/features/ai/agent-run.ts` — Refs: US-002, FR-004, FR-006, FR-012, NFR-001, NFR-005, NFR-006, AC-002, AC-006, AC-014 — Depends: T002, T006, T014
  - [x] **PREP**: Orçamento, cancelamento, timeout e política de erro redigido confirmados.
  - [x] **EXECUTE**: Máquina textual implementada sem tools, shell ou escrita autônoma.
  - [x] **VERIFY**: Casos de execução, cancelamento e erro redigido passaram.
  - [x] **VISUAL**: Não aplicável: tarefa de máquina de domínio sem tela alterada.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Resultado e erros não incluem segredo nem prompt integral.

  <!-- specsfy:evidence {"task":"T019","refs":["US-002","FR-004","FR-006","FR-012","NFR-001","NFR-005","NFR-006","AC-002","AC-006","AC-014"],"files":["apps/web/src/lib/features/ai/agent-run.ts","apps/web/src/lib/features/ai/agent-run-red.test.ts","apps/web/src/lib/features/ai/agent-failure-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web test:tdd","exit":0}]} -->

- [x] T020 [P1] [CODE] [US-003] Implementar AIProposal e aplicação atômica/revalidação para um documento em `apps/web/src/lib/features/ai/ai-proposal.ts` — Refs: US-003, FR-007, FR-008, FR-012, NFR-002, NFR-004, NFR-008, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Hash/generation, diff, uma proposta por documento e formato canônico confirmados.
  - [x] **EXECUTE**: Proposta em memória e aplicação explícita/revalidada implementadas.
  - [x] **VERIFY**: Preview, rejeição, conflito e aplicação atômica passaram.
  - [x] **VISUAL**: Não aplicável: revisão visual ficará na tarefa T029.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Não há mutação implícita; aplicação usa confirmação e temporário.

  <!-- specsfy:evidence {"task":"T020","refs":["US-003","FR-007","FR-008","FR-012","NFR-002","NFR-004","NFR-008","AC-007","AC-008","AC-009"],"files":["apps/web/src/lib/features/ai/ai-proposal.ts","apps/web/src/lib/features/ai/proposal-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T021 [P1] [CODE] [US-004] Implementar preflight HTTPS sem conteúdo e token PWA em memória por 60 minutos em `apps/web/src/lib/features/ai/pwa-gateway-session.ts` — Refs: US-004, FR-009, FR-010, NFR-003, NFR-005, NFR-009, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: HTTPS, preflight sem conteúdo, expiração e revogação confirmados.
  - [x] **EXECUTE**: Sessão opaca implementada somente em memória, sem persistência de chave.
  - [x] **VERIFY**: Preflight, expiry e revocation passaram sem vazamento de payload.
  - [x] **VISUAL**: Não aplicável: capability visual ficará na tarefa T025.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Retenção limitada a no máximo 60 minutos e token opaco.

  <!-- specsfy:evidence {"task":"T021","refs":["US-004","FR-009","FR-010","NFR-003","NFR-005","NFR-009","AC-010","AC-011","AC-012"],"files":["apps/web/src/lib/features/ai/pwa-gateway-session.ts","apps/web/src/lib/features/ai/gateway-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T022 [P1] [CODE] [US-004] Implementar gateway PWA e falhas sem envio, mantendo service worker fora em `apps/web/src/lib/features/ai/ai-gateway.ts` — Refs: US-004, FR-009, FR-010, FR-011, NFR-005, NFR-007, NFR-009, AC-010, AC-011, AC-012, AC-013 — Depends: T010, T011, T012, T013
  - [x] **PREP**: Gateway confiável, ausência de cloud obrigatória e limite do SW confirmados.
  - [x] **EXECUTE**: Cliente gateway implementado com falhas explícitas e sem lógica de backend no SW.
  - [x] **VERIFY**: Bloqueio sem preflight, erro de gateway e boundary do SW passaram.
  - [x] **VISUAL**: Não aplicável: capability visual ficará na tarefa T025.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Sem retry silencioso, conteúdo em preflight ou dependência implícita.

  <!-- specsfy:evidence {"task":"T022","refs":["US-004","FR-009","FR-010","FR-011","NFR-005","NFR-007","NFR-009","AC-010","AC-011","AC-012","AC-013"],"files":["apps/web/src/lib/features/ai/ai-gateway.ts","apps/web/src/lib/features/ai/service-worker-boundary-red.test.ts","apps/web/src/lib/features/ai/gateway-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai","exit":0}]} -->

- [x] T023 [P1] [CODE] [US-003] Implementar redaction, retenção transitória e anel sanitizado de 200 eventos/sete dias em `apps/web/src/lib/features/ai/ai-observability.ts` — Refs: US-001, US-003, US-004, FR-003, FR-008, FR-012, NFR-001, NFR-007, NFR-009, AC-003, AC-014, AC-015 — Depends: T003, T014, T015
  - [x] **PREP**: Campos proibidos, expiração e anel sanitizado confirmados.
  - [x] **EXECUTE**: Redaction implementada antes do diagnóstico, com retenção transitória limitada.
  - [x] **VERIFY**: Inspeção de logs e snapshot redigido passaram; limite de 200 eventos aplicado.
  - [x] **VISUAL**: Não aplicável: diagnóstico visual ficará na tarefa T025/T029.
  - [x] **EVIDENCE**: Evidência registrada no bloco `specsfy:evidence` desta tarefa.
  - [x] **IMPROVE**: Campos de conteúdo, token e chave não são expostos no snapshot.

  <!-- specsfy:evidence {"task":"T023","refs":["US-001","US-003","US-004","FR-003","FR-008","FR-012","NFR-001","NFR-007","NFR-009","AC-003","AC-014","AC-015"],"files":["apps/web/src/lib/features/ai/ai-observability.ts","apps/web/src/lib/features/ai/agent-observability-red.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai","exit":0},{"run":"bun run --cwd apps/web test:tdd","exit":0}]} -->

- [x] T024 [P1] [DOC] Atualizar `INTERFACE.md`, `PROJECT.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` e reconstruir `docs/` — Refs: FR-001, FR-004, FR-007, FR-009, NFR-008, AC-007, AC-010 — Depends: T016, T018, T020, T021
  - [x] **PREP**: Decisões, entidades e superfícies introduzidas foram auditadas.
  - [x] **EXECUTE**: Documentação canônica e inventários atualizados sem fonte paralela.
  - [x] **VERIFY**: Documentator e monitores passaram com caminhos consistentes.
  - [x] **VISUAL**: Não aplicável: documentação técnica; exemplos de interface continuam nas tarefas T025/T028/T029.
  - [x] **EVIDENCE**: Arquivos reconstruídos e validações registrados abaixo.
  - [x] **IMPROVE**: Duplicações removidas; somente decisões sustentadas foram preservadas.

  <!-- specsfy:evidence {"task":"T024","refs":["FR-001","FR-004","FR-007","FR-009","NFR-008","AC-007","AC-010"],"files":["INTERFACE.md","PROJECT.md",".specsfy/RULES.md",".specsfy/DATABASE.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->
#### Fase de interface

Atualizar `INTERFACE.md` com os blocos e componentes usados nesta fase.

- [x] T025 [P1] [CODE] [US-001] Implementar `AgentCapabilityPanel.svelte` em `apps/web/src/lib/features/ai/AgentCapabilityPanel.svelte` — Refs: US-001, US-004, FR-001, FR-009, FR-010, NFR-008, AC-001, AC-010 — Depends: T016, T017, T021
  - [x] **PREP**: Confirmar estados de capability e acessibilidade.
  - [x] **EXECUTE**: Implementar painel Svelte com estados explícitos e sem segredo no cliente.
  - [x] **VERIFY**: Executar testes de teclado, foco, mobile/desktop e tema claro/escuro.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding, tipografia; revisar curto/longo sem overflow.
  - [x] **EVIDENCE**: Registrar screenshots/commands e AC-001/010.
  - [x] **IMPROVE**: Corrigir hierarquia, foco e mensagens sem cor ornamental.

  <!-- specsfy:evidence {"task":"T025","refs":["US-001","US-004","FR-001","FR-009","FR-010","NFR-008","AC-001","AC-010"],"files":["apps/web/src/lib/features/ai/AgentCapabilityPanel.svelte","apps/web/src/lib/features/config/ConfigPage.svelte","INTERFACE.md","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai/AgentCapabilityPanel.svelte apps/web/src/lib/features/config/ConfigPage.svelte","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T028 [P1] [CODE] [US-002] Implementar `AgentContextPicker.svelte` em `apps/web/src/lib/features/ai/AgentContextPicker.svelte` — Refs: US-002, FR-004, FR-005, FR-006, NFR-008, AC-004, AC-005, AC-006 — Depends: T018, T019
  - [x] **PREP**: Confirmar seleção por workspace, geração e paths relativos.
  - [x] **EXECUTE**: Implementar picker acessível sem expor handles ou caminhos absolutos.
  - [x] **VERIFY**: Executar foco, teclado, vazio, erro e seleção de conteúdo longo.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding, tipografia; revisar mobile/desktop, claro/escuro, zoom e reduced motion.
  - [x] **EVIDENCE**: Registrar cenários e AC-004/005/006.
  - [x] **IMPROVE**: Simplificar escolha e explicar bloqueios sem perder contexto.

  <!-- specsfy:evidence {"task":"T028","refs":["US-002","FR-004","FR-005","FR-006","NFR-008","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/ai/AgentContextPicker.svelte","apps/web/src/lib/features/ai/agent-context-picker.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai/agent-context-picker.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai/AgentContextPicker.svelte apps/web/src/lib/features/ai/agent-context-picker.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T029 [P1] [CODE] [US-003] Implementar `AgentProposalReview.svelte` em `apps/web/src/lib/features/ai/AgentProposalReview.svelte` — Refs: US-003, FR-007, FR-008, NFR-008, AC-007, AC-008, AC-009 — Depends: T020
  - [x] **PREP**: Confirmar diff, conflito, rejeição e aplicação explícita.
  - [x] **EXECUTE**: Implementar revisão Svelte sem mutação automática do documento.
  - [x] **VERIFY**: Executar aceitar/rejeitar/conflito, teclado e conteúdo longo.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding, tipografia; revisar diff, estados sem overflow e confirmação.
  - [x] **EVIDENCE**: Registrar cenários e AC-007/008/009.
  - [x] **IMPROVE**: Melhorar hierarquia e mensagens de conflito preservando autoria.

  <!-- specsfy:evidence {"task":"T029","refs":["US-003","FR-007","FR-008","NFR-008","AC-007","AC-008","AC-009"],"files":["apps/web/src/lib/features/ai/AgentProposalReview.svelte","apps/web/src/lib/features/ai/agent-proposal-review.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai/agent-proposal-review.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai/AgentProposalReview.svelte apps/web/src/lib/features/ai/agent-proposal-review.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase final — Qualidade e rastreabilidade

- [x] T026 [P1] [TEST] [TDD] [US-003] Testar interface, validação, recuperação, foco e teclado em `apps/web/src/lib/features/ai/ai-interface.test.ts` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-004, FR-007, FR-009, FR-010, NFR-008, AC-007, AC-008, AC-010, AC-012 — Depends: T025, T028, T029
  - [x] **PREP**: Confirmar contratos de acessibilidade e comportamento dos três componentes.
  - [x] **EXECUTE**: Materializar cenários Vitest/BDD sem flags globais ou expect(false).
  - [x] **VERIFY**: Executar focal e garantir RED somente por comportamento ausente.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding, tipografia; validar claro/escuro, mobile/desktop, zoom, teclado e reduced motion.
  - [x] **EVIDENCE**: Registrar marcador, comando, saída e AC cobertos.
  - [x] **IMPROVE**: Ajustar casos que falhem por importação, sintaxe ou ambiente.

  <!-- specsfy:evidence {"task":"T026","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-004","FR-007","FR-009","FR-010","NFR-008","AC-007","AC-008","AC-010","AC-012"],"files":["apps/web/src/lib/features/ai/ai-interface.test.ts","apps/web/src/lib/features/ai/AgentCapabilityPanel.svelte","apps/web/src/lib/features/ai/AgentContextPicker.svelte","apps/web/src/lib/features/ai/AgentProposalReview.svelte","apps/web/vitest.config.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai/ai-interface.test.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai/ai-interface.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T027 [P1] [TEST] [TDD] Executar regressão e rastreabilidade em `apps/web/src/lib/features/ai/ai-regression.test.ts` e `apps/desktop/src-tauri/src/commands/ai_test.rs` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, todos os NFRs e ACs — Depends: T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T028, T029
  - [x] **PREP**: Confirmar todos os predecessores, banco sem migração e comandos focais.
  - [x] **EXECUTE**: Executar Vitest, cargo test, checks estáticos, inspeção de bundle/storage/logs e traceability.
  - [x] **VERIFY**: Confirmar cobertura de todos os IDs e ausência de segredo em artefatos.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding, tipografia; revisar interface e estados finais.
  - [x] **EVIDENCE**: Registrar relatório focal, rastreabilidade e decisões de gate.
  - [x] **IMPROVE**: Abrir correção específica para cada lacuna, sem mascarar falhas.

  <!-- specsfy:evidence {"task":"T027","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","FR-007","FR-008","FR-009","FR-010","FR-011","FR-012","NFR-001","NFR-002","NFR-003","NFR-004","NFR-005","NFR-006","NFR-007","NFR-008","NFR-009","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015"],"files":["apps/web/src/lib/features/ai/ai-regression.test.ts","apps/web/src/lib/features/ai/agent-context.ts","apps/web/src/lib/features/ai/ai-proposal.ts","apps/web/src/lib/features/ai/ai-observability.ts","apps/desktop/src-tauri/src/commands/ai.rs","apps/desktop/src-tauri/src/commands/ai_test.rs","apps/web/vitest.config.ts","docs/"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/ai/ai-regression.test.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- --project server --maxWorkers=2","exit":0},{"run":"bun run --cwd apps/web test:tdd -- --project client --maxWorkers=1","exit":0},{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml -- --check","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bunx eslint apps/web/src/lib/features/ai apps/web/vitest.config.ts","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T003 → T016/T017 → T004/T005/T006 → T018/T019 → T007/T008/T009 → T020 → T010/T011/T012/T013 → T021/T022 → T023 → T025 → T026/T027.
- Paralelismo seguro: T001/T003 e T004 podem preparar contratos distintos; T010/T011/T012/T013 podem executar em paralelo após o contrato de contexto, sempre preservando seus predecessores.
- Fatiamento: desktop Tauri (perfil, cofre, contexto e proposta) é a primeira fatia executável; PWA permanece capability explícita sem chave persistida e sem service worker como backend.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016/0017: workspace ativo, geração, isolamento e IDs.
- SPEC-0017/0018: Markdown/JSON canônicos, sidecars e índice reconstruível.
- SPEC-0018/0019 e SPEC-0019/0020: backup e sync sem estado local/credencial.
- Credential store nativo disponível no target e gateway HTTPS opcional controlado pela pessoa.

#### Riscos

- Vazamento em IPC, bundle, erro ou log → segredo somente no backend/cofre, redaction e inspeção manual.
- Prompt injection → conteúdo como dado, ferramentas desabilitadas e autorização independente.
- Aplicar resultado após troca de workspace → `workspaceId`/generation/hash e revalidação.
- Gateway virar dependência implícita → capability indisponível sem ele e uso local preservado.
- Retenção acidental de contexto → memória com expiração, limpeza no reload e diagnóstico limitado a 200 eventos/sete dias.

#### Suposições

- Pessoa usuária individual controla o desktop, o provedor e eventual gateway confiável.
- O OpenBible não opera conta, cobrança ou nuvem obrigatória para esse recurso.
- Contrato `WorkspaceStorage` e formatos canônicos serão preservados pelas fatias anteriores.

### 17. Decisões

- **DEC-001**: BYOK desktop somente no backend Tauri/cofre seguro do SO — reduz exposição no frontend e preserva portabilidade; alternativa de chave em web foi rejeitada pelo requisito de segurança.
- **DEC-002**: PWA somente gateway confiável/token de sessão ou resultado sincronizado — respeita a ausência de backend persistente no service worker; alternativa de API key no PWA foi rejeitada.
- **DEC-003**: Markdown/JSON continuam canônicos e saída é proposta — mantém autoria e interoperabilidade; escrita automática foi rejeitada.
- **DEC-004**: sem nuvem OpenBible obrigatória — mantém local-first; gateway/provedor são opcionais e explícitos.
- **DEC-005**: service worker fica fora do domínio de IA — seu papel atual é cache/navegação e não há garantia de processo persistente.
- **DEC-006**: provedores OpenAI, se selecionados depois, serão especificados a partir de fontes oficiais da OpenAI; nenhuma API foi presumida nesta Draft.
- **DEC-007**: primeira fatia sem ferramentas e com uma proposta por documento — reduz superfície de prompt injection e mantém autorização humana granular.
- **DEC-008**: credential store nativo sem fallback em arquivo — ausência do cofre desabilita BYOK em vez de enfraquecer a proteção.
- **DEC-009**: gateway PWA com preflight e token em memória por até 60 minutos — evita chave do provedor e persistência silenciosa no browser.
- **DEC-010**: perfil portátil separado do binding do aparelho — instruções autorais podem sobreviver ao app, enquanto provider, endpoint e segredo não sincronizam.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes, inspeções de cofre/IPC, checks estáticos e acessibilidade passam.
- [x] `.specsfy/DATABASE.md` e `PROJECT.md` refletem perfil portátil, binding local e capacidade de IA quando implementados.

Entrega concluída em 2026-09-07. O storage local continua sendo a autoridade: notas e estado operacional permanecem em `app.sqlite` no Tauri ou IndexedDB no PWA; a sincronização e as capabilities externas são opcionais e nunca recebem segredos.
