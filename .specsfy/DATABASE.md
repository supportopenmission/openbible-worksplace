# Banco de dados

Mapa de persistência do sistema. A leitura bíblica usa arquivos SQLite importados
como fontes locais somente leitura; o índice do workspace permanece auxiliar.

## Fontes de dados

<!-- specsfy:database:start -->
| Fonte | Tecnologia/forma | Evidência |
| --- | --- | --- |
| Workspace local | Markdown + YAML (`notes/<noteId>.md`, `trash/`) | `apps/web/src/lib/features/notes/notes-repository.ts` |
| Workspace local | SQLite auxiliar (`.openbible/index.sqlite`) | `apps/web/src/lib/features/notes/note-verse-index.ts`, `apps/web/src/lib/features/bible/reader-highlights-repository.ts` |
| Workspace local | SQLite somente leitura (`bibles/*.sqlite`) | `apps/web/src/lib/features/bible/bible-reader.ts` |
| Navegador | IndexedDB (`openbible-workspace`) | `apps/web/src/lib/features/workspace/` |
| Navegador | `localStorage` (cache de primeiro paint) | `.openbible/preferences.json` espelhado |

## Estruturas detectadas

| Estrutura | Tipo | Campos | Relações | Fonte |
| --- | --- | --- | --- | --- |
| `note_verse_ref` | Tabela SQLite auxiliar | `id`, `note_path`, `block_index`, `version_id`, `book_id`, `book_name`, `chapter`, `verse_start`, `verse_end` | N..1 nota (`note_path`); espelha fences `:::verse`; índices em `(note_path)` e `(version_id, book_id, chapter)` | `note-verse-index.ts` |
| `reader_highlight` | Tabela SQLite auxiliar | `id`, `version_id`, `book_id`, `chapter`, `verse_start`, `verse_end`, `style_id` | Identidade natural = intervalo exato (`UNIQUE` em versão+livro+capítulo+início+fim); N anotações sobreponíveis por capítulo; não aponta para nota | `reader-highlights-repository.ts` |
| `book` | Tabela SQLite OpenLP | `id`, `name`, `abbreviation`, `testament_id` | 1 arquivo `bibles/*.sqlite` contém N livros | `bible-reader.ts` |
| `verse` | Tabela SQLite OpenLP | `book_id`, `chapter`, `verse`, `text` | `verse.book_id` → `book.id` | `bible-reader.ts` |
<!-- specsfy:database:end -->

## Estruturas de leitura bíblica

| Fonte             | Estrutura                    | Campos mínimos                                          | Relação e uso                                                                          |
| ----------------- | ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `bibles/*.sqlite` | `book`                       | `id`, `name`; `abbreviation` e `testament_id` opcionais | Um arquivo contém muitos livros; validada antes de entrar no catálogo                  |
| `bibles/*.sqlite` | `verse`                      | `book_id`, `chapter`, `verse`, `text`                   | `verse.book_id` referencia `book.id`; consultas de capítulo e busca são parametrizadas |
| `bibles/*.sqlite` | `metadata` (opcional)        | `key`, `value`                                          | `key = 'name'` fornece o nome da versão; o nome do arquivo é o fallback                |
| Pasta/OPFS        | `.openbible/preferences.json` | `theme`, `readerSelection` | Fonte File Over Apps das preferências; `localStorage` é cache para o primeiro paint (`initialRoute` removida em SPEC-0012) |
| Pasta/OPFS        | `.openbible/index.sqlite`     | `note_verse_ref`, `reader_highlight` e índices auxiliares | Espelha fences `:::verse` e guarda destaques do leitor; **não** substitui o Markdown nem o SQLite bíblico |
| Pasta/OPFS        | `notes/<noteId>.md`           | frontmatter YAML + corpo Markdown                      | Fonte File Over Apps das notas; H1 sincronizado com `title`; fences `:::verse` com snapshot no corpo                               |
| Pasta/OPFS        | `trash/<noteId>.md`           | mesmo formato de `notes/`                              | Lixeira; arquivo original preservado até remoção manual futura                                                                      |
| IndexedDB         | `openbible-workspace`         | handle da pasta                                        | Só no modo `local`; permissão `readwrite` é revalidada a cada visita                  |

