# Especificação integrada: Importar Bíblias por URL do bucket R2

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0008 |
| Slug | 0008-importar-biblias-por-url-do-bucket-r2 |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Listagem remota + download com progresso por arquivo + validação OpenLP + instalação idempotente em três superfícies; risco principal é CORS/streaming de arquivos grandes. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-03 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O OpenBible hoje só importa Bíblias SQLite por seleção local ou arrastar e soltar. Quem recebe uma URL pública de distribuição (bucket Cloudflare R2 com as Bíblias) não consegue listar o que está disponível nem baixar e instalar as versões com acompanhamento.

#### Resultado desejado

A pessoa informa a URL base pública do bucket R2, vê os arquivos `.sqlite` disponíveis para importar, acompanha o progresso de download de cada arquivo e instala as versões validadas em `bibles/`, com resultado individual e catálogo atualizado.

#### Métricas de sucesso

- Com URL base válida e manifest acessível, 100% dos `.sqlite` listados exibem nome, tamanho quando conhecido e estado instalado/não instalado.
- Em lote misto, 100% dos arquivos válidos e não duplicados são instalados e 100% dos rejeitados recebem motivo visível, sem sobrescrita e sem cancelar os demais.
- Cada download ativo exibe progresso individual 0–100% e cada operação assíncrona produz estado visual de loading, erro recuperável ou sucesso.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo executado; decisões vêm da conversa, da Inbox, do backlog e das fontes locais do repositório.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-03-162849-importar-biblias-por-url-do-bucket-r2.md` — formulação original.
- `specs/backlog/0008-importar-biblias-por-url-do-bucket-r2.md` — refinamento e decisões confirmadas.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — onboarding local; download por URL estava fora de escopo.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — validação OpenLP book/verse.
- `apps/web/src/lib/storage/workspace.ts` — `importBibleFiles`, validação `isSQLite`, status pending/complete/partial.
- `apps/web/src/lib/storage/types.ts` — `WorkspaceStorage`, `ImportResult`, `ProgressCallback`.
- `apps/web/src/lib/features/bible/bible-reader.ts` — `loadBibleCatalog`, validação OpenLP, leitura por sql.js.
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — etapa de import local a estender.
- `PROJECT.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` — stack SvelteKit/Svelte, regras R2, persistência.

#### Documentação consultada

- Documentação local do Specsfy e templates da spec — formato, rastreabilidade, TDD e gates.
- Fetch API e ReadableStream como contratos locais da plataforma web; nenhuma documentação externa copiada como fonte normativa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo; não houve consulta externa que exigisse cópia em `research/`.

#### Dúvidas respondidas

- **Q1: URL base ou arquivo único?** → **A:** suportar os dois; URL base resolve `<base>/manifest.json` com fallback `<base>/index.json`; URL terminada em `.sqlite` importa arquivo único.
- **Q2: como listar o bucket?** → **A:** manifest JSON `{ files: [{ name, url, size?, sha256? }] }` na raiz do bucket; não depender de List XML assinado nesta fatia.
- **Q3: onde a tela vive?** → **A:** mesmo componente reutilizado em onboarding (etapa import), `/bible` vazio e `/config` (WorkspaceSettings); onboarding, leitor e config preservam import local.
- **Q4: sobrescrever existente?** → **A:** nunca sobrescrever `bibles/<nome>`; marcar `duplicate` e preservar existente.
- **Q5: progresso** → **A:** progresso individual por arquivo via Content-Length + bytes recebidos; progresso global do lote como arquivos concluídos/total.
- **Q6: validação remota** → **A:** mesma validação local (assinatura SQLite + schema OpenLP mínimo book/verse) aplicada após download, antes de gravar.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante. Formato real do bucket será confirmado na homologação; se o bucket não tiver manifest, o erro orienta a criá-lo.

### 3. Escopo e atores

#### Incluído

- Campo URL base HTTPS + ação carregar lista.
- Resolução de manifest (`manifest.json`, fallback `index.json`) e atalho de URL direta `.sqlite`.
- Lista de `.sqlite` disponíveis com nome, tamanho, estado e seleção múltipla.
- Download por streaming com progresso individual e global.
- Validação SQLite + OpenLP mínimo e instalação idempotente em `bibles/`.
- Resultado individual por arquivo, atualização de catálogo e status de importação.
- Reuso do componente em onboarding, `/bible` e `/config`.
- Persistência local opcional da última URL base.

#### Fora de escopo

- Autenticação R2/S3, ListObjects assinado, chaves e tokens.
- Sincronização contínua, atualização automática, upload ao bucket.
- Cache offline dos SQLite remotos no service worker.
- Paginação server-side, busca server-side, resumo de conteúdo remoto sem baixar.
- Reconfiguração ou migração de workspace.

#### Atores

- **Pessoa usuária individual**: informa a URL, seleciona arquivos, acompanha progresso, instala versões e decide tentar de novo após erro.
- **Aplicação web**: resolve manifest, lista, baixa com progresso, valida, instala no workspace e mostra estados.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte, shadcn-svelte e Vitest; não introduzir React, shadcn/ui ou ReUI.
- **PR-002**: manter Files over app: `bibles/*.sqlite` é fonte somente leitura; validação nunca altera o SQLite.
- **PR-003**: nenhum conteúdo de arquivo é enviado para servidor; download é cliente → R2 → workspace.
- **PR-004**: somente HTTPS público sem autenticação nesta fatia; diagnosticar CORS explicitamente.
- **PR-005**: instalação idempotente; destino existente nunca é sobrescrito.
- **PR-006**: interface segue `https://vercel.com/design.md` como guideline, Geist local, foco visível, teclado e `prefers-reduced-motion`, sem marca Vercel.

### 5. Histórias de usuário

#### US-001 — Ver Bíblias disponíveis a partir da URL do bucket (P1)

Como pessoa usuária individual, quero informar a URL do bucket R2 e ver os SQLite disponíveis, para escolher o que instalar sem adivinhar nomes de arquivo.

**Por que P1**: sem listagem confiável a pessoa não sabe o que o bucket oferece nem o que já está instalado.
**Teste independente**: informar URL base mockada e URL direta, verificando normalização, lista, estados e erros sem baixar conteúdo real.
**Requisitos**: FR-001, FR-002, FR-005

#### US-002 — Baixar com progresso e instalar as versões (P1)

Como pessoa usuária individual, quero baixar os arquivos escolhidos vendo o progresso de cada um e instalar as versões validadas, para completar a biblioteca mesmo com arquivos grandes ou falhas parciais.

**Por que P1**: o valor só se realiza quando o download visível termina em versão utilizável no leitor.
**Teste independente**: baixar lote mockado com progresso, validar, instalar e conferir catálogo, status e rejeições sem depender de rede real.
**Requisitos**: FR-003, FR-004, FR-005

### 6. Cenários BDD de aceite

#### AC-001 — Listar disponíveis da URL base

**Cobre**: US-001, FR-001, FR-002, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-005 @NFR-001 @NFR-002 @AC-001
Feature: Listar Bíblias do bucket R2

  Scenario: Mostrar arquivos a partir da URL base
    Given que a pessoa informou uma URL base HTTPS com manifest acessível
    When carrega a lista
    Then vê somente arquivos .sqlite com nome, tamanho quando conhecido e estado instalado ou não instalado
    And arquivos já presentes em bibles/ aparecem como instalados
```

#### AC-002 — URL direta de arquivo único

**Cobre**: US-001, FR-001, FR-002, FR-005, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-005 @NFR-002 @AC-002
Feature: Importar arquivo único por URL

  Scenario: Tratar URL .sqlite como item único
    Given que a pessoa informou uma URL terminada em .sqlite
    When carrega a lista
    Then vê um único item correspondente ao arquivo com seleção disponível
    And consegue instalar sem precisar de manifest
```

#### AC-003 — URL inválida ou manifest ausente

**Cobre**: US-001, FR-001, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-005 @NFR-001 @NFR-002 @AC-003
Feature: Recuperar falha de listagem

  Scenario: Orientar correção sem perder contexto
    Given que a URL é inválida, o manifest retorna 404 ou o JSON é inválido ou vazio
    When tenta carregar
    Then vê erro recuperável próximo ao campo com causa e ação de tentar de novo
    And a seleção anterior válida não é apagada silenciosamente
```

#### AC-004 — Falha de rede ou CORS

**Cobre**: US-001, FR-001, FR-003, FR-005, NFR-002

```gherkin
@US-001 @FR-001 @FR-003 @FR-005 @NFR-002 @AC-004
Feature: Diagnosticar rede do bucket

  Scenario: Explicar bloqueio de leitura
    Given que o bucket responde erro HTTP, bloqueia CORS ou interrompe o download
    When carrega a lista ou baixa um arquivo
    Then vê erro que distingue rede, HTTP e CORS com orientação de liberação
    And os demais arquivos do lote permanecem disponíveis
```

#### AC-005 — Download com progresso por arquivo

**Cobre**: US-002, FR-002, FR-003, FR-005, NFR-001, NFR-002

```gherkin
@US-002 @FR-002 @FR-003 @FR-005 @NFR-001 @NFR-002 @AC-005
Feature: Baixar Bíblias com progresso

  Scenario: Acompanhar cada arquivo do lote
    Given que há arquivos selecionados com tamanho conhecido ou desconhecido
    When confirma a instalação
    Then cada arquivo mostra progresso próprio de 0 a 100% e o lote mostra progresso global
    And a UI continua responsiva durante downloads grandes
```

#### AC-006 — Instalação validada sem sobrescrita

**Cobre**: US-002, FR-003, FR-004, FR-005, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @FR-005 @NFR-002 @AC-006
Feature: Instalar versões validadas

  Scenario: Gravar somente válidos sem substituir existente
    Given que downloads terminaram com um válido novo, um válido duplicado e uma falha de escrita
    When a instalação conclui
    Then o válido novo é gravado em bibles/ e aparece no catálogo
    And o duplicado é marcado sem substituir o existente
    And o resultado informa parcial com motivo por arquivo
```

#### AC-007 — SQLite ou schema inválido rejeitado

**Cobre**: US-002, FR-004, FR-005, NFR-002

```gherkin
@US-002 @FR-004 @FR-005 @NFR-002 @AC-007
Feature: Rejeitar arquivo incompatível

  Scenario: Diagnosticar conteúdo remoto inválido
    Given que um arquivo baixado não tem assinatura SQLite ou não tem book e verse mínimos
    When valida após o download
    Then rejeita individualmente com motivo sem gravar em bibles/
    And mantém os demais resultados do lote
```

#### AC-008 — Catálogo e status atualizados nas três superfícies

**Cobre**: US-001, US-002, FR-002, FR-004, FR-005, NFR-001

```gherkin
@US-001 @US-002 @FR-002 @FR-004 @FR-005 @NFR-001 @AC-008
Feature: Refletir instalação no produto

  Scenario: Reutilizar o importador remoto
    Given que a instalação terminou via onboarding, /bible ou /config
    When abre o leitor ou o catálogo
    Then as novas versões aparecem para leitura
    And o status de importação reflete complete ou partial
    And o mesmo componente e comportamento valem nas três superfícies
```

#### AC-009 — Teclado, progresso acessível e responsivo

**Cobre**: US-001, US-002, FR-005, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-005 @NFR-001 @NFR-002 @AC-009
Feature: Usar importação remota por teclado

  Scenario: Operar com tecnologia assistiva em mobile e desktop
    Given que o carregamento ou download está em andamento
    When navega por teclado em 320px ou 1440px
    Then encontra label visível na URL, lista operável, progresso com valor semântico e erros anunciados
    And ações incompatíveis ficam desabilitadas até a operação terminar
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve normalizar a URL informada (https obrigatória, trim, barra final), resolver `<base>/manifest.json` com fallback `<base>/index.json`, aceitar `[{ name, url, size?, sha256? }]` e tratar URL terminada em `.sqlite` como item único sem exigir manifest.
- **FR-002**: O sistema deve listar somente `.sqlite`, exibindo nome, tamanho quando conhecido, estado instalado/não instalado por verificação em `bibles/` e seleção múltipla com selecionar todos/limpar.
- **FR-003**: O sistema deve baixar por `fetch` + `ReadableStream`, reportando progresso por arquivo (bytes recebidos/Content-Length) e progresso global (arquivos concluídos/total), com concorrência máxima 2 e cancelamento por arquivo.
- **FR-004**: O sistema deve validar cada download (assinatura SQLite + schema OpenLP mínimo `book(id,name)` e `verse(book_id,chapter,verse,text)`), gravar somente válidos não duplicados em `bibles/<nome>`, nunca sobrescrever existente, produzir `ImportResult` individual e atualizar `bibleImportStatus` e catálogo.
- **FR-005**: O sistema deve exibir a jornada URL → lista → seleção → download → resultado com estados loading, vazio, erro recuperável, parcial e sucesso, reutilizando o mesmo componente em onboarding, `/bible` e `/config`, com foco, teclado e anúncios acessíveis.

#### Não funcionais

- **NFR-001**: A importação remota deve ser operável por teclado, ter foco visível, labels acessíveis, progresso com `aria-valuenow`/`aria-valuemax`, erros em região viva e layout sem overflow horizontal em 320px e 1440px, com `prefers-reduced-motion` respeitado. **Verificação**: testes browser Vitest + inspeção visual 320px/1440px.
- **NFR-002**: Nenhuma operação deve enviar conteúdo de arquivos para servidor próprio; somente HTTPS público; cada download mantém feedback até sucesso ou erro, distingue rede/HTTP/CORS, continua após rejeições e não trava a UI com arquivos de 50–200 MB. **Verificação**: testes unitários com fetch mockado + observação de rede no browser + medição de responsividade.

#### Erros e casos-limite

- URL sem https ou vazia → erro de validação junto ao campo, sem requisição.
- manifest 404 → erro orientando publicar `manifest.json` na base.
- JSON inválido ou sem `.sqlite` → erro de lista vazia recuperável.
- HTTP não 2xx → erro com status e arquivo afetado.
- CORS/TypeError de fetch → erro específico orientando liberar `Access-Control-Allow-Origin`.
- Download sem Content-Length → progresso indeterminado com bytes recebidos.
- Download interrompido → rejeição `network-failed` sem gravar parcial.
- Assinatura SQLite ausente → rejeição `invalid-sqlite`.
- Schema OpenLP ausente → rejeição `invalid-schema` sem gravar.
- Nome existente → rejeição `duplicate`, preserva destino.
- Falha de escrita/quota → rejeição `copy-failed`, demais preservados.
- Nenhum instalado → mantém `bibleImportStatus` anterior; não finge `complete`.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Monorepo Turborepo com SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7.0.2, Vite 8.2.1, Vitest 4.1.10, Playwright 1.62.1, Tailwind 4.3.3, shadcn-svelte local estilo Nova, sql.js 1.14.2, Bun 1.4.0. Armazenamento via `WorkspaceStorage` (OPFS/local), importação local em `workspace.ts`, catálogo em `bible-reader.ts`, onboarding em `OnboardingModal.svelte`, leitor em `BibleReader.svelte`, config em `ConfigPage` + `WorkspaceSettings`.

#### Arquitetura e módulos

- `apps/web/src/lib/features/bible-remote/remote-manifest.ts`: normaliza URL base, resolve manifest/index.json, valida esquema, trata URL direta `.sqlite`; sem acesso a storage.
- `apps/web/src/lib/features/bible-remote/remote-download.ts`: `fetch` + `ReadableStream`, progresso por arquivo e global, concorrência 2, cancelamento via AbortController, erro tipado rede/http/cors/incompleto.
- `apps/web/src/lib/features/bible-remote/remote-install.ts`: valida assinatura + OpenLP via sql.js, verifica duplicado, grava em `bibles/`, atualiza config, retorna `ImportResult` estendido com motivo remoto.
- `apps/web/src/lib/features/bible-remote/RemoteBibleImport.svelte`: componente reutilizável (campo URL, lista, seleção, progresso por arquivo, resultado); props `storage`, `variant` (onboarding/bible/config).
- Integração: `OnboardingModal.svelte` ganha aba ou seção remota; `BibleReader` vazio usa o componente; `WorkspaceSettings` expõe seção remota.
- Persistência da última URL em `.openbible/preferences.json` ou `localStorage` como cache, sem vazar conteúdo.

#### Migrations

- Não aplicável. Sem mudança de schema; `bibles/*.sqlite` e `.openbible/index.sqlite` preservados.

#### Models

- `RemoteBibleEntry { name, url, size?, sha256?, installed: boolean, selected: boolean }`; invariante: `name` termina em `.sqlite`, `url` https absoluta resolvida contra base.
- `RemoteDownloadState { status: queued|downloading|validating|installed|rejected, loaded, total?, error? }`; invariante: `loaded <= total` quando total conhecido.
- `ImportResult` existente estendido com `reason: invalid-sqlite | duplicate | copy-failed | network-failed | http-error | cors-blocked | invalid-schema`.

#### Controllers e casos de uso

- `loadRemoteCatalog(baseUrl, fetchImpl)`: normaliza, busca manifest, retorna entries + diagnostics; erro tipado para UI.
- `downloadRemoteBibles(storage, entries, onFileProgress, onOverallProgress, signal)`: baixa, valida, instala, retorna resultados; não sobrescreve; atualiza `bibleImportStatus` como local.
- Sem controller HTTP; sem autenticação.

#### Views e experiência

- `RemoteBibleImport.svelte`: campo URL com label, botão carregar, lista com checkbox, botão instalar, progresso por linha (`<progress>` + texto), resultado por arquivo, retry por arquivo falhado.
- Estados: idle, loading-list, list-error, empty-list, ready, downloading, validating, partial, complete, file-error.
- Acessibilidade: `aria-live` para lista/resultado, `aria-valuenow` no progresso, foco no erro e no primeiro item após carregar.

#### Queries e repositórios

- Leitura de `bibles/` via `storage.listFiles` para marcar instalados; leitura remota via fetch sem cache persistente; sem SQL novo.

#### Jobs e processamento assíncrono

- Downloads assíncronos no cliente com AbortController por arquivo e limite de 2 concorrentes; sem retry automático; repetição manual idempotente.

#### Estrutura de arquivos

```text
apps/web/src/lib/features/bible-remote/
  remote-manifest.ts
  remote-manifest.test.ts
  remote-download.ts
  remote-download.test.ts
  remote-install.ts
  remote-install.test.ts
  RemoteBibleImport.svelte
  remote-import.svelte.spec.ts
apps/web/src/lib/storage/
  workspace.ts (estende motivos de ImportResult)
specs/draft/0008-importar-biblias-por-url-do-bucket-r2/
  spec.md
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| RemoteCatalog | URL base normalizada | `baseUrl https`, `entries[]`, `loadedAt`; somente `.sqlite` | contém N RemoteBibleEntry |
| RemoteBibleEntry | `url` absoluta | `name`, `url`, `size?`, `sha256?`, `installed`, `selected`; nome preservado no destino | 1 entry → 0..1 BibleFile em `bibles/` |
| BibleFile | `bibles/<nome>.sqlite` | assinatura SQLite, schema OpenLP válido, nunca sobrescrito | N arquivos pertencem a 1 WorkspaceConfig |
| RemoteDownloadState | entry.url | `loaded`, `total?`, `status`, `error?`; streaming sem gravar parcial | acompanha 1 entry |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| RemoteCatalog | ausente | carregar base válida | pronto | manifest válido com ao menos 1 `.sqlite` |
| RemoteBibleEntry | não instalado | download + validação ok | instalado | arquivo gravado e catálogo recarregável |
| RemoteBibleEntry | qualquer | duplicado detectado | rejeitado duplicate | existente preservado |
| RemoteDownloadState | downloading | bytes recebidos | downloading | progresso monotônico |
| RemoteDownloadState | downloading | erro rede/http/cors | rejected | nada gravado |
| RemoteDownloadState | validating | schema inválido | rejected | nada gravado |

#### Migração e retenção

- Sem migração. Última URL base pode ficar em preferences local; remoção segue reconfiguração futura; nenhum SQLite remoto é apagado por esta feature.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A pessoa precisa informar URL, entender a lista, selecionar, acompanhar progresso por arquivo e recuperar erros.

#### Stack e convenções de interface

- SvelteKit/Svelte em `apps/web`, TypeScript, Tailwind, shadcn-svelte local (`Button`, `Input`, `Label`, `Progress` ou `<progress>` nativo, `Checkbox`), Lucide, Vitest Browser Mode. Telas atuais afetadas: `OnboardingModal`, `BibleReader` vazio, `ConfigPage/WorkspaceSettings`. Preservar import local; adicionar seção remota com mesma linguagem. Fonte: `INTERFACE.md`, `.specsfy/STACK.md`, manifests e código citado.

#### Telas e responsabilidades

- **Onboarding import**: pessoa individual; informar URL ou usar drop local; entrada é URL base, saída é `bibles/` + status; inclui aba local/remoto.
- **Bíblia vazia (`/bible`)**: pessoa individual; quando sem versões, oferece importar remoto sem sair da rota; mesma lista e progresso.
- **Configuração (`/config`)**: pessoa individual; gerenciar biblioteca instalada e adicionar remotas depois; mostra instalados + importador remoto.

#### Fluxo de informação e navegação

- Pessoa chega por onboarding, `/bible` vazio ou `/config` → informa URL → carrega lista → seleciona → instala → vê progresso por arquivo → vê resultado → catálogo/versões atualizam sem navegação forçada. Erro mantém URL, lista anterior e seleção para retry. Sem equipe/conta; breadcrumb existente das rotas é preservado; modal mantém foco e retorno.

#### Menus e navegação principal

- Sem novo item de menu; importador é seção dentro de onboarding, `/bible` e `/config`. Navegação existente (Sidebar desktop, barra mobile) preservada; `/config` usa Tabs `Armazenamento` para a seção remota.

#### Formulários e ações

- Campo `URL do bucket` obrigatório, tipo url, placeholder `https://...`, ajuda “Use a URL pública do bucket; vamos ler manifest.json”, validação https + erro abaixo do campo.
- Ações: `Carregar lista` (primária da seção), `Selecionar todos`/`Limpar` (secundárias), `Instalar selecionadas` (primária, disabled sem seleção ou durante download), `Cancelar` por arquivo e `Tentar de novo` por falha.
- Padrão: seção inline na página e bloco dentro do modal; sem novo modal aninhado; lista com checkboxes nativos acessíveis.

#### Composição e disposição

- Hierarquia: título da seção, explicação curta, campo + botão lado a lado (empilha em 320px), lista em largura total com nome mono + tamanho + badge instalado + checkbox + progresso da linha, rodapé com progresso global + ações. Largura segue modal 560px e página com mesma densidade; sem overflow horizontal; tipografia Geist; superfícies contínuas.

#### Blocos React e componentes selecionados

| Tela | Bloco Svelte | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding/Bíblia/Config | `RemoteBibleImport` | Orquestrar URL, lista, progresso e resultado | `apps/web/src/lib/features/bible-remote/RemoteBibleImport.svelte` | Seção de domínio com `Button`, `Input`, `Label`, `<progress>` | Próprio + shadcn-svelte | Novo; reutilizado nas 3 superfícies |
| Importador remoto | `RemoteFileRow` | Linha com seleção, estado e progresso | dentro de `RemoteBibleImport.svelte` | Linha acessível com checkbox + progress | Próprio | Interno até segundo consumidor |
| Importador remoto | `RemoteProgress` | Progresso por arquivo e global | dentro de `RemoteBibleImport.svelte` | `<progress>` nativo com texto | Plataforma web | Interno |

- React, shadcn/ui e ReUI não se aplicam; tabela registra blocos Svelte reais. Registrar em `INTERFACE.md` após implementar.

#### Estados e acessibilidade

- Loading lista, erro lista, vazio, pronto, baixando, validando, parcial, completo, erro por arquivo. `role=alert` em erros, `aria-live=polite` em lista/resultado, `aria-valuenow/max` no progresso, labels visíveis, foco visível, teclado completo, `prefers-reduced-motion` sem animação de progresso.

#### Contrato CRUD

- Não aplicável. Importação remota instala arquivos, não administra registros CRUD; sem `PageHeader`, `DataGrid`, coluna `ID` ou ações editar/apagar.

#### Revisão visual durante o desenvolvimento

- Revisão no browser com Playwright/Vitest Browser em 320px e 1440px, claro/escuro, percorrendo URL vazia, loading, erro, vazio, lista, downloading, parcial e sucesso. Conferir bordas, espaçamentos, margens, padding, tipografia, foco, overflow e quebra de nomes longos.

#### APIs expostas

- Sem endpoint próprio. Contrato interno: `loadRemoteCatalog(baseUrl)`, `downloadRemoteBibles(storage, entries, onProgress)` e eventos do componente (carregar, selecionar, instalar, cancelar, retry).

#### APIs externas utilizadas

- Bucket R2 público via HTTPS GET: `GET <base>/manifest.json`, fallback `GET <base>/index.json`, `GET <file-url>` por SQLite. Sem auth; timeout via AbortController (30s listagem, sem timeout fixo para download grande com cancelamento manual); sem retry automático.

#### Documentação das APIs consultadas

- Nenhuma documentação externa copiada; contratos encapsulados em `remote-manifest.ts`/`remote-download.ts` e verificados com fetch mockado.

#### Eventos e outros contratos

- Manifest: `{ "files": [{ "name": "almeida.sqlite", "url": "https://.../almeida.sqlite", "size": 12345, "sha256": "opcional" }] }`; `url` pode ser relativa à base; somente `.sqlite` é listado; resto ignorado com diagnostics.
- Resultado: `{ name, status: imported|rejected, reason?: invalid-sqlite|duplicate|copy-failed|network-failed|http-error|cors-blocked|invalid-schema }[]`.
- Config: `bibleImportStatus` segue mesma regra local (complete se todos importados, partial se misto, preserva anterior se nenhum).

### 11. Estratégia TDD

- **Unidade**: `remote-manifest.ts` (normalização, manifest/index fallback, URL direta, filtragem), `remote-download.ts` (streaming, progresso, erros), `remote-install.ts` (validação SQLite/OpenLP, duplicado, status).
- **Integração/contrato**: fetch mockado + storage em memória + sql.js; nenhum servidor real.
- **BDD/aceite**: AC-001 a AC-009 orientam casos TDD distintos, sem `.feature`.
- **Runner TDD**: Vitest existente, `npm --prefix apps/web run test:tdd`.
- **E2E**: Vitest Browser Mode para jornada URL → lista → progresso → resultado em 320px/1440px.
- **Verificação manual**: somente CORS real contra bucket e arquivos grandes, pois runner não reproduz bucket.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, FR-005, NFR-001, NFR-002, AC-001 | AC-001 | `remote-manifest.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-001 NFR-002 AC-001` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-001, FR-001, FR-002, FR-005, NFR-002, AC-002 | AC-002 | `remote-manifest.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-002 AC-002` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-001, FR-001, FR-005, NFR-001, NFR-002, AC-003 | AC-003 | `remote-import.svelte.spec.ts`, marcador `SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-001, FR-001, FR-003, FR-005, NFR-002, AC-004 | AC-004 | `remote-download.test.ts`, marcador `SPECSFY: US-001 FR-001 FR-003 FR-005 NFR-002 AC-004` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-002, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-005 | AC-005 | `remote-download.test.ts`, marcador `SPECSFY: US-002 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-005` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-002, FR-003, FR-004, FR-005, NFR-002, AC-006 | AC-006 | `remote-install.test.ts`, marcador `SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-002 AC-006` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-002, FR-004, FR-005, NFR-002, AC-007 | AC-007 | `remote-install.test.ts`, marcador `SPECSFY: US-002 FR-004 FR-005 NFR-002 AC-007` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-001, US-002, FR-002, FR-004, FR-005, NFR-001, AC-008 | AC-008 | `remote-import.svelte.spec.ts`, marcador `SPECSFY: US-001 US-002 FR-002 FR-004 FR-005 NFR-001 AC-008` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |
| US-001, US-002, FR-005, NFR-001, NFR-002, AC-009 | AC-009 | `remote-import.svelte.spec.ts`, marcador `SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009` | RED: modulo ausente | GREEN: suite bible-remote passou | Refactor/regressao T014: 165 testes passaram |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `apps/web/src/lib/features/bible-remote/remote-manifest.test.ts`; `npm --prefix apps/web run test:tdd` | Pending |
| FR-001 | AC-002 | Unidade | `apps/web/src/lib/features/bible-remote/remote-manifest.test.ts` | Pending |
| FR-001 | AC-003 | Browser | `apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts` | Pending |
| FR-002 | AC-001 | Unidade/browser | `remote-manifest.test.ts`, `remote-import.svelte.spec.ts` | Pending |
| FR-002 | AC-002 | Unidade | `remote-manifest.test.ts` | Pending |
| FR-002 | AC-005 | Unidade/browser | `remote-download.test.ts`, `remote-import.svelte.spec.ts` | Pending |
| FR-003 | AC-004 | Unidade | `apps/web/src/lib/features/bible-remote/remote-download.test.ts` | Pending |
| FR-003 | AC-005 | Unidade/browser | `remote-download.test.ts`, `remote-import.svelte.spec.ts` | Pending |
| FR-003 | AC-006 | Unidade | `apps/web/src/lib/features/bible-remote/remote-install.test.ts` | Pending |
| FR-004 | AC-006 | Unidade | `apps/web/src/lib/features/bible-remote/remote-install.test.ts` | Pending |
| FR-004 | AC-007 | Unidade | `remote-install.test.ts` | Pending |
| FR-004 | AC-008 | Browser | `remote-import.svelte.spec.ts` | Pending |
| FR-005 | AC-005 | Browser | `remote-import.svelte.spec.ts` | Pending |
| FR-005 | AC-008 | Browser | `remote-import.svelte.spec.ts` | Pending |
| FR-005 | AC-009 | Browser/inspeção | `remote-import.svelte.spec.ts`; 320px/1440px | Pending |
| NFR-001 | AC-001 | Browser/inspeção | Vitest Browser; 320px/1440px | Pending |
| NFR-001 | AC-005 | Browser | `remote-import.svelte.spec.ts` | Pending |
| NFR-001 | AC-009 | Browser/inspeção | `remote-import.svelte.spec.ts`; foco e progresso | Pending |
| NFR-002 | AC-004 | Unidade/browser | `remote-download.test.ts`; observação de rede | Pending |
| NFR-002 | AC-005 | Unidade/browser | `remote-download.test.ts`; streaming sem travar | Pending |
| NFR-002 | AC-006 | Unidade | `remote-install.test.ts`; continua após falhas | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0008-importar-biblias-por-url-do-bucket-r2/spec.md --allow-draft`
- **Achados**: Nenhum BLOCKER; 2 US, 5 FR, 2 NFR, 9 AC com cobertura minima 3 AC por ID; interface Sim completa. Validado em 2026-09-03.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`, severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0008-importar-biblias-por-url-do-bucket-r2/spec.md --allow-draft`
- **Achados**: 14 tarefas, 9 TDD RED, 18/18 IDs cobertos, CODE com 3+ predecessores. Aprovado em 2026-09-03.

#### Gate do Ato III — Entrega

- **Resultado**: Passed
- **Comando**: `npm --prefix apps/web run test:tdd`, `npm --prefix apps/web run build`
- **Achados**: 165/165 testes passaram (37 arquivos), build Cloudflare OK, 8 testes novos bible-remote passaram. Revisao visual 320px/1440px aplicada no componente.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Provar listagem da URL base em `apps/web/src/lib/features/bible-remote/remote-manifest.test.ts` — Refs: US-001, FR-001, FR-002, FR-005, NFR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001 e confirmar normalização https, manifest/index fallback e estado instalado.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-001 NFR-002 AC-001`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do módulo de manifest.
  - [x] **VISUAL**: Não aplicável; prova serviço sem renderizar interface.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Manter fetch mockado determinístico.

- [x] T002 [TEST] [TDD] [US-001] Provar URL direta .sqlite em `apps/web/src/lib/features/bible-remote/remote-manifest.test.ts` — Refs: US-001, FR-001, FR-002, FR-005, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e confirmar item único sem manifest.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-002 AC-002`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do atalho de URL direta.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Cobrir URL relativa e absoluta.

- [x] T003 [TEST] [TDD] [US-001] Provar erro recuperável de listagem em `apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts` — Refs: US-001, FR-001, FR-005, NFR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e confirmar erro próximo ao campo e preservação de seleção.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do componente remoto.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando browser e causa do RED.
  - [x] **IMPROVE**: Selecionar por nome acessível.

- [x] T004 [TEST] [TDD] [US-001] Provar diagnóstico de rede/CORS em `apps/web/src/lib/features/bible-remote/remote-download.test.ts` — Refs: US-001, FR-001, FR-003, FR-005, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e confirmar distinção rede/http/cors.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-003 FR-005 NFR-002 AC-004`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do download tipado.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Isolar AbortController por arquivo.

- [x] T005 [TEST] [TDD] [US-002] Provar progresso por arquivo em `apps/web/src/lib/features/bible-remote/remote-download.test.ts` — Refs: US-002, FR-002, FR-003, FR-005, NFR-001, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e confirmar progresso por arquivo e global com e sem Content-Length.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-002 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-005`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência de streaming com progresso.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Usar chunks pequenos determinísticos.

- [x] T006 [TEST] [TDD] [US-002] Provar instalação sem sobrescrita em `apps/web/src/lib/features/bible-remote/remote-install.test.ts` — Refs: US-002, FR-003, FR-004, FR-005, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler AC-006 e confirmar válido novo, duplicado e falha preservando existente.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-002 AC-006`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência da instalação remota.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Reusar validação OpenLP existente.

- [x] T007 [TEST] [TDD] [US-002] Provar rejeição de SQLite/schema inválido em `apps/web/src/lib/features/bible-remote/remote-install.test.ts` — Refs: US-002, FR-004, FR-005, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-007 e confirmar motivos invalid-sqlite e invalid-schema sem gravar.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-002 FR-004 FR-005 NFR-002 AC-007`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência da validação.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Cobrir book/verse ausentes separadamente.

- [x] T008 [TEST] [TDD] [US-001] [US-002] Provar catálogo atualizado nas superfícies em `apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts` — Refs: US-001, US-002, FR-002, FR-004, FR-005, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler AC-008 e confirmar reuso e status complete/partial.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 US-002 FR-002 FR-004 FR-005 NFR-001 AC-008`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência de integração com catálogo.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da integração.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Mockar storage em memória.

- [x] T009 [TEST] [TDD] [US-001] [US-002] Provar acessibilidade e responsivo em `apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts` — Refs: US-001, US-002, FR-005, NFR-001, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-009 e confirmar labels, progresso semântico e 320px/1440px.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do componente acessível.
  - [x] **VISUAL**: Não aplicável; revisão visual ocorre na tarefa de tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Evitar snapshots frágeis.

#### Fase 2 — US-001 Ver Bíblias disponíveis (P1)

**Objetivo**: listar SQLite remotos com estado instalado a partir de URL base ou direta.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-manifest.test.ts` passa.

- [x] T010 [CODE] [US-001] Implementar manifest e catálogo remoto em `apps/web/src/lib/features/bible-remote/remote-manifest.ts` — Refs: US-001, FR-001, FR-002, FR-005, NFR-002, AC-001, AC-002 — Depends: T001, T002, T005
  - [x] **PREP**: Confirmar RED de T001/T002 e contrato de manifest.
  - [x] **EXECUTE**: Implementar normalização https, fetch manifest/index, filtragem .sqlite e URL direta.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-manifest.test.ts` e `npm --prefix apps/web run check-types`.
  - [x] **VISUAL**: Não aplicável; sem interface.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos nas seções 11–13.
  - [x] **IMPROVE**: Centralizar mensagens de erro tipadas.
<!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","FR-002","FR-005","NFR-002","AC-001","AC-002"],"files":["apps/web/src/lib/features/bible-remote/remote-manifest.ts","apps/web/src/lib/features/bible-remote/remote-manifest.test.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-manifest.test.ts","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase 3 — US-002 Baixar e instalar (P1)

**Objetivo**: download com progresso por arquivo e instalação validada idempotente.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/` passa.

- [x] T011 [CODE] [US-002] Implementar download com progresso em `apps/web/src/lib/features/bible-remote/remote-download.ts` — Refs: US-002, FR-003, FR-005, NFR-002, AC-004, AC-005 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de streaming e erros tipados.
  - [x] **EXECUTE**: Implementar fetch + ReadableStream, progresso por arquivo/global, concorrência 2, AbortController e distinção cors/http/rede.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Não aplicável; sem interface.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13.
  - [x] **IMPROVE**: Evitar buffering duplicado em memória.
<!-- specsfy:evidence {"task":"T011","refs":["US-002","FR-003","FR-005","NFR-002","AC-004","AC-005"],"files":["apps/web/src/lib/features/bible-remote/remote-download.ts","apps/web/src/lib/features/bible-remote/remote-download.test.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-download.test.ts","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

- [x] T012 [CODE] [US-002] Implementar validação e instalação em `apps/web/src/lib/features/bible-remote/remote-install.ts` — Refs: US-002, FR-004, FR-005, NFR-002, AC-006, AC-007 — Depends: T006, T007, T010, T011
  - [x] **PREP**: Confirmar RED de validação e reuso de `bible-reader.ts`/`workspace.ts`.
  - [x] **EXECUTE**: Validar assinatura + OpenLP, checar duplicado, gravar em `bibles/`, atualizar status e estender motivos de `ImportResult`.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Não aplicável; sem interface.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13.
  - [x] **IMPROVE**: Fechar instâncias sql.js após validar.
<!-- specsfy:evidence {"task":"T012","refs":["US-002","FR-004","FR-005","NFR-002","AC-006","AC-007"],"files":["apps/web/src/lib/features/bible-remote/remote-install.ts","apps/web/src/lib/features/bible-remote/remote-install.test.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-install.test.ts","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase de interface

- [x] T013 [CODE] [US-001] [US-002] Construir `RemoteBibleImport.svelte` em `apps/web/src/lib/features/bible-remote/RemoteBibleImport.svelte` e integrar em onboarding, `/bible` e `/config` — Refs: US-001, US-002, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-003, AC-005, AC-008, AC-009 — Depends: T003, T008, T009, T010, T011, T012
  - [x] **PREP**: Confirmar RED browser, fluxo da seção 10, estados e critérios de acessibilidade.
  - [x] **EXECUTE**: Implementar campo URL, lista, seleção, progresso por arquivo/global, resultado, retry e integração nas três superfícies; registrar blocos em `INTERFACE.md`.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- src/lib/features/bible-remote/remote-import.svelte.spec.ts` e tipos.
  - [x] **VISUAL**: Inspecionar 320px e 1440px claro/escuro em idle, loading, erro, vazio, lista, downloading, parcial e sucesso; ajustar bordas, espaçamentos, margens, padding, tipografia, foco e overflow.
  - [x] **EVIDENCE**: Registrar GREEN, viewports e arquivos nas seções 10–13.
  - [x] **IMPROVE**: Manter import local e remoto na mesma linguagem visual.
<!-- specsfy:evidence {"task":"T013","refs":["US-001","US-002","FR-002","FR-003","FR-004","FR-005","NFR-001","NFR-002","AC-003","AC-005","AC-008","AC-009"],"files":["apps/web/src/lib/features/bible-remote/RemoteBibleImport.svelte","apps/web/src/lib/features/bible-remote/remote-import.svelte.spec.ts","apps/web/src/lib/features/workspace/WorkspaceSettings.svelte","apps/web/src/lib/features/bible/BibleReader.svelte","apps/web/src/lib/features/onboarding/OnboardingModal.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase final — Qualidade

- [x] T014 [TEST] Executar regressão e rastreabilidade da SPEC-0008 em `apps/web/src/lib/features/bible-remote/` — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T010, T011, T012, T013
  - [x] **PREP**: Identificar suites, tipos, build e validadores.
  - [x] **EXECUTE**: Executar `npm --prefix apps/web run test:tdd`, `check-types`, `build`, `check_traceability` full-chain e `monitor_context --check`.
  - [x] **VERIFY**: Confirmar ausência de gaps e gates verdes.
  - [x] **VISUAL**: Repassar conferência visual final de bordas, espaçamentos, margens, padding e tipografia nos viewports e estados relevantes.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais.
  - [x] **IMPROVE**: Registrar retrospectiva.
<!-- specsfy:evidence {"task":"T014","refs":["US-001","US-002","FR-001","FR-002","FR-003","FR-004","FR-005","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009"],"files":["apps/web/src/lib/features/bible-remote/remote-manifest.test.ts","apps/web/src/lib/features/bible-remote/remote-download.test.ts","apps/web/src/lib/features/bible-remote/remote-install.test.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run build","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003/T004/T005/T006/T007/T008/T009 → T010 → T011 → T012 → T013 → T014.
- Tarefas paralelas: T001–T009 podem rodar em paralelo (arquivos de teste distintos); T010–T012 em sequência por dependência de serviço.
- Estratégia de MVP: US-001 + US-002 juntas; sem valor parcial sem instalação.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Bucket R2 público com CORS liberado e `manifest.json` na raiz; `sql.js`, `WorkspaceStorage` e componentes shadcn-svelte existentes.

#### Riscos

- CORS bloqueado → mitigar com erro específico e orientação de `Access-Control-Allow-Origin`.
- Arquivos 50–200 MB travam UI → mitigar com streaming, concorrência 2 e escrita única ao final.
- Manifest ausente no bucket real → mitigar com fallback index.json + erro que mostra formato esperado.
- Quota OPFS cheia → mitigar com mensagem de espaço e preservação dos já instalados.

#### Suposições

- URL base é HTTPS pública sem auth; nomes `.sqlite` são únicos por bucket; tamanho via Content-Length quando disponível; última URL pode ser lembrada localmente.

### 17. Decisões

- **DEC-001**: Manifest JSON na base (`manifest.json`, fallback `index.json`) como listagem — evita List XML assinado e mantém bucket estático simples; trade-off: exige publicar o manifest.
- **DEC-002**: Suportar URL direta `.sqlite` como item único — cobre link compartilhado sem manifest; trade-off: sem descoberta de outros arquivos.
- **DEC-003**: Mesmo componente `RemoteBibleImport` nas três superfícies — evita divergência entre onboarding, leitor e config; trade-off: props de variante para contexto.
- **DEC-004**: Streaming com concorrência 2 e validação pós-download — equilibra velocidade e memória em mobile; trade-off: sem resume de download interrompido nesta fatia.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
