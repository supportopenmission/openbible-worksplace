# Backlog: Múltiplos workspaces no modelo de vaults

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0017 |
| Status | Ready for specification |
| Produto | OpenBible |
| Épico | Arquitetura local-first e portabilidade dos dados |
| Funcionalidade | Múltiplos workspaces no modelo de vaults |
| Tipo | Funcionalidade |
| Prioridade | Alta — fundação das quatro fatias seguintes |
| Milestones | |
| Criado em | 2026-09-05 |
| Spec promovida | Nenhuma |

## Ideia original

Permitir cadastrar várias pastas de workspace, selecionar a ativa em um dropdown semelhante ao vault switcher do Obsidian e fazer toda a aplicação operar exclusivamente sobre essa pasta.

## Problema percebido

O OpenBible registra e reabre apenas um workspace por origem ou perfil local, impedindo organizar contextos independentes e trocar entre eles com segurança.

## Pessoa afetada ou beneficiada

Pessoa usuária individual que mantém mais de um conjunto de Bíblias, notas, sermões, estudos e anexos.

## Resultado ou valor esperado

Cadastrar, identificar, reabrir e trocar workspaces isolados sem misturar dados, índices, sincronização ou contexto de IA.

## Contexto

Primeira fatia dependente do BACKLOG-0016 e fundação para portabilidade, backup, Automerge e agentes de IA.

## Referências relacionadas

- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico pai e ordem das fatias.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — comportamento atual de criação e reencontro de um workspace.
- `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — pasta nativa, registro singular do workspace ativo e lock por workspace.

## Comportamento esperado

- O OpenBible mantém um registro unificado de vários workspaces e apresenta todos no mesmo seletor.
- No Tauri, cada workspace aponta para uma pasta real do sistema.
- Em navegadores com acesso autorizado a diretórios, um workspace pode apontar para a pasta escolhida pela pessoa.
- No iOS e em outros PWAs sem acesso equivalente ao filesystem, cada workspace é um diretório lógico isolado dentro do OPFS.
- A diferença do backend não altera o isolamento nem a navegação principal do workspace.
- No desktop, o seletor persistente aparece no topo da Sidebar; no mobile, aparece no cabeçalho ou drawer acessível da navegação.
- O dropdown permite trocar o workspace, criar um novo, adicionar uma pasta existente e abrir a gestão completa de workspaces.
- Ao solicitar a troca, o OpenBible conclui o autosave pendente antes de mudar a raiz ativa.
- Se o salvamento falhar, a troca é bloqueada e a pessoa pode tentar novamente ou descartar explicitamente as alterações para prosseguir.
- A gestão oferece duas ações diferentes: remover o workspace da lista local do OpenBible sem apagar dados e excluir o workspace após confirmação forte da consequência.
- Em pasta real, a exclusão integral só é habilitada quando o OpenBible comprova que a raiz é um workspace dedicado criado ou reconhecido pelo produto e que não contém arquivos desconhecidos.
- Quando a propriedade ou o conteúdo exclusivo não puderem ser comprovados, o OpenBible bloqueia a exclusão e orienta a pessoa a revisar e apagar a pasta manualmente no sistema.
- Na inicialização, uma falha de permissão, disponibilidade, lock ou integridade do último workspace não provoca troca automática.
- O OpenBible mantém a escolha identificada, abre o estado de recuperação e oferece reconectar, tentar novamente ou escolher outro workspace.
- Cada workspace possui um ID estável e um nome exibido independente do caminho físico.
- Ao cadastrar uma pasta, o nome inicial é derivado dela; a pessoa pode alterar o nome exibido sem renomear a pasta real.
- Ao atualizar uma instalação existente, o OpenBible cadastra automaticamente o workspace atual como o primeiro registro, gera seu ID estável, preserva o nome e o mantém ativo sem repetir o onboarding.
- Cada dispositivo mantém seu próprio catálogo dos workspaces que consegue abrir; o catálogo não é sincronizado entre aparelhos.
- A própria raiz guarda no `.openbible/config.json` o ID estável, o nome exibido e a versão do formato do workspace.
- Ao mover ou adicionar a pasta em outro dispositivo, o OpenBible reconhece a identidade existente em vez de criar outra.
- O `.openbible/config.json` registra se a raiz dedicada foi criada ou preparada pelo OpenBible como gerenciada; uma pasta apenas adicionada começa como não gerenciada.
- Ao adicionar uma raiz cujo ID já existe no catálogo local, o OpenBible pede se a pessoa deseja atualizar a localização existente ou criar uma cópia independente.
- Atualizar a localização preserva o ID; criar cópia gera e grava um novo ID na nova raiz antes de cadastrá-la.

## Regras de negócio

- Cada workspace possui identidade estável, nome exibido e backend de armazenamento.
- Somente um workspace fica ativo por janela ou sessão.
- Toda leitura, gravação, índice, sincronização e contexto de IA resolve primeiro o workspace ativo.
- Um workspace OPFS não deve ser apresentado como pasta visível do sistema.
- O nome do workspace ativo permanece visível nas superfícies principais, sem depender apenas de ícone ou cor.
- Nenhuma operação do novo workspace começa antes de o salvamento ou descarte explícito do workspace anterior terminar.
- “Remover da lista” nunca remove arquivos e permite adicionar novamente o mesmo workspace.
- “Excluir workspace” não pode compartilhar aparência, posição ou confirmação com a remoção não destrutiva.
- A ausência de comprovação de propriedade ou a presença de arquivo desconhecido torna a exclusão pelo aplicativo proibida, sem opção de forçar.
- Falha ao abrir um workspace não autoriza remover seu cadastro, alterar seus arquivos ou ativar silenciosamente outro workspace.
- Alterar o nome exibido não altera o ID, o handle, o caminho, o conteúdo ou o estado de sincronização do workspace.
- A migração do registro singular atual para o catálogo de workspaces é idempotente e não move, renomeia nem reescreve conteúdo autoral.
- Caminhos, handles e referências OPFS são locais ao dispositivo e nunca entram na sincronização.
- Renomear o workspace atualiza seu nome portátil em `.openbible/config.json`, sem alterar a pasta física.
- A exclusão integral de pasta real exige simultaneamente marcador de raiz gerenciada válido e ausência de arquivos desconhecidos.
- O catálogo local mantém no máximo uma referência de armazenamento por ID de workspace.

## Critérios de aceitação

- **AC-001 — Migração transparente:** Dado que existe o workspace singular atual, quando a versão com catálogo inicia pela primeira vez, então o sistema gera identidade estável, cadastra e ativa esse workspace sem mover dados nem repetir onboarding.
- **AC-002 — Criação adaptativa:** Dado o ambiente atual, quando a pessoa cria um workspace, então Tauri usa pasta real, navegador compatível pode usar pasta autorizada e PWA sem filesystem cria diretório lógico isolado no OPFS.
- **AC-003 — Seleção persistente:** Dado mais de um workspace cadastrado, quando a pessoa abre o seletor na Sidebar desktop ou no header/drawer mobile, então identifica o ativo e pode trocar, criar, adicionar ou abrir a gestão usando mouse ou teclado.
- **AC-004 — Isolamento:** Dado dois workspaces, quando a pessoa alterna entre eles, então notas, Bíblias, destaques, preferências de conteúdo, índices e contexto futuro permanecem restritos à raiz ativa.
- **AC-005 — Autosave antes da troca:** Dado conteúdo pendente, quando a pessoa solicita outra raiz, então o sistema conclui o autosave antes da troca; se falhar, mantém o workspace atual e oferece tentar novamente ou descartar explicitamente.
- **AC-006 — Recuperação:** Dado que o último workspace está sem permissão, ausente, bloqueado ou inválido, quando o OpenBible inicia, então preserva a escolha, informa o motivo e permite reconectar, tentar novamente ou escolher outro sem fallback silencioso.
- **AC-007 — Remoção não destrutiva:** Dado um workspace cadastrado, quando a pessoa escolhe remover da lista e confirma, então somente a referência local é removida e os arquivos permanecem intactos.
- **AC-008 — Exclusão protegida:** Dado uma raiz real, quando a pessoa solicita exclusão, então o sistema só permite apagar integralmente se o marcador de raiz gerenciada for válido e não houver arquivos desconhecidos; caso contrário bloqueia sem opção de forçar.
- **AC-009 — Colisão de ID:** Dado uma pasta com ID já cadastrado, quando ela é adicionada, então o sistema exige escolher entre atualizar localização ou criar cópia independente e termina com no máximo uma raiz por ID.
- **AC-010 — Nome portátil:** Dado um workspace cadastrado, quando seu nome exibido é alterado, então `.openbible/config.json` recebe o novo nome sem alterar ID ou pasta física.
- **AC-011 — Estado responsivo e acessível:** Dado viewport de 320px ou 1440px, tema claro ou escuro e navegação por teclado, quando a pessoa usa seleção, gestão, recuperação ou confirmação, então foco, nome ativo, consequência e próximo passo permanecem visíveis, sem overflow.

## Qualidades e operação

- Segurança: nenhuma operação aceita caminho arbitrário vindo da UI; referências passam pelos adaptadores autorizados, e exclusão real exige marcador gerenciado, varredura e confirmação forte.
- Privacidade: catálogo, caminhos, handles e histórico de último uso ficam somente no dispositivo e não entram no workspace sincronizável.
- Integridade: troca, migração do cadastro, mudança de ID e atualização de configuração devem ser atômicas ou restaurar o workspace ativo anterior após falha.
- Desempenho: listar workspaces não abre nem indexa todas as raízes; validação completa ocorre somente ao ativar, recuperar, adicionar ou excluir a raiz afetada.
- Acessibilidade: seletor, drawer, diálogos e gestão operáveis por teclado, com foco previsível, nomes acessíveis, `aria-live` para troca/erro e consequência destrutiva textual.
- Observabilidade local: erros distinguem permissão, ausência, lock, configuração inválida, colisão de ID, autosave e arquivo desconhecido sem registrar caminhos completos ou conteúdo.

## Dependências

- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — bootstrap, OPFS, pasta local e configuração atual.
- `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — pasta nativa, facade tipada e lock de escritor por workspace.
- Componentes existentes `AppFrame`, `AppSidebar`, `WorkspaceSettings`, `PermissionRecovery`, `DropdownMenu`, `Dialog`, `Drawer` e `Sidebar`.
- Precede BACKLOG-0018, BACKLOG-0019, BACKLOG-0020 e BACKLOG-0021.