## Decisões, ownership e retenção

### Informações confirmadas do produto

- Sermões e estudos estruturados terão Markdown com YAML frontmatter como fonte
  primária.
- Notas simples também usarão Markdown com YAML frontmatter.
- SQLite local manterá índices, destaques e dados auxiliares, sem substituir os
  arquivos Markdown.
- Bancos SQLite bíblicos poderão ser importados por arrastar e soltar quando
  seguirem o padrão do OpenLP, ou acessados por uma URL de distribuição como
  Cloudflare R2.
- O `.openbible/index.sqlite` é um SQLite válido. Um arquivo de 0 bytes legado é
  reparado na preparação. A tabela auxiliar `note_verse_ref` é criada
  idempotentemente na primeira operação de notas (`CREATE TABLE IF NOT EXISTS`).
  O índice espelha fences `:::verse` do Markdown e é reindexado após cada save;
  refs são removidas ao mover a nota para `trash/`. A tabela auxiliar
  `reader_highlight` é criada idempotentemente na primeira operação de destaque
  do leitor; a identidade é o intervalo exato (`UNIQUE` em `version_id`,
  `book_id`, `chapter`, `verse_start`, `verse_end`) e o `style_id` segue a
  paleta Q6. Remover um destaque é `DELETE` só dessa identidade. A listagem
  workspace-wide usa `SELECT` sem filtro de capítulo ou versão (`ORDER BY
  version_id, book_id, chapter, verse_start, verse_end`) via
  `listAllReaderHighlights` / `readAllReaderHighlights`; sheet do leitor e página
  `/highlights` mostram o mesmo conjunto. O leitor bíblico
  **não** abre `index.sqlite` para texto; usa `sql.js` nos SQLite importados em
  `bibles/` (somente leitura, nunca alterados por notas ou destaques) e fecha
  cada instância após a consulta.
- A validação funcional do leitor exige as tabelas `book` e `verse` e as colunas
  mínimas listadas acima; arquivos incompatíveis são diagnosticados sem remover
  fontes válidas nem modificar qualquer SQLite.
- Tema e última leitura ficam em `.openbible/preferences.json`.
  A preferência de tela inicial (`initialRoute`) foi removida em SPEC-0012: a
  rota `/` é sempre a home operacional e valores legados são tratados como
  ausentes.
  O `localStorage` (`openbible.theme`, `openbible.initial-route`,
  `openbible.reader-selection`) é cache de primeiro paint e não substitui o arquivo.
- No modo pasta local, o handle fica no IndexedDB e a permissão `readwrite` é
  consultada de novo após o reload; se voltar a `prompt`, a UI pede acesso sem
  fingir que o workspace sumiu. No OPFS e no origin, `navigator.storage.persist()`
  tenta reduzir eviction.
- O cache offline do app shell é gerenciado pelo Cache Storage do service worker;
  ele não é fonte de dados de domínio nem substitui o SQLite local.
- Backup, exportação e sincronização seguem as decisões registradas nas
  SPEC-0018, SPEC-0019 e SPEC-0020; a retenção detalhada de outros artefatos
  permanece pendente quando não estiver descrita abaixo.
- A SPEC-0013 troca somente o motor visual das notas por Milkdown. O arquivo
  `notes/<noteId>.md` mantém o mesmo YAML e fence `:::verse`; a reindexação após
  autosave continua escrevendo `note_verse_ref` sem migration ou mudança de
  schema.

### SPEC-0019 e SPEC-0020 — Sincronização local e agentes

As estruturas abaixo são decisões de persistência aprovadas para a próxima
implementação. Elas não autorizam transformar projeções ou credenciais locais
em fonte portátil, nem introduzem servidor central obrigatório.

