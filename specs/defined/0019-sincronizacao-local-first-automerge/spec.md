# Especificação integrada: Sincronização local-first com Automerge

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0019 |
| Slug | 0019-sincronizacao-local-first-automerge |
| Status | Defined |
| Effort | 9 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Integra CRDT, dois backends de armazenamento, transporte configurável, bridge de edição externa, segurança de peers e preservação autoral. |
| ClickUp Task | |
| Milestones | Pós formatos portáteis e backup; preparação para sincronização entre aparelhos |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
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

#### Fontes e contexto consultados

- `specs/backlog/0020-sincronizacao-local-first-automerge.md` e `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md`.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`, `specs/planned/0017-formatos-portateis-indice-reconstruivel/spec.md` e `specs/planned/0018-backup-restauracao-workspace-pwa/spec.md`.
- `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `apps/web/src/lib/storage/` e `apps/web/src/lib/features/notes/`.

#### Documentação consultada

- Automerge Repositories, Concepts, Storage e Network Sync, documentação oficial, consultada em 2026-09-05.
- Automerge Repo Sync Server README, repositório oficial, consultado em 2026-09-05.
- URLs e notas próprias em `research/automerge-official/evidence.md`.

#### Artefatos de pesquisa armazenados

- `research/automerge-official/evidence.md`: evidência própria indexada, URLs oficiais, data e impacto; sem cópia extensa de conteúdo protegido.

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
- A implantação operacional do relay próprio e sua política de retenção ficam
  fora da primeira fatia; a spec exige apenas boundary, configuração segura e
  fallback local.
- Criptografia ponta a ponta fica fora desta primeira fatia. O relay configurado
  é uma parte confiável da operação e pode observar ou reter o estado CRDT;
  habilitá-lo exige aviso e consentimento explícitos.

### 3. Escopo e atores

#### Incluído

- Identidade estável de documento e mapeamento local para registros do backend,
  com destino opcional de exportação.
- Repository Automerge com storage adapter local sobre `app.sqlite` no Tauri e
  IndexedDB versionado no PWA.
- Transportes locais e WebSocket configurável, reconexão e fila de deltas.
- Merge de alterações concorrentes, bridge para edição externa e preservação de
  divergência sem sobrescrita silenciosa.
- Escopo por workspace/documento, pairing/revogação e configuração mínima da
  sincronização na interface existente.
- Diagnósticos locais sem texto autoral, tokens ou paths absolutos.

#### Fora de escopo

- Serviço OpenBible obrigatório, conta, login, cobrança ou nuvem proprietária.
- Sincronizar `.openbible/index.sqlite`, catálogo, paths, handles, caches,
  locks, Bíblias SQLite imutáveis ou credenciais.
- Merge visual perfeito para qualquer edição simultânea de texto Markdown.
- WebRTC, Bluetooth, importação manual de envelopes e servidor multitenant de
  produção nesta fatia.

#### Atores

- **Pessoa autora**: escolhe workspace/documentos, habilita peers, edita e
  resolve divergências.
- **Réplica local**: Tauri ou PWA que persiste notas, registros do workspace e
  estado CRDT no backend operacional do dispositivo.
- **Peer autorizado**: outra réplica do mesmo workspace com escopo concedido.
- **Relay configurado**: transporte intermediário opcional que encaminha
  mensagens, sem ser fonte exclusiva.
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

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve atribuir um ID estável a cada documento sincronizável e manter uma referência local entre ID, `workspaceId`, registro do backend operacional e eventual destino de exportação, sem depender do caminho para identidade.
- **FR-002**: O sistema deve persistir notas, estado CRDT e deltas pendentes no backend operacional do runtime — `app.sqlite` no Tauri e IndexedDB versionado no PWA — e permitir exportar Markdown/JSON sem exigir relay.
- **FR-003**: O sistema deve aceitar zero ou mais transportes configuráveis, incluindo adapter local e WebSocket, com reconexão, fila, timeout, retry e remoção segura do endpoint; habilitar relay exige consentimento de que ele pode observar ou reter o estado CRDT.
- **FR-004**: O sistema deve trocar deltas por documento e mesclar alterações concorrentes preservando histórico, snapshot recuperável e divergências materiais sem descarte silencioso.
- **FR-005**: O sistema deve detectar alteração em exportação ou fonte legada, comparar gerações, propor importação/reconciliação para o backend operacional e preservar ambas as versões quando a equivalência não puder ser provada.
- **FR-006**: O sistema deve impor escopo por workspace/documento, pairing e revogação de peers, rejeitar payloads inválidos, manter paths, handles, índices, caches e credenciais fora do sync e informar que revogação não apaga cópias já entregues.

