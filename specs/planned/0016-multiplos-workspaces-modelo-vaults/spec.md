# Especificação integrada: Múltiplos workspaces no modelo de vaults

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0016 |
| Slug | 0016-multiplos-workspaces-modelo-vaults |
| Status | Planned |
| Effort | 8 |
| Effort updated at | 2026-09-05 |
| Effort rationale | A fatia atravessa o catálogo local, a migração do armazenamento singular, três backends de filesystem, isolamento de estado, barreira de autosave, recuperação, exclusão fail-closed e uma superfície responsiva de seleção e gestão. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | In Progress |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible atualmente parte de um único workspace por instalação/origem. Isso limita o fluxo Files Over Apps: a pessoa não consegue manter vários vaults independentes, trocar entre eles como no Obsidian ou levar uma raiz inteira para outro aparelho sem que o aplicativo confunda identidade, conteúdo, índices e preferências. A diferença entre Tauri, File System Access API e OPFS também precisa permanecer explícita, porque alguns ambientes PWA não oferecem uma pasta real do sistema.

#### Resultado desejado

A pessoa consegue cadastrar, criar, selecionar, reencontrar, renomear, remover da lista e excluir com segurança vários workspaces. Existe exatamente um workspace ativo por janela/sessão; todas as leituras, gravações, índices, sincronizações futuras e contextos de agentes resolvem primeiro essa identidade. A raiz autoral continua local e portátil, enquanto o catálogo necessário para reencontrá-la permanece local ao dispositivo.

#### Métricas de sucesso

- 100% das inicializações em uma instalação legada preservam o workspace existente e concluem uma migração idempotente para o catálogo sem mover arquivos autorais.
- 100% das trocas bem-sucedidas demonstram que a operação seguinte lê e grava somente a raiz ativa; uma falha de autosave mantém a raiz anterior ativa.
- 100% das tentativas de exclusão real com marcador ausente, inválido ou arquivo desconhecido são bloqueadas sem opção de forçar.
- O mesmo fluxo de seleção expõe criar, adicionar, gerenciar e recuperar no desktop e no mobile, sem overflow em viewport de 320px.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Como o armazenamento é escolhido hoje? → O projeto possui uma abstração `WorkspaceStorage`, registros singulares de sessão/estado e adaptadores Tauri, File System Access e OPFS; a spec deve introduzir um catálogo sem quebrar esses adaptadores.
- **R-002**: Como a interface atual acomoda a seleção? → `AppSidebar` possui `Sidebar.Header`, `AppFrame` compõe o shell responsivo, e `WorkspaceSettings`/`PermissionRecovery` já concentram configuração e recuperação; a seleção deve reutilizar esses pontos.
- **R-003**: Como separar conteúdo portátil de referências locais? → O manifesto `.openbible/config.json` acompanha a raiz; o catálogo guarda somente referências locais, handles/caminhos locais e último uso, nunca conteúdo ou caminhos na sincronização.

#### Fontes e contexto consultados

- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md` — brief refinado e decisões D-001 a D-012.
- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico e dependências.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` e `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — bootstrap e runtime nativo existentes.
- `PROJECT.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md` e `.specsfy/USER-PROFILE.md`.
- Código atual em `apps/web/src/lib/storage/`, `apps/web/src/lib/features/navigation/` e `apps/web/src/lib/features/workspace/`.

#### Documentação consultada

- Specsfy/2.0 e template local de spec — formato, gates, rastreabilidade e contrato de interface.
- Documentação do próprio projeto sobre SvelteKit/Svelte 5, Tailwind 4, shadcn-svelte, Tauri, OPFS e a abstração `WorkspaceStorage` — restrições de stack e armazenamento observadas localmente.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo foi necessário; as conclusões normativas estão apoiadas nas fontes locais acima.

#### Dúvidas respondidas

- **Q**: Haverá uma experiência única de workspaces entre plataformas? → **A**: Sim. Tauri usa pastas reais; navegador compatível usa pasta selecionada; PWA sem filesystem usa workspaces lógicos isolados no OPFS, todos apresentados pelo mesmo catálogo e seletor.
- **Q**: Onde fica o seletor? → **A**: No topo da `Sidebar` desktop e no header/drawer mobile, com trocar, criar, adicionar pasta existente e gerenciar.
- **Q**: O que ocorre com conteúdo não salvo? → **A**: O autosave termina antes da troca; falha bloqueia a troca e oferece tentar novamente ou descartar explicitamente e trocar.
- **Q**: Remover e apagar são a mesma ação? → **A**: Não. Remover da lista preserva todos os arquivos; excluir workspace é ação separada com confirmação forte.
- **Q**: Quando uma raiz real pode ser apagada? → **A**: Somente com marcador de raiz gerenciada válido, propriedade comprovada e ausência de arquivos desconhecidos; em qualquer dúvida, bloqueia sem forçar.
- **Q**: Como tratar workspace indisponível? → **A**: Preservar a escolha, explicar permissão revogada, ausência, lock ou configuração inválida e oferecer reconectar/tentar novamente/escolher outro, sem fallback silencioso.
- **Q**: Nome e identidade são a mesma coisa? → **A**: Não. O ID estável identifica a raiz; o nome inicial vem da pasta e pode ser editado sem renomear a pasta física.
- **Q**: Como migrar o registro atual? → **A**: Cadastrar automaticamente o workspace atual como primeiro registro, gerar ID estável, preservar nome e dados e mantê-lo ativo, sem onboarding repetido.
- **Q**: O catálogo deve sincronizar? → **A**: Não. É um catálogo local por dispositivo; caminhos, handles e referências OPFS nunca entram no conteúdo sincronizável.
- **Q**: O que identifica uma raiz gerenciada? → **A**: `.openbible/config.json` com marcador de formato v2 e `managedRoot` criado quando o OpenBible prepara uma raiz dedicada; uma pasta arbitrária adicionada começa não gerenciada.
- **Q**: Como tratar ID duplicado? → **A**: Oferecer atualizar a localização existente preservando o ID ou criar uma cópia independente com novo ID; nunca manter duas raízes locais para o mesmo ID.

#### Dúvidas abertas

- Nenhuma lacuna de produto bloqueia a definição inicial. Detalhes de APIs de cada backend, esquema físico do catálogo e casos de teste serão materializados nas fases de plano e TDD, sem reabrir as decisões acima.

### 3. Escopo e atores

#### Incluído

- Catálogo local por dispositivo e ponte entre o catálogo e o workspace ativo.
- Migração idempotente do registro singular atual.
- Criar, adicionar pasta existente, selecionar, renomear, reconectar, remover da lista e excluir workspace.
- Backends adaptativos para pasta Tauri, pasta selecionada pelo navegador e raiz lógica OPFS.
- Manifesto portátil `.openbible/config.json` v2 com ID, nome e `managedRoot`.
- Isolamento de conteúdo, índices, preferências de conteúdo, sincronização futura e contexto de IA por ID ativo.
- Barreira de autosave, token de geração para invalidar operações assíncronas antigas, recuperação e exclusão fail-closed.
- Seletor/gestão em SvelteKit desktop e mobile, com estados de carregamento, vazio, erro, permissão e sucesso.
- Testes de contrato de catálogo/adapters, estado de troca, migração, segurança da exclusão e interface.

#### Fora de escopo

- Mudança do formato autoral de notas, fences, versículos, iframes ou exportação PDF; pertence a BACKLOG-0018.
- Backup ZIP/restauração PWA; pertence a BACKLOG-0019.
- Automerge, transporte remoto, resolução de conflitos e sincronização do catálogo; pertence a BACKLOG-0020.
- Agentes, credenciais, embeddings e política de contexto; pertence a BACKLOG-0021.
- Renomear pasta física, abrir duas raízes simultaneamente na mesma janela ou sincronizar caminhos/handles.
- Implementação de código nesta etapa; a execução começa somente após o Plan Gate e será delegada separadamente.

#### Atores

- **Pessoa usuária individual**: cria, escolhe e administra as próprias raízes locais; confirma ações destrutivas.
- **OpenBible web/PWA**: coordena catálogo, estado ativo, adaptador de storage, autosave e recuperação dentro das capacidades do navegador.
- **OpenBible Tauri**: acessa pastas reais por bridge nativa e aplica lock de escritor por workspace.
- **Catálogo local do dispositivo**: guarda referências de reencontro; não é autoridade do conteúdo autoral e não é sincronizado.

### 4. Princípios e restrições do projeto

- **PR-001 — Files Over Apps**: notas, Bíblias, anexos e demais dados autorais pertencem à raiz do workspace; o aplicativo deve ser substituível sem tornar o conteúdo ilegível.
- **PR-002 — Identidade portátil**: o ID e o nome portátil pertencem ao manifesto `.openbible/config.json`; caminho, handle e referência OPFS pertencem somente ao dispositivo.
- **PR-003 — Um ativo por janela**: toda operação recebe o workspace ativo de um único contexto; uma operação sem identidade ativa falha explicitamente.
- **PR-004 — Catálogo local**: o catálogo não guarda conteúdo, não é incluído em sync/backup de conteúdo e pode ser reconstruído por recadastro da raiz.
- **PR-005 — Migração conservadora**: migração idempotente não move, renomeia ou reescreve conteúdo autoral; falha parcial restaura o ponteiro anterior.
- **PR-006 — Barreira de troca**: nenhuma abertura do destino começa antes do autosave ou descarte explícito do workspace anterior terminar.
- **PR-007 — Stale async**: cada abertura/troca recebe token de geração; respostas de gerações antigas não podem substituir o workspace ativo mais novo.
- **PR-008 — Capabilities explícitas**: cada backend declara capacidades como `selectFolder`, `createLogicalRoot`, `reconnect`, `deleteManagedRoot` e `writeManifest`; UI e casos de uso não assumem uma capability ausente.
- **PR-009 — Exclusão fail-closed**: ausência de marcador, propriedade não comprovada, arquivo desconhecido, lock ou erro de varredura bloqueia a exclusão sem opção de força.
- **PR-010 — Stack existente**: preservar SvelteKit/Svelte 5, Tailwind 4 e primitives shadcn-svelte já presentes; não introduzir React ou servidor local como requisito.

### 5. Histórias de usuário

#### US-001 — Criar, cadastrar e selecionar um workspace (P1)

Como pessoa usuária, quero criar ou adicionar múltiplos workspaces e selecionar o ativo em um seletor semelhante ao de vaults do Obsidian, para organizar conteúdos independentes por raiz.

**Por que P1**: é a capacidade-base que habilita a separação de dados e todos os fluxos posteriores.
**Teste independente**: cadastrar duas raízes em cada backend disponível, selecionar cada uma e confirmar que o nome ativo e o conteúdo visível correspondem à raiz selecionada.
**Requisitos**: FR-001, FR-002, FR-004

#### US-002 — Trocar e recuperar o workspace ativo com segurança (P1)

Como pessoa usuária, quero trocar de workspace sem perder alterações e recuperar uma raiz indisponível, para continuar trabalhando com previsibilidade.

**Por que P1**: troca insegura pode perder dados ou expor conteúdo de outra raiz.
**Teste independente**: iniciar autosave pendente, provocar sucesso e falha, trocar com token antigo em voo e iniciar com permissão revogada; validar barreira, geração e recuperação.
**Requisitos**: FR-002, FR-004

#### US-003 — Gerir identidade e ciclo de vida do workspace (P1)

Como pessoa usuária, quero renomear, remover da lista, localizar novamente ou excluir uma raiz com confirmações distintas, para controlar a organização sem destruir arquivos por acidente.

**Por que P1**: a portabilidade exige que a pessoa controle identidade e ciclo de vida sem depender do aplicativo.
**Teste independente**: executar renomeação, remoção, exclusão gerenciada, exclusão bloqueada e colisão de ID; verificar efeitos no catálogo, manifesto e arquivos.
**Requisitos**: FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — Migrar o workspace singular sem repetir onboarding

**Cobre**: US-001, FR-001, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-002 @AC-001
Feature: Migração para catálogo de workspaces

  Scenario: Cadastrar automaticamente o workspace legado
    Given existe um workspace singular configurado com notas e seu manifesto legado
    And o catálogo local ainda não possui entradas
    When o OpenBible inicia a versão com múltiplos workspaces
    Then ele gera uma identidade estável e cadastra o workspace legado como ativo
    And preserva nome, arquivos e referências sem mover ou reescrever conteúdo
    And não exibe onboarding novamente
```