| Estrutura | Onde vive | Campos/forma | Relações e exclusões | Ownership e retenção |
| --- | --- | --- | --- | --- |
| Estado operacional CRDT por documento | Área reservada do workspace, separada dos arquivos autorais | Estado CRDT versionado por documento; o formato exato permanece sob o contrato da SPEC-0019 | Excluído do backup e do `.openbible/index.sqlite`; nunca é a única fonte de conteúdo, que continua nos arquivos autorais | Mantido localmente pelo workspace e pela sincronização; pode ser reconstruído ou descartado conforme o protocolo do documento |
| Política de endpoint/peer | Metadado operacional local da sincronização | Endpoint e política de peer sem segredo embutido | Pode ser sincronizado somente como política pública; não contém token, senha, chave ou segredo | Pessoa usuária do dispositivo; substituível ao reconfigurar a sincronização |
| Token de acesso PWA | Apenas memória do processo web | Token efêmero, não persistido em arquivo, IndexedDB, localStorage, workspace ou backup | Não se relaciona a arquivos portáteis nem ao estado CRDT persistente | Vive somente durante a sessão; sai ao recarregar/encerrar o PWA |
| Credencial Tauri | Credential store seguro do sistema operacional | Referência/credencial gerenciada pelo shell nativo; nenhum valor secreto no workspace | Não entra em Markdown, JSON portátil, sync ou backup | Controlada pelo sistema operacional e removida pelo fluxo de credenciais do dispositivo |
| `PortableAgentProfile` | Arquivo JSON legível dentro do workspace | Perfil versionado e editável; não contém `provider`, `endpoint`, `model` nem `secretRef` | Pode acompanhar o workspace e ser versionado; não concede credencial nem aponta para segredo persistido | Pessoa usuária e ferramentas locais; alterável ou removível junto da configuração do agente |
| `DeviceAgentBinding` | Registro local reservado do aparelho | Associação do workspace/agente ao dispositivo e estado local de autorização | Excluído do workspace autoral, sincronização, backup e exportação; não deve ser inferido do `PortableAgentProfile` | Apenas o dispositivo atual; removido ao desvincular ou limpar credenciais locais |
| Runs e propostas de agente | Armazenamento operacional transitório local | Identificador, status, timestamps e resultado mínimo necessário para a sessão | Não são fonte autoral, não entram em backup/sync e não carregam segredo | Retenção transitória; limpeza após conclusão, cancelamento ou expiração da sessão |
| Diagnóstico sanitizado | Log operacional local limitado | No máximo 200 eventos e janela máxima de sete dias; sem conteúdo completo, token, endpoint secreto ou caminho sensível | Não entra em workspace autoral, backup ou sync; somente códigos, fases e próximos passos sanitizados | Retido localmente apenas para recuperação/observabilidade; expira ao atingir limite de eventos ou idade |

Essas decisões preservam a separação entre dados portáteis do workspace,
projeções descartáveis, credenciais do dispositivo e estado transitório de
agentes.

<!-- specsfy:conversation-data:start -->
## Informações a guardar confirmadas