#### Não funcionais

- **NFR-001**: Disponibilidade local — leitura e edição de documentos previamente carregados devem continuar sem rede ou relay; verificar com testes offline e reinício em PWA/Tauri.
- **NFR-002**: Segurança e privacidade — mensagens não podem transportar segredo, path absoluto, handle ou índice; endpoint inseguro e payload inválido devem ser bloqueados; TLS não pode ser apresentado como E2EE e o consentimento ao relay confiável deve ser verificável por contrato e testes de abuso.
- **NFR-003**: Recursos — fila, retry e compactação devem respeitar limites configuráveis, backpressure e memória; verificar com fixture de 10.000 deltas e métricas de bytes, latência e falhas.
- **NFR-004**: Recuperabilidade e interoperabilidade — notas e o workspace devem continuar utilizáveis a partir de `app.sqlite`/IndexedDB sem estado CRDT, exportações Markdown/JSON devem ser regeneráveis e adapters substituíveis devem manter o contrato; verificar removendo estado CRDT e reconstruindo projeções.

#### Erros e casos-limite

- Workspace indisponível, permissão revogada ou quota esgotada → manter última fonte funcional, suspender sync e oferecer recuperação.
- Relay inválido, sem TLS, timeout ou protocolo incompatível → não enviar conteúdo, exibir diagnóstico recuperável e permitir remover endpoint.
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
`SyncQueueState` (documentId, pendingCount, bytes, retryAt, lastErrorCode) e
`SyncConflict` (documentId, generation local/externa, status, recoveryRef).

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
  sync-network-adapters.ts
  SyncSettings.svelte
apps/desktop/src-tauri/src/commands/sync.rs
apps/desktop/src-tauri/migrations/003_create_sync_operational.sql
apps/web/src/lib/storage/indexeddb-workspace-adapter.ts  # stores versionados
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

Automerge `Repo`, adapters de storage e adapters de rede compatíveis; WebSocket
relay configurável. Autenticação, TLS, timeout e retry são responsabilidade da
integração; servidor público é apenas dev/teste.

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
- **Integração/contrato**: adapters `app.sqlite`/IndexedDB, transportes local/
  WebSocket, round-trip Automerge, aplicação de snapshots ao backend ativo e
  bridge explícita de importação/exportação Markdown/JSON.
- **BDD/aceite**: AC-001 a AC-030 são a referência; cada caso deve manter os
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
> os arquivos e comandos históricos permanecem preservados, e uma nova rodada
> RED será exigida antes do Plan Gate.

Os 30 casos TDD foram materializados e executados em Vitest. Cada caso atravessa
`executeSync`, que importa dinamicamente o módulo existente
`$lib/storage/workspace` e exige a exportação pública
`syncWorkspace(storage, command)`. O RED observado é a ausência desse seam
comportamental (`syncWorkspace` ainda não é exportado); não houve falha de
importação, sintaxe ou fixture. Quando o seam existir, cada caso prosseguirá
até o oráculo do AC correspondente. GREEN e refactor permanecem Pending porque
a fase 7 não foi iniciada.