#### AC-002 — Criar workspace usando a capability do ambiente

**Cobre**: US-001, FR-001, FR-004, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-004 @NFR-002 @NFR-003 @AC-002
Feature: Criação adaptativa de workspace

  Scenario: Escolher o backend compatível
    Given a pessoa solicita criar um workspace
    When o ambiente é Tauri, navegador com seleção de pasta ou PWA sem filesystem
    Then o sistema usa respectivamente pasta real, pasta autorizada ou raiz lógica isolada no OPFS
    And grava um manifesto v2 com ID, nome e managedRoot conforme a capability disponível
    And apresenta o workspace criado como ativo
```

#### AC-003 — Selecionar e persistir o workspace ativo

**Cobre**: US-001, FR-001, FR-004, NFR-003

```gherkin
@US-001 @FR-001 @FR-004 @NFR-003 @AC-003
Feature: Seletor de workspace

  Scenario: Trocar pelo seletor responsivo
    Given existem pelo menos dois workspaces cadastrados
    When a pessoa abre o seletor na Sidebar desktop ou no header/drawer mobile
    Then ela identifica visualmente o nome do ativo e pode escolher outro, criar, adicionar ou gerenciar
    And a seleção pode ser executada por mouse ou teclado com foco previsível
    And o catálogo persiste o novo ativo para a próxima inicialização da mesma instalação
```

#### AC-004 — Isolar por completo o contexto da raiz ativa

**Cobre**: US-001, US-002, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-002 @NFR-001 @NFR-002 @AC-004
Feature: Isolamento por workspace

  Scenario: Alternar entre raízes sem misturar dados
    Given workspace A e workspace B possuem notas, Bíblias, preferências e índices distintos
    When a pessoa seleciona B após trabalhar em A
    Then toda leitura, gravação e indexação seguinte resolve somente a raiz de B
    And conteúdo, preferências, sincronização futura e contexto de IA de A não aparecem em B
```

#### AC-005 — Concluir autosave antes da troca

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-005
Feature: Barreira de autosave na troca

  Scenario: Trocar depois de salvar pendências
    Given o workspace A possui uma alteração pendente de autosave
    When a pessoa solicita o workspace B
    Then o OpenBible conclui o autosave de A antes de abrir B
    And somente depois do sucesso publica B como ativo
    And a alteração fica persistida na raiz de A
```

#### AC-006 — Bloquear troca quando autosave falha

**Cobre**: US-002, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-006
Feature: Falha de autosave na troca

  Scenario: Oferecer retry ou descarte explícito
    Given o workspace A possui alteração pendente
    And o autosave falha
    When a pessoa tenta trocar para B
    Then A permanece ativo e o erro identifica o autosave
    And a interface oferece Tentar novamente e Descartar e trocar
    And B não é aberto até a pessoa escolher uma dessas ações
```

#### AC-007 — Recuperar workspace indisponível sem fallback silencioso

**Cobre**: US-002, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-007
Feature: Recuperação do workspace

  Scenario: Permissão, ausência, lock ou configuração inválida no início
    Given o último workspace selecionado está sem permissão, ausente, bloqueado ou inválido
    When o OpenBible inicia
    Then preserva o registro e informa a causa detectada
    And oferece reconectar, tentar novamente ou escolher outro workspace
    And não ativa silenciosamente outro workspace nem remove o registro
```

#### AC-008 — Remover da lista preservando arquivos

**Cobre**: US-003, FR-003, FR-004, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-002 @NFR-003 @AC-008
Feature: Remoção não destrutiva

  Scenario: Remover apenas a referência local
    Given um workspace está cadastrado e seus arquivos estão acessíveis
    When a pessoa escolhe Remover da lista e confirma a ação não destrutiva
    Then a entrada é removida somente do catálogo local
    And nenhum arquivo, manifesto ou diretório da raiz é apagado
    And a mesma raiz pode ser adicionada novamente depois
```

#### AC-009 — Excluir raiz gerenciada quando todos os guardas passam

**Cobre**: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-009
Feature: Exclusão protegida de workspace

  Scenario: Apagar uma raiz dedicada comprovadamente gerenciada
    Given a raiz possui manifesto v2 com managedRoot válido
    And o OpenBible comprovou que a raiz é dedicada e não encontrou arquivo desconhecido
    And não existe lock ou operação concorrente
    When a pessoa escolhe Excluir workspace e confirma a consequência completa
    Then o sistema apaga a raiz inteira usando a capability segura do backend
    And remove a referência do catálogo sem apagar outro workspace
    And informa o resultado concluído
```

#### AC-010 — Bloquear exclusão quando a propriedade não é comprovada

**Cobre**: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003

```gherkin
@US-003 @FR-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-010
Feature: Exclusão fail-closed

  Scenario: Raiz arbitrária, marcador inválido ou arquivo desconhecido
    Given a raiz não possui marcador gerenciado válido ou contém arquivo desconhecido
    When a pessoa solicita excluir o workspace
    Then o sistema bloqueia a exclusão integral
    And explica que não existe opção de forçar pelo OpenBible
    And preserva catálogo, manifesto e arquivos e orienta exclusão manual segura
```

#### AC-011 — Resolver colisão de identidade sem duas raízes por ID

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-011
Feature: Colisão de ID de workspace

  Scenario: Adicionar uma raiz cujo ID já está cadastrado
    Given a pasta escolhida possui o mesmo workspaceId de uma entrada existente
    When a pessoa tenta adicioná-la ao catálogo
    Then o sistema oferece atualizar a localização existente ou criar uma cópia independente
    And a atualização preserva o ID original
    And a cópia grava um novo ID antes do cadastro
    And nunca mantém duas raízes locais para o mesmo ID
```

#### AC-012 — Renomear sem alterar a pasta física

**Cobre**: US-003, FR-003, NFR-001, NFR-002

