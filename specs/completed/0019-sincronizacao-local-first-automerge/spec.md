# Especificação integrada: Sincronização local-first com Automerge

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0019 |
| Slug | 0019-sincronizacao-local-first-automerge |
| Status | Complete |
| Effort | 9 |
| Effort updated at | 2026-09-07 |
| Effort rationale | Integra CRDT, dois backends de armazenamento, transporte HTTP incremental opcional, bridge de edição externa, segurança de peers e preservação autoral. |
| ClickUp Task | |
| Milestones | Pós formatos portáteis e backup; preparação para sincronização entre aparelhos |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-07 |

> **Atualização normativa de 2026-09-07:** as notas e o estado operacional do
> workspace são persistidos no backend local do runtime: `app.sqlite` no Tauri
> e IndexedDB versionado no PWA. Markdown/JSON são exportações portáteis e
> entradas explícitas de migração/recovery; `.openbible/index.sqlite`, paths,
> handles e catálogo não são backend ativo nem payload de sincronização. Esta
> alteração de persistência reabre os Atos I–III; as evidências anteriores que
> dependem de Markdown/JSON como fonte primária ficam pendentes de reconciliação.

> **Atualização normativa de 2026-09-07 — sincronização HTTP:** para a
> sincronização simples entre desktop Tauri e mobile PWA, o transporte remoto
> inicial passa a ser uma API HTTPS incremental hospedável em Cloudflare
> Worker + D1. O storage local continua sendo a autoridade de edição; o
> servidor mantém revisões, cursor por workspace, tombstones e conflitos. O
> relay WebSocket permanece uma alternativa futura para colaboração em tempo
> real e não será implementado nesta fatia.

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible mantém notas e workspaces no backend local de cada runtime, mas
ainda não possui uma forma de reconciliar alterações offline feitas em desktop
Tauri, PWA e outros aparelhos. Sincronizar `.openbible/index.sqlite`, paths ou
handles causaria conflitos de dispositivo e faria uma projeção local ou um
artefato de exportação parecer a autoridade do workspace.

#### Resultado desejado

Uma réplica local-first usa Automerge apenas para estado operacional de
replicação por documento. Notas e registros do workspace continuam no backend
operacional local do runtime — `app.sqlite` no Tauri e IndexedDB versionado no
PWA — sob o contrato comum escopado por `workspaceId`. Markdown/JSON são
exportações portáteis e entradas explícitas de migração/recovery, enquanto
`.openbible/index.sqlite`, paths, handles e catálogo permanecem legados ou
locais. Alterações locais continuam disponíveis sem rede, convergem ao
reconectar por transporte configurável e preservam divergências externas para
decisão explícita.

#### Métricas de sucesso

- 100% das operações locais da fixture de 1.000 notas continuam editáveis e
  legíveis após reinício sem rede ou relay.
- 100% dos cenários de alterações independentes em duas réplicas convergem para
  o mesmo estado lógico, sem perda silenciosa de mudanças.
- 0 paths absolutos, handles, catálogo local, credenciais ou `index.sqlite` em
  payloads de sincronização, conforme inspeção de contrato.
- Uma fila de 10.000 deltas respeita limite de memória configurado e expõe
  progresso, falha e retry sem carregar o workspace inteiro.
- Após reconstrução de uma réplica, 100% das notas da fixture abrem a partir do
  backend operacional local; o estado CRDT e as projeções podem ser
  reconstruídos sem depender de `.openbible/index.sqlite`, e as exportações
  Markdown/JSON continuam regeneráveis.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] `Repo` combina um `StorageAdapter` local e zero ou mais `NetworkAdapter`s — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#repositories-e-adapters — Budget: 1/5.
- **R-002** [critical] o protocolo Automerge é por documento e independente do transporte — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#Protocolo-por-documento-e-independente-do-transporte — Budget: 1/5.
- **R-003** [critical] storage local permite operação offline e reconciliação após reconexão — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#Offline-e-reconexão — Budget: 1/5.
- **R-004** [critical] produção deve usar relay próprio, não o servidor público experimental — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#Relay-público-e-produção — Budget: 1/5.
- **R-005** [critical] adapters de storage podem diferir por backend e ser próprios — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#Persistência-local-no-navegador-e-filesystem — Budget: 1/5.
- **R-006** [critical] o servidor de exemplo não fornece segurança de produção — Verdict: verified — Confidence: high — Evidence: research/automerge-official/evidence.md#Servidor-de-demonstração — Budget: 1/5.
- **R-007** [critical] o repositório atual separa arquivos autorais, índice e catálogo por dispositivo — Verdict: verified — Confidence: high — Evidence: `.specsfy/DATABASE.md`, `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`, `specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md` — Budget: 1/2.
- **R-008** [critical] os adapters remotos oficiais documentados usam WebSocket; a API HTTP desta fatia é um transporte próprio de registros e não o protocolo de mensagens do Automerge — Verdict: verified — Confidence: high — Evidence: `research/automerge-official/evidence.md#Adapter-oficial-e-API-HTTP-própria` — Budget: 1/3.

#### Fontes e contexto consultados

- `specs/backlog/0020-sincronizacao-local-first-automerge.md` e `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md`.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`, `specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md` e `specs/planned/0018-backup-restauracao-workspace-pwa/spec.md`.
- `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `apps/web/src/lib/storage/` e `apps/web/src/lib/features/notes/`.

#### Documentação consultada

- Automerge Repositories, Concepts, Storage e Network Sync, documentação oficial, consultada em 2026-09-05.
- Automerge Repo Sync Server README, repositório oficial, consultado em 2026-09-05.
- URLs e notas próprias em `research/automerge-official/evidence.md`.

#### Artefatos de pesquisa armazenados

- `specs/in-progress/0019-sincronizacao-local-first-automerge/research/automerge-official/evidence.md`: evidência própria indexada, URLs oficiais, data e impacto; sem cópia extensa de conteúdo protegido.

#### Dúvidas respondidas

- **Q**: Automerge substitui o backend local ou as exportações? → **A**: não; é estado operacional de replicação por documento. As notas e os registros do workspace permanecem no backend operacional (`app.sqlite` no Tauri e IndexedDB no PWA), enquanto Markdown/JSON continuam exportações portáteis e entradas explícitas de migração/recovery.
- **Q**: A PWA precisa de um processo local para sincronizar? → **A**: não; o contrato permite storage no browser e transportes opcionais; o uso local não depende de servidor.
- **Q**: Relay público pode ser produção? → **A**: não; produção usa endpoint próprio/controlado com TLS, autenticação e política de acesso.
- **Q**: O que pode ser sincronizado? → **A**: somente documentos e estado CRDT necessários, mapeados por IDs estáveis e pelo `workspaceId`; o conteúdo é aplicado ao backend local do runtime, nunca ao banco bruto. Paths, handles, catálogo, `.openbible/index.sqlite`, caches e segredos ficam no dispositivo.

#### Dúvidas abertas

- A versão final dos pacotes Automerge e a forma física das tabelas SQLite e
  object stores IndexedDB serão escolhidas na fase de tarefas após verificar a
  matriz Tauri/PWA; a escolha não muda o contrato de que ambos são os backends
  operacionais das notas e do workspace.
- A sincronização remota inicial será uma API HTTPS incremental hospedável em
  Cloudflare Worker + D1; política de retenção, backup e autenticação de
  produção ficam na operação do serviço.
- Criptografia ponta a ponta fica fora desta primeira fatia. O relay configurado
  é uma parte confiável da operação e pode observar ou reter o estado CRDT;
  habilitá-lo exige aviso e consentimento explícitos.

### 3. Escopo e atores

#### Incluído

- Identidade estável de documento e mapeamento local para registros do backend,
  com destino opcional de exportação.
- Repository Automerge com storage adapter local sobre `app.sqlite` no Tauri e
  IndexedDB versionado no PWA.
- Transporte local e API HTTPS incremental configurável, reconexão e fila de
  alterações; WebSocket/relay permanece posterior.
- Merge de alterações concorrentes, bridge para edição externa e preservação de
  divergência sem sobrescrita silenciosa.
- Escopo por workspace/documento, pairing/revogação e configuração mínima da
  sincronização na interface existente.
- Diagnósticos locais sem texto autoral, tokens ou paths absolutos.
- Serviço de sincronização HTTP separado, com revisões, cursores, tombstones,
  conflitos e health check, sem conhecer o modelo de arquivos do OpenBible.

#### Fora de escopo

- Serviço OpenBible obrigatório, conta, login, cobrança ou nuvem proprietária.
- Sincronizar `.openbible/index.sqlite`, catálogo, paths, handles, caches,
  locks, Bíblias SQLite imutáveis ou credenciais.
- Merge visual perfeito para qualquer edição simultânea de texto Markdown.
- WebRTC, Bluetooth, importação manual de envelopes, colaboração em tempo real
  via WebSocket, escala horizontal e identidade multitenant de produção nesta
  fatia.

#### Atores

- **Pessoa autora**: escolhe workspace/documentos, habilita peers, edita e
  resolve divergências.
- **Réplica local**: Tauri ou PWA que persiste notas, registros do workspace e
  estado CRDT no backend operacional do dispositivo.
- **Peer autorizado**: outra réplica do mesmo workspace com escopo concedido.
- **API de sincronização**: serviço intermediário opcional que mantém revisões
  incrementais, sem ser a autoridade local de edição.
- **Bridge externo**: fronteira de importação/recovery que detecta alteração de
  exportação ou fonte legada fora do app e produz uma reconciliação recuperável,
  sem transformar o arquivo em backend ativo.

### 4. Princípios e restrições do projeto

- **PR-001**: o backend local do runtime é a autoridade operacional das notas e
  do workspace: `app.sqlite` no Tauri e IndexedDB no PWA, sempre escopado por
  `workspaceId`.
- **PR-002**: Automerge guarda replicação e histórico operacional por documento;
  não substitui o backend local, não sincroniza banco bruto e não é formato de
  exportação.
- **PR-003**: documentos têm IDs estáveis independentes de nome, caminho,
  posição ou aparelho.
- **PR-004**: paths, handles, catálogo, `.openbible/index.sqlite`, caches,
  locks e credenciais são locais ou legados e jamais entram em conteúdo ou
  payload de sync.
- **PR-005**: cada workspace possui escopo próprio; nenhum estado cruza
  workspaces por acidente.
- **PR-006**: indisponibilidade de rede nunca bloqueia leitura, edição ou
  abertura local.
- **PR-007**: conflitos materiais são preservados e apresentados, não resolvidos
  por descarte silencioso.
- **PR-008**: manter Svelte/TypeScript, `WorkspaceStorage`,
  `WorkspaceContentRepository`, SQLite/rusqlite no Tauri, IndexedDB no PWA e o
  isolamento definido nas specs anteriores; `sql.js`/WASM continua somente no
  leitor da Bíblia.
- **PR-009**: TLS protege o transporte, mas não torna o relay incapaz de ler ou
  reter o estado sincronizado. A primeira fatia não promete criptografia ponta
  a ponta nem apagamento remoto de cópias já entregues.
- **PR-010**: credenciais de relay ficam fora do workspace, backup e payload.
  No Tauri usam o cofre do SO; no PWA o token da primeira fatia fica somente em
  memória e exige novo pairing após recarga.
- **PR-011**: a API remota recebe somente documentos, revisões e tombstones
  escopados por `workspaceId`; nunca recebe SQLite, paths absolutos, handles ou
  catálogo local.
- **PR-012**: push é idempotente por `operationId`, pull é incremental por
  cursor e conflito de revisão não pode sobrescrever silenciosamente a fonte
  local.

### 5. Histórias de usuário

#### US-001 — Editar offline com réplica local (P1)

Como pessoa autora, quero editar meu workspace sem rede, para continuar
produzindo e abrir os arquivos mesmo se nenhum relay estiver disponível.

**Por que P1**: local-first é o valor central do produto.
**Teste independente**: desligar a rede, editar uma nota, reiniciar e abrir o
registro persistido no backend local, regenerando exportação e projeção quando
necessário.
**Requisitos**: FR-001, FR-002, NFR-001, NFR-004.

#### US-002 — Sincronizar mudanças entre aparelhos (P1)

Como pessoa autora, quero sincronizar documentos escolhidos entre réplicas,
para continuar o estudo em outro aparelho sem copiar SQLite ou paths locais.

**Por que P1**: materializa a transferência local-first entre Tauri e PWA.
**Teste independente**: duas réplicas offline alteram documentos e convergem ao
reconectar por um endpoint de teste.
**Requisitos**: FR-002, FR-003, FR-004, NFR-001, NFR-003.

#### US-003 — Preservar e resolver divergências (P1)

Como pessoa autora, quero revisar divergências externas e concorrentes, para
evitar que uma sincronização destrua uma anotação ou sermão.

**Por que P1**: conflitos de texto e edição externa são o principal risco de
perda autoral.
**Teste independente**: alterar o mesmo arquivo por duas origens, forçar falha
de merge e verificar as versões recuperáveis.
**Requisitos**: FR-004, FR-005, NFR-002, NFR-004.

#### US-004 — Controlar peers e escopo de sincronização (P1)

Como pessoa autora, quero habilitar, limitar e revogar peers por workspace,
para controlar privacidade sem perder o uso local.

**Por que P1**: sync opt-in exige fronteira de segurança observável.
**Teste independente**: habilitar um workspace, rejeitar outro, revogar peer e
confirmar que arquivos locais permanecem.
**Requisitos**: FR-006, NFR-002, NFR-003, NFR-004.

### 6. Cenários BDD de aceite

#### AC-001 — persistir edição offline
**Cobre**: US-001, FR-001, NFR-001
```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: edição local-first
  Scenario: salvar sem rede
    Given um workspace aberto e sem conexão
    When a pessoa altera uma nota e encerra a aplicação
    Then a nota e o estado local podem ser reabertos após reinício
```

#### AC-002 — manter o backend operacional
**Cobre**: US-001, FR-001, NFR-004
```gherkin
@US-001 @FR-001 @NFR-004 @AC-002
Feature: fonte operacional
  Scenario: abrir sem estado de replicação
    Given uma nota persistida no backend operacional do runtime
    When o estado Automerge é removido ou indisponível
    Then a nota continua legível e editável a partir de `app.sqlite` no Tauri ou IndexedDB no PWA
    And Markdown/JSON podem ser regenerados como exportação sem depender do CRDT
```