| ACs | Arquivo | RED observado | GREEN | Refactor |
| --- | --- | --- | --- | --- |
| AC-001, AC-002, AC-003, AC-004, AC-019, AC-020, AC-021, AC-026 | `apps/web/src/lib/features/sync/sync-document-registry.test.ts` | AC-001 foi rederivado para exigir `indexeddb`/`workspaceId`; a execução focal produziu 8 REDs porque a exportação pública `syncWorkspace` ainda está ausente | Pending | Pending |
| AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 | `apps/web/src/lib/features/sync/sync-network-adapters.test.ts` | 7 REDs: exportação pública `syncWorkspace` ausente após chamada pela fixture | Pending | Pending |
| AC-008, AC-009, AC-010, AC-023, AC-029 | `apps/web/src/lib/features/sync/sync-repository.test.ts` | 5 REDs: exportação pública `syncWorkspace` ausente após chamada pela fixture | Pending | Pending |
| AC-011, AC-012, AC-013 | `apps/web/src/lib/features/sync/external-edit-bridge.test.ts` | 3 REDs: exportação pública `syncWorkspace` ausente após chamada pela fixture | Pending | Pending |
| AC-014, AC-015, AC-018, AC-024, AC-028 | `apps/web/src/lib/features/sync/sync-envelope-guard.test.ts` | 5 REDs: exportação pública `syncWorkspace` ausente após chamada pela fixture | Pending | Pending |
| AC-016, AC-017 | `apps/web/src/lib/features/sync/peer-policy.test.ts` | 2 REDs: exportação pública `syncWorkspace` ausente após chamada pela fixture | Pending | Pending |

Comando focal: `bun run --cwd apps/web test:tdd -- src/lib/features/sync/sync-document-registry.test.ts src/lib/features/sync/sync-network-adapters.test.ts src/lib/features/sync/sync-repository.test.ts src/lib/features/sync/external-edit-bridge.test.ts src/lib/features/sync/sync-envelope-guard.test.ts src/lib/features/sync/peer-policy.test.ts` — exit 1, 6 arquivos e 30 testes falhos.

### 12. Plano de testes e rastreabilidade

> As linhas de evidência RED já registradas continuam como histórico da seam
> inicial. Para os ACs alterados pela decisão de persistência, a evidência fica
> `Pending` até os testes afirmarem explicitamente `app.sqlite`, IndexedDB,
> `workspaceId` e a exclusão de `.openbible/index.sqlite` do backend ativo e do
> payload.