```gherkin
@US-003 @FR-003 @NFR-001 @NFR-002 @AC-012
Feature: Nome portátil do workspace

  Scenario: Editar o nome exibido
    Given um workspace cadastrado possui ID e raiz física ou lógica
    When a pessoa salva um novo nome exibido
    Then o catálogo atualiza o cache local e o manifesto grava o novo nome
    And o ID, caminho/handle, conteúdo e estado de sincronização permanecem inalterados
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve manter um catálogo local por dispositivo, migrar o registro singular de modo idempotente e criar/adicionar workspaces conforme as capabilities do backend; o registro deve conter ID estável, nome, backend, referência local, estado e último uso.
- **FR-002**: O sistema deve manter exatamente um workspace ativo por janela, resolver todas as operações pela raiz ativa, concluir autosave antes de trocar, invalidar operações assíncronas antigas por token de geração e oferecer recuperação sem fallback silencioso.
- **FR-003**: O sistema deve permitir renomear, remover da lista, localizar novamente e excluir workspaces; deve detectar colisão de ID e aplicar exclusão fail-closed com marcador gerenciado, propriedade comprovada, varredura de desconhecidos, lock e capability do backend.
- **FR-004**: O sistema deve expor seleção e gestão em Svelte desktop/mobile com nome ativo visível, ações semanticamente distintas, estados de loading/empty/error/success/permission e operação por teclado/tecnologia assistiva.

#### Não funcionais

- **NFR-001**: integridade e consistência — migração, troca de ponteiro, atualização de manifesto, colisão e exclusão devem ser atômicas ou restaurar o estado ativo anterior após falha; operações de geração antiga nunca podem vencer a mais nova. **Verificação**: testes de contrato/estado com falhas injetadas, concorrência e token stale.
- **NFR-002**: privacidade e segurança local — conteúdo e referências de outro workspace não podem vazar para o ativo; catálogo, caminhos, handles e referências OPFS não podem entrar na sincronização; exclusão deve ser fail-closed e sem força. **Verificação**: testes de isolamento, inspeção de payloads de sync e matriz de capability/guarda.
- **NFR-003**: acessibilidade e responsividade — seleção, dialogs, drawer, recuperação e gestão devem ser operáveis por teclado, ter foco visível e previsível, nomes acessíveis, anúncio de erro/sucesso e não gerar overflow em 320px, além de funcionar em tema claro/escuro e desktop. **Verificação**: testes de componente/axe quando disponível e inspeção manual nos viewports 320px e 1440px.

#### Erros e casos-limite

- Autosave falha → manter o ativo, mostrar causa e oferecer retry ou descarte explícito.
- Permissão revogada → manter cadastro e abrir recuperação; não apagar nem trocar silenciosamente.
- Pasta movida/ausente → permitir localizar novamente e validar o manifesto/ID encontrado.
- Lock ocupado → não abrir como escritor; explicar e permitir retry ou escolher outro.
- Manifesto ausente, inválido ou incompatível → não sobrescrever; oferecer diagnóstico/recuperação compatível.
- ID duplicado → exigir atualizar localização ou criar cópia com novo ID.
- Arquivo desconhecido ou erro de varredura → bloquear exclusão integral sem força.
- Falha ao persistir catálogo/manifesto → restaurar referência ativa anterior e comunicar recuperação.
- Último workspace removido → abrir criação/adição; não fabricar raiz silenciosamente.
- Resposta assíncrona de geração antiga → descartar resultado e manter o estado da geração ativa.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Aplicação SvelteKit com Svelte 5, TypeScript, Tailwind CSS 4 e primitives shadcn-svelte.
- `WorkspaceStorage` é a fronteira atual de persistência em `apps/web/src/lib/storage/types.ts`; `storage-registry.ts`, `session.ts` e `workspace-state.svelte.ts` assumem registro/estado singular.
- Tauri usa bridge nativa para caminhos reais; o navegador pode guardar um handle de pasta em IndexedDB; OPFS oferece armazenamento lógico por origem e não deve ser apresentado como pasta do sistema.
- `AppFrame.svelte`, `AppSidebar.svelte`, `WorkspaceSettings.svelte` e `PermissionRecovery.svelte` já fornecem shell, configuração e recuperação a serem estendidos.

#### Arquitetura e módulos

- Introduzir `WorkspaceCatalog` como repositório local de `WorkspaceCatalogEntry`, fora da raiz autoral e não sincronizável; IndexedDB é a persistência do catálogo no web/PWA, e o runtime Tauri usa sua configuração local equivalente sem colocar catálogo dentro do workspace.
- Evoluir `WorkspaceStorage` para receber `workspaceId`/contexto explícito e declarar `StorageCapabilities`; casos de uso não chamam diretamente `localStorage`, OPFS ou APIs Tauri.
- Criar `WorkspaceManifest` v2 em `.openbible/config.json` com `workspaceId`, `name`, `formatVersion` e `managedRoot`; preservar campos legados compatíveis sem reescrever conteúdo autoral.
- Criar `WorkspaceLifecycle`/barreira de troca para registrar flushes de editores e índices. O fluxo é `flush active → persist/discard decision → increment generation → resolve destination → activate`; falha antes da ativação mantém o ponteiro anterior.
- Cada operação `open`, `switch`, `reconnect`, `scan` e `delete` captura um `generationToken`; o guard de commit rejeita resultado se o token não for o atual ou se o destino não for mais o solicitado.
- Implementar capabilities por adapter: Tauri para raiz real e lock; File System Access para pasta autorizada e reconexão; OPFS para raiz lógica isolada e exclusão pelo diretório pai quando suportado. Ausência de capability causa estado explícito, não fallback implícito.
- A exclusão passa por `readManifest → proveManagedRoot → scanUnknownEntries → proveNoLock → confirm → deleteManagedRoot`; qualquer resultado inconclusivo termina em bloqueio.
- A migração lê o registro singular, deriva um ID estável quando necessário, grava catálogo e manifesto de forma transacional/idempotente e só então aponta o ativo para a entrada criada.

#### Migrations

- **Catálogo local v1**: criar store local com ID, nome, backend, referência local, último uso e status; migração repetida pelo mesmo ID é no-op.
- **Manifesto v2**: adicionar `.openbible/config.json` apenas para raízes sob controle do OpenBible; uma pasta arbitrária não recebe `managedRoot=true` ao ser adicionada. Uma raiz já válida conserva seu manifesto.
- **Compatibilidade/rollback**: manter leitura do registro singular durante a migração; se catálogo, manifesto ou ponteiro falhar, conservar a configuração anterior e sinalizar recuperação. Não há migration de conteúdo de notas nesta spec.

#### Models

- `WorkspaceManifest`: identidade portátil, nome, formato e marcador de raiz dedicada; validação rejeita ID ausente, versão incompatível e marcador inconsistente.
- `WorkspaceCatalogEntry`: identidade local, cache de nome, `storageKind`, referência local não serializada em sync, último uso e estado de acessibilidade.
- `ActiveWorkspacePointer`: ID ativo e geração monotônica por janela; nunca contém conteúdo nem substitui o manifesto.
- `StorageCapabilities`: operações suportadas e limites de cada backend (`create`, `select`, `reconnect`, `writeManifest`, `scan`, `deleteManagedRoot`).

#### Controllers e casos de uso

- `migrateLegacyWorkspace`: entrada do bootstrap singular, saída de catálogo/manifesto/ponteiro ou erro recuperável; idempotente.
- `createWorkspace` e `addExistingWorkspace`: recebem intenção/nome ou handle; selecionam adapter, validam ID e registram a raiz.
- `switchWorkspace`: executa a barreira de autosave, incrementa geração, abre destino, faz commit apenas se o token ainda for válido.
- `recoverWorkspace`: recebe entry e ação (`reconnect`, `retry`, `choose-other`), preserva identidade e reporta causa.
- `renameWorkspace`, `removeWorkspace` e `deleteWorkspace`: mantêm efeitos separados; exclusão exige confirmação e todos os guardas fail-closed.

#### Views e experiência

- `WorkspaceSelector` em `AppSidebar.svelte`/`Sidebar.Header`: nome do ativo, estado de abertura e `DropdownMenu` com trocar, criar, adicionar e gerenciar.
- Trigger equivalente no header mobile abre `Drawer` com a mesma lista e ações; não duplicar regras de domínio entre desktop e mobile.
- `WorkspaceSettings.svelte`: tabela/lista simples de gestão com ID/nome/status/referência resumida e ações independentes de renomear, remover, reconectar e excluir.
- `PermissionRecovery.svelte` recebe motivo e actions de recovery, com estado de loading e anúncio live.
- Dialogs destrutivos separam “Remover da lista” de “Excluir workspace”; a confirmação textual informa alcance e motivo de bloqueio quando aplicável.

#### Queries e repositórios

- `WorkspaceCatalogRepository.list()` lista somente metadados locais sem abrir ou indexar todas as raízes.
- `getById`, `upsert`, `remove`, `setActive` e `touchLastOpened` devem ser idempotentes e serializados por dispositivo.
- Validação completa de manifesto, lock e arquivos desconhecidos ocorre apenas ao ativar, recuperar, adicionar ou excluir a raiz afetada.

#### Jobs e processamento assíncrono

- Não há job remoto ou servidor local nesta fatia. Abertura, scan e flush são assíncronos e devem usar generation token, cancelamento/ignore de resultado stale e retry explícito na UI.

#### Estrutura de arquivos

```text
specs/planned/0016-multiplos-workspaces-modelo-vaults/
  spec.md
apps/web/src/lib/storage/
  types.ts
  workspace-catalog.ts
  workspace-lifecycle.ts
  storage-registry.ts
  session.ts
  opfs-storage.ts
  tauri-storage.ts
  local-storage.ts
  workspace-catalog.test.ts
  workspace-lifecycle.test.ts
apps/web/src/lib/features/navigation/
  AppSidebar.svelte
apps/web/src/lib/features/workspace/
  AppFrame.svelte
  WorkspaceSelector.svelte
  WorkspaceSettings.svelte
  PermissionRecovery.svelte
  workspace-state.svelte.ts
  workspace-state.test.ts
apps/desktop/src-tauri/src/commands/
  workspace.rs
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `WorkspaceManifest` | `workspaceId` UUID/string estável | `formatVersion=2`, `name`, `managedRoot`; vive em `.openbible/config.json`, é portátil e não contém path/handle local | Uma raiz autoral possui exatamente um manifesto válido |
| `WorkspaceCatalogEntry` | `workspaceId` + dispositivo | `nameCache`, `storageKind`, referência local, `lastOpenedAt`, `status`; catálogo local, no máximo uma referência por ID | Aponta para uma `WorkspaceManifest` local |
| `ActiveWorkspacePointer` | janela/sessão | `workspaceId`, `generation`; um por janela, sem conteúdo | Refere exatamente uma entrada do catálogo |
| `StorageCapabilities` | adapter/backend | flags de operações suportadas; nunca autoriza operação ausente | Uma entrada resolve um adapter |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Workspace | `registered` | abrir | `opening` | cadastro permanece local |
| Workspace | `opening` | manifest/lock válidos | `ready` | generation ainda é válida |
| Workspace | `opening` | permissão/ausência/lock/invalidez | `permission-needed`/`unavailable`/`locked`/`invalid` | não ativar fallback |
| Workspace ativo | `ready` | solicitação de troca | `flushing` | não iniciar destino antes do flush |
| Workspace ativo | `flushing` | sucesso e token válido | `switching` → `ready` | antigo só deixa ativo após commit |
| Workspace ativo | `flushing` | falha | `ready` | retry ou descarte explícito |
| Workspace | `registered` | remover da lista | `detached` | arquivos permanecem intactos |
| Workspace | `registered` | exclusão com guardas | `deleted` | somente raiz dedicada sem desconhecidos |

#### Migração e retenção