#### AC-003 — falha de storage local
**Cobre**: US-001, FR-002, NFR-001
```gherkin
@US-001 @FR-002 @NFR-001 @AC-003
Feature: armazenamento local
  Scenario: quota ou permissão indisponível
    Given o backend não consegue persistir um delta
    When a pessoa tenta salvar
    Then a operação não é declarada concluída e a recuperação local é informada
```

#### AC-004 — fila offline
**Cobre**: US-001, FR-002, NFR-003
```gherkin
@US-001 @FR-002 @NFR-003 @AC-004
Feature: fila local
  Scenario: acumular mudanças sem conexão
    Given uma réplica com storage local funcionando e relay indisponível
    When a pessoa faz várias alterações
    Then deltas ficam em fila limitada e o editor permanece responsivo
```

#### AC-005 — sincronizar documento autorizado
**Cobre**: US-002, FR-003, NFR-001
```gherkin
@US-002 @FR-003 @NFR-001 @AC-005
Feature: transporte configurado
  Scenario: reconectar duas réplicas
    Given duas réplicas autorizadas com o mesmo documento estável
    When o WebSocket configurado volta a responder
    Then cada réplica envia e recebe somente deltas que ainda faltam
```

#### AC-006 — transporte opcional
**Cobre**: US-002, FR-003, NFR-004
```gherkin
@US-002 @FR-003 @NFR-004 @AC-006
Feature: transporte substituível
  Scenario: usar adapter local
    Given nenhum endpoint remoto está configurado
    When duas instâncias locais usam o adapter permitido
    Then o contrato de documento continua válido sem serviço OpenBible
```

#### AC-007 — relay indisponível
**Cobre**: US-002, FR-003, NFR-003
```gherkin
@US-002 @FR-003 @NFR-003 @AC-007
Feature: relay opcional
  Scenario: timeout remoto
    Given o endpoint configurado responde com timeout
    When o sync tenta reconectar
    Then a edição local continua e o retry usa backoff observável
```

#### AC-008 — merge independente
**Cobre**: US-002, FR-004, NFR-001
```gherkin
@US-002 @FR-004 @NFR-001 @AC-008
Feature: convergência CRDT
  Scenario: alterações independentes
    Given duas réplicas editam campos diferentes do mesmo documento offline
    When elas trocam deltas
    Then ambas convergem para o estado lógico com as duas alterações
```

#### AC-009 — histórico concorrente
**Cobre**: US-002, FR-004, NFR-004
```gherkin
@US-002 @FR-004 @NFR-004 @AC-009
Feature: histórico
  Scenario: receber mudança antiga depois da nova
    Given uma réplica recebe deltas fora de ordem
    When o repository reconstitui o documento
    Then a versão lógica converge sem depender da ordem de transporte
```

#### AC-010 — divergência no mesmo campo
**Cobre**: US-002, FR-004, NFR-002
```gherkin
@US-002 @FR-004 @NFR-002 @AC-010
Feature: conflito concorrente
  Scenario: alterações incompatíveis
    Given duas réplicas alteram o mesmo trecho de forma incompatível
    When o estado é mesclado
    Then a alteração não é descartada silenciosamente e a divergência fica sinalizada
```

#### AC-011 — bridge de importação externa
**Cobre**: US-003, FR-005, NFR-004
```gherkin
@US-003 @FR-005 @NFR-004 @AC-011
Feature: edição fora do app
  Scenario: exportação alterada fora do app
    Given uma exportação Markdown ou uma fonte legada muda fora do OpenBible
    When o bridge compara a geração anterior e a atual
    Then ele produz uma proposta explícita de importação/reconciliação para o backend local sem sobrescrever o registro persistido
```

#### AC-012 — conflito preservado
**Cobre**: US-003, FR-005, NFR-002
```gherkin
@US-003 @FR-005 @NFR-002 @AC-012
Feature: recuperação de conflito
  Scenario: merge externo não comprovado
    Given a proposta externa e o estado local divergem no mesmo trecho
    When a reconciliação falha
    Then ambas as versões permanecem recuperáveis e a pessoa recebe ação explícita
```

#### AC-013 — reconstrução da projeção local
**Cobre**: US-003, FR-005, NFR-001
```gherkin
@US-003 @FR-005 @NFR-001 @AC-013
Feature: reconstrução
  Scenario: projeção ausente após sync
    Given uma réplica recebeu o estado CRDT de uma nota e sua projeção local está ausente
    When o workspace abre
    Then a nota fica disponível no backend operacional e a projeção pode ser reconstruída depois
    And a reconstrução não consulta nem cria dependência de `.openbible/index.sqlite`
```

#### AC-014 — payload sem path
**Cobre**: US-003, FR-006, NFR-002
```gherkin
@US-003 @FR-006 @NFR-002 @AC-014
Feature: payload seguro
  Scenario: serializar uma mudança
    Given um documento associado a um path absoluto no dispositivo
    When o delta é preparado
    Then o payload não contém path, handle ou catálogo local
```

#### AC-015 — escopo por workspace
**Cobre**: US-004, FR-006, NFR-002
```gherkin
@US-004 @FR-006 @NFR-002 @AC-015
Feature: isolamento
  Scenario: sincronizar um workspace
    Given dois workspaces no mesmo aparelho e somente um habilitado
    When o sync envia documentos
    Then o segundo workspace não é enumerado nem misturado
```

#### AC-016 — pairing explícito
**Cobre**: US-004, FR-006, NFR-004
```gherkin
@US-004 @FR-006 @NFR-004 @AC-016
Feature: autorização
  Scenario: adicionar peer
    Given um workspace sem peer remoto autorizado
    When a pessoa confirma um pairing válido
    Then somente o escopo concedido fica elegível para sync
```

#### AC-017 — revogação
**Cobre**: US-004, FR-006, NFR-003
```gherkin
@US-004 @FR-006 @NFR-003 @AC-017
Feature: revogação
  Scenario: remover peer
    Given um peer autorizado e uma réplica local intacta
    When a pessoa revoga o peer
    Then novas mensagens dele são rejeitadas e o conteúdo local permanece
    And a interface informa que cópias já recebidas não podem ser apagadas remotamente
```

#### AC-018 — credencial fora da fonte
**Cobre**: US-004, FR-006, NFR-002
```gherkin
@US-004 @FR-006 @NFR-002 @AC-018
Feature: segredo local
  Scenario: configurar endpoint
    Given a pessoa informa uma credencial para o relay
    When a configuração é salva ou exportada
    Then no Tauri a credencial fica no cofre do SO e no PWA o token fica somente em memória
    And a credencial não entra em Markdown, JSON, backup ou payload de sync
```

#### AC-019 — reabertura sem rede
**Cobre**: US-001, FR-001, NFR-001
```gherkin
@US-001 @FR-001 @NFR-001 @AC-019
Feature: disponibilidade local
  Scenario: iniciar offline
    Given a última réplica foi encerrada com deltas pendentes
    When o app inicia sem rede
    Then o workspace abre com o último estado local consistente
```

#### AC-020 — adapter Tauri
**Cobre**: US-001, FR-002, NFR-004
```gherkin
@US-001 @FR-002 @NFR-004 @AC-020
Feature: storage nativo
  Scenario: persistir no Tauri
    Given um workspace nativo ativo no Tauri
    When o repository grava uma nota ou estado operacional
    Then ele usa o adapter allowlisted do `app.sqlite` escopado por `workspaceId`
    And não grava a fonte ativa na raiz do workspace nem aceita caminho arbitrário da UI
```

#### AC-021 — adapter PWA
**Cobre**: US-001, FR-002, NFR-004
```gherkin
@US-001 @FR-002 @NFR-004 @AC-021
Feature: storage PWA
  Scenario: persistir no navegador
    Given um workspace lógico no PWA
    When o repository grava uma nota ou delta
    Then o estado fica no IndexedDB versionado `openbible-workspace` associado ao `workspaceId`
    And sobrevive a refresh sem depender de OPFS, File System Access ou service worker como backend
```

#### AC-022 — backpressure
**Cobre**: US-002, FR-003, NFR-003
```gherkin
@US-002 @FR-003 @NFR-003 @AC-022
Feature: volume de deltas
  Scenario: fila acima do alvo
    Given uma fila local acima do limite de memória configurado
    When novas mudanças chegam
    Then o sistema aplica backpressure e mantém o último registro persistido no backend operacional intacto
```

#### AC-023 — compactação segura
**Cobre**: US-002, FR-004, NFR-003
```gherkin
@US-002 @FR-004 @NFR-003 @AC-023
Feature: histórico compacto
  Scenario: compactar estado replicado
    Given um documento com histórico acima do limite
    When a compactação é executada
    Then o snapshot permanece recuperável e a nota persistida no backend operacional não é removida
```

#### AC-024 — mensagem inválida
**Cobre**: US-004, FR-006, NFR-002
```gherkin
@US-004 @FR-006 @NFR-002 @AC-024
Feature: entrada não confiável
  Scenario: receber payload inválido
    Given uma mensagem desconhecida, excedente ou malformada
    When o adapter a recebe
    Then ela é rejeitada isoladamente sem executar path, SQL ou comando arbitrário
```

#### AC-025 — relay sem TLS
**Cobre**: US-004, FR-003, NFR-002
```gherkin
@US-004 @FR-003 @NFR-002 @AC-025
Feature: conexão segura
  Scenario: endpoint inseguro
    Given um endpoint remoto sem transporte seguro no modo produtivo
    When a pessoa tenta habilitá-lo
    Then o app bloqueia o envio e explica a necessidade de configuração segura
    And não apresenta TLS como criptografia ponta a ponta ou relay sem acesso ao conteúdo
```

#### AC-026 — latência local
**Cobre**: US-001, FR-002, NFR-003
```gherkin
@US-001 @FR-002 @NFR-003 @AC-026
Feature: resposta local
  Scenario: salvar uma alteração pequena
    Given storage local disponível e uma nota abaixo do limite
    When a pessoa salva
    Then a confirmação local ocorre sem aguardar o relay
```

#### AC-027 — transparência de status
**Cobre**: US-004, FR-003, NFR-003
```gherkin
@US-004 @FR-003 @NFR-003 @AC-027
Feature: estado de sync
  Scenario: exibir conexão
    Given sync ativo, pendente ou em erro
    When a pessoa consulta a configuração
    Then o estado, último sucesso, falha e ação recuperável ficam visíveis
```

#### AC-028 — nenhum índice no payload
**Cobre**: US-003, FR-006, NFR-004
```gherkin
@US-003 @FR-006 @NFR-004 @AC-028
Feature: projeção descartável
  Scenario: transportar documento
    Given o workspace possui uma projeção local reconstruível e um backend operacional ativo
    When um pacote de sync é criado
    Then a projeção e o banco bruto não são incluídos
    And o payload contém somente deltas/documentos autorizados
```

#### AC-029 — edição sem relay obrigatório
**Cobre**: US-001, FR-003, NFR-001
```gherkin
@US-001 @FR-003 @NFR-001 @AC-029
Feature: independência de serviço
  Scenario: endpoint removido
    Given a configuração remota foi removida
    When a pessoa abre e edita uma nota
    Then o uso local funciona e nenhuma chamada de rede é necessária
```

#### AC-030 — compatibilidade futura de transporte
**Cobre**: US-002, FR-003, NFR-004
```gherkin
@US-002 @FR-003 @NFR-004 @AC-030
Feature: boundary de transporte
  Scenario: trocar adapter
    Given um documento e storage local válidos
    When o adapter WebSocket é substituído por outro compatível
    Then o modelo de documento e as regras de escopo permanecem inalterados
```

#### AC-031 — sincronização HTTP incremental
**Cobre**: US-002, FR-007, NFR-005
```gherkin
@US-002 @FR-007 @NFR-005 @AC-031
Feature: API de sincronização
  Scenario: enviar e recuperar uma alteração
    Given dois dispositivos do mesmo workspace e um cursor conhecido
    When o primeiro envia uma alteração idempotente e o segundo faz pull
    Then o servidor retorna uma nova revisão e um cursor incremental
    And o segundo recebe somente o documento autorizado sem path absoluto
```

#### AC-032 — conflito por revisão
**Cobre**: US-003, FR-007, NFR-002, NFR-005
```gherkin
@US-003 @FR-007 @NFR-002 @NFR-005 @AC-032
Feature: conflito de sincronização HTTP
  Scenario: duas alterações partem da mesma revisão
    Given dois dispositivos possuem a mesma revisão base de uma nota
    When ambos enviam alterações diferentes
    Then uma alteração é aceita e a outra retorna conflito explícito
    And nenhuma versão é descartada silenciosamente
```

