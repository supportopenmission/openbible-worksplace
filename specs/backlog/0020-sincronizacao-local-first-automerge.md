# Backlog: Sincronização local-first com Automerge

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0020 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | BACKLOG-0016 — arquitetura local-first, interoperabilidade e sincronização |
| Funcionalidade | Sincronização local-first de workspace com Automerge |
| Tipo | Feature arquitetural / persistência e integração |
| Prioridade | P1 |
| Milestones | Pós-formatos portáteis e backup/restauração; preparação para colaboração entre aparelhos |
| Criado em | 2026-09-05 |
| Spec promovida | `specs/planned/0019-sincronizacao-local-first-automerge/spec.md` |

## Ideia original

Sincronizar dados autorais do OpenBible entre aparelhos usando Automerge, mantendo cópias locais e índices por dispositivo.

## Problema percebido

Ainda não existe reconciliação concorrente entre dispositivos e sincronizar o SQLite binário produziria conflitos inadequados.

## Pessoa afetada ou beneficiada

Pessoa usuária que utiliza o mesmo workspace em desktop e PWA ou em mais de um aparelho.

## Resultado ou valor esperado

Mudanças offline convergem ao reconectar sem fazer do servidor ou do index.sqlite a fonte exclusiva dos dados.

## Contexto

Quarta fatia dependente do BACKLOG-0016; exige formatos portáteis, IDs estáveis, isolamento de workspace e recuperação previamente definidos.

## Referências relacionadas

- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico pai.
- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md`, `0018-formatos-portateis-indice-reconstruivel.md` e `0019-backup-restauracao-workspace-pwa.md` — dependências anteriores.
- `.openbible/sync.json` e `.specsfy/DATABASE.md` — configuração mínima atual e mapa de persistência.

## Comportamento esperado

- O OpenBible mantém Markdown e JSON como fontes portáteis legíveis; Automerge guarda mudanças e histórico operacional em um estado CRDT separado, por workspace e por documento estável.
- Cada dispositivo trabalha localmente sem rede e publica mudanças somente quando a pessoa habilita um peer ou relay configurado. O relay não é fonte exclusiva nem precisa existir para criar, ler ou editar.
- A sincronização usa documentos Automerge por unidade autoral estável (nota, sermão, destaque ou outra entidade explicitamente mapeada), com IDs estáveis e sem transportar caminhos físicos, handles, catálogo local, referências OPFS, SQLite de índice ou credenciais.
- O adaptador local do Tauri persiste no diretório operacional reservado do workspace; o PWA persiste no armazenamento do navegador disponível ao backend local, sem fazer o SQLite auxiliar virar fonte de verdade. O formato de storage CRDT pode ser binário/compactado e não é o formato de exportação.
- Ao reconectar, o sistema troca mudanças por documento, mescla alterações concorrentes sem descartar histórico e materializa novamente os arquivos portáteis. Quando uma alteração externa no Markdown não puder ser reconciliada automaticamente, preserva ambas as versões em estado recuperável e informa a pessoa.
- O transporte é substituível: primeiro suporte a adaptadores locais e WebSocket relay configurável; WebRTC, Bluetooth, importação manual e outros transports ficam como extensões compatíveis com o mesmo contrato.

## Regras de negócio

- **RB-001**: Markdown/JSON autorais continuam legíveis e utilizáveis sem Automerge, relay, rede ou OpenBible.
- **RB-002**: `.openbible/index.sqlite`, catálogo de workspaces, paths absolutos, handles File System Access/OPFS, caches, locks e credenciais são dados locais/derivados e nunca entram no documento ou envelope de sincronização.
- **RB-003**: cada documento sincronizável tem ID estável independente de caminho, posição e título; o vínculo com o arquivo relativo é uma projeção local e pode ser refeito.
- **RB-004**: nenhum conflito pode apagar silenciosamente uma alteração; a política automática só resolve alterações independentes e conserva divergências materiais para revisão.
- **RB-005**: relay público da comunidade serve apenas para experimento; produção exige endpoint próprio ou outro transporte controlado, com TLS e autenticação/política de acesso fora do conteúdo autoral.
- **RB-006**: credenciais de relay e chaves de dispositivo ficam em armazenamento seguro do aparelho e nunca são exportadas, sincronizadas ou gravadas nos arquivos do workspace.
- **RB-007**: apagar, revogar ou desconectar um peer interrompe novos envios sem remover o conteúdo autoral local nem invalidar a leitura offline.

## Critérios de aceitação

- **AC-001 — trabalho offline**: Dado um workspace aberto sem rede, quando a pessoa cria ou edita uma nota, então a alteração é persistida localmente, pode ser lida após reinício e não depende de relay.
- **AC-002 — convergência**: Dadas duas réplicas do mesmo documento com alterações concorrentes independentes, quando elas reconectam pelo transporte configurado, então ambas recebem o conjunto de mudanças e convergem para o mesmo estado lógico sem perda silenciosa.
- **AC-003 — isolamento portátil**: Dado um documento sincronizável, quando a operação prepara o payload de sync, então ele contém ID/estado CRDT e metadados permitidos, mas não contém path, handle, catálogo, `.openbible/index.sqlite`, cache, credencial ou segredo.
- **AC-004 — fonte autoral preservada**: Dado um estado CRDT sincronizado em outro aparelho, quando a réplica materializa o workspace, então Markdown/JSON continuam abrindo sem o índice e o índice local pode ser reconstruído.
- **AC-005 — conflito externo**: Dadas mudanças locais e uma edição externa concorrente no mesmo arquivo, quando a reconciliação não puder provar equivalência, então nenhuma versão é sobrescrita silenciosamente e a pessoa recebe um estado recuperável para decidir.
- **AC-006 — relay opcional**: Dado endpoint ausente, inválido ou indisponível, quando a pessoa abre o workspace, então o app mantém leitura e edição locais, mostra o estado da conexão e permite tentar novamente ou remover o endpoint.
- **AC-007 — revogação**: Dado um peer autorizado anteriormente, quando a pessoa o revoga, então novas mensagens desse peer são rejeitadas, os arquivos locais permanecem intactos e o evento fica registrado sem conteúdo sensível.
- **AC-008 — escopo do workspace**: Dado dois workspaces locais, quando apenas um é habilitado para sincronização, então documentos, estados CRDT e configuração de transporte do outro não são enviados nem misturados.

## Qualidades e operação

- Segurança: validar esquema e tamanho das mensagens, limitar documentos/peers autorizados, rejeitar payloads malformados e manter credenciais fora do workspace.
- Privacidade: sincronização é opt-in por workspace/documento; o relay recebe somente o protocolo/estado autorizado e não é tratado como backup ou fonte exclusiva.
- Desempenho e volume: sincronizar deltas por documento, controlar fila/backpressure e compactar/descartar histórico somente mediante política que preserve a recuperação local; o primeiro alvo é 1.000 notas e 10.000 sidecars sem carregar todos os documentos na memória.
- Auditoria e observabilidade: registrar localmente estado de conexão, último sync, bytes/deltas, falhas, conflitos, retry e revogação sem registrar texto autoral, tokens ou paths absolutos.

## Dependências

- `SPEC-0016` — múltiplos workspaces, IDs e isolamento por dispositivo.
- `SPEC-0017` — Markdown/JSON autorais, sidecars, IDs estáveis e índice SQLite reconstruível.
- `SPEC-0018` — backup/restauração sem transportar estado local, handles ou índice como fonte.
- `apps/web` Svelte/TypeScript e adaptadores `WorkspaceStorage` para PWA/Tauri.
- Pacotes Automerge compatíveis com o runtime, a selecionar na implementação após validar versões e adapter de storage.

## Situações de erro

- Workspace indisponível, permissão revogada ou quota esgotada → conservar a última cópia funcional, suspender sync e permitir recuperação local.
- Relay sem TLS, autenticação inválida, timeout ou protocolo incompatível → não enviar conteúdo, marcar conexão indisponível e oferecer configuração/remoção.
- Payload desconhecido, grande demais, malformado ou de outro workspace → rejeitar isoladamente, registrar diagnóstico sem conteúdo e manter demais documentos utilizáveis.
- Divergência externa, arquivo removido/renomeado ou escrita concorrente → não sobrescrever silenciosamente; preservar cópias/estado e apresentar reconciliação.
- Falha de compactação ou reconstrução da projeção → manter estado CRDT e fontes portáteis; indexar novamente depois, sem bloquear a leitura.

## Escopo

- Dentro: modelo de documentos e IDs; mapeamento documento↔arquivo; storage local por backend; fila/delta e reconexão; adaptador local; relay WebSocket configurável; autorização/revogação; bridge de edição externa; diagnósticos e interface mínima de configuração; exclusões normativas.
- Fora: serviço OpenBible obrigatório, conta/login, cobrança, servidor multitenant pronto para produção, sincronização de `index.sqlite`, catálogo/paths/handles, credenciais, Bíblias imutáveis, merge visual completo de Markdown, WebRTC/Bluetooth e implementação nesta etapa.

## Dúvidas, decisões e riscos

- Decisão: Automerge é estado operacional de replicação, não substitui Markdown/JSON nem o backup portátil.
- Decisão: transporte agnóstico com adaptadores; WebSocket relay próprio é o primeiro transporte remoto previsto.
- Decisão: PWA e Tauri compartilham o contrato de domínio, mas podem ter adapters de storage diferentes; nenhum processo local obrigatório no PWA.
- Decisão: o documento CRDT será por unidade autoral estável; a estratégia de granularidade deve evitar um documento gigante para o workspace inteiro.
- Risco: alterações simultâneas no mesmo texto Markdown podem exigir bridge e revisão explícita; convergência do estado CRDT não garante merge semântico perfeito do texto renderizado.
- Risco: histórico CRDT crescerá; compactação, retenção e recuperação devem ser observáveis e nunca eliminar a única cópia portátil.
- Risco: relay próprio requer operação, TLS, autenticação e política de retenção; isso é uma implantação posterior, não dependência para uso local.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify` e consolidar a spec Draft normativa, mantendo `Definition Gate: Pending` até a revisão do agente principal.