- O registro singular é convertido em uma entrada sem mover arquivos. A operação usa uma chave de migração/idempotência e pode ser repetida após interrupção.
- O catálogo pode ser apagado/reconstruído sem apagar conteúdo; recadastrar a raiz lê o manifesto para reencontrar o ID.
- Remover da lista retém a raiz e o manifesto. Excluir remove a raiz somente após todos os guardas; não existe retenção automática de conteúdo nesta fatia.
- O catálogo é local ao dispositivo e não participa de sync/backup de conteúdo. O manifesto segue com a raiz e permite portabilidade entre aparelhos.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A feature altera o shell principal, a configuração, os fluxos de seleção, troca, recuperação e ações destrutivas.

#### Stack e convenções de interface

- SvelteKit/Svelte 5, TypeScript, Tailwind 4 e shadcn-svelte existentes. O shell é `AppFrame.svelte` + `AppSidebar.svelte`; `WorkspaceSettings.svelte` e `PermissionRecovery.svelte` são superfícies existentes a estender.
- Desktop usa `Sidebar.Header` e `DropdownMenu`; mobile usa trigger no header e `Drawer`. Dialog/AlertDialog será usado para confirmação destrutiva quando disponível.
- A descoberta de interface identificou o fluxo de configuração e recuperação existentes; preservar marca, Geist, tokens monocromáticos, foco visível, tema claro/escuro e `prefers-reduced-motion`.
- O padrão genérico de `DataGrid` e `Breadcrumb` de equipe do design system não se aplica literalmente: esta superfície é configuração local de vault, não CRUD de entidade de negócio nem navegação organizacional por equipe. A gestão pode usar lista compacta acessível, mostra ID estável quando útil e mantém a navegação contextual do shell existente, sem inventar equipe, breadcrumb ou rota falsa.

#### Telas e responsabilidades

- **Shell principal/Sidebar desktop**: pessoa identifica o workspace ativo, troca ou abre ações de criação/adição/gestão.
- **Header/Drawer mobile**: mesma seleção e ações em largura reduzida; o nome ativo permanece visível.
- **Configurações → Workspaces**: pessoa lista referências, renomeia, reconecta, remove da lista ou inicia exclusão.
- **Dialog de criar/adicionar**: pessoa escolhe nome/pasta conforme capability e recebe resultado ou erro.
- **Recovery de workspace**: pessoa entende causa, tenta reconectar/repetir ou escolhe outra raiz.
- **Dialog de exclusão**: pessoa confirma alcance integral somente quando os guardas permitem; bloqueio explica a alternativa manual.

#### Fluxo de informação e navegação

1. Bootstrap carrega o catálogo local e aponta o último workspace.
2. O shell mostra nome e estado do ativo.
3. A pessoa abre o seletor; escolhe workspace existente ou uma ação de criação/adição/gestão.
4. Para troca, a aplicação salva pendências, valida destino, incrementa geração e abre o adapter.
5. Sucesso atualiza shell e anuncia novo nome; falha permanece no contexto anterior ou abre recovery.
6. Gestão retorna ao shell após renomear/remover/excluir, mantendo o último estado válido.

O contexto é o shell principal do OpenBible; não há `Breadcrumb` de equipe aplicável a esta configuração. Quando a gestão for apresentada como página de Configurações, a navegação existente deve indicar Configurações → Workspaces e marcar Workspaces como página atual.

#### Menus e navegação principal

- `WorkspaceSelector` → workspace listado, Criar workspace, Adicionar pasta existente, Gerenciar workspaces.
- Menu de cada item → Tornar ativo, Renomear, Reconectar quando indisponível, Remover da lista, Excluir workspace quando os guardas permitirem.
- Desktop mantém dropdown ancorado na Sidebar; mobile abre drawer e conserva foco/retorno ao trigger.
- Nenhuma ação destrutiva fica agrupada visualmente com remoção não destrutiva sem rótulo e confirmação próprios.

#### Formulários e ações

- Criar: nome exibido opcional com default derivado da pasta; validação de nome não vazio após trim, caracteres não suportados e colisão de ID.
- Adicionar: seleção de pasta/handle ou escolha de raiz lógica; validar manifesto antes de cadastrar.
- Renomear: campo nome exibido, ajuda “não renomeia a pasta física”, erro inline e submit desabilitado durante gravação.
- Remover: ação não destrutiva em dialog curto, com frase explícita de que arquivos permanecem.
- Excluir: dialog separado, resumo da raiz, manifesto/guardas e confirmação forte; se capability ou scan não comprovar segurança, mostrar bloqueio sem botão forçar.
- Recovery: retry, reconectar/localizar e escolher outro; manter o workspace selecionado no catálogo.

#### Composição e disposição

- Sidebar/Header: nome ativo com indicador textual de estado; lista de workspaces ocupa a largura disponível.
- Configuração: cabeçalho da superfície, lista compacta de entradas, ações por linha e feedback contextual; não usar cards decorativos ou pills sem significado.
- Mobile: drawer com alvo de toque adequado, conteúdo rolável e dialogs que não ultrapassem viewport; desktop: dropdown/lista sem overflow horizontal.
- Estados curto/longo, loading, vazio, erro, permission-needed, locked, invalid, sucesso e exclusão bloqueada têm mensagens acionáveis.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Shell desktop | Não aplicável; bloco Svelte | Exibir ativo e ações | `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` | `Sidebar.Header` + `DropdownMenu` | shadcn-svelte + próprio | Novo bloco Svelte sobre primitive existente |
| Shell mobile | Não aplicável; bloco Svelte | Seleção em drawer | `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` | `Drawer` | shadcn-svelte + próprio | Reuso da regra do seletor, composição responsiva |
| Configurações | Não aplicável; bloco Svelte | Listar e gerir workspaces | `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` | lista acessível + `Dialog` | próprio + primitives | Estender tela existente |
| Exclusão | Não aplicável; bloco Svelte | Confirmar consequência | `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` | `AlertDialog`/`Dialog` | shadcn-svelte | Ação nova separada de remoção |
| Recovery | Não aplicável; bloco Svelte | Reconectar/repetir/escolher | `apps/web/src/lib/features/workspace/PermissionRecovery.svelte` | alert/live region + buttons | próprio existente | Estender recuperação existente |

A coluna mantém “Não aplicável” para React porque a aplicação usa Svelte; os blocos reais e seus arquivos Svelte estão explicitados. A regra de CRUD genérica de `PageHeader`/DataGrid não será importada para uma configuração de vault sem entidade de negócio; essa é uma decisão de escopo, não uma omissão de acessibilidade ou de identificação.

#### Estados e acessibilidade

- Loading: `aria-busy`, foco mantido no acionador e texto “Abrindo workspace…”.
- Vazio: explicar que nenhum workspace está cadastrado e oferecer Criar/Adicionar.
- Erro: mensagem específica para autosave, permissão, ausência, lock, manifesto, colisão e arquivo desconhecido; foco vai ao alerta acionável.
- Sucesso: anúncio `aria-live` com nome do workspace ativo e ação concluída.
- Teclado: trigger, itens, dialogs, retry, confirmação e cancelamento são alcançáveis; Escape fecha sem perder contexto; foco retorna ao acionador.
- Acessibilidade visual: nome ativo não depende somente de ícone/cor; contraste/foco seguem `DESIGNSYSTEM.MD`; conteúdo longo quebra sem overflow.
- Respeitar tema claro/escuro, zoom, reduced motion e viewport mobile de 320px.

#### Contrato CRUD

- Esta entrega não é CRUD de entidade de negócio. A gestão de workspaces é uma configuração de filesystem e usa lista compacta, ações nomeadas e dialogs distintos.
- A lista sempre identifica cada entrada por nome e ID estável quando houver espaço; não usa breadcrumb de equipe, linha clicável para detalhe ou ações destrutivas ambíguas.
- O contrato CRUD padrão com `PageHeader`, `DataGrid` em largura total, coluna `ID` sempre visível e ações independentes de editar e apagar é **Não aplicável**: não existem rotas de lista/detalhe/criação/edição de uma entidade de negócio. A superfície reutiliza o cabeçalho da `ConfigPage`, expõe renomear e remover/excluir como ações explícitas e registra essa exceção em `INTERFACE.md` durante a implementação.

#### Revisão visual durante o desenvolvimento

- A implementação deverá revisar 320px e 1440px, tema claro/escuro, lista vazia, conteúdo longo, loading, erro, permissão, lock, sucesso e confirmação destrutiva.
- Registrar procedimento, viewport, estados, foco, overflow, bordas, espaçamentos, margens, padding e tipografia na tarefa de interface; testes sem superfície visual marcarão `Não aplicável` com motivo.

#### APIs expostas

- `WorkspaceCatalogRepository` interno: `list`, `getById`, `upsert`, `remove`, `setActive`, `touchLastOpened`; contrato local versionado, sem endpoint HTTP.
- `WorkspaceStorage`/`StorageCapabilities` internos: `open`, `readManifest`, `writeManifest`, `flush`, `scan`, `reconnect`, `deleteManagedRoot`; erros tipados por capability e condição.
- Bridge Tauri: comandos tipados de seleção, abertura, scan, lock, escrita de manifesto e exclusão segura; sem expor caminho arbitrário ao front-end.

#### APIs externas utilizadas

- Nenhuma API externa de rede. APIs de plataforma (Tauri IPC, File System Access API, IndexedDB e OPFS) são adaptadas atrás da fronteira de storage e não são dependências de servidor.

#### Documentação das APIs consultadas

- Contratos locais e documentação de plataforma observados na stack e nas implementações atuais; nenhuma fonte externa precisa ser armazenada para esta spec.

#### Eventos e outros contratos

- `WorkspaceActivated { workspaceId, generation }` é evento interno local; consumidores de índice, editor, sincronização futura e agente futuro devem resolver a raiz pelo ID/contexto ativo.
- `WorkspaceActivationFailed { workspaceId, reasonCode }` preserva o ativo anterior e alimenta recovery.
- `WorkspaceCatalogEntry` nunca é payload de Automerge/sync; `WorkspaceManifest` é conteúdo portátil da raiz e poderá ser incluído em backup/sync conforme as specs posteriores.

### 11. Estratégia TDD