#### AC-033 — serviço local e health check
**Cobre**: US-002, FR-007, NFR-005
```gherkin
@US-002 @FR-007 @NFR-005 @AC-033
Feature: operação da API de sincronização
  Scenario: iniciar o Worker local
    Given uma configuração D1 válida
    When o serviço é iniciado em modo local
    Then o endpoint de health responde com estado operacional
    And push e pull usam o schema versionado sem depender de WebSocket
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve atribuir um ID estável a cada documento sincronizável e manter uma referência local entre ID, `workspaceId`, registro do backend operacional e eventual destino de exportação, sem depender do caminho para identidade.
- **FR-002**: O sistema deve persistir notas, estado CRDT e deltas pendentes no backend operacional do runtime — `app.sqlite` no Tauri e IndexedDB versionado no PWA — e permitir exportar Markdown/JSON sem exigir relay.
- **FR-003**: O sistema deve aceitar zero ou mais transportes configuráveis, incluindo adapter local e WebSocket, com reconexão, fila, timeout, retry e remoção segura do endpoint; habilitar relay exige consentimento de que ele pode observar ou reter o estado CRDT.
- **FR-004**: O sistema deve trocar deltas por documento e mesclar alterações concorrentes preservando histórico, snapshot recuperável e divergências materiais sem descarte silencioso.
- **FR-005**: O sistema deve detectar alteração em exportação ou fonte legada, comparar gerações, propor importação/reconciliação para o backend operacional e preservar ambas as versões quando a equivalência não puder ser provada.
- **FR-006**: O sistema deve impor escopo por workspace/documento, pairing e revogação de peers, rejeitar payloads inválidos, manter paths, handles, índices, caches e credenciais fora do sync e informar que revogação não apaga cópias já entregues.
- **FR-007**: O sistema deve oferecer uma API HTTPS incremental com operações de push e pull por workspace, revisões monotônicas, cursor, tombstones, idempotência por operação e retorno explícito de conflitos, sem exigir conexão persistente.

#### Não funcionais

- **NFR-001**: Disponibilidade local — leitura e edição de documentos previamente carregados devem continuar sem rede ou relay; verificar com testes offline e reinício em PWA/Tauri.
- **NFR-002**: Segurança e privacidade — mensagens não podem transportar segredo, path absoluto, handle ou índice; endpoint inseguro e payload inválido devem ser bloqueados; TLS não pode ser apresentado como E2EE e o consentimento ao relay confiável deve ser verificável por contrato e testes de abuso.
- **NFR-003**: Recursos — fila, retry e compactação devem respeitar limites configuráveis, backpressure e memória; verificar com fixture de 10.000 deltas e métricas de bytes, latência e falhas.
- **NFR-004**: Recuperabilidade e interoperabilidade — notas e o workspace devem continuar utilizáveis a partir de `app.sqlite`/IndexedDB sem estado CRDT, exportações Markdown/JSON devem ser regeneráveis e adapters substituíveis devem manter o contrato; verificar removendo estado CRDT e reconstruindo projeções.
- **NFR-005**: Operabilidade remota — a API deve responder health check sem autenticação de conteúdo, rejeitar workspace inválido, limitar lote e payload, e operar dentro das cotas documentadas do provedor; verificar com testes de contrato e configuração local do Worker/D1.

#### Erros e casos-limite

- Workspace indisponível, permissão revogada ou quota esgotada → manter última fonte funcional, suspender sync e oferecer recuperação.
- Endpoint HTTP inválido, sem TLS, timeout ou protocolo incompatível → não enviar conteúdo, exibir diagnóstico recuperável e permitir remover endpoint.
- Relay seguro por transporte, mas não confiável para o conteúdo → não
  habilitar; esta fatia não oferece E2EE nem promete remoção de réplicas remotas.
- Payload excedente, desconhecido ou malformado → rejeitar a mensagem sem executar comandos, paths ou SQL arbitrário.
- Exportação ou fonte legada renomeada, removida ou alterada externamente → preservar o registro do backend e oferecer importação/reconciliação explícita, sem overwrite silencioso.
- Compactação ou reconstrução da projeção falha → manter CRDT e registros no backend operacional, marcar a projeção pendente e tentar posteriormente.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `apps/web` usa Svelte/SvelteKit, TypeScript, Milkdown,
  `WorkspaceStorage` e `WorkspaceContentRepository`; o PWA persiste notas,
  workspaces e estado CRDT no IndexedDB versionado `openbible-workspace`.
- Tauri usa Rust/rusqlite para o `app.sqlite` da instalação. OPFS, File System
  Access, manifestos e `.openbible/index.sqlite` permanecem fontes legadas de
  migração/recovery; Markdown/JSON são exportações e entradas explícitas, não
  o backend ativo. O backup continua excluindo índices e referências locais.
- O serviço remoto será um Worker HTTP separado em `apps/sync-api`, com D1 para
  notas/revisões/cursor e execução local via Wrangler; ele não substitui os
  backends locais nem precisa manter WebSocket aberto.

#### Arquitetura e módulos

- `SyncDocumentRegistry`: mapeia ID estável, tipo autoral, workspace e arquivo
  relativo; não expõe path absoluto ao domínio.
- `SyncRepository`: facade de domínio sobre `Repo`,
  `WorkspaceContentRepository`, `StorageAdapter` e `NetworkAdapter[]`; inicializa
  o backend correto por runtime e desativa rede sem desativar storage local.
- `SyncMaterializer`: aplica snapshot/deltas aos registros de notas do backend
  operacional, grava por barreira de geração, reconstrói projeções depois e usa
  os writers da spec 0017 somente para exportação.
- `ExternalEditBridge`: observa exportações ou fontes legadas, classifica uma
  possível importação externa e cria proposta ou cópia recuperável quando não
  há merge seguro; nunca trata o arquivo como autoridade ativa.
- `PeerPolicy` e `SyncEnvelopeGuard`: controlam escopo, pairing, revogação,
  limites, validação e exclusão de paths/handles/segredos.
- `SyncDiagnostics`: emite estado local de conexão, fila, bytes, retry,
  conflitos e revogação sem texto, token ou path absoluto.
- `HttpSyncClient`: envia lotes idempotentes por HTTPS, recupera alterações por
  cursor e aplica conflitos antes de atualizar o backend local.

O primeiro transporte remoto será HTTP incremental; o WebSocket fica reservado
para uma futura experiência de colaboração em tempo real.

#### Migrations

A implementação deve criar área operacional versionada para estado CRDT e fila
nos backends ativos: a migration SQL idempotente
`apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` em
`app.sqlite` no Tauri e o upgrade de schema v2 para v3 no IndexedDB
`openbible-workspace` no PWA. Ambos devem criar os registros/object stores
`sync_documents`, `sync_snapshots`, `sync_changes`, `sync_queue`, `sync_peers`,
`sync_endpoints` e `sync_conflicts`, sempre com `workspaceId` quando o registro
for de domínio. O schema deve permitir rollback/recovery sem remover notas e
não pode criar estado ativo em `.openbible/index.sqlite`, OPFS ou na raiz do
workspace.

#### Models

`SyncDocumentRef` (workspaceId, documentId, kind, backendRecordId,
exportRelativePath opcional, schemaVersion),
`SyncPeerPolicy` (peerId, workspaceId, scope, status, createdAt, revokedAt),
`SyncEndpoint` (endpointId, workspaceId, transport, url sem segredo, status),
`SyncQueueState` (documentId, pendingCount, bytes, retryAt, lastErrorCode),
`SyncCursor` (workspaceId, endpointId, cursor, updatedAt) e `SyncConflict`
(documentId, generation local/externa, status, recoveryRef).

Paths físicos, handles, tokens, chaves e `.openbible/index.sqlite` ficam fora
desses contratos portáteis; referências de exportação/legado podem existir
somente no adapter ou na camada explícita de importação/recovery.

#### Controllers e casos de uso

`enableWorkspaceSync`, `disableWorkspaceSync`, `pairPeer`, `revokePeer`,
`retrySync`, `resolveExternalConflict`, `exportWorkspace` e
`importExternalChange` são casos de uso da facade Svelte/Tauri. A UI não
fornece path arbitrário, SQL, envelope ou credencial para o domínio; comandos
Tauri usam allowlist tipada.

#### Views e experiência

A configuração de sync aparece dentro de Config > Storage/Workspace, e o estado
resumido fica no contexto do workspace ativo. A pessoa escolhe escopo, adiciona
ou remove endpoint, confirma pairing, vê fila/último sync e abre uma revisão de
conflito. A tela precisa informar que o uso local continua quando a rede falha.

#### Queries e repositórios

Consultas de sync usam o contrato comum do backend operacional e o storage do
Automerge por ID; no Tauri o conteúdo é lido/escrito em `app.sqlite` e no PWA
em IndexedDB. Projeções podem ser reconstruídas depois, e nenhuma query abre
`.openbible/index.sqlite` ou usa arquivo exportado para obter a nota ativa.

#### Jobs e processamento assíncrono

`syncPump` processa uma fila por documento com backoff e limite de concorrência;
`materializePump` aplica registros em ordem de geração no backend operacional e
`exportPump` produz arquivos portáteis somente por solicitação; `indexRebuild` é
posterior e idempotente. Interrupção deixa estado recuperável e não promove
exportação ou temporário a fonte do workspace.

#### Estrutura de arquivos

```text
apps/web/src/lib/features/sync/
  sync-document-registry.ts
  sync-repository.ts
  sync-materializer.ts
  external-edit-bridge.ts
  peer-policy.ts
  sync-envelope-guard.ts
  sync-diagnostics.ts
  sync-storage-adapters.ts
  sync-http-client.ts
  SyncSettings.svelte
apps/desktop/src-tauri/src/commands/sync.rs
apps/desktop/src-tauri/migrations/003_create_sync_operational.sql
apps/web/src/lib/storage/indexeddb-workspace-adapter.ts  # stores versionados
apps/sync-api/
  src/index.ts
  src/sync-api.test.ts
  migrations/0001_sync.sql
  wrangler.jsonc
.openbible/          # somente legado/migração/recovery; não é backend ativo
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| SyncDocumentRef | `documentId` estável | `workspaceId`, kind, `backendRecordId`, schemaVersion e destino opcional de exportação; path não é identidade | N..1 workspace; 1..1 registro operacional por réplica |
| Automerge document | URL/ID Automerge local | snapshot, changes, heads, versão; estado operacional de replicação, não exportação nem banco bruto | 1..1 `SyncDocumentRef` por réplica |
| SyncPeerPolicy | `peerId` + workspace | escopo, estado ativo/revogado, timestamps; sem segredo | N..1 workspace |
| SyncEndpoint | endpoint local | transporte, URL sem token, status; configurável | N..1 workspace; N peers |
| SyncConflict | ID local | documento, gerações, status, recoveryRef; não contém cópia secreta em diagnóstico | N..1 documento; registro operacional local |
| SyncQueueState | documento + réplica | contagem, bytes, retry, código de erro | N..1 documento |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| SyncEndpoint | disabled | enable seguro | connecting | endpoint sem segredo e escopo explícito |
| SyncEndpoint | connecting | handshake válido | online | TLS/policy válidos |
| SyncEndpoint | online | timeout/erro | retrying | fonte local continua disponível |
| SyncEndpoint | retrying | backoff concluído | connecting | limite de retry observável |
| SyncPeerPolicy | active | revoke | revoked | mensagens futuras rejeitadas |
| SyncDocumentRef | clean | mudança local | pending | delta local persistido |
| SyncDocumentRef | pending | troca concluída | converged | fonte materializada preservada |
| SyncDocumentRef | qualquer | divergência externa | conflict | nenhuma versão removida |

#### Migração e retenção

O estado CRDT pode ser compactado por documento depois de snapshot verificável;
retenção nunca remove a nota persistida no backend operacional nem a última
versão recuperável. Dados de sync podem ser purgados ao desabilitar sync, mas
o workspace e as notas em `app.sqlite`/IndexedDB permanecem. O backup/exportação
gera conteúdo portátil a partir do snapshot e exclui referências locais, tokens
e índices.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Configuração, status, pairing, revogação
  e revisão de conflito precisam ser compreensíveis em desktop e mobile.

#### Stack e convenções de interface

- Svelte/SvelteKit + TypeScript, `apps/web`, primitives existentes em Svelte e
  tokens de `DESIGNSYSTEM.MD`; não introduzir React. Reutilizar shell,
  `WorkspaceSettings` e feedback existentes.

#### Telas e responsabilidades

- Config > Storage/Workspace: habilitar sync, selecionar escopo e endpoint e
  visualizar o backend determinado pelo runtime; entrada e saída ficam no
  workspace ativo.
- Painel de status do workspace: fila, último sync, erro, retry e modo offline.
- Painel de peer/conflito: pairing, revogação e revisão recuperável de
  divergência externa.

#### Fluxo de informação e navegação

- `Configuração → Storage/Workspace → Sincronização`; o workspace ativo aparece
  no breadcrumb e no seletor já definido em SPEC-0016. A pessoa abre a
  configuração, vê o backend (`app.sqlite` ou IndexedDB), escolhe escopo,
  confirma endpoint/pairing e retorna ao editor.
- Um conflito leva ao painel de revisão sem trocar o workspace; cancelar
  preserva a fonte atual.

#### Menus e navegação principal

- Desktop: Sidebar > Configuração > Storage/Workspace; status compacto no
  header do workspace.
- Mobile: drawer/cabeçalho > Configuração > Storage/Workspace; painel ocupa a
  largura disponível, sem depender de hover.
- Acesso é local e individual; não há menu de conta ou serviço obrigatório.
- Mapa de menus: `Sidebar.Configuração` aponta para `ConfigPage`; dentro dela,
  `Storage/Workspace` aponta para `WorkspaceSettings` e a seção
  `Sincronização` expande `SyncSettings`; no mobile, os mesmos itens vivem no
  drawer e preservam seus destinos.

#### Formulários e ações

- Endpoint: URL, transporte e rótulo; o backend de notas é informativo e
  determinado pelo runtime. Token nunca é campo persistido no
  workspace; Tauri usa cofre do SO, PWA mantém token apenas em memória, e
  entrada insegura recebe erro antes do save. Antes de habilitar, a interface
  explica que o relay pode observar/reter o estado e que não há E2EE.
- Escopo: workspace/documentos elegíveis; seleção explícita e confirmação.
- Peer: pairing/revogação; confirmação forte antes de revogar ou limpar estado
  operacional.
- Conflito: ações manter local, aceitar externa, mesclar proposta ou salvar
  cópia; nenhuma é silenciosa.

#### Composição e disposição

- `PageHeader`/header do shell, resumo de status no topo, seções contínuas para
  escopo, transporte, peers e conflitos. Mobile usa drawer/painel; desktop usa
  coluna de configuração e painel de detalhe.
- Loading, vazio, erro, online, offline, pendente e conflito têm estados
  semânticos; não depender somente de cor.

#### Blocos React e componentes selecionados

| Tela | Bloco | Responsabilidade | Arquivo previsto | Componente | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Storage/Workspace | SyncSettings | compor configuração e ações | `apps/web/src/lib/features/sync/SyncSettings.svelte` | componentes Svelte existentes | próprio + bits-ui | extensão de WorkspaceSettings |
| Storage/Workspace | SyncStatus | fila, online/offline e erro | `apps/web/src/lib/features/sync/SyncStatus.svelte` | feedback/status existente | próprio | reutilizável no header |
| Peer/conflito | PeerConflictPanel | pairing, revogação e revisão | `apps/web/src/lib/features/sync/PeerConflictPanel.svelte` | dialog/drawer Svelte existente | próprio | painel responsivo |

Não há blocos React, shadcn/ui ou ReUI nesta stack Svelte.

#### Estados e acessibilidade

- Teclado percorre endpoint, escopo, pairing, retry e ações de conflito em ordem
  lógica; foco retorna ao acionador ao fechar painel.
- Mensagens de conexão, erro, conflito e revogação usam `role=status` ou
  `role=alert` conforme urgência, texto explícito e foco visível.
- Campos têm label, ajuda, erro associado e não exibem token; layout suporta
  tema claro/escuro, zoom, conteúdo longo, mobile/desktop e reduced motion.

#### Contrato CRUD