| Requisito | Cenários BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-019 | Unidade/integração | `sync-document-registry.test.ts` | AC-001 RED: contrato espera backend `indexeddb` e `workspaceId`; seam `syncWorkspace` ainda ausente |
| FR-002 | AC-003, AC-004, AC-020, AC-021, AC-026 | Unidade/contrato | `sync-document-registry.test.ts` | RED: chamada à seam `syncWorkspace` alcançada; exportação pública ausente |
| FR-003 | AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 | Integração | `sync-network-adapters.test.ts` | RED: chamada à seam `syncWorkspace` alcançada; exportação pública ausente |
| FR-004 | AC-008, AC-009, AC-010, AC-023, AC-029 | Unidade/integração | `sync-repository.test.ts` | RED: chamada à seam `syncWorkspace` alcançada; exportação pública ausente |
| FR-005 | AC-011, AC-012, AC-013 | Unidade/contrato | `external-edit-bridge.test.ts` | RED: chamada à seam `syncWorkspace` alcançada; exportação pública ausente |
| FR-006 | AC-014, AC-015, AC-016, AC-017, AC-018, AC-024, AC-028 | Unidade/segurança | `sync-envelope-guard.test.ts`, `peer-policy.test.ts` | RED: chamada à seam `syncWorkspace` alcançada; exportação pública ausente |
| NFR-001 | AC-001, AC-005, AC-008, AC-013, AC-019, AC-029 | Integração | suíte focal | RED: disponibilidade local não declarada |
| NFR-002 | AC-010, AC-012, AC-014, AC-015, AC-018, AC-024, AC-025 | Segurança | suíte focal | RED: guard/TLS/segredo ausentes |
| NFR-003 | AC-004, AC-007, AC-017, AC-022, AC-023, AC-026, AC-027 | Carga/integração | suíte focal | RED: limites/diagnósticos ausentes |
| NFR-004 | AC-002, AC-006, AC-009, AC-011, AC-016, AC-020, AC-021, AC-028, AC-030 | Contrato/regressão | suíte focal | RED: portabilidade/adapters ausentes |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado atual**: Passed em 2026-09-07 — READY; a definição agora declara
  `app.sqlite` no Tauri e IndexedDB `openbible-workspace` no PWA como backends
  das notas, com Automerge operacional, Markdown/JSON como exportação/importação
  explícita e fontes legadas fora do backend ativo.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0019-sincronizacao-local-first-automerge/spec.md --allow-draft`
- **FIND-SEC-001** [P1] [Resolved] TLS/pairing não declaravam que o relay ainda pode observar ou reter o estado — Refs: FR-003, FR-006, NFR-002, AC-017, AC-018, AC-025 — Evidence: spec.md:90 — Effect: a pessoa poderia interpretar transporte seguro como E2EE e superestimar revogação — Suggestion: resolvido com consentimento explícito, token PWA apenas em memória, ausência de promessa E2EE e aviso de que revogação não apaga cópias entregues.
- **FIND-ARCH-001** [P2] [Resolved] credencial de relay tinha storage “seguro” genérico apesar de a PWA não possuir cofre equivalente — Refs: AC-018, FR-006 — Evidence: spec.md:151 — Effect: implementação poderia persistir token silenciosamente no browser — Suggestion: resolvido com cofre do SO no Tauri e sessão somente em memória no PWA.
- **FIND-ARCH-002** [P1] [Resolved] a versão anterior tratava Markdown/JSON como fonte e SQLite como projeção — Refs: FR-001, FR-002, FR-005, NFR-004, AC-002, AC-011, AC-013, AC-020, AC-021 — Evidence: spec.md:44-47, 600-631 — Effect: implementação poderia gravar notas no filesystem/OPFS e divergir da decisão de `app.sqlite`/IndexedDB — Suggestion: resolvido ao tornar `app.sqlite`/IndexedDB os backends operacionais, explicitar migration v3/SQL 003 e limitar arquivos a exportação/importação/recovery.

#### Gate do Ato II — Plano

- **Resultado atual**: Pending — o plano precisa reconciliar os REDs afetados,
  incluir migration versionada para `app.sqlite` e upgrade dos object stores
  IndexedDB, além de atualizar a rastreabilidade.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0019-sincronizacao-local-first-automerge/spec.md`
- **Achados**: `validate_tasks --allow-draft`, `validate_tasks` e `validate_interface_tasks` passaram; o auditor global mantém somente marcadores órfãos históricos de outras specs, fora desta spec.

#### Gate do Ato III — Entrega