## Situações de erro

- Autosave falha: workspace atual permanece ativo; tentar novamente ou descartar e trocar.
- Permissão revogada: abrir recuperação e preservar cadastro.
- Pasta movida ou ausente: permitir localizar novamente; aplicar regra de colisão pelo ID encontrado.
- Lock ocupado: não abrir como escritor; explicar e permitir tentar novamente ou escolher outro.
- `.openbible/config.json` ausente, inválido ou de versão incompatível: não sobrescrever; oferecer diagnóstico/recuperação compatível.
- Mesmo ID em outra raiz: pedir atualizar localização ou criar cópia independente.
- Arquivo desconhecido em raiz gerenciada: bloquear exclusão integral sem opção de forçar.
- Falha ao mudar catálogo/configuração: restaurar referência ativa anterior e informar recuperação.
- Último workspace removido: abrir fluxo de criar/adicionar, sem fabricar workspace silenciosamente.

## Escopo

- Dentro: catálogo local; identidade portátil; migração do registro atual; criar/adicionar/renomear/selecionar/remover/excluir; backend adaptativo; isolamento; autosave; recuperação; colisão de ID; seletor desktop/mobile; gestão em Configurações; testes de contrato, estado e interface.
- Fora: mudar o formato autoral de notas/destaques (BACKLOG-0018); backup ZIP/restauração (0019); Automerge ou transporte remoto (0020); agentes/credenciais/embeddings (0021); renomear pasta física; sincronizar catálogo, caminhos ou handles; abrir dois workspaces simultaneamente na mesma janela.

## Dúvidas, decisões e riscos