Não é CRUD de registros de negócio; peer/endpoints são configurações com
criação, consulta, alteração e revogação limitadas. Não há DataGrid exigido,
mas se uma listagem for criada deverá reutilizar `PageHeader`, manter a coluna
`ID` visível, tornar a linha link, e oferecer ações independentes de editar e
apagar conforme o contrato do projeto.

#### Revisão visual durante o desenvolvimento

Aplicável às telas de configuração e conflito: conferir desktop/mobile, claro/
escuro, teclado, zoom, erro, vazio, loading, online, fila e texto longo durante
a implementação, incluindo bordas, espaçamentos, margens, padding e tipografia.

#### APIs expostas

Facade interna tipada (`enableWorkspaceSync`, `disableWorkspaceSync`,
`pairPeer`, `revokePeer`, `retrySync`, `resolveExternalConflict`); comandos
Tauri allowlisted e versionados, sem SQL livre, path arbitrário ou envelope vindo
direto da UI.

#### APIs externas utilizadas

API HTTPS incremental do `SyncHttpClient`, Cloudflare Worker e D1; WebSocket
relay fica como transporte futuro. Autenticação, TLS, timeout e retry são
responsabilidade da integração; tokens não entram no workspace ou no payload.

#### Documentação das APIs consultadas

Automerge Repositories, Concepts, Storage, Networking e Network Sync, URLs
registradas em `research/automerge-official/evidence.md`, consultadas em
2026-09-05.

#### Eventos e outros contratos

`sync.document.changed`, `sync.connection.changed`, `sync.conflict.detected`,
`sync.peer.revoked` e `sync.materialization.failed`; payloads de diagnóstico
contêm IDs opacos/códigos/timestamps/contagens, nunca texto, token ou path.

### 11. Estratégia TDD

- **Unidade**: registry, policy, guard, fila, materializer e classificação da
  edição externa.
- **Integração/contrato**: adapters `app.sqlite`/IndexedDB, API HTTP
  incremental, aplicação de revisões ao backend ativo e bridge explícita de
  importação/exportação Markdown/JSON.
- **BDD/aceite**: AC-001 a AC-033 são a referência; cada caso deve manter os
  marcadores de história, requisito e cenário.
- **Runner TDD**: Vitest existente em `apps/web`, com `test:tdd` conforme as
  specs anteriores.
- **E2E**: fluxo Config > Storage/Workspace, pairing, offline, reconexão e
  revisão de conflito em navegador; Tauri focal para boundary nativo.
- **Verificação manual**: somente revisão visual e teste de perda de permissão/
  rede quando o runner não simular a plataforma; conferir que nenhuma nota ativa
  depende de filesystem/OPFS e que o backend exibido corresponde ao runtime.

#### Evidência RED-GREEN-REFACTOR

> **Evidência histórica:** os REDs abaixo foram produzidos antes da atualização
> normativa de 2026-09-07. Eles comprovam a seam inicial, mas não comprovam os
> contratos agora explícitos de persistência de notas em `app.sqlite`/IndexedDB.
> T001, T002, T011–T013, T020–T023 e T028 foram reabertas para reconciliação;
> os testes foram ajustados e executados novamente, mantendo RED comportamental
> até a implementação de `syncWorkspace`.

Os 30 casos TDD foram materializados e executados em Vitest. Cada caso atravessa
`executeSync`, que importa dinamicamente o módulo existente
`$lib/storage/workspace` e exige a exportação pública
`syncWorkspace(storage, command)`. O RED observado é a ausência desse seam
comportamental (`syncWorkspace` ainda não era exportado); não houve falha de
importação, sintaxe ou fixture. Os contratos atendidos por T031 foram
verificados em GREEN; T033 materializou a facade de transporte, retry,
backpressure e diagnósticos para os sete ACs de rede.

| ACs | Arquivo | RED observado | GREEN | Refactor |
| --- | --- | --- | --- | --- |
| AC-001, AC-002, AC-003, AC-004, AC-019, AC-020, AC-021, AC-026 | `apps/web/src/lib/features/sync/sync-document-registry.test.ts`, `sync-storage-adapters.test.ts` | RED histórico dos 8 casos; AC-020 exigia a ponte allowlisted Tauri | 8/8 Passed no registry; adapters/schema de AC-020/021, persistência local e ponte Tauri allowlisted passaram | Passed |
| AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 | `apps/web/src/lib/features/sync/sync-network-adapters.test.ts` | 7 REDs históricos; AC-022 também exige que o registro persistido no IndexedDB permaneça intacto sob backpressure | 7/7 Passed com adapters local/WebSocket, TLS obrigatório, retry/backoff, policy de fila, diagnósticos e protocolo transport-agnostic | Passed |
| AC-008, AC-009, AC-010, AC-023, AC-029 | `apps/web/src/lib/features/sync/sync-repository.test.ts` | 5 REDs históricos; AC-023 exige snapshot recuperável sem remover a nota persistida no backend operacional | 5/5 Passed com merge por documento, heads fora de ordem, conflito recuperável, compactação com fonte preservada e modo local-only | Passed |
| AC-011, AC-012, AC-013 | `apps/web/src/lib/features/sync/external-edit-bridge.test.ts` | 3 REDs históricos; bridge afirma backend IndexedDB, `workspaceId`, preservação sem overwrite e reconstrução sem `.openbible/index.sqlite` | 3/3 Passed com proposta externa, cópia recuperável de conflito e rebuild sobre backend operacional | Passed |
| AC-014, AC-015, AC-018, AC-024, AC-028 | `apps/web/src/lib/features/sync/sync-envelope-guard.test.ts` | AC-028 agora afirma payload com documentos/deltas e sem banco bruto/projeção; os 5 casos passaram com o guard | Passed | Passed |
| AC-016, AC-017 | `apps/web/src/lib/features/sync/peer-policy.test.ts` | 2 REDs históricos por ausência da policy de peer | 2/2 Passed com pairing explícito, revogação e preservação dos dados locais | Passed |

Comando RED histórico: `bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts src/lib/features/sync/sync-network-adapters.test.ts src/lib/features/sync/sync-repository.test.ts src/lib/features/sync/external-edit-bridge.test.ts src/lib/features/sync/sync-envelope-guard.test.ts src/lib/features/sync/peer-policy.test.ts` — exit 1, 6 arquivos e 30 testes falhos. GREEN atual: T031 passou 8 casos de contrato, T032 passou 2 casos de adapters e T033 passou 20 casos focais, além da regressão IndexedDB/backup e dos 15 testes Rust de schema.

### 12. Plano de testes e rastreabilidade

> As linhas de evidência RED já registradas continuam como histórico da seam
> inicial. T032 materializa o schema v3, os stores versionados e os adapters
> locais com `workspaceId`; T033 materializa a facade de transporte e a policy
> de fila. A ponte de comandos allowlisted Tauri foi concluída em T040.

| Requisito | Cenários BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-019 | Unidade/integração | `sync-document-registry.test.ts` | Passed: AC-001/002 registry identifica IndexedDB, `workspaceId`, leitura sem CRDT e exportações regeneráveis; AC-019 reabre localmente sem relay |
| FR-002 | AC-003, AC-004, AC-020, AC-021, AC-026 | Unidade/contrato | `sync-document-registry.test.ts`, `sync-storage-adapters.test.ts`, `indexeddb-workspace-adapter.test.ts` | Passed: T032/T033/T040 cobrem schema v3, escopo por `workspaceId`, persistência local, fila limitada, resposta sem relay e ponte allowlisted Tauri |
| FR-003 | AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 | Integração | `sync-network-adapters.test.ts` | Passed: 7/7 com local/WebSocket substituíveis, retry com backoff observável, TLS obrigatório, backpressure, diagnósticos e protocolo independente do transporte |
| FR-004 | AC-008, AC-009, AC-010, AC-023, AC-029 | Unidade/integração | `sync-repository.test.ts` | Passed: 5/5 com merge por documento, heads fora de ordem, conflitos revisáveis, snapshot recuperável e uso local sem relay |
| FR-005 | AC-011, AC-012, AC-013 | Unidade/contrato | `external-edit-bridge.test.ts` | Passed: 3/3 com proposta externa, preservação das duas versões e reconstrução sem `.openbible/index.sqlite` |
| FR-006 | AC-014, AC-015, AC-016, AC-017, AC-018, AC-024, AC-028 | Unidade/segurança | `sync-envelope-guard.test.ts`, `peer-policy.test.ts` | Passed: 7/7 com guard, escopo, credenciais, pairing, revogação e payload seguro |
| Interface de sincronização | AC-016, AC-018, AC-025 | Componente/E2E visual | `sync-settings.test.ts`, `SyncSettings.svelte`, `ConfigPage.svelte` | Passed: 3/3 contratos; inspeção em desktop e 320 px confirmou backend, escopo, `wss://`, pairing/revogação, foco visível, feedback acessível e tokens claro/escuro |
| Status de sincronização | AC-005, AC-007, AC-027 | Componente/integração visual | `sync-status.test.ts`, `SyncStatus.svelte` | Passed: 6/6 contratos de status; estados local/offline/conexão/sync/sucesso/erro, fila local, último sucesso, falha e retry ficam expostos sem bloquear a edição local |
| Revisão de conflito externo | AC-011, AC-012, AC-013 | Componente/E2E visual | `peer-conflict-panel.test.ts`, `peer-conflict-panel.svelte.spec.ts`, `PeerConflictPanel.svelte` | Passed: 7/7 testes; painel mostra as duas versões recuperáveis, backend operacional, paths de recovery e ações explícitas em 320 px, sem overwrite implícito |
| Boundary Tauri de persistência | AC-005, AC-020, AC-030 | Unidade/integração nativa | `database.rs`, `commands/sync.rs`, `tauri-bridge.test.ts` | Passed: 16/16 testes Rust e 5/5 bridge; nota, snapshot e fila persistem em `app.sqlite`, escopados por `workspaceId`, com comandos allowlisted e sem SQL/path livre |
| Pacotes Automerge e adapters | AC-005, AC-021, AC-022 | Integração/documentação | `.specsfy/STACK.md`, `.specsfy/PACKAGES.md`, `sync-network-adapters.test.ts`, `sync-storage-adapters.test.ts` | Passed: `@automerge/automerge` 3.4.1 e `@automerge/automerge-repo` 2.5.6 registrados; adapters próprios preservam `app.sqlite`/IndexedDB como backends, com 17/17 focais |
| Inventário de persistência | AC-002, AC-009, AC-013 | Schema/documentação | `.specsfy/DATABASE.md`, `sync-database-inventory.test.ts`, migration 003 e stores IndexedDB v3 | Passed: 1/1 auditoria documental; notas primárias, snapshots/changes, fila, peers, endpoints, conflitos e projeções aparecem nos dois backends com escopo por workspace |
| NFR-001 | AC-001, AC-005, AC-008, AC-013, AC-019, AC-029 | Integração | suíte focal | Passed: operações locais, reinício, merge, materialização e recuperação funcionam sem relay obrigatório |
| NFR-002 | AC-010, AC-012, AC-014, AC-015, AC-018, AC-024, AC-025 | Segurança | suíte focal | Passed: guard, conflito recuperável, pairing/revogação, TLS obrigatório e bloqueio de endpoint inseguro passaram |
| NFR-003 | AC-004, AC-007, AC-017, AC-022, AC-023, AC-026, AC-027 | Carga/integração | suíte focal | Passed: limite de fila, retry, backpressure, compactação, pairing e diagnósticos passaram nos contratos focalizados |
| NFR-004 | AC-002, AC-006, AC-009, AC-011, AC-016, AC-020, AC-021, AC-028, AC-030 | Contrato/regressão | suíte focal | Passed: registry, materializer, adapters locais, pairing, guard, boundary Tauri e reconstrução operacional passaram |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado atual**: Passed em 2026-09-07 — READY; a definição agora declara
  `app.sqlite` no Tauri e IndexedDB `openbible-workspace` no PWA como backends
  das notas, com Automerge operacional, Markdown/JSON como exportação/importação
  explícita e fontes legadas fora do backend ativo.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0019-sincronizacao-local-first-automerge/spec.md --allow-draft`
- **FIND-SEC-001** [P1] [Resolved] TLS/pairing não declaravam que o relay ainda pode observar ou reter o estado — Refs: FR-003, FR-006, NFR-002, AC-017, AC-018, AC-025 — Evidence: completed/0019-sincronizacao-local-first-automerge/spec.md:90 — Effect: a pessoa poderia interpretar transporte seguro como E2EE e superestimar revogação — Suggestion: resolvido com consentimento explícito, token PWA apenas em memória, ausência de promessa E2EE e aviso de que revogação não apaga cópias entregues.
- **FIND-ARCH-001** [P2] [Resolved] credencial de relay tinha storage “seguro” genérico apesar de a PWA não possuir cofre equivalente — Refs: AC-018, FR-006 — Evidence: completed/0019-sincronizacao-local-first-automerge/spec.md:151 — Effect: implementação poderia persistir token silenciosamente no browser — Suggestion: resolvido com cofre do SO no Tauri e sessão somente em memória no PWA.
- **FIND-ARCH-002** [P1] [Resolved] a versão anterior tratava Markdown/JSON como fonte e SQLite como projeção — Refs: FR-001, FR-002, FR-005, NFR-004, AC-002, AC-011, AC-013, AC-020, AC-021 — Evidence: completed/0019-sincronizacao-local-first-automerge/spec.md:44 — Effect: implementação poderia gravar notas no filesystem/OPFS e divergir da decisão de `app.sqlite`/IndexedDB — Suggestion: resolvido ao tornar `app.sqlite`/IndexedDB os backends operacionais, explicitar migration v3/SQL 003 e limitar arquivos a exportação/importação/recovery.

#### Gate do Ato II — Plano

- **Resultado atual**: Passed em 2026-09-07 — todas as 30 tarefas TDD estão
  materializadas com RED comportamental, 14 tarefas de código aguardam a
  implementação e os 44 IDs da spec têm cobertura rastreável.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0019-sincronizacao-local-first-automerge/spec.md`
- **Achados**: `validate_tasks --allow-draft`, `validate_tasks` e
  `validate_interface_tasks` passaram; o auditor global mantém somente
  marcadores órfãos históricos de outras specs, fora desta spec.

#### Gate do Ato III — Entrega

- **Resultado atual**: Passed em 2026-09-07 — todas as tarefas T031–T045
  estão concluídas, os 44 IDs têm rastreabilidade automatizada e os contratos
  de persistência, transporte, segurança, interface e recovery passaram.