- **Resultado atual**: Pending — nenhuma implementação nova desta revisão foi
  validada; o resultado anterior fica preservado como histórico e não pode
  aprovar a persistência corrigida.
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0019-sincronizacao-local-first-automerge/spec.md apps/web/src/lib/features/sync`
  - **Achados**: `Rastreabilidade: 44/44 IDs cobertos em 6 arquivos de teste. RESULTADO: OK`. A execução contra a raiz inteira ainda lista marcadores órfãos históricos de outras specs; eles ficam fora do escopo desta spec.

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

- [ ] T002 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-002 com a abertura da nota no backend operacional sem estado CRDT e a regeneração de exportação em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-001, NFR-004, AC-002 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-002, confirmar o backend operacional e preparar fixture sem estado CRDT.
  - [ ] **EXECUTE**: Reescrever o caso para abrir/editar a nota em `app.sqlite`/IndexedDB e regenerar Markdown/JSON como exportação.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental do contrato ausente, nunca falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de persistência/exportação.
  - [ ] **EVIDENCE**: Registrar comando, backend exercitado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e ausência de dependência de filesystem/OPFS.

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

- [ ] T011 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-011 para importação explícita de exportação/fonte legada em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-004, AC-011 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-011, separar exportação/legado de backend ativo e preparar fixture determinística.
  - [ ] **EXECUTE**: Reescrever o caso para produzir proposta de importação sem sobrescrever o registro persistido.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de bridge.
  - [ ] **EVIDENCE**: Registrar comando, origem externa, backend alvo e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture, gerações e recuperação.

- [ ] T012 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-012 para preservar conflito entre importação externa e registro persistido em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-002, AC-012 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-012 e preparar versões externa/importada e persistida.
  - [ ] **EXECUTE**: Reescrever o caso para manter ambas as versões recuperáveis sem substituir a nota do backend.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de conflito.
  - [ ] **EVIDENCE**: Registrar comando, referências de recuperação e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e ausência de overwrite silencioso.

- [ ] T013 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-013 para reconstruir projeção sem depender de `.openbible/index.sqlite` em apps/web/src/lib/features/sync/external-edit-bridge.test.ts — Refs: US-003, FR-005, NFR-001, AC-013 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-013 e preparar backend operacional com projeção ausente.
  - [ ] **EXECUTE**: Reescrever o caso para abrir a nota no backend e reconstruir a projeção sem consultar `.openbible/index.sqlite`.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de recuperação.
  - [ ] **EVIDENCE**: Registrar comando, backend, projeção e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e idempotência do rebuild.

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

- [ ] T020 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-020 para provar persistência da nota e do estado CRDT no `app.sqlite` do Tauri em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-004, AC-020 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-020, confirmar `app.sqlite`, migration e `workspaceId`, e preparar fixture determinística.
  - [ ] **EXECUTE**: Reescrever o caso Vitest para provar que o Tauri grava nota e estado CRDT no `app.sqlite`, sem filesystem como backend ativo.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de boundary nativo.
  - [ ] **EVIDENCE**: Registrar comando, migration, backend exercitado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture, allowlist e isolamento por `workspaceId`.

- [ ] T021 [TEST] [TDD] [US-001] Reconciliar o teste Vitest do AC-021 para provar persistência da nota e do estado CRDT no IndexedDB `openbible-workspace` em apps/web/src/lib/features/sync/sync-document-registry.test.ts — Refs: US-001, FR-002, NFR-004, AC-021 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-021, confirmar banco `openbible-workspace`, stores versionados e `workspaceId`.
  - [ ] **EXECUTE**: Reescrever o caso Vitest para provar persistência da nota e do estado CRDT no IndexedDB, sem OPFS/FSA/service worker como backend.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de boundary PWA.
  - [ ] **EVIDENCE**: Registrar comando, stores, backend exercitado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture, upgrade de schema e isolamento por `workspaceId`.

- [ ] T022 [TEST] [TDD] [US-002] Reconciliar o teste Vitest do AC-022 para manter o registro persistido intacto sob backpressure em apps/web/src/lib/features/sync/sync-network-adapters.test.ts — Refs: US-002, FR-003, NFR-003, AC-022 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-022 e preparar fila vinculada a uma nota persistida no backend ativo.
  - [ ] **EXECUTE**: Reescrever o caso para provar backpressure sem sobrescrever/remover o último registro do backend.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de fila.
  - [ ] **EVIDENCE**: Registrar comando, métricas da fila, backend e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e limite configurável.

- [ ] T023 [TEST] [TDD] [US-002] Reconciliar o teste Vitest do AC-023 para compactar estado sem remover a nota do backend operacional em apps/web/src/lib/features/sync/sync-repository.test.ts — Refs: US-002, FR-004, NFR-003, AC-023 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-023 e preparar snapshot verificável no backend operacional.
  - [ ] **EXECUTE**: Reescrever o caso para compactar CRDT sem remover a nota de `app.sqlite`/IndexedDB.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de compactação.
  - [ ] **EVIDENCE**: Registrar comando, snapshot, backend e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e recuperação após compactação.

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

- [ ] T028 [TEST] [TDD] [US-003] Reconciliar o teste Vitest do AC-028 para rejeitar projeções e banco bruto no payload, permitindo apenas deltas/documentos autorizados em apps/web/src/lib/features/sync/sync-envelope-guard.test.ts — Refs: US-003, FR-006, NFR-004, AC-028 — Depends: none
  - [ ] **PREP**: Ler o Gherkin do AC-028 e preparar banco bruto, projeção e delta autorizado como fixture.
  - [ ] **EXECUTE**: Reescrever o caso para rejeitar `app.sqlite`, IndexedDB, `.openbible/index.sqlite` e projeções no payload.
  - [ ] **VERIFY**: Executar a suíte focal e observar RED comportamental, sem falha estrutural.
  - [ ] **VISUAL**: Não aplicável: esta tarefa só materializa teste de segurança do envelope.
  - [ ] **EVIDENCE**: Registrar comando, campos rejeitados/aceitos e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Revisar fixture e ausência de vazamento de path, índice ou banco bruto.

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

- [ ] T031 [CODE] Implementar registry, contratos de documento vinculados ao registro do backend e guard de envelope em apps/web/src/lib/features/sync/ — Refs: US-001, US-003, US-004, FR-001, FR-006, NFR-002, NFR-004, AC-001, AC-002, AC-014, AC-015, AC-016, AC-018, AC-024, AC-028 — Depends: T001, T002, T014, T015, T016, T018, T024, T028
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T032 [CODE] Implementar adapters locais PWA/Tauri e fila persistente em `app.sqlite`/IndexedDB em apps/web/src/lib/features/sync/sync-storage-adapters.ts, com `apps/desktop/src-tauri/migrations/003_create_sync_operational.sql` e upgrade v3 de object stores em `openbible-workspace` — Refs: US-001, US-002, FR-002, NFR-001, NFR-003, NFR-004, AC-003, AC-004, AC-020, AC-021, AC-026 — Depends: T003, T004, T020, T021, T026
  - [ ] **PREP**: Confirmar RED dos predecessores, o schema v2 existente, o `workspaceId` obrigatório e a fronteira entre backend ativo e fontes legadas.
  - [ ] **EXECUTE**: Criar migration SQL versionada para `app.sqlite`, upgrade transacional dos object stores no IndexedDB `openbible-workspace` e adapters equivalentes; não criar estado ativo em `.openbible/index.sqlite`, OPFS ou filesystem.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T033 [CODE] Implementar facade de repository sobre o backend operacional, adapters local/WebSocket, retry e backpressure em apps/web/src/lib/features/sync/sync-repository.ts — Refs: US-002, US-004, FR-003, NFR-001, NFR-003, AC-005, AC-006, AC-007, AC-022, AC-025, AC-027, AC-030 — Depends: T005, T006, T007, T022, T025, T027, T030
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T034 [CODE] Implementar merge por documento, snapshot e compactação em apps/web/src/lib/features/sync/sync-repository.ts — Refs: US-002, US-003, FR-004, NFR-001, NFR-002, NFR-003, NFR-004, AC-008, AC-009, AC-010, AC-023 — Depends: T008, T009, T010, T023
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T035 [CODE] Implementar aplicação de snapshots ao backend operacional, exportação e rebuild posterior das projeções em apps/web/src/lib/features/sync/sync-materializer.ts — Refs: US-003, FR-005, NFR-001, NFR-004, AC-011, AC-012, AC-013 — Depends: T011, T012, T013
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T036 [CODE] Implementar policy de pairing, escopo e revogação em apps/web/src/lib/features/sync/peer-policy.ts — Refs: US-004, FR-006, NFR-002, NFR-003, NFR-004, AC-014, AC-015, AC-016, AC-017, AC-018, AC-024 — Depends: T014, T015, T016, T017, T018, T024
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

#### Fase de interface

- [ ] T037 [CODE] Criar tela Svelte de configuração em apps/web/src/lib/features/sync/SyncSettings.svelte e registrar o bloco em INTERFACE.md — Refs: US-004, FR-003, FR-006, NFR-002, NFR-004, AC-016, AC-018, AC-025 — Depends: T016, T018, T024, T025
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T038 [CODE] Criar bloco Svelte de status em apps/web/src/lib/features/sync/SyncStatus.svelte e registrar estados em INTERFACE.md — Refs: US-002, US-004, FR-003, NFR-001, NFR-003, AC-005, AC-007, AC-027 — Depends: T005, T007, T027
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T039 [CODE] Criar painel Svelte de revisão em apps/web/src/lib/features/sync/PeerConflictPanel.svelte e registrar ações em INTERFACE.md — Refs: US-003, FR-005, NFR-002, NFR-004, AC-011, AC-012, AC-013 — Depends: T011, T012, T013
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T040 [CODE] Integrar comandos allowlisted no Tauri e a persistência em `app.sqlite` em apps/desktop/src-tauri/src/commands/sync.rs — Refs: US-001, US-002, FR-002, FR-003, NFR-001, NFR-004, AC-005, AC-020, AC-030 — Depends: T005, T020, T030
  - [ ] **PREP**: Confirmar RED dos predecessores, migrations versionadas, escopo por `workspaceId` e ausência de SQL/path arbitrário vindo da UI.
  - [ ] **EXECUTE**: Implementar comandos allowlisted que leem/escrevem notas e estado CRDT em `app.sqlite`, sem expor o filesystem como backend ativo, e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T041 [CODE] Atualizar inventário de interface em INTERFACE.md para os blocos de sync — Refs: US-004, FR-003, FR-005, NFR-004, AC-011, AC-016, AC-027 — Depends: T011, T016, T027
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T042 [CODE] Reconstruir .specsfy/STACK.md e .specsfy/PACKAGES.md após selecionar pacotes Automerge — Refs: FR-002, FR-003, NFR-003, AC-005, AC-021, AC-022 — Depends: T005, T021, T022
  - [ ] **PREP**: Confirmar RED dos predecessores, boundary e dependências do workspace.
  - [ ] **EXECUTE**: Implementar a menor entrega compatível com os contratos públicos e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T043 [CODE] Atualizar .specsfy/DATABASE.md com notas, estado CRDT, fila, peers, conflitos e projeções em `app.sqlite`/IndexedDB — Refs: FR-001, FR-002, FR-004, FR-005, NFR-004, AC-002, AC-009, AC-013 — Depends: T002, T009, T013
  - [ ] **PREP**: Confirmar migrations, tabelas/object stores, campos, chaves por `workspaceId` e fontes legadas somente para recovery.
  - [ ] **EXECUTE**: Registrar o inventário completo de notas, estado CRDT, fila, peers, conflitos e projeções nos dois backends, preservando `.openbible/index.sqlite` como legado e executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

- [ ] T044 [CODE] Atualizar .specsfy/RULES.md e PROJECT.md com sync opt-in, backend de notas em `app.sqlite`/IndexedDB e ausência de relay obrigatório — Refs: FR-002, FR-003, FR-006, NFR-001, NFR-002, AC-006, AC-018, AC-029 — Depends: T006, T018, T029
  - [ ] **PREP**: Confirmar que a regra vigente descreve `app.sqlite` no Tauri, IndexedDB no PWA, `workspaceId` e fontes legadas.
  - [ ] **EXECUTE**: Atualizar somente as projeções derivadas de regra e finalidade, sem transformar esta tarefa em nova fonte normativa; executar o documentator antes do fechamento.
  - [ ] **VERIFY**: Executar testes focais, check-types e regressão relacionada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, teclado e zoom; registrar resultado.
  - [ ] **EVIDENCE**: Registrar comando, resultado, arquivos e IDs nas seções 11–13; adicionar comentário de evidence JSON ao concluir.
  - [ ] **IMPROVE**: Aplicar melhoria de nomes, isolamento ou acessibilidade, ou justificar ausência.

#### Fase 3 — Documentação e governança

As tarefas T041–T044 mantêm projeções derivadas sem criar fonte normativa paralela.

#### Fase final — Qualidade

- [ ] T045 [TEST] Executar focal, check-types, regressão e rastreabilidade em apps/web/src/lib/features/sync/ — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, NFR-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030 — Depends: T031, T032, T033, T034, T035, T036, T037, T038, T039, T040, T041, T042, T043, T044
  - [ ] **PREP**: Identificar suites, checks, evidências e gates.
  - [ ] **EXECUTE**: Executar focal, regressão, validação de interface e rastreabilidade.
  - [ ] **VERIFY**: Confirmar RED materializado e ausência de gaps obrigatórios.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia nos estados e viewports relevantes; registrar resultado.
  - [ ] **EVIDENCE**: Registrar contagens, comandos e resultado final nas seções 11–13.
  - [ ] **IMPROVE**: Registrar retrospectiva e próximos riscos sem implementar produção.

### 15. Ordem de execução

- Caminho crítico: T001/T002/T014/T016 → T031 → T032 [MIGRATION] → T033/T034/T035/T036 → T037/T038/T039/T040 → T041/T042/T043/T044 → T045.
- Tarefas paralelas: T001–T030 podem ser materializadas em paralelo por arquivo/seam; T037, T038 e T039 podem ser implementadas em paralelo após os contratos.
- Estratégia de MVP: backend local comum com notas em `app.sqlite`/IndexedDB,
  registry, sync por documento, WebSocket opt-in, aplicação segura de snapshots,
  exportação/importação explícita, policy de peer e configuração mínima;
  compactação avançada e transports adicionais ficam posteriores.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0016, SPEC-0017 e SPEC-0018 conforme seções 2 e 3.
- Pacotes Automerge/adapters compatíveis a selecionar na fase 5.

#### Riscos

- Merge semântico de texto pode divergir mesmo com convergência CRDT → bridge,
  cópias recuperáveis e revisão explícita.
- Crescimento do histórico → snapshots, compactação observável e limites.
- Relay inseguro ou indisponível → opt-in, TLS/auth exigidos, fallback local.
- Dois backends divergentes → contrato de adapters, fixtures equivalentes,
  migrations versionadas e paridade de notas/estado entre `app.sqlite` e
  IndexedDB.

#### Suposições

- A pessoa aceita que Automerge seja operacional, que `app.sqlite` no Tauri e
  IndexedDB no PWA sejam os backends das notas e que Markdown/JSON sejam a
  saída portátil principal e uma entrada explícita de migration/recovery.
- O primeiro transporte remoto será WebSocket configurável; outros são extensões.
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
  WebSocket é extensão, não fundamento de disponibilidade.
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

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed` após revisão do agente principal.
- [ ] `Plan Gate` está `Passed` após decomposição da fase 5.
- [ ] `Delivery Gate` está `Passed` após implementação posterior.
- [ ] Todos os ACs aplicáveis passam após as fases 6 e 7.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Tarefas, testes e documentação são concluídos em fases posteriores.
- [ ] Notas, estado CRDT, fila, peers e conflitos persistem com paridade de
  contrato em `app.sqlite` no Tauri e IndexedDB `openbible-workspace` no PWA,
  sempre escopados por `workspaceId`.
- [ ] `.specsfy/DATABASE.md`, `.specsfy/STACK.md`, `PROJECT.md` e a
  documentação técnica refletem a persistência operacional e a capacidade
  quando implementadas.
- [ ] Markdown/JSON foram verificados como exportação/importação explícita e
  `.openbible/index.sqlite` não foi usado como backend ativo ou payload de sync.