- **Decisão D-001:** modelo adaptativo: Tauri usa pastas reais; navegadores compatíveis podem usar pastas escolhidas; iOS/PWA mantém vários workspaces lógicos isolados no OPFS; todos aparecem no mesmo seletor. Fonte: conversa atual, resposta “1” à Pergunta 1 do BACKLOG-0017.
- **Decisão D-002:** seletor persistente no topo da Sidebar desktop e no cabeçalho/drawer mobile; dropdown com trocar, criar, adicionar pasta existente e abrir “Gerenciar workspaces”. Fonte: conversa atual, resposta “1” à Pergunta 2 do BACKLOG-0017.
- **Decisão D-003:** concluir o autosave antes de trocar; se falhar, bloquear a troca e oferecer “Tentar novamente” ou “Descartar e trocar”. Fonte: conversa atual, resposta “1” à Pergunta 3 do BACKLOG-0017.
- **Decisão D-004:** oferecer as duas opções: remover da lista preservando os dados e excluir o workspace por ação separada com confirmação forte. Fonte: conversa atual, resposta “2, mas dar as duas opções” à Pergunta 4 do BACKLOG-0017.
- **Decisão D-005:** excluir uma pasta real inteira somente com propriedade comprovada e ausência de arquivos desconhecidos; caso contrário, bloquear e orientar exclusão manual. Fonte: conversa atual, resposta “1” à Pergunta 5 do BACKLOG-0017.
- **Decisão D-006:** preservar o último workspace selecionado e abrir recuperação diante de permissão revogada, pasta ausente, lock ocupado ou corrupção; oferecer reconectar, tentar novamente ou escolher outro, sem fallback silencioso. Fonte: conversa atual, resposta “1” à Pergunta 6 do BACKLOG-0017.
- **Decisão D-007:** nome exibido independente e editável, inicialmente derivado da pasta, com ID estável; renomear no OpenBible não renomeia a pasta. Fonte: conversa atual, resposta “1” à Pergunta 7 do BACKLOG-0017.
- **Decisão D-008:** cadastrar automaticamente o workspace atual como primeiro registro, gerar ID estável, preservar nome e dados e ativá-lo sem repetir onboarding. Fonte: conversa atual, resposta “1” à Pergunta 8 do BACKLOG-0017.
- **Decisão D-009:** catálogo local por dispositivo, contendo ID, nome exibido, backend, referência local e último uso; não sincronizar caminhos ou handles. Fonte: conversa atual, resposta “1” à Pergunta 1 da descoberta de dados.
- **Decisão D-010:** guardar ID, nome e versão do formato em `.openbible/config.json`; o catálogo do dispositivo guarda a referência local e reconhece a mesma identidade após mudança ou recadastro. Fonte: conversa atual, resposta “1” à Pergunta 2 da descoberta de dados.
- **Decisão D-011:** registrar em `.openbible/config.json` o marcador criado na preparação de uma raiz dedicada; pastas apenas adicionadas são não gerenciadas, e a exclusão continua condicionada à ausência de arquivos desconhecidos. Fonte: conversa atual, resposta “1” à Pergunta 3 da descoberta de dados.
- **Decisão D-012:** ao detectar o mesmo ID, perguntar entre atualizar localização ou criar cópia independente com novo ID; nunca manter duas raízes com o mesmo ID. Fonte: conversa atual, resposta “1” à Pergunta 4 da descoberta de dados.
- **Direção de interface:** preservar SvelteKit/Svelte 5, Tailwind 4 e shadcn-svelte; usar seletor no `Sidebar.Header`, trigger equivalente no header mobile, gestão na superfície atual de Configurações, `DropdownMenu` no desktop, `Drawer` no mobile e diálogo de confirmação destrutiva. Defaults de `DESIGNSYSTEM.MD`, sem exceção visual.
- **Jornada UX:** identificar raiz ativa → abrir seletor → salvar pendências → validar destino → trocar e anunciar resultado; criação/adição e recuperação revelam detalhes somente quando necessários; remoção e exclusão permanecem ações semanticamente separadas.
- **Nenhuma lacuna aplicável** para promoção inicial; detalhes internos de schema e componentes serão consolidados na spec e no plano sem alterar as decisões do produto.
- **Limite da área:** oito perguntas de Workspaces concluídas; decisões restantes de dados, interface técnica e testes seguem nas etapas responsáveis sem reabrir esta área.
- **Risco:** um registro global de workspaces pode se tornar fonte autoral indevida; deve guardar somente identidade, nome e referência local necessárias para reencontro, nunca conteúdo do workspace.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify`; não iniciar `$specsfy-07-implement` nesta conversa.