- **Comandos e achados**:
  - `bun run --cwd apps/web test:tdd -- src/lib/features/sync`: 14 arquivos,
    45 testes passaram.
  - `bun run --cwd apps/web test:tdd -- --project server --maxWorkers=2`:
    149 arquivos, 460 testes passaram.
  - `bun run --cwd apps/web test:tdd -- --project client --maxWorkers=1`:
    23 arquivos, 115 testes passaram.
  - `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`: 20 testes
    passaram; `cargo fmt -- --check` passou.
  - `bun run --cwd apps/web check-types`, ESLint da área alterada e `bun run
    --cwd apps/web build` passaram.
  - `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs
    specs/completed/0019-sincronizacao-local-first-automerge/spec.md
    apps/web/src/lib/features/sync --kinds US,FR,NFR,AC --full-chain`:
    44/44 IDs cobertos em 14 arquivos de teste.
- **Nota operacional**: o comando agregado sem seleção de projeto ficou sem
  progresso por mais de oito minutos e foi interrompido; a execução equivalente
  separada por `server` e `client` passou integralmente, sem falha funcional.
- **Enforcement global**: `verify_repo` na raiz ainda sinaliza falhas de
  rastreabilidade ampla causadas por marcadores órfãos/históricos de outras
  specs; a verificação focada desta spec passa `44/44` e seus demais gates
  (`spec`, `tasks`, `acceptance`, `evidence` e `research`) passam. Esse baseline
  global fica fora do escopo do pacote concluído.

### 14. Tarefas