- **Unidade**: validação de manifesto/ID/nome, catálogo idempotente, capabilities, guardas de exclusão, generation token e máquina de estados de troca.
- **Integração/contrato**: adapters Tauri/File System Access/OPFS, migração legada, persistência local do catálogo e bridge de comandos.
- **BDD/aceite**: os doze cenários da seção 6 são a referência; cada caso TDD deverá possuir marcador `SPECSFY:` próprio e rastrear os IDs cobertos.
- **Runner TDD**: Vitest, conforme `apps/web/package.json` e decisão registrada no perfil do projeto.
- **E2E**: jornadas essenciais do seletor desktop/mobile, troca com autosave, recovery e confirmação; materializar após o Plan Gate.
- **Verificação manual**: revisão visual e permissões reais de pasta somente quando o ambiente de teste não simular File System Access/Tauri; registrar motivo e viewport.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-001 FR-001 NFR-001 AC-001` | RED observado: manifesto legado continua `version: 1`, sem `workspaceId`, `formatVersion` e `name` portáteis (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002 | AC-002 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-001 FR-001 FR-004 NFR-002 NFR-003 AC-002` | RED observado: `prepareWorkspace` não produz manifesto v2/`managedRoot` em native, local e OPFS (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-001, FR-001, FR-004, NFR-003, AC-003 | AC-003 na seção 6 | `apps/web/src/lib/features/navigation/app-sidebar.spec.ts` — `SPECSFY: US-001 FR-001 FR-004 NFR-003 AC-003` | RED observado: `AppSidebar.svelte` não contém `WorkspaceSelector` nem ação de gestão (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 | AC-004 na seção 6 | `apps/web/src/lib/features/workspace/workspace-state.test.ts` — `SPECSFY: US-001 US-002 FR-002 NFR-001 NFR-002 AC-004` | RED observado: `WorkspaceState` não expõe `workspaceId`/`generation` para vincular consumidores ao ativo (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-002, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — `SPECSFY: US-002 FR-002 NFR-001 AC-005` | RED observado: lifecycle não expõe `flushAndSwitch` para impor a barreira de autosave (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006 | AC-006 na seção 6 | `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-006` | RED observado: lifecycle não expõe contrato de falha/retry/discard-and-switch (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-002, FR-002, FR-004, NFR-001, NFR-003, AC-007 | AC-007 na seção 6 | `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-007` | RED observado: estados nativo não expõem `unavailable`/`invalid` com ações de recuperação (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008 | AC-008 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-008` | RED observado: storage não expõe remoção exclusiva do catálogo para preservar a raiz (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 | AC-009 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-009` | RED observado: adapter não expõe `deleteManagedRoot` para executar a cadeia de guards (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-010 | AC-010 na seção 6 | `apps/web/src/lib/storage/workspace.test.ts` — `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-010` | RED observado: manifesto de raiz arbitrária não declara `managedRoot: false` (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-003, FR-003, NFR-001, NFR-002, AC-011 | AC-011 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-011` | RED observado: storage não expõe resolução de colisão de ID (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |
| US-003, FR-003, NFR-001, NFR-002, AC-012 | AC-012 na seção 6 | `apps/web/src/lib/storage/workspace-catalog.test.ts` — `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-012` | RED observado: storage não expõe renomeação portátil (exit 1) | Pending — implementação não iniciada | Pending — não aplicável antes do GREEN |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Unidade/integração | `workspace-catalog.test.ts`, `workspace.test.ts`, `app-sidebar.spec.ts` via `bun run --cwd apps/web test:tdd -- ...` | RED: 3 casos falharam por manifesto/catalogação/seletor ausentes (exit 1) |
| FR-002 | AC-004, AC-005, AC-006, AC-007 | Unidade/integração | `workspace-state.test.ts`, `workspace-lifecycle.test.ts`, `native-workspace-states.test.ts` via comando focal | RED: 4 casos falharam por contexto/lifecycle/recovery ausentes (exit 1) |
| FR-003 | AC-008, AC-009, AC-010, AC-011, AC-012 | Unidade/integração | `workspace-catalog.test.ts`, `workspace.test.ts` via comando focal | RED: 5 casos falharam por gestão, guards, colisão e rename ausentes (exit 1) |
| FR-004 | AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 | Componente/contrato | testes marcados nos arquivos de storage, lifecycle, recovery e sidebar | RED: casos relacionados à interface/ações ainda sem contrato implementado (exit 1) |
| NFR-001 | AC-001, AC-004, AC-005, AC-006, AC-007, AC-009, AC-010, AC-011, AC-012 | Unidade/integração | testes de manifesto, isolamento, barreira, guards e identidade via Vitest | RED: invariantes de geração/ownership/idempotência ausentes (exit 1) |
| NFR-002 | AC-001, AC-002, AC-004, AC-008, AC-009, AC-010, AC-011, AC-012 | Contrato/inspeção | testes de manifesto, referência local e isolamento via Vitest | RED: campos e operações que separam catálogo/local de raiz ainda ausentes (exit 1) |
| NFR-003 | AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 | Componente/contrato | `app-sidebar.spec.ts` e contratos de estados/ações via comando focal | RED: seletor e estados acionáveis ainda não compostos (exit 1) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — Passed em 2026-09-05
- **Comandos**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`; `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`
- **Cobertura**: 12 ACs; US-001=4, US-002=4, US-003=5; FR-001=3, FR-002=4, FR-003=5, FR-004=7; NFR-001=9, NFR-002=8, NFR-003=7.
- **FIND-ARCH-001** [P1] [Resolved] o estado singleton e caches não indexados permitiam resposta assíncrona antiga após a troca — Refs: FR-002, NFR-001, AC-004 — Evidence: apps/web/src/lib/features/notes/notes-state.svelte.ts:206 — Effect: conteúdo de A poderia aparecer em B — Suggestion: resolvido por token de geração, barreira de commit e testes de corrida definidos nas seções 4, 8 e 11.
- **FIND-ARCH-002** [P2] [Resolved] o primeiro rascunho apontava componentes e bridge nativa para diretórios divergentes do monorepo — Refs: FR-004 — Evidence: apps/web/src/lib/features/navigation/AppSidebar.svelte:90 — Effect: tarefas seriam produzidas em fronteiras erradas — Suggestion: estrutura e tabela de componentes corrigidas para `features/navigation`, `features/workspace` e `apps/desktop/src-tauri`.
- **FIND-SEC-001** [P1] [Resolved] o contrato atual só expõe exclusão opcional de arquivo e não prova ownership/capacidade para apagar uma raiz — Refs: FR-003, NFR-002, AC-009, AC-010 — Evidence: apps/web/src/lib/storage/types.ts:39 — Effect: implementar exclusão diretamente poderia apagar conteúdo não pertencente ao OpenBible — Suggestion: resolvido por capability explícita, marcador gerenciado, scan de allowlist, lock e falha fechada sem força.
- **Achados restantes**: nenhum `BLOCKER` e nenhum `P1 Open`.

#### Gate do Ato II — Plano

- **Resultado**: Passed em 2026-09-05
- **Comandos**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`; `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md`
- **Contagens**: 29 tarefas; 12 predecessores `[TEST] [TDD]` concluídos com RED; 11 tarefas `[CODE]` abertas; 174 itens de checklist, 72 concluídos; cobertura 22/22 IDs; interface OK.
- **Achados**: nenhum predecessor TDD de tarefa de produção permanece aberto. Os marcadores órfãos de outras specs no auditor global não pertencem ao contrato desta spec e permanecem preservados; o Delivery Gate continua sem aprovação até GREEN e cadeia completa.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress — RED materializado em 2026-09-05; GREEN/produção deliberadamente não iniciados nesta etapa.
- **Comando TDD**: `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts src/lib/storage/workspace.test.ts src/lib/storage/workspace-lifecycle.test.ts src/lib/features/workspace/workspace-state.test.ts src/lib/features/workspace/native-workspace-states.test.ts src/lib/features/navigation/app-sidebar.spec.ts` (após `check_database_safety.mjs` → `SAFE`).
- **Evidência TDD**: 12 casos distintos falharam por expectativas comportamentais ausentes, sem falha de importação, sintaxe, fixture ou ambiente; não há comando GREEN nesta etapa.
- **Comando de rastreabilidade**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md .` (sem `--full-chain`, pois CODE ainda não foi executado).
- **Achados**: os 22 IDs aplicáveis da spec estão cobertos; o auditor reporta marcadores órfãos preexistentes em testes de outras specs, portanto o resultado permanece GAPS e o Delivery Gate não pode passar.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest do AC-001 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001 e confirmar migração idempotente, preservação de arquivos e ausência de onboarding repetido.
  - [x] **EXECUTE**: Escrever o teste Vitest co-localizado com o marcador `SPECSFY: US-001 FR-001 NFR-001 AC-001`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED pela ausência da migração do catálogo.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa somente um teste de persistência.
  - [x] **EVIDENCE**: Registrar o comando, a falha observada (manifesto atual `version: 1`, sem identidade portátil) e os IDs AC-001/US-001/FR-001/NFR-001 nas seções 11–13.
  - [x] **IMPROVE**: Revisar o caso para distinguir no-op idempotente de reescrita do manifesto; a ausência do contrato v2 permanece o gap para GREEN.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest do AC-002 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002 e mapear Tauri, File System Access e OPFS às capabilities declaradas.
  - [x] **EXECUTE**: Escrever o teste de contrato com o marcador `SPECSFY: US-001 FR-001 FR-004 NFR-002 NFR-003 AC-002`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED nos adapters/capabilities ainda ausentes.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa somente um teste de contrato de storage.
  - [x] **EVIDENCE**: Registrar comando, falha observada (manifesto sem `workspaceId`, `formatVersion` e `managedRoot`) e os IDs AC-002/US-001/FR-001/FR-004/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Conferir que o teste não trate OPFS como pasta física e registrar o limite de cada backend.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar o caso Vitest de componente do AC-003 em `apps/web/src/lib/features/navigation/app-sidebar.spec.ts` — Refs: US-001, FR-001, FR-004, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003 e confirmar trigger desktop/mobile, ações do seletor, persistência e foco de teclado.
  - [x] **EXECUTE**: Escrever o teste Svelte/Vitest com o marcador `SPECSFY: US-001 FR-001 FR-004 NFR-003 AC-003`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts` e observar RED no seletor ainda não composto.
  - [x] **VISUAL**: Não aplicável: esta tarefa apenas registra o comportamento que a interface deverá provar.
  - [x] **EVIDENCE**: Registrar comando, falha observada (`AppSidebar.svelte` sem `WorkspaceSelector`/ações de gestão) e os IDs AC-003/US-001/FR-001/FR-004/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Revisar o caso para incluir conteúdo longo e operação por teclado sem duplicar regras de domínio.

- [x] T004 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-004 em `apps/web/src/lib/features/workspace/workspace-state.test.ts` — Refs: US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004 e listar notas, Bíblias, preferências, índices e contexto que devem resolver pela raiz ativa.
  - [x] **EXECUTE**: Escrever o teste de isolamento com o marcador `SPECSFY: US-001 US-002 FR-002 NFR-001 NFR-002 AC-004`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts` e observar RED quando um consumidor ainda usa o singleton.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre isolamento de estado sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (`WorkspaceState` sem `workspaceId`/`generation`) e os IDs AC-004/US-001/US-002/FR-002/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Adicionar uma asserção que impeça a raiz A de reaparecer depois da ativação de B.

- [x] T005 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-005 em `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — Refs: US-002, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005 e ordenar flush, persistência, abertura do destino e publicação do ativo.
  - [x] **EXECUTE**: Escrever o teste de barreira com o marcador `SPECSFY: US-002 FR-002 NFR-001 AC-005`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts` e observar RED se B for ativado antes do autosave de A.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre a sequência assíncrona do lifecycle.
  - [x] **EVIDENCE**: Registrar comando, falha observada (lifecycle sem `flushAndSwitch`) e os IDs AC-005/US-002/FR-002/NFR-001 nas seções 11–13.
  - [x] **IMPROVE**: Tornar a asserção determinística com promises controladas, sem depender de temporização real.

- [x] T006 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-006 em `apps/web/src/lib/storage/workspace-lifecycle.test.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006 — Depends: T005
  - [x] **PREP**: Ler o Gherkin do AC-006 e definir falha de autosave, permanência de A e as ações retry/discard.
  - [x] **EXECUTE**: Acrescentar o teste com o marcador `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-006`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts` e observar RED se B puder ser aberto após erro sem decisão explícita.
  - [x] **VISUAL**: Não aplicável: o RED é do contrato de estado; o feedback visual será coberto pela fase de interface.
  - [x] **EVIDENCE**: Registrar comando, falha observada (lifecycle sem contrato de erro `AUTOSAVE_FAILED`/retry/discard) e os IDs AC-006/US-002/FR-002/FR-004/NFR-001/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Cobrir retry e descarte como caminhos distintos para evitar uma saída implícita.

- [x] T007 [TEST] [TDD] [US-002] Derivar o caso Vitest do AC-007 em `apps/web/src/lib/features/workspace/native-workspace-states.test.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007 e enumerar permissão revogada, ausência, lock e manifesto inválido como causas distintas.
  - [x] **EXECUTE**: Escrever o teste de recovery com o marcador `SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-007`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/native-workspace-states.test.ts` e observar RED se ocorrer fallback silencioso ou remoção do registro.
  - [x] **VISUAL**: Não aplicável: esta tarefa materializa estados de recovery sem alterar a interface.
  - [x] **EVIDENCE**: Registrar comando, falha observada (estados `unavailable`/`invalid` ausentes) e os IDs AC-007/US-002/FR-002/FR-004/NFR-001/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Garantir que cada causa preserve a seleção e ofereça uma ação recuperável diferente.

- [x] T008 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-008 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008 — Depends: T001
  - [x] **PREP**: Ler o Gherkin do AC-008 e separar remoção de referência local da preservação física da raiz.
  - [x] **EXECUTE**: Acrescentar o teste com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-008`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se remove também manifesto ou arquivos.
  - [x] **VISUAL**: Não aplicável: esta tarefa verifica somente efeitos no catálogo e filesystem simulado.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `removeWorkspace`) e os IDs AC-008/US-003/FR-003/FR-004/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Adicionar recadastro da mesma raiz como prova de reversibilidade da remoção.

- [x] T009 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-009 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009 — Depends: T002
  - [x] **PREP**: Ler o Gherkin do AC-009 e preparar manifesto válido, ownership comprovado, allowlist limpa e ausência de lock.
  - [x] **EXECUTE**: Acrescentar o teste de exclusão segura com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-009`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED se a capability não exigir todos os guardas.
  - [x] **VISUAL**: Não aplicável: a tarefa prova guards de exclusão, não a confirmação visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (adapter sem `deleteManagedRoot`) e os IDs AC-009/US-003/FR-003/FR-004/NFR-001/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Tornar a prova explícita contra apagar qualquer segundo workspace cadastrado.

- [x] T010 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-010 em `apps/web/src/lib/storage/workspace.test.ts` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-010 — Depends: T009
  - [x] **PREP**: Ler o Gherkin do AC-010 e preparar marcador ausente/inválido, arquivo desconhecido, lock e erro de scan.
  - [x] **EXECUTE**: Acrescentar o teste fail-closed com o marcador `SPECSFY: US-003 FR-003 FR-004 NFR-001 NFR-002 NFR-003 AC-010`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts` e observar RED se houver caminho de força ou exclusão inconclusiva.
  - [x] **VISUAL**: Não aplicável: esta tarefa verifica bloqueio de segurança no domínio.
  - [x] **EVIDENCE**: Registrar comando, falha observada (manifesto sem `managedRoot: false`) e os IDs AC-010/US-003/FR-003/FR-004/NFR-001/NFR-002/NFR-003 nas seções 11–13.
  - [x] **IMPROVE**: Parametrizar as causas sem reduzir a exigência de bloqueio para cada uma.

- [x] T011 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-011 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, AC-011 — Depends: T008
  - [x] **PREP**: Ler o Gherkin do AC-011 e distinguir atualizar localização preservando ID de criar cópia com novo ID.
  - [x] **EXECUTE**: Acrescentar o teste de colisão com o marcador `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-011`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se duas raízes locais mantiverem o mesmo ID.
  - [x] **VISUAL**: Não aplicável: esta tarefa cobre unicidade de identidade persistente.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `addExistingWorkspace`) e os IDs AC-011/US-003/FR-003/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Verificar que a cópia grava o novo ID antes do upsert, e não depois de cadastrar.

- [x] T012 [TEST] [TDD] [US-003] Derivar o caso Vitest do AC-012 em `apps/web/src/lib/storage/workspace-catalog.test.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, AC-012 — Depends: T011
  - [x] **PREP**: Ler o Gherkin do AC-012 e fixar que nome exibido é mutável, enquanto ID, raiz, conteúdo e sync permanecem estáveis.
  - [x] **EXECUTE**: Acrescentar o teste de renomeação com o marcador `SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-012`, sem criar ou executar arquivo `.feature`.
  - [x] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts` e observar RED se renomear caminho físico ou perder identidade.
  - [x] **VISUAL**: Não aplicável: esta tarefa valida manifesto/catalogue sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando, falha observada (catálogo sem `renameWorkspace`) e os IDs AC-012/US-003/FR-003/NFR-001/NFR-002 nas seções 11–13.
  - [x] **IMPROVE**: Incluir nome com espaços extremos e confirmar trim/validação sem alterar o ID.

#### Fase 2 — Fundação e ciclo de vida

- [ ] T013 [CODE] [US-001] Implementar manifesto v2, catálogo local e migração idempotente em `apps/web/src/lib/storage/workspace-catalog.ts` — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [ ] **PREP**: Confirmar os REDs T001–T003, revisar o modelo da seção 9 e carregar `$specsfy-documentator` para reconstruir `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar a menor fundação de `WorkspaceManifest`, `WorkspaceCatalogEntry`, ponteiro ativo e migração sem mover conteúdo; executar o documentator antes de escrever código.
  - [ ] **VERIFY**: Executar os três testes Vitest focalizados e `bun run --cwd apps/web check`; confirmar idempotência, manifesto v2 e catálogo não sincronizável.
  - [ ] **VISUAL**: Não aplicável: esta tarefa altera persistência e bootstrap, sem superfície visual.
  - [ ] **EVIDENCE**: Registrar GREEN, arquivos e migração exercitada nas seções 11–13.
  - [ ] **IMPROVE**: Simplificar a transação de migração para preservar o ponteiro legado em qualquer falha parcial.
  <!-- specsfy:evidence {"task":"T013","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/storage/workspace-catalog.ts","apps/web/src/lib/storage/migration.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts","exit":0}]} -->

- [ ] T014 [CODE] [US-001] Adaptar capabilities Tauri, File System Access e OPFS no registro de storage em `apps/web/src/lib/storage/storage-registry.ts` — Refs: US-001, FR-001, FR-004, NFR-002, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [ ] **PREP**: Confirmar REDs T002/T003/T006, mapear limites de `tauri-storage.ts`, `opfs-storage.ts` e File System Access e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar adapters/capabilities explícitas para create/select/reconnect/writeManifest/scan/delete, executando o documentator antes de alterar o código.
  - [ ] **VERIFY**: Executar testes de storage focais, `bun run --cwd apps/web check` e confirmar que capability ausente produz estado explícito, sem fallback.
  - [ ] **VISUAL**: Não aplicável: esta tarefa altera adapters de plataforma, sem superfície visual.
  - [ ] **EVIDENCE**: Registrar GREEN, backend exercitado e limites de capability nas seções 11–13.
  - [ ] **IMPROVE**: Centralizar a seleção de adapter para evitar condicionais de plataforma espalhadas nos casos de uso.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","FR-001","FR-004","NFR-002","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/storage/storage-registry.ts","apps/web/src/lib/storage/tauri-storage.ts","apps/web/src/lib/storage/opfs-storage.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

- [ ] T015 [CODE] [US-002] Implementar troca segura, autosave e generation token em `apps/web/src/lib/storage/workspace-lifecycle.ts` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-004, AC-005, AC-006, AC-007 — Depends: T004, T005, T006, T007
  - [ ] **PREP**: Confirmar REDs T004–T007, revisar estados `flushing`/`switching`/`permission-needed` e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar a sequência flush → persist/discard → generation → open → commit guard, executando o documentator antes da implementação.
  - [ ] **VERIFY**: Executar testes de lifecycle/state, `bun run --cwd apps/web check` e confirmar que resultados stale não vencem a geração atual.
  - [ ] **VISUAL**: Não aplicável: esta tarefa entrega coordenação assíncrona, enquanto estados visuais ficam na fase de interface.
  - [ ] **EVIDENCE**: Registrar GREEN, corrida simulada, falha e recuperação nas seções 11–13.
  - [ ] **IMPROVE**: Isolar o commit guard em função pura para tornar concorrência e cancelamento auditáveis.
  <!-- specsfy:evidence {"task":"T015","refs":["US-002","FR-002","FR-004","NFR-001","NFR-003","AC-004","AC-005","AC-006","AC-007"],"files":["apps/web/src/lib/storage/workspace-lifecycle.ts","apps/web/src/lib/features/workspace/workspace-state.svelte.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-lifecycle.test.ts","exit":0}]} -->

- [ ] T016 [CODE] [US-002] Resetar stores consumidores na ativação por workspace em `apps/web/src/lib/features/workspace/workspace-state.svelte.ts` — Refs: US-001, US-002, FR-002, NFR-001, NFR-002, AC-004 — Depends: T004, T005, T007
  - [ ] **PREP**: Confirmar REDs T004/T005/T007, inventariar stores de notas, Bíblia, preferências e índices e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Fazer cada consumidor reinicializar pelo `workspaceId`/generation ativo, executando o documentator antes de alterar estado.
  - [ ] **VERIFY**: Executar `bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts` e a suíte de stores afetados; confirmar ausência de dados de A em B.
  - [ ] **VISUAL**: Não aplicável: esta tarefa ajusta stores consumidores sem nova composição visual.
  - [ ] **EVIDENCE**: Registrar GREEN, consumidores resetados e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Preferir um evento `WorkspaceActivated` tipado em vez de resets manuais duplicados.
  <!-- specsfy:evidence {"task":"T016","refs":["US-001","US-002","FR-002","NFR-001","NFR-002","AC-004"],"files":["apps/web/src/lib/features/workspace/workspace-state.svelte.ts","apps/web/src/lib/features/notes/notes-state.svelte.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/workspace-state.test.ts","exit":0}]} -->

#### Fase de interface

- [ ] T017 [CODE] [US-001] Compor o seletor no shell desktop em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, FR-004, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [ ] **PREP**: Confirmar REDs T002/T003/T006, ler `AppSidebar.svelte`, `Sidebar.Header` e `DropdownMenu`, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar nome ativo, lista, trocar/criar/adicionar/gerenciar e foco de teclado no desktop; executar o documentator antes da implementação.
  - [ ] **VERIFY**: Exercitar menu, ações, loading, vazio, erro, sucesso, teclado e `aria-live` no teste Svelte focal.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 1440px/320px, claro/escuro, conteúdo curto/longo e sem overflow.
  - [ ] **EVIDENCE**: Registrar telas, estados, foco, comando e resultado em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Reutilizar primitives existentes e reduzir ruído visual sem esconder o estado textual do ativo.
  <!-- specsfy:evidence {"task":"T017","refs":["US-001","FR-004","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [ ] T018 [CODE] [US-001] Reusar o seletor em header/drawer mobile em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, FR-004, NFR-003, AC-002, AC-003 — Depends: T002, T003, T006
  - [ ] **PREP**: Confirmar REDs T002/T003/T006, ler `AppFrame.svelte` e `Drawer`, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Adaptar a mesma regra de domínio ao trigger mobile, drawer rolável, retorno de foco e alvo de toque; executar o documentator antes da implementação.
  - [ ] **VERIFY**: Exercitar 320px, zoom, Escape, foco de retorno, ações e estados com teste Svelte focal sem overflow horizontal.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro, conteúdo longo e `prefers-reduced-motion`.
  - [ ] **EVIDENCE**: Registrar composição mobile, foco, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Manter um único componente e uma única fonte de ações para impedir divergência desktop/mobile.
  <!-- specsfy:evidence {"task":"T018","refs":["US-001","FR-004","NFR-003","AC-002","AC-003"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/features/workspace/AppFrame.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [ ] T019 [CODE] [US-003] Implementar a gestão de workspaces em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-002, NFR-003, AC-008, AC-011, AC-012 — Depends: T008, T011, T012
  - [ ] **PREP**: Confirmar REDs T008/T011/T012, ler `ConfigPage.svelte` e os estados da lista, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar lista acessível com ID/nome/status/referência e ações separadas de renomear, reconectar, remover e colisão; executar o documentator antes do código.
  - [ ] **VERIFY**: Exercitar validação de nome, atualização de localização, cópia com novo ID, remoção não destrutiva e retorno ao shell.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro, vazio, erro e conteúdo longo.
  - [ ] **EVIDENCE**: Registrar ações, estados, foco, comando e arquivos em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Reaproveitar cabeçalho e primitives de configuração, mantendo ações destrutivas nomeadas e não ambíguas.
  <!-- specsfy:evidence {"task":"T019","refs":["US-003","FR-003","FR-004","NFR-002","NFR-003","AC-008","AC-011","AC-012"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace-catalog.test.ts","exit":0}]} -->

- [ ] T020 [CODE] [US-001] Implementar os dialogs de criar e adicionar no fluxo do seletor em `apps/web/src/lib/features/workspace/WorkspaceSelector.svelte` — Refs: US-001, US-003, FR-001, FR-003, FR-004, NFR-002, NFR-003, AC-002, AC-011 — Depends: T002, T008, T011
  - [ ] **PREP**: Confirmar REDs T002/T008/T011, ler Dialog/Input existentes e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar formulário de nome/pasta ou raiz OPFS, validação de trim/capability/colisão e feedback de sucesso/erro; executar o documentator antes do código.
  - [ ] **VERIFY**: Exercitar abertura/fechamento, submit, validação inline, loading, colisão e foco por teclado em testes Svelte.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro, erro e conteúdo longo sem overflow.
  - [ ] **EVIDENCE**: Registrar fluxo, validações, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Manter criar e adicionar como intenções distintas, compartilhando apenas os campos e o contrato de resultado.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","US-003","FR-001","FR-003","FR-004","NFR-002","NFR-003","AC-002","AC-011"],"files":["apps/web/src/lib/features/workspace/WorkspaceSelector.svelte","apps/web/src/lib/components/ui/dialog/dialog.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/navigation/app-sidebar.spec.ts","exit":0}]} -->

- [ ] T021 [CODE] [US-002] Estender recovery de permissão e disponibilidade em `apps/web/src/lib/features/workspace/PermissionRecovery.svelte` — Refs: US-002, FR-002, FR-004, NFR-001, NFR-003, AC-006, AC-007 — Depends: T005, T006, T007
  - [ ] **PREP**: Confirmar REDs T005–T007, ler `PermissionRecovery.svelte` e estados de autosave, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Exibir reasonCode acionável e ações retry/reconectar/escolher outro, preservando registro e foco; executar o documentator antes do código.
  - [ ] **VERIFY**: Exercitar falha de autosave, permissão, ausência, lock, manifesto inválido, loading, live region, Escape e retorno de foco.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro, erro, permission-needed, locked e invalid.
  - [ ] **EVIDENCE**: Registrar causas, ações, estados, comando e resultado em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Usar mensagens específicas por causa sem introduzir fallback automático ou texto que dependa somente de cor.
  <!-- specsfy:evidence {"task":"T021","refs":["US-002","FR-002","FR-004","NFR-001","NFR-003","AC-006","AC-007"],"files":["apps/web/src/lib/features/workspace/PermissionRecovery.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/features/workspace/native-workspace-states.test.ts","exit":0}]} -->

- [ ] T022 [CODE] [US-003] Compor a confirmação destrutiva e bloqueio na gestão em `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — Refs: US-003, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T008, T009, T010
  - [ ] **PREP**: Confirmar REDs T008–T010, ler Dialog/AlertDialog e regras de consequência, e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar dialogs distintos para remover e excluir, confirmação forte somente quando guards passam e bloqueio sem “forçar”; executar o documentator antes do código.
  - [ ] **VERIFY**: Exercitar manifesto/ownership/scan/lock/capability válidos e inválidos, confirmação/cancelamento, live region e preservação do contexto.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em 320px/1440px, claro/escuro, sucesso, bloqueio e conteúdo longo.
  - [ ] **EVIDENCE**: Registrar alcance da confirmação, motivo do bloqueio, comando e resultado em `INTERFACE.md` e nas seções 11–13.
  - [ ] **IMPROVE**: Tornar “Remover da lista” e “Excluir workspace” semanticamente independentes no texto, ordem e estilo de ação.
  <!-- specsfy:evidence {"task":"T022","refs":["US-003","FR-003","FR-004","NFR-001","NFR-002","NFR-003","AC-009","AC-010"],"files":["apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/components/ui/dialog/dialog.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

#### Fase final — Segurança, documentação e fechamento

- [ ] T023 [CODE] [US-003] Implementar exclusão fail-closed com scan, lock e capability em `apps/web/src/lib/storage/workspace.ts` — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T008, T009, T010
  - [ ] **PREP**: Confirmar REDs T008–T010, revisar a cadeia readManifest→proveManagedRoot→scan→lock→confirm→delete e carregar `$specsfy-documentator` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar guards fail-closed e bridge seguro, executando o documentator antes de alterar o domínio/bridge.
  - [ ] **VERIFY**: Executar testes de segurança/contrato com cada falha injetada e confirmar que não há caminho de force nem exclusão de raiz arbitrária.
  - [ ] **VISUAL**: Não aplicável: a barreira de segurança é domínio/bridge; a mensagem de bloqueio é verificada em T022.
  - [ ] **EVIDENCE**: Registrar GREEN, guardes, bloqueios e arquivos alterados nas seções 11–13.
  - [ ] **IMPROVE**: Tornar desconhecidos e erros de scan conservadores por default e retornar reasonCode estável à UI.
  <!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-003","NFR-001","NFR-002","NFR-003","AC-009","AC-010"],"files":["apps/web/src/lib/storage/workspace.ts","apps/desktop/src-tauri/src/commands/workspace.rs"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

- [ ] T024 [DOC] [US-001] Atualizar o inventário de persistência do catálogo, manifesto e migration em `.specsfy/DATABASE.md` — Refs: US-001, FR-001, FR-003, NFR-001, AC-001, AC-008, AC-009, AC-011 — Depends: T013, T023
  - [ ] **PREP**: Conferir os REDs e contratos que alteram store, entidades, campos, relações e migration; delimitar catálogo local versus conteúdo autoral.
  - [ ] **EXECUTE**: Registrar entidades, stores, campos, índices, idempotência e retenção em `.specsfy/DATABASE.md`, preservando conteúdo humano.
  - [ ] **VERIFY**: Comparar a tabela com `workspace-catalog.ts`, migration, manifesto e testes, sem omitir local/sync boundary.
  - [ ] **VISUAL**: Não aplicável: documentação de persistência não cria interface.
  - [ ] **EVIDENCE**: Registrar diff, fontes consultadas e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Explicitar no inventário que o catálogo pode ser reconstruído e não é payload sincronizável.

- [ ] T025 [DOC] [US-001] Atualizar o mapa de blocos, estados e consumidores em `INTERFACE.md` — Refs: US-001, US-002, US-003, FR-004, NFR-003, AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T017, T018, T019, T020, T021, T022
  - [ ] **PREP**: Conferir todas as tarefas da Fase de interface, `DESIGNSYSTEM.MD`, componentes shadcn-svelte e fluxos desktop/mobile.
  - [ ] **EXECUTE**: Documentar finalidade, arquivo, API, estados, consumidores, acessibilidade e regra de reuso de cada bloco alterado em `INTERFACE.md`.
  - [ ] **VERIFY**: Confirmar que cada tela da seção 10 possui arquivo, estados, viewport e teste/revisão correspondente.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia documentados para 320px/1440px, claro/escuro e estados de erro/sucesso.
  - [ ] **EVIDENCE**: Registrar diff, inventário de componentes e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Consolidar a regra de seletor único desktop/mobile para evitar duas fontes de comportamento.

- [ ] T026 [DOC] [US-001] Revisar impacto da feature e capacidades no histórico do produto em `PROJECT.md` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004 — Depends: T013, T015, T019, T023
  - [ ] **PREP**: Comparar o resultado implementado com finalidade, limites e capacidades já registradas em `PROJECT.md`.
  - [ ] **EXECUTE**: Atualizar somente o contexto material de múltiplos workspaces, Files Over Apps e limites de sincronização em `PROJECT.md`.
  - [ ] **VERIFY**: Confirmar que a revisão não transforma catálogo local em conteúdo portátil nem adiciona escopo fora desta spec.
  - [ ] **VISUAL**: Não aplicável: revisão do contexto do produto sem superfície visual.
  - [ ] **EVIDENCE**: Registrar decisão de impacto material, diff e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Remover redundância e manter a narrativa do produto curta, apontando detalhes normativos para a spec.

- [ ] T027 [DOC] [US-003] Registrar regras confirmadas de identidade e exclusão em `.specsfy/RULES.md` — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003, AC-009, AC-010 — Depends: T023
  - [ ] **PREP**: Isolar somente convenções duráveis confirmadas: ID único, remoção não destrutiva e exclusão sem force.
  - [ ] **EXECUTE**: Acrescentar as regras em `.specsfy/RULES.md` sem apagar ou reescrever conteúdo humano existente.
  - [ ] **VERIFY**: Conferir que cada regra tem alcance, fonte e não conflita com capabilities dos adapters.
  - [ ] **VISUAL**: Não aplicável: regra de domínio/documentação sem interface.
  - [ ] **EVIDENCE**: Registrar diff, fontes e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Usar linguagem operacional verificável e evitar transformar detalhes transitórios de implementação em regra.

- [ ] T028 [DOC] [US-001] Atualizar stack e dependências estruturais no inventário em `.specsfy/STACK.md` — Refs: US-001, FR-001, FR-004, NFR-001, AC-001, AC-002 — Depends: T013, T014, T024
  - [ ] **PREP**: Conferir alterações de IndexedDB/OPFS, bridge Tauri, Vitest e arquivos estruturais após a implementação.
  - [ ] **EXECUTE**: Registrar somente tecnologia/capability estrutural observada em `.specsfy/STACK.md`, preservando blocos humanos.
  - [ ] **VERIFY**: Comparar stack com manifests, adapters e comandos de teste reais.
  - [ ] **VISUAL**: Não aplicável: inventário técnico sem superfície visual.
  - [ ] **EVIDENCE**: Registrar diff, manifestos e comandos nas seções 11–13.
  - [ ] **IMPROVE**: Remover dependência ou descrição não evidenciada no código, mantendo o inventário derivado.

- [ ] T029 [TEST] [US-001] Executar regressão final, rastreabilidade e verificação de interface em `apps/web/src/lib/features/workspace/workspace-state.test.ts` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028
  - [ ] **PREP**: Conferir todos os REDs/GREENs, matriz AC→US/FR/NFR, documentação e comandos de regressão seguros.
  - [ ] **EXECUTE**: Executar suíte Vitest, `bun run --cwd apps/web check`, lint e os validadores de rastreabilidade/interface; não executar migrações destrutivas.
  - [ ] **VERIFY**: Confirmar todos os 12 ACs, estados, guards, tokens stale, 320px/1440px, teclado, tema e ausência de gaps.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia na revisão final em claro/escuro, mobile/desktop, loading, vazio, erro, sucesso e conteúdo longo.
  - [ ] **EVIDENCE**: Registrar contagens, comandos, resultados e pendências finais nas seções 11–13, sem fechar gates nesta etapa.
  - [ ] **IMPROVE**: Consolidar achados de regressão e propor apenas ajustes rastreáveis nesta spec ou no backlog.

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003 → T013 → T014 → T015 → T016 → T017/T018 → T019/T020/T021 → T022/T023 → T024/T025/T026/T027/T028 → T029. Os REDs T004–T012 entram nos pontos de lifecycle, gestão e segurança indicados pelas dependências explícitas.
- Paralelismo: T001, T002 e T003 podem correr em paralelo porque usam arquivos de teste distintos e não compartilham estado; T017 e T018 são sequenciais por compartilharem `WorkspaceSelector.svelte`; T024–T028 só podem paralelizar quando seus predecessores e os arquivos documentados estiverem estáveis.
- MVP: T001–T007, T013–T018, T021, T024–T026 e T029 entregam migração do singular, dois workspaces isolados, adapters adaptativos, troca com autosave/generation, recovery e seletor responsivo. T008–T012, T019–T020, T022–T023 e T027–T028 completam lifecycle destrutivo, colisão, gestão e regras/stack antes do Delivery Gate.
- Critério de avanço: nenhuma tarefa de produção é concluída nesta decomposição; o Plan Gate está `Passed` após a decomposição e materialização dos REDs, enquanto o Delivery Gate permanece `In Progress` até GREEN, regressão e evidências reais.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- BACKLOG-0017 e as specs existentes de onboarding/configuração e Tauri.
- Componentes `AppFrame`, `AppSidebar`, `WorkspaceSettings`, `PermissionRecovery`, `DropdownMenu`, `Dialog`, `Drawer` e `Sidebar`.
- Fases posteriores 0018–0021 consumirão o `workspaceId` ativo e o manifesto, mas não podem sincronizar o catálogo local.

#### Riscos

- Catálogo local virar autoridade do conteúdo → manter somente identidade/referência e permitir reconstrução pelo manifesto.
- API de filesystem não suportar exclusão da raiz → capability declara limite e operação bloqueia/guia manual.
- Race entre troca e abertura assíncrona → generation token e commit guard obrigatório.
- Migração parcial corromper bootstrap → operação idempotente, escrita transacional e ponteiro anterior preservado.
- Usuário confundir remover com excluir → ações separadas, texto de consequência e confirmação forte.
- Pasta adicionada conter dados de terceiros → `managedRoot=false` e exclusão integral sempre bloqueada sem prova.

#### Suposições

- Existe um único workspace ativo por janela/sessão; múltiplas janelas e locks por raiz serão tratados pelos contratos existentes de Tauri.
- IndexedDB, OPFS e/ou File System Access estarão disponíveis conforme capability detectada; o PWA sem filesystem usa raízes lógicas OPFS.
- A futura sincronização tratará manifesto/conteúdo portátil, não o catálogo local, caminhos ou handles.

### 17. Decisões

- **DEC-001**: usar catálogo local por dispositivo e manifesto portátil por raiz — separa reencontro local de identidade Files Over Apps e evita sincronizar caminhos/handles.
- **DEC-002**: usar modelo adaptativo Tauri/pasta autorizada/OPFS — cobre desktop, browser compatível e iOS/PWA sem fingir que OPFS é pasta do sistema.
- **DEC-003**: manter exatamente um ativo e exigir barreira de autosave — impede mistura de raízes e perda de alterações durante troca.
- **DEC-004**: introduzir token de geração em operações assíncronas — impede resultado stale de uma abertura antiga sobrescrever a seleção nova.
- **DEC-005**: separar remover da lista de excluir workspace — oferece reversibilidade cotidiana e destruição explícita.
- **DEC-006**: exclusão fail-closed sem opção de forçar — protege pastas arbitrárias e arquivos desconhecidos mesmo quando a UX fica menos conveniente.
- **DEC-007**: manter nome editável separado da pasta física — torna identidade portátil sem renomear caminhos ou quebrar referências externas.
- **DEC-008**: não aplicar DataGrid/breadcrumb de equipe — a gestão é configuração de vault no shell existente, não CRUD de equipe; preservar a regra de ID e acessibilidade sem inventar semântica.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