| Informação | Para que serve | O que guardar | Formato sugerido | Ligações | Quem usa | Quando muda ou sai | Fontes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configuração do espaço de trabalho | Permitir que o OpenBible reencontre o armazenamento escolhido e abra o projeto sem repetir o onboarding. | Tipo de armazenamento usado, referência ao local escolhido quando aplicável, versão da configuração e situação da importação de Bíblias: pendente, concluída ou parcial. | Registro local persistente com valores de configuração e situação; os detalhes de conexão não são enviados para servidor. | A configuração identifica um único espaço de trabalho e se relaciona aos arquivos SQLite existentes na pasta bibles. | Somente a pessoa usuária individual do dispositivo pode consultar ou alterar. | É criada ao concluir o onboarding, permanece entre visitas, muda quando o armazenamento ou o estado da importação muda e pode ser substituída ao reconfigurar o espaço de trabalho; não há política de remoção definida nesta feature. | specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md; specs/backlog/0001-onboarding-configuracao-armazenamento.md; conversa atual, resposta à Pergunta 2 e à Pergunta 4 |
| Tela inicial preferida             | Abrir automaticamente a área escolhida quando a pessoa entrar na rota /.                                 | A tela inicial escolhida entre Bíblia, sermão ou nenhuma preferência; estudo permanece em breve e não é valor válido nesta fatia.                                        | Escolha entre opções disponíveis de telas do produto, com ausência de escolha representando o seletor inicial.            | A preferência aponta para uma rota de entrada do produto e controla a exibição do Sidebar.                           | Somente a pessoa usuária individual do dispositivo consulta e altera.         | É criada quando a pessoa salva uma tela inicial, muda quando escolhe outra e deixa de valer quando a preferência é removida; enquanto não existir, / mostra as opções de entrada e o Sidebar não aparece.                              | specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md; specs/backlog/0002-tela-inicial-navegacao.md; conversa atual                                                           |
| Configuração do workspace nativo e migração | Permitir que o app nativo reencontre a pasta do workspace e saiba se uma migração do armazenamento web ainda precisa ser oferecida ou retomada. | Pasta escolhida; tipo de armazenamento (nativo ou web); versão do formato; estado da migração: não iniciada, concluída ou com erro. | O registro normativo vive em `.openbible/config.json` dentro da pasta escolhida; o shell pode manter apenas o caminho em `localStorage` para reabertura. | A configuração aponta para o workspace que contém notas, preferências, índice auxiliar e bancos bíblicos; o estado da migração se refere ao workspace web de origem e ao destino nativo. Nenhum dado do app fica em Application Support. | Somente a pessoa usuária individual do dispositivo consulta ou altera. | Criada na primeira configuração; muda ao escolher outra pasta ou quando a migração avança/termina/falha; pode ser substituída ao reconfigurar o workspace; não há retenção remota. | specs/inbox/2026-09-04-164740-versao-nativa-macos-com-tauri-e-armazenamento-local.md; specs/backlog/0014-versao-nativa-macos-tauri.md; conversa atual, clarificação Files Over App de 2026-09-04 |
| Catálogo local de workspaces | Listar, reencontrar e selecionar os workspaces disponíveis em um dispositivo sem misturar suas raízes. | ID estável do workspace, nome exibido, tipo de armazenamento, referência local necessária para reencontro, indicador do último workspace ativo e data do último uso. | Registro local por dispositivo com uma entrada por workspace e uma única referência ao workspace ativo; caminhos e handles não são sincronizados. | Cada entrada local aponta para exatamente uma raiz real, handle autorizado ou diretório lógico OPFS; o workspace ativo aponta para uma dessas entradas. | Somente a pessoa usuária local e o shell OpenBible daquele dispositivo consultam ou alteram. | Criado ao cadastrar ou migrar um workspace, atualizado ao renomear ou abrir, removido ao esquecer o workspace e apagado junto com os dados locais do aplicativo; não remove conteúdo da pasta por si só. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 1 de dados |
| Identidade portátil do workspace | Reconhecer o mesmo workspace quando sua pasta for movida ou adicionada em outro dispositivo e preservar seu nome sem depender do caminho. | ID estável, nome exibido e versão do formato do workspace. | Informações textuais e versão numérica no arquivo .openbible/config.json da própria raiz. | O ID identifica a raiz e é referenciado pelo catálogo local, pelos índices e futuramente pelo estado de sincronização; o nome acompanha o workspace sem renomear a pasta. | A pessoa pode alterar o nome pelo OpenBible; o sistema cria e mantém ID e versão. | Criado ao preparar ou migrar o workspace, preservado ao mover ou recadastrar a pasta, atualizado ao renomear e removido somente com a exclusão confirmada do workspace. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 2 de dados |
| Propriedade da raiz do workspace | Impedir que o OpenBible apague integralmente uma pasta adicionada ou que contenha arquivos fora do controle do aplicativo. | Indicador de que a raiz dedicada foi criada ou preparada pelo OpenBible como gerenciada. | Confirmação explícita no .openbible/config.json, criada somente durante a preparação de uma raiz dedicada; pastas apenas adicionadas permanecem não gerenciadas. | Pertence à identidade portátil do workspace e é consultada junto da varredura de arquivos desconhecidos antes de qualquer exclusão integral. | Somente o fluxo de criação/preparação do OpenBible define o indicador; a pessoa consulta sua consequência na gestão e confirma a exclusão. | Criado com a raiz dedicada, preservado durante seu uso e invalidado para exclusão automática quando faltar, for inconsistente ou houver arquivos desconhecidos. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 3 de dados |
| Colisão de identidade de workspace | Evitar que duas raízes divergentes sejam tratadas simultaneamente como o mesmo workspace no dispositivo e na sincronização futura. | A decisão da pessoa entre atualizar a localização do cadastro existente ou criar uma cópia independente com novo ID. | Escolha explícita durante o cadastro quando o ID lido já existir; o catálogo final mantém no máximo uma referência local por ID. | Compara o ID portátil da pasta com o catálogo local; atualizar localização preserva a identidade, enquanto criar cópia altera o ID no novo workspace. | Somente a pessoa local confirma a intenção; o OpenBible detecta a colisão e aplica a alternativa escolhida. | Surge ao adicionar uma raiz com ID já conhecido e termina quando a referência é atualizada ou a cópia recebe novo ID; nenhuma duplicidade permanece pendente. | specs/backlog/0017-multiplos-workspaces-modelo-vaults.md; conversa atual, resposta 1 à Pergunta 4 de dados |
| Identidade e metadados portáteis da nota | Reconhecer nota, sermão ou estudo fora do OpenBible e preservar metadados durante edições externas. | ID estável, versão do formato, tipo, título, descrição, datas e propriedades desconhecidas já presentes. | YAML frontmatter simples no próprio Markdown, com chaves desconhecidas preservadas. | O ID permanece ligado ao arquivo autoral mesmo após renome ou movimentação dentro do workspace. | A pessoa e qualquer editor de texto podem ler; o OpenBible altera somente os campos sob sua responsabilidade. | Criado com o documento, atualizado atomicamente e removido apenas com o arquivo. | specs/backlog/0018-formatos-portateis-indice-reconstruivel.md; conversa de 2026-09-05 sobre compatibilidade Obsidian/GitHub/PDF |
| Bloco semântico portátil da nota | Manter versículos e vídeos legíveis em qualquer editor e ainda editáveis como bloco no OpenBible. | ID do bloco, tipo, referência ou URL, versão bíblica/provedor e snapshot textual visível. | Conteúdo CommonMark/GFM visível em blockquote ou link, envolvido por comentários HTML com JSON versionado de metadados. | O ID liga metadados invisíveis ao conteúdo visível; perder comentários preserva leitura, mas perde edição enriquecida. | A pessoa lê e edita o conteúdo; o OpenBible valida metadados e nunca sobrescreve divergência externa silenciosamente. | Criado pelo comando do editor, atualizado ao editar o bloco, migrado de fence válido ao salvar e removido com o bloco. | specs/backlog/0018-formatos-portateis-indice-reconstruivel.md; conversa de 2026-09-05; documentação CommonMark/GFM/Obsidian |
| Destaque autoral do leitor bíblico | Preservar cada destaque fora do SQLite auxiliar e permitir cópia, Git e sincronização futura. | ID estável, versão e intervalo bíblico, estilo, datas e versão do schema. | Um arquivo JSON legível por destaque em highlights/<highlightId>.json. | Cada registro aponta para uma referência bíblica; o SQLite mantém apenas uma projeção consultável. | Somente a pessoa usuária e as ferramentas locais que ela escolher. | Criado ou atualizado ao destacar, removido ao apagar o destaque e reindexado sem perda quando o SQLite é recriado. | specs/backlog/0018-formatos-portateis-indice-reconstruivel.md; conversa de 2026-09-05 sobre JSON/XML/SQLite |
| Índice reconstruível do workspace | Acelerar buscas e relações sem se tornar fonte exclusiva de informação da pessoa. | Projeções de referências, destaques e metadados derivados, versão do schema, estado e origem do rebuild. | SQLite local descartável em .openbible/index.sqlite, reconstruído deterministicamente a partir de Markdown e JSON. | Cada linha referencia IDs e caminhos autorais, mas nenhum dado existe exclusivamente no índice. | Somente os motores local/WASM e nativo do OpenBible no aparelho. | Pode ser apagado ou substituído; é recriado no boot ou sob demanda quando ausente, incompatível ou corrompido. | specs/backlog/0018-formatos-portateis-indice-reconstruivel.md; conversa de 2026-09-05 sobre SQLite e portabilidade |
<!-- specsfy:conversation-data:end -->