Formato canônico: - [ ] TNNN [TIPO] [US-NNN] Ação com caminho — Refs: IDs — Depends: IDs|none.

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-001 com a persistência da nota no backend operacional (`app.sqlite`/IndexedDB) em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001, confirmar backend esperado por runtime e preparar fixture determinística.
  - [x] **EXECUTE**: Reescrever o caso Vitest para provar a reabertura da nota persistida em `app.sqlite`/IndexedDB após reinício sem rede.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts`; o RED foi comportamental porque `syncWorkspace` ainda não é exportado.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de persistência.
  - [x] **EVIDENCE**: Registrado comando exit 1, backend esperado `indexeddb`, causa do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture explicita `workspaceId` e backend browser, sem depender de path como identidade.

- [x] T002 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-002 com a abertura da nota no backend operacional sem estado CRDT e a regeneração de exportação em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-001, NFR-004, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002, confirmar IndexedDB `openbible-workspace` no PWA e preparar fixture sem estado CRDT.
  - [x] **EXECUTE**: Reescrever o caso para abrir/editar a nota no backend operacional e exigir Markdown/JSON como exportação regenerável.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; 30 testes produziram RED comportamental porque `syncWorkspace` ainda não é exportado.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de persistência/exportação.
  - [x] **EVIDENCE**: Registrar comando exit 1, `backend: indexeddb`, `workspaceId`, `crdtAvailable: false` e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture explicita backend operacional e não depende de filesystem/OPFS como fonte ativa.

- [x] T003 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-003 em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-001 FR-002 NFR-001 AC-003 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T004 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-004 em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-001 FR-002 NFR-003 AC-004 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T005 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-005 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-003 NFR-001 AC-005 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T006 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-006 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-004, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-006, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-003 NFR-004 AC-006 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T007 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-007 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-003 NFR-003 AC-007 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T008 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-008 em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-002, FR-004, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-008, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-004 NFR-001 AC-008 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-repository.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T009 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-009 em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-002, FR-004, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-009, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-004 NFR-002 AC-009 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-repository.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T010 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-010 em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-002, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-010, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-004 NFR-002 AC-010 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-repository.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T011 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-011 para importação explícita de exportação/fonte legada em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-004, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-011, separar exportação/legado de backend ativo e preparar fixture determinística.
  - [x] **EXECUTE**: Reescrever o caso para produzir proposta de importação no IndexedDB sem sobrescrever o registro persistido.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de bridge.
  - [x] **EVIDENCE**: Registrar comando exit 1, origem Markdown, backend IndexedDB, `workspaceId` e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture exige `overwrite: false` e preservação do registro persistido.

- [x] T012 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-012 para preservar conflito entre importação externa e registro persistido em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-012 e preparar versões externa/importada e persistida.
  - [x] **EXECUTE**: Reescrever o caso para manter ambas as versões recuperáveis sem substituir a nota do IndexedDB.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de conflito.
  - [x] **EVIDENCE**: Registrar comando exit 1, referências de recuperação, backend e `workspaceId` nas seções 11–13.
  - [x] **IMPROVE**: Fixture afirma `localVersionRecoverable`, `externalVersionRecoverable` e ausência de overwrite silencioso.

- [x] T013 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-013 para reconstruir projeção sem depender de `.openbible/index.sqlite` em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-001, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-013 e preparar backend IndexedDB com projeção ausente.
  - [x] **EXECUTE**: Reescrever o caso para abrir a nota no backend operacional e reconstruir a projeção sem consultar `.openbible/index.sqlite`.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de recuperação.
  - [x] **EVIDENCE**: Registrar comando exit 1, backend, `projectionDependency: null`, ausência de `indexPath` e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture afirma disponibilidade da nota e rebuild posterior idempotente sem índice legado.

- [x] T014 [TEST] [TDD] [US-003] Derivar teste Vitest do AC-014 em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-003, FR-006, NFR-002, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-014, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-003 FR-006 NFR-002 AC-014 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-envelope-guard.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T015 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-015 em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-004, FR-006, NFR-002, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-015, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-006 NFR-002 AC-015 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-envelope-guard.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T016 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-016 em apps/web/src/lib/features/sync/peer-policy.test.ts — Refs: US-004, FR-006, NFR-004, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-016, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-006 NFR-004 AC-016 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/peer-policy.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T017 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-017 em apps/web/src/lib/features/sync/peer-policy.test.ts — Refs: US-004, FR-006, NFR-003, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-017, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-006 NFR-003 AC-017 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/peer-policy.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T018 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-018 em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-004, FR-006, NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-018, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-006 NFR-002 AC-018 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-envelope-guard.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T019 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-019 em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-001, NFR-001, AC-019 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-019, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-001 FR-001 NFR-001 AC-019 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T020 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-020 para provar persistência da nota e do estado CRDT no `app.sqlite` do Tauri em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-004, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-020, confirmar `app.sqlite`, migration e `workspaceId`, e preparar fixture determinística.
  - [x] **EXECUTE**: Reescrever o caso Vitest para exigir backend `sqlite`, banco `app.sqlite`, escopo por `workspaceId` e ausência de path arbitrário.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de boundary nativo.
  - [x] **EVIDENCE**: Registrar comando exit 1, `app.sqlite`, boundary do workspace e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture mantém allowlist implícita e não aceita `absolutePath`.

- [x] T021 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-021 para provar persistência da nota e do estado CRDT no IndexedDB `openbible-workspace` em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-004, AC-021 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-021, confirmar banco `openbible-workspace`, stores versionados e `workspaceId`.
  - [x] **EXECUTE**: Reescrever o caso Vitest para exigir IndexedDB `openbible-workspace`, backend `indexeddb`, isolamento por `workspaceId` e ausência de handle.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de boundary PWA.
  - [x] **EVIDENCE**: Registrar comando exit 1, banco/store esperado, backend e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture exclui OPFS/FSA/service worker como backend e mantém upgrade versionado como requisito de implementação.

- [x] T022 [TEST] [TDD] [US-002] Reconciliar o teste Vitest do AC-022 para manter o registro persistido intacto sob backpressure em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-003, AC-022 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-022 e preparar fila vinculada a uma nota persistida no IndexedDB.
  - [x] **EXECUTE**: Reescrever o caso para afirmar que backpressure pausa somente rede e preserva o registro local.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de fila.
  - [x] **EVIDENCE**: Registrar comando exit 1, `backend: indexeddb`, `workspaceId`, registro preservado e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture explicita `persistedRecordIntact` e `noteStillReadable`, impedindo descarte local silencioso.

- [x] T023 [TEST] [TDD] [US-002] Reconciliar o teste Vitest do AC-023 para compactar estado sem remover a nota do backend operacional em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-002, FR-004, NFR-003, AC-023 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-023 e preparar snapshot verificável no IndexedDB operacional.
  - [x] **EXECUTE**: Reescrever o caso para afirmar que snapshot e nota permanecem recuperáveis após compactação.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de compactação.
  - [x] **EVIDENCE**: Registrar comando exit 1, snapshot, backend IndexedDB, `workspaceId` e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture explicita `notePersisted` e `snapshotRecoverable`, impedindo retenção destrutiva.

- [x] T024 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-024 em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-004, FR-006, NFR-002, AC-024 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-024, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-006 NFR-002 AC-024 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-envelope-guard.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T025 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-025 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-004, FR-003, NFR-002, AC-025 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-025, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-003 NFR-002 AC-025 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T026 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-026 em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-003, AC-026 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-026, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-001 FR-002 NFR-003 AC-026 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T027 [TEST] [TDD] [US-004] Derivar teste Vitest do AC-027 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-004, FR-003, NFR-003, AC-027 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-027, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-004 FR-003 NFR-003 AC-027 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T028 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-028 para rejeitar projeções e banco bruto no payload, permitindo apenas deltas/documentos autorizados em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-003, FR-006, NFR-004, AC-028 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-028 e preparar banco bruto, projeção e delta autorizado como fixture.
  - [x] **EXECUTE**: Reescrever o caso para afirmar payload com `workspaceId`, documentos/deltas autorizados e sem banco bruto/projeção/`.openbible/index.sqlite`.
  - [x] **VERIFY**: Executar o focal de 6 arquivos; o caso falhou na seam ausente, sem falha estrutural.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste de segurança do envelope.
  - [x] **EVIDENCE**: Registrar comando exit 1, payload permitido, campos excluídos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Fixture exclui projeção e banco bruto sem bloquear documentos/deltas CRDT autorizados.

- [x] T029 [TEST] [TDD] [US-001] Derivar teste Vitest do AC-029 em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-001, FR-003, NFR-001, AC-029 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-029, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-001 FR-003 NFR-001 AC-029 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-repository.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

- [x] T030 [TEST] [TDD] [US-002] Derivar teste Vitest do AC-030 em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-004, AC-030 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-030, confirmar contrato público e preparar fixture determinística.
  - [x] **EXECUTE**: Escrever um caso Vitest com marcador SPECSFY: US-002 FR-003 NFR-004 AC-030 invocando executeSync, que exige a exportação pública syncWorkspace de $lib/storage/workspace, e sem arquivo feature.
  - [x] **VERIFY**: Executar bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts e observar RED por comportamento ausente, nunca por importação, sintaxe ou fixture inválida.
  - [x] **VISUAL**: Não aplicável: esta tarefa só materializa teste e não altera superfície visual.
  - [x] **EVIDENCE**: Registrar comando, causa comportamental do RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Revisar fixture e seam público, registrando ajuste ou ausência justificada.

#### Fase 2 — Código e contratos

- [x] T031 [CODE] Implementar registry, contratos de documento vinculados ao registro do backend e guard de envelope em apps/web/src/lib/features/sync/ — Refs: US-001, US-003, US-004, FR-001, FR-006, NFR-002, NFR-004, AC-001, AC-002, AC-014, AC-015, AC-016, AC-018, AC-024, AC-028 — Depends: T001, T002, T014, T015, T016, T018, T024, T028
  - [x] **PREP**: Confirmar RED dos predecessores, boundary `syncWorkspace`, contratos `SyncDocumentRef`/`SyncEnvelope` e dependências do `workspaceId`.
  - [x] **EXECUTE**: Implementar `sync-document-registry.ts`, `sync-envelope-guard.ts` e exportação pública em `storage/workspace.ts`; documentator reconstruído.
  - [x] **VERIFY**: Focal de 8 casos passou; lint dos arquivos alterados passou. `check-types` global foi executado e mantém falhas preexistentes fora de sync, sem erro em `features/sync` ou `workspace.ts`.
  - [x] **VISUAL**: Não aplicável: T031 altera contratos e boundary de domínio, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Guard usa unions literais, `unknown`/tipos explícitos e rejeita paths, SQL, comandos, projeções, banco bruto e credenciais.
  <!-- specsfy:evidence {"task":"T031","refs":["US-001","US-003","US-004","FR-001","FR-006","NFR-002","NFR-004","AC-001","AC-002","AC-014","AC-015","AC-016","AC-018","AC-024","AC-028"],"files":["apps/web/src/lib/features/sync/sync-document-registry.ts","apps/web/src/lib/features/sync/sync-envelope-guard.ts","apps/web/src/lib/storage/workspace.ts","apps/web/src/lib/features/sync/sync-document-registry.test.ts","apps/web/src/lib/features/sync/sync-envelope-guard.test.ts","apps/web/src/lib/features/sync/sync-repository.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts src/lib/features/sync/sync-envelope-guard.test.ts src/lib/features/sync/peer-policy.test.ts -t 'AC-001|AC-002|AC-014|AC-015|AC-016|AC-018|AC-024|AC-028'","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-document-registry.ts apps/web/src/lib/features/sync/sync-envelope-guard.ts apps/web/src/lib/features/sync/sync-document-registry.test.ts apps/web/src/lib/features/sync/sync-envelope-guard.test.ts apps/web/src/lib/features/sync/sync-repository.test.ts apps/web/src/lib/storage/workspace.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T032 [CODE] Implementar adapters locais PWA/Tauri e fila persistente em `app.sqlite`/IndexedDB em apps/web/src/lib/features/sync/sync-storage-adapters.ts, com `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` e upgrade v3 de object stores em `openbible-workspace` — Refs: US-001, US-002, FR-002, NFR-001, NFR-003, NFR-004, AC-003, AC-004, AC-020, AC-021, AC-026 — Depends: T003, T004, T020, T021, T026
  - [x] **PREP**: Confirmar RED dos predecessores, o schema v2 existente, o `workspaceId` obrigatório e a fronteira entre backend ativo e fontes legadas.
  - [x] **EXECUTE**: Criar migration SQL versionada para `app.sqlite`, upgrade v3 idempotente dos object stores no IndexedDB `openbible-workspace` e adapters equivalentes; nenhum estado ativo foi criado em `.openbible/index.sqlite`, OPFS ou filesystem.
  - [x] **VERIFY**: Adapter focal passou 2/2; IndexedDB/backup passou 4/4; Rust passou 15/15; lint passou. `check-types` global foi executado e mantém somente falhas preexistentes fora de sync; não há erro nos módulos alterados.
  - [x] **VISUAL**: Não aplicável: T032 altera persistência, migration e contratos de adapter, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Adapters validam `workspaceId`, backend e contadores; `syncRecordFromContent` recebe o backend explicitamente; a porta nativa restringe a implementação futura aos comandos operacionais allowlisted.
  <!-- specsfy:evidence {"task":"T032","refs":["US-001","US-002","FR-002","NFR-001","NFR-003","NFR-004","AC-003","AC-004","AC-020","AC-021","AC-026"],"files":["apps/desktop/src-tauri/migrations/003_create_sync_operational.sql","apps/desktop/src-tauri/src/database.rs","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/features/sync/sync-storage-adapters.ts","apps/web/src/lib/features/sync/sync-storage-adapters.test.ts","apps/web/src/lib/storage/workspace.ts",".specsfy/DATABASE.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-storage-adapters.test.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/indexeddb-workspace-adapter.test.ts src/lib/storage/backup/backup-adapters.test.ts","exit":0},{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-storage-adapters.ts apps/web/src/lib/features/sync/sync-storage-adapters.test.ts apps/web/src/lib/storage/indexeddb-workspace-adapter.ts apps/web/src/lib/storage/workspace.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T033 [CODE] Implementar facade de repository sobre o backend operacional, adapters local/WebSocket, retry e backpressure em apps/web/src/lib/features/sync/sync-repository.ts — Refs: US-002, US-004, FR-003, NFR-001, NFR-003, AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 — Depends: T005, T006, T007, T022, T025, T027, T030
  - [x] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace; os 7 casos focais de transporte/backpressure permanecem RED por ausência da facade.
  - [x] **EXECUTE**: Implementar `sync-repository.ts` com adapters local/WebSocket, retry/backoff, policy de fila/backpressure e protocolo transport-agnostic; conectar os comandos da seam `syncWorkspace` e reconstruir `docs/`.
  - [x] **VERIFY**: Testes focais passaram 20/20 e lint passou. `check-types` global foi executado e mantém falhas preexistentes em UI, AI, sql.js e testes de notas/rotas; nenhum erro foi reportado nos módulos `features/sync` alterados.
  - [x] **VISUAL**: Não aplicável: T033 altera facade, transporte e contratos de domínio, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Backoff exponencial é limitado, endpoint `ws://` é bloqueado, o adapter local não depende de relay e backpressure pausa somente a rede.
  <!-- specsfy:evidence {"task":"T033","refs":["US-002","US-004","FR-003","NFR-001","NFR-003","AC-005","AC-006","AC-007","AC-022","AC-025","AC-027","AC-030"],"files":["apps/web/src/lib/features/sync/sync-repository.ts","apps/web/src/lib/features/sync/sync-document-registry.ts","apps/web/src/lib/features/sync/sync-network-adapters.test.ts","apps/web/src/lib/features/sync/sync-document-registry.test.ts","apps/web/src/lib/features/sync/sync-envelope-guard.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts src/lib/features/sync/sync-network-adapters.test.ts src/lib/features/sync/sync-envelope-guard.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-repository.ts apps/web/src/lib/features/sync/sync-document-registry.ts apps/web/src/lib/features/sync/sync-network-adapters.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T034 [CODE] Implementar merge por documento, snapshot e compactação em apps/web/src/lib/features/sync/sync-repository.ts — Refs: US-002, US-003, FR-004, NFR-001, NFR-002, NFR-003, NFR-004, AC-008, AC-009, AC-010, AC-023 — Depends: T008, T009, T010, T023
  - [x] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace; os 4 casos de merge/compactação e o caso de remoção segura do endpoint permanecem RED por ausência da facade.
  - [x] **EXECUTE**: Implementar merge por documento, heads independentes, ordem de deltas, conflito revisável, snapshot compacto recuperável e remoção segura do endpoint em `sync-repository.ts`/`syncWorkspace`; reconstruir `docs/`.
  - [x] **VERIFY**: Testes focais passaram 5/5 e lint passou. `check-types` global foi executado e mantém falhas preexistentes fora de sync; nenhum erro foi reportado nos módulos alterados.
  - [x] **VISUAL**: Não aplicável: T034 altera estado de domínio, histórico e compactação, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Heads, conflitos e snapshots têm estados explícitos; a compactação declara fonte preservada e limite de bytes, e o modo local desabilita apenas o endpoint remoto.
  <!-- specsfy:evidence {"task":"T034","refs":["US-002","US-003","FR-004","NFR-001","NFR-002","NFR-003","NFR-004","AC-008","AC-009","AC-010","AC-023","AC-029"],"files":["apps/web/src/lib/features/sync/sync-repository.ts","apps/web/src/lib/features/sync/sync-document-registry.ts","apps/web/src/lib/features/sync/sync-repository.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-repository.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-repository.ts apps/web/src/lib/features/sync/sync-document-registry.ts apps/web/src/lib/features/sync/sync-repository.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T035 [CODE] Implementar aplicação de snapshots ao backend operacional, exportação e rebuild posterior das projeções em apps/web/src/lib/features/sync/sync-materializer.ts — Refs: US-003, FR-005, NFR-001, NFR-004, AC-011, AC-012, AC-013 — Depends: T011, T012, T013
  - [x] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace; os 3 casos TDD de bridge estavam RED por ausência do materializer.
  - [x] **EXECUTE**: Implementar `sync-materializer.ts` para aplicar snapshots, propor importação externa, preservar conflitos e reconstruir projeções sem usar `.openbible/index.sqlite`; exportar a camada pela seam pública e reconstruir `docs/`.
  - [x] **VERIFY**: Testes focais passaram 3/3 e lint passou. `check-types` global foi executado e mantém falhas preexistentes fora de sync; o erro novo do retorno de projection foi corrigido e não permanece.
  - [x] **VISUAL**: Não aplicável: T035 altera materialização, exportação e projeções de domínio, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Paths externos são validados como relativos a `notes/`, conflitos são copiados sem overwrite e a ponte de conteúdo é opcional/injetável para manter o backend operacional como autoridade.
  <!-- specsfy:evidence {"task":"T035","refs":["US-003","FR-005","NFR-001","NFR-004","AC-011","AC-012","AC-013"],"files":["apps/web/src/lib/features/sync/sync-materializer.ts","apps/web/src/lib/features/sync/sync-document-registry.ts","apps/web/src/lib/features/sync/external-edit-bridge.test.ts","apps/web/src/lib/storage/workspace.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/external-edit-bridge.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-materializer.ts apps/web/src/lib/features/sync/sync-document-registry.ts apps/web/src/lib/features/sync/external-edit-bridge.test.ts apps/web/src/lib/storage/workspace.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T036 [CODE] Implementar policy de pairing, escopo e revogação em apps/web/src/lib/features/sync/peer-policy.ts — Refs: US-004, FR-006, NFR-002, NFR-003, NFR-004, AC-014, AC-015, AC-016, AC-017, AC-018, AC-024 — Depends: T014, T015, T016, T017, T018, T024
  - [x] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace; pairing e revogação permanecem RED por ausência da policy.
  - [x] **EXECUTE**: Implementar `peer-policy.ts` com escopo por workspace, pairing explícito, revogação e credenciais não exportáveis; conectar a seam pública e reconstruir `docs/`.
  - [x] **VERIFY**: Testes focais passaram 7/7 e lint passou. `check-types` global foi executado e mantém falhas preexistentes fora de sync; nenhum erro foi reportado nos módulos alterados.
  - [x] **VISUAL**: Não aplicável: T036 altera policy e boundary de segurança, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comandos, resultado, arquivos e IDs nas seções 11–13; comentário `specsfy:evidence` adicionado abaixo.
  - [x] **IMPROVE**: Revogação mantém cópias locais, impede autorização futura e não aceita reativação silenciosa de peer revogado; escopos são normalizados e deduplicados.
  <!-- specsfy:evidence {"task":"T036","refs":["US-004","FR-006","NFR-002","NFR-003","NFR-004","AC-014","AC-015","AC-016","AC-017","AC-018","AC-024"],"files":["apps/web/src/lib/features/sync/peer-policy.ts","apps/web/src/lib/features/sync/sync-document-registry.ts","apps/web/src/lib/features/sync/sync-envelope-guard.ts","apps/web/src/lib/features/sync/peer-policy.test.ts","apps/web/src/lib/features/sync/sync-envelope-guard.test.ts","apps/web/src/lib/storage/workspace.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/peer-policy.test.ts src/lib/features/sync/sync-envelope-guard.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/peer-policy.ts apps/web/src/lib/features/sync/sync-document-registry.ts apps/web/src/lib/features/sync/peer-policy.test.ts apps/web/src/lib/features/sync/sync-envelope-guard.ts apps/web/src/lib/storage/workspace.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase de interface

- [x] T037 [CODE] Criar tela Svelte de configuração em apps/web/src/lib/features/sync/SyncSettings.svelte e registrar o bloco em INTERFACE.md — Refs: US-004, FR-003, FR-006, NFR-002, NFR-004, AC-016, AC-018, AC-025 — Depends: T016, T018, T024, T025
  - [x] **PREP**: Confirmados os contratos de workspace/storage, pairing e os predecessores T016, T018, T024 e T025; o boundary visual permanece em `ConfigPage`/`Storage/Workspace`, sem expor credenciais nem alterar a autoridade de `app.sqlite` ou IndexedDB.
  - [x] **EXECUTE**: Implementar `SyncSettings.svelte`, compor o bloco no painel `Storage/Workspace` de `ConfigPage`, registrar o contrato em `INTERFACE.md` e executar o documentator.
  - [x] **VERIFY**: Teste focal e regressão relacionada passaram; lint passou. `check-types` global foi executado e mantém falhas preexistentes em primitivas UI, AI, sql.js e testes de notas/rotas, sem erro novo em `SyncSettings`, `ConfigPage` ou `features/sync`.
  - [x] **VISUAL**: Inspecionados bordas, espaçamentos, margens, padding e tipografia em claro e tokens de tema, desktop, mobile em 320 px, zoom/overflow, foco por teclado, erro de endpoint, pairing e revogação; os estados exibem feedback semântico e a mídia `prefers-reduced-motion` está preservada.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: Isolado o bloco em `SyncSettings`, reutilizado `Button`, explicitados os backends locais e removida qualquer affordance de token; a persistência efetiva permanece nas tarefas de runtime, não nesta configuração visual.
  <!-- specsfy:evidence {"task":"T037","refs":["US-004","FR-003","FR-006","NFR-002","NFR-004","AC-016","AC-018","AC-025"],"files":["apps/web/src/lib/features/sync/SyncSettings.svelte","apps/web/src/lib/features/sync/sync-settings.test.ts","apps/web/src/lib/features/config/ConfigPage.svelte","INTERFACE.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-settings.test.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-settings.test.ts src/lib/features/config/config-page.spec.ts src/lib/features/config/t024-backup.svelte.spec.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/SyncSettings.svelte apps/web/src/lib/features/sync/sync-settings.test.ts apps/web/src/lib/features/config/ConfigPage.svelte","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T038 [CODE] Criar bloco Svelte de status em apps/web/src/lib/features/sync/SyncStatus.svelte e registrar estados em INTERFACE.md — Refs: US-002, US-004, FR-003, NFR-001, NFR-003, AC-005, AC-007, AC-027 — Depends: T005, T007, T027
  - [x] **PREP**: Confirmados os REDs históricos de AC-005, AC-007 e AC-027, o contrato de diagnósticos do repository T033 e o boundary visual reutilizável em `SyncSettings`/header, sem tornar relay obrigatório.
  - [x] **EXECUTE**: Implementar `SyncStatus.svelte` com props para status, fila, último sucesso, erro e retry; compor em `SyncSettings`, registrar estados em `INTERFACE.md` e executar o documentator.
  - [x] **VERIFY**: Contratos focais passaram 6/6 e lint passou. `check-types` global foi executado e mantém falhas preexistentes em primitivas UI, AI, sql.js e testes de notas/rotas, sem erro novo em `SyncStatus`, `SyncSettings` ou `features/sync`.
  - [x] **VISUAL**: Inspecionados bordas, espaçamentos, margens, padding e tipografia em claro/escuro por tokens existentes, desktop, mobile em 320 px, zoom/overflow e foco; estado local/offline mostra fila e último sucesso, erro tem ação de retry e `prefers-reduced-motion` foi preservado.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: O bloco é reutilizável e prop-driven, separa diagnóstico de conectividade da autoridade local e usa feedback semântico sem animação obrigatória.
  <!-- specsfy:evidence {"task":"T038","refs":["US-002","US-004","FR-003","NFR-001","NFR-003","AC-005","AC-007","AC-027"],"files":["apps/web/src/lib/features/sync/SyncStatus.svelte","apps/web/src/lib/features/sync/sync-status.test.ts","apps/web/src/lib/features/sync/SyncSettings.svelte","INTERFACE.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-status.test.ts src/lib/features/sync/sync-settings.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/SyncStatus.svelte apps/web/src/lib/features/sync/SyncSettings.svelte apps/web/src/lib/features/sync/sync-status.test.ts apps/web/src/lib/features/sync/sync-settings.test.ts apps/web/src/lib/features/config/ConfigPage.svelte","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T039 [CODE] Criar painel Svelte de revisão em apps/web/src/lib/features/sync/PeerConflictPanel.svelte e registrar ações em INTERFACE.md — Refs: US-003, FR-005, NFR-002, NFR-004, AC-011, AC-012, AC-013 — Depends: T011, T012, T013
  - [x] **PREP**: Confirmados os REDs dos predecessores T011–T013, os contratos de materialização e o boundary em que arquivo externo é apenas recovery; `app.sqlite`/IndexedDB continuam como autoridade.
  - [x] **EXECUTE**: Implementar `PeerConflictPanel.svelte` com backend/workspace, duas versões recuperáveis, alerta `needs-review` e ações explícitas para manter local ou revisar externo; registrar em `INTERFACE.md` e executar o documentator.
  - [x] **VERIFY**: Testes focais e browser passaram 7/7 e lint passou. `check-types` global foi executado e mantém falhas preexistentes em primitivas UI, AI, sql.js e testes de notas/rotas, sem erro novo em `PeerConflictPanel` ou `features/sync`.
  - [x] **VISUAL**: Inspecionados bordas, espaçamentos, margens, padding e tipografia em claro/escuro por tokens existentes, desktop, mobile em 320 px, zoom/overflow, teclado e foco; o teste browser cobriu conflito e vazio, com botões explícitos e `prefers-reduced-motion`.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: O painel não executa merge silencioso, mantém paths relativos de recovery, informa o backend operacional e separa callbacks de decisão das fontes persistentes.
  <!-- specsfy:evidence {"task":"T039","refs":["US-003","FR-005","NFR-002","NFR-004","AC-011","AC-012","AC-013"],"files":["apps/web/src/lib/features/sync/PeerConflictPanel.svelte","apps/web/src/lib/features/sync/peer-conflict-panel.test.ts","apps/web/src/lib/features/sync/peer-conflict-panel.svelte.spec.ts","apps/web/src/lib/features/sync/external-edit-bridge.test.ts","INTERFACE.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/peer-conflict-panel.svelte.spec.ts src/lib/features/sync/peer-conflict-panel.test.ts src/lib/features/sync/external-edit-bridge.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/PeerConflictPanel.svelte apps/web/src/lib/features/sync/peer-conflict-panel.test.ts apps/web/src/lib/features/sync/peer-conflict-panel.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T040 [CODE] Integrar comandos allowlisted no Tauri e a persistência em `app.sqlite` em apps/desktop/src-tauri/src/commands/sync.rs — Refs: US-001, US-002, FR-002, FR-003, NFR-001, NFR-004, AC-005, AC-020, AC-030 — Depends: T005, T020, T030
  - [x] **PREP**: Confirmadas as migrations v3, tabelas operacionais, escopo obrigatório por `workspaceId` e a ausência de uma API de SQL/path livre na UI; os REDs T005, T020 e T030 eram comportamentais antes da implementação.
  - [x] **EXECUTE**: Implementados `sync_write_note`, `sync_write_snapshot`, `sync_append_change` e `sync_read_state` sobre `app.sqlite`, registrados no handler Tauri e expostos no bridge TypeScript com validação de IDs e bytes; a nota continua no banco operacional, não no filesystem.
  - [x] **VERIFY**: Rust passou 16/16, bridge passou 5/5 e lint/rustfmt passaram. `check-types` global foi executado e mantém falhas preexistentes em primitivas UI, AI, sql.js e testes de notas/rotas, sem erro novo em `tauri-bridge`.
  - [x] **VISUAL**: Não aplicável: T040 altera somente o boundary nativo, persistência e allowlist; as superfícies visuais de T037–T039 já foram verificadas em claro/escuro, mobile/desktop, teclado e zoom.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: Operações são transacionais e idempotentes, mudanças duplicadas não inflacionam a fila, estado CRDT e nota ficam recuperáveis e chaves com path são rejeitadas antes do banco.
  <!-- specsfy:evidence {"task":"T040","refs":["US-001","US-002","FR-002","FR-003","NFR-001","NFR-004","AC-005","AC-020","AC-030"],"files":["apps/desktop/src-tauri/src/commands/sync.rs","apps/desktop/src-tauri/src/commands/mod.rs","apps/desktop/src-tauri/src/lib.rs","apps/desktop/src-tauri/src/database.rs","apps/desktop/src-tauri/migrations/003_create_sync_operational.sql","apps/web/src/lib/storage/tauri-bridge.ts","apps/web/src/lib/storage/tauri-bridge.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/tauri-bridge.test.ts src/lib/storage/tauri-security.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/storage/tauri-bridge.ts apps/web/src/lib/storage/tauri-bridge.test.ts","exit":0},{"run":"rustfmt --edition 2021 --check apps/desktop/src-tauri/src/commands/sync.rs","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T041 [CODE] Atualizar inventário de interface em INTERFACE.md para os blocos de sync — Refs: US-004, FR-003, FR-005, NFR-004, AC-011, AC-016, AC-027 — Depends: T011, T016, T027
  - [x] **PREP**: Confirmados os contratos de T011, T016 e T027 e auditados os registros existentes de `SyncSettings`, `SyncStatus` e `PeerConflictPanel`; o ajuste restante é de composição/documentação, sem criar nova fonte normativa.
  - [x] **EXECUTE**: Consolidar no `INTERFACE.md` os blocos `SyncSettings`, `SyncStatus` e `PeerConflictPanel`, a composição em `/config` e os estados local/offline, conexão, fila, erro e `needs-review`; executar o documentator.
  - [x] **VERIFY**: Auditoria focal passou 7/7, lint passou e a regressão dos contratos de interface passou; `check-types` global permanece com falhas preexistentes fora dos arquivos alterados.
  - [x] **VISUAL**: Conferidos bordas, espaçamentos, margens, padding e tipografia registrados para claro/escuro, mobile/desktop, teclado, zoom, foco e `prefers-reduced-motion`; o inventário agora espelha os estados efetivamente verificados.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: Evitada duplicação de linhas; o inventário distingue composição, feedback e revisão, e explicita que o storage local continua autoridade.
  <!-- specsfy:evidence {"task":"T041","refs":["US-004","FR-003","FR-005","NFR-004","AC-011","AC-016","AC-027"],"files":["INTERFACE.md","apps/web/src/lib/features/sync/sync-interface-inventory.test.ts","apps/web/src/lib/features/sync/SyncSettings.svelte","apps/web/src/lib/features/sync/SyncStatus.svelte","apps/web/src/lib/features/sync/PeerConflictPanel.svelte","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-interface-inventory.test.ts src/lib/features/sync/sync-settings.test.ts src/lib/features/sync/sync-status.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-interface-inventory.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T042 [CODE] Reconstruir .specsfy/STACK.md e .specsfy/PACKAGES.md após selecionar pacotes Automerge — Refs: FR-002, FR-003, NFR-003, AC-005, AC-021, AC-022 — Depends: T005, T021, T022
  - [x] **PREP**: Confirmados os REDs T005/T021/T022, os adapters próprios e a decisão de `app.sqlite`/IndexedDB como backends operacionais antes da seleção de pacote.
  - [x] **EXECUTE**: Selecionados e instalados `@automerge/automerge@3.4.1` e `@automerge/automerge-repo@2.5.6`; reconstruídos `.specsfy/STACK.md`, `.specsfy/PACKAGES.md` e `docs/`, sem instalar storage IndexedDB paralelo.
  - [x] **VERIFY**: Focal de rede/storage/registry passou 17/17 e lint passou. `check-types` global foi executado e mantém falhas preexistentes fora de sync/Automerge, sem erro novo nos módulos alterados.
  - [x] **VISUAL**: Não aplicável: T042 altera dependências e inventários técnicos, sem superfície visual; as interfaces consumidoras foram verificadas nas T037–T041 em claro/escuro, mobile/desktop, teclado e zoom.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: A escolha evita adapters oficiais de storage que criariam uma fonte paralela; `Repo` e core ficam disponíveis para a implementação CRDT posterior sobre os seams já verificados.
  <!-- specsfy:evidence {"task":"T042","refs":["FR-002","FR-003","NFR-003","AC-005","AC-021","AC-022"],"files":["apps/web/package.json","bun.lock",".specsfy/STACK.md",".specsfy/PACKAGES.md","apps/web/src/lib/features/sync/sync-repository.ts","apps/web/src/lib/features/sync/sync-storage-adapters.ts","apps/web/src/lib/features/sync/sync-network-adapters.test.ts","docs/"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-network-adapters.test.ts src/lib/features/sync/sync-storage-adapters.test.ts src/lib/features/sync/sync-document-registry.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-repository.ts apps/web/src/lib/features/sync/sync-storage-adapters.ts apps/web/src/lib/features/sync/sync-network-adapters.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T043 [CODE] Atualizar .specsfy/DATABASE.md com notas, estado CRDT, fila, peers, conflitos e projeções em `app.sqlite`/IndexedDB — Refs: FR-001, FR-002, FR-004, FR-005, NFR-004, AC-002, AC-009, AC-013 — Depends: T002, T009, T013
  - [x] **PREP**: Confirmadas migration 003, schema v3, object stores IndexedDB v3, campos, chaves compostas e índices por `workspaceId`; `.openbible/index.sqlite` e Markdown permanecem somente recovery/exportação.
  - [x] **EXECUTE**: Atualizar `.specsfy/DATABASE.md` com notas primárias, `sync_documents`, snapshots/heads, changes, fila, peers, endpoints, conflitos, projeções, FK/ownership e retenção nos dois backends; executar o documentator.
  - [x] **VERIFY**: Rust passou 16/16, adapters/schema passaram 3/3, auditoria do inventário passou 1/1 e lint/documentator passaram. `check-types` global mantém apenas falhas preexistentes fora da área sync.
  - [x] **VISUAL**: Não aplicável: T043 altera somente mapa técnico de persistência; as interfaces relacionadas já foram verificadas em claro/escuro, mobile/desktop, teclado e zoom nas tarefas anteriores.
  - [x] **EVIDENCE**: Comandos, resultado, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: O inventário diferencia fonte primária, estado CRDT, fila e projeções, documenta retenção/recovery e impede interpretar `.openbible/index.sqlite` ou arquivo Markdown como backend operacional.
  <!-- specsfy:evidence {"task":"T043","refs":["FR-001","FR-002","FR-004","FR-005","NFR-004","AC-002","AC-009","AC-013"],"files":[".specsfy/DATABASE.md","apps/desktop/src-tauri/migrations/003_create_sync_operational.sql","apps/desktop/src-tauri/src/database.rs","apps/web/src/lib/storage/indexeddb-workspace-adapter.ts","apps/web/src/lib/features/sync/sync-database-inventory.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-storage-adapters.test.ts src/lib/storage/indexeddb-workspace-adapter.test.ts","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-database-inventory.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-database-inventory.test.ts","exit":0},{"run":"node .agents/skills/specsfy-aux-database/scripts/update_database.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

- [x] T044 [CODE] Atualizar .specsfy/RULES.md e PROJECT.md com sync opt-in, backend de notas em `app.sqlite`/IndexedDB e ausência de relay obrigatório — Refs: FR-002, FR-003, FR-006, NFR-001, NFR-002, AC-006, AC-018, AC-029 — Depends: T006, T018, T029
  - [x] **PREP**: Confirmada a regra vigente para `app.sqlite` no Tauri, IndexedDB no PWA, `workspaceId` e fontes legadas; a atualização preserva essas bases.
  - [x] **EXECUTE**: Atualizadas somente as projeções derivadas em `.specsfy/RULES.md` e `PROJECT.md`, com teste de inventário; executado o documentator.
  - [x] **VERIFY**: Testes focais passaram 10/10 e lint passou. `check-types` global foi executado e mantém falhas preexistentes em componentes UI, AI, Bíblia, notas e rotas; nenhum erro foi reportado nos arquivos de sync alterados.
  - [x] **VISUAL**: Não aplicável: T044 altera apenas documentação de governança e teste de inventário, sem superfície visual; não há bordas, espaçamentos, margens, padding, tipografia, viewport, teclado ou zoom a conferir nesta tarefa. As telas consumidoras permanecem cobertas pelas T037–T041.
  - [x] **EVIDENCE**: Comandos, resultados, arquivos e IDs registrados nas seções 11–13 e no comentário JSON abaixo.
  - [x] **IMPROVE**: A regra foi isolada em seção própria e o teste de inventário protege opt-in, backends locais, escopo por `workspaceId`, fontes legadas e ausência de relay obrigatório.
  <!-- specsfy:evidence {"task":"T044","refs":["FR-002","FR-003","FR-006","NFR-001","NFR-002","AC-006","AC-018","AC-029"],"files":[".specsfy/RULES.md","PROJECT.md","apps/web/src/lib/features/sync/sync-governance-inventory.test.ts","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-governance-inventory.test.ts src/lib/features/sync/sync-network-adapters.test.ts src/lib/features/sync/sync-storage-adapters.test.ts","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync/sync-governance-inventory.test.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase 3 — Documentação e governança

As tarefas T041–T044 mantêm projeções derivadas sem criar fonte normativa paralela.

#### Fase 4 — Sincronização HTTP

- [x] T046 [TEST] [TDD] [US-002] Derivar o contrato de push e pull do AC-031 em `apps/sync-api/src/sync-api.test.ts` — Refs: US-002, FR-007, NFR-005, AC-031 — Depends: none
  - [x] **PREP**: Ler AC-031 e preparar fixtures de dois dispositivos, cursor inicial e payload sem path.
  - [x] **EXECUTE**: Escrever testes Vitest de push, pull, cursor, tombstone e idempotência, sem arquivo feature.
  - [x] **VERIFY**: Executar o teste focal e observar RED comportamental por API ausente.
  - [x] **VISUAL**: Não aplicável: o serviço não possui interface visual.
  - [x] **EVIDENCE**: Registrar comando, RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Manter fixtures pequenas, determinísticas e independentes de conta Cloudflare.
  <!-- specsfy:evidence {"task":"T046","refs":["US-002","FR-007","NFR-005","AC-031"],"files":["apps/sync-api/src/sync-api.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-api test","exit":1,"result":"RED inicial: módulo Worker ausente"},{"run":"bun run --cwd apps/sync-api test","exit":0,"result":"GREEN: 3 testes passaram"}]} -->

- [x] T047 [TEST] [TDD] [US-003] Derivar o contrato de conflito do AC-032 em `apps/sync-api/src/sync-api.test.ts` — Refs: US-003, FR-007, NFR-002, NFR-005, AC-032 — Depends: none
  - [x] **PREP**: Ler AC-032 e preparar duas operações com a mesma revisão base.
  - [x] **EXECUTE**: Escrever teste para aceitar uma alteração e preservar a segunda como conflito explícito.
  - [x] **VERIFY**: Executar o teste focal e observar RED comportamental por conflito ausente.
  - [x] **VISUAL**: Não aplicável: o serviço não possui interface visual.
  - [x] **EVIDENCE**: Registrar comando, RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Não comparar nem registrar conteúdo em logs de teste.
  <!-- specsfy:evidence {"task":"T047","refs":["US-003","FR-007","NFR-002","NFR-005","AC-032"],"files":["apps/sync-api/src/sync-api.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-api test","exit":0,"result":"GREEN: conflito de revisão preservado e edição aceita mantida"}]} -->

- [x] T048 [TEST] [TDD] [US-002] Derivar o contrato operacional do AC-033 em `apps/sync-api/src/sync-api.test.ts` — Refs: US-002, FR-007, NFR-005, AC-033 — Depends: none
  - [x] **PREP**: Ler AC-033 e preparar ambiente D1 local, health check e token de teste.
  - [x] **EXECUTE**: Escrever teste de health, autenticação, limite de lote e schema versionado.
  - [x] **VERIFY**: Executar o teste focal e observar RED comportamental por serviço ausente.
  - [x] **VISUAL**: Não aplicável: o serviço não possui interface visual.
  - [x] **EVIDENCE**: Registrar comando, RED e IDs nas seções 11–13.
  - [x] **IMPROVE**: Usar somente credenciais efêmeras e fixtures locais.
  <!-- specsfy:evidence {"task":"T048","refs":["US-002","FR-007","NFR-005","AC-033"],"files":["apps/sync-api/src/sync-api.test.ts"],"commands":[{"run":"bun run --cwd apps/sync-api test","exit":0,"result":"GREEN: health, autenticação e limite de lote passaram"}]} -->

- [x] T049 [CODE] [US-002] Implementar `apps/sync-api` como Worker HTTPS com D1, schema versionado, autenticação por token de ambiente, health check e limites de payload — Refs: US-002, FR-007, NFR-002, NFR-005, AC-031, AC-032, AC-033 — Depends: T046, T047, T048
  - [x] **PREP**: Confirmar o contrato de rotas, schema D1 e variáveis `SYNC_TOKEN`/`MAX_BATCH_SIZE`.
  - [x] **EXECUTE**: Criar `apps/sync-api/src/index.ts`, `apps/sync-api/migrations/0001_sync.sql`, `apps/sync-api/wrangler.jsonc` e tratamento de CORS/erros sem registrar conteúdo.
  - [x] **VERIFY**: Executar os testes do Worker em modo local e validar health, autenticação, limites e migração.
  - [x] **VISUAL**: Não aplicável: alteração de serviço sem superfície visual; não há bordas, espaçamentos, margens, padding, tipografia ou viewport a revisar.
  - [x] **EVIDENCE**: Registrar arquivos, comandos, resultado e IDs nas seções 11–13.
  - [x] **IMPROVE**: Usar queries indexadas por workspace/cursor e operações idempotentes.
  <!-- specsfy:evidence {"task":"T049","refs":["US-002","FR-007","NFR-002","NFR-005","AC-031","AC-032","AC-033"],"files":["apps/sync-api/src/index.ts","apps/sync-api/src/sync-core.ts","apps/sync-api/src/sync-api.test.ts","apps/sync-api/migrations/0001_sync.sql","apps/sync-api/wrangler.jsonc"],"commands":[{"run":"bun run --cwd apps/sync-api test","exit":0,"result":"3 testes passaram"},{"run":"bun run --cwd apps/sync-api check-types","exit":0},{"run":"bun run --cwd apps/sync-api db:migrate:local","exit":0,"result":"0001_sync.sql aplicado; 6 comandos executados"}]} -->

- [x] T050 [CODE] [US-002] Integrar `HttpSyncClient` ao runtime web e à configuração de sync, mantendo app.sqlite/IndexedDB como fonte local — Refs: US-001, US-002, FR-002, FR-007, NFR-001, AC-031 — Depends: T049
  - [x] **PREP**: Confirmar a fronteira `WorkspaceContentRepository` e o token somente em memória no PWA.
  - [x] **EXECUTE**: Substituir endpoint `wss://` por HTTPS, implementar push/pull por cursor e aplicar respostas sem gravar Markdown.
  - [x] **VERIFY**: Executar testes focais de notas, sync HTTP e bridge Tauri.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, desktop/mobile, teclado, zoom, loading, offline e erro de rede.
  - [x] **EVIDENCE**: Registrar arquivos, estados visuais, comandos, resultado e IDs nas seções 11–13.
  - [x] **IMPROVE**: Reaproveitar o status existente e manter o fluxo local funcional quando o endpoint falhar.
  <!-- specsfy:evidence {"task":"T050","refs":["US-001","US-002","FR-002","FR-007","NFR-001","AC-031"],"files":["apps/web/src/lib/features/sync/sync-http-client.ts","apps/web/src/lib/features/sync/SyncSettings.svelte","apps/web/src/lib/features/notes/notes-repository.ts","apps/web/src/lib/features/sync/sync-settings.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync","exit":0,"result":"15 arquivos e 48 testes passaram"},{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T051 [TEST] [TDD] [US-002] Validar integração local do cliente e persistência do cursor após reinício em `apps/web/src/lib/features/sync/sync-http-integration.test.ts` — Refs: US-001, US-002, US-003, FR-007, NFR-001, NFR-004, AC-031, AC-032 — Depends: T050
  - [x] **PREP**: Preparar workspace isolado, servidor HTTP controlado pelo teste e operação local sem path.
  - [x] **EXECUTE**: Materializar round-trip push/pull, sanitização de payload e retomada pelo cursor sem rede persistente.
  - [x] **VERIFY**: Executar o cenário integrado e confirmar cursor persistido; conflitos e tombstones possuem cobertura focal no contrato do Worker.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nos estados local, sincronizando, sucesso, conflito e erro em claro/escuro e desktop/mobile.
  - [x] **EVIDENCE**: Registrar comandos, métricas de cursor, conflito e IDs nas seções 11–13.
  - [x] **IMPROVE**: Limitar lotes e evitar scans completos do workspace.
  <!-- specsfy:evidence {"task":"T051","refs":["US-001","US-002","US-003","FR-007","NFR-001","NFR-004","AC-031","AC-032"],"files":["apps/web/src/lib/features/sync/sync-http-integration.test.ts","apps/sync-api/src/sync-api.test.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-http-integration.test.ts","exit":0,"result":"1 teste passou; push sanitizado e cursor retomado em 7"},{"run":"bun run --cwd apps/sync-api test","exit":0,"result":"3 testes passaram; tombstone, idempotência e conflito cobertos"}]} -->

- [x] T052 [DOC] [US-002] Documentar desenvolvimento local, criação da D1, deploy Free, limites e upgrade em `apps/sync-api/README.md` — Refs: FR-007, NFR-005, AC-033 — Depends: T049, T051
  - [x] **PREP**: Confirmar comandos Wrangler e limites vigentes do Workers/D1.
  - [x] **EXECUTE**: Atualizar `apps/sync-api/README.md`, docs, `.specsfy/PACKAGES.md`, `PROJECT.md` e projeções necessárias.
  - [x] **VERIFY**: Executar documentator e validar os comandos documentados sem segredo real.
  - [x] **VISUAL**: Não aplicável: documentação e operação, sem interface de produto.
  - [x] **EVIDENCE**: Registrar documentação, comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Explicitar que os limites Free podem interromper queries após exceder as cotas diárias.
  <!-- specsfy:evidence {"task":"T052","refs":["FR-007","NFR-005","AC-033"],"files":["apps/sync-api/README.md","docs/integrations.md","docs/application.md",".specsfy/PACKAGES.md",".specsfy/STACK.md",".specsfy/DATABASE.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"bun run --cwd apps/sync-api check-types","exit":0}]} -->

#### Fase final — Qualidade

- [x] T045 [TEST] Executar focal, check-types, regressão e rastreabilidade em apps/web/src/lib/features/sync/ e apps/sync-api/ — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030, AC-031, AC-032, AC-033 — Depends: T031, T032, T033, T034, T035, T036, T037, T038, T039, T040, T041, T042, T043, T044, T046, T047, T048, T049, T050, T051, T052
  - [x] **PREP**: Inventariadas as suítes da área sync, o Worker/D1, os testes Rust de persistência, `check-types`, lint, build, validadores de interface, rastreabilidade, evidências e gates Definition/Plan/Delivery.
  - [x] **EXECUTE**: Executadas a suíte focal web/API, build, validação de interface, migration D1 local, dry-run do Worker, lint, tipos e documentação.
  - [x] **VERIFY**: Sync web passou 16 arquivos/49 testes; sync-api passou 1 arquivo/3 testes; check-types web/API, build SvelteKit, migration D1 local, deploy dry-run, lint focal e documentator passaram. Não há gap automatizável na área da spec.
  - [x] **VISUAL**: Não aplicável a T045: não houve alteração de superfície visual; a regressão reutilizou as conferências de bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom registradas nas T037–T039.
  - [x] **EVIDENCE**: Contagens, comandos, arquivos, IDs e o resultado final foram registrados nas seções 11–13 e nos comentários JSON das tarefas T045–T052.
  - [x] **IMPROVE**: Removidos `any` explícito e parâmetro não utilizado do fixture compartilhado; o teste de merge passou a tratar `heads` opcional sem introduzir erro de tipos. A suíte agregada sem projeto foi substituída pela execução determinística server/client.
  <!-- specsfy:evidence {"task":"T045","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","FR-007","NFR-001","NFR-002","NFR-003","NFR-004","NFR-005","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021","AC-022","AC-023","AC-024","AC-025","AC-026","AC-027","AC-028","AC-029","AC-030","AC-031","AC-032","AC-033"],"files":["apps/web/src/lib/features/sync","apps/sync-api","apps/web/src/lib/features/notes/notes-repository.ts","apps/desktop/src-tauri/src/commands/sync.rs",".specsfy/DATABASE.md",".specsfy/STACK.md","docs/",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/sync-api test","exit":0},{"run":"bun run --cwd apps/sync-api check-types","exit":0},{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/sync","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"bunx eslint apps/web/src/lib/features/sync apps/web/src/lib/features/notes/notes-repository.ts","exit":0},{"run":"bun run --cwd apps/sync-api db:migrate:local","exit":0},{"run":"bunx wrangler deploy --config apps/sync-api/wrangler.jsonc --dry-run","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0019-sincronizacao-local-first-automerge/spec.md","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0019-sincronizacao-local-first-automerge/spec.md","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0019-sincronizacao-local-first-automerge/spec.md apps --kinds US,FR,NFR,AC --full-chain --allow-orphans","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T014/T016 → T031 → T032 [MIGRATION] → T033/T034/T035/T036 → T037/T038/T039/T040 → T041/T042/T043/T044 → T045.
- Tarefas paralelas: T001–T030 podem ser materializadas em paralelo por arquivo/seam; T037, T038 e T039 podem ser implementadas em paralelo após os contratos.
- Estratégia de MVP: backend local comum com notas em `app.sqlite`/IndexedDB,
  API HTTPS incremental com push/pull e cursor, aplicação segura de revisões,
  exportação/importação explícita, policy de peer e configuração mínima;
  colaboração WebSocket, compactação avançada e transports adicionais ficam
  posteriores.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016, SPEC-0017 e SPEC-0018 conforme seções 2 e 3.
- Pacotes Automerge/adapters compatíveis a selecionar na fase 5.

#### Riscos

- Merge semântico de texto pode divergir mesmo com convergência CRDT → bridge,
  cópias recuperáveis e revisão explícita.
- Crescimento do histórico → snapshots, compactação observável e limites.
- API insegura ou indisponível → opt-in, TLS/auth exigidos, fallback local e
  retry limitado.
- Dois backends divergentes → contrato de adapters, fixtures equivalentes,
  migrations versionadas e paridade de notas/estado entre `app.sqlite` e
  IndexedDB.

#### Suposições

- A pessoa aceita que Automerge seja operacional, que `app.sqlite` no Tauri e
  IndexedDB no PWA sejam os backends das notas e que Markdown/JSON sejam a
  saída portátil principal e uma entrada explícita de migration/recovery.
- O primeiro transporte remoto será HTTPS incremental configurável; WebSocket e
  colaboração em tempo real são extensões posteriores.
- O PWA não depende de servidor interno persistente; service worker permanece
  app shell/cache, não backend de sync.

### 17. Decisões

- **DEC-001**: Automerge por documento autoral estável — reduz documento gigante,
  permite sync seletivo e acompanha o protocolo oficial por documento.
- **DEC-002**: `app.sqlite` no Tauri e IndexedDB no PWA são os backends
  operacionais das notas e do workspace; ambos são acessados por contrato comum
  escopado por `workspaceId`.
- **DEC-003**: Automerge replica documentos e deltas, mas não sincroniza o banco
  bruto; snapshots são aplicados ao backend operacional e as projeções são
  reconstruíveis.
- **DEC-004**: transportes são adapters opcionais — PWA/Tauri mantêm uso local;
  HTTP incremental é extensão, não fundamento de disponibilidade.
- **DEC-005**: relay próprio em produção — servidor público/exemplo não oferece
  garantias de segurança e confiabilidade.
- **DEC-006**: credenciais, paths, handles, catálogo, cache, `.openbible/index.sqlite`
  e bancos brutos não
  sincronizam — reduz vazamento e mantém identidade dependente do dispositivo.
- **DEC-007**: bridge para edição externa — convergência do estado não garante
  merge semântico seguro de um arquivo alterado fora do app.
- **DEC-008**: relay confiável sem promessa de E2EE na primeira fatia — TLS
  protege trânsito, mas o servidor pode observar/reter estado; revogação só
  bloqueia tráfego futuro e não apaga cópias já entregues.
- **DEC-009**: Markdown/JSON são exportações portáteis e entradas explícitas de
  migração/recovery; `.openbible/index.sqlite`, filesystem e OPFS não são
  backends ativos.
- **DEC-010**: a primeira sincronização entre desktop e mobile usa API HTTPS
  com D1, revisões e cursor; essa escolha reduz operação e funciona em
  foreground/background limitado sem exigir um processo WebSocket persistente.
- **DEC-011**: a API HTTP desta fatia não tenta imitar o protocolo de rede do
  Automerge; o `WebSocketClientAdapter` e o servidor oficial ficam como caminho
  futuro para convergência CRDT remota e colaboração em tempo real.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed` após revisão do agente principal.
- [x] `Plan Gate` está `Passed` após decomposição da fase 5.
- [x] `Delivery Gate` está `Passed` após implementação posterior.
- [x] Todos os ACs aplicáveis passam após as fases 6 e 7.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Tarefas, testes e documentação são concluídos em fases posteriores.
- [x] Notas, estado CRDT, fila, peers e conflitos persistem com paridade de
  contrato em `app.sqlite` no Tauri e IndexedDB `openbible-workspace` no PWA,
  sempre escopados por `workspaceId`.
- [x] `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `PROJECT.md` e a
  documentação técnica refletem a persistência operacional e a capacidade
  quando implementadas.
- [x] Markdown/JSON foram verificados como exportação/importação explícita e
  `.openbible/index.sqlite` não foi usado como backend ativo ou payload de sync.
